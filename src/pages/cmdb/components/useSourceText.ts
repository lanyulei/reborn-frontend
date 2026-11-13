/**
 * 变更历史「来源」展示文案：manual / assistant 走 i18n，
 * sync:<采集源ID> 解析为「同步 · 源名称」。
 * 采集源列表单页上限 100，翻页取全量；未命中（已删除源 / 无同步权限的
 * 访问者）与未知值原样展示，加载失败同样静默降级。
 */
import { useCallback, useEffect, useState } from 'react';
import { listSources } from '@/services/cmdb/sync';
import { useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';

/**
 * 模块级短缓存：同一页面多处（各标签页、各表格）同时需要这份映射，
 * 并发调用共享一次请求，30 秒 内复用结果；失败不缓存。
 */
const TTL_MS = 30_000;
let cache: { at: number; promise: Promise<Record<string, string>> } | null =
  null;

function loadSourceNames(): Promise<Record<string, string>> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const promise = fetchAllPages((page, pageSize) =>
      listSources({ page, pageSize }, { silent: true }),
    ).then((items) => Object.fromEntries(items.map((s) => [s.id, s.name])));
    const entry = { at: Date.now(), promise };
    cache = entry;
    promise.catch(() => {
      if (cache === entry) cache = null;
    });
  }
  return cache.promise;
}
const SYNC_PREFIX = 'sync:';

export function useSourceText(): (source?: string) => string {
  const t = useT();
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    loadSourceNames()
      .then((map) => {
        if (!cancelled) setNames(map);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

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
