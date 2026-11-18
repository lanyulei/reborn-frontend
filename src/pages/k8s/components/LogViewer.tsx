/**
 * 实时日志：Pod 日志或工作负载级日志（同时跟随多个 Pod，每行标明来源）。
 * 连接中断或到达单连接时长上限后自动续接：每行日志事件带游标（SSE id），续接时带上最后一个游标，
 * 服务端从该位置之后继续，不丢行也不重复。
 *
 * 渲染：按行分块（每块 200 行，写满即不可变，不再重渲染），只保留最近 1 万行。
 */
import {
  ClearOutlined,
  DownloadOutlined,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import { Alert, Button, Flex, Input, Select, Switch, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getK8sErrorMessage } from '@/services/k8s/request';
import type { LogLine, LogPods, ResourceRef } from '@/services/k8s/typings';
import { saveBlob } from '@/utils/download';
import { useT } from '@/utils/i18n';
import { keepStream, type StreamState } from './stream';
import { useK8sStyles } from './styles';

const CHUNK_LINES = 200;
/** 至多保留的块数（50 × 200 = 1 万行） */
const MAX_CHUNKS = 50;
const BOTTOM_SLACK_PX = 24;
const TAIL_OPTIONS = [100, 500, 1000, 5000];
// biome-ignore lint/suspicious/noControlCharactersInRegex: 去掉终端颜色控制序列
const ANSI_REGEX = /\u001b\[[0-9;]*[A-Za-z]/g;

interface Chunk {
  id: number;
  lines: LogLine[];
}

interface Buffer {
  chunks: Chunk[];
  dropped: number;
}

const EMPTY: Buffer = { chunks: [], dropped: 0 };

/** 追加若干行：只新建最后一块与新增的块，写满的块保持原引用 */
const append = (buffer: Buffer, lines: LogLine[]): Buffer => {
  if (lines.length === 0) return buffer;
  const chunks = [...buffer.chunks];
  let dropped = buffer.dropped;
  let rest = lines;
  const last = chunks[chunks.length - 1];
  if (last && last.lines.length < CHUNK_LINES) {
    const room = CHUNK_LINES - last.lines.length;
    chunks[chunks.length - 1] = {
      id: last.id,
      lines: [...last.lines, ...rest.slice(0, room)],
    };
    rest = rest.slice(room);
  }
  let nextId = (chunks[chunks.length - 1]?.id ?? -1) + 1;
  for (let i = 0; i < rest.length; i += CHUNK_LINES) {
    chunks.push({ id: nextId, lines: rest.slice(i, i + CHUNK_LINES) });
    nextId += 1;
  }
  while (chunks.length > MAX_CHUNKS) {
    dropped += chunks.shift()?.lines.length ?? 0;
  }
  return { chunks, dropped };
};

interface LineClasses {
  line: string;
  source: string;
  mark: string;
}

const LineView: React.FC<{
  line: LogLine;
  classes: LineClasses;
  showSource: boolean;
  showTime: boolean;
  keyword: string;
}> = ({ line, classes, showSource, showTime, keyword }) => {
  const text = line.text.replace(ANSI_REGEX, '');
  let body: React.ReactNode = text;
  const at = keyword ? text.toLowerCase().indexOf(keyword.toLowerCase()) : -1;
  if (at >= 0) {
    body = (
      <>
        {text.slice(0, at)}
        <span className={classes.mark}>
          {text.slice(at, at + keyword.length)}
        </span>
        {text.slice(at + keyword.length)}
      </>
    );
  }
  return (
    <div className={classes.line}>
      {showTime && (
        <span className={classes.source}>
          {dayjs(line.time).format('MM-DD HH:mm:ss.SSS')}
        </span>
      )}
      {showSource && line.pod && (
        <span className={classes.source}>[{line.pod}]</span>
      )}
      {body}
      {line.truncated ? ' …' : ''}
    </div>
  );
};

const ChunkView = memo<{
  lines: LogLine[];
  classes: LineClasses;
  showSource: boolean;
  showTime: boolean;
  keyword: string;
}>(({ lines, ...rest }) => (
  <>
    {lines.map((line, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: 块内的行只追加、不重排
      <LineView key={index} line={line} {...rest} />
    ))}
  </>
));

export interface LogContainer {
  name: string;
  init?: boolean;
}

export type LogTarget =
  | {
      mode: 'pod';
      namespace: string;
      pod: string;
      containers: LogContainer[];
    }
  | {
      mode: 'workload';
      ref: ResourceRef;
      containers: LogContainer[];
    };

export const LogViewer: React.FC<{
  clusterId: string;
  target: LogTarget;
  /** 日志区高度；缺省随视口 */
  height?: number | string;
}> = ({ clusterId, target, height = 'calc(100vh - 320px)' }) => {
  const t = useT();
  const { styles, cx } = useK8sStyles();
  const [container, setContainer] = useState(target.containers[0]?.name ?? '');
  const [previous, setPrevious] = useState(false);
  const [tail, setTail] = useState(500);
  const [keyword, setKeyword] = useState('');
  const [wrap, setWrap] = useState(true);
  const [showTime, setShowTime] = useState(false);
  const [follow, setFollow] = useState(true);
  const [buffer, setBuffer] = useState<Buffer>(EMPTY);
  const [state, setState] = useState<StreamState>('connecting');
  const [error, setError] = useState<string>();
  const [pods, setPods] = useState<LogPods>();
  const [epoch, setEpoch] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const followRef = useRef(follow);
  followRef.current = follow;

  const isPod = target.mode === 'pod';
  const targetKey =
    target.mode === 'pod'
      ? `${target.namespace}/${target.pod}`
      : `${target.ref.resource}/${target.ref.namespace}/${target.ref.name}`;

  useEffect(() => {
    setBuffer(EMPTY);
    setError(undefined);
    setPods(undefined);
    // 续接游标：Pod 日志一个；工作负载级日志每个 Pod 一个
    let cursor = '';
    const cursors: Record<string, string> = {};
    let pending: LogLine[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      timer = undefined;
      const lines = pending;
      pending = [];
      setBuffer((prev) => append(prev, lines));
    };

    const common = {
      container: container || undefined,
      tailLines: tail,
      keyword: keyword || undefined,
    };
    const stop = keepStream({
      clusterId,
      path: target.mode === 'pod' ? '/pod/log' : '/workload/log',
      body: () =>
        target.mode === 'pod'
          ? {
              namespace: target.namespace,
              pod: target.pod,
              previous,
              follow: !previous,
              cursor: cursor || undefined,
              ...common,
            }
          : { ref: target.ref, cursors, ...common },
      onEvent: (event) => {
        if (event.event === 'pods') {
          setPods(event.data as LogPods);
          return;
        }
        if (event.event !== 'log') return;
        const line = event.data as LogLine;
        if (event.id) {
          if (target.mode === 'pod') cursor = event.id;
          else if (line.pod) cursors[line.pod] = event.id;
        }
        pending.push(line);
        // 合并 100ms 内到达的行，避免高频重渲染
        timer ??= setTimeout(flush, 100);
      },
      onState: (next, detail) => {
        setState(next);
        if (next === 'open' || next === 'ended') setError(undefined);
        else if (detail?.error) setError(getK8sErrorMessage(detail.error));
      },
    });
    return () => {
      stop();
      if (timer) clearTimeout(timer);
    };
  }, [clusterId, targetKey, container, previous, tail, keyword, epoch]);

  useLayoutEffect(() => {
    const el = panel.current;
    if (el && followRef.current && buffer.chunks.length > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [buffer]);

  const classes = useMemo<LineClasses>(
    () => ({
      line: styles.logLine,
      source: styles.logSource,
      mark: styles.logMark,
    }),
    [styles],
  );

  const download = () => {
    const text = buffer.chunks
      .flatMap((chunk) => chunk.lines)
      .map(
        (line) =>
          `${line.time} ${line.pod ? `[${line.pod}] ` : ''}${line.text.replace(ANSI_REGEX, '')}`,
      )
      .join('\n');
    const name = isPod ? target.pod : (target.ref.name ?? 'workload');
    saveBlob(
      new Blob([text], { type: 'text/plain;charset=utf-8' }),
      `${name}${container ? `-${container}` : ''}.log`,
    );
  };

  const empty = buffer.chunks.length === 0;

  return (
    <div>
      <Flex gap={12} wrap align="center" style={{ marginBottom: 12 }}>
        {target.containers.length > 0 && (
          <Select
            style={{ width: 200 }}
            value={container}
            onChange={setContainer}
            options={target.containers.map((item) => ({
              value: item.name,
              label: item.init
                ? `${item.name}（${t('pages.k8s.log.initContainer')}）`
                : item.name,
            }))}
          />
        )}
        <Select
          style={{ width: 130 }}
          value={tail}
          onChange={setTail}
          options={TAIL_OPTIONS.map((n) => ({
            value: n,
            label: t('pages.k8s.log.tail', { n }),
          }))}
        />
        <Input.Search
          allowClear
          style={{ width: 220 }}
          placeholder={t('pages.k8s.log.keyword')}
          maxLength={256}
          onSearch={(value) => setKeyword(value.trim())}
        />
        {isPod && (
          <span>
            <Switch size="small" checked={previous} onChange={setPrevious} />{' '}
            {t('pages.k8s.log.previous')}
          </span>
        )}
        <span>
          <Switch size="small" checked={wrap} onChange={setWrap} />{' '}
          {t('pages.k8s.log.wrap')}
        </span>
        <span>
          <Switch size="small" checked={showTime} onChange={setShowTime} />{' '}
          {t('pages.k8s.log.time')}
        </span>
        <span>
          <Switch size="small" checked={follow} onChange={setFollow} />{' '}
          {t('pages.k8s.log.follow')}
        </span>
        <span style={{ flex: 1 }} />
        <Tag
          color={
            state === 'open'
              ? 'success'
              : state === 'failed'
                ? 'error'
                : state === 'ended'
                  ? 'default'
                  : 'processing'
          }
        >
          {t(`pages.k8s.stream.${state}`)}
        </Tag>
        <Tooltip title={t('pages.k8s.log.toBottom')}>
          <Button
            icon={<VerticalAlignBottomOutlined />}
            onClick={() => {
              setFollow(true);
              if (panel.current) {
                panel.current.scrollTop = panel.current.scrollHeight;
              }
            }}
          />
        </Tooltip>
        <Tooltip title={t('pages.k8s.log.clear')}>
          <Button icon={<ClearOutlined />} onClick={() => setBuffer(EMPTY)} />
        </Tooltip>
        <Tooltip title={t('pages.k8s.log.download')}>
          <Button
            icon={<DownloadOutlined />}
            disabled={empty}
            onClick={download}
          />
        </Tooltip>
      </Flex>
      {error && (
        <Alert
          type={state === 'failed' ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: 12 }}
          title={
            state === 'failed'
              ? error
              : t('pages.k8s.stream.retryHint', { error })
          }
          action={
            state === 'failed' ? (
              <Button size="small" onClick={() => setEpoch((n) => n + 1)}>
                {t('pages.k8s.stream.reconnect')}
              </Button>
            ) : undefined
          }
        />
      )}
      {pods && pods.omitted > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          title={t('pages.k8s.log.omitted', {
            shown: pods.pods?.length ?? 0,
            omitted: pods.omitted,
          })}
        />
      )}
      <div
        ref={panel}
        className={cx(
          styles.logPanel,
          wrap ? styles.logWrap : styles.logNoWrap,
        )}
        style={{ height }}
        onScroll={(event) => {
          const el = event.currentTarget;
          const atBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLACK_PX;
          // 用户向上滚动即暂停跟随；回到底部恢复
          if (atBottom !== followRef.current) setFollow(atBottom);
        }}
      >
        {buffer.dropped > 0 && (
          <div className={styles.logNotice}>
            {t('pages.k8s.log.dropped', { n: buffer.dropped })}
          </div>
        )}
        {empty && (
          <div className={styles.logNotice}>
            {t(
              state === 'ended' || state === 'open'
                ? 'pages.k8s.log.empty'
                : 'pages.k8s.log.waiting',
            )}
          </div>
        )}
        {buffer.chunks.map((chunk) => (
          <ChunkView
            key={chunk.id}
            lines={chunk.lines}
            classes={classes}
            showSource={!isPod}
            showTime={showTime}
            keyword={keyword}
          />
        ))}
      </div>
    </div>
  );
};
