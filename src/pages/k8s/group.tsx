/**
 * 菜单分组入口（/k8s/ops / /k8s/security）：跳到分组里第一个有权限的页面。
 */
import { useLocation } from '@umijs/max';
import type React from 'react';
import { RouteTabsLanding } from '@/components/RouteTabs';
import { GROUPS } from './components/groups';

const K8sGroup: React.FC = () => {
  const { pathname } = useLocation();
  return <RouteTabsLanding tabs={GROUPS[pathname.replace(/\/$/, '')] ?? []} />;
};

export default K8sGroup;
