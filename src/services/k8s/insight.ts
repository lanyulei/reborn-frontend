/**
 * K8sInsightService 可观测（只读）：总览、Warning 事件、指标面板、关联关系、诊断摘要、与 CMDB 主机的关联。
 * 全部接口都按调用者的数据范围过滤或判定。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { clusterPath, k8sRequest } from './request';
import type { ClusterStatus, ResourceRef, RowState } from './typings';

export interface SummaryItem {
  namespace?: string;
  kind?: string;
  name: string;
  text?: string;
  value?: number;
}

/** 集群总览摘要（k8scontract.ClusterSummary）：CPU 为毫核，内存为字节 */
export interface ClusterSummary {
  nodeTotal: number;
  nodeReady: number;
  nodeCordoned: number;
  cpuAllocatable: number;
  cpuRequested: number;
  memoryAllocatable: number;
  memoryRequested: number;
  podCapacity: number;
  pods: Partial<Record<RowState, number>> | null;
  podTotal: number;
  workloadTotal: number;
  workloadAbnormal: number;
  abnormalWorkloads: SummaryItem[] | null;
  restartPods: SummaryItem[] | null;
  abnormalNodes: SummaryItem[] | null;
  partial?: boolean;
  durationMs: number;
}

export interface OverviewCluster {
  id: string;
  name: string;
  displayName: string;
  env: string;
  status: ClusterStatus;
  lastError: string;
  k8sVersion: string;
  level: number;
  hasDatasource: boolean;
  summaryTime: string | null;
  summary: ClusterSummary | null;
}

/** 一条 Warning 事件（同一集群同一对象同一原因一行） */
export interface ClusterEvent {
  id: string;
  clusterId: string;
  clusterName: string;
  namespace: string;
  kind: string;
  name: string;
  reason: string;
  message: string;
  source: string;
  count: number;
  firstTime: string;
  lastTime: string;
}

export interface Overview {
  clusters: OverviewCluster[] | null;
  events: ClusterEvent[] | null;
}

export const getOverview = () =>
  k8sRequest<Overview>('/api/v1/k8s/overview', {
    method: 'GET',
    silent: true,
  });

export interface ListEventsParams extends PageQuery {
  lastTimeStart?: string;
  lastTimeEnd?: string;
  clusterId?: string;
  namespace?: string;
  kind?: string;
  name?: string;
  reason?: string;
  keyword?: string;
}

export const listEvents = (params: ListEventsParams) =>
  k8sRequest<PagedResult<ClusterEvent>>('/api/v1/k8s/event', {
    method: 'GET',
    params,
  });

export type MetricsTarget =
  | { kind: 'cluster' }
  | { kind: 'node'; name: string }
  | { kind: 'pod'; namespace: string; name: string }
  | {
      kind: 'workload';
      namespace: string;
      name: string;
      workloadKind: 'Deployment' | 'StatefulSet' | 'DaemonSet';
    };

export type MetricUnit = 'cores' | 'bytes' | 'percent' | 'bps' | 'count';

export interface MetricSeries {
  name: string;
  /** [Unix 秒, 值] */
  points: [number, number][] | null;
}

export interface MetricPanel {
  id: string;
  title: string;
  unit: MetricUnit;
  series: MetricSeries[] | null;
  error?: string;
}

export interface MetricsResult {
  /** 集群是否已关联监控数据源 */
  configured: boolean;
  start: string;
  end: string;
  stepSeconds: number;
  panels: MetricPanel[] | null;
}

export const queryMetrics = (
  clusterId: string,
  target: MetricsTarget,
  range: { start: string; end: string },
  panels?: string[],
) =>
  k8sRequest<MetricsResult>(clusterPath(clusterId, '/metrics:query'), {
    method: 'POST',
    data: { target, panels, ...range },
    silent: true,
  });

export interface HostLocation {
  clusterId: string;
  clusterName: string;
  displayName: string;
  node: string;
  state: RowState;
  status: string;
  pods: number;
  workloads: { namespace: string; kind: string; name: string; pods: number }[];
  truncated?: boolean;
}

/** 按内网 IP 在可见集群里查找节点（CMDB 主机详情页用）；失败静默 */
export const locateHost = (ip: string) =>
  k8sRequest<{ items: HostLocation[] | null }>('/api/v1/k8s/host-location', {
    method: 'GET',
    params: { ip },
    silent: true,
  });

export interface HostCI {
  id: string;
  name: string;
  modelCode: string;
  modelName: string;
  env: string;
  status: string;
  owner: string;
  ownerName: string;
}

/** 节点对应的 CMDB 主机资源；没有 CMDB 权限或没有匹配时为空 */
export const getNodeHost = (clusterId: string, ip: string) =>
  k8sRequest<{ items: HostCI[] | null }>(clusterPath(clusterId, '/node-host'), {
    method: 'GET',
    params: { ip },
    silent: true,
  });

export interface PodSelector {
  namespace: string;
  labelSelector: string;
  /** 对象没有选择器（不选中任何 Pod） */
  empty: boolean;
}

export const getPodSelector = (clusterId: string, ref: ResourceRef) =>
  k8sRequest<PodSelector>(clusterPath(clusterId, '/selector'), {
    method: 'GET',
    params: ref,
    silent: true,
  });

export interface RelationPod {
  name: string;
  ready: boolean;
  status: string;
  node?: string;
  ip?: string;
}

export type RelationProblem =
  | 'not_found'
  | 'no_selector'
  | 'no_pods'
  | 'not_ready'
  | 'port_mismatch';

export interface RelationService {
  name: string;
  port?: string;
  type?: string;
  state: RowState;
  problem?: RelationProblem;
  selector?: string;
  readyPods: number;
  totalPods: number;
  pods: RelationPod[] | null;
  podsOmitted?: number;
}

export interface Reference {
  ref: Required<ResourceRef>;
  kind: string;
  via: string[];
  restartable: boolean;
}

export interface Relations {
  rules?: { host: string; path: string; service: RelationService }[];
  service?: RelationService;
  references?: Reference[];
  truncated?: boolean;
}

export const getRelations = (clusterId: string, ref: ResourceRef) =>
  k8sRequest<Relations>(clusterPath(clusterId, '/relation'), {
    method: 'GET',
    params: ref,
    silent: true,
  });
