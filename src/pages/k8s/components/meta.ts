/** 容器平台页面共享的常量：资源类型、状态与档位元数据、元素权限归属。 */

import type { GVR, RowState, ScopeLevel } from '@/services/k8s/typings';
import type { ElementPermissionCode } from '@/services/system/permissions';

const gvr = (group: string, version: string, resource: string): GVR => ({
  group,
  version,
  resource,
});

/** 定制页面用到的资源类型（与 kit/k8scontract/resources.go 一致） */
export const GVRS = {
  pod: gvr('', 'v1', 'pods'),
  node: gvr('', 'v1', 'nodes'),
  namespace: gvr('', 'v1', 'namespaces'),
  service: gvr('', 'v1', 'services'),
  configMap: gvr('', 'v1', 'configmaps'),
  secret: gvr('', 'v1', 'secrets'),
  pvc: gvr('', 'v1', 'persistentvolumeclaims'),
  pv: gvr('', 'v1', 'persistentvolumes'),
  deployment: gvr('apps', 'v1', 'deployments'),
  statefulSet: gvr('apps', 'v1', 'statefulsets'),
  daemonSet: gvr('apps', 'v1', 'daemonsets'),
  replicaSet: gvr('apps', 'v1', 'replicasets'),
  job: gvr('batch', 'v1', 'jobs'),
  cronJob: gvr('batch', 'v1', 'cronjobs'),
  ingress: gvr('networking.k8s.io', 'v1', 'ingresses'),
  storageClass: gvr('storage.k8s.io', 'v1', 'storageclasses'),
} as const;

export const gvrKey = (g: GVR): string =>
  `${g.group}/${g.version}/${g.resource}`;

export const sameGVR = (a: GVR, b: GVR): boolean => gvrKey(a) === gvrKey(b);

/** 集群级资源（没有命名空间） */
const CLUSTER_SCOPED = new Set(
  [GVRS.node, GVRS.namespace, GVRS.pv, GVRS.storageClass].map(gvrKey),
);
export const isNamespaced = (g: GVR): boolean => !CLUSTER_SCOPED.has(gvrKey(g));

/** 内置 Kind → 资源类型：所有者引用的跳转用；不在表里的 Kind 只展示文字 */
export const KIND_GVR: Record<string, GVR> = {
  Pod: GVRS.pod,
  Node: GVRS.node,
  Namespace: GVRS.namespace,
  Service: GVRS.service,
  ConfigMap: GVRS.configMap,
  Secret: GVRS.secret,
  PersistentVolumeClaim: GVRS.pvc,
  PersistentVolume: GVRS.pv,
  Deployment: GVRS.deployment,
  StatefulSet: GVRS.statefulSet,
  DaemonSet: GVRS.daemonSet,
  ReplicaSet: GVRS.replicaSet,
  Job: GVRS.job,
  CronJob: GVRS.cronJob,
  Ingress: GVRS.ingress,
  StorageClass: GVRS.storageClass,
};

/** 资源类型 → Kind（由 KIND_GVR 反推） */
export const kindOf = (g: GVR): string | undefined =>
  Object.keys(KIND_GVR).find((kind) => sameGVR(KIND_GVR[kind], g));

/** 统一状态 → 徽标：全模块同一套着色 */
export const STATE_META: Record<
  RowState,
  {
    badge: 'success' | 'processing' | 'error' | 'default' | 'warning';
    textId: string;
  }
> = {
  ok: { badge: 'success', textId: 'pages.k8s.state.ok' },
  pending: { badge: 'processing', textId: 'pages.k8s.state.pending' },
  abnormal: { badge: 'error', textId: 'pages.k8s.state.abnormal' },
  unknown: { badge: 'warning', textId: 'pages.k8s.state.unknown' },
  done: { badge: 'default', textId: 'pages.k8s.state.done' },
};
export const STATE_ORDER: RowState[] = [
  'ok',
  'pending',
  'abnormal',
  'unknown',
  'done',
];

export const LEVELS: ScopeLevel[] = [1, 2, 3, 4];
export const levelTextId = (level: ScopeLevel | number): string =>
  `pages.k8s.level.${level}`;

/** 全部命名空间在数据范围里的取值 */
export const ALL_NAMESPACES = '*';
/** 生产环境的取值：危险操作需输入资源名确认 */
export const ENV_PROD = 'prod';

/** 视为生产环境的取值（不区分大小写）：危险操作需输入资源名确认 */
export const PROD_ENVS = ['prod', 'production', 'prd', 'live'];
export const isProdEnv = (env?: string): boolean =>
  PROD_ENVS.includes((env ?? '').trim().toLowerCase());

export const NAME_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

type Verb = 'create' | 'edit' | 'delete';

const WORKLOAD = new Set(
  [
    GVRS.pod,
    GVRS.deployment,
    GVRS.statefulSet,
    GVRS.daemonSet,
    GVRS.replicaSet,
    GVRS.job,
    GVRS.cronJob,
  ].map(gvrKey),
);
const CONFIG = new Set(
  [
    GVRS.service,
    GVRS.ingress,
    GVRS.configMap,
    GVRS.secret,
    GVRS.pvc,
    GVRS.pv,
    GVRS.storageClass,
  ].map(gvrKey),
);

export const isWorkloadGVR = (g: GVR): boolean => WORKLOAD.has(gvrKey(g));

/**
 * 某类资源的增 / 改 / 删由哪个元素权限控制：工作负载、网络与配置各归其菜单，
 * 节点与命名空间归集群管理，其余（含 CRD）归资源浏览器。
 */
export const elementCode = (g: GVR, verb: Verb): ElementPermissionCode => {
  const key = gvrKey(g);
  if (WORKLOAD.has(key)) return `k8s.workload.${verb}`;
  if (CONFIG.has(key)) return `k8s.config.${verb}`;
  if (sameGVR(g, GVRS.namespace)) return `k8s.cluster.namespace_${verb}`;
  if (sameGVR(g, GVRS.node)) return 'k8s.cluster.node_edit';
  return `k8s.resource.${verb}`;
};
