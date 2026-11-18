/**
 * Web 终端：多个会话以页签并存于底部面板。
 * 建连：先取一次性票据（POST exec-ticket），再凭票据建立 WebSocket。帧格式为二进制，首字节是类型
 * （0 输入 / 1 输出 / 2 窗口大小 JSON / 3 状态 JSON / 4 心跳）。
 * 断线续接：连接意外断开后，带上会话 ID 重新取票据接回原会话（服务端保留会话约 60 秒并回放期间的输出）；
 * 收到 closed 状态后不再重连。
 */
import { CodeOutlined } from '@ant-design/icons';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTerm } from '@xterm/xterm';
import { Badge, Drawer, Tabs, Tag } from 'antd';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '@xterm/xterm/css/xterm.css';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { openExecTicket } from '@/services/k8s/resource';
import { execSocketUrl } from '@/services/k8s/stream';
import type { ExecStatus } from '@/services/k8s/typings';
import { type Translate, useT } from '@/utils/i18n';
import { useClusterName, useIsProd } from './scope';
import { TERMINAL, useK8sStyles } from './styles';

const FRAME_INPUT = 0;
const FRAME_OUTPUT = 1;
const FRAME_RESIZE = 2;
const FRAME_STATUS = 3;
const FRAME_PING = 4;

const PING_MS = 20_000;
/** 续接的重试间隔；合计约 60 秒，与服务端保留会话的时长一致 */
const RESUME_BACKOFF_MS = [500, 1000, 2000, 4000, 8000, 10_000, 15_000, 20_000];
const PANEL_HEIGHT = 440;

export interface TerminalTarget {
  clusterId: string;
  namespace: string;
  pod: string;
  container?: string;
  /** 调试容器：在 Pod 里启动一个临时容器并进入（目标容器没有 shell 时使用） */
  debug?: boolean;
  /** 集群名称与是否生产环境：页签与终端首行据此标明会话所在的集群（由 useTerminal 自动补齐） */
  clusterName?: string;
  prod?: boolean;
}

/** 去掉控制字符：服务端 / 集群返回的文本写进终端前必须清理，避免被当成转义序列执行 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: 这里就是要匹配控制字符
const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;
const plain = (text: string): string => text.replace(CONTROL_CHARS, ' ');

/** 会话位置的文字描述：集群 / 命名空间 / Pod / 容器 */
const whereOf = (target: TerminalTarget): string =>
  [
    target.clusterName || target.clusterId,
    target.namespace,
    target.pod,
    target.container,
  ]
    .filter(Boolean)
    .join(' / ');

type SessionState = 'connecting' | 'open' | 'resuming' | 'closed';

const encoder = new TextEncoder();

const frame = (type: number, payload?: Uint8Array): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(1 + (payload?.length ?? 0));
  out[0] = type;
  if (payload) out.set(payload, 1);
  return out;
};

const END_REASON_ID: Record<string, string> = {
  client_close: 'pages.k8s.exec.end.clientClose',
  idle_timeout: 'pages.k8s.exec.end.idleTimeout',
  max_duration: 'pages.k8s.exec.end.maxDuration',
  detach_timeout: 'pages.k8s.exec.end.detachTimeout',
  container_exit: 'pages.k8s.exec.end.containerExit',
  shutdown: 'pages.k8s.exec.end.shutdown',
  error: 'pages.k8s.exec.end.error',
};

