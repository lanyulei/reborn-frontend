/**
 * 菜单分组：一个菜单入口下的几个平级页面，页头用路由页签切换（见 @/components/RouteTabs）。
 */
import type { RouteTab } from '@/components/RouteTabs';

/** 通知策略：告警订阅 / 升级策略 */
export const NOTICE_TABS: RouteTab[] = [
  {
    key: 'subscription',
    path: '/monitor/subscription',
    labelKey: 'menu.monitor.subscription',
    accessKey: 'canMonitorSubscription',
  },
  {
    key: 'escalation',
    path: '/monitor/escalation',
    labelKey: 'menu.monitor.escalation',
    accessKey: 'canMonitorEscalation',
  },
];

/** 指标数据：即时查询 / 记录规则 / 数据源 */
export const METRIC_TABS: RouteTab[] = [
  {
    key: 'explore',
    path: '/monitor/explore',
    labelKey: 'menu.monitor.explore',
    accessKey: 'canMonitorExplore',
  },
  {
    key: 'record',
    path: '/monitor/record',
    labelKey: 'menu.monitor.record',
    accessKey: 'canMonitorRecord',
  },
  {
    key: 'datasource',
    path: '/monitor/datasource',
    labelKey: 'menu.monitor.datasource',
    accessKey: 'canMonitorDatasource',
  },
];

/** 运行分析：告警统计 / 引擎状态 */
export const INSIGHT_TABS: RouteTab[] = [
  {
    key: 'stats',
    path: '/monitor/stats',
    labelKey: 'menu.monitor.stats',
    accessKey: 'canMonitorStats',
  },
  {
    key: 'engine',
    path: '/monitor/engine',
    labelKey: 'menu.monitor.engine',
    accessKey: 'canMonitorEngine',
  },
];

/** 分组入口路由 → 页签 */
export const GROUPS: Record<string, RouteTab[]> = {
  '/monitor/notice': NOTICE_TABS,
  '/monitor/metric': METRIC_TABS,
  '/monitor/insight': INSIGHT_TABS,
};
