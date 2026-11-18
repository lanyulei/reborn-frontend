/**
 * 角色的容器平台数据范围（角色权限页的一个页签）：角色在哪些集群的哪些命名空间有什么档位。
 * 整组保存；保存后由数据面同步为集群内的角色绑定（约 10 秒内生效），权限由集群判定。
 * 集群管理员档位只能用于全部命名空间。
 */
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Flex,
  Input,
  Select,
  Spin,
  Table,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  getRoleScope,
  listClusters,
  replaceRoleScope,
} from '@/services/k8s/cluster';
import { getK8sErrorMessage } from '@/services/k8s/request';
import type { ScopeLevel } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import { ALL_NAMESPACES, LEVELS, levelTextId, NAME_REGEX } from './meta';

interface Row {
  key: number;
  clusterId?: string;
  namespace: string;
  level: ScopeLevel;
}

let rowSeq = 0;
const newRow = (init?: Partial<Row>): Row => {
  rowSeq += 1;
  return { key: rowSeq, namespace: ALL_NAMESPACES, level: 1, ...init };
};

export const K8sRoleScope: React.FC<{ roleId: string; readOnly?: boolean }> = ({
  roleId,
  readOnly,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [clusters, setClusters] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoaded(false);
    Promise.all([
      getRoleScope(roleId),
      // 集群清单是辅助数据：没有查询集群的权限时仍可查看已有范围（显示集群名）
      fetchAllPages((page, pageSize) =>
        listClusters({ page, pageSize }, { silent: true }),
      ).catch(() => []),
    ])
      .then(([scope, list]) => {
        if (cancelled) return;
        const items = scope.items ?? [];
        const options = new Map(
          list.map((item) => [item.id, item.spec.name] as const),
        );
        for (const item of items) {
          if (!options.has(item.clusterId)) {
            options.set(item.clusterId, item.clusterName || item.clusterId);
          }
        }
        setClusters(
          [...options.entries()].map(([value, label]) => ({ value, label })),
        );
        setRows(
          items.map((item) =>
            newRow({
              clusterId: item.clusterId,
              namespace: item.namespace,
              level: item.level,
            }),
          ),
        );
        setError(undefined);
        // 整组替换语义：只有加载成功后才允许保存，否则会清空已有范围
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(getK8sErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roleId]);

  const patch = (key: number, change: Partial<Row>) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...change } : row)),
    );

  const validate = (): string | undefined => {
    const seen = new Set<string>();
    for (const row of rows) {
      if (!row.clusterId) return t('pages.k8s.roleScope.rule.cluster');
      const ns = row.namespace.trim();
      if (ns !== ALL_NAMESPACES && !NAME_REGEX.test(ns)) {
        return t('pages.k8s.roleScope.rule.namespace');
      }
      if (row.level === 4 && ns !== ALL_NAMESPACES) {
        return t('pages.k8s.roleScope.rule.admin');
      }
      const id = `${row.clusterId}/${ns}`;
      if (seen.has(id)) return t('pages.k8s.roleScope.rule.duplicate');
      seen.add(id);
    }
    return undefined;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      message.error(problem);
      return;
    }
    setSaving(true);
    try {
      await replaceRoleScope(
        roleId,
        rows.map((row) => ({
          clusterId: row.clusterId ?? '',
          namespace: row.namespace.trim(),
          level: row.level,
        })),
      );
      message.success(t('pages.k8s.roleScope.saved'));
    } catch {
      // 已由请求层提示
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <Spin style={{ display: 'block', margin: '48px auto' }} />;

  return (
    <>
      <Typography.Paragraph type="secondary">
        {t('pages.k8s.roleScope.desc')}
      </Typography.Paragraph>
      {error && (
        <Typography.Paragraph type="danger">{error}</Typography.Paragraph>
      )}
      <Table<Row>
        size="small"
        rowKey="key"
        pagination={false}
        dataSource={rows}
        columns={[
          {
            title: t('pages.k8s.scope.cluster'),
            key: 'cluster',
            width: 260,
            render: (_, row) => (
              <Select
                style={{ width: '100%' }}
                disabled={readOnly}
                showSearch={{ optionFilterProp: 'label' }}
                value={row.clusterId}
                options={clusters}
                placeholder={t('pages.k8s.scope.cluster.placeholder')}
                onChange={(clusterId) => patch(row.key, { clusterId })}
              />
            ),
          },
          {
            title: t('pages.k8s.column.namespace'),
            key: 'namespace',
            render: (_, row) => (
              <Flex gap={8}>
                <Select
                  style={{ width: 150 }}
                  disabled={readOnly}
                  value={row.namespace === ALL_NAMESPACES ? 'all' : 'one'}
                  options={[
                    { value: 'all', label: t('pages.k8s.scope.allNamespaces') },
                    {
                      value: 'one',
                      label: t('pages.k8s.roleScope.oneNamespace'),
                    },
                  ]}
                  onChange={(mode) =>
                    patch(
                      row.key,
                      mode === 'all'
                        ? { namespace: ALL_NAMESPACES }
                        : // 集群管理员只能用于全部命名空间：切到指定命名空间时降一档
                          {
                            namespace: '',
                            level: row.level === 4 ? 3 : row.level,
                          },
                    )
                  }
                />
                {row.namespace !== ALL_NAMESPACES && (
                  <Input
                    style={{ flex: 1 }}
                    disabled={readOnly}
                    maxLength={63}
                    value={row.namespace}
                    placeholder={t('pages.k8s.roleScope.namespace.placeholder')}
                    onChange={(event) =>
                      patch(row.key, { namespace: event.target.value })
                    }
                  />
                )}
              </Flex>
            ),
          },
          {
            title: t('pages.k8s.roleScope.level'),
            key: 'level',
            width: 200,
            render: (_, row) => (
              <Select<ScopeLevel>
                style={{ width: '100%' }}
                disabled={readOnly}
                value={row.level}
                options={LEVELS.map((level) => ({
                  value: level,
                  label: t(levelTextId(level)),
                  disabled: level === 4 && row.namespace !== ALL_NAMESPACES,
                }))}
                onChange={(level) => patch(row.key, { level })}
              />
            ),
          },
          {
            key: 'remove',
            width: 48,
            render: (_, row) =>
              !readOnly && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    setRows((prev) =>
                      prev.filter((item) => item.key !== row.key),
                    )
                  }
                />
              ),
          },
        ]}
      />
      {!readOnly && loaded && (
        <Flex gap={8} style={{ marginTop: 12 }}>
          <Button
            icon={<PlusOutlined />}
            disabled={rows.length >= 500}
            onClick={() => setRows((prev) => [...prev, newRow()])}
          >
            {t('pages.k8s.roleScope.add')}
          </Button>
          <Button type="primary" loading={saving} onClick={save}>
            {t('pages.k8s.roleScope.save')}
          </Button>
        </Flex>
      )}
    </>
  );
};