const TerminalSession: React.FC<{
  target: TerminalTarget;
  active: boolean;
  onState: (state: SessionState) => void;
}> = ({ target, active, onState }) => {
  const t = useT();
  const { styles } = useK8sStyles();
  const host = useRef<HTMLDivElement>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const tRef = useRef<Translate>(t);
  tRef.current = t;
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    if (!host.current) return;
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      scrollback: 5000,
      theme: { background: TERMINAL.bg, foreground: TERMINAL.text },
    });
    const fit = new FitAddon();
    fitRef.current = fit;
    term.loadAddon(fit);
    term.open(host.current);
    fit.fit();

    let disposed = false;
    let socket: WebSocket | null = null;
    let sessionId = '';
    let ended = false;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    const notice = (text: string) =>
      term.write(`\r\n\x1b[90m${plain(text)}\x1b[0m\r\n`);
    // 首行标明会话所在的集群与命名空间：不同集群里同名的 Pod 不至于混淆
    term.write(
      `\x1b[${target.prod ? '1;31' : '90'}m${plain(
        `${target.prod ? `[${tRef.current('pages.k8s.exec.prod')}] ` : ''}${whereOf(target)}`,
      )}\x1b[0m\r\n`,
    );
    const setState = (state: SessionState) => onStateRef.current(state);
    const send = (data: Uint8Array<ArrayBuffer>) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(data);
    };
    const sendResize = () =>
      send(
        frame(
          FRAME_RESIZE,
          encoder.encode(JSON.stringify({ cols: term.cols, rows: term.rows })),
        ),
      );
    const finish = (text: string) => {
      ended = true;
      setState('closed');
      notice(text);
    };

    const scheduleResume = () => {
      if (disposed || ended) return;
      if (!sessionId || attempts >= RESUME_BACKOFF_MS.length) {
        finish(tRef.current('pages.k8s.exec.lost'));
        return;
      }
      setState('resuming');
      if (attempts === 0) notice(tRef.current('pages.k8s.exec.resuming'));
      retryTimer = setTimeout(connect, RESUME_BACKOFF_MS[attempts]);
      attempts += 1;
    };

    const onStatus = (status: ExecStatus) => {
      if (status.state === 'ready') {
        sessionId = status.sessionId ?? sessionId;
        attempts = 0;
        setState('open');
      } else if (status.state === 'resumed') {
        attempts = 0;
        setState('open');
        notice(tRef.current('pages.k8s.exec.resumed'));
      } else if (status.state === 'closed') {
        const id = END_REASON_ID[status.reason ?? ''];
        finish(
          `${tRef.current('pages.k8s.exec.closed')}${id ? `：${tRef.current(id)}` : ''}${
            status.message ? `（${status.message}）` : ''
          }`,
        );
      }
    };

    async function connect() {
      if (disposed || ended) return;
      let ticket: string;
      try {
        ({ ticket } = await openExecTicket(target.clusterId, {
          namespace: target.namespace,
          pod: target.pod,
          container: target.container || undefined,
          sessionId: sessionId || undefined,
          kind: target.debug ? 2 : undefined,
          cols: term.cols,
          rows: term.rows,
        }));
      } catch (error) {
        if (disposed) return;
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        // 4xx：权限不足、终端被禁用、并发超限等，重试无益
        if (status !== undefined && status >= 400 && status < 500) {
          finish(getK8sErrorMessage(error));
        } else if (sessionId) {
          scheduleResume();
        } else {
          finish(getK8sErrorMessage(error));
        }
        return;
      }
      if (disposed) return;
      const ws = new WebSocket(execSocketUrl(ticket));
      ws.binaryType = 'arraybuffer';
      socket = ws;
      ws.onopen = () => {
        sendResize();
        pingTimer = setInterval(() => send(frame(FRAME_PING)), PING_MS);
      };
      ws.onmessage = (event) => {
        if (!(event.data instanceof ArrayBuffer)) return;
        const data = new Uint8Array(event.data);
        if (data.length === 0) return;
        const payload = data.subarray(1);
        if (data[0] === FRAME_OUTPUT) {
          term.write(payload);
        } else if (data[0] === FRAME_STATUS) {
          try {
            onStatus(
              JSON.parse(new TextDecoder().decode(payload)) as ExecStatus,
            );
          } catch {
            // 无法解析的状态帧：忽略
          }
        }
      };
      ws.onclose = () => {
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = undefined;
        if (socket === ws) socket = null;
        scheduleResume();
      };
    }

    setState('connecting');
    void connect();

    const dataSub = term.onData((data) =>
      send(frame(FRAME_INPUT, encoder.encode(data))),
    );
    const resizeSub = term.onResize(sendResize);
    const observer = new ResizeObserver(() => {
      // 面板隐藏时容器尺寸为 0，此时不调整（否则终端被缩成 1 列）
      if (host.current && host.current.clientWidth > 0) fit.fit();
    });
    observer.observe(host.current);

    return () => {
      disposed = true;
      observer.disconnect();
      dataSub.dispose();
      resizeSub.dispose();
      if (retryTimer) clearTimeout(retryTimer);
      if (pingTimer) clearInterval(pingTimer);
      if (socket) {
        // 先摘掉回调：close 之后仍可能有消息 / 关闭事件到达，不能再写已销毁的终端
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.close(1000);
      }
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (active) fitRef.current?.fit();
  }, [active]);

  return (
    <div className={styles.termBox} style={{ height: PANEL_HEIGHT - 110 }}>
      <div ref={host} style={{ height: '100%' }} />
    </div>
  );
};

