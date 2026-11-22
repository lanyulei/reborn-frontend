/**
 * 资源类型 → 详情内的表单编辑项。行操作与详情的「更多」菜单据此列出；没有登记的类型只有「编辑 YAML」。
 * 每项是一个独立的编辑抽屉 / 弹窗（按需加载），统一走「预检 → 对比 → 提交」。
 */
import type React from 'react';
import { lazy } from 'react';
import type { GVR } from '@/services/k8s/typings';
import { t } from '@/utils/i18n';
import { GVRS, gvrKey } from '../components/meta';
import type { EditFormProps } from './shared/edit';

export interface EditEntry {
  /** 菜单项键（同一资源类型内唯一） */
  key: string;
  /** 菜单文案 */
  label: string;
  component: React.LazyExoticComponent<React.ComponentType<EditFormProps>>;
}

/** 登记项：菜单文案以 i18n 键保存，editEntriesOf 调用时按当前语言翻译 */
type EditEntryDef = Omit<EditEntry, 'label'> & { labelId: string };

const entry = (
  key: string,
  labelId: string,
  load: () => Promise<{ default: React.ComponentType<EditFormProps> }>,
): EditEntryDef => ({ key, labelId, component: lazy(load) });

const ENTRIES: [GVR, EditEntryDef[]][] = [
  [
    GVRS.service,
    [
      entry(
        'serviceSettings',
        'pages.k8s.forms.editRegistry.serviceSettings',
        () => import('./edit/service/ServiceSettingsEdit'),
      ),
      entry(
        'serviceExternalAccess',
        'pages.k8s.forms.editRegistry.serviceExternalAccess',
        () => import('./edit/service/ServiceExternalAccessEdit'),
      ),
    ],
  ],
  [
    GVRS.ingress,
    [
      entry(
        'ingressRules',
        'pages.k8s.forms.editRegistry.ingressRules',
        () => import('./edit/ingress/IngressRulesEdit'),
      ),
      entry(
        'ingressAnnotations',
        'pages.k8s.forms.editRegistry.ingressAnnotations',
        () => import('./edit/ingress/IngressAnnotationsEdit'),
      ),
    ],
  ],
  [
    GVRS.configMap,
    [
      entry(
        'settings',
        'pages.k8s.action.settings',
        () => import('./edit/configmap'),
      ),
    ],
  ],
  [
    GVRS.secret,
    [
      entry(
        'settings',
        'pages.k8s.action.settings',
        () => import('./edit/secret'),
      ),
    ],
  ],
  [
    GVRS.pvc,
    [
      entry(
        'expand',
        'pages.k8s.forms.editRegistry.pvcExpand',
        () => import('./edit/pvc/Expand'),
      ),
      entry(
        'clone',
        'pages.k8s.forms.editRegistry.pvcClone',
        () => import('./edit/pvc/Clone'),
      ),
    ],
  ],
  [
    GVRS.storageClass,
    [
      entry(
        'default',
        'pages.k8s.forms.editRegistry.storageClassDefault',
        () => import('./edit/storageclass/Default'),
      ),
      entry(
        'expansion',
        'pages.k8s.forms.editRegistry.storageClassExpansion',
        () => import('./edit/storageclass/VolumeOperations'),
      ),
    ],
  ],
];

const REGISTRY = new Map(ENTRIES.map(([gvr, list]) => [gvrKey(gvr), list]));

/** 某类资源的编辑项（文案已按当前语言翻译；调用方在渲染期调用，切换语言后重新取即得新文案） */
export const editEntriesOf = (gvr: GVR): EditEntry[] =>
  (REGISTRY.get(gvrKey(gvr)) ?? []).map(({ labelId, ...rest }) => ({
    ...rest,
    label: t(labelId),
  }));
