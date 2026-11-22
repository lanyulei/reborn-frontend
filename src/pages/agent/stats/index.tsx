/**
 * Agent 统计（只读）：概览（运行次数 + 结果构成、成功率、耗时、Token、建议、评价、今日预算）、
 * 任务结果分布（按状态堆叠条）、按 Profile 分布（结果构成细条、成功率 / 失败越阈值着色）。
 * 与告警 / 故障统计同一框架：时间范围 7 / 30 / 90 天或自定义（至多 90 天），颜色全部来自主题 token。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Segmented,
  Select,
  Spin,
  Table,
  type TableColumnsType,
  Tag,
  theme,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { formatDuration } from '@/pages/monitor/components/format';
import { StatTile } from '@/pages/monitor/stats/StatTile';
import { useStatsStyles } from '@/pages/monitor/stats/styles';
import { listProfiles } from '@/services/agent/profile';
import { getAgentErrorMessage } from '@/services/agent/request';
import { getAgentOverview } from '@/services/agent/stats';
import type {
  AgentOverview,
  AgentProfile,
  ProfileStat,
  TaskStatus,
} from '@/services/agent/typings';
import { useEnumText, useT } from '@/utils/i18n';
import { num, TASK_STATUS_META, TASK_STATUS_ORDER } from '../components/meta';

const MAX_DAYS = 90;
const PRESETS = [7, 30, 90] as const;
type Preset = (typeof PRESETS)[number] | 'custom';

/** 成功率的展示层参考目标与表格着色阈值（仅前端展示，非后端配置） */
const SUCCESS_TARGET = 0.8;
const SUCCESS_WARN = 0.7;
const SUCCESS_BAD = 0.5;
const FAIL_SHARE_WARN = 0.1;
const FAIL_SHARE_BAD = 0.3;

/** 占比，一位小数（75.0%）；分母为 0 时给「—」 */
const pct = (part: number, total: number): string =>
  total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '—';

/** 结果构成条的一段 */
interface OutcomePart {
  key: string;
  count: number;
  color: string;
}

/** 按 Profile 表的一行 */
interface ProfileRow {
  key: string;
  stat: ProfileStat;
}

