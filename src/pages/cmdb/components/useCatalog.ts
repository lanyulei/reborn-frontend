/**
 * 模型目录统一加载：模型 + 分组 + 我的数据范围 + 收藏。
 * 分组与收藏接口对存量角色可能 403（角色重新保存授权前），全部按可降级处理：
 * - 分组失败：由模型 category 推导分组（内置分类用 i18n 文案），并置 groupsEditable
 *   = false，调用方隐藏分组管理入口
 * - 收藏失败：favorites = null，调用方隐藏收藏入口
 * - 范围失败：视为不受限（数据接口由后端守卫兜底）
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  listFavorites,
  listModelGroups,
  setFavorite,
} from '@/services/cmdb/insight';
import { listAllModels } from '@/services/cmdb/model';
import { getMyScope, type MyScope } from '@/services/cmdb/scope';
import type {
  CmdbModel,
  CmdbModelCategory,
  CmdbModelGroup,
} from '@/services/cmdb/typings';
import { useEnumText } from '@/utils/i18n';
import { CMDB_CATEGORY_META, CMDB_CATEGORY_ORDER } from './meta';

/** 分组（name 已解析：内置分组优先 i18n，其余用服务端名；modelCount 为前端统计） */
export type CatalogGroup = Omit<CmdbModelGroup, 'modelCount'> & {
  modelCount: number;
};

export interface UseCatalogResult {
  loading: boolean;
  /** 全部模型（模型管理用，不按数据范围过滤） */
  allModels: CmdbModel[];
  /** 数据范围内可见的模型（实例列表用） */
  models: CmdbModel[];
  groups: CatalogGroup[];
  /** 分组接口可用；false = 由 category 推导，隐藏分组管理入口 */
  groupsEditable: boolean;
  /** 收藏的模型 code；null 表示收藏能力不可用（隐藏星标） */
  favorites: string[] | null;
  toggleFavorite: (modelCode: string) => void;
  reload: () => void;
  /** 仅刷新模型实例数（比 reload 轻：只发模型请求） */
  refreshCounts: () => void;
}

export function useCatalog(): UseCatalogResult {
  const categoryText = useEnumText(CMDB_CATEGORY_META);
  const [loading, setLoading] = useState(true);
  const [allModels, setAllModels] = useState<CmdbModel[]>([]);
  const [scope, setScope] = useState<MyScope>({
    unrestricted: true,
    modelCodes: [],
    envs: [],
  });
  const [serverGroups, setServerGroups] = useState<CmdbModelGroup[] | null>(
    null,
  );
  const [favorites, setFavorites] = useState<string[] | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // 模型翻页取全；显式 reload（tick > 0）时跳过短缓存拿最新数据
        const [modelsRes, scopeRes, groupsRes, favRes] = await Promise.all([
          listAllModels({ fresh: tick > 0 }),
          getMyScope().catch(() => null),
          listModelGroups().catch(() => null),
          listFavorites().catch(() => null),
        ]);
        if (cancelled) return;
        setAllModels(modelsRes.items);
        if (scopeRes) setScope(scopeRes);
        setServerGroups(groupsRes?.items ?? null);
        setFavorites(favRes ? favRes.modelCodes : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const groups = useMemo<Omit<CmdbModelGroup, 'modelCount'>[]>(() => {
    const categoryMeta = CMDB_CATEGORY_META as Record<
      string,
      { textId: string }
    >;
    const list = (serverGroups ?? []).map(
      (g): Omit<CmdbModelGroup, 'modelCount'> => ({
        ...g,
        name:
          g.builtin && categoryMeta[g.code]
            ? categoryText(g.code as CmdbModelCategory)
            : g.name,
      }),
    );
    // 兜底：模型引用了分组接口未返回（或不可用）的分组时，按 category 推导
    const known = new Set(list.map((g) => g.code));
    const missing: Omit<CmdbModelGroup, 'modelCount'>[] = [];
    for (const code of CMDB_CATEGORY_ORDER) {
      if (known.has(code)) continue;
      if (allModels.some((m) => m.category === code)) {
        missing.push({
          code,
          name: categoryText(code),
          sort: 500,
          builtin: true,
        });
        known.add(code);
      }
    }
    for (const m of allModels) {
      if (known.has(m.category)) continue;
      missing.push({
        code: m.category,
        name: m.category,
        sort: 900,
        builtin: false,
      });
      known.add(m.category);
    }
    return [...list, ...missing];
  }, [serverGroups, allModels, categoryText]);

  // modelCount 由前端统计（服务端分组不带计数时同样成立）
  const groupsWithCount = useMemo<CatalogGroup[]>(
    () =>
      groups.map((g) => ({
        ...g,
        modelCount: allModels.filter((m) => m.category === g.code).length,
      })),
    [groups, allModels],
  );

  const models = useMemo(
    () =>
      scope.unrestricted
        ? allModels
        : allModels.filter((m) => scope.modelCodes.includes(m.code)),
    [allModels, scope],
  );

  // 收藏切换：本地乐观更新，失败回滚（错误提示由 authRequest 全局处理）
  const favoritesRef = useRef<string[] | null>(null);
  favoritesRef.current = favorites;
  const toggleFavorite = useCallback((modelCode: string) => {
    const cur = favoritesRef.current;
    if (!cur) return;
    const favorite = !cur.includes(modelCode);
    setFavorites(
      favorite ? [...cur, modelCode] : cur.filter((c) => c !== modelCode),
    );
    setFavorite(modelCode, favorite).catch(() => setFavorites(cur));
  }, []);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  // 只刷新模型（实例数）：行操作后用它，不必连同范围 / 分组 / 收藏一起重拉
  const refreshCounts = useCallback(() => {
    listAllModels({ fresh: true })
      .then((res) => setAllModels(res.items))
      .catch(() => undefined);
  }, []);

  return {
    loading,
    allModels,
    models,
    groups: groupsWithCount,
    groupsEditable: serverGroups !== null,
    favorites,
    toggleFavorite,
    reload,
    refreshCounts,
  };
}
