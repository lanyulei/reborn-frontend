/**
 * 资源类型 → 创建向导。通用资源视图据此在工具栏给出「新建」按钮；没有登记的类型只提供「从 YAML 创建」。
 * 向导按需加载：不进入创建流程就不下载表单代码（悬停「新建」时会预取，见 preloadFormOf）。
 */
import type React from 'react';
import { lazy } from 'react';
import type { GVR } from '@/services/k8s/typings';
import { GVRS, gvrKey } from '../components/meta';
import type { CreateFormProps } from './types';

type FormComponent = React.LazyExoticComponent<
  React.ComponentType<CreateFormProps>
>;
type FormLoader = () => Promise<{
  default: React.ComponentType<CreateFormProps>;
}>;

const FORMS: [GVR, FormLoader][] = [
  [GVRS.deployment, () => import('./workload/Deployment')],
  [GVRS.statefulSet, () => import('./workload/StatefulSet')],
  [GVRS.daemonSet, () => import('./workload/DaemonSet')],
  [GVRS.job, () => import('./job')],
  [GVRS.cronJob, () => import('./cronjob')],
  [GVRS.secret, () => import('./secret')],
  [GVRS.configMap, () => import('./configmap')],
  [GVRS.serviceAccount, () => import('./serviceaccount')],
  [GVRS.service, () => import('./service')],
  [GVRS.ingress, () => import('./ingress')],
  [GVRS.hpa, () => import('./hpa')],
  [GVRS.networkPolicy, () => import('./networkpolicy')],
  [GVRS.ingressClass, () => import('./ingressclass')],
  [GVRS.endpointSlice, () => import('./endpointslice')],
  [GVRS.pvc, () => import('./pvc')],
  [GVRS.pv, () => import('./pv')],
  [GVRS.storageClass, () => import('./storageclass')],
  [GVRS.role, () => import('./role/Role')],
  [GVRS.clusterRole, () => import('./role/ClusterRole')],
  [GVRS.roleBinding, () => import('./binding/RoleBinding')],
  [GVRS.clusterRoleBinding, () => import('./binding/ClusterRoleBinding')],
];

const LOADERS = new Map(FORMS.map(([gvr, loader]) => [gvrKey(gvr), loader]));
const REGISTRY = new Map(
  FORMS.map(([gvr, loader]) => [gvrKey(gvr), lazy(loader)]),
);

export const createFormOf = (gvr: GVR): FormComponent | undefined =>
  REGISTRY.get(gvrKey(gvr));

/** 预取某类资源的创建向导代码（懒加载 chunk）：悬停「新建」时调用，点击时表单已就绪 */
export const preloadFormOf = (gvr: GVR): void => {
  void LOADERS.get(gvrKey(gvr))?.().catch(() => undefined);
};
