/** 容器平台页面共享的常量：资源类型、状态与档位元数据、元素权限归属。 */

import { useCallback } from 'react';
import type { GVR, RowState, ScopeLevel } from '@/services/k8s/typings';
import type { ElementPermissionCode } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';

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
  hpa: gvr('autoscaling', 'v2', 'horizontalpodautoscalers'),
  networkPolicy: gvr('networking.k8s.io', 'v1', 'networkpolicies'),
  ingressClass: gvr('networking.k8s.io', 'v1', 'ingressclasses'),
  endpointSlice: gvr('discovery.k8s.io', 'v1', 'endpointslices'),
  serviceAccount: gvr('', 'v1', 'serviceaccounts'),
  role: gvr('rbac.authorization.k8s.io', 'v1', 'roles'),
  clusterRole: gvr('rbac.authorization.k8s.io', 'v1', 'clusterroles'),
  roleBinding: gvr('rbac.authorization.k8s.io', 'v1', 'rolebindings'),
  clusterRoleBinding: gvr(
    'rbac.authorization.k8s.io',
    'v1',
    'clusterrolebindings',
  ),
  crd: gvr('apiextensions.k8s.io', 'v1', 'customresourcedefinitions'),
} as const;

export const gvrKey = (g: GVR): string =>
  `${g.group}/${g.version}/${g.resource}`;

export const sameGVR = (a: GVR, b: GVR): boolean => gvrKey(a) === gvrKey(b);

/** 集群级资源（没有命名空间） */
const CLUSTER_SCOPED = new Set(
  [
    GVRS.node,
    GVRS.namespace,
    GVRS.pv,
    GVRS.storageClass,
    GVRS.ingressClass,
    GVRS.clusterRole,
    GVRS.clusterRoleBinding,
    GVRS.crd,
  ].map(gvrKey),
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
  HorizontalPodAutoscaler: GVRS.hpa,
  NetworkPolicy: GVRS.networkPolicy,
  IngressClass: GVRS.ingressClass,
  EndpointSlice: GVRS.endpointSlice,
  ServiceAccount: GVRS.serviceAccount,
  Role: GVRS.role,
  ClusterRole: GVRS.clusterRole,
  RoleBinding: GVRS.roleBinding,
  ClusterRoleBinding: GVRS.clusterRoleBinding,
  CustomResourceDefinition: GVRS.crd,
};

/** Kind → 所在的菜单页（事件、巡检、总览、告警等处跳转到资源列表用） */
const KIND_PATH: Record<string, string> = {
  Node: '/k8s/node',
  Namespace: '/k8s/namespaces',
  Deployment: '/k8s/workloads/list?tab=deployment',
  StatefulSet: '/k8s/workloads/list?tab=statefulset',
  DaemonSet: '/k8s/workloads/list?tab=daemonset',
  Job: '/k8s/workloads/jobs',
  CronJob: '/k8s/workloads/cron-jobs',
  Pod: '/k8s/workloads/pods',
  Service: '/k8s/workloads/services',
  Ingress: '/k8s/workloads/ingresses',
  HorizontalPodAutoscaler: '/k8s/workloads/horizontal-pod-autoscalers',
  NetworkPolicy: '/k8s/network/network-policies',
  IngressClass: '/k8s/network/ingress-classes',
  EndpointSlice: '/k8s/network/endpoint-slices',
  Secret: '/k8s/config/secrets',
  ConfigMap: '/k8s/config/config-maps',
  ServiceAccount: '/k8s/config/service-accounts',
  PersistentVolumeClaim: '/k8s/storage/persistent-volume-claims',
  PersistentVolume: '/k8s/storage/persistent-volumes',
  StorageClass: '/k8s/storage/storage-classes',
  Role: '/k8s/access-control/roles',
  ClusterRole: '/k8s/access-control/roles?tab=clusterrole',
  RoleBinding: '/k8s/access-control/bindings',
  ClusterRoleBinding: '/k8s/access-control/bindings?tab=clusterrolebinding',
  CustomResourceDefinition: '/k8s/custom-resource-definitions',
};

/**
 * 某类资源的列表页地址，带上集群 / 命名空间。不认识的 Kind 落到工作负载页。
 */
export const kindPath = (
  kind: string | undefined,
  clusterId?: string,
  namespace?: string,
): string => {
  const base = KIND_PATH[kind ?? ''] ?? '/k8s/workloads/list';
  const [path, query] = base.split('?');
  const params = new URLSearchParams(query);
  if (clusterId) params.set('cluster', clusterId);
  if (namespace) params.set('ns', namespace);
  const text = params.toString();
  return text ? `${path}?${text}` : path;
};

/** 资源类型 → Kind（由 KIND_GVR 反推） */
export const kindOf = (g: GVR): string | undefined =>
  Object.keys(KIND_GVR).find((kind) => sameGVR(KIND_GVR[kind], g));

/** 已知 Kind 的资源名文案键（pages.k8s.kind.*）；未知（CRD 等）返回 undefined，调用方展示原文 */
export const kindTextId = (kind?: string): string | undefined =>
  kind && kind in KIND_GVR ? `pages.k8s.kind.${kind}` : undefined;

/** 资源名的本地化文案：已知类型走语言包（en 为英文原名），未知（CRD 等）原样展示 */
export const useKindName = (): ((kind?: string) => string) => {
  const t = useT();
  return useCallback(
    (kind?: string) => {
      const id = kindTextId(kind);
      return (id && t(id)) || kind || '';
    },
    [t],
  );
};

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

/** 详情页地址里表示「空」的占位：核心组、集群级资源的命名空间 */
export const DETAIL_NONE = '-';

/** 资源详情页（整页）的地址 */
export const detailPath = (
  clusterId: string,
  g: GVR,
  name: string,
  namespace?: string,
  tab?: string,
): string => {
  const seg = [
    g.group || DETAIL_NONE,
    g.version,
    g.resource,
    namespace || DETAIL_NONE,
    name,
  ]
    .map(encodeURIComponent)
    .join('/');
  const query = new URLSearchParams({ cluster: clusterId });
  if (tab && tab !== 'overview') query.set('tab', tab);
  return `/k8s/detail/${seg}?${query}`;
};
