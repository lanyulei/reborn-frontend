/**
 * 菜单分组入口（/job/library / /job/automation / /job/resource）：跳到分组里第一个有权限的页面。
 */
import type React from 'react';
import { RouteGroupLanding } from '@/components/RouteTabs';
import { GROUPS } from './components/groups';

const JobGroup: React.FC = () => <RouteGroupLanding groups={GROUPS} />;

export default JobGroup;
