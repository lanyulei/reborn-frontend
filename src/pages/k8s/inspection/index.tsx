/**
 * 巡检：数据面每天对每个集群做一次检查（也可手动触发），这里展示最近的巡检记录、得分趋势与发现项。
 * 只有部分命名空间授权的用户只看到这些命名空间与集群级的发现项。
 */
import { PlayCircleOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Collapse,
  Empty,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getInspectionRun,
  type InspectionFinding,
  type InspectionRun,
  listInspectionRuns,
  runInspection,
} from '@/services/k8s/governance';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { formatTime } from '../components/cells';
import { OPS_TABS } from '../components/groups';
import { K8sPage, useK8sScope } from '../components/scope';
import { useK8sStyles } from '../components/styles';

/** 检查项文案；前端不认识的检查项（后端新增）退回显示其代码 */
const checkText = (
  t: (id: string) => string,
  id: string,
  fallback: string,
): string => {
  const text = t(id);
  return text === id ? fallback : text;
};

const useStyles = createStyles(({ token, css }) => ({
  summary: css`
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
  `,
  tile: css`
    flex: 1 1 150px;
    min-width: 150px;
    padding: 16px 20px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  tileLabel: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  tileValue: css`
    margin-top: 4px;
    font-size: ${token.fontSizeHeading2}px;
    font-weight: 600;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  `,
  delta: css`
    margin-inline-start: 8px;
    font-size: ${token.fontSizeSM}px;
    font-weight: 400;
  `,
  trend: css`
    display: block;
    margin-top: 8px;
  `,
}));

/** 发现项对象 → 资源页（带集群与命名空间）；其余类型只展示文字 */
const KIND_PAGE: Record<string, string> = {
  Pod: '/k8s/workload?tab=pod',
  Deployment: '/k8s/workload?tab=deployment',
  StatefulSet: '/k8s/workload?tab=statefulset',
  DaemonSet: '/k8s/workload?tab=daemonset',
  Job: '/k8s/workload?tab=job',
  Node: '/k8s/cluster?tab=node',
  Secret: '/k8s/config?tab=secret',
  PersistentVolumeClaim: '/k8s/config?tab=storage',
};

const SEVERITY_COLOR: Record<number, string> = {
  3: 'error',
  2: 'warning',
  1: 'default',
};

const RUNNING = new Set([1, 2]);

/** 得分趋势：最近若干次巡检的得分折线（单系列，颜色取主题主色） */
const ScoreTrend: React.FC<{ runs: InspectionRun[]; color: string }> = ({
  runs,
  color,
}) => {
  const points = runs
    .filter((r) => r.status === 3)
    .slice(0, 20)
    .reverse();
  if (points.length < 2) return null;
  const w = 140;
  const h = 32;
  const xy = points.map((r, i) => {
    const x = (i / (points.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((r.score ?? 0) / 100) * (h - 4);
    return [x, y] as const;
  });
  const last = xy[xy.length - 1];
  return (
    <svg width={w} height={h} role="img" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={xy.map(([x, y]) => `${x},${y}`).join(' ')}
      />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
    </svg>
  );
};

const Inspection: React.FC = () => {
  const t = useT();
  const { message, modal } = App.useApp();
  const has = usePermissions();
  const { styles, theme } = useStyles();
  const { styles: k8sStyles } = useK8sStyles();
  const { clusterId, cluster } = useK8sScope();
  const [params, setParams] = useSearchParams();
  const [runs, setRuns] = useState<InspectionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{
    run: InspectionRun;
    findings: InspectionFinding[];
    scoped: boolean;
  }>();
  const [detailLoading, setDetailLoading] = useState(false);
  const selected = params.get('run') ?? '';

  const loadRuns = useCallback(
    async (silent?: boolean) => {
      try {
        const res = await listInspectionRuns(
          { clusterId, page: 1, pageSize: 30 },
          { silent },
        );
        setRuns(res.items ?? []);
      } catch {
        // 失败已由请求层提示
      } finally {
        setLoading(false);
      }
    },
    [clusterId],
  );
  useEffect(() => {
    setLoading(true);
    void loadRuns();
  }, [loadRuns]);

  // 有待执行 / 执行中的巡检时轮询，直到结束
  const busy = runs.some((r) => RUNNING.has(r.status ?? 0));
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => void loadRuns(true), 4000);
    return () => clearInterval(timer);
  }, [busy, loadRuns]);

  const current = useMemo(
    () =>
      runs.find((r) => r.id === selected) ??
      runs.find((r) => r.status === 3) ??
      runs[0],
    [runs, selected],
  );
  const previous = useMemo(() => {
    if (!current) return undefined;
    const done = runs.filter((r) => r.status === 3);
    return done[done.findIndex((r) => r.id === current.id) + 1];
  }, [runs, current]);

  const currentId = current?.id;
  const currentStatus = current?.status;
  useEffect(() => {
    if (!currentId || currentStatus !== 3) {
      setDetail(undefined);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    getInspectionRun(currentId)
      .then((res) => {
        if (!cancelled) {
          setDetail({
            run: res.run,
            findings: res.findings ?? [],
            scoped: Boolean(res.scoped),
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentId, currentStatus]);

  const start = () =>
    modal.confirm({
      title: t('pages.k8s.inspection.run.title', {
        name: cluster?.name ?? '',
      }),
      content: t('pages.k8s.inspection.run.content'),
      onOk: async () => {
        await runInspection(clusterId);
        message.success(t('pages.k8s.inspection.run.started'));
        await loadRuns(true);
      },
    });

  const delta = (now?: number, before?: number, lowerIsBetter = true) => {
    if (now === undefined || before === undefined || now === before)
      return null;
    const diff = now - before;
    const good = lowerIsBetter ? diff < 0 : diff > 0;
    return (
      <span
        className={styles.delta}
        style={{ color: good ? theme.colorSuccess : theme.colorError }}
      >
        {diff > 0 ? '+' : ''}
        {diff}
      </span>
    );
  };

  const groups = useMemo(() => {
    const by = new Map<string, InspectionFinding[]>();
    for (const f of detail?.findings ?? []) {
      const list = by.get(f.check) ?? [];
      list.push(f);
      by.set(f.check, list);
    }
    return by;
  }, [detail]);

  const link = (f: InspectionFinding): string | undefined => {
    const base = KIND_PAGE[f.kind ?? ''];
    if (!base) return undefined;
    return `${base}&cluster=${encodeURIComponent(clusterId)}${f.namespace ? `&ns=${encodeURIComponent(f.namespace)}` : ''}`;
  };

  if (loading)
    return <Spin style={{ display: 'block', margin: '48px auto' }} />;

  const toolbar = (
    <Space style={{ marginBottom: 16 }} wrap>
      <Select
        style={{ minWidth: 320 }}
        value={current?.id}
        placeholder={t('pages.k8s.inspection.none')}
        options={runs.map((r) => ({
          value: r.id,
          label: `${formatTime(r.createTime)} · ${t(`pages.k8s.inspection.trigger.${r.trigger ?? 1}`)} · ${
            r.status === 3
              ? t('pages.k8s.inspection.score.n', { n: r.score ?? 0 })
              : t(`pages.k8s.inspection.status.${r.status ?? 1}`)
          }`,
        }))}
        onChange={(id) => {
          const next = new URLSearchParams(params);
          next.set('run', id);
          setParams(next, { replace: true });
        }}
      />
      {has('k8s.inspection.run') && (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          disabled={busy || cluster?.status !== 1}
          onClick={start}
        >
          {t('pages.k8s.inspection.run')}
        </Button>
      )}
      {busy && (
        <Tag color="processing">{t('pages.k8s.inspection.running')}</Tag>
      )}
    </Space>
  );

  if (!current) {
    return (
      <>
        {toolbar}
        <Card>
          <Empty description={t('pages.k8s.inspection.empty')} />
        </Card>
      </>
    );
  }

  return (
    <>
      {toolbar}
      {current.status === 4 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('pages.k8s.inspection.failed')}
          description={current.error}
        />
      )}
      {RUNNING.has(current.status ?? 0) && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('pages.k8s.inspection.pending')}
        />
      )}
      {current.status === 3 && (
        <>
          <div className={styles.summary}>
            <div className={styles.tile}>
              <div className={styles.tileLabel}>
                {t('pages.k8s.inspection.score')}
              </div>
              <div className={styles.tileValue}>
                {current.score ?? 0}
                {delta(current.score, previous?.score, false)}
              </div>
              <span className={styles.trend}>
                <ScoreTrend runs={runs} color={theme.colorPrimary} />
              </span>
            </div>
            {(
              [
                ['critical', theme.colorError],
                ['warning', theme.colorWarning],
                ['info', theme.colorTextSecondary],
              ] as const
            ).map(([key, color]) => (
              <div className={styles.tile} key={key}>
                <div className={styles.tileLabel}>
                  {t(`pages.k8s.inspection.severity.${key}`)}
                </div>
                <div className={styles.tileValue} style={{ color }}>
                  {current[key] ?? 0}
                  {delta(current[key], previous?.[key])}
                </div>
              </div>
            ))}
            <div className={styles.tile}>
              <div className={styles.tileLabel}>
                {t('pages.k8s.inspection.objects')}
              </div>
              <Typography.Paragraph style={{ margin: '8px 0 0' }}>
                {t('pages.k8s.inspection.objects.detail', {
                  nodes: current.nodes ?? 0,
                  workloads: current.workloads ?? 0,
                  pods: current.pods ?? 0,
                  certs: current.certs ?? 0,
                })}
              </Typography.Paragraph>
            </div>
          </div>
          {current.partial && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              title={t('pages.k8s.inspection.partial')}
            />
          )}
          {detail?.scoped && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              title={t('pages.k8s.inspection.scoped')}
            />
          )}
          <Card
            title={t('pages.k8s.inspection.findings')}
            loading={detailLoading}
          >
            {(current.checks ?? []).length === 0 ? (
              <Empty description={t('pages.k8s.inspection.clean')} />
            ) : (
              <Collapse
                items={(current.checks ?? []).map((c) => {
                  const list = groups.get(c.check) ?? [];
                  return {
                    key: c.check,
                    label: (
                      <Space>
                        <Tag color={SEVERITY_COLOR[c.severity]}>
                          {t(
                            `pages.k8s.inspection.severity.${c.severity === 3 ? 'critical' : c.severity === 2 ? 'warning' : 'info'}`,
                          )}
                        </Tag>
                        <span>
                          {checkText(
                            t,
                            `pages.k8s.inspection.check.${c.check}`,
                            c.check,
                          )}
                        </span>
                        <Typography.Text type="secondary">
                          {c.count ?? 0}
                        </Typography.Text>
                      </Space>
                    ),
                    children: (
                      <>
                        <Typography.Paragraph type="secondary">
                          {checkText(
                            t,
                            `pages.k8s.inspection.check.${c.check}.desc`,
                            '',
                          )}
                        </Typography.Paragraph>
                        <Table<InspectionFinding>
                          size="small"
                          rowKey={(f) => `${f.namespace}/${f.kind}/${f.name}`}
                          dataSource={list}
                          pagination={
                            list.length > 20 ? { pageSize: 20 } : false
                          }
                          footer={
                            (c.count ?? 0) > list.length
                              ? () =>
                                  t('pages.k8s.inspection.more', {
                                    shown: list.length,
                                    total: c.count ?? 0,
                                  })
                              : undefined
                          }
                          columns={[
                            {
                              title: t('pages.k8s.column.namespace'),
                              dataIndex: 'namespace',
                              width: 180,
                              render: (v: string) => v || t('common.empty'),
                            },
                            {
                              title: t('pages.k8s.event.kind'),
                              dataIndex: 'kind',
                              width: 170,
                            },
                            {
                              title: t('pages.k8s.event.object'),
                              dataIndex: 'name',
                              render: (_, f) => {
                                const to = link(f);
                                return to ? (
                                  <Link className={k8sStyles.code} to={to}>
                                    {f.name}
                                  </Link>
                                ) : (
                                  <span className={k8sStyles.code}>
                                    {f.name}
                                  </span>
                                );
                              },
                            },
                            {
                              title: t('pages.k8s.inspection.message'),
                              dataIndex: 'message',
                            },
                          ]}
                        />
                      </>
                    ),
                  };
                })}
              />
            )}
          </Card>
        </>
      )}
    </>
  );
};

const InspectionPage: React.FC = () => (
  <K8sPage
    group={OPS_TABS}
    tabs={[
      {
        key: 'inspection',
        label: '',
        scope: 'cluster',
        render: () => <Inspection />,
      },
    ]}
  />
);

export default InspectionPage;
