/**
 * 操作者 ID → 显示名映射（昵称优先，无昵称回落用户名）。
 * listUsers 单页上限 100，翻页取全量；未命中的 ID（system / 已删除用户 /
 * 无用户列表权限的访问者）由调用方原样展示原始值，加载失败同样静默降级。
 */
import { useQuery } from '@umijs/max';
import { listUsers } from '@/services/system/user';
import { fetchAllPages } from '@/utils/paging';

/**
 * 同一页面多处（各标签页、各表格）同时需要这份映射：取数走 react-query，
 * 并发调用共享一次请求，30 秒内复用结果（与原先手写缓存的时长一致）。
 * 静默请求：失败不重试，切回窗口不自动刷新；失败的结果不进缓存，下次使用会重新请求。
 */
const USER_NAMES_QUERY_KEY = ['system', 'user-names'] as const;
const NAMES_STALE_TIME_MS = 30_000;
const NO_NAMES: Record<string, string> = {};

export function useUserNames(): Record<string, string> {
  const { data } = useQuery({
    queryKey: USER_NAMES_QUERY_KEY,
    queryFn: async (): Promise<Record<string, string>> => {
      const items = await fetchAllPages((page, pageSize) =>
        listUsers({ page, pageSize }, { silent: true }),
      );
      return Object.fromEntries(
        items.map((u) => [u.id, u.nickname || u.username]),
      );
    },
    staleTime: NAMES_STALE_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
  return data ?? NO_NAMES;
}
