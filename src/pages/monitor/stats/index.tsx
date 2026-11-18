/**
 * 告警统计（只读）：概览、按天趋势、排行、处理效率（MTTA / MTTR）、降噪效果。
 * 五个接口各自加载、各自展示加载中 / 无数据 / 失败（可重试）——一块失败不影响其余几块。
 * 时间范围按事件的首次触发时间取数，至多 90 天（起点含、终点不含）；概览是当前状态，不随时间范围变化。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Segmented,
  Spin,
  Table,
  theme,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { NOTIFY_SEVERITY_META } from '@/constants';
import { getMonitorErrorMessage } from '@/services/monitor/request';
import {
  getAlertEfficiency,
  getAlertNoise,
  getAlertOverview,
  getAlertTop,
  getAlertTrend,
} from '@/services/monitor/stats';
import type {
  AlertEfficiencyItem,
  AlertTrend,
  MonitorSeverity,
} from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { formatDuration } from '../components/format';
import { GroupTreeSelect } from '../components/GroupTreeSelect';
import { INSIGHT_TABS } from '../components/groups';
import { useRuleGroups } from '../components/hooks';
import { SEVERITY_ORDER } from '../components/meta';
import { useSeriesColors } from '../components/SeriesChart';
import { localTimezone } from '../components/TimeWindowsEditor';
import { SeverityBar, SeverityTag } from '../components/tags';
import { NoisePanel } from './NoisePanel';
import { RankList } from './RankList';
import { StatTile } from './StatTile';
import { useStatsStyles } from './styles';
import { TrendChart, type TrendSeries } from './TrendChart';

/** 时间范围上限（天）：后端超出即 400 MONITOR_TIME_RANGE_INVALID */
const MAX_DAYS = 90;
const PRESETS = [7, 30, 90] as const;
type Preset = (typeof PRESETS)[number] | 'custom';
const DAY_MS = 86_400_000;
const TOP_LIMIT = 10;

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
          setState({ error: getMonitorErrorMessage(e), loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [...deps, attempt]);
  return { ...state, reload: () => setAttempt((n) => n + 1) };
};

/** 一块统计的外框：标题 + 右上角的切换 / 说明，正文按加载状态切换 */
const Block = <T,>({
  title,
  extra,
  state,
  children,
}: {
  title: string;
  extra?: React.ReactNode;
  state: { data?: T; error?: string; loading: boolean; reload: () => void };
  children: (data: T) => React.ReactNode;
}) => {
  const t = useT();
  return (
    <Card variant="outlined" title={title} extra={extra} className="h-full">
      {state.error !== undefined ? (
        <Alert
          type="error"
          showIcon
          title={t('pages.monitor.stats.loadFailed', { name: title })}
          description={state.error}
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={state.loading}
              onClick={state.reload}
            >
              {t('pages.monitor.retry')}
            </Button>
          }
        />
      ) : state.data === undefined ? (
        <div className="py-12 text-center">
          <Spin />
        </div>
      ) : (
        <Spin spinning={state.loading}>{children(state.data)}</Spin>
      )}
    </Card>
  );
};

const isSeverityKey = (key?: string): boolean =>
  SEVERITY_ORDER.includes(Number(key) as MonitorSeverity);

