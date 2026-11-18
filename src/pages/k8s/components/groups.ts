/**
 * 菜单分组：一个菜单入口下的几个平级页面，页头用路由页签切换（见 @/components/RouteTabs）。
 */
import type { RouteTab } from '@/components/RouteTabs';

/** 事件巡检：事件 / 巡检 */
export const OPS_TABS: RouteTab[] = [
  {
    key: 'event',
    path: '/k8s/event',
    labelKey: 'menu.k8s.event',
    accessKey: 'canK8sEvent',
  },
  {
    key: 'inspection',
    path: '/k8s/inspection',
    labelKey: 'menu.k8s.inspection',
    accessKey: 'canK8sInspection',
  },
];

/** 安全审计：变更单 / 访问凭证 / 操作审计 / 终端会话 */
export const SECURITY_TABS: RouteTab[] = [
  {
    key: 'change',
    path: '/k8s/change',
    labelKey: 'menu.k8s.change',
    accessKey: 'canK8sChange',
  },
  {
    key: 'kubeconfig',
    path: '/k8s/kubeconfig',
    labelKey: 'menu.k8s.kubeconfig',
    accessKey: 'canK8sKubeconfig',
  },
  {
    key: 'audit',
    path: '/k8s/audit',
    labelKey: 'menu.k8s.audit',
    accessKey: 'canK8sAudit',
  },
  {
    key: 'session',
    path: '/k8s/audit',
    tab: 'session',
    labelKey: 'pages.k8s.audit.tab.session',
    accessKey: 'canK8sAudit',
  },
];

/** 分组入口路由 → 页签 */
export const GROUPS: Record<string, RouteTab[]> = {
  '/k8s/ops': OPS_TABS,
  '/k8s/security': SECURITY_TABS,
};
