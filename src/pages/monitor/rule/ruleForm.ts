/**
 * 告警规则表单的值模型：表单值 ↔ RuleSpec 的转换与新建缺省值。
 * 加载路径只走 specToValues（入参是归一化后的 spec，缺失字段已补成零值）；
 * 新建缺省值只在 createValues 里。
 */
import type {
  NormalizedRelabelStep,
  NormalizedRuleSpec,
} from '@/services/monitor/normalize';
import type {
  EffectiveTime,
  MonitorDatasourceScope,
  RuleCIMatch,
  RuleQuery,
  RuleRelabelAction,
  RuleRelabelStep,
  RuleSpec,
  RuleTicketAction,
  RuleWorkflowAction,
} from '@/services/monitor/typings';
import {
  type KeyValue,
  kvToRecord,
  recordToKv,
} from '../components/KeyValueEditor';
import { localTimezone } from '../components/TimeWindowsEditor';

/** 生效方式的界面选项：按时间窗（落库为 '' 或 'windows'，二者同义）/ 仅工作时间 / 仅非工作时间 */
export type EffectiveChoice = 'windows' | 'work_time' | 'off_time';
/** 关联资源的方式：全局缺省（ciMatch 全部留空）/ 自定义 / 不关联 */
export type CiMatchMode = 'default' | 'custom' | 'off';

/** 一步标签改写的表单行：各项都可能缺失（表单提交时空串会被去掉） */
export interface RelabelRow {
  action?: RuleRelabelAction;
  sourceLabels?: string[];
  separator?: string;
  regex?: string;
  targetLabel?: string;
  replacement?: string;
}

export interface RuleFormValues {
  name: string;
  groupId: string;
  description?: string;
  enabled?: boolean;
  labels?: KeyValue[];
  datasourceScope: MonitorDatasourceScope;
  datasourceIds?: string[];
  queries: RuleQuery[];
  /** 只有一条查询时该项不显示，表单值里没有它 */
  levelInhibit?: boolean;
  evalIntervalS: number;
  forS: number;
  recoverS: number;
  nodataKeepS: number;
  effectiveMode?: EffectiveChoice;
  /** 时区与时间窗；选了按工作日历时时间窗仍留在表单里（切回来不丢），但不提交 */
  effective?: EffectiveTime;
  annotations?: KeyValue[];
  recoveryExpr?: string;
  userIds?: string[];
  scheduleIds?: string[];
  deptIds?: string[];
  notifyRecovery?: boolean;
  repeatIntervalM: number;
  maxNotify: number;
  groupKeyLabels?: string[];
  escalationId?: string;
  // ---- 关联资源（CMDB）
  ciMode?: CiMatchMode;
  ciLabel?: string;
  ciBy?: 'name' | 'attr';
  /** 留空 = ip */
  ciAttr?: string;
  ciModelCodes?: string[];
  ciEnrichTags?: string[];
  scopeEnabled?: boolean;
  scopeModelCodes?: string[];
  scopeEnvs?: string[];
  scopeTags?: string[];
  topologyInhibit?: boolean;
  ciOwner?: boolean;
  // ---- 事件处理
  relabel?: RelabelRow[];
  dropExpr?: string;
  // ---- 事件动作
  ticketEnabled?: boolean;
  ticketTemplateId?: string;
  ticketAgentUserId?: string;
  workflowEnabled?: boolean;
  workflowDefinitionKey?: string;
  workflowAgentUserId?: string;
  aiSummary?: boolean;
  /** 变更说明（仅编辑；记入变更历史） */
  summary?: string;
}

/** 表单里默认收起的三节 */
export type FoldKey = 'ci' | 'process' | 'actions';

/** 表单项 → 所在的可收起分节（校验不通过时据此展开；不在其中的项恒可见） */
export const foldOfField = (name: string): FoldKey | undefined => {
  if (/^(ci|scope)[A-Z]/.test(name) || name === 'topologyInhibit') return 'ci';
  if (name === 'relabel' || name === 'dropExpr') return 'process';
  if (/^(ticket|workflow)[A-Z]/.test(name) || name === 'aiSummary') {
    return 'actions';
  }
  return undefined;
};

