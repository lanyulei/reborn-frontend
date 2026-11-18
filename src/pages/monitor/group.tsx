/**
 * 菜单分组入口（/monitor/notice / /monitor/metric / /monitor/insight）：跳到分组里第一个有权限的页面。
 */
import { useLocation } from '@umijs/max';
import type React from 'react';
import { RouteTabsLanding } from '@/components/RouteTabs';
import { GROUPS } from './components/groups';

const MonitorGroup: React.FC = () => {
  const { pathname } = useLocation();
  return <RouteTabsLanding tabs={GROUPS[pathname.replace(/\/$/, '')] ?? []} />;
};

export default MonitorGroup;
