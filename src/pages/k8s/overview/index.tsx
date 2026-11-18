/**
 * 总览：当前用户数据范围内各集群的健康状态、资源水位、异常工作负载与最近的 Warning 事件。
 * 数据来自数据面周期计算后落库的摘要，打开页面不访问任何集群；每一项都能点进对应页面。
 * 形态选择：健康是状态（徽标 + 文字），水位是「占比」（进度条 + 数字），异常项与事件是清单（列表）。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { Link } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Empty,
  Flex,
  Progress,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import {
  type ClusterEvent,
  getOverview,
  type Overview,
  type OverviewCluster,
  type SummaryItem,
} from '@/services/k8s/insight';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { useT } from '@/utils/i18n';
import { AgeText } from '../components/cells';
import { formatMetric, MetricsPanel } from '../components/MetricsPanel';
import { K8sPage } from '../components/scope';
import { eventLink } from '../event';

const useStyles = createStyles(({ token, css }) => ({
  /** 分节标题行：标题与右侧操作同一行垂直居中（标题自带的上下外边距改由本行承担） */
  head: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
    margin-bottom: 12px;
    & > div:first-child {
      margin: 0;
    }
    & ~ & {
      margin-top: 24px;
    }
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
    gap: 16px;
  `,
  card: css`
    padding: 16px 20px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  name: css`
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeLG}px;
  `,
  sub: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  stats: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 16px 0 12px;
  `,
  statValue: css`
    display: block;
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeHeading4}px;
    font-variant-numeric: tabular-nums;
  `,
  meter: css`
    display: grid;
    grid-template-columns: 56px 1fr auto;
    gap: 12px;
    align-items: center;
    margin-top: 6px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    font-variant-numeric: tabular-nums;
  `,
  list: css`
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  item: css`
    display: flex;
    gap: 8px;
    justify-content: space-between;
    padding: 2px 0;
    font-size: ${token.fontSizeSM}px;
  `,
  itemText: css`
    flex: none;
    color: ${token.colorTextSecondary};
  `,
  eventRow: css`
    display: grid;
    grid-template-columns: 72px 140px 150px 1fr 60px;
    gap: 12px;
    align-items: baseline;
    padding: 8px 0;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    font-size: ${token.fontSizeSM}px;
    &:last-child {
      border-bottom: none;
    }
  `,
  ellipsis: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
}));

const STATUS: Record<
  number,
  { badge: 'default' | 'success' | 'error'; id: string }
> = {
  0: { badge: 'default', id: 'pages.k8s.cluster.status.0' },
  1: { badge: 'success', id: 'pages.k8s.cluster.status.1' },
  2: { badge: 'error', id: 'pages.k8s.cluster.status.2' },
};

const KIND_TAB: Record<string, string> = {
  Deployment: 'deployment',
  StatefulSet: 'statefulset',
  DaemonSet: 'daemonset',
  Pod: 'pod',
};

const itemLink = (clusterId: string, item: SummaryItem): string => {
  if (item.kind === 'Node') return `/k8s/cluster?tab=node&cluster=${clusterId}`;
  const tab = KIND_TAB[item.kind ?? ''] ?? 'deployment';
  return `/k8s/workload?tab=${tab}&cluster=${clusterId}&ns=${item.namespace ?? ''}`;
};

const Meter: React.FC<{
  label: string;
  used: number;
  total: number;
  unit: 'cores' | 'bytes';
}> = ({ label, used, total, unit }) => {
  const { styles } = useStyles();
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;
  const scale = unit === 'cores' ? 1000 : 1;
  return (
    <div className={styles.meter}>
      <span>{label}</span>
      <Progress
        percent={Math.min(percent, 100)}
        showInfo={false}
        size="small"
        status={percent >= 90 ? 'exception' : 'normal'}
      />
      <span>
        {formatMetric(used / scale, unit)} / {formatMetric(total / scale, unit)}
        （{percent}%）
      </span>
    </div>
  );
};

