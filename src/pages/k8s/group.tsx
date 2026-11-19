/**
 * 菜单分组入口（/k8s/ops / /k8s/security）：跳到分组里第一个有权限的页面。
 */
import type React from 'react';
import { RouteGroupLanding } from '@/components/RouteTabs';
import { GROUPS } from './components/groups';

const K8sGroup: React.FC = () => <RouteGroupLanding groups={GROUPS} />;

export default K8sGroup;
