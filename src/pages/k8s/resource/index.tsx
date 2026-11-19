/**
 * 资源浏览器：集群的全部资源类型（含 CRD，集群里装了新的 Operator 即自动出现），按 API 组分组，
 * 可搜索，最近使用过的类型置顶；选中后是同一套通用列表 / 详情 / YAML 编辑 / 删除。选中的类型写进
 * URL（?gvr=）。左栏与 CMDB 实例页 / 告警规则页同款：吸顶卡片、内部滚动。
 */
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useSearchParams } from '@umijs/max';
import {
  Button,
  Empty,
  Input,
  Menu,
  type MenuProps,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { listAPIResources } from '@/services/k8s/resource';
import type { APIResource } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { gvrKey } from '../components/meta';
import { ResourceView } from '../components/ResourceView';
import {
  K8sPage,
  readStored,
  useK8sScope,
  writeStored,
} from '../components/scope';
import { useK8sStyles } from '../components/styles';

/** 最近使用的资源类型按集群记在本地，最多 5 个 */
const RECENT_LIMIT = 5;
const recentKeyOf = (clusterId: string) => `k8s.resource.recent.${clusterId}`;
/** 「最近使用」分组里菜单项的键前缀：与 API 分组里的同键项区分开 */
const RECENT_PREFIX = 'recent/';

const loadRecent = (clusterId: string): string[] => {
  try {
    const list = JSON.parse(
      readStored(recentKeyOf(clusterId)) ?? '[]',
    ) as unknown;
    return Array.isArray(list)
      ? list.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
};

const Browser: React.FC = () => {
  const t = useT();
  const { styles } = useK8sStyles();
  const scope = useK8sScope();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<APIResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [keyword, setKeyword] = useState('');
  const [recent, setRecent] = useState<string[]>(() =>
    loadRecent(scope.clusterId),
  );
  const [refresh, setRefresh] = useState(0);
  const sideRef = useRef<HTMLElement>(null);

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
        setError(undefined);
      })
      .catch((err) => {
        // 刷新失败保留已有目录，仅记录错误（目录为空时在侧栏提示并给重试）
        if (!cancelled) setError(getK8sErrorMessage(err));
      })
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

  // 深链（?gvr=）进入时把选中项滚进侧栏可视区
  useEffect(() => {
    if (!selectedKey) return;
    sideRef.current
      ?.querySelector('.ant-menu-item-selected')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedKey, items.length]);

  const menuItems = useMemo(() => {
    const word = keyword.trim().toLowerCase();
    const visible = items.filter(
      (item) =>
        !word ||
        `${item.kind} ${item.resource} ${item.group} ${(item.shortNames ?? []).join(' ')}`
          .toLowerCase()
          .includes(word),
    );
    // 搜索时附上组 / 资源名提示：不同组里的同名 Kind（如 *Policy）靠它区分
    const showMeta = word !== '';
    const kindItem = (item: APIResource) => ({
      key: gvrKey(item),
      label: (
        <span className={styles.menuItem}>
          <span className={styles.menuItemName} title={item.kind}>
            {item.kind}
          </span>
          {showMeta && (
            <span className={styles.menuItemMeta}>
              {item.group || 'core'}/{item.resource}
            </span>
          )}
          {item.crd && <Tag style={{ marginInlineEnd: 0 }}>CRD</Tag>}
        </span>
      ),
    });

    const list: NonNullable<MenuProps['items']> = [];
    if (!word) {
      const recentItems = recent
        .map((key) => visible.find((item) => gvrKey(item) === key))
        .filter((item): item is APIResource => item !== undefined);
      if (recentItems.length > 0) {
        list.push({
          key: 'recent',
          type: 'group' as const,
          label: t('pages.k8s.resource.recent'),
          children: recentItems.map((item) => ({
            ...kindItem(item),
            key: `${RECENT_PREFIX}${gvrKey(item)}`,
          })),
        });
      }
    }
    const groups = new Map<string, APIResource[]>();
    for (const item of visible) {
      groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
    }
    for (const [group, kinds] of [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      list.push({
        key: `group:${group}`,
        type: 'group' as const,
        label: group || 'core',
        children: kinds
          .sort((a, b) => a.kind.localeCompare(b.kind))
          .map(kindItem),
      });
    }
    return list;
  }, [items, keyword, recent, styles, t]);

  const remember = (gvr: string) => {
    const next = [gvr, ...recent.filter((item) => item !== gvr)].slice(
      0,
      RECENT_LIMIT,
    );
    setRecent(next);
    writeStored(recentKeyOf(scope.clusterId), JSON.stringify(next));
  };

  const pick = (gvr: string) => {
    remember(gvr);
    const next = new URLSearchParams(params);
    next.set('gvr', gvr);
    setParams(next, { replace: true });
  };

  return (
    <div className={styles.split}>
      <aside className={styles.splitSide} ref={sideRef}>
        <div className={styles.splitSideTitle}>
          <span>
            {t('pages.k8s.resource.panel.title')}
            <span className={styles.sideCount}>{items.length}</span>
          </span>
          <Tooltip title={t('pages.k8s.resource.refresh')}>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              aria-label={t('pages.k8s.resource.refresh')}
              loading={loading && items.length > 0}
              onClick={() => setRefresh((n) => n + 1)}
            />
          </Tooltip>
        </div>
        <div style={{ padding: '8px 16px 0' }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('pages.k8s.resource.search')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        {loading && items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : items.length === 0 && error ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 24 }}
            description={error}
          >
            <Button onClick={() => setRefresh((n) => n + 1)}>
              {t('pages.k8s.table.retry')}
            </Button>
          </Empty>
        ) : menuItems.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 24 }}
            description={t('pages.k8s.resource.noMatch')}
          />
        ) : (
          <Menu
            mode="inline"
            inlineIndent={12}
            className={styles.sideMenu}
            style={{
              borderInlineEnd: 0,
              marginTop: 4,
              marginBottom: 6,
              background: 'transparent',
            }}
            selectedKeys={
              selectedKey ? [selectedKey, `${RECENT_PREFIX}${selectedKey}`] : []
            }
            items={menuItems}
            onClick={({ key }) =>
              pick(
                key.startsWith(RECENT_PREFIX)
                  ? key.slice(RECENT_PREFIX.length)
                  : key,
              )
            }
          />
        )}
      </aside>
      <div className={styles.splitMain}>
        {selected && selectedGVR ? (
          <ResourceView
            key={selectedKey}
            gvr={selectedGVR}
            namespaced={selected.namespaced}
            creatable={selected.verbs?.includes('create')}
          />
        ) : loading ? (
          <div style={{ padding: 96, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : selectedKey ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 96 }}
            description={t('pages.k8s.resource.missing')}
          >
            <Button onClick={() => setRefresh((n) => n + 1)}>
              {t('pages.k8s.resource.reload')}
            </Button>
          </Empty>
        ) : (
          <Empty
            style={{ marginTop: 96 }}
            description={t('pages.k8s.resource.pick')}
          >
            <span className={styles.secondary}>
              {t('pages.k8s.resource.total', { count: items.length })}
            </span>
          </Empty>
        )}
      </div>
    </div>
  );
};

const Resource: React.FC = () => (
  <K8sPage tabs={[{ key: 'browser', label: '', render: () => <Browser /> }]} />
);

export default Resource;
