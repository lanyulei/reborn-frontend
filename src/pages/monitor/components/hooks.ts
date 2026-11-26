/**
 * 监控告警页面共享数据 hook 与候选来源：规则分组、数据源选项、通知对象候选（值班表 / 部门）、
 * 规则候选。用户候选见 components/UserSelect/sources.ts 的 fetchMonitorUsers。
 * 前三份是多个页面共用的参考数据，取数走 react-query：同一个缓存键在并发的调用方之间只请求一次，
 * 30 秒内跨页面复用；写操作后由页面让缓存失效（数据源页）或重新拉取（规则页的 reload）。
 */
import { useQuery } from '@umijs/max';
import { useCallback, useMemo } from 'react';
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

/**
 * 参考数据的缓存口径：30 秒内复用（与原先各处手写缓存的时长一致）。
 * 失败不自动重试——请求层已经提示过，重试只会把同一个提示重复弹几次；切回窗口、网络重连时
 * 不自动刷新，与原先手写取数的行为一致。失败的结果不进缓存，下次使用时会重新请求。
 */
const REFERENCE_QUERY_OPTIONS = {
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  staleTime: 30_000,
} as const;

const RULE_GROUPS_QUERY_KEY = ['monitor', 'rule-groups'] as const;
type RuleGroupsData = { groups: RuleGroup[]; isAdmin: boolean };
const NO_GROUPS: RuleGroup[] = [];

/** 当前用户可见的规则分组（平铺）与是否超级管理员；enabled=false 时不请求 */
export const useRuleGroups = (enabled = true) => {
  const { data, isError, isFetching, refetch } = useQuery({
    ...REFERENCE_QUERY_OPTIONS,
    queryKey: RULE_GROUPS_QUERY_KEY,
    enabled,
    queryFn: async (): Promise<RuleGroupsData> => {
      const result = await listRuleGroups({ silent: true });
      return { groups: result.items ?? [], isAdmin: result.isAdmin === true };
    },
  });
  // enabled=false 时不请求（与原实现一致）
  const reload = useCallback(async () => {
    if (enabled) await refetch();
  }, [enabled, refetch]);

  // 失败时按「没有分组、非管理员」处理（与原实现一致）
  return {
    groups: isError ? NO_GROUPS : (data?.groups ?? NO_GROUPS),
    isAdmin: !isError && data?.isAdmin === true,
    loading: isFetching,
    reload,
  };
};

/** 数据源选项的缓存键：数据源增删改后让缓存失效（见 monitor/datasource 页面的 reload） */
export const DATASOURCE_OPTIONS_QUERY_KEY = [
  'monitor',
  'datasource-options',
] as const;
const NO_DATASOURCES: DatasourceOption[] = [];

/**
 * 数据源下拉选项（缺省数据源在前）；enabledOnly 时只含已启用的；enabled=false 时不请求。
 */
export const useDatasourceOptions = (enabledOnly?: boolean, enabled = true) => {
  const t = useT();
  const { data, isPending } = useQuery({
    ...REFERENCE_QUERY_OPTIONS,
    // 筛选口径不同，各自缓存
    queryKey: [...DATASOURCE_OPTIONS_QUERY_KEY, enabledOnly],
    enabled,
    queryFn: async (): Promise<DatasourceOption[]> => {
      const result = await listDatasourceOptions(enabledOnly);
      return result.items ?? [];
    },
  });
  const items = data ?? NO_DATASOURCES;

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
  // enabled=false 时视为未加载（与原实现一致）
  return { items, options, defaultId, loaded: enabled && !isPending };
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

const NOTIFY_TARGETS_QUERY_KEY = ['monitor', 'notify-targets'] as const;
const NO_TARGETS: TargetOptions = {};

/**
 * 通知对象候选（值班表选项、部门列表），取自监控告警域自己的候选接口。enabled=false 时不请求
 * （只读查看：没有新建 / 编辑权限即没有该接口权限，已选项靠详情返回的显示名回显）。
 * failed：加载失败（多为没有权限）——表单据此给出提示，而不是只留一个空的下拉框；retry 重新加载
 * （失败的请求不进缓存）。
 */
export const useNotifyTargets = (enabled = true) => {
  const { data, isError, isFetching, refetch } = useQuery({
    ...REFERENCE_QUERY_OPTIONS,
    queryKey: NOTIFY_TARGETS_QUERY_KEY,
    enabled,
    queryFn: () => listTargetOptions({ kinds: ['schedule', 'dept'] }),
  });
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return useMemo(
    () => ({
      scheduleOptions: ((data ?? NO_TARGETS).schedules ?? []).map(
        (schedule) => ({
          value: schedule.id,
          label: schedule.groupName
            ? `${schedule.groupName} / ${schedule.name ?? ''}`
            : (schedule.name ?? schedule.id),
        }),
      ),
      // 候选接口不区分启停（DeptSelect 把 status 为 0 / 缺失的部门当作已停用）：一律按可选处理
      depts: ((data ?? NO_TARGETS).depts ?? []).map<SystemDept>((dept) => ({
        id: dept.id,
        name: dept.name ?? dept.id,
        parentId: dept.parentId,
        status: 1,
      })),
      // enabled=false 时没有发起过请求，不算失败（与原实现一致）
      failed: enabled && isError,
      loading: isFetching,
      retry,
    }),
    [data, enabled, isError, isFetching, retry],
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
