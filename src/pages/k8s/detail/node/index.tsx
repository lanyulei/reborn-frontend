/**
 * 节点详情：基本信息 │ 运行状态（健康状态、污点）│ 容器组 │ 元数据 │ 事件 │ 监控 │ YAML。
 * 「操作」：停止 / 启用调度、排空、编辑标签与污点、编辑 YAML。
 */
import { ProDescriptions } from '@ant-design/pro-components';
import { useMemo, useState } from 'react';
import type { K8sObject, ResourceRef } from '@/services/k8s/typings';
import { type Translate, useT } from '@/utils/i18n';
import { formatTime } from '../../components/cells';
import { NodeHost } from '../../components/Insight';
import { MetricsPanel } from '../../components/MetricsPanel';
import { GVRS } from '../../components/meta';
import DetailShell from '../shared/DetailShell';
import EventTable from '../shared/EventTable';
import Metadata from '../shared/Metadata';
import PodList from '../shared/PodList';
import StatusDot, { type StatusType } from '../shared/StatusDot';
import useObject from '../shared/useObject';
import Capacity from './Capacity';
import RunningStatus, { type NodeRunningView } from './RunningStatus';

type NodeDetailProps = {
  clusterId: string;
  name: string;
  tab?: string;
};

const ROLE_PREFIX = 'node-role.kubernetes.io/';

const getNodeRoleLabel = (t: Translate, role: string) => {
  if (role === 'control-plane' || role === 'master') {
    return t('pages.k8s.detail.node.role.controlPlane');
  }
  if (role === 'worker') {
    return t('pages.k8s.detail.node.role.worker');
  }
  return role;
};

const nodeRoles = (t: Translate, object?: K8sObject) => {
  const roles = Object.keys(object?.metadata?.labels ?? {})
    .filter((key) => key.startsWith(ROLE_PREFIX))
    .map((key) => key.slice(ROLE_PREFIX.length))
    .filter(Boolean);
  // 没有角色标签的节点就是工作节点
  return (roles.length > 0 ? roles : ['worker']).map((role) =>
    getNodeRoleLabel(t, role),
  );
};

const nodeStatus = (
  t: Translate,
  object?: K8sObject,
): { label: string; type: StatusType } => {
  const conditions: NodeRunningView['conditions'] = Array.isArray(
    object?.status?.conditions,
  )
    ? object.status.conditions
    : [];
  const ready = conditions?.find((item) => item.type === 'Ready')?.status;
  if (ready === 'Unknown' || ready === undefined) {
    return { label: t('pages.k8s.state.unknown'), type: 'error' };
  }
  if (ready !== 'True') {
    return { label: t('pages.k8s.state.abnormal'), type: 'error' };
  }
  if (object?.spec?.unschedulable === true) {
    return {
      label: t('pages.k8s.detail.status.schedulingDisabled'),
      type: 'warning',
    };
  }
  return { label: t('pages.k8s.metrics.series.running'), type: 'success' };
};

const addressOf = (object: K8sObject | undefined, type: string) => {
  const addresses: { type?: string; address?: string }[] = Array.isArray(
    object?.status?.addresses,
  )
    ? object.status.addresses
    : [];
  return addresses.find((item) => item.type === type)?.address;
};

const NodeDetail = ({ clusterId, name, tab: initialTab }: NodeDetailProps) => {
  const t = useT();
  const ref = useMemo<ResourceRef>(() => ({ ...GVRS.node, name }), [name]);
  const { data, loading, error } = useObject(clusterId, ref);
  const [tab, setTab] = useState(initialTab ?? 'status');
  const object = data?.object;
  const info = (object?.status?.nodeInfo ?? {}) as Record<string, string>;
  const status = nodeStatus(t, object);
  const internalIP = addressOf(object, 'InternalIP');
  const running: NodeRunningView = {
    conditions: Array.isArray(object?.status?.conditions)
      ? object.status.conditions
      : [],
    taints: Array.isArray(object?.spec?.taints) ? object.spec.taints : [],
  };
  const text = (value?: string) => value || '-';

  return (
    <DetailShell
      loading={loading}
      error={error}
      ready={Boolean(object)}
      emptyText={t('pages.k8s.detail.node.notFound')}
      activeTab={tab}
      onTabChange={setTab}
      basicInfo={
        <ProDescriptions
          column={3}
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
                <StatusDot label={status.label} type={status.type} />
              ),
            },
            {
              title: t('pages.k8s.detail.ip'),
              key: 'ip',
              render: () => text(internalIP || addressOf(object, 'ExternalIP')),
            },
            {
              title: t('pages.k8s.kind.Role'),
              key: 'roles',
              render: () => nodeRoles(t, object).join('、'),
            },
            {
              title: t('pages.k8s.detail.node.osImage'),
              key: 'osImage',
              render: () => text(info.osImage),
            },
            {
              title: t('pages.k8s.detail.node.os'),
              key: 'os',
              render: () => text(info.operatingSystem),
            },
            {
              title: t('pages.k8s.detail.node.kernel'),
              key: 'kernel',
              render: () => text(info.kernelVersion),
            },
            {
              title: t('pages.k8s.detail.node.runtime'),
              key: 'runtime',
              render: () => text(info.containerRuntimeVersion),
            },
            {
              title: t('pages.k8s.detail.node.kubelet'),
              key: 'kubelet',
              render: () => text(info.kubeletVersion),
            },
            {
              title: t('pages.k8s.detail.node.kubeProxy'),
              key: 'kubeProxy',
              render: () => text(info.kubeProxyVersion),
            },
            {
              title: t('pages.k8s.detail.node.arch'),
              key: 'arch',
              render: () => text(info.architecture),
            },
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
          key: 'status',
          label: t('pages.k8s.detail.node.tab.status'),
          children: (
            <>
              <RunningStatus node={running} />
              <NodeHost clusterId={clusterId} ip={internalIP} />
            </>
          ),
        },
        {
          key: 'capacity',
          label: t('pages.k8s.detail.node.tab.capacity'),
          children: (
            <Capacity clusterId={clusterId} name={name} object={object} />
          ),
        },
        {
          key: 'pods',
          label: t('pages.k8s.kind.Pod'),
          children: <PodList clusterId={clusterId} fixed={{ node: name }} />,
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
        {
          key: 'metrics',
          label: t('pages.k8s.detail.tab.metrics'),
          children: (
            <MetricsPanel
              clusterId={clusterId}
              target={{ kind: 'node', name }}
            />
          ),
        },
      ]}
    ></DetailShell>
  );
};

export default NodeDetail;
