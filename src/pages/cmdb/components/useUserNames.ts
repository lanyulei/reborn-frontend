/**
 * 操作者 ID → 显示名映射（昵称优先，无昵称回落用户名）。
 * listUsers 单页上限 100，翻页取全量；未命中的 ID（system / 已删除用户 /
 * 无用户列表权限的访问者）由调用方原样展示原始值，加载失败同样静默降级。
 */
import { useEffect, useState } from 'react';
import { listUsers } from '@/services/system/user';
import { fetchAllPages } from '@/utils/paging';

/**
 * 模块级短缓存：同一页面多处（各标签页、各表格）同时需要这份映射，
 * 并发调用共享一次请求，30 秒 内复用结果；失败不缓存。
 */
const TTL_MS = 30_000;
let cache: { at: number; promise: Promise<Record<string, string>> } | null =
  null;

function loadUserNames(): Promise<Record<string, string>> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const promise = fetchAllPages((page, pageSize) =>
      listUsers({ page, pageSize }, { silent: true }),
    ).then((items) =>
      Object.fromEntries(items.map((u) => [u.id, u.nickname || u.username])),
    );
    const entry = { at: Date.now(), promise };
    cache = entry;
    promise.catch(() => {
      if (cache === entry) cache = null;
    });
  }
  return cache.promise;
}

export function useUserNames(): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    loadUserNames()
      .then((map) => {
        if (!cancelled) setNames(map);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return names;
}
