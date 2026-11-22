/**
 * Agent 运行详情抽屉（运行记录页与故障详情「AI 诊断」页签共用）：状态与用量、阶段轨迹、发现、建议引用、
 * 权限与范围检查、干跑捕获、完整转录（只对持有「运行记录」菜单者返回）、有用 / 无用评价。
 */
import { Link } from '@umijs/max';
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Collapse,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Input,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CitedText } from '@/components/Citations';
import { useIncidentStyles } from '@/pages/incident/components/styles';
import { getAgentErrorMessage } from '@/services/agent/request';
import { getRun, rateRun } from '@/services/agent/task';
import type {
  AgentRun,
  RunStage,
  RunStatus,
  TranscriptMessage,
} from '@/services/agent/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useEnumText, useT } from '@/utils/i18n';
import {
  END_REASONS,
  num,
  RUN_STATUS_META,
  STAGE_META,
  STAGE_STATUS_META,
} from './meta';

const REFRESH_MS = 5_000;

/** 运行状态 → Badge 状态（未知状态按 default） */
export const badgeStatus = (status: RunStatus) =>
  (RUN_STATUS_META[status]?.status ?? 'Default').toLowerCase() as
    | 'default'
    | 'processing'
    | 'success'
    | 'error'
    | 'warning';

/** 耗时文本（毫秒 → 秒 / 分） */
const duration = (ms?: string | number): string => {
  const n = num(ms);
  if (n <= 0) return '—';
  if (n < 60_000) return `${(n / 1000).toFixed(1)}s`;
  return `${Math.floor(n / 60_000)}m ${Math.round((n % 60_000) / 1000)}s`;
};

const stepStatus = (s: RunStage['status']) =>
  s === 'done'
    ? 'finish'
    : s === 'running'
      ? 'process'
      : s === 'failed'
        ? 'error'
        : 'wait';

