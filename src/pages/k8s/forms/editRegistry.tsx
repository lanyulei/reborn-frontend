/**
 * 资源类型 → 详情内的表单编辑项。行操作与详情的「更多」菜单据此列出；没有登记的类型只有「编辑 YAML」。
 * 每项是一个独立的编辑抽屉 / 弹窗（按需加载），统一走「预检 → 对比 → 提交」。
 */
import type React from 'react';
import { lazy } from 'react';
import type { GVR } from '@/services/k8s/typings';
import { GVRS, gvrKey } from '../components/meta';
import type { EditFormProps } from './shared/edit';

export interface EditEntry {
  /** 菜单项键（同一资源类型内唯一） */
  key: string;
  /** 菜单文案 */
  label: string;
  component: React.LazyExoticComponent<React.ComponentType<EditFormProps>>;
}

const entry = (
  key: string,
  label: string,
  load: () => Promise<{ default: React.ComponentType<EditFormProps> }>,
): EditEntry => ({ key, label, component: lazy(load) });

const ENTRIES: [GVR, EditEntry[]][] = [
  [
    GVRS.service,
    [
      entry(
        'serviceSettings',
        '编辑服务设置',
        () => import('./edit/service/ServiceSettingsEdit'),
      ),
      entry(
        'serviceExternalAccess',
        '编辑外部访问',
        () => import('./edit/service/ServiceExternalAccessEdit'),
      ),
    ],
  ],
  [
    GVRS.ingress,
    [
      entry(
        'ingressRules',
        '编辑路由规则',
        () => import('./edit/ingress/IngressRulesEdit'),
      ),
      entry(
        'ingressAnnotations',
        '编辑注解',
        () => import('./edit/ingress/IngressAnnotationsEdit'),
      ),
    ],
  ],
  [
    GVRS.configMap,
    [entry('settings', '编辑设置', () => import('./edit/configmap'))],
  ],
  [GVRS.secret, [entry('settings', '编辑设置', () => import('./edit/secret'))]],
  [
    GVRS.pvc,
    [
      entry('expand', '扩容', () => import('./edit/pvc/Expand')),
      entry('clone', '克隆', () => import('./edit/pvc/Clone')),
    ],
  ],
  [
    GVRS.storageClass,
    [
      entry(
        'default',
        '设为默认 / 取消默认',
        () => import('./edit/storageclass/Default'),
      ),
      entry(
        'expansion',
        '允许卷扩容',
        () => import('./edit/storageclass/VolumeOperations'),
      ),
    ],
  ],
];

const REGISTRY = new Map(ENTRIES.map(([gvr, list]) => [gvrKey(gvr), list]));

export const editEntriesOf = (gvr: GVR): EditEntry[] =>
  REGISTRY.get(gvrKey(gvr)) ?? [];
