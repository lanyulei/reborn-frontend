/**
 * 资源浏览器：集群的全部资源类型（含 CRD，集群里装了新的 Operator 即自动出现），按 API 组分组、可搜索；
 * 选中后是同一套通用列表 / 详情 / YAML 编辑 / 删除。选中的类型写进 URL（?gvr=）。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { useSearchParams } from '@umijs/max';
import { Button, Empty, Flex, Input, Menu, Spin, Tag, Tooltip } from 'antd';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { listAPIResources } from '@/services/k8s/resource';
import type { APIResource } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { gvrKey } from '../components/meta';
import { ResourceView } from '../components/ResourceView';
import { K8sPage, useK8sScope } from '../components/scope';

const Browser: React.FC = () => {
  const t = useT();
  const scope = useK8sScope();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<APIResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAPIResources(scope.clusterId, refresh > 0)
      .then((res) => {
        if (cancelled) return;
        // 只列出可以 list 的资源类型（子资源与只能创建的类型没有列表）
        setItems(
          (res.items ?? []).filter((item) => item.verbs?.includes('list')),
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope.clusterId, refresh]);

  const selectedKey = params.get('gvr') ?? '';
  const selected = items.find((item) => gvrKey(item) === selectedKey);
  // 只取资源类型的三个字段：目录项里的其它字段不应进入请求参数
  const selectedGVR = useMemo(
    () =>
      selected && {
        group: selected.group,
        version: selected.version,
        resource: selected.resource,
      },
    [selected],
  );

  const menuItems = useMemo(() => {
    const word = keyword.trim().toLowerCase();
    const groups = new Map<string, APIResource[]>();
    for (const item of items) {
      if (
        word &&
        !`${item.kind} ${item.resource} ${item.group} ${(item.shortNames ?? []).join(' ')}`
          .toLowerCase()
          .includes(word)
      ) {
        continue;
      }
      groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, list]) => ({
        key: `group:${group}`,
        type: 'group' as const,
        label: group || 'core',
        children: list
          .sort((a, b) => a.kind.localeCompare(b.kind))
          .map((item) => ({
            key: gvrKey(item),
            label: (
              <Flex justify="space-between" align="center" gap={8}>
                <span>{item.kind}</span>
                {item.crd && <Tag style={{ marginInlineEnd: 0 }}>CRD</Tag>}
              </Flex>
            ),
          })),
      }));
  }, [items, keyword]);

  return (
    <Flex gap={16} align="start">
      <div style={{ width: 260, flex: 'none' }}>
        <Flex gap={8} style={{ marginBottom: 8 }}>
          <Input.Search
            allowClear
            placeholder={t('pages.k8s.resource.search')}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Tooltip title={t('pages.k8s.resource.refresh')}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setRefresh((n) => n + 1)}
            />
          </Tooltip>
        </Flex>
        <Spin spinning={loading}>
          <Menu
            mode="inline"
            style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}
            selectedKeys={selected ? [selectedKey] : []}
            items={menuItems}
            onClick={({ key }) => {
              const next = new URLSearchParams(params);
              next.set('gvr', key);
              setParams(next, { replace: true });
            }}
          />
        </Spin>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {selected && selectedGVR ? (
          <ResourceView
            key={selectedKey}
            gvr={selectedGVR}
            namespaced={selected.namespaced}
            creatable={selected.verbs?.includes('create')}
          />
        ) : (
          <Empty
            style={{ marginTop: 80 }}
            description={t('pages.k8s.resource.pick')}
          />
        )}
      </div>
    </Flex>
  );
};

const Resource: React.FC = () => (
  <K8sPage tabs={[{ key: 'browser', label: '', render: () => <Browser /> }]} />
);

export default Resource;
