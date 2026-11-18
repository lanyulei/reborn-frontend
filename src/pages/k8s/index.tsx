/**
 * /k8s 落地：按权限跳到第一个可访问的子页（同 /job 的落地方式）。
 */
import { history, useAccess } from '@umijs/max';
import type React from 'react';
import { useEffect } from 'react';

const LANDINGS: [accessKey: string, path: string][] = [
  ['canK8sOverview', '/k8s/overview'],
  ['canK8sWorkload', '/k8s/workload'],
  ['canK8sConfig', '/k8s/config'],
  ['canK8sApp', '/k8s/app'],
  ['canK8sResource', '/k8s/resource'],
  ['canK8sCluster', '/k8s/cluster'],
  ['canK8sOps', '/k8s/ops'],
  ['canK8sSecurity', '/k8s/security'],
];

const K8sIndex: React.FC = () => {
  const access = useAccess() as Record<string, unknown>;
  useEffect(() => {
    const target = LANDINGS.find(([key]) => access[key]);
    history.replace(target ? target[1] : '/');
  }, [access]);
  return null;
};

export default K8sIndex;