interface Session {
  key: string;
  target: TerminalTarget;
  state: SessionState;
}

interface TerminalApi {
  /** 打开一个到指定容器的终端会话 */
  open: (target: TerminalTarget) => void;
}

const TerminalContext = createContext<TerminalApi>({ open: () => undefined });

/** 打开终端的入口；自动带上当前页面的集群名称与是否生产环境 */
export const useTerminal = (): TerminalApi => {
  const base = useContext(TerminalContext);
  const clusterName = useClusterName();
  const prod = useIsProd();
  return useMemo(
    () => ({
      open: (target) =>
        base.open({
          ...target,
          clusterName: target.clusterName ?? clusterName,
          prod: target.prod ?? prod,
        }),
    }),
    [base, clusterName, prod],
  );
};

const STATE_BADGE: Record<
  SessionState,
  'processing' | 'success' | 'warning' | 'default'
> = {
  connecting: 'processing',
  open: 'success',
  resuming: 'warning',
  closed: 'default',
};

/**
 * 终端面板的宿主：挂在 /k8s 路由的布局上（见 pages/k8s/layout.tsx），所以会话在切换集群 / 命名空间、
 * 在容器平台各菜单间跳转、收起面板时都保持连接；关闭页签或离开容器平台才结束会话。
 */
export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const t = useT();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeKey, setActiveKey] = useState<string>();
  const [visible, setVisible] = useState(false);
  const seq = useRef(0);

  const open = useCallback((target: TerminalTarget) => {
    seq.current += 1;
    const key = `s${seq.current}`;
    setSessions((prev) => [...prev, { key, target, state: 'connecting' }]);
    setActiveKey(key);
    setVisible(true);
  }, []);
  const api = useMemo(() => ({ open }), [open]);

  const remove = (key: string) => {
    setSessions((prev) => {
      const next = prev.filter((session) => session.key !== key);
      if (next.length === 0) setVisible(false);
      else if (key === activeKey) setActiveKey(next[next.length - 1].key);
      return next;
    });
  };

  const setState = useCallback((key: string, state: SessionState) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.key === key ? { ...session, state } : session,
      ),
    );
  }, []);

  return (
    <TerminalContext.Provider value={api}>
      {children}
      {sessions.length > 0 && !visible && (
        <a
          style={{ position: 'fixed', right: 24, bottom: 88, zIndex: 1100 }}
          onClick={() => setVisible(true)}
        >
          <Badge count={sessions.length} size="small">
            <CodeOutlined style={{ fontSize: 24 }} />
          </Badge>
        </a>
      )}
      <Drawer
        title={t('pages.k8s.exec.title')}
        placement="bottom"
        size={PANEL_HEIGHT}
        open={visible}
        mask={false}
        forceRender
        zIndex={1100}
        onClose={() => setVisible(false)}
        styles={{ body: { padding: '0 16px 12px' } }}
      >
        <Tabs
          type="editable-card"
          hideAdd
          size="small"
          activeKey={activeKey}
          onChange={setActiveKey}
          onEdit={(key, action) => {
            if (action === 'remove' && typeof key === 'string') remove(key);
          }}
          items={sessions.map((session) => ({
            key: session.key,
            // 隐藏的页签保持挂载：会话不因切换页签而断开
            forceRender: true,
            label: (
              <span>
                <Badge status={STATE_BADGE[session.state]} />{' '}
                {session.target.prod && (
                  <Tag color="error" style={{ marginInlineEnd: 4 }}>
                    {t('pages.k8s.exec.prod')}
                  </Tag>
                )}
                {session.target.debug ? `${t('pages.k8s.exec.debug')} · ` : ''}
                {whereOf(session.target)}
              </span>
            ),
            children: (
              <TerminalSession
                target={session.target}
                active={visible && session.key === activeKey}
                onState={(state) => setState(session.key, state)}
              />
            ),
          }))}
        />
      </Drawer>
    </TerminalContext.Provider>
  );
};