/** 各节是否配置了非缺省内容：打开已保存的规则时据此自动展开 */
export const configuredFolds = (
  spec: NormalizedRuleSpec,
): Record<FoldKey, boolean> => ({
  ci:
    spec.ciMatch.disabled ||
    spec.ciMatch.label !== '' ||
    spec.ciMatch.modelCodes.length > 0 ||
    spec.ciMatch.enrichTags.length > 0 ||
    spec.resourceScope.enabled ||
    spec.topologyInhibit ||
    spec.notify.ciOwner,
  process: spec.relabel.length > 0 || spec.dropExpr !== '',
  actions:
    spec.actions.ticket.enabled ||
    spec.actions.workflow.enabled ||
    spec.actions.aiSummary,
});

/** 表单当前值是否配置了非缺省内容（收起时在标题旁标出「已配置」） */
export const foldConfigured: Record<
  FoldKey,
  (values: Partial<RuleFormValues>) => boolean
> = {
  ci: (values) =>
    (values.ciMode !== undefined && values.ciMode !== 'default') ||
    (values.ciModelCodes ?? []).length > 0 ||
    (values.ciEnrichTags ?? []).length > 0 ||
    values.scopeEnabled === true ||
    values.topologyInhibit === true ||
    values.ciOwner === true,
  process: (values) => (values.relabel ?? []).length > 0 || !!values.dropExpr,
  actions: (values) =>
    values.ticketEnabled === true ||
    values.workflowEnabled === true ||
    values.aiSummary === true,
};

const isCalendar = (mode?: string): mode is 'work_time' | 'off_time' =>
  mode === 'work_time' || mode === 'off_time';

/** 一步改写只保留该动作用得到的字段，其余清空（后端按动作校验「禁填」） */
const buildRelabelStep = (row: RelabelRow): RuleRelabelStep => {
  const action = row.action as RuleRelabelAction;
  const replace = action === 'replace';
  return {
    action,
    sourceLabels: replace ? (row.sourceLabels ?? []) : [],
    separator: replace ? (row.separator ?? '') : '',
    regex: row.regex ?? '',
    targetLabel: replace ? (row.targetLabel?.trim() ?? '') : '',
    replacement:
      replace || action === 'labelmap' ? (row.replacement ?? '') : '',
  };
};

const EMPTY_TICKET: Required<RuleTicketAction> = {
  enabled: false,
  templateId: '',
  agentUserId: '',
};
const EMPTY_WORKFLOW: Required<RuleWorkflowAction> = {
  enabled: false,
  definitionKey: '',
  agentUserId: '',
};

/**
 * 表单值 → RuleSpec。loaded：编辑时加载到的规则内容（已归一化），新建时没有。表单里没有显示
 * 出来的取值以它为准，保证「不改直接保存」原样写回：
 * - 「级别抑制」未显示（只有一条查询）：新建为 false，编辑为已保存的值——切换它会改变事件指纹，
 *   使活跃告警先恢复再触发，不能因为没显示就悄悄改掉；
 * - 生效方式选「按时间窗」：'' 与 'windows' 同义，沿用已保存的那个写法；
 * - 「不关联资源」时的关联方式、未启用的事件动作的模板与代理用户：这些项不显示，已保存时就是
 *   关着的则沿用已保存的内容，否则清空。
 */
