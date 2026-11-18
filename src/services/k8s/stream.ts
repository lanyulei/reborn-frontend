/**
 * 容器平台流式接口（SSE）：POST + JSON 请求体，fetch 读取事件流（同智能助手对话的做法）。
 * 令牌由 ensureFreshToken 预刷新；非 2xx 抛出带 reason 的 K8sStreamError。
 */
import { XStream } from '@ant-design/x-sdk';
import { ensureFreshToken, redirectToLogin } from '@/services/system/request';
import { getAccessToken } from '@/utils/auth';
import {
  announceSubmitted,
  CHANGE_SUBMITTED,
  emergencyHeaders,
} from './approval';
import { clusterPath } from './request';

export class K8sStreamError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(status: number, reason: string, message: string) {
    super(message);
    this.name = 'K8sStreamError';
    this.status = status;
    this.reason = reason;
  }
}

export interface StreamEvent {
  event: string;
  /** SSE id 行（日志的续接游标） */
  id?: string;
  data: unknown;
}

export type StreamPath = '/watch' | '/pod/log' | '/workload/log' | '/node:drain';

/**
 * 打开一条事件流并逐个回调事件；流自然结束时 resolve，出错或被中止时 reject
 * （中止时为 AbortError）。ping 事件已过滤。
 */
export async function openStream(
  clusterId: string,
  path: StreamPath,
  body: object,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!(await ensureFreshToken())) {
    redirectToLogin();
    throw new K8sStreamError(401, 'TOKEN_INVALID', 'unauthenticated');
  }
  const response = await fetch(clusterPath(clusterId, path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${getAccessToken() ?? ''}`,
      ...emergencyHeaders(clusterPath(clusterId, path)),
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    let reason = String(response.status);
    let message = response.statusText;
    try {
      const err = (await response.json()) as {
        reason?: string;
        message?: string;
        metadata?: Record<string, string>;
      };
      reason = err.reason ?? reason;
      message = err.message ?? message;
      // 排空等写操作在需审批的集群上被转为变更单（不是失败）
      if (reason === CHANGE_SUBMITTED) announceSubmitted(err.metadata);
    } catch {
      // 非 JSON 错误体：保留状态文案
    }
    if (response.status === 401) redirectToLogin();
    throw new K8sStreamError(response.status, reason, message);
  }
  if (!response.body) {
    throw new K8sStreamError(0, 'NO_BODY', 'empty response body');
  }
  for await (const chunk of XStream({ readableStream: response.body })) {
    if (!chunk.event || chunk.event === 'ping' || chunk.data === undefined) {
      continue;
    }
    let data: unknown;
    try {
      data = JSON.parse(String(chunk.data));
    } catch {
      continue;
    }
    onEvent({
      event: String(chunk.event),
      id: chunk.id === undefined ? undefined : String(chunk.id),
      data,
    });
  }
}

/** 中止导致的异常（组件卸载 / 主动停止），调用方据此区分是否需要重连 */
export const isAbortError = (error: unknown): boolean =>
  (error as { name?: string } | undefined)?.name === 'AbortError';

/** 这些错误重连无益：权限不足、对象不存在、参数不合法、并发超限 */
export const isFatalStreamError = (error: unknown): boolean => {
  const status = (error as K8sStreamError | undefined)?.status;
  return (
    status !== undefined &&
    status >= 400 &&
    status < 500 &&
    status !== 408 &&
    status !== 421
  );
};

/** 终端 WebSocket 地址（票据即凭据） */
export const execSocketUrl = (ticket: string): string => {
  const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${window.location.host}/api/v1/k8s/exec?ticket=${encodeURIComponent(ticket)}`;
};
