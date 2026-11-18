/**
 * 保持一条事件流存活：连接断开或到达单连接时长上限后自动重连（退避），直到流正常结束、
 * 遇到重连无益的错误，或被调用方停止。请求体在每次（重）连接时重新生成，调用方借此带上续接游标。
 */
import {
  isAbortError,
  isFatalStreamError,
  openStream,
  type StreamEvent,
  type StreamPath,
} from '@/services/k8s/stream';
import type { StreamEnd } from '@/services/k8s/typings';

export type StreamState =
  | 'connecting'
  | 'open'
  | 'retrying'
  | 'ended'
  | 'failed';

export interface KeepStreamOptions {
  clusterId: string;
  path: StreamPath;
  /** 每次（重）连接时调用，返回请求体 */
  body: () => object;
  /** end 之外的事件 */
  onEvent: (event: StreamEvent) => void;
  /** 状态变化；failed / retrying 时带错误，ended 时带结束事件 */
  onState?: (
    state: StreamState,
    detail?: { error?: unknown; end?: StreamEnd },
  ) => void;
  /**
   * false = 绝不重新发起请求（用于有副作用的流，如排空）：任何中断（含到达单连接时长上限）
   * 都以 retrying 状态通知一次后停止，由调用方提示用户。
   */
  reconnect?: boolean;
}

const BACKOFF_MS = [1000, 2000, 4000, 8000, 15_000];

/** 启动并返回停止函数 */
export function keepStream(options: KeepStreamOptions): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });

  const run = async () => {
    let failures = 0;
    while (!signal.aborted) {
      let end: StreamEnd | undefined;
      let received = false;
      options.onState?.(failures > 0 ? 'retrying' : 'connecting');
      try {
        await openStream(
          options.clusterId,
          options.path,
          options.body(),
          (event) => {
            if (signal.aborted) return;
            if (!received) {
              received = true;
              options.onState?.('open');
            }
            if (event.event === 'end') {
              end = event.data as StreamEnd;
              return;
            }
            options.onEvent(event);
          },
          signal,
        );
      } catch (error) {
        if (signal.aborted || isAbortError(error)) return;
        if (isFatalStreamError(error)) {
          options.onState?.('failed', { error });
          return;
        }
        failures = received ? 1 : failures + 1;
        options.onState?.('retrying', { error });
        if (options.reconnect === false) return;
        await wait(BACKOFF_MS[Math.min(failures, BACKOFF_MS.length) - 1]);
        continue;
      }
      if (signal.aborted) return;
      if (end?.reason === 'completed') {
        options.onState?.('ended', { end });
        return;
      }
      if (end?.reason === 'max_duration' && options.reconnect !== false) {
        // 到达单连接时长上限：立即续接
        failures = 0;
        continue;
      }
      // 服务端报错结束，或连接无声断开：退避后续接
      failures = received && !end ? 1 : failures + 1;
      options.onState?.('retrying', {
        error:
          end && end.reason !== 'max_duration'
            ? new Error(end.message || end.reason)
            : undefined,
      });
      if (options.reconnect === false) return;
      await wait(BACKOFF_MS[Math.min(failures, BACKOFF_MS.length) - 1]);
    }
  };

  void run();
  return () => controller.abort();
}
