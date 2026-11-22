/**
 * 故障页面共享的数据 hook：选项（值班表 / 业务 / 根因 / 工单模板 / 预案）、用户候选、资源检索。
 */
import { useEffect, useState } from 'react';
import { userLabel } from '@/components/UserSelect';
import { listCIs } from '@/services/cmdb/ci';
import { listIncidentOptions } from '@/services/incident/incident';
import type { IncidentOptions, NamedRef } from '@/services/incident/typings';
import { listWorkflowUserCandidates } from '@/services/workflow/runtime';

/** 选项加载（一次）；失败为空对象，不弹提示 */
export const useIncidentOptions = (kinds?: string[], enabled = true) => {
  const [options, setOptions] = useState<IncidentOptions>({});
  const [loading, setLoading] = useState(enabled);
  const key = kinds?.join(',') ?? '';
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    listIncidentOptions(key ? key.split(',') : undefined)
      .then((result) => {
        if (!cancelled) setOptions(result ?? {});
      })
      .catch(() => {
        if (!cancelled) setOptions({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);
  return { options, loading };
};

/** 用户候选（流程域的用户目录：工单 / 流程选人同一来源） */
export const fetchIncidentUsers = async (keyword: string) => {
  const { items } = await listWorkflowUserCandidates(keyword);
  return (items ?? []).map((u) => ({ id: u.id, label: userLabel(u) }));
};

/** CMDB 资源候选（名称 / 外部标识模糊搜索，受数据范围约束） */
export const fetchCIs = async (
  keyword: string,
): Promise<{ id: string; label: string }[]> => {
  const result = await listCIs({
    page: 1,
    pageSize: 20,
    keyword: keyword || undefined,
  });
  return (result.items ?? []).map((item) => ({
    id: item.id,
    label: `${item.name}（${item.modelName ?? item.modelCode}）`,
  }));
};

/** NamedRef 列表 → 选择器的已知显示名 */
export const refsToKnown = (refs?: readonly NamedRef[]) =>
  (refs ?? []).map((ref) => ({ id: ref.id, label: ref.name || ref.id }));

/** NamedRef 列表 → Select options */
export const refOptions = (refs?: readonly NamedRef[]) =>
  (refs ?? []).map((ref) => ({ value: ref.id, label: ref.name || ref.id }));
