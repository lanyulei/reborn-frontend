/**
 * 引擎状态（平台自监控，只读）：评估引擎各实例、任务积压与评估延迟、当前不健康的数据源与
 * 持续评估失败的规则。引擎是独立部署的服务，可有多个实例；最近 60 秒没有心跳的实例标为失联。
 * 手动刷新 + 可选的自动刷新（同活跃告警列表的做法）；加载失败时保留上一次的结果并给出重试。
 */
import {
  CheckCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Link, useAccess } from '@umijs/max';
import { Alert, Button, Card, Flex, Select, Spin, Table, Tag } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RouteTabsPage } from '@/components/RouteTabs';
import { getEngineStatus } from '@/services/monitor/engine';
import { upstreamErrorText } from '@/services/monitor/errorText';
import { getMonitorErrorMessage } from '@/services/monitor/request';
import type {
  EngineDatasourceIssue,
  EngineInstance,
  EngineRuleIssue,
  EngineStatus,
} from '@/services/monitor/typings';
import { type Translate, useT } from '@/utils/i18n';
import { usePageVisible } from '@/utils/usePageVisible';
import { formatDuration, formatTime } from '../components/format';
import { INSIGHT_TABS } from '../components/groups';
import { StatTile } from '../stats/StatTile';
import { useStatsStyles } from '../stats/styles';

const REFRESH_OPTIONS = [0, 10, 30, 60] as const;
/** 引擎已知的角色（有对应文案）；其余原样显示 */
const KNOWN_ROLES = ['planner', 'evaluator'];

/** 毫秒数（int64 字符串）→ 不足一秒显示毫秒，否则显示时长 */
const formatLag = (ms: string | number | undefined, t: Translate): string => {
  const value = Math.max(0, Number(ms ?? 0) || 0);
  return value < 1000
    ? t('pages.monitor.engine.ms', { n: Math.round(value) })
    : formatDuration(Math.floor(value / 1000), t);
};

/** int64 字符串 → 带千分位的数字 */
const formatCount = (value?: string | number): string =>
  (Number(value ?? 0) || 0).toLocaleString();

