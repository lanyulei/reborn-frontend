/**
 * 容器平台的全局作用域：集群 + 命名空间。选择写进 URL（?cluster=<id>&ns=<name>，链接可分享），
 * 最近一次选择记在 localStorage 作为缺省值。K8sPage 是各菜单页的外壳：页签（?tab=）、集群不可达
 * 提示，并提供终端面板。集群 / 命名空间筛选（ScopeSelects）放在各列表的工具栏里（表格上方）。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  ConfigProvider,
  Empty,
  Flex,
  Select,
  Spin,
  type ThemeConfig,
  Tooltip,
  theme,
} from 'antd';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type RouteTab, useRouteTabs } from '@/components/RouteTabs';
import { listClusterOptions } from '@/services/k8s/cluster';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { listNamespaceOptions } from '@/services/k8s/resource';
import type { ClusterOption } from '@/services/k8s/typings';
import { useT } from '@/utils/i18n';
import { PermissionRequestButton } from '../change/requests';
import { ApprovalBar } from './approval';
import { isProdEnv } from './meta';

const CLUSTER_KEY = 'k8s.scope.cluster';
const nsKey = (clusterId: string) => `k8s.scope.ns.${clusterId}`;

export const readStored = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
export const writeStored = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 存储不可用（隐私模式等）：只是不记住选择
  }
};

export interface K8sScope {
  clusters: ClusterOption[];
  loading: boolean;
  cluster?: ClusterOption;
  /** 当前集群 ID；未选择为空串 */
  clusterId: string;
  /** 当前命名空间；空串 = 全部命名空间 */
  namespace: string;
  namespaces: string[];
  /** 用户可以选择「全部命名空间」 */
  allowAll: boolean;
  nsLoading: boolean;
  /** 命名空间已确定（可以开始加载命名空间级的内容） */
  nsReady: boolean;
  nsError?: string;
  /** 当前集群是生产环境：危险操作需输入资源名 */
  isProd: boolean;
  setCluster: (id: string) => void;
  setNamespace: (ns: string) => void;
  reload: () => void;
}

const ScopeContext = createContext<K8sScope | null>(null);

/** 当前作用域；只能在 K8sPage 内使用 */
export const useK8sScope = (): K8sScope => {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error('useK8sScope must be used inside K8sPage');
  return scope;
};

/** 当前集群的名称；不在 K8sPage 内时为空串 */
export const useClusterName = (): string =>
  useContext(ScopeContext)?.cluster?.name ?? '';

/** 当前集群是否生产环境；不在 K8sPage 内（如角色权限页）时为 false */
export const useIsProd = (): boolean =>
  useContext(ScopeContext)?.isProd ?? false;

