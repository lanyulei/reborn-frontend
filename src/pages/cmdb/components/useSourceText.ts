/**
 * 变更历史「来源」展示文案：manual / assistant 走 i18n，
 * sync:<采集源ID> 解析为「同步 · 源名称」。
 * 采集源列表单页上限 100，翻页取全量；未命中（已删除源 / 无同步权限的
 * 访问者）与未知值原样展示，加载失败同样静默降级。
 */
import { useQuery } from '@umijs/max';
import { useCallback } from 'react';
import { listSources } from '@/services/cmdb/sync';
import { useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';

/**
 * 同一页面多处（各标签页、各表格）同时需要这份映射：取数走 react-query，
 * 并发调用共享一次请求，30 秒内复用结果（与原先手写缓存的时长一致）。
 * 静默请求：失败不重试，切回窗口不自动刷新；失败的结果不进缓存，下次使用会重新请求。
 */
const SOURCE_NAMES_QUERY_KEY = ['cmdb', 'source-names'] as const;
const NAMES_STALE_TIME_MS = 30_000;
const NO_NAMES: Record<string, string> = {};
const SYNC_PREFIX = 'sync:';

export function useSourceText(): (source?: string) => string {
  const t = useT();
  const { data } = useQuery({
    queryKey: SOURCE_NAMES_QUERY_KEY,
    queryFn: async (): Promise<Record<string, string>> => {
      const items = await fetchAllPages((page, pageSize) =>
        listSources({ page, pageSize }, { silent: true }),
      );
      return Object.fromEntries(items.map((s) => [s.id, s.name]));
    },
    staleTime: NAMES_STALE_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const names = data ?? NO_NAMES;

  return useCallback(
    (source?: string) => {
      if (source === 'manual') return t('pages.cmdb.detail.source.manual');
      if (source === 'assistant')
        return t('pages.cmdb.detail.source.assistant');
      if (source?.startsWith(SYNC_PREFIX)) {
        const name = names[source.slice(SYNC_PREFIX.length)];
        return name ? t('pages.cmdb.detail.source.sync', { name }) : source;
      }
      return source ?? '';
    },
    [names, t],
  );
}