const EngineStatusPage: React.FC = () => {
  const t = useT();
  const access = useAccess();
  const { styles } = useStatsStyles();
  const [status, setStatus] = useState<EngineStatus>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<number>();
  const [refreshS, setRefreshS] = useState<number>(0);
  // 只采纳最后一次请求的结果
  const seq = useRef(0);

  const load = useCallback(async () => {
    const current = ++seq.current;
    setLoading(true);
    try {
      const result = await getEngineStatus();
      if (current !== seq.current) return;
      setStatus(result);
      setError(undefined);
      setLoadedAt(Date.now());
    } catch (e) {
      if (current === seq.current) setError(getMonitorErrorMessage(e));
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 后台标签页不轮询，回到前台时（开着自动刷新）补一次
  const refreshRef = useRef(refreshS);
  refreshRef.current = refreshS;
  const visible = usePageVisible(() => {
    if (refreshRef.current) void load();
  });
  useEffect(() => {
    if (!refreshS || !visible) return;
    const timer = window.setInterval(() => void load(), refreshS * 1000);
    return () => window.clearInterval(timer);
  }, [refreshS, load, visible]);

  /** 「自何时起」+ 已持续多久（以最近一次加载的时刻为准） */
  const sinceText = (since?: string) => {
    if (!since) return t('common.empty');
    const seconds = ((loadedAt ?? Date.now()) - Date.parse(since)) / 1000;
    return (
      <div>
        <div>{formatTime(since)}</div>
        {seconds > 0 && (
          <div className={styles.hint}>
            {t('pages.monitor.engine.lasting', {
              duration: formatDuration(seconds, t),
            })}
          </div>
        )}
      </div>
    );
  };

  const errorCell = (raw?: string) => (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {upstreamErrorText(raw) || t('common.empty')}
    </span>
  );

  /** 没有问题时的空状态：明确说「一切正常」，而不是一个「暂无数据」 */
  const allGood = (text: string) => ({
    emptyText: (
      <div className="py-6 text-center">
        <CheckCircleOutlined className={styles.okIcon} />
        <div style={{ marginTop: 8 }}>{text}</div>
      </div>
    ),
  });

  const instances = status?.instances ?? [];
  const alive = instances.filter((instance) => instance.alive);
  const reasons = status
    ? [
        alive.length === 0 && t('pages.monitor.engine.reason.noInstance'),
        alive.length > 0 &&
          !alive.some((instance) => instance.leader) &&
          t('pages.monitor.engine.reason.noLeader'),
        (status.taskOverdue ?? 0) > 0 &&
          t('pages.monitor.engine.reason.overdue', {
            n: status.taskOverdue ?? 0,
          }),
      ].filter((reason): reason is string => Boolean(reason))
    : [];

  return (
    <RouteTabsPage tabs={INSIGHT_TABS}>
      <Flex gap={8} align="center" wrap style={{ marginBottom: 16 }}>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => void load()}
        >
          {t('pages.monitor.engine.refresh')}
        </Button>
        <Select<number>
          style={{ width: 160 }}
          value={refreshS}
          prefix={<SyncOutlined spin={refreshS > 0} />}
          options={REFRESH_OPTIONS.map((seconds) => ({
            value: seconds,
            label: t(`pages.monitor.alert.refresh.${seconds}`),
          }))}
          onChange={setRefreshS}
        />
        {loadedAt !== undefined && (
          <span className={styles.hint}>
            {t('pages.monitor.engine.loadedAt', {
              time: formatTime(new Date(loadedAt).toISOString()),
            })}
          </span>
        )}
      </Flex>

      {error !== undefined && (
        <Alert
          type="error"
          showIcon
          title={t('pages.monitor.engine.loadFailed')}
          description={error}
          action={
            <Button size="small" loading={loading} onClick={() => void load()}>
              {t('pages.monitor.retry')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {!status ? (
        loading && (
          <div className="py-24 text-center">
            <Spin />
          </div>
        )
      ) : (
        <Flex vertical gap={16}>
          {status.healthy ? (
            <Alert
              type="success"
              showIcon
              title={t('pages.monitor.engine.healthy')}
              description={t('pages.monitor.engine.healthy.description')}
            />
          ) : (
            <Alert
              type="error"
              showIcon
              title={t('pages.monitor.engine.unhealthy')}
              description={
                reasons.length > 0
                  ? reasons.join(t('pages.monitor.engine.reason.separator'))
                  : t('pages.monitor.engine.unhealthy.description')
              }
            />
          )}

          <div className={styles.tileGrid}>
            <StatTile
              label={t('pages.monitor.engine.tile.taskTotal')}
              tooltip={t('pages.monitor.engine.tile.taskTotal.tooltip')}
              value={formatCount(status.taskTotal)}
            />
            <StatTile
              label={t('pages.monitor.engine.tile.taskOverdue')}
              tooltip={t('pages.monitor.engine.tile.taskOverdue.tooltip')}
              value={formatCount(status.taskOverdue)}
              tone={(status.taskOverdue ?? 0) > 0 ? 'error' : undefined}
            />
            <StatTile
              label={t('pages.monitor.engine.tile.taskError')}
              tooltip={t('pages.monitor.engine.tile.taskError.tooltip')}
              value={formatCount(status.taskError)}
              tone={(status.taskError ?? 0) > 0 ? 'warning' : undefined}
            />
            <StatTile
              label={t('pages.monitor.engine.tile.maxLag')}
              tooltip={t('pages.monitor.engine.tile.maxLag.tooltip')}
              value={formatLag(status.maxLagMs, t)}
            />
            <StatTile
              label={t('pages.monitor.engine.tile.recordTask')}
              value={formatCount(status.recordTaskTotal)}
              tone={(status.recordTaskError ?? 0) > 0 ? 'warning' : undefined}
            >
              {t('pages.monitor.engine.tile.recordTask.failed', {
                n: status.recordTaskError ?? 0,
              })}
            </StatTile>
            <StatTile
              label={t('pages.monitor.engine.tile.notifyPending')}
              tooltip={t('pages.monitor.engine.tile.notifyPending.tooltip')}
              value={formatCount(status.notifyPending)}
            />
            <StatTile
              label={t('pages.monitor.engine.tile.ci')}
              value={formatCount(status.ciCount)}
            >
              {status.ciSyncTime
                ? t('pages.monitor.engine.tile.ci.syncTime', {
                    time: formatTime(status.ciSyncTime),
                  })
                : t('pages.monitor.engine.tile.ci.never')}
            </StatTile>
          </div>

          <Card variant="outlined" title={t('pages.monitor.engine.instances')}>
            {alive.length === 0 && (
              <Alert
                type="error"
                showIcon
                title={t('pages.monitor.engine.noInstance')}
                description={t('pages.monitor.engine.noInstance.description')}
                style={{ marginBottom: instances.length > 0 ? 16 : 0 }}
              />
            )}
            {instances.length > 0 && (
              <Table<EngineInstance>
                size="small"
                rowKey="instance"
                pagination={false}
                dataSource={instances}
                scroll={{ x: 'max-content' }}
                rowClassName={(row) => (row.alive ? '' : styles.staleRow)}
                columns={[
                  {
                    title: t('pages.monitor.engine.instance'),
                    dataIndex: 'instance',
                    render: (_, row) => (
                      <Flex gap={8} align="center">
                        <span>{row.instance}</span>
                        {row.leader && (
                          <Tag color="processing" style={{ margin: 0 }}>
                            {t('pages.monitor.engine.leader')}
                          </Tag>
                        )}
                        {!row.alive && (
                          <Tag color="warning" style={{ margin: 0 }}>
                            {t('pages.monitor.engine.stale')}
                          </Tag>
                        )}
                      </Flex>
                    ),
                  },
                  {
                    title: t('pages.monitor.engine.roles'),
                    dataIndex: 'roles',
                    render: (_, row) =>
                      row.roles?.length
                        ? row.roles.map((role) => (
                            <Tag key={role}>
                              {KNOWN_ROLES.includes(role)
                                ? t(`pages.monitor.engine.role.${role}`)
                                : role}
                            </Tag>
                          ))
                        : t('common.empty'),
                  },
                  {
                    title: t('pages.monitor.engine.version'),
                    dataIndex: 'version',
                    render: (_, row) => row.version || t('common.empty'),
                  },
                  {
                    title: t('pages.monitor.engine.startTime'),
                    dataIndex: 'startTime',
                    render: (_, row) =>
                      formatTime(row.startTime ?? undefined) ||
                      t('common.empty'),
                  },
                  {
                    title: t('pages.monitor.engine.lastSeen'),
                    dataIndex: 'lastSeen',
                    render: (_, row) =>
                      formatTime(row.lastSeen ?? undefined) ||
                      t('common.empty'),
                  },
                  {
                    title: t('pages.monitor.engine.taskCount'),
                    dataIndex: 'taskCount',
                    align: 'right',
                    render: (_, row) => formatCount(row.taskCount),
                  },
                  {
                    title: t('pages.monitor.engine.evalLag'),
                    dataIndex: 'evalLagMs',
                    align: 'right',
                    render: (_, row) => formatLag(row.evalLagMs, t),
                  },
                  {
                    title: t('pages.monitor.engine.evalCount'),
                    dataIndex: 'evalCount',
                    align: 'right',
                    render: (_, row) => formatCount(row.evalCount),
                  },
                  {
                    title: t('pages.monitor.engine.failCount'),
                    dataIndex: 'failCount',
                    align: 'right',
                    render: (_, row) => formatCount(row.failCount),
                  },
                ]}
              />
            )}
          </Card>

          <Card
            variant="outlined"
            title={t('pages.monitor.engine.datasources')}
          >
            <Table<EngineDatasourceIssue>
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={status.datasources ?? []}
              scroll={{ x: 'max-content' }}
              locale={allGood(t('pages.monitor.engine.datasources.ok'))}
              columns={[
                {
                  title: t('pages.monitor.common.datasource'),
                  dataIndex: 'name',
                  render: (_, row) =>
                    access.canMonitorDatasource ? (
                      <Link to="/monitor/datasource">{row.name || row.id}</Link>
                    ) : (
                      row.name || row.id
                    ),
                },
                {
                  title: t('pages.monitor.engine.error'),
                  dataIndex: 'error',
                  width: 520,
                  render: (_, row) => errorCell(row.error),
                },
                {
                  title: t('pages.monitor.engine.since'),
                  dataIndex: 'since',
                  render: (_, row) => sinceText(row.since ?? undefined),
                },
                {
                  title: t('pages.monitor.engine.ruleCount'),
                  dataIndex: 'ruleCount',
                  align: 'right',
                  render: (_, row) => formatCount(row.ruleCount),
                },
              ]}
            />
          </Card>

          <Card variant="outlined" title={t('pages.monitor.engine.rules')}>
            <Table<EngineRuleIssue>
              size="small"
              rowKey={(row) => `${row.ruleId}/${row.datasourceId ?? ''}`}
              pagination={false}
              dataSource={status.rules ?? []}
              scroll={{ x: 'max-content' }}
              locale={allGood(t('pages.monitor.engine.rules.ok'))}
              columns={[
                {
                  title: t('pages.monitor.engine.rule'),
                  dataIndex: 'ruleName',
                  render: (_, row) =>
                    access.canMonitorRule ? (
                      <Link
                        to={`/monitor/rule?ruleId=${encodeURIComponent(row.ruleId)}`}
                      >
                        {row.ruleName || row.ruleId}
                      </Link>
                    ) : (
                      row.ruleName || row.ruleId
                    ),
                },
                {
                  title: t('pages.monitor.common.group'),
                  dataIndex: 'groupName',
                  render: (_, row) => row.groupName || t('common.empty'),
                },
                {
                  title: t('pages.monitor.common.datasource'),
                  dataIndex: 'datasourceName',
                  render: (_, row) =>
                    row.datasourceName || row.datasourceId || t('common.empty'),
                },
                {
                  title: t('pages.monitor.engine.error'),
                  dataIndex: 'error',
                  width: 440,
                  render: (_, row) => errorCell(row.error),
                },
                {
                  title: t('pages.monitor.engine.since'),
                  dataIndex: 'since',
                  render: (_, row) => sinceText(row.since ?? undefined),
                },
                {
                  title: t('pages.monitor.engine.failures'),
                  dataIndex: 'failures',
                  align: 'right',
                  render: (_, row) => formatCount(row.failures),
                },
              ]}
            />
          </Card>
        </Flex>
      )}
    </RouteTabsPage>
  );
};

export default EngineStatusPage;