const ClusterCard: React.FC<{ cluster: OverviewCluster }> = ({ cluster }) => {
  const t = useT();
  const { styles } = useStyles();
  const s = cluster.summary;
  const status = STATUS[cluster.status] ?? STATUS[0];
  const abnormalPods = s?.pods?.abnormal ?? 0;
  const problems: SummaryItem[] = [
    ...(s?.abnormalNodes ?? []),
    ...(s?.abnormalWorkloads ?? []),
  ];
  return (
    <div className={styles.card}>
      <Flex justify="space-between" align="center">
        <Link
          className={styles.name}
          to={`/k8s/workload?cluster=${cluster.id}`}
        >
          {cluster.displayName || cluster.name}
        </Link>
        <Tooltip title={cluster.status === 2 ? cluster.lastError : undefined}>
          <Badge status={status.badge} text={t(status.id)} />
        </Tooltip>
      </Flex>
      <div className={styles.sub}>
        {cluster.name}
        {cluster.env && (
          <Tag style={{ marginInlineStart: 8 }}>{cluster.env}</Tag>
        )}
        {cluster.k8sVersion && <Tag>{cluster.k8sVersion}</Tag>}
      </div>
      {!s ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.k8s.overview.noSummary')}
        />
      ) : (
        <>
          <div className={styles.stats}>
            <Link to={`/k8s/cluster?tab=node&cluster=${cluster.id}`}>
              <span className={styles.statValue}>
                {s.nodeReady} / {s.nodeTotal}
              </span>
              <span className={styles.sub}>
                {t('pages.k8s.overview.nodes')}
              </span>
            </Link>
            <Link to={`/k8s/workload?cluster=${cluster.id}`}>
              <span className={styles.statValue}>
                {s.workloadAbnormal} / {s.workloadTotal}
              </span>
              <span className={styles.sub}>
                {t('pages.k8s.overview.abnormalWorkloads')}
              </span>
            </Link>
            <Link to={`/k8s/workload?tab=pod&cluster=${cluster.id}`}>
              <span className={styles.statValue}>
                {abnormalPods} / {s.podTotal}
              </span>
              <span className={styles.sub}>
                {t('pages.k8s.overview.abnormalPods')}
              </span>
            </Link>
          </div>
          <Meter
            label="CPU"
            used={s.cpuRequested}
            total={s.cpuAllocatable}
            unit="cores"
          />
          <Meter
            label={t('pages.k8s.overview.memory')}
            used={s.memoryRequested}
            total={s.memoryAllocatable}
            unit="bytes"
          />
          <div className={styles.sub} style={{ marginTop: 6 }}>
            {t('pages.k8s.overview.requested')}
            {s.partial && ` · ${t('pages.k8s.overview.partial')}`}
            {cluster.summaryTime && (
              <>
                {' · '}
                {t('pages.k8s.overview.updated')}{' '}
                <AgeText value={cluster.summaryTime} />
              </>
            )}
          </div>
          {(problems.length > 0 || (s.restartPods ?? []).length > 0) && (
            <div className={styles.list}>
              {problems.slice(0, 5).map((item) => (
                <div
                  key={`${item.kind}/${item.namespace}/${item.name}`}
                  className={styles.item}
                >
                  <Link
                    className={styles.ellipsis}
                    to={itemLink(cluster.id, item)}
                  >
                    <Badge status="error" /> {item.kind}{' '}
                    {item.namespace ? `${item.namespace}/` : ''}
                    {item.name}
                  </Link>
                  <span className={styles.itemText}>{item.text}</span>
                </div>
              ))}
              {(s.restartPods ?? []).slice(0, 3).map((item) => (
                <div
                  key={`r/${item.namespace}/${item.name}`}
                  className={styles.item}
                >
                  <Link
                    className={styles.ellipsis}
                    to={itemLink(cluster.id, item)}
                  >
                    <Badge status="warning" /> Pod {item.namespace}/{item.name}
                  </Link>
                  <span className={styles.itemText}>
                    {t('pages.k8s.overview.restarts', {
                      count: item.value ?? 0,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
          {cluster.hasDatasource && cluster.status === 1 && (
            <div style={{ marginTop: 12 }}>
              <MetricsPanel
                compact
                clusterId={cluster.id}
                target={{ kind: 'cluster' }}
                panels={['cpu']}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EventList: React.FC<{ events: ClusterEvent[] }> = ({ events }) => {
  const t = useT();
  const { styles } = useStyles();
  if (events.length === 0) {
    return (
      <div className={styles.card}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.k8s.overview.noEvents')}
        />
      </div>
    );
  }
  return (
    <div className={styles.card}>
      {events.map((e) => {
        const to = eventLink(e);
        const object = `${e.kind}/${e.namespace ? `${e.namespace}/` : ''}${e.name}`;
        return (
          <div key={e.id} className={styles.eventRow}>
            <AgeText value={e.lastTime} />
            <span className={styles.ellipsis}>{e.clusterName}</span>
            <span>
              <Tag color="warning">{e.reason}</Tag>
            </span>
            <span className={styles.ellipsis} title={e.message}>
              {to ? <Link to={to}>{object}</Link> : object}　{e.message}
            </span>
            <span style={{ textAlign: 'right' }}>×{e.count}</span>
          </div>
        );
      })}
    </div>
  );
};

const OverviewBody: React.FC = () => {
  const t = useT();
  const { styles } = useStyles();
  const [data, setData] = useState<Overview>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  // background = 定时轮询：不显示加载态；失败时保留已有数据（不反复报错），页面不可见时跳过
  const load = useCallback(async (background = false) => {
    if (background && document.visibilityState !== 'visible') return;
    if (!background) setLoading(true);
    try {
      setData(await getOverview());
      setError(undefined);
    } catch (err) {
      if (!background) setError(getK8sErrorMessage(err));
    } finally {
      if (!background) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (error) return <Alert type="error" showIcon title={error} />;
  if (!data) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  const clusters = data.clusters ?? [];
  return (
    <>
      <div className={styles.head}>
        <SectionTitle>{t('pages.k8s.overview.clusters')}</SectionTitle>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => void load()}
        />
      </div>
      {clusters.length === 0 ? (
        <Empty description={t('pages.k8s.overview.noCluster')} />
      ) : (
        <div className={styles.grid}>
          {clusters.map((c) => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      )}
      <div className={styles.head}>
        <SectionTitle>{t('pages.k8s.overview.events')}</SectionTitle>
        <Link to="/k8s/event">{t('pages.k8s.overview.allEvents')}</Link>
      </div>
      <EventList events={data.events ?? []} />
    </>
  );
};

const OverviewPage: React.FC = () => (
  <K8sPage
    tabs={[
      {
        key: 'overview',
        label: '',
        scope: 'none',
        render: () => <OverviewBody />,
      },
    ]}
  />
);

export default OverviewPage;
