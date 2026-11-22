/**
 * 故障统计（只读）：概览（当前状态）、趋势（按天 / 周，按等级堆叠）、效率（MTTD / MTTA / MTTM / MTTR 按等级）、
 * 候选与归并、分布（业务 / 根因 / 来源 / 规则）。与告警统计同一框架：时间范围 7 / 30 / 90 天或自定义（至多 90 天），
 * 各接口各自加载、各自展示加载中 / 失败（可重试），一块失败不影响其余几块；概览是当前状态，不随时间范围变化。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Segmented,
  Select,
  Spin,
  Table,
  theme,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { type BarItem, BarList } from '@/components/Charts';
import zhCN from '@/locales/zh-CN';
import { StatTile } from '@/pages/monitor/stats/StatTile';
import { useStatsStyles } from '@/pages/monitor/stats/styles';
import { TrendChart, type TrendSeries } from '@/pages/monitor/stats/TrendChart';
import { getIncidentErrorMessage } from '@/services/incident/request';
import {
  getDistribution,
  getEfficiency,
  getOverview,
  getTrend,
} from '@/services/incident/stats';
import type {
  EfficiencyRow,
  IncidentDistribution,
  IncidentEfficiency,
  IncidentOverview,
  IncidentSeverity,
  NamedCount,
  TrendPoint,
} from '@/services/incident/typings';
import { useT } from '@/utils/i18n';
import { useIncidentOptions } from '../components/hooks';
import { SEVERITY_META, SEVERITY_ORDER } from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { formatSeconds, SeverityTag } from '../components/tags';

/** 词条是否存在：useT 缺键时返回键名本身，不能用 `||` 回退 */
const hasText = (id: string) => id in zhCN;

/** 时间范围上限（天） */
const MAX_DAYS = 90;
const PRESETS = [7, 30, 90] as const;
type Preset = (typeof PRESETS)[number] | 'custom';
type Bucket = 'day' | 'week';

