/**
 * 旧地址兼容：/k8s/workload 与 /k8s/config 原先是页签容器（?tab=），现在每类资源是独立菜单页。
 * 通知、告警、书签里的旧链接按页签跳到对应的新页面，其余查询参数（集群、命名空间）原样带上。
 */
import { history, useLocation, useSearchParams } from '@umijs/max';
import type React from 'react';
import { useEffect } from 'react';

const TARGETS: Record<string, Record<string, string>> = {
  '/k8s/workload': {
    '': '/k8s/workloads/list',
    deployment: '/k8s/workloads/list?tab=deployment',
    statefulset: '/k8s/workloads/list?tab=statefulset',
    daemonset: '/k8s/workloads/list?tab=daemonset',
    job: '/k8s/workloads/cron-jobs',
    pod: '/k8s/workloads/pods',
  },
  '/k8s/config': {
    '': '/k8s/config/secrets',
    service: '/k8s/workloads/services',
    ingress: '/k8s/workloads/ingresses',
    configmap: '/k8s/config/config-maps',
    secret: '/k8s/config/secrets',
    storage: '/k8s/storage/persistent-volume-claims',
  },
};

const Legacy: React.FC = () => {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  useEffect(() => {
    const table = TARGETS[pathname.replace(/\/$/, '')] ?? {};
    const target = table[params.get('tab') ?? ''] ?? table[''] ?? '/k8s';
    const [path, query] = target.split('?');
    const next = new URLSearchParams(params);
    next.delete('tab');
    for (const [key, value] of new URLSearchParams(query)) next.set(key, value);
    const text = next.toString();
    history.replace(text ? `${path}?${text}` : path);
  }, [pathname, params]);
  return null;
};

export default Legacy;