/** 转录消息：assistant 的工具调用折叠展示 */
const Transcript: React.FC<{ items: TranscriptMessage[] }> = ({ items }) => {
  const t = useT();
  const { styles } = useIncidentStyles();
  if (items.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  return (
    <Collapse
      size="small"
      items={items.map((m, i) => ({
        key: m.id,
        label: (
          <Space size={8}>
            <Tag>{m.role}</Tag>
            <span className={styles.hint}>{formatTime(m.createTime)}</span>
            <Typography.Text ellipsis style={{ maxWidth: 420 }}>
              {m.content ||
                (m.toolCalls?.length ? t('pages.agent.run.toolCall') : '')}
            </Typography.Text>
            <span className={styles.hint}>#{i + 1}</span>
          </Space>
        ),
        children: (
          <Flex vertical gap={8}>
            {m.reasoning && (
              <Typography.Paragraph type="secondary" className={styles.pre}>
                {m.reasoning}
              </Typography.Paragraph>
            )}
            {m.content && <div className={styles.pre}>{m.content}</div>}
            {m.toolCalls?.map((c) => (
              <Card key={c.id ?? c.tool} size="small" variant="outlined">
                <Space size={8} wrap>
                  <strong>{c.title || c.tool}</strong>
                  <span className={styles.mono}>{c.tool}</span>
                  {c.write && <Tag color="orange">write</Tag>}
                  <Tag>{c.status}</Tag>
                  {c.durationMs && (
                    <span className={styles.hint}>
                      {duration(c.durationMs)}
                    </span>
                  )}
                </Space>
                {c.input && (
                  <div style={{ marginTop: 8 }}>
                    <div className={styles.fieldLabel}>
                      {t('pages.agent.run.toolInput')}
                    </div>
                    <pre className={styles.summaryBox} style={{ margin: 0 }}>
                      {c.input}
                    </pre>
                  </div>
                )}
                {(c.output || c.error) && (
                  <div style={{ marginTop: 8 }}>
                    <div className={styles.fieldLabel}>
                      {t('pages.agent.run.toolOutput')}
                    </div>
                    <pre className={styles.summaryBox} style={{ margin: 0 }}>
                      {c.error || c.output}
                    </pre>
                  </div>
                )}
              </Card>
            ))}
          </Flex>
        ),
      }))}
    />
  );
};

export const RunDrawer: React.FC<{
  runId?: string;
  onClose: () => void;
  /** 评价后回调（列表刷新） */
  onChanged?: () => void;
}> = ({ runId, onClose, onChanged }) => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const statusText = useEnumText(RUN_STATUS_META);
  const stageText = useEnumText(STAGE_META);
  const stageStatusText = useEnumText(STAGE_STATUS_META);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(false);
  // 只采纳最后一次请求的结果（切换 runId / 轮询交错时）
  const seq = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      if (!runId) return;
      const current = ++seq.current;
      if (!silent) setLoading(true);
      try {
        const res = await getRun(runId, { silent: true });
        if (current !== seq.current) return;
        setRun(res.run);
        setTranscript(res.transcript ?? []);
        setVisible(res.transcriptVisible ?? false);
        setError(undefined);
      } catch (e) {
        if (current !== seq.current) return;
        setError(getAgentErrorMessage(e));
      } finally {
        if (current === seq.current) setLoading(false);
      }
    },
    [runId],
  );

  useEffect(() => {
    setRun(null);
    setNote('');
    setError(undefined);
    void load();
  }, [load]);

  // 运行中自动刷新
  useEffect(() => {
    if (!runId || run?.status !== 'running') return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [runId, run?.status, load]);

  const rate = async (feedback: 1 | 2) => {
    if (!run) return;
    setRating(true);
    try {
      setRun(await rateRun(run.id, feedback, note.trim() || undefined));
      message.success(t('pages.agent.run.rated'));
      onChanged?.();
    } finally {
      setRating(false);
    }
  };

  const endReason = (reason?: string) =>
    reason && (END_REASONS as readonly string[]).includes(reason)
      ? t(`pages.agent.run.endReason.${reason}`)
      : reason || t('common.empty');

  return (
    <Drawer
      size={880}
      open={!!runId}
      onClose={onClose}
      destroyOnHidden
      title={
        <Space size={8}>
          {t('pages.agent.run.title')}
          {run && (
            <Badge
              status={badgeStatus(run.status)}
              text={statusText(run.status)}
            />
          )}
          {run?.dryRun && <Tag>{t('pages.agent.task.dryRun')}</Tag>}
        </Space>
      }
    >
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          action={
            <Button size="small" onClick={() => load()}>
              {t('pages.agent.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      <Spin spinning={loading}>
        {run && (
          <Flex vertical gap={16}>
            <Descriptions
              size="small"
              column={{ xs: 1, md: 2, xl: 3 }}
              items={[
                {
                  key: 'incident',
                  label: t('pages.agent.task.column.incident'),
                  children: run.incident ? (
                    <Link to={`/incident/detail/${run.incident.id}?tab=agent`}>
                      {run.incident.name || run.incident.id}
                    </Link>
                  ) : (
                    t('common.empty')
                  ),
                },
                {
                  key: 'profile',
                  label: t('pages.agent.task.column.profile'),
                  children: run.profile?.name ?? t('common.empty'),
                },
                {
                  key: 'agent',
                  label: t('pages.agent.profile.agentUser'),
                  children: run.agentUser?.name ?? t('common.empty'),
                },
                {
                  key: 'tokens',
                  label: t('pages.agent.tokens'),
                  children: `${num(run.promptTokens).toLocaleString()} / ${num(run.completionTokens).toLocaleString()}${run.tokensEstimated ? `（${t('pages.agent.tokensEstimated')}）` : ''}`,
                },
                {
                  key: 'duration',
                  label: t('pages.agent.duration'),
                  children:
                    run.startTime && run.endTime
                      ? duration(
                          new Date(run.endTime).getTime() -
                            new Date(run.startTime).getTime(),
                        )
                      : formatTime(run.startTime),
                },
                {
                  key: 'end',
                  label: t('pages.agent.run.endReason'),
                  children: endReason(run.endReason),
                },
              ]}
            />

            <Card
              size="small"
              variant="outlined"
              title={t('pages.agent.run.stages')}
            >
              <Steps
                size="small"
                items={(run.stages ?? []).map((s) => ({
                  title: stageText(s.key),
                  status: stepStatus(s.status),
                  description: (
                    <span className={styles.hint}>
                      {stageStatusText(s.status)}
                      {s.steps ? ` · ${t('pages.agent.steps')} ${s.steps}` : ''}
                      {s.durationMs ? ` · ${duration(s.durationMs)}` : ''}
                    </span>
                  ),
                }))}
              />
              <Collapse
                size="small"
                ghost
                style={{ marginTop: 12 }}
                items={(run.stages ?? [])
                  .filter((s) => s.summary)
                  .map((s) => ({
                    key: s.key,
                    label: `${stageText(s.key)} · ${endReason(s.endReason)}`,
                    children: (
                      <pre className={styles.summaryBox} style={{ margin: 0 }}>
                        {s.summary}
                      </pre>
                    ),
                  }))}
              />
            </Card>

            <Card
              size="small"
              variant="outlined"
              title={t('pages.agent.run.finding')}
            >
              {run.finding ? (
                <Flex vertical gap={8}>
                  <Space size={8} wrap>
                    <strong>{run.finding.title}</strong>
                    {run.finding.confidence !== undefined && (
                      <Tag>
                        {t('pages.agent.run.confidence', {
                          n: run.finding.confidence,
                        })}
                      </Tag>
                    )}
                    {run.findingEventId && run.incident && (
                      <Link
                        to={`/incident/detail/${run.incident.id}?tab=timeline`}
                      >
                        {t('pages.incident.detail.tab.timeline')}
                      </Link>
                    )}
                  </Space>
                  {run.finding.conclusion && (
                    <div className={styles.pre}>
                      <CitedText text={run.finding.conclusion} />
                    </div>
                  )}
                  {run.finding.evidence && run.finding.evidence.length > 0 && (
                    <div>
                      <div className={styles.fieldLabel}>
                        {t('pages.agent.run.evidence')}
                      </div>
                      <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                        {run.finding.evidence.map((e, i) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: 证据可能重复，位置 + 内容才唯一
                          <li key={`${i}-${e}`} className={styles.mono}>
                            <CitedText text={e} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {run.finding.nextStep && (
                    <div>
                      <div className={styles.fieldLabel}>
                        {t('pages.agent.run.nextStep')}
                      </div>
                      <div className={styles.pre}>
                        <CitedText text={run.finding.nextStep} />
                      </div>
                    </div>
                  )}
                </Flex>
              ) : (
                <span className={styles.hint}>
                  {run.status === 'running'
                    ? t('enum.agent.run.status.running')
                    : t('pages.agent.run.noFinding')}
                </span>
              )}
              {run.proposals && run.proposals.length > 0 && run.incident && (
                <div style={{ marginTop: 12 }}>
                  <div className={styles.fieldLabel}>
                    {t('pages.agent.run.proposals')}
                  </div>
                  <Space size={8} wrap>
                    {run.proposals.map((p) => (
                      <Link
                        key={p.id}
                        to={`/incident/detail/${run.incident?.id}?tab=proposals`}
                      >
                        {p.name || p.id}
                      </Link>
                    ))}
                  </Space>
                </div>
              )}
              {run.status !== 'running' &&
                run.canRate &&
                (has('agent.task.rate') || has('incident.list.diagnose')) && (
                  <div style={{ marginTop: 16 }}>
                    <div className={styles.fieldLabel}>
                      {t('pages.agent.run.rate')}
                    </div>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('pages.agent.run.rate.note')}
                        maxLength={500}
                      />
                      <Button
                        loading={rating}
                        type={run.feedback === 1 ? 'primary' : 'default'}
                        onClick={() => rate(1)}
                      >
                        {t('pages.agent.run.rate.helpful')}
                      </Button>
                      <Button
                        loading={rating}
                        danger={run.feedback === 2}
                        onClick={() => rate(2)}
                      >
                        {t('pages.agent.run.rate.unhelpful')}
                      </Button>
                    </Space.Compact>
                    {run.feedback ? (
                      <div className={styles.hint} style={{ marginTop: 6 }}>
                        {t(`enum.agent.feedback.${run.feedback}`)} ·{' '}
                        {run.feedbackUser?.name} ·{' '}
                        {formatTime(run.feedbackTime)}
                        {run.feedbackNote ? ` · ${run.feedbackNote}` : ''}
                      </div>
                    ) : null}
                  </div>
                )}
            </Card>

            {run.denied && run.denied.length > 0 && (
              <Card
                size="small"
                variant="outlined"
                title={t('pages.agent.run.denied')}
              >
                <Alert
                  type="warning"
                  showIcon
                  title={t('pages.agent.run.deniedHint')}
                  style={{ marginBottom: 8 }}
                />
                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                  {run.denied.map((d, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 同一工具可能被拒绝多次，列表只读无重排
                    <li key={`${d.tool}-${i}`}>
                      <span className={styles.mono}>{d.tool}</span> · {d.reason}{' '}
                      {d.message}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {run.captured && run.captured.length > 0 && (
              <Card
                size="small"
                variant="outlined"
                title={t('pages.agent.run.captured')}
              >
                <Flex vertical gap={8}>
                  {run.captured.map((c, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 捕获记录无主键，列表只读无重排
                    <div key={`${c.tool}-${i}`}>
                      <span className={styles.mono}>{c.tool}</span>
                      <pre
                        className={styles.summaryBox}
                        style={{ margin: '4px 0 0' }}
                      >
                        {c.input}
                      </pre>
                    </div>
                  ))}
                </Flex>
              </Card>
            )}

            <Card
              size="small"
              variant="outlined"
              title={t('pages.agent.run.transcript')}
            >
              {visible ? (
                <Transcript items={transcript} />
              ) : (
                <span className={styles.hint}>
                  {t('pages.agent.run.transcriptHidden')}
                </span>
              )}
            </Card>
          </Flex>
        )}
      </Spin>
    </Drawer>
  );
};

export default RunDrawer;
