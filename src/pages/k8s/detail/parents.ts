/**
 * 资源类型 → 所在的菜单列表页：资源详情页的面包屑据此给出父级导航
 * （容器平台 / 列表页 / 资源详情）。未登记的类型（ReplicaSet、CRD 的实例等）
 * 回落到资源浏览器。
 */
import type { GVR } from '@/services/k8s/typings';
import { GVRS, sameGVR } from '../components/meta';

export interface ResourceListPage {
  /** 列表页路径 */
  path: string;
  /** 菜单文案的 i18n 键 */
  menuKey: string;
}

const RESOURCE_BROWSER: ResourceListPage = {
  path: '/k8s/resource',
  menuKey: 'menu.k8s.resource',
};

const page = (path: string, menuKey: string): ResourceListPage => ({
  path,
  menuKey,
});

const ENTRIES: [GVR, ResourceListPage][] = [
  // 工作负载
  [GVRS.deployment, page('/k8s/workloads/list', 'menu.k8s.workloads.list')],
  [GVRS.statefulSet, page('/k8s/workloads/list', 'menu.k8s.workloads.list')],
  [GVRS.daemonSet, page('/k8s/workloads/list', 'menu.k8s.workloads.list')],
  [GVRS.job, page('/k8s/workloads/jobs', 'menu.k8s.workloads.jobs')],
  [
    GVRS.cronJob,
    page('/k8s/workloads/cron-jobs', 'menu.k8s.workloads.cronJobs'),
  ],
  [GVRS.pod, page('/k8s/workloads/pods', 'menu.k8s.workloads.pods')],
  [
    GVRS.service,
    page('/k8s/workloads/services', 'menu.k8s.workloads.services'),
  ],
  [
    GVRS.ingress,
    page('/k8s/workloads/ingresses', 'menu.k8s.workloads.ingresses'),
  ],
  [
    GVRS.hpa,
    page('/k8s/workloads/horizontal-pod-autoscalers', 'menu.k8s.workloads.hpa'),
  ],
  // 集群
  [GVRS.node, page('/k8s/node', 'menu.k8s.node')],
  [GVRS.namespace, page('/k8s/namespaces', 'menu.k8s.namespaces')],
  // 网络
  [
    GVRS.networkPolicy,
    page('/k8s/network/network-policies', 'menu.k8s.network.networkPolicies'),
  ],
  [
    GVRS.ingressClass,
    page('/k8s/network/ingress-classes', 'menu.k8s.network.ingressClasses'),
  ],
  [
    GVRS.endpointSlice,
    page('/k8s/network/endpoint-slices', 'menu.k8s.network.endpointSlices'),
  ],
  // 配置
  [GVRS.secret, page('/k8s/config/secrets', 'menu.k8s.config.secrets')],
  [
    GVRS.configMap,
    page('/k8s/config/config-maps', 'menu.k8s.config.configMaps'),
  ],
  [
    GVRS.serviceAccount,
    page('/k8s/config/service-accounts', 'menu.k8s.config.serviceAccounts'),
  ],
  // 存储
  [
    GVRS.pvc,
    page('/k8s/storage/persistent-volume-claims', 'menu.k8s.storage.pvc'),
  ],
  [GVRS.pv, page('/k8s/storage/persistent-volumes', 'menu.k8s.storage.pv')],
  [
    GVRS.storageClass,
    page('/k8s/storage/storage-classes', 'menu.k8s.storage.storageClasses'),
  ],
  // 访问控制
  [
    GVRS.role,
    page('/k8s/access-control/roles', 'menu.k8s.accessControl.roles'),
  ],
  [
    GVRS.clusterRole,
    page('/k8s/access-control/roles', 'menu.k8s.accessControl.roles'),
  ],
  [
    GVRS.roleBinding,
    page('/k8s/access-control/bindings', 'menu.k8s.accessControl.bindings'),
  ],
  [
    GVRS.clusterRoleBinding,
    page('/k8s/access-control/bindings', 'menu.k8s.accessControl.bindings'),
  ],
  // 自定义资源
  [GVRS.crd, page('/k8s/custom-resource-definitions', 'menu.k8s.crd')],
];

/** 资源类型所在的列表页；未登记的回落到资源浏览器 */
export const listPageOf = (gvr: GVR): ResourceListPage =>
  ENTRIES.find(([g]) => sameGVR(g, gvr))?.[1] ?? RESOURCE_BROWSER;