/** 一块统计的加载状态：换参数时保留上一份数据（只转圈），失败时给出文案供重试 */
const useBlock = <T,>(load: () => Promise<T>, deps: readonly unknown[]) => {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [attempt, setAttempt] = useState(0);
  // attempt 只用来触发重试
  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));
    load()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false });
      })
      .catch((e) => {
        if (!cancelled) {
          setState({ error: getIncidentErrorMessage(e), loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [...deps, attempt]);
  return { ...state, reload: () => setAttempt((n) => n + 1) };
};

/** 一块统计的外框：标题 + 右上角的说明，正文按加载状态切换 */
const Block = <T,>({
  title,
  extra,
  state,
  bare,
  children,
}: {
  title?: string;
  extra?: React.ReactNode;
  state: { data?: T; error?: string; loading: boolean; reload: () => void };
  /** 不套卡片（概览的指标卡本身带边框，直接铺在页面上） */
  bare?: boolean;
  children: (data: T) => React.ReactNode;
}) => {
  const t = useT();
  const body =
    state.error !== undefined ? (
      <Alert
        type="error"
        showIcon
        title={t('pages.incident.stats.failed')}
        description={state.error}
        action={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={state.loading}
            onClick={state.reload}
          >
            {t('pages.incident.retry')}
          </Button>
        }
      />
    ) : state.data === undefined ? (
      <div className="py-12 text-center">
        <Spin />
      </div>
    ) : (
      <Spin spinning={state.loading}>{children(state.data)}</Spin>
    );
  if (bare) return <>{body}</>;
  return (
    <Card variant="outlined" title={title} extra={extra} className="h-full">
      {body}
    </Card>
  );
};

/** 比率：一位小数，整数时省掉「.0」（6.1% / 72%） */
const percent = (v?: number) =>
  `${((v ?? 0) * 100).toFixed(1).replace(/\.0$/, '')}%`;

const toBars = (items?: NamedCount[]): BarItem[] =>
  (items ?? []).map((it) => ({
    key: it.key,
    label: it.name || it.key,
    count: it.count ?? 0,
  }));

/** 卡片内的无边框指标：名称 / 数值（可按状态着色）/ 补充说明 */
const Metric: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  color?: string;
  extra?: React.ReactNode;
}> = ({ label, value, color, extra }) => {
  const { styles } = useStatsStyles();
  return (
    <div>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue} style={{ color }}>
        {value}
      </div>
      {extra && <div className={styles.metricExtra}>{extra}</div>}
    </div>
  );
};

const IncidentStats: React.FC = () => {
  const t = useT();
  const { token } = theme.useToken();
  const { styles } = useStatsStyles();
  const { styles: own } = useIncidentStyles();
  const { options } = useIncidentOptions(['businesses']);

  const [preset, setPreset] = useState<Preset>(30);
  const [custom, setCustom] = useState<[Dayjs, Dayjs]>();
  const [bucket, setBucket] = useState<Bucket>('day');
  const [businessId, setBusinessId] = useState<string>();

  // 按自然日取整，首尾两天都含；「近 N 天」含今天
  const [start, end] = useMemo<[Dayjs, Dayjs]>(() => {
    if (preset === 'custom' && custom) {
      return [custom[0].startOf('day'), custom[1].endOf('day')];
    }
    const today = dayjs();
    const days = preset === 'custom' ? 30 : preset;
    return [today.subtract(days - 1, 'day').startOf('day'), today.endOf('day')];
  }, [preset, custom]);
  const startTime = start.toISOString();
  const endTime = end.toISOString();
  const range = { startTime, endTime, businessId };

  const overview = useBlock(() => getOverview(businessId), [businessId]);
  const trend = useBlock(
    () => getTrend({ ...range, bucket }),
    [startTime, endTime, businessId, bucket],
  );
  const efficiency = useBlock(
    () => getEfficiency(range),
    [startTime, endTime, businessId],
  );
  const distribution = useBlock(
    () => getDistribution(range),
    [startTime, endTime, businessId],
  );

  /** 等级色：与等级标签同一口径（S1 深红、S2 红、S3 橙、S4 蓝） */
  const severityColor = (severity: IncidentSeverity): string => {
    const status = SEVERITY_META[severity].status;
    if (status === 'Error') {
      return severity === 1 ? token.colorErrorActive : token.colorError;
    }
    if (status === 'Warning') return token.colorWarning;
    return token.colorPrimary;
  };

  const toTrend = (points: TrendPoint[] = []) => {
    const days = points.map((p) => dayjs(p.bucket).format('YYYY-MM-DD'));
    const series: TrendSeries[] = SEVERITY_ORDER.map((severity) => {
      const counts = points.map(
        (p) => p.bySeverity?.find((s) => s.severity === severity)?.count ?? 0,
      );
      return {
        key: String(severity),
        name: t(SEVERITY_META[severity].textId),
        color: severityColor(severity),
        counts,
        total: counts.reduce((a, b) => a + b, 0),
      };
    });
    const totals = points.map(
      (p, i) =>
        p.total ?? series.reduce((sum, s) => sum + (s.counts[i] ?? 0), 0),
    );
    return { days, series, totals };
  };

  const countOf = (
    items: { severity: number; count?: number }[] | undefined,
    severity: number,
  ) => items?.find((x) => x.severity === severity)?.count ?? 0;

  /** 区间内故障总数（效率表各等级之和），用于「平均每条故障归并 N 条告警」 */
  const rangeIncidents = (efficiency.data?.rows ?? []).reduce(
    (sum, r) => sum + (r.count ?? 0),
    0,
  );
  const itemCount = (items?: NamedCount[]) =>
    distribution.data && (
      <span className={styles.hint}>
        {t('pages.incident.stats.itemCount', { n: (items ?? []).length })}
      </span>
    );

  return (
    <PageContainer title={false}>
      <div className={styles.toolbar}>
        <Segmented<Preset>
          value={preset}
          options={[
            ...PRESETS.map((days) => ({
              value: days,
              label: t('pages.incident.stats.range.days', { n: days }),
            })),
            { value: 'custom', label: t('pages.incident.stats.range.custom') },
          ]}
          onChange={(next) => {
            // 切到自定义时从当前生效的范围开始改
            if (next === 'custom') setCustom([start, end]);
            setPreset(next);
          }}
        />
        {preset === 'custom' && (
          <DatePicker.RangePicker
            allowClear={false}
            value={custom}
            // 至多 90 天（含首尾两天）；不选未来
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
          placeholder={t('pages.incident.stats.allBusinesses')}
          style={{ width: 220 }}
          value={businessId}
          onChange={setBusinessId}
          options={(options.businesses ?? []).map((b) => ({
            value: b.id,
            label: b.name || b.id,
          }))}
        />
        <span className={styles.hint}>
          {t('pages.incident.stats.range.hint', { max: MAX_DAYS })}
        </span>
      </div>

      <Block bare state={overview}>
        {(data: IncidentOverview) => (
          <div className={own.overviewGrid}>
            <StatTile
              wide
              label={t('pages.incident.stats.active')}
              value={(data.active ?? 0).toLocaleString()}
              tone={
                countOf(data.activeBySeverity, 1) > 0
                  ? 'error'
                  : (data.active ?? 0) > 0
                    ? 'warning'
                    : 'success'
              }
            >
              <span className={styles.severityBreakdown}>
                {SEVERITY_ORDER.map((severity) => (
                  <span key={severity} className={styles.severityItem}>
                    <span
                      className={styles.swatch}
                      style={{ background: severityColor(severity) }}
                    />
                    {t(SEVERITY_META[severity].textId)}
                    <span className={styles.strong}>
                      {countOf(data.activeBySeverity, severity)}
                    </span>
                  </span>
                ))}
              </span>
            </StatTile>
            <StatTile
              label={t('pages.incident.stats.unresponded')}
              value={(data.unresponded ?? 0).toLocaleString()}
              tone={(data.unresponded ?? 0) > 0 ? 'error' : undefined}
            />
            <StatTile
              label={t('pages.incident.stats.proposalPending')}
              value={(data.proposalPending ?? 0).toLocaleString()}
              tone={(data.proposalPending ?? 0) > 0 ? 'warning' : undefined}
            />
            <StatTile
              label={t('pages.incident.stats.reviewPending')}
              value={(data.reviewPending ?? 0).toLocaleString()}
            />
            <StatTile
              label={t('pages.incident.stats.reviewOverdue')}
              value={(data.reviewOverdue ?? 0).toLocaleString()}
              tone={(data.reviewOverdue ?? 0) > 0 ? 'error' : undefined}
            />
            <StatTile
              label={t('pages.incident.stats.todayOpened')}
              value={(data.todayOpened ?? 0).toLocaleString()}
            />
            <StatTile
              label={t('pages.incident.stats.todayResolved')}
              value={(data.todayResolved ?? 0).toLocaleString()}
            />
            <StatTile
              label={t('pages.incident.stats.candidates')}
              value={(data.candidates ?? 0).toLocaleString()}
            />
          </div>
        )}
      </Block>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Block
            title={t('pages.incident.stats.trend')}
            extra={
              <>
                {trend.data && (
                  <span className={styles.hint} style={{ marginInlineEnd: 12 }}>
                    {t('pages.incident.stats.trendTotal', {
                      n: toTrend(trend.data.points).totals.reduce(
                        (a, b) => a + b,
                        0,
                      ),
                    })}
                  </span>
                )}
                <Segmented<Bucket>
                  size="small"
                  value={bucket}
                  onChange={setBucket}
                  options={[
                    { value: 'day', label: t('pages.incident.stats.byDay') },
                    { value: 'week', label: t('pages.incident.stats.byWeek') },
                  ]}
                />
              </>
            }
            state={trend}
          >
            {(data: { points?: TrendPoint[] }) => {
              const { days, series, totals } = toTrend(data.points);
              return (
                <TrendChart
                  title={t('pages.incident.stats.trend')}
                  days={days}
                  series={series}
                  totals={totals}
                />
              );
            }}
          </Block>
        </Col>

        <Col xs={24} lg={16}>
          <Block
            title={t('pages.incident.stats.efficiency')}
            state={efficiency}
          >
            {(data: IncidentEfficiency) => (
              <>
                <div className={styles.metricRow} style={{ marginBottom: 20 }}>
                  <Metric
                    label={t('pages.incident.stats.reopenRate')}
                    value={percent(data.reopenRate)}
                    color={
                      (data.reopenRate ?? 0) > 0
                        ? token.colorWarning
                        : undefined
                    }
                  />
                  <Metric
                    label={t('pages.incident.stats.reviewOverdueRate')}
                    value={percent(data.reviewOverdueRate)}
                    color={
                      (data.reviewOverdueRate ?? 0) > 0
                        ? token.colorWarning
                        : undefined
                    }
                  />
                  <Metric
                    label={t('pages.incident.stats.itemDoneRate')}
                    value={percent(data.actionItemDoneRate)}
                    extra={`${data.actionItemDone ?? 0} / ${data.actionItemTotal ?? 0}`}
                  />
                </div>
                <Table<EfficiencyRow>
                  rowKey="severity"
                  size="small"
                  pagination={false}
                  dataSource={data.rows ?? []}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    {
                      title: t('pages.incident.field.severity'),
                      dataIndex: 'severity',
                      render: (_, r) => <SeverityTag severity={r.severity} />,
                    },
                    {
                      title: t('pages.incident.stats.count'),
                      dataIndex: 'count',
                      align: 'right',
                      render: (_, r) => (r.count ?? 0).toLocaleString(),
                    },
                    {
                      title: t('pages.incident.stats.mttd'),
                      dataIndex: 'mttdS',
                      align: 'right',
                      render: (_, r) => formatSeconds(r.mttdS),
                    },
                    {
                      title: t('pages.incident.stats.mtta'),
                      dataIndex: 'mttaS',
                      align: 'right',
                      render: (_, r) => formatSeconds(r.mttaS),
                    },
                    {
                      title: t('pages.incident.stats.mttm'),
                      dataIndex: 'mttmS',
                      align: 'right',
                      render: (_, r) => formatSeconds(r.mttmS),
                    },
                    {
                      title: t('pages.incident.stats.mttr'),
                      dataIndex: 'mttrS',
                      align: 'right',
                      render: (_, r) => formatSeconds(r.mttrS),
                    },
                  ]}
                />
                <div className={styles.hint} style={{ marginTop: 12 }}>
                  {t('pages.incident.stats.rateHint')}
                </div>
              </>
            )}
          </Block>
        </Col>
        <Col xs={24} lg={8}>
          <Block
            title={t('pages.incident.stats.correlation')}
            state={distribution}
          >
            {(data: IncidentDistribution) => {
              const total = data.candidateTotal ?? 0;
              const promoted = data.candidatePromoted ?? 0;
              const linked = data.alertLinked ?? 0;
              return (
                <div className={styles.metricStack}>
                  <Metric
                    label={t('pages.incident.stats.candidateTotal')}
                    value={total.toLocaleString()}
                  />
                  <Metric
                    label={t('pages.incident.stats.candidatePromoted')}
                    value={promoted.toLocaleString()}
                    extra={
                      total > 0
                        ? t('pages.incident.stats.promotedRate', {
                            rate: percent(promoted / total),
                          })
                        : undefined
                    }
                  />
                  <Metric
                    label={t('pages.incident.stats.alertLinked')}
                    value={linked.toLocaleString()}
                    extra={
                      rangeIncidents > 0
                        ? t('pages.incident.stats.alertPerIncident', {
                            n: (linked / rangeIncidents).toFixed(1),
                          })
                        : undefined
                    }
                  />
                </div>
              );
            }}
          </Block>
        </Col>

        <Col xs={24} lg={12}>
          <Block
            title={t('pages.incident.stats.byBusiness')}
            extra={itemCount(distribution.data?.businesses)}
            state={distribution}
          >
            {(data: IncidentDistribution) => (
              <BarList items={toBars(data.businesses)} />
            )}
          </Block>
        </Col>
        <Col xs={24} lg={12}>
          <Block
            title={t('pages.incident.stats.byRootCause')}
            extra={itemCount(distribution.data?.rootCauses)}
            state={distribution}
          >
            {(data: IncidentDistribution) => (
              <BarList items={toBars(data.rootCauses)} />
            )}
          </Block>
        </Col>
        <Col xs={24} lg={12}>
          <Block
            title={t('pages.incident.stats.bySource')}
            extra={itemCount(distribution.data?.sources)}
            state={distribution}
          >
            {(data: IncidentDistribution) => (
              <BarList
                items={toBars(data.sources).map((b) => ({
                  ...b,
                  label: hasText(`enum.incident.source.${b.key}`)
                    ? t(`enum.incident.source.${b.key}`)
                    : b.label,
                }))}
              />
            )}
          </Block>
        </Col>
        <Col xs={24} lg={12}>
          <Block
            title={t('pages.incident.stats.byRule')}
            extra={itemCount(distribution.data?.rules)}
            state={distribution}
          >
            {(data: IncidentDistribution) => (
              <BarList items={toBars(data.rules)} />
            )}
          </Block>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default IncidentStats;