export const buildSpec = (
  values: RuleFormValues,
  loaded?: NormalizedRuleSpec,
): RuleSpec => {
  const calendar = isCalendar(values.effectiveMode);
  const custom = values.ciMode === 'custom';
  const off = values.ciMode === 'off';
  // 不关联时「用哪个标签对应什么」不显示：已保存时就是不关联的，沿用已保存的这三项
  const savedOff = off && loaded?.ciMatch.disabled ? loaded.ciMatch : null;
  const ciBy = custom ? (values.ciBy ?? '') : '';
  const ciMatch: Required<RuleCIMatch> = {
    disabled: off,
    label: savedOff?.label ?? (custom ? (values.ciLabel?.trim() ?? '') : ''),
    by: savedOff?.by ?? ciBy,
    attr: savedOff?.attr ?? (ciBy === 'attr' ? (values.ciAttr ?? '') : ''),
    modelCodes: values.ciModelCodes ?? [],
    enrichTags: values.ciEnrichTags ?? [],
  };
  return {
    groupId: values.groupId,
    name: values.name.trim(),
    description: values.description?.trim() ?? '',
    enabled: values.enabled ?? false,
    labels: kvToRecord(values.labels),
    datasourceScope: values.datasourceScope,
    datasourceIds:
      values.datasourceScope === 1 ? (values.datasourceIds ?? []) : [],
    queries: values.queries.map((q) => ({
      expr: q.expr.trim(),
      severity: q.severity,
    })),
    levelInhibit:
      values.queries.length > 1
        ? (values.levelInhibit ?? false)
        : (loaded?.levelInhibit ?? false),
    evalIntervalS: values.evalIntervalS,
    forS: values.forS ?? 0,
    recoverS: values.recoverS ?? 0,
    nodataKeepS: values.nodataKeepS ?? 0,
    effective: {
      timezone: values.effective?.timezone ?? '',
      // 按工作日历时时间窗必须为空（否则 400）
      windows: calendar ? [] : (values.effective?.windows ?? []),
      mode: isCalendar(values.effectiveMode)
        ? values.effectiveMode
        : loaded?.effective.mode === 'windows'
          ? 'windows'
          : '',
    },
    annotations: kvToRecord(values.annotations),
    recoveryExpr: values.recoveryExpr?.trim() ?? '',
    notify: {
      userIds: values.userIds ?? [],
      scheduleIds: values.scheduleIds ?? [],
      deptIds: values.deptIds ?? [],
      ciOwner: values.ciOwner ?? false,
    },
    notifyRecovery: values.notifyRecovery ?? false,
    repeatIntervalM: values.repeatIntervalM ?? 0,
    maxNotify: values.maxNotify ?? 0,
    groupKeyLabels: values.groupKeyLabels ?? [],
    ciMatch,
    // 未启用时各项条件必须为空
    resourceScope: values.scopeEnabled
      ? {
          enabled: true,
          modelCodes: values.scopeModelCodes ?? [],
          envs: values.scopeEnvs ?? [],
          tags: values.scopeTags ?? [],
        }
      : { enabled: false, modelCodes: [], envs: [], tags: [] },
    relabel: (values.relabel ?? []).map(buildRelabelStep),
    // 模板原样保存（不去首尾空白：渲染结果才去）
    dropExpr: values.dropExpr ?? '',
    topologyInhibit: values.topologyInhibit ?? false,
    escalationId: values.escalationId ?? '',
    actions: {
      ticket: values.ticketEnabled
        ? {
            enabled: true,
            templateId: values.ticketTemplateId ?? '',
            agentUserId: values.ticketAgentUserId ?? '',
          }
        : loaded && !loaded.actions.ticket.enabled
          ? loaded.actions.ticket
          : EMPTY_TICKET,
      workflow: values.workflowEnabled
        ? {
            enabled: true,
            definitionKey: values.workflowDefinitionKey ?? '',
            agentUserId: values.workflowAgentUserId ?? '',
          }
        : loaded && !loaded.actions.workflow.enabled
          ? loaded.actions.workflow
          : EMPTY_WORKFLOW,
      aiSummary: values.aiSummary ?? false,
    },
  };
};

/**
 * 加载出来的表单值：零值不合法的几项（数据源范围、评估周期、查询级别、改写动作）万一缺失就留空，
 * 由表单的必填校验要求补填（见 normalize.ts 的说明）。
 */
export type LoadedRuleFormValues = Omit<
  RuleFormValues,
  'datasourceScope' | 'evalIntervalS' | 'queries' | 'relabel'
> &
  Pick<NormalizedRuleSpec, 'datasourceScope' | 'evalIntervalS' | 'queries'> & {
    relabel: NormalizedRelabelStep[];
  };

