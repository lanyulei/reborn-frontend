/**
 * 故障配置分组入口（/incident/config）：跳到分组里第一个有权限的页签。
 */
import type React from 'react';
import { RouteTabsLanding } from '@/components/RouteTabs';
import { CONFIG_TABS } from './components/meta';

const IncidentConfig: React.FC = () => <RouteTabsLanding tabs={CONFIG_TABS} />;

export default IncidentConfig;
