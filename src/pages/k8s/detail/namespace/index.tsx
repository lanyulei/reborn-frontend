/**
 * 命名空间详情：基本信息 │ 概览（各类资源数量）│ 容器组 │ 配额 │ 元数据 │ 事件 │ YAML。
 * 「操作」：配额与默认容器配额、编辑 YAML、删除。
 */
import { ProDescriptions } from '@ant-design/pro-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listResources } from '@/services/k8s/resource';
import type { GVR, ResourceRef } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { formatTime } from '../../components/cells';
import { GVRS } from '../../components/meta';
import { fetchObject, listRows } from '../../forms/shared/kube';
import DetailShell from '../shared/DetailShell';
import EventTable from '../shared/EventTable';
import Metadata from '../shared/Metadata';
import PodList from '../shared/PodList';
import StatusDot from '../shared/StatusDot';
import useObject from '../shared/useObject';
import {
  buildQuotaSummary,
  EMPTY_QUOTA_SUMMARY,
  getNamespaceStatusLabel,
  getNamespaceStatusType,
  type NamespaceQuotaSummary,
  type NamespaceResourceStatus,
} from './helpers';
import QuotaOverview from './QuotaOverview';
import ResourceOverview from './ResourceOverview';

type NamespaceDetailProps = {
  clusterId: string;
  name: string;
  tab?: string;
};

const QUOTA: GVR = { group: '', version: 'v1', resource: 'resourcequotas' };
const LIMIT_RANGE: GVR = { group: '', version: 'v1', resource: 'limitranges' };

const COUNTED: [keyof NamespaceResourceStatus, GVR][] = [
  ['pods', GVRS.pod],
  ['deployments', GVRS.deployment],
  ['statefulsets', GVRS.statefulSet],
  ['daemonsets', GVRS.daemonSet],
  ['jobs', GVRS.job],
  ['cronjobs', GVRS.cronJob],
  ['persistentVolumeClaims', GVRS.pvc],
  ['services', GVRS.service],
  ['ingresses', GVRS.ingress],
];

/** 某类资源在命名空间里的数量；取不到（无权限、未缓存的类型）为 undefined */
const countOf = async (clusterId: string, gvr: GVR, namespace: string) => {
  try {
    const res = await listResources(
      clusterId,
      { ...gvr, namespace, pageSize: 1 },
      { silent: true },
    );
    return res.total >= 0 ? res.total : undefined;
  } catch {
    return undefined;
  }
};

const NamespaceDetail = ({
  clusterId,
  name,
  tab: initialTab,
}: NamespaceDetailProps) => {
  const t = useT();
  const ref = useMemo<ResourceRef>(() => ({ ...GVRS.namespace, name }), [name]);
  const { data, loading, error } = useObject(clusterId, ref);
  const [tab, setTab] = useState(initialTab ?? 'overview');
  const [statusLoading, setStatusLoading] = useState(true);
  const [resourceStatus, setResourceStatus] = useState<NamespaceResourceStatus>(
    {},
  );
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaSummary, setQuotaSummary] =
    useState<NamespaceQuotaSummary>(EMPTY_QUOTA_SUMMARY);
  const object = data?.object;

  const fetchResourceStatus = useCallback(async () => {
    setStatusLoading(true);
    const counts = await Promise.all(
      COUNTED.map(([, gvr]) => countOf(clusterId, gvr, name)),
    );
    setResourceStatus(
      Object.fromEntries(COUNTED.map(([key], index) => [key, counts[index]])),
    );
    setStatusLoading(false);
  }, [clusterId, name]);

  const fetchQuotaSummary = useCallback(async () => {
    setQuotaLoading(true);
    const objectsOf = async (gvr: GVR) => {
      const rows = await listRows(clusterId, gvr, name);
      const objects = await Promise.all(
        rows.map((row) => fetchObject(clusterId, gvr, row.name, name)),
      );
      return objects.filter((item) => item !== undefined);
    };
    const [quotas, limitRanges] = await Promise.all([
      objectsOf(QUOTA),
      objectsOf(LIMIT_RANGE),
    ]);
    setQuotaSummary(buildQuotaSummary(quotas, limitRanges));
    setQuotaLoading(false);
  }, [clusterId, name]);

  useEffect(() => {
    void fetchResourceStatus();
    void fetchQuotaSummary();
  }, [fetchResourceStatus, fetchQuotaSummary]);

  const phase = object?.metadata?.deletionTimestamp
    ? 'Terminating'
    : (object?.status?.phase as string | undefined);

  return (
    <DetailShell
      loading={loading}
      error={error}
      ready={Boolean(object)}
      emptyText={t('pages.k8s.detail.namespace.notFound')}
      activeTab={tab}
      onTabChange={setTab}
      basicInfo={
        <ProDescriptions
          column={2}
          style={{ flex: 1, minWidth: 420 }}
          dataSource={{ name }}
          columns={[
            {
              title: t('pages.k8s.column.name'),
              dataIndex: 'name',
              copyable: true,
            },
            {
              title: t('common.column.status'),
              key: 'status',
              render: () => (
                <StatusDot
                  label={getNamespaceStatusLabel(phase)}
                  type={getNamespaceStatusType(phase)}
                />
              ),
            },
            { title: 'UID', key: 'uid', render: () => data?.uid || '-' },
            {
              title: t('common.column.createTime'),
              key: 'createTime',
              render: () =>
                formatTime(object?.metadata?.creationTimestamp) || '-',
            },
          ]}
        />
      }
      tabs={[
        {
          key: 'overview',
          label: t('pages.k8s.detail.tab.overview'),
          children: (
            <ResourceOverview
              loading={statusLoading}
              resourceStatus={resourceStatus}
            />
          ),
        },
        {
          key: 'pods',
          label: t('pages.k8s.kind.Pod'),
          children: <PodList clusterId={clusterId} namespace={name} />,
        },
        {
          key: 'quota',
          label: t('pages.k8s.action.quota'),
          children: (
            <QuotaOverview loading={quotaLoading} quotaSummary={quotaSummary} />
          ),
        },
        {
          key: 'metadata',
          label: t('pages.k8s.detail.tab.metadata'),
          children: (
            <Metadata
              labels={object?.metadata?.labels}
              annotations={object?.metadata?.annotations}
            />
          ),
        },
        {
          key: 'events',
          label: t('pages.k8s.detail.tab.events'),
          children: <EventTable clusterId={clusterId} compact target={ref} />,
        },
      ]}
    ></DetailShell>
  );
};

export default NamespaceDetail;
