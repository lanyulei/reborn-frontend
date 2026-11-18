/**
 * 监控告警页面共享数据 hook 与候选来源：规则分组、数据源选项、通知对象候选（值班表 / 部门）、
 * 规则候选。用户候选见 components/UserSelect/sources.ts 的 fetchMonitorUsers。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listDatasourceOptions } from '@/services/monitor/datasource';
import { listRules } from '@/services/monitor/rule';
import { listRuleGroups } from '@/services/monitor/ruleGroup';
import {
  listTargetOptions,
  type TargetOptions,
} from '@/services/monitor/target';
import type {
  DatasourceOption,
  NamedRef,
  RuleGroup,
} from '@/services/monitor/typings';
import type { SystemDept } from '@/services/system/typings';
import { type Translate, useT } from '@/utils/i18n';

/** 当前用户可见的规则分组（平铺）与是否超级管理员；enabled=false 时不请求 */
export const useRuleGroups = (enabled = true) => {
  const [groups, setGroups] = useState<RuleGroup[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const result = await listRuleGroups({ silent: true });
      setGroups(result.items ?? []);
      setIsAdmin(result.isAdmin === true);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { groups, isAdmin, loading, reload };
};

/**
 * 数据源下拉选项（缺省数据源在前）；enabledOnly 时只含已启用的；enabled=false 时不请求。
 */
export const useDatasourceOptions = (enabledOnly?: boolean, enabled = true) => {
  const t = useT();
  const [items, setItems] = useState<DatasourceOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    listDatasourceOptions(enabledOnly)
      .then((result) => {
        if (!cancelled) setItems(result.items ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabledOnly, enabled]);

  const options = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: [
          item.name,
          item.isDefault && t('pages.monitor.datasource.defaultSuffix'),
          !item.enabled && t('pages.monitor.datasource.disabledSuffix'),
        ]
          .filter(Boolean)
          .join(' '),
      })),
    [items, t],
  );
  const defaultId = useMemo(
    () => (items.find((item) => item.isDefault) ?? items[0])?.id,
    [items],
  );
  return { items, options, defaultId, loaded };
};

/** useDatasourceOptions 的返回值：页面取一次，下传给各表单 / 抽屉 */
export type DatasourceOptionsState = ReturnType<typeof useDatasourceOptions>;

/**
 * 候选项 + 详情返回的引用（数据源 / 值班表）：已选但不在候选里的补一项用于回显，否则下拉里
 * 只显示裸 ID；其中后端标记为已删除或不可用的另加标注。
 */
export const withRefOptions = (
  options: readonly { value: string; label: string }[],
  refs: readonly NamedRef[] | undefined,
  t: Translate,
): { value: string; label: string }[] => {
  const present = new Set(options.map((option) => option.value));
  const missing = (refs ?? [])
    .filter((ref) => !present.has(ref.id))
    .map((ref) => ({
      value: ref.id,
      label: ref.missing
        ? t('pages.monitor.ref.missingOption', { name: ref.name || ref.id })
        : ref.name || ref.id,
    }));
  return [...options, ...missing];
};

/** 模块级短缓存：多个表单并用只请求一次，30 秒内复用；失败不缓存（同 DeptSelect 的做法） */
const TARGET_TTL_MS = 30_000;
let targetCache: { at: number; promise: Promise<TargetOptions> } | null = null;

const loadTargets = (): Promise<TargetOptions> => {
  if (!targetCache || Date.now() - targetCache.at > TARGET_TTL_MS) {
    const promise = listTargetOptions({ kinds: ['schedule', 'dept'] });
    const entry = { at: Date.now(), promise };
    targetCache = entry;
    promise.catch(() => {
      if (targetCache === entry) targetCache = null;
    });
  }
  return targetCache.promise;
};

/**
 * 通知对象候选（值班表选项、部门列表），取自监控告警域自己的候选接口。enabled=false 时不请求
 * （只读查看：没有新建 / 编辑权限即没有该接口权限，已选项靠详情返回的显示名回显）。
 * failed：加载失败（多为没有权限）——表单据此给出提示，而不是只留一个空的下拉框；retry 重新加载
 * （失败的请求不进缓存）。
 */
export const useNotifyTargets = (enabled = true) => {
  const [data, setData] = useState<TargetOptions>({});
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // attempt 只用来触发重试
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    loadTargets()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return useMemo(
    () => ({
      scheduleOptions: (data.schedules ?? []).map((schedule) => ({
        value: schedule.id,
        label: schedule.groupName
          ? `${schedule.groupName} / ${schedule.name ?? ''}`
          : (schedule.name ?? schedule.id),
      })),
      // 候选接口不区分启停（DeptSelect 把 status 为 0 / 缺失的部门当作已停用）：一律按可选处理
      depts: (data.depts ?? []).map<SystemDept>((dept) => ({
        id: dept.id,
        name: dept.name ?? dept.id,
        parentId: dept.parentId,
        status: 1,
      })),
      failed,
      loading,
      retry,
    }),
    [data, failed, loading, retry],
  );
};

/** 规则候选（稳定引用）：按关键字在数据范围内搜索，展示「分组 / 规则名」 */
export const fetchMonitorRules = async (keyword: string) => {
  const { items } = await listRules(
    { page: 1, pageSize: 50, keyword: keyword || undefined },
    { silent: true },
  );
  return (items ?? []).map((rule) => ({
    id: rule.id,
    label: rule.groupName
      ? `${rule.groupName} / ${rule.spec.name}`
      : rule.spec.name,
  }));
};

/** NamedRef 列表 → 选择器的已知显示名（已删除的对象回落为 ID） */
export const refsToKnown = (refs?: readonly NamedRef[]) =>
  (refs ?? []).map((ref) => ({ id: ref.id, label: ref.name || ref.id }));
