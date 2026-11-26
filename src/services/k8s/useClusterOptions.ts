/**
 * 集群选项的共享查询：全站唯一的集群列表缓存（staleTime 内跨页面复用，并发去重）。
 * 此前各页面手写 useEffect + cancelled 标志各自请求（scope / event / audit / change /
 * KubeconfigModal），monitorLink 还手写过模块级 Promise 单例——统一收敛到这个 key。
 * 集群接入 / 删除 / Agent 变更后由集群管理页（src/pages/k8s/cluster）invalidate。
 */
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@umijs/max';
import type { ClusterOption } from './typings';
import { listClusterOptions } from './cluster';

/** 共享缓存键：失效与选择器（如 name→id 映射）都用它，不要另立第二个 key */
export const CLUSTER_OPTIONS_KEY = ['k8s', 'cluster-options'] as const;

// 显式返回类型：只靠推断会引用 @tanstack/react-query 内部路径（TS2883 不可移植）。
// 泛型也要写全：留给编译器推断时 data / error 会被推成含 undefined / null 的联合类型，
// 与这里的返回类型对不上（TS2322）。
export const useClusterOptions = (): UseQueryResult<ClusterOption[], Error> =>
  useQuery<
    ClusterOption[],
    Error,
    ClusterOption[],
    typeof CLUSTER_OPTIONS_KEY
  >({
    queryKey: CLUSTER_OPTIONS_KEY,
    queryFn: async (): Promise<ClusterOption[]> => {
      const res = await listClusterOptions({ silent: true });
      return res.items ?? [];
    },
    // 集群列表变化频率低；失败与原各调用点一致（静默保留旧值），不重试
    staleTime: 60_000,
    retry: false,
  });