/** 已保存的规则内容 → 表单值（不补任何缺省：空时区就是 UTC，缺失的开关就是关） */
export const specToValues = (
  spec: NormalizedRuleSpec,
): LoadedRuleFormValues => ({
  name: spec.name,
  groupId: spec.groupId,
  description: spec.description,
  enabled: spec.enabled,
  labels: recordToKv(spec.labels),
  datasourceScope: spec.datasourceScope,
  datasourceIds: spec.datasourceIds,
  queries: spec.queries,
  levelInhibit: spec.levelInhibit,
  evalIntervalS: spec.evalIntervalS,
  forS: spec.forS,
  recoverS: spec.recoverS,
  nodataKeepS: spec.nodataKeepS,
  effectiveMode: isCalendar(spec.effective.mode)
    ? spec.effective.mode
    : 'windows',
  effective: {
    timezone: spec.effective.timezone,
    windows: spec.effective.windows,
  },
  annotations: recordToKv(spec.annotations),
  recoveryExpr: spec.recoveryExpr,
  userIds: spec.notify.userIds,
  scheduleIds: spec.notify.scheduleIds,
  deptIds: spec.notify.deptIds,
  notifyRecovery: spec.notifyRecovery,
  repeatIntervalM: spec.repeatIntervalM,
  maxNotify: spec.maxNotify,
  groupKeyLabels: spec.groupKeyLabels,
  escalationId: spec.escalationId || undefined,
  ciMode: spec.ciMatch.disabled
    ? 'off'
    : spec.ciMatch.label
      ? 'custom'
      : 'default',
  ciLabel: spec.ciMatch.label,
  ciBy: spec.ciMatch.by || undefined,
  ciAttr: spec.ciMatch.attr || undefined,
  ciModelCodes: spec.ciMatch.modelCodes,
  ciEnrichTags: spec.ciMatch.enrichTags,
  scopeEnabled: spec.resourceScope.enabled,
  scopeModelCodes: spec.resourceScope.modelCodes,
  scopeEnvs: spec.resourceScope.envs,
  scopeTags: spec.resourceScope.tags,
  topologyInhibit: spec.topologyInhibit,
  ciOwner: spec.notify.ciOwner,
  relabel: spec.relabel,
  dropExpr: spec.dropExpr,
  ticketEnabled: spec.actions.ticket.enabled,
  ticketTemplateId: spec.actions.ticket.templateId || undefined,
  ticketAgentUserId: spec.actions.ticket.agentUserId || undefined,
  workflowEnabled: spec.actions.workflow.enabled,
  workflowDefinitionKey: spec.actions.workflow.definitionKey || undefined,
  workflowAgentUserId: spec.actions.workflow.agentUserId || undefined,
  aiSummary: spec.actions.aiSummary,
});

/**
 * 新建缺省值（只用于新建路径）：生效时间的时区取浏览器时区；第二、三期的配置项全部取零值
 * （按时间窗、全局缺省关联、不改写、不升级、不做事件动作）。
 */
export const createValues = (defaultGroupId?: string): RuleFormValues => ({
  name: '',
  groupId: defaultGroupId ?? '',
  enabled: true,
  labels: [],
  datasourceScope: 1,
  datasourceIds: [],
  queries: [{ expr: '', severity: 2 }],
  levelInhibit: true,
  evalIntervalS: 60,
  forS: 60,
  recoverS: 0,
  nodataKeepS: 0,
  effectiveMode: 'windows',
  effective: { timezone: localTimezone(), windows: [] },
  annotations: [{ key: 'summary', value: '' }],
  notifyRecovery: true,
  repeatIntervalM: 0,
  maxNotify: 0,
  groupKeyLabels: [],
  ciMode: 'default',
  ciModelCodes: [],
  ciEnrichTags: [],
  scopeEnabled: false,
  scopeModelCodes: [],
  scopeEnvs: [],
  scopeTags: [],
  topologyInhibit: false,
  ciOwner: false,
  relabel: [],
  ticketEnabled: false,
  workflowEnabled: false,
  aiSummary: false,
});
