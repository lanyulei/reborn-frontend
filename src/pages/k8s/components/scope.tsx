/**
 * 容器平台的全局作用域：集群 + 命名空间。选择写进 URL（?cluster=<id>&ns=<name>，链接可分享），
 * 最近一次选择记在 localStorage 作为缺省值。K8sPage 是各菜单页的外壳：页签（?tab=）、作用域栏、
 * 集群不可达提示，并提供终端面板。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import { Alert, Badge, Button, Empty, Select, Spin, Tag, Tooltip } from 'antd';
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
import { useK8sStyles } from './styles';

const CLUSTER_KEY = 'k8s.scope.cluster';
const nsKey = (clusterId: string) => `k8s.scope.ns.${clusterId}`;

const readStored = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStored = (key: string, value: string) => {
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

/** 作用域栏：集群切换器（按环境分组、可搜索）+ 命名空间切换器 */
const ScopeBar: React.FC<{ showNamespace: boolean }> = ({ showNamespace }) => {
  const t = useT();
  const { styles } = useK8sStyles();
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

  return (
    <div className={styles.scopeBar}>
      <span>
        <span className={styles.scopeLabel}>
          {t('pages.k8s.scope.cluster')}
        </span>
        <Select
          style={{ width: 300 }}
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
      </span>
      {showNamespace && (
        <span>
          <span className={styles.scopeLabel}>
            {t('pages.k8s.scope.namespace')}
          </span>
          <Select
            style={{ width: 240 }}
            loading={scope.nsLoading}
            disabled={!scope.clusterId}
            value={
              scope.nsLoading && !scope.namespace ? undefined : scope.namespace
            }
            options={nsOptions}
            showSearch
            onChange={scope.setNamespace}
          />
        </span>
      )}
      {scope.cluster?.k8sVersion && <Tag>{scope.cluster.k8sVersion}</Tag>}
      {scope.cluster?.env && (
        <Tag color={scope.isProd ? 'red' : undefined}>{scope.cluster.env}</Tag>
      )}
      <Tooltip title={t('pages.k8s.scope.reload')}>
        <Button type="text" icon={<ReloadOutlined />} onClick={scope.reload} />
      </Tooltip>
      <PermissionRequestButton clusterId={scope.clusterId} />
    </div>
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

  let body: React.ReactNode;
  if (scope.loading && !scope.clusterId) {
    body = <Spin style={{ display: 'block', margin: '48px auto' }} />;
  } else if (!scope.clusterId) {
    body = (
      <Empty description={t('pages.k8s.scope.noCluster')}>
        <PermissionRequestButton type="primary" />
      </Empty>
    );
  } else if (mode === 'namespace' && !scope.nsReady) {
    body = scope.nsLoading ? (
      <Spin style={{ display: 'block', margin: '48px auto' }} />
    ) : scope.nsError ? null : (
      <Empty description={t('pages.k8s.scope.noNamespace')} />
    );
  } else {
    // 切换集群 / 命名空间即重建内容：列表状态、打开的抽屉不跨作用域残留
    body = (
      <div
        key={`${scope.clusterId}/${mode === 'namespace' ? scope.namespace : ''}`}
      >
        {tab.render()}
      </div>
    );
  }
  return (
    <>
      <ScopeBar showNamespace={mode === 'namespace'} />
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
      {body}
    </>
  );
};

const NO_GROUP: RouteTab[] = [];
const GROUP_KEEP = ['cluster'];

/**
 * 容器平台菜单页外壳。属于菜单分组的页面传 group：页头改为分组的路由页签（切换时保留所选集群），
 * 页内的 tabs 仍按 ?tab= 选中——分组里须为它们各列一个带 tab 的页签。
 */
export const K8sPage: React.FC<{ tabs: K8sTab[]; group?: RouteTab[] }> = ({
  tabs,
  group,
}) => {
  const scope = useScopeState();
  const [params, setParams] = useSearchParams();
  const active = tabs.find((tab) => tab.key === params.get('tab')) ?? tabs[0];
  const groupTabs = useRouteTabs(group ?? NO_GROUP, GROUP_KEEP);

  return (
    <ScopeContext.Provider value={scope}>
      <PageContainer
        title={false}
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
