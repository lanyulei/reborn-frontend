/**
 * 节点详情：基本信息 │ 运行状态（健康状态、污点）│ 容器组 │ 元数据 │ 事件 │ 监控 │ YAML。
 * 「操作」：停止 / 启用调度、排空、编辑标签与污点、编辑 YAML。
 */
import { ProDescriptions } from '@ant-design/pro-components';
import { useMemo, useState } from 'react';
import type { K8sObject, ResourceRef } from '@/services/k8s/typings';
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

const getNodeRoleLabel = (role: string) => {
  if (role === 'control-plane' || role === 'master') {
    return '控制平面节点';
  }
  if (role === 'worker') {
    return '工作节点';
  }
  return role;
};

const nodeRoles = (object?: K8sObject) => {
  const roles = Object.keys(object?.metadata?.labels ?? {})
    .filter((key) => key.startsWith(ROLE_PREFIX))
    .map((key) => key.slice(ROLE_PREFIX.length))
    .filter(Boolean);
  // 没有角色标签的节点就是工作节点
  return (roles.length > 0 ? roles : ['worker']).map(getNodeRoleLabel);
};

const nodeStatus = (
  object?: K8sObject,
): { label: string; type: StatusType } => {
  const conditions: NodeRunningView['conditions'] = Array.isArray(
    object?.status?.conditions,
  )
    ? object.status.conditions
    : [];
  const ready = conditions?.find((item) => item.type === 'Ready')?.status;
  if (ready === 'Unknown' || ready === undefined) {
    return { label: '未知', type: 'error' };
  }
  if (ready !== 'True') {
    return { label: '异常', type: 'error' };
  }
  if (object?.spec?.unschedulable === true) {
    return { label: '已禁止调度', type: 'warning' };
  }
  return { label: '运行中', type: 'success' };
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
  const ref = useMemo<ResourceRef>(() => ({ ...GVRS.node, name }), [name]);
  const { data, loading, error } = useObject(clusterId, ref);
  const [tab, setTab] = useState(initialTab ?? 'status');
  const object = data?.object;
  const info = (object?.status?.nodeInfo ?? {}) as Record<string, string>;
  const status = nodeStatus(object);
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
      emptyText="未找到节点"
      activeTab={tab}
      onTabChange={setTab}
      basicInfo={
        <ProDescriptions
          column={3}
          style={{ flex: 1, minWidth: 420 }}
          dataSource={{ name }}
          columns={[
            { title: '名称', dataIndex: 'name', copyable: true },
            {
              title: '状态',
              key: 'status',
              render: () => (
                <StatusDot label={status.label} type={status.type} />
              ),
            },
            {
              title: 'IP 地址',
              key: 'ip',
              render: () => text(internalIP || addressOf(object, 'ExternalIP')),
            },
            {
              title: '角色',
              key: 'roles',
              render: () => nodeRoles(object).join('、'),
            },
            {
              title: '操作系统版本',
              key: 'osImage',
              render: () => text(info.osImage),
            },
            {
              title: '操作系统类型',
              key: 'os',
              render: () => text(info.operatingSystem),
            },
            {
              title: '内核版本',
              key: 'kernel',
              render: () => text(info.kernelVersion),
            },
            {
              title: '容器运行时',
              key: 'runtime',
              render: () => text(info.containerRuntimeVersion),
            },
            {
              title: 'kubelet 版本',
              key: 'kubelet',
              render: () => text(info.kubeletVersion),
            },
            {
              title: 'kube-proxy 版本',
              key: 'kubeProxy',
              render: () => text(info.kubeProxyVersion),
            },
            {
              title: '系统架构',
              key: 'arch',
              render: () => text(info.architecture),
            },
            {
              title: '创建时间',
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
          label: '运行状态',
          children: (
            <>
              <RunningStatus node={running} />
              <NodeHost clusterId={clusterId} ip={internalIP} />
            </>
          ),
        },
        {
          key: 'capacity',
          label: '资源用量',
          children: (
            <Capacity clusterId={clusterId} name={name} object={object} />
          ),
        },
        {
          key: 'pods',
          label: '容器组',
          children: <PodList clusterId={clusterId} fixed={{ node: name }} />,
        },
        {
          key: 'metadata',
          label: '元数据',
          children: (
            <Metadata
              labels={object?.metadata?.labels}
              annotations={object?.metadata?.annotations}
            />
          ),
        },
        {
          key: 'events',
          label: '事件',
          children: <EventTable clusterId={clusterId} compact target={ref} />,
        },
        {
          key: 'metrics',
          label: '监控',
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
