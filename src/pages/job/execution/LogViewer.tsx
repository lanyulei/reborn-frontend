/**
 * 执行日志（终端式）：增量轮询 GetJobExecutionLog——从 afterSeq=0 开始，带上次的 lastSeq 续取；
 * more 为真立即再取，否则执行未结束时每 1.5 秒取一次；状态进入终态且没有新内容即读完。
 * 出错按退避重试；页面不可见时暂停，卸载时停止。
 *
 * 大日志保持流畅：日志按行分块（每块 200 行，写满即不可变，对应的组件不再重渲染），DOM 里只保留
 * 最后 5000 行；完整内容留在内存里供复制 / 下载。
 */
import {
  CopyOutlined,
  DownloadOutlined,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Flex, Spin, Switch } from 'antd';
import type React from 'react';
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getJobExecutionLog } from '@/services/job/execution';
import { getErrorStatus, getJobErrorMessage } from '@/services/job/request';
import { saveBlob } from '@/utils/download';
import { useT } from '@/utils/i18n';
import { usePageVisible } from '../components/hooks';
import { isActiveStatus } from '../components/meta';
import { useJobStyles } from '../components/styles';

const POLL_MS = 1500;
const BACKOFF_MAX_MS = 15_000;
const CHUNK_LINES = 200;
/** DOM 里至多保留的块数（25 × 200 = 5000 行） */
const MAX_CHUNKS = 25;
/** 距底部多少像素以内算「在底部」 */
const BOTTOM_SLACK_PX = 24;
// biome-ignore lint/suspicious/noControlCharactersInRegex: 去掉终端颜色控制序列
const ANSI_REGEX = /\u001b\[[0-9;]*[A-Za-z]/g;

interface LogChunk {
  /** 块序号（从 0 递增，作 React key） */
  id: number;
  lines: string[];
}

interface LogState {
  chunks: LogChunk[];
  /** 已从 DOM 里省略的行数 */
  dropped: number;
  /** 尚未换行的末尾内容 */
  tail: string;
}

const EMPTY_LOG: LogState = { chunks: [], dropped: 0, tail: '' };

/** 追加一段日志：只新建最后一块与新增的块，写满的块保持原引用 */
const appendLog = (state: LogState, content: string): LogState => {
  const parts = (state.tail + content.replace(ANSI_REGEX, '')).split('\n');
  const tail = parts.pop() ?? '';
  if (parts.length === 0) return { ...state, tail };
  const chunks = [...state.chunks];
  let dropped = state.dropped;
  let rest = parts.map((line) => line.replace(/\r$/, ''));
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
  return { chunks, dropped, tail };
};

type LineTone = 'red' | 'yellow' | 'green' | 'cyan' | undefined;

/** 按 Ansible 输出的行首标记着色 */
const lineTone = (line: string): LineTone => {
  if (
    line.startsWith('fatal:') ||
    line.startsWith('failed:') ||
    line.includes('UNREACHABLE')
  ) {
    return 'red';
  }
  if (line.startsWith('changed:')) return 'yellow';
  if (line.startsWith('ok:')) return 'green';
  if (line.startsWith('[runner]')) return 'cyan';
  return undefined;
};

type ToneClasses = Record<NonNullable<LineTone>, string> & { line: string };

const LogLine: React.FC<{ line: string; classes: ToneClasses }> = ({
  line,
  classes,
}) => {
  const tone = lineTone(line);
  return (
    <div className={tone ? `${classes.line} ${classes[tone]}` : classes.line}>
      {line}
    </div>
  );
};

/** 一块日志；写满后 lines 引用不再变化，memo 使其不再重渲染 */
const LogChunkView = memo<{ lines: string[]; classes: ToneClasses }>(
  ({ lines, classes }) => (
    <>
      {lines.map((line, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 日志行只追加、不重排
        <LogLine key={index} line={line} classes={classes} />
      ))}
    </>
  ),
);

export const LogViewer: React.FC<{
  id: string;
  /** 执行详情给出的「日志已被截断」（与日志接口的 truncated 取或） */
  truncated?: boolean;
  /** 下载文件名（不含扩展名） */
  filename: string;
}> = ({ id, truncated, filename }) => {
  const t = useT();
  const { message } = App.useApp();
  const { styles } = useJobStyles();
  const visible = usePageVisible();

  const [log, setLog] = useState<LogState>(EMPTY_LOG);
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [logTruncated, setLogTruncated] = useState(false);
  const [follow, setFollow] = useState(true);

  /** 已取到的完整内容（复制 / 下载用） */
  const pieces = useRef<string[]>([]);
  // 执行所处的阶段：待审批 / 排队中时还没有日志，提示语不同
  const [stage, setStage] = useState<'pending' | 'queued' | 'running' | 'lost'>(
    'running',
  );
  const lastSeq = useRef('0');
  const doneRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  // 轮询：页面可见且未读完时运行；隐藏 / 卸载时停止，恢复可见后从 lastSeq 续取
  useEffect(() => {
    if (!visible || doneRef.current) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let backoff = POLL_MS;

    const finish = () => {
      doneRef.current = true;
      setDone(true);
    };

    const tick = async () => {
      const afterSeq = lastSeq.current;
      try {
        const result = await getJobExecutionLog(id, afterSeq);
        if (stopped) return;
        backoff = POLL_MS;
        setError(undefined);
        setLoaded(true);
        const nextSeq = result.lastSeq ?? afterSeq;
        lastSeq.current = nextSeq;
        const content = result.content ?? '';
        if (content) {
          pieces.current.push(content);
          setLog((prev) => appendLog(prev, content));
        }
        if (result.truncated) setLogTruncated(true);
        setStage(
          result.status === 9
            ? 'pending'
            : result.status === 1
              ? 'queued'
              : result.status === 8
                ? 'lost'
                : 'running',
        );
        if (result.more) {
          void tick();
          return;
        }
        // 终态且没有新内容：读完。终态但这次还有新内容：再取一次确认
        // 结果未知（节点失联）：节点恢复连接后还会补传日志，放慢轮询而不是停下
        if (result.status === 8) {
          timer = setTimeout(() => void tick(), POLL_MS * 8);
          return;
        }
        if (!isActiveStatus(result.status) && nextSeq === afterSeq) {
          finish();
          return;
        }
        // 待审批 / 排队中还没有日志可读：放慢轮询，只为感知状态变化
        const wait =
          result.status === 9
            ? POLL_MS * 4
            : result.status === 1
              ? POLL_MS * 2
              : POLL_MS;
        timer = setTimeout(
          () => void tick(),
          isActiveStatus(result.status) ? wait : 0,
        );
      } catch (err) {
        if (stopped) return;
        setLoaded(true);
        setError(getJobErrorMessage(err));
        const status = getErrorStatus(err);
        // 不存在 / 无权限：重试无意义
        if (status === 403 || status === 404) {
          finish();
          return;
        }
        timer = setTimeout(() => void tick(), backoff);
        backoff = Math.min(backoff * 2, BACKOFF_MAX_MS);
      }
    };

    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, visible]);

  // 跟随输出：仅当用户停留在底部时才自动滚动
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (box && follow && atBottom.current) box.scrollTop = box.scrollHeight;
  }, [log, follow]);

  const scrollToBottom = () => {
    const box = boxRef.current;
    if (!box) return;
    atBottom.current = true;
    box.scrollTop = box.scrollHeight;
  };

  const fullText = () => pieces.current.join('').replace(ANSI_REGEX, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText());
      message.success(t('common.action.copied'));
    } catch {
      message.error(t('pages.job.log.copyFailed'));
    }
  };

  const download = () =>
    saveBlob(
      new Blob([fullText()], { type: 'text/plain;charset=utf-8' }),
      `${filename}.log`,
    );

  // 引用稳定：写满的日志块靠它跳过重渲染
  const classes = useMemo<ToneClasses>(
    () => ({
      line: styles.logLine,
      red: styles.logRed,
      yellow: styles.logYellow,
      green: styles.logGreen,
      cyan: styles.logCyan,
    }),
    [styles],
  );
  const empty = log.chunks.length === 0 && !log.tail;

  return (
    <div>
      <Flex
        align="center"
        justify="space-between"
        gap={12}
        wrap
        style={{ marginBottom: 8 }}
      >
        <Flex align="center" gap={8}>
          <Switch
            size="small"
            checked={follow}
            onChange={(checked) => {
              setFollow(checked);
              if (checked) scrollToBottom();
            }}
          />
          <span>{t('pages.job.log.follow')}</span>
          {!done && !error && (
            <span className={styles.hint}>
              <Spin size="small" style={{ marginInlineEnd: 6 }} />
              {t(
                !visible
                  ? 'pages.job.log.paused'
                  : stage === 'pending'
                    ? 'pages.job.log.pendingApproval'
                    : stage === 'queued'
                      ? 'pages.job.log.queued'
                      : stage === 'lost'
                        ? 'pages.job.log.lost'
                        : 'pages.job.log.streaming',
              )}
            </span>
          )}
          {done && !error && (
            <span className={styles.hint}>{t('pages.job.log.done')}</span>
          )}
        </Flex>
        <Flex gap={8}>
          <Button
            size="small"
            icon={<VerticalAlignBottomOutlined />}
            onClick={scrollToBottom}
          >
            {t('pages.job.log.toBottom')}
          </Button>
          <Button
            size="small"
            icon={<CopyOutlined />}
            disabled={empty}
            onClick={() => void copy()}
          >
            {t('common.action.copy')}
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            disabled={empty}
            onClick={download}
          >
            {t('pages.job.log.download')}
          </Button>
        </Flex>
      </Flex>
      {(truncated || logTruncated) && (
        <Alert
          type="warning"
          showIcon
          title={t('pages.job.log.truncated')}
          style={{ marginBottom: 8 }}
        />
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          title={t(
            done ? 'pages.job.log.error' : 'pages.job.log.error.retrying',
          )}
          description={error}
          style={{ marginBottom: 8 }}
        />
      )}
      <div
        ref={boxRef}
        className={styles.terminal}
        onScroll={(e) => {
          const box = e.currentTarget;
          atBottom.current =
            box.scrollHeight - box.scrollTop - box.clientHeight <
            BOTTOM_SLACK_PX;
        }}
      >
        {log.dropped > 0 && (
          <div className={styles.terminalNotice}>
            {t('pages.job.log.dropped', { n: log.dropped })}
            <a className={styles.terminalNoticeLink} onClick={download}>
              {t('pages.job.log.downloadFull')}
            </a>
          </div>
        )}
        {empty && loaded && (
          <div className={styles.terminalNotice}>
            {t(
              done
                ? 'pages.job.log.empty'
                : stage === 'pending'
                  ? 'pages.job.log.pendingApproval.hint'
                  : stage === 'queued'
                    ? 'pages.job.log.queued.hint'
                    : stage === 'lost'
                      ? 'pages.job.log.lost'
                      : 'pages.job.log.waiting',
            )}
          </div>
        )}
        {log.chunks.map((chunk) => (
          <LogChunkView key={chunk.id} lines={chunk.lines} classes={classes} />
        ))}
        {log.tail && <LogLine line={log.tail} classes={classes} />}
      </div>
    </div>
  );
};
