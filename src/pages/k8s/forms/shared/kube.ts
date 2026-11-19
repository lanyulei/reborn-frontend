/**
 * 创建向导访问集群的辅助函数。向导只读取候选项（命名空间、已有对象的名称 / 内容），
 * 不直接写集群：生成的清单统一交给清单弹窗（ManifestModal）预检后提交。
 */
import { useEffect, useState } from 'react';
import {
  getObject,
  listNamespaceOptions,
  listResources,
} from '@/services/k8s/resource';
import type { GVR, K8sObject, ListRow } from '@/services/k8s/typings';

export { GVRS } from '../../components/meta';
export { parseObject, toYaml } from '../../components/workloadForm';

/** 当前用户在该集群可见的命名空间（取不到时为空数组，向导里可手输） */
export const useNamespaceOptions = (
  clusterId: string,
): { namespaces: string[]; loading: boolean } => {
  const [state, setState] = useState<{
    namespaces: string[];
    loading: boolean;
  }>({ namespaces: [], loading: true });
  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));
    listNamespaceOptions(clusterId, { silent: true })
      .then((res) => {
        if (!cancelled)
          setState({ namespaces: res.items ?? [], loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ namespaces: [], loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId]);
  return state;
};

/** 后端单页上限 */
const PAGE_SIZE = 200;
/** 候选项至多取这么多页（1000 条）：再多的下拉没有意义，改为手输 */
const MAX_PAGES = 5;

/**
 * 列出某类资源的行（按名称排序，自动翻页，至多 1000 条）。namespace 为空 = 全部命名空间 / 集群级资源。
 * 失败（无权限等）返回已取到的部分（可能为空）：候选项取不到时表单仍可手输。
 */
export const listRows = async (
  clusterId: string,
  gvr: GVR,
  namespace?: string,
  extra?: { labelSelector?: string; keyword?: string },
): Promise<ListRow[]> => {
  const rows: ListRow[] = [];
  let token: string | undefined;
  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const res = await listResources(
        clusterId,
        {
          ...gvr,
          namespace: namespace || undefined,
          pageSize: PAGE_SIZE,
          sortBy: 'name',
          ...extra,
          // 走缓存的资源按页码翻页，其余资源用集群的 continue 令牌
          ...(token ? { continue: token } : { page }),
        },
        { silent: true },
      );
      const batch = res.rows ?? [];
      rows.push(...batch);
      token = res.continue || undefined;
      const more = res.capabilities?.cached
        ? batch.length === PAGE_SIZE
        : Boolean(token);
      if (!more) break;
    }
  } catch {
    // 返回已取到的部分
  }
  return rows;
};

/** 某类资源的名称清单 */
export const listNames = async (
  clusterId: string,
  gvr: GVR,
  namespace?: string,
): Promise<string[]> =>
  (await listRows(clusterId, gvr, namespace)).map((row) => row.name);

/** 取一个对象的原文；取不到返回 undefined */
export const fetchObject = async (
  clusterId: string,
  gvr: GVR,
  name: string,
  namespace?: string,
): Promise<K8sObject | undefined> => {
  try {
    const res = await getObject(
      clusterId,
      { ...gvr, namespace: namespace || undefined, name },
      { silent: true },
    );
    return res.object;
  } catch {
    return undefined;
  }
};
