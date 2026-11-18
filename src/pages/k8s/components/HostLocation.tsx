/**
 * CMDB 主机详情页的「所在集群与工作负载」：按主机的内网 IP 在当前用户可见的集群里实时查找节点，
 * 列出节点上的工作负载（回答「这台主机下线会影响什么」）。不落库；没有匹配或没有容器平台权限时不显示。
 */
import { Link, useAccess } from '@umijs/max';
import { Table, Tag } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { type HostLocation, locateHost } from '@/services/k8s/insight';
import { useT } from '@/utils/i18n';
import { StateBadge } from './cells';

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+:[0-9a-fA-F:]*$/;

/** 从资源属性里取出看起来是 IP 的值（去重，至多 4 个） */
const ipsOf = (attrs?: Record<string, unknown>): string[] => {
  const out = new Set<string>();
  for (const value of Object.values(attrs ?? {})) {
    if (typeof value === 'string' && IP_REGEX.test(value.trim())) {
      out.add(value.trim());
    }
  }
  return [...out].slice(0, 4);
};

const KIND_TAB: Record<string, string> = {
  Deployment: 'deployment',
  StatefulSet: 'statefulset',
  DaemonSet: 'daemonset',
  Job: 'job',
  Pod: 'pod',
};

export const HostLocationSection: React.FC<{
  attrs?: Record<string, unknown>;
}> = ({ attrs }) => {
  const t = useT();
  const access = useAccess();
  const [items, setItems] = useState<HostLocation[]>([]);
  const ips = ipsOf(attrs).join(',');
  const enabled = !!access.canK8s && ips !== '';

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    Promise.all(
      ips.split(',').map((ip) =>
        locateHost(ip)
          .then((res) => res.items ?? [])
          .catch(() => [] as HostLocation[]),
      ),
    ).then((lists) => {
      if (cancelled) return;
      const seen = new Set<string>();
      setItems(
        lists.flat().filter((item) => {
          const key = `${item.clusterId}/${item.node}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, ips]);

  if (!enabled || items.length === 0) return null;
  return (
    <>
      <SectionTitle>{t('pages.k8s.host.location')}</SectionTitle>
      {items.map((item) => (
        <div
          key={`${item.clusterId}/${item.node}`}
          style={{ marginBottom: 16 }}
        >
          <div style={{ marginBottom: 8 }}>
            <Link to={`/k8s/cluster?tab=node&cluster=${item.clusterId}`}>
              {item.displayName || item.clusterName} / {item.node}
            </Link>
            <span style={{ marginInline: 12 }}>
              <StateBadge state={item.state} text={item.status} />
            </span>
            <Tag>{t('pages.k8s.host.pods', { count: item.pods })}</Tag>
          </div>
          <Table
            size="small"
            rowKey={(w) => `${w.namespace}/${w.kind}/${w.name}`}
            pagination={
              item.workloads.length > 10
                ? { pageSize: 10, size: 'small' }
                : false
            }
            dataSource={item.workloads}
            locale={{ emptyText: t('pages.k8s.host.noWorkloads') }}
            columns={[
              {
                title: t('pages.k8s.column.namespace'),
                dataIndex: 'namespace',
              },
              { title: t('pages.k8s.relation.kind'), dataIndex: 'kind' },
              {
                title: t('pages.k8s.column.name'),
                render: (_, w) => (
                  <Link
                    to={`/k8s/workload?tab=${KIND_TAB[w.kind] ?? 'pod'}&cluster=${encodeURIComponent(item.clusterId)}&ns=${encodeURIComponent(w.namespace)}`}
                  >
                    {w.name}
                  </Link>
                ),
              },
              { title: 'Pod', dataIndex: 'pods', align: 'right', width: 80 },
            ]}
          />
        </div>
      ))}
    </>
  );
};
