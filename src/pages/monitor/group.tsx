/**
 * 菜单分组入口（/monitor/notice / /monitor/metric / /monitor/insight）：跳到分组里第一个有权限的页面。
 */
import type React from 'react';
import { RouteGroupLanding } from '@/components/RouteTabs';
import { GROUPS } from './components/groups';

const MonitorGroup: React.FC = () => <RouteGroupLanding groups={GROUPS} />;

export default MonitorGroup;
