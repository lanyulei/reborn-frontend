/**
 * 规则表单里第二、三期配置项的候选：工单模板 / 流程 / CMDB 模型、环境、可关联属性 / AI 是否可用
 * （rule-option），以及某个规则分组能引用的升级策略（escalation-option）。这两个接口随规则的
 * 新建 / 编辑权限开放——只读查看时不请求，已选项靠规则详情返回的显示名回显。
 */
import { Alert, Button } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listEscalationOptions } from '@/services/monitor/escalation';
import { listRuleOptions } from '@/services/monitor/rule';
import type {
  EscalationOption,
  MonitorRuleOptions,
  NamedRef,
} from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';

interface LoadState {
  failed: boolean;
  loading: boolean;
  retry: () => void;
}

/** 规则配置候选项；enabled=false 时不请求。loaded：已成功取到（据此才能断言「AI 不可用」） */
export const useRuleOptions = (enabled: boolean) => {
  const [data, setData] = useState<MonitorRuleOptions>({});
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // attempt 只用来触发重试
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    listRuleOptions()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoaded(true);
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
    () => ({ data, loaded, failed, loading, retry }),
    [data, loaded, failed, loading, retry],
  );
};

export type RuleOptionsState = ReturnType<typeof useRuleOptions>;

/**
 * 某个规则分组内的规则可引用的升级策略；分组变了重新取。groupId：结果对应的分组——请求还没
 * 回来（或失败）时与当前分组不一致，调用方据此判断「候选是不是当前分组的」。
 */
export const useEscalationOptions = (
  groupId: string | undefined,
  enabled: boolean,
) => {
  const [result, setResult] = useState<{
    groupId?: string;
    items: EscalationOption[];
  }>({ items: [] });
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // attempt 只用来触发重试
  useEffect(() => {
    if (!enabled || !groupId) return;
    let cancelled = false;
    setLoading(true);
    listEscalationOptions(groupId)
      .then((response) => {
        if (cancelled) return;
        setResult({ groupId, items: response.items ?? [] });
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
  }, [enabled, groupId, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return useMemo(
    () => ({
      groupId: result.groupId,
      // 换了分组、新结果还没回来时不拿上一个分组的候选充数
      items: result.groupId === groupId ? result.items : [],
      failed,
      loading,
      retry,
    }),
    [result, groupId, failed, loading, retry],
  );
};

/** 候选加载失败的提示，带「重试」（同通知对象候选的 TargetsFailedAlert，文案由调用方给） */
export const CandidatesFailedAlert: React.FC<{
  state: LoadState;
  title: string;
}> = ({ state, title }) => {
  const t = useT();
  if (!state.failed) return null;
  return (
    <Alert
      type="warning"
      showIcon
      title={title}
      action={
        <Button size="small" loading={state.loading} onClick={state.retry}>
          {t('pages.monitor.retry')}
        </Button>
      }
      style={{ marginBottom: 16 }}
    />
  );
};

/** 详情返回的单个引用（可能为 null）→ withRefOptions / refsToKnown 接受的列表 */
export const refList = (ref?: NamedRef | null): NamedRef[] =>
  ref?.id ? [ref] : [];

/** 字符串的 UTF-8 字节数（后端按字节限长的字段用） */
export const byteLength = (text: string): number =>
  new TextEncoder().encode(text).length;