const useScopeState = (): K8sScope => {
  const [params, setParams] = useSearchParams();
  const [clusters, setClusters] = useState<ClusterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [ns, setNs] = useState<{
    clusterId: string;
    items: string[];
    all: boolean;
    error?: string;
  }>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listClusterOptions({ silent: true })
      .then((res) => {
        if (!cancelled) setClusters(res.items ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const urlCluster = params.get('cluster') ?? '';
  const cluster = useMemo(() => {
    const pick = (id: string | null) =>
      id ? clusters.find((item) => item.id === id) : undefined;
    return (
      pick(urlCluster) ??
      (urlCluster ? undefined : (pick(readStored(CLUSTER_KEY)) ?? clusters[0]))
    );
  }, [clusters, urlCluster]);
  const clusterId = cluster?.id ?? '';

  useEffect(() => {
    if (!clusterId) return;
    let cancelled = false;
    listNamespaceOptions(clusterId, { silent: true })
      .then((res) => {
        if (!cancelled) {
          setNs({ clusterId, items: res.items ?? [], all: res.all === true });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setNs({
            clusterId,
            items: [],
            all: false,
            error: getK8sErrorMessage(error),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId, tick]);

  const nsLoaded = ns?.clusterId === clusterId ? ns : undefined;
  const namespaces = nsLoaded?.items ?? [];
  const allowAll = nsLoaded?.all ?? false;
  const urlNs = params.get('ns');

  let namespace = '';
  if (urlNs) {
    namespace = urlNs;
  } else if (nsLoaded) {
    const remembered = readStored(nsKey(clusterId));
    if (
      remembered !== null &&
      remembered !== '' &&
      namespaces.includes(remembered)
    ) {
      namespace = remembered;
    } else if (!allowAll) {
      namespace = namespaces[0] ?? '';
    }
  }

  const update = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const setCluster = useCallback(
    (id: string) => {
      writeStored(CLUSTER_KEY, id);
      update({ cluster: id, ns: undefined });
    },
    [update],
  );
  const setNamespace = useCallback(
    (value: string) => {
      if (clusterId) writeStored(nsKey(clusterId), value);
      update({ cluster: clusterId || undefined, ns: value || undefined });
    },
    [update, clusterId],
  );
  const reload = useCallback(() => setTick((n) => n + 1), []);

  return {
    clusters,
    loading,
    cluster,
    clusterId,
    namespace,
    namespaces,
    allowAll,
    nsLoading: !!clusterId && !nsLoaded,
    nsReady: !!urlNs || (!!nsLoaded && (allowAll || namespace !== '')),
    nsError: nsLoaded?.error,
    isProd: isProdEnv(cluster?.env),
    setCluster,
    setNamespace,
    reload,
  };
};

const STATUS_BADGE = ['default', 'success', 'error'] as const;

// 下拉列表里当前选中的选项默认加粗（optionSelectedFontWeight = fontWeightStrong / 600），
// 改回普通字重，与未选中选项一致（下拉渲染在 body 弹层里，不受下方行内重置影响，
// 须经组件 token 调整；选中态仍有勾选图标与底色标识）。只作用于这两个筛选框。
const SCOPE_SELECT_THEME: ThemeConfig = {
  components: {
    Select: { optionSelectedFontWeight: 400 },
  },
};

/**
 * 集群 / 命名空间筛选：放在列表工具栏（表格上方，新建按钮左侧）。不加标题，
 * 集群在左（按环境分组、可搜索）、命名空间在右。
 */
export const ScopeSelects: React.FC<{ showNamespace?: boolean }> = ({
  showNamespace = true,
}) => {
  const t = useT();
  const scope = useK8sScope();

  const clusterOptions = useMemo(() => {
    const groups = new Map<string, ClusterOption[]>();
    for (const item of scope.clusters) {
      const env = item.env || '';
      groups.set(env, [...(groups.get(env) ?? []), item]);
    }
    return [...groups.entries()].map(([env, items]) => ({
      label: env || t('pages.k8s.scope.noEnv'),
      options: items.map((item) => ({
        value: item.id,
        search: `${item.name} ${item.displayName ?? ''}`.toLowerCase(),
        label: (
          <span>
            <Badge status={STATUS_BADGE[item.status ?? 0]} />
            <span style={{ marginInlineStart: 8 }}>
              {item.displayName
                ? `${item.displayName}（${item.name}）`
                : item.name}
            </span>
          </span>
        ),
      })),
    }));
  }, [scope.clusters, t]);

  const nsOptions = useMemo(
    () => [
      ...(scope.allowAll
        ? [{ value: '', label: t('pages.k8s.scope.allNamespaces') }]
        : []),
      ...scope.namespaces.map((item) => ({ value: item, label: item })),
      // URL 里带的命名空间不在可见清单里（清单尚未加载或无权限）时仍要能显示
      ...(scope.namespace && !scope.namespaces.includes(scope.namespace)
        ? [{ value: scope.namespace, label: scope.namespace }]
        : []),
    ],
    [scope.allowAll, scope.namespaces, scope.namespace, t],
  );

  const { token } = theme.useToken();

  return (
    <ConfigProvider theme={SCOPE_SELECT_THEME}>
      {/* ProTable 把 headerTitle 渲染在 list-toolbar-title 里（fontWeight 500 + fontSizeLG），
          选择框（含占位文案）会继承得比普通控件更粗更大：重置回常规字号字重 */}
      <span
        style={{
          display: 'inline-flex',
          gap: 8,
          fontSize: token.fontSize,
          fontWeight: 400,
        }}
      >
        <Select
          style={{ width: 240 }}
          loading={scope.loading}
          value={scope.clusterId || undefined}
          placeholder={t('pages.k8s.scope.cluster.placeholder')}
          options={clusterOptions}
          showSearch={{
            filterOption: (input, option) =>
              String(
                (option as { search?: string } | undefined)?.search ?? '',
              ).includes(input.toLowerCase()),
          }}
          onChange={scope.setCluster}
        />
        {showNamespace && (
          <Select
            style={{ width: 200 }}
            loading={scope.nsLoading}
            disabled={!scope.clusterId}
            value={
              scope.nsLoading && !scope.namespace ? undefined : scope.namespace
            }
            options={nsOptions}
            showSearch
            onChange={scope.setNamespace}
          />
        )}
      </span>
    </ConfigProvider>
  );
};

export interface K8sTab {
  key: string;
  label: string;
  /** none 不需要作用域；cluster 只需要集群；namespace（缺省）需要集群与命名空间 */
  scope?: 'none' | 'cluster' | 'namespace';
  render: () => React.ReactNode;
}

const TabBody: React.FC<{ tab: K8sTab }> = ({ tab }) => {
  const t = useT();
  const scope = useK8sScope();
  const mode = tab.scope ?? 'namespace';
  if (mode === 'none') return <>{tab.render()}</>;

  let empty: React.ReactNode;
  if (scope.loading && !scope.clusterId) {
    empty = <Spin style={{ display: 'block', margin: '48px auto' }} />;
  } else if (!scope.clusterId) {
    empty = (
      <Empty description={t('pages.k8s.scope.noCluster')}>
        <PermissionRequestButton type="primary" />
      </Empty>
    );
  } else if (mode === 'namespace' && !scope.nsReady) {
    empty = scope.nsLoading ? (
      <Spin style={{ display: 'block', margin: '48px auto' }} />
    ) : scope.nsError ? null : (
      <Empty description={t('pages.k8s.scope.noNamespace')} />
    );
  }

  return (
    <>
      {/* 集群 / 命名空间筛选在各列表的工具栏里；列表未渲染（空态）时在这里兜底，保证还能切换集群 */}
      {empty !== undefined && scope.clusters.length > 0 && (
        <Flex gap={8} wrap align="center" style={{ marginBottom: 16 }}>
          <ScopeSelects showNamespace={mode === 'namespace'} />
          <Tooltip title={t('pages.k8s.scope.reload')}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={scope.reload}
            />
          </Tooltip>
          <PermissionRequestButton clusterId={scope.clusterId} />
        </Flex>
      )}
      <ApprovalBar cluster={scope.cluster} />
      {scope.cluster?.status === 2 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('pages.k8s.scope.unreachable')}
          description={scope.cluster.lastError}
        />
      )}
      {scope.nsError && scope.cluster?.status !== 2 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={scope.nsError}
        />
      )}
      {empty !== undefined ? (
        empty
      ) : (
        // 切换集群 / 命名空间即重建内容：列表状态、打开的抽屉不跨作用域残留
        <div
          key={`${scope.clusterId}/${mode === 'namespace' ? scope.namespace : ''}`}
        >
          {tab.render()}
        </div>
      )}
    </>
  );
};

const NO_GROUP: RouteTab[] = [];
const GROUP_KEEP = ['cluster'];

/**
 * 容器平台菜单页外壳。属于菜单分组的页面传 group：页头改为分组的路由页签（切换时保留所选集群），
 * 页内的 tabs 仍按 ?tab= 选中——分组里须为它们各列一个带 tab 的页签。
 */
export const K8sPage: React.FC<{
  tabs: K8sTab[];
  group?: RouteTab[];
  /** 覆盖自动生成的面包屑（如详情页给出「容器平台 / 列表页 / 资源详情」） */
  breadcrumb?: React.ComponentProps<typeof PageContainer>['breadcrumb'];
}> = ({ tabs, group, breadcrumb }) => {
  const scope = useScopeState();
  const [params, setParams] = useSearchParams();
  const active = tabs.find((tab) => tab.key === params.get('tab')) ?? tabs[0];
  const groupTabs = useRouteTabs(group ?? NO_GROUP, GROUP_KEEP);

  return (
    <ScopeContext.Provider value={scope}>
      {/* breadcrumb 键一旦出现（哪怕值为 undefined）就会覆盖路由自动生成的面包屑：
          只在真的传入时才带这个键 */}
      <PageContainer
        title={false}
        {...(breadcrumb ? { breadcrumb } : {})}
        tabList={
          tabs.length > 1
            ? tabs.map((tab) => ({ key: tab.key, tab: tab.label }))
            : undefined
        }
        tabActiveKey={active.key}
        onTabChange={(key) => {
          const next = new URLSearchParams(params);
          next.set('tab', key);
          setParams(next, { replace: true });
        }}
        {...(group ? groupTabs : undefined)}
      >
        <TabBody key={active.key} tab={active} />
      </PageContainer>
    </ScopeContext.Provider>
  );
};
