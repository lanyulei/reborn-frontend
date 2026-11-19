/**
 * /k8s 落地：按权限跳到第一个可访问的子页（同 /job 的落地方式）。
 */
import type React from 'react';
import { AccessLanding, type Landing } from '@/components/RouteTabs';

const LANDINGS: Landing[] = [
  ['canK8sOverview', '/k8s/overview'],
  ['canK8sWorkload', '/k8s/workloads/list'],
  ['canK8sConfig', '/k8s/config/secrets'],
  ['canK8sApp', '/k8s/app'],
  ['canK8sResource', '/k8s/resource'],
  ['canK8sCluster', '/k8s/cluster'],
  ['canK8sOps', '/k8s/ops'],
  ['canK8sSecurity', '/k8s/security'],
];

const K8sIndex: React.FC = () => <AccessLanding landings={LANDINGS} />;

export default K8sIndex;
