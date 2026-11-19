/**
 * 监控告警 ↔ 容器平台的两处衔接（供 monitor 页面引用，改动留在 k8s 目录）：
 * - K8sRuleTemplateButton：把内置的 K8s 告警规则模板填进规则导入弹窗；
 * - K8sAlertLink：告警标签里带 cluster（及 namespace / pod / node）时，给出跳到对应资源页的链接。
 */
import { Link, useAccess } from '@umijs/max';
import { App, Button } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { listClusterOptions } from '@/services/k8s/cluster';
import { getAlertRuleTemplate } from '@/services/k8s/governance';
import { useT } from '@/utils/i18n';
import { kindPath } from './meta';

export const K8sRuleTemplateButton: React.FC<{
  onLoad: (content: string, name: string) => void;
}> = ({ onLoad }) => {
  const t = useT();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await getAlertRuleTemplate();
          onLoad(res.content, 'k8s-alerts.yaml');
          message.success(
            t('pages.k8s.ruleTemplate.loaded', { n: res.rules ?? 0 }),
          );
        } catch {
          // 失败已由请求层提示
        } finally {
          setLoading(false);
        }
      }}
    >
      {t('pages.k8s.ruleTemplate.use')}
    </Button>
  );
};

/** 集群名称 → ID 的映射在页面生命周期内只取一次 */
let clusterIndex: Promise<Record<string, string>> | undefined;
const loadClusterIndex = () => {
  clusterIndex ??= listClusterOptions({ silent: true })
    .then((res) =>
      Object.fromEntries((res.items ?? []).map((c) => [c.name, c.id])),
    )
    .catch(() => {
      clusterIndex = undefined;
      return {};
    });
  return clusterIndex;
};

export const K8sAlertLink: React.FC<{
  labels?: Record<string, string>;
}> = ({ labels }) => {
  const t = useT();
  const access = useAccess() as Record<string, unknown>;
  const cluster = labels?.cluster;
  const allowed = Boolean(access.canK8sWorkload || access.canK8sCluster);
  const [clusterId, setClusterId] = useState<string>();
  useEffect(() => {
    if (!cluster || !allowed) return;
    let cancelled = false;
    void loadClusterIndex().then((index) => {
      if (!cancelled) setClusterId(index[cluster]);
    });
    return () => {
      cancelled = true;
    };
  }, [cluster, allowed]);
  if (!clusterId || !labels) return null;

  const ns = labels.namespace;
  let to: string | undefined;
  if (labels.pod && ns && access.canK8sWorkload) {
    to = kindPath('Pod', clusterId, ns);
  } else if (labels.deployment && access.canK8sWorkload) {
    to = kindPath('Deployment', clusterId, ns);
  } else if (labels.statefulset && access.canK8sWorkload) {
    to = kindPath('StatefulSet', clusterId, ns);
  } else if (labels.daemonset && access.canK8sWorkload) {
    to = kindPath('DaemonSet', clusterId, ns);
  } else if (labels.node && access.canK8sCluster) {
    to = kindPath('Node', clusterId);
  } else if (ns && access.canK8sWorkload) {
    to = kindPath('Deployment', clusterId, ns);
  }
  if (!to) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <Link to={to}>{t('pages.k8s.alertLink')}</Link>
    </div>
  );
};
