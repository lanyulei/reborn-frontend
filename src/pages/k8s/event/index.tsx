/**
 * 事件（只读）：跨集群的 Warning 事件检索。K8s 事件缺省只保留 1 小时，这里是数据面采集后落库的记录：
 * 同一集群同一对象同一原因一行，重复发生累加次数；保留 7 天。只显示当前用户数据范围内的事件。
 */
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Tag, Typography } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { listClusterOptions } from '@/services/k8s/cluster';
import { type ClusterEvent, listEvents } from '@/services/k8s/insight';
import { useT } from '@/utils/i18n';
import { timeRangeColumn, toTableResult } from '@/utils/table';
import { formatTime } from '../components/cells';
import { OPS_TABS } from '../components/groups';
import { kindPath, useKindName } from '../components/meta';
import { K8sPage } from '../components/scope';
import { useK8sStyles } from '../components/styles';

/** 事件关联对象可跳转到资源列表页的类型；其余只展示文字 */
const LINK_KINDS = new Set([
  'Pod',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'Job',
  'CronJob',
  'Node',
]);

/** 事件对象所在页面的链接（带上集群与命名空间） */
export const eventLink = (e: {
  clusterId: string;
  namespace?: string;
  kind?: string;
}): string | undefined =>
  LINK_KINDS.has(e.kind ?? '')
    ? kindPath(e.kind, e.clusterId, e.namespace)
    : undefined;

const Events: React.FC = () => {
  const t = useT();
  const kindName = useKindName();
  const { styles } = useK8sStyles();
  const [clusters, setClusters] = useState<Record<string, { text: string }>>(
    {},
  );
  useEffect(() => {
    listClusterOptions({ silent: true })
      .then((res) =>
        setClusters(
          Object.fromEntries(
            (res.items ?? []).map((c) => [
              c.id,
              {
                text: c.displayName ? `${c.displayName}（${c.name}）` : c.name,
              },
            ]),
          ),
        ),
      )
      .catch(() => undefined);
  }, []);

  const columns = useMemo<ProColumns<ClusterEvent>[]>(
    () => [
      timeRangeColumn<ClusterEvent>(t, {
        start: 'lastTimeStart',
        end: 'lastTimeEnd',
      }),
      {
        title: t('pages.k8s.event.lastTime'),
        dataIndex: 'lastTime',
        search: false,
        width: 170,
        render: (_, r) => formatTime(r.lastTime),
      },
      {
        title: t('pages.k8s.event.cluster'),
        dataIndex: 'clusterId',
        valueType: 'select',
        valueEnum: clusters,
        fieldProps: { showSearch: true },
        render: (_, r) => r.clusterName,
      },
      {
        title: t('pages.k8s.column.namespace'),
        dataIndex: 'namespace',
        render: (_, r) => r.namespace || '-',
      },
      {
        title: t('pages.k8s.event.kind'),
        dataIndex: 'kind',
        width: 120,
        render: (_, r) => kindName(r.kind),
      },
      {
        title: t('pages.k8s.event.object'),
        dataIndex: 'name',
        render: (_, r) => {
          const to = eventLink(r);
          return to ? (
            <Link className={styles.code} to={to}>
              {r.name}
            </Link>
          ) : (
            <span className={styles.code}>{r.name}</span>
          );
        },
      },
      {
        title: t('pages.k8s.event.reason'),
        dataIndex: 'reason',
        render: (_, r) => <Tag color="warning">{r.reason}</Tag>,
      },
      {
        title: t('pages.k8s.event.count'),
        dataIndex: 'count',
        search: false,
        width: 80,
        align: 'right',
      },
      {
        title: t('pages.k8s.event.message'),
        dataIndex: 'message',
        search: false,
        width: 420,
        render: (_, r) => (
          <Typography.Paragraph
            style={{ marginBottom: 0, maxWidth: 420 }}
            ellipsis={{ rows: 2, tooltip: r.message }}
          >
            {r.message}
          </Typography.Paragraph>
        ),
      },
      {
        title: t('pages.k8s.event.firstTime'),
        dataIndex: 'firstTime',
        search: false,
        width: 170,
        render: (_, r) => formatTime(r.firstTime),
      },
      {
        title: t('common.column.keyword'),
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: t('pages.k8s.event.keyword.placeholder') },
      },
    ],
    [t, clusters, styles.code],
  );

  return (
    <ProTable<ClusterEvent>
      cardBordered
      rowKey="id"
      search={{ labelWidth: 'auto' }}
      columns={columns}
      scroll={{ x: 'max-content' }}
      request={async (params) =>
        toTableResult(
          await listEvents({
            page: params.current,
            pageSize: params.pageSize,
            lastTimeStart: params.lastTimeStart,
            lastTimeEnd: params.lastTimeEnd,
            clusterId: params.clusterId || undefined,
            namespace: params.namespace?.trim() || undefined,
            kind: params.kind?.trim() || undefined,
            name: params.name?.trim() || undefined,
            reason: params.reason?.trim() || undefined,
            keyword: params.keyword?.trim() || undefined,
          }),
        )
      }
    />
  );
};

const EventPage: React.FC = () => (
  <K8sPage
    group={OPS_TABS}
    tabs={[
      { key: 'event', label: '', scope: 'none', render: () => <Events /> },
    ]}
  />
);

export default EventPage;