const useStyles = createStyles(({ token, css }) => ({
  /** 概览的九张卡（第一张占两列 = 十格）：宽屏一行排满，常规宽度两行五列，窄屏两列 */
  overviewGrid: css`
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
    @media (max-width: 1800px) {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  /** 表格里的结果构成细条：与结果分布的堆叠条同一做法，缩成一格的尺寸 */
  miniSplit: css`
    display: flex;
    gap: 2px;
    width: 120px;
    height: 8px;
    overflow: hidden;
    background: ${token.colorFillTertiary};
    border-radius: ${token.borderRadiusSM}px;
  `,
  seg: css`
    min-width: 2px;
  `,
}));

const AgentStats: React.FC = () => {
  const t = useT();
  const { locale } = useIntl();
  const { token } = theme.useToken();
  const { styles } = useStatsStyles();
  const { styles: own } = useStyles();
  const statusText = useEnumText(TASK_STATUS_META);
  const [preset, setPreset] = useState<Preset>(30);
  const [custom, setCustom] = useState<[Dayjs, Dayjs]>();
  const [profileId, setProfileId] = useState<string>();
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [data, setData] = useState<AgentOverview>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const [start, end] = useMemo<[Dayjs, Dayjs]>(() => {
    if (preset === 'custom' && custom) {
      return [custom[0].startOf('day'), custom[1].endOf('day')];
    }
    const today = dayjs();
    const days = preset === 'custom' ? 30 : preset;
    return [today.subtract(days - 1, 'day').startOf('day'), today.endOf('day')];
  }, [preset, custom]);

  const compactNumber = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [locale],
  );
  const compact = (n: number): string => compactNumber.format(n);
  /** 紧凑格式与数值本身一致（未发生缩写）时不重复展示 */
  const approx = (n: number): string | undefined =>
    compact(n).replace(/,/g, '') !== String(n) ? `≈ ${compact(n)}` : undefined;

  const duration = (s?: number): string =>
    s && s > 0 ? formatDuration(s, t) : '—';

  const statusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'succeeded':
        return token.colorSuccess;
      case 'no_finding':
        return token.colorWarning;
      case 'failed':
        return token.colorError;
      case 'running':
        return token.colorPrimary;
      case 'queued':
        return token.colorPrimaryBorder;
      default:
        return token.colorTextQuaternary;
    }
  };

  useEffect(() => {
    listProfiles({ page: 1, pageSize: 100 }, { silent: true })
      .then((res) => setProfiles(res.items))
      .catch(() => setProfiles([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAgentOverview({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      profileId,
    })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(undefined);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getAgentErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [start, end, profileId, attempt]);

  const runs = data?.runs ?? 0;
  const found = data?.succeeded ?? 0;
  const noFinding = data?.noFinding ?? 0;
  const failed = data?.failed ?? 0;
  const votes = (data?.helpful ?? 0) + (data?.unhelpful ?? 0);
  const successRate = runs > 0 ? found / runs : undefined;
  const promptTokens = num(data?.promptTokens);
  const completionTokens = num(data?.completionTokens);

  const statusItems = TASK_STATUS_ORDER.map((status) => ({
    key: status,
    label: statusText(status),
    count: data?.tasksByStatus?.find((s) => s.status === status)?.count ?? 0,
    color: statusColor(status),
  }));
  const mixItems = statusItems.filter((it) => it.count > 0);
  const zeroNames = statusItems
    .filter((it) => it.count === 0)
    .map((it) => it.label);
  const taskTotal = mixItems.reduce((sum, it) => sum + it.count, 0);

  const budget = num(data?.dailyPromptBudget);
  const used = num(data?.todayPromptTokens);
  const budgetPct = budget > 0 ? used / budget : 0;

  const delta =
    successRate === undefined
      ? undefined
      : (successRate - SUCCESS_TARGET) * 100;

  const profileRows = useMemo<ProfileRow[]>(
    () =>
      [...(data?.byProfile ?? [])]
        .sort((a, b) => (b.tasks ?? 0) - (a.tasks ?? 0))
        .map((stat, i) => ({
          key: stat.profile?.id ?? `none-${i}`,
          stat,
        })),
    [data],
  );

  const outcomeParts = (r: ProfileStat): OutcomePart[] => [
    { key: 'succeeded', count: r.succeeded ?? 0, color: token.colorSuccess },
    { key: 'noFinding', count: r.noFinding ?? 0, color: token.colorWarning },
    { key: 'failed', count: r.failed ?? 0, color: token.colorError },
  ];
  const outcomeTitle = (s: number, n: number, f: number) =>
    `${t('pages.agent.stats.succeeded')} ${s} · ${t('pages.agent.stats.noFinding')} ${n} · ${t('pages.agent.stats.failed')} ${f}`;

  /** 成功率 / 失败数按阈值着色（与表头说明一致） */
  const rateColor = (r: ProfileStat): string | undefined => {
    if (!r.tasks) return undefined;
    const v = (r.succeeded ?? 0) / r.tasks;
    if (v < SUCCESS_BAD) return token.colorError;
    if (v < SUCCESS_WARN) return token.colorWarning;
    return undefined;
  };
  const failColor = (r: ProfileStat): string | undefined => {
    if (!r.tasks) return undefined;
    const v = (r.failed ?? 0) / r.tasks;
    if (v >= FAIL_SHARE_BAD) return token.colorError;
    if (v >= FAIL_SHARE_WARN) return token.colorWarning;
    return undefined;
  };

  const columns: TableColumnsType<ProfileRow> = [
    {
      title: t('pages.agent.task.column.profile'),
      dataIndex: ['stat', 'profile'],
      render: (_, r) =>
        r.stat.profile?.missing ? (
          <>
            <span className={styles.rankGone}>
              {r.stat.profile?.name || t('common.empty')}
            </span>{' '}
            <Tag variant="outlined" style={{ marginInlineEnd: 0 }}>
              {t('pages.agent.stats.profileGone')}
            </Tag>
          </>
        ) : (
          r.stat.profile?.name || t('common.empty')
        ),
    },
    {
      title: t('pages.agent.stats.runs'),
      key: 'tasks',
      align: 'right',
      sorter: (a, b) => (a.stat.tasks ?? 0) - (b.stat.tasks ?? 0),
      render: (_, r) => (r.stat.tasks ?? 0).toLocaleString(),
    },
    {
      title: t('pages.agent.stats.outcomeShort'),
      key: 'mix',
      align: 'right',
      render: (_, r) =>
        `${r.stat.succeeded ?? 0} · ${r.stat.noFinding ?? 0} · ${r.stat.failed ?? 0}`,
    },
    {
      title: t('pages.agent.stats.outcome'),
      key: 'outcome',
      render: (_, r) => {
        const parts = outcomeParts(r.stat).filter((p) => p.count > 0);
        const rest =
          (r.stat.tasks ?? 0) - parts.reduce((sum, p) => sum + p.count, 0);
        return (
          <div
            className={own.miniSplit}
            title={outcomeTitle(
              r.stat.succeeded ?? 0,
              r.stat.noFinding ?? 0,
              r.stat.failed ?? 0,
            )}
          >
            {parts.map((p) => (
              <span
                key={p.key}
                className={own.seg}
                style={{ flex: p.count, background: p.color }}
              />
            ))}
            {rest > 0 && (
              <span
                className={own.seg}
                style={{ flex: rest, background: token.colorTextQuaternary }}
              />
            )}
          </div>
        );
      },
    },
    {
      title: t('pages.agent.stats.successRate'),
      key: 'successRate',
      align: 'right',
      render: (_, r) => (
        <span style={{ color: rateColor(r.stat) }}>
          {pct(r.stat.succeeded ?? 0, r.stat.tasks ?? 0)}
        </span>
      ),
    },
    {
      title: t('pages.agent.stats.failed'),
      key: 'failed',
      align: 'right',
      sorter: (a, b) => (a.stat.failed ?? 0) - (b.stat.failed ?? 0),
      render: (_, r) => (
        <span style={{ color: failColor(r.stat) }}>
          {(r.stat.failed ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('pages.agent.stats.votes'),
      key: 'votes',
      align: 'right',
      render: (_, r) => `${r.stat.helpful ?? 0} / ${r.stat.unhelpful ?? 0}`,
    },
    {
      title: t('pages.agent.stats.tokenUsage'),
      key: 'tokens',
      align: 'right',
      sorter: (a, b) =>
        num(a.stat.promptTokens) +
        num(a.stat.completionTokens) -
        (num(b.stat.promptTokens) + num(b.stat.completionTokens)),
      render: (_, r) => (
        <span
          title={`${t('pages.agent.stats.inputTokens')} ${num(r.stat.promptTokens).toLocaleString()} · ${t('pages.agent.stats.outputTokens')} ${num(r.stat.completionTokens).toLocaleString()}`}
        >
          {(
            num(r.stat.promptTokens) + num(r.stat.completionTokens)
          ).toLocaleString()}
        </span>
      ),
    },
    {
      title: t('pages.agent.stats.avgDuration'),
      key: 'avgDurationS',
      align: 'right',
      sorter: (a, b) => (a.stat.avgDurationS ?? 0) - (b.stat.avgDurationS ?? 0),
      render: (_, r) => duration(r.stat.avgDurationS),
    },
  ];

  return (
    <PageContainer title={false}>
      <div className={styles.toolbar}>
        <Segmented<Preset>
          value={preset}
          options={[
            ...PRESETS.map((days) => ({
              value: days,
              label: t('pages.agent.stats.range.days', { n: days }),
            })),
            { value: 'custom', label: t('pages.agent.stats.range.custom') },
          ]}
          onChange={(next) => {
            if (next === 'custom') setCustom([start, end]);
            setPreset(next);
          }}
        />
        {preset === 'custom' && (
          <DatePicker.RangePicker
            allowClear={false}
            value={custom}
            disabledDate={(current, { from }) =>
              current.isAfter(dayjs().endOf('day')) ||
              (from
                ? Math.abs(
                    current.startOf('day').diff(from.startOf('day'), 'day'),
                  ) >= MAX_DAYS
                : false)
            }
            onChange={(value) => {
              if (value?.[0] && value[1]) setCustom([value[0], value[1]]);
            }}
          />
        )}
        <Select
          allowClear
          showSearch={{ optionFilterProp: 'label' }}
          placeholder={t('pages.agent.stats.allProfiles')}
          style={{ width: 220 }}
          value={profileId}
          onChange={setProfileId}
          options={profiles.map((p) => ({ value: p.id, label: p.spec.name }))}
        />
        <span className={styles.hint}>{t('pages.agent.stats.range.hint')}</span>
      </div>
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => setAttempt((n) => n + 1)}
            >
              {t('pages.agent.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      <Spin spinning={loading}>
        <div className={own.overviewGrid}>
          <StatTile
            wide
            label={t('pages.agent.stats.runs')}
            value={runs.toLocaleString()}
            tone={runs === 0 ? undefined : failed > 0 ? 'warning' : 'success'}
          >
            <span className={styles.severityBreakdown}>
              {(
                [
                  [token.colorSuccess, 'succeeded', found],
                  [token.colorWarning, 'noFinding', noFinding],
                  [token.colorError, 'failed', failed],
                ] as const
              ).map(([color, key, count]) => (
                <span key={key} className={styles.severityItem}>
                  <span
                    className={styles.swatch}
                    style={{ background: color }}
                  />
                  {t(`pages.agent.stats.${key}`)}
                  <span className={styles.strong}>
                    {count.toLocaleString()}
                  </span>
                </span>
              ))}
            </span>
          </StatTile>
          <StatTile
            label={t('pages.agent.stats.successRate')}
            value={pct(found, runs)}
            tone={
              successRate !== undefined && successRate < SUCCESS_TARGET
                ? 'warning'
                : undefined
            }
          >
            {t('pages.agent.stats.target', {
              pct: Math.round(SUCCESS_TARGET * 100),
            })}
            {delta !== undefined &&
              ` · ${t('pages.agent.stats.vsTarget', {
                delta: `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}`,
              })}`}
          </StatTile>
          <StatTile
            label={t('pages.agent.stats.avgDuration')}
            value={duration(data?.avgDurationS)}
          />
          <StatTile
            label={t('pages.agent.stats.p95Duration')}
            value={duration(data?.p95DurationS)}
          />
          <StatTile
            label={t('pages.agent.stats.inputTokens')}
            value={promptTokens.toLocaleString()}
          >
            {approx(promptTokens)}
          </StatTile>
          <StatTile
            label={t('pages.agent.stats.outputTokens')}
            value={completionTokens.toLocaleString()}
          >
            {approx(completionTokens)}
          </StatTile>
          <StatTile
            label={t('pages.agent.stats.proposals')}
            value={(data?.proposals ?? 0).toLocaleString()}
          >
            {t('pages.agent.stats.autoEligible')} {data?.autoEligible ?? 0}
          </StatTile>
          <StatTile
            label={t('pages.agent.stats.votes')}
            value={`${data?.helpful ?? 0} / ${data?.unhelpful ?? 0}`}
          >
            {t('pages.agent.stats.feedbackCount', { n: votes })}
          </StatTile>
          <StatTile
            label={t('pages.agent.stats.todayBudget')}
            value={used.toLocaleString()}
            tone={
              budgetPct >= 1
                ? 'error'
                : budgetPct >= SUCCESS_TARGET
                  ? 'warning'
                  : undefined
            }
          >
            / {budget.toLocaleString()} · {pct(used, budget)}
          </StatTile>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              variant="outlined"
              title={t('pages.agent.stats.tasks')}
              extra={
                <span className={styles.hint}>
                  {t('pages.agent.stats.tasksCount', { n: taskTotal })}
                </span>
              }
            >
              {mixItems.length > 0 ? (
                <>
                  <div className={styles.legend}>
                    {mixItems.map((it) => (
                      <span key={it.key} className={styles.legendItem}>
                        <span
                          className={styles.swatch}
                          style={{ background: it.color }}
                        />
                        <span className={styles.legendName}>{it.label}</span>
                        <span className={styles.strong}>
                          {it.count.toLocaleString()}
                        </span>
                        <span>{pct(it.count, taskTotal)}</span>
                      </span>
                    ))}
                  </div>
                  <div className={styles.split}>
                    {mixItems.map((it) => (
                      <span
                        key={it.key}
                        title={`${it.label}: ${it.count.toLocaleString()} (${pct(it.count, taskTotal)})`}
                        style={{ flex: it.count, background: it.color }}
                      />
                    ))}
                  </div>
                  {zeroNames.length > 0 && (
                    <div className={styles.hint}>
                      {t('pages.agent.stats.zeroHidden', {
                        names: zeroNames.join('、'),
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('pages.agent.stats.empty')}
                />
              )}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              variant="outlined"
              title={t('pages.agent.stats.byProfile')}
              extra={
                <span className={styles.hint}>
                  {t('pages.agent.stats.highlightRule')}
                </span>
              }
            >
              <Table<ProfileRow>
                size="small"
                rowKey="key"
                pagination={false}
                dataSource={profileRows}
                scroll={{ x: 'max-content' }}
                columns={columns}
              />
              <div className={styles.hint} style={{ marginTop: 12 }}>
                {t('pages.agent.stats.caliber')}
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  );
};

export default AgentStats;