const AlertStats: React.FC = () => {
  const t = useT();
  const access = useAccess();
  const { token } = theme.useToken();
  const { styles } = useStatsStyles();
  const palette = useSeriesColors();
  const { groups } = useRuleGroups();
  const timezone = useMemo(localTimezone, []);

  const [preset, setPreset] = useState<Preset>(7);
  const [custom, setCustom] = useState<[Dayjs, Dayjs]>();
  const [groupId, setGroupId] = useState<string>();
  const [trendBy, setTrendBy] = useState<'severity' | 'group'>('severity');
  const [efficiencyBy, setEfficiencyBy] = useState<'group' | 'severity'>(
    'group',
  );

  // 起点含、终点不含：按自然日取整，「近 N 天」含今天
  const [start, end] = useMemo<[Dayjs, Dayjs]>(() => {
    if (preset === 'custom' && custom) {
      return [custom[0].startOf('day'), custom[1].startOf('day').add(1, 'day')];
    }
    const until = dayjs().startOf('day').add(1, 'day');
    return [until.subtract(preset === 'custom' ? 7 : preset, 'day'), until];
  }, [preset, custom]);
  // 跨夏令时切换的 90 个自然日可能比 90×24 小时多出一小时：起点收到上限以内
  const startTime = (
    end.diff(start) > MAX_DAYS * DAY_MS
      ? end.subtract(MAX_DAYS * DAY_MS, 'millisecond')
      : start
  ).toISOString();
  const endTime = end.toISOString();
  const range = { startTime, endTime, groupId };

  const overview = useBlock(
    () => getAlertOverview({ groupId, timezone }),
    [groupId, timezone],
  );
  const trend = useBlock(
    () => getAlertTrend({ ...range, by: trendBy, timezone }),
    [startTime, endTime, groupId, trendBy, timezone],
  );
  const topRules = useBlock(
    () => getAlertTop({ ...range, by: 'rule', limit: TOP_LIMIT }),
    [startTime, endTime, groupId],
  );
  const topCis = useBlock(
    () => getAlertTop({ ...range, by: 'ci', limit: TOP_LIMIT }),
    [startTime, endTime, groupId],
  );
  const efficiency = useBlock(
    () => getAlertEfficiency({ ...range, by: efficiencyBy }),
    [startTime, endTime, groupId, efficiencyBy],
  );
  const noise = useBlock(
    () => getAlertNoise(range),
    [startTime, endTime, groupId],
  );

  /** 级别色：与级别标签同一口径（提示中性、警告橙、严重 / 致命红，致命更深） */
  const severityColor = (severity: MonitorSeverity): string => {
    const status = NOTIFY_SEVERITY_META[severity]?.status;
    if (status === 'Warning') return token.colorWarning;
    if (status === 'Error') {
      return severity >= 4 ? token.colorErrorActive : token.colorError;
    }
    return token.colorTextQuaternary;
  };

  /** 级别键 → 当前语言的级别名；「其他」「合计」同理；分组用后端给的名称 */
  const keyName = (key?: string, name?: string): string => {
    if (isSeverityKey(key)) {
      return t(NOTIFY_SEVERITY_META[Number(key) as MonitorSeverity].textId);
    }
    if (key === 'other') return t('pages.monitor.stats.other');
    if (key === 'total') return t('pages.monitor.stats.total');
    return name || key || t('common.empty');
  };

  const toTrendSeries = (data: AlertTrend): TrendSeries[] => {
    let next = 0;
    return (data.series ?? []).map((series, index) => {
      const key = series.key || String(index);
      const counts = series.counts ?? [];
      return {
        key,
        name: keyName(series.key, series.name),
        color: isSeverityKey(series.key)
          ? severityColor(Number(series.key) as MonitorSeverity)
          : series.key === 'other'
            ? token.colorTextQuaternary
            : palette[next++ % palette.length],
        counts,
        total: series.total ?? counts.reduce((a, b) => a + (b ?? 0), 0),
      };
    });
  };

  const duration = (seconds: string | undefined, basis?: number) =>
    // 没有可算的事件时后端给 0：显示为「—」而不是「0 秒」
    (basis ?? 0) > 0 ? formatDuration(seconds, t) : t('common.empty');

  const dimensionToggle = <V extends string>(
    value: V,
    onChange: (next: V) => void,
    order: readonly V[],
  ) => (
    <Segmented<V>
      size="small"
      value={value}
      options={order.map((by) => ({
        value: by,
        label: t(`pages.monitor.stats.by.${by}`),
      }))}
      onChange={onChange}
    />
  );

  return (
    <RouteTabsPage tabs={INSIGHT_TABS}>
      <div className={styles.toolbar}>
        <Segmented<Preset>
          value={preset}
          options={[
            ...PRESETS.map((days) => ({
              value: days,
              label: t('pages.monitor.stats.range.days', { n: days }),
            })),
            { value: 'custom', label: t('pages.monitor.stats.range.custom') },
          ]}
          onChange={(next) => {
            // 切到自定义时从当前生效的范围开始改
            if (next === 'custom') setCustom([start, end.subtract(1, 'day')]);
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
        <GroupTreeSelect
          groups={groups}
          value={groupId}
          style={{ width: 260 }}
          placeholder={t('pages.monitor.stats.group.placeholder')}
          onChange={(value) => setGroupId((value as string) || undefined)}
        />
        <span className={styles.hint}>
          {t('pages.monitor.stats.range.hint', { max: MAX_DAYS })}
        </span>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Block
            title={t('pages.monitor.stats.overview')}
            extra={
              <span className={styles.hint}>
                {t('pages.monitor.stats.overview.hint')}
              </span>
            }
            state={overview}
          >
            {(data) => (
              <div className={styles.overviewGrid}>
                <StatTile
                  wide
                  label={t('pages.monitor.stats.overview.firing')}
                  value={(data.firing ?? 0).toLocaleString()}
                  tone={(data.firing ?? 0) > 0 ? 'error' : 'success'}
                >
                  <span className={styles.severityBreakdown}>
                    {[...SEVERITY_ORDER].reverse().map((severity) => (
                      <span key={severity} className={styles.severityItem}>
                        <SeverityBar severity={severity} />
                        {t(NOTIFY_SEVERITY_META[severity].textId)}
                        <span className={styles.strong}>
                          {data.firingBySeverity?.[severity - 1] ?? 0}
                        </span>
                      </span>
                    ))}
                  </span>
                </StatTile>
                <StatTile
                  label={t('pages.monitor.stats.overview.unacked')}
                  tooltip={t('pages.monitor.stats.overview.unacked.tooltip')}
                  value={(data.unacked ?? 0).toLocaleString()}
                  tone={(data.unacked ?? 0) > 0 ? 'warning' : undefined}
                />
                <StatTile
                  label={t('pages.monitor.stats.overview.muted')}
                  value={(data.muted ?? 0).toLocaleString()}
                />
                <StatTile
                  label={t('pages.monitor.stats.overview.inhibited')}
                  value={(data.inhibited ?? 0).toLocaleString()}
                />
                <StatTile
                  label={t('pages.monitor.stats.overview.todayFired')}
                  value={(data.todayFired ?? 0).toLocaleString()}
                />
                <StatTile
                  label={t('pages.monitor.stats.overview.todayResolved')}
                  value={(data.todayResolved ?? 0).toLocaleString()}
                />
                <StatTile
                  label={t('pages.monitor.stats.overview.todayClosed')}
                  tooltip={t(
                    'pages.monitor.stats.overview.todayClosed.tooltip',
                  )}
                  value={(data.todayClosed ?? 0).toLocaleString()}
                />
              </div>
            )}
          </Block>
        </Col>

        <Col span={24}>
          <Block
            title={t('pages.monitor.stats.trend')}
            extra={dimensionToggle(trendBy, setTrendBy, ['severity', 'group'])}
            state={trend}
          >
            {(data) => {
              const series = toTrendSeries(data);
              const days = data.days ?? [];
              return (
                <TrendChart
                  title={t('pages.monitor.stats.trend')}
                  days={days}
                  series={series}
                  // 后端的各天合计缺失时按各条相加
                  totals={days.map(
                    (_, i) =>
                      data.totals?.[i] ??
                      series.reduce((sum, s) => sum + (s.counts[i] ?? 0), 0),
                  )}
                />
              );
            }}
          </Block>
        </Col>

        <Col xs={24} lg={12}>
          <Block
            title={t('pages.monitor.stats.top.rule')}
            extra={
              topRules.data && (
                <span className={styles.hint}>
                  {t('pages.monitor.stats.top.total', {
                    n: topRules.data.total ?? 0,
                  })}
                </span>
              )
            }
            state={topRules}
          >
            {(data) => (
              <RankList
                items={data.items ?? []}
                linkTo={(item) =>
                  access.canMonitorRule && item.key
                    ? `/monitor/rule?ruleId=${encodeURIComponent(item.key)}`
                    : undefined
                }
              />
            )}
          </Block>
        </Col>
        <Col xs={24} lg={12}>
          <Block
            title={t('pages.monitor.stats.top.ci')}
            extra={
              topCis.data && (
                <span className={styles.hint}>
                  {t('pages.monitor.stats.top.total', {
                    n: topCis.data.total ?? 0,
                  })}
                </span>
              )
            }
            state={topCis}
          >
            {(data) => (
              <RankList
                items={data.items ?? []}
                linkTo={(item) =>
                  access.canMonitorAlert && item.key
                    ? `/monitor/alert?ciId=${encodeURIComponent(item.key)}&ciName=${encodeURIComponent(item.name ?? '')}`
                    : undefined
                }
              />
            )}
          </Block>
        </Col>

        <Col span={24}>
          <Block
            title={t('pages.monitor.stats.efficiency')}
            extra={dimensionToggle(efficiencyBy, setEfficiencyBy, [
              'group',
              'severity',
            ])}
            state={efficiency}
          >
            {(data) => {
              const items = data.items ?? [];
              if (items.length === 0 && !(data.total?.alerts ?? 0)) {
                return (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('pages.monitor.stats.empty')}
                  />
                );
              }
              const rows: AlertEfficiencyItem[] = [
                ...items,
                ...(data.total ? [{ ...data.total, key: 'total' }] : []),
              ];
              return (
                <Table<AlertEfficiencyItem>
                  size="small"
                  rowKey={(row) => row.key ?? ''}
                  pagination={false}
                  dataSource={rows}
                  scroll={{ x: 'max-content' }}
                  rowClassName={(row) =>
                    row.key === 'total' ? styles.totalRow : ''
                  }
                  columns={[
                    {
                      title: t(`pages.monitor.stats.by.${efficiencyBy}`),
                      dataIndex: 'name',
                      render: (_, row) =>
                        isSeverityKey(row.key) ? (
                          <SeverityTag
                            severity={Number(row.key) as MonitorSeverity}
                          />
                        ) : (
                          keyName(row.key, row.name)
                        ),
                    },
                    {
                      title: t('pages.monitor.stats.efficiency.alerts'),
                      dataIndex: 'alerts',
                      align: 'right',
                      render: (_, row) => (row.alerts ?? 0).toLocaleString(),
                    },
                    {
                      title: t('pages.monitor.stats.efficiency.acked'),
                      dataIndex: 'acked',
                      align: 'right',
                      render: (_, row) => (row.acked ?? 0).toLocaleString(),
                    },
                    {
                      title: t('pages.monitor.stats.efficiency.resolved'),
                      dataIndex: 'resolved',
                      align: 'right',
                      render: (_, row) => (row.resolved ?? 0).toLocaleString(),
                    },
                    {
                      title: t('pages.monitor.stats.efficiency.mtta'),
                      dataIndex: 'mttaS',
                      align: 'right',
                      render: (_, row) => duration(row.mttaS, row.acked),
                    },
                    {
                      title: t('pages.monitor.stats.efficiency.mttr'),
                      dataIndex: 'mttrS',
                      align: 'right',
                      render: (_, row) => duration(row.mttrS, row.resolved),
                    },
                  ]}
                />
              );
            }}
          </Block>
        </Col>

        <Col span={24}>
          <Block title={t('pages.monitor.stats.noise')} state={noise}>
            {(data) => <NoisePanel data={data} />}
          </Block>
        </Col>
      </Row>
    </RouteTabsPage>
  );
};

export default AlertStats;
