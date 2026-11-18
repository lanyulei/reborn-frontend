/**
 * 菜单分组：一个菜单入口下的几个平级页面，页头用路由页签切换（见 @/components/RouteTabs）。
 */
import type { RouteTab } from '@/components/RouteTabs';

/** 作业管理：作业模板 / 脚本库 */
export const LIBRARY_TABS: RouteTab[] = [
  {
    key: 'template',
    path: '/job/template',
    labelKey: 'menu.job.template',
    accessKey: 'canJobTemplate',
  },
  {
    key: 'script',
    path: '/job/script',
    labelKey: 'menu.job.script',
    accessKey: 'canJobScript',
  },
];

/** 执行记录：执行记录 / 执行统计 */
export const HISTORY_TABS: RouteTab[] = [
  {
    key: 'execution',
    path: '/job/execution',
    labelKey: 'menu.job.execution',
    accessKey: 'canJobExecution',
  },
  {
    key: 'stats',
    path: '/job/stats',
    labelKey: 'menu.job.stats',
    accessKey: 'canJobStats',
  },
];

/** 定时触发：定时作业 / 触发器 */
export const AUTOMATION_TABS: RouteTab[] = [
  {
    key: 'schedule',
    path: '/job/schedule',
    labelKey: 'menu.job.schedule',
    accessKey: 'canJobSchedule',
  },
  {
    key: 'trigger',
    path: '/job/trigger',
    labelKey: 'menu.job.trigger',
    accessKey: 'canJobTrigger',
  },
];

/** 资源配置：项目 / 凭据 / 执行节点 */
export const RESOURCE_TABS: RouteTab[] = [
  {
    key: 'project',
    path: '/job/project',
    labelKey: 'menu.job.project',
    accessKey: 'canJobProject',
  },
  {
    key: 'credential',
    path: '/job/credential',
    labelKey: 'menu.job.credential',
    accessKey: 'canJobCredential',
  },
  {
    key: 'runner',
    path: '/job/runner',
    labelKey: 'menu.job.runner',
    accessKey: 'canJobRunner',
  },
];

/** 分组入口路由 → 页签 */
export const GROUPS: Record<string, RouteTab[]> = {
  '/job/library': LIBRARY_TABS,
  '/job/history': HISTORY_TABS,
  '/job/automation': AUTOMATION_TABS,
  '/job/resource': RESOURCE_TABS,
};
