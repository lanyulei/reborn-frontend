/**
 * 监控告警域响应归一化：把 spec 里「缺失或为 null」的字段一律补成零值（false / 0 / 空串 / 空列表 /
 * 空 map），使编辑表单的加载路径不依赖后端 JSON 编码的取舍。
 *
 * 当前后端的 protojson 开启了 EmitUnpopulated：零值照常输出，未设置的消息 / 时间 / optional 字段
 * 输出为 null；若改为省略零值，字段会直接缺失。两种形态在这里得到同一个结果。
 *
 * 约定：编辑表单加载时先经这里把 spec 补全，再映射成表单值——表单里不得再对缺失字段写
 * `?? true` / `|| 缺省值`（「缺失」的含义恒为零值，而不是「未设置，取新建缺省」）；新建缺省值
 * 只放在各表单的新建路径上。归一化后的类型把这些字段标为必有，漏补会在类型检查时暴露。
 *
 * 例外：零值不是合法取值的字段（认证方式、超时、数据源范围、评估周期、查询级别、屏蔽方式、
 * 时间类型、匹配操作符——后端校验保证恒为非零，两种编码下都会输出）没有可补的缺省。万一缺失，
 * 这里不臆造取值：归一化后的类型把它们标为可选，表单里对应的必填项为空，由必填校验要求补填。
 */
import type {
  AlertSubscriptionSpec,
  DatasourceConnection,
  DatasourceSpec,
  EffectiveTime,
  EscalationSpec,
  InhibitSelector,
  InhibitSpec,
  LabelMatcher,
  MonitorDatasourceScope,
  MonitorEscalationMode,
  MonitorEscalationTrigger,
  MonitorMuteMode,
  MonitorMuteTimeType,
  MonitorSeverity,
  MuteSpec,
  QueryResult,
  RecordRuleSpec,
  RuleCIMatch,
  RuleNotify,
  RuleRelabelAction,
  RuleResourceScope,
  RuleSpec,
  RuleTicketAction,
  RuleWorkflowAction,
  SubscriptionReceivers,
} from './typings';

export type NormalizedEffectiveTime = Required<EffectiveTime>;

/**
 * timezone 缺失或为空串 = UTC（不是浏览器时区）；windows 缺失或为空 = 全时段；mode 缺失 = 按时间窗
 * （原样保留已保存的取值，'' 与 'windows' 同义）
 */
export const normalizeEffectiveTime = (
  value?: EffectiveTime | null,
): NormalizedEffectiveTime => ({
  mode: value?.mode ?? '',
  timezone: value?.timezone ?? '',
  windows: (value?.windows ?? []).map((window) => ({
    days: window.days ?? [],
    start: window.start ?? '',
    end: window.end ?? '',
  })),
});

/** 按操作符只保留 value 或 values；操作符缺失（不应出现）按等值匹配显示，值为空时校验会拦住 */
const fillMatchers = (matchers?: LabelMatcher[]): LabelMatcher[] =>
  (matchers ?? []).map((matcher) =>
    matcher.op === 'in' || matcher.op === 'not in'
      ? {
          label: matcher.label ?? '',
          op: matcher.op,
          values: matcher.values ?? [],
        }
      : {
          label: matcher.label ?? '',
          op: matcher.op ?? '==',
          value: matcher.value ?? '',
        },
  );

// ---------- 数据源 ----------

export type NormalizedDatasourceConnection = Required<
  Omit<DatasourceConnection, 'secret' | 'authType' | 'timeoutMs'>
> &
  Partial<Pick<DatasourceConnection, 'authType' | 'timeoutMs'>>;

export interface NormalizedDatasourceSpec
  extends Required<Omit<DatasourceSpec, 'connection'>> {
  connection: NormalizedDatasourceConnection;
}

/** isDefault / enabled / tlsSkipVerify 缺失 = false；凭据恒不返回 */
export const normalizeDatasourceSpec = (
  spec: DatasourceSpec,
): NormalizedDatasourceSpec => ({
  name: spec.name ?? '',
  connection: {
    url: spec.connection?.url ?? '',
    authType: spec.connection?.authType || undefined,
    username: spec.connection?.username ?? '',
    headers: spec.connection?.headers ?? {},
    timeoutMs: spec.connection?.timeoutMs || undefined,
    tlsSkipVerify: spec.connection?.tlsSkipVerify ?? false,
  },
  remoteWriteUrl: spec.remoteWriteUrl ?? '',
  description: spec.description ?? '',
  isDefault: spec.isDefault ?? false,
  enabled: spec.enabled ?? false,
});

// ---------- 告警规则 ----------

/** 一步标签改写：动作缺失（不应出现）时留空，由表单的必填校验要求补填 */
export interface NormalizedRelabelStep {
  action?: RuleRelabelAction;
  sourceLabels: string[];
  separator: string;
  regex: string;
  targetLabel: string;
  replacement: string;
}

export interface NormalizedRuleActions {
  ticket: Required<RuleTicketAction>;
  workflow: Required<RuleWorkflowAction>;
  aiSummary: boolean;
}

export interface NormalizedRuleSpec
  extends Required<
    Omit<
      RuleSpec,
      | 'effective'
      | 'notify'
      | 'datasourceScope'
      | 'evalIntervalS'
      | 'queries'
      | 'ciMatch'
      | 'resourceScope'
      | 'relabel'
      | 'actions'
    >
  > {
  datasourceScope?: MonitorDatasourceScope;
  evalIntervalS?: number;
  queries: { expr: string; severity?: MonitorSeverity }[];
  effective: NormalizedEffectiveTime;
  notify: Required<RuleNotify>;
  ciMatch: Required<RuleCIMatch>;
  resourceScope: Required<RuleResourceScope>;
  relabel: NormalizedRelabelStep[];
  actions: NormalizedRuleActions;
}

/**
 * enabled / levelInhibit / notifyRecovery 缺失 = false；forS / recoverS / nodataKeepS /
 * repeatIntervalM / maxNotify 缺失 = 0；effective.timezone 缺失 = UTC。
 * 第二、三期的字段（ciMatch / resourceScope / relabel / dropExpr / topologyInhibit / escalationId /
 * actions / notify.ciOwner / effective.mode）缺失或为 null = 未配置：全部补成零值（ciMatch 全空 =
 * 全局缺省关联方式，escalationId 空串 = 不升级，actions 各项关闭）。
 */
export const normalizeRuleSpec = (spec: RuleSpec): NormalizedRuleSpec => ({
  groupId: spec.groupId ?? '',
  name: spec.name ?? '',
  description: spec.description ?? '',
  enabled: spec.enabled ?? false,
  labels: spec.labels ?? {},
  datasourceScope: spec.datasourceScope || undefined,
  datasourceIds: spec.datasourceIds ?? [],
  queries: (spec.queries ?? []).map((query) => ({
    expr: query.expr ?? '',
    severity: query.severity || undefined,
  })),
  levelInhibit: spec.levelInhibit ?? false,
  evalIntervalS: spec.evalIntervalS || undefined,
  forS: spec.forS ?? 0,
  recoverS: spec.recoverS ?? 0,
  nodataKeepS: spec.nodataKeepS ?? 0,
  effective: normalizeEffectiveTime(spec.effective),
  annotations: spec.annotations ?? {},
  recoveryExpr: spec.recoveryExpr ?? '',
  notify: {
    userIds: spec.notify?.userIds ?? [],
    scheduleIds: spec.notify?.scheduleIds ?? [],
    deptIds: spec.notify?.deptIds ?? [],
    ciOwner: spec.notify?.ciOwner ?? false,
  },
  notifyRecovery: spec.notifyRecovery ?? false,
  repeatIntervalM: spec.repeatIntervalM ?? 0,
  maxNotify: spec.maxNotify ?? 0,
  groupKeyLabels: spec.groupKeyLabels ?? [],
  ciMatch: {
    disabled: spec.ciMatch?.disabled ?? false,
    label: spec.ciMatch?.label ?? '',
    by: spec.ciMatch?.by ?? '',
    attr: spec.ciMatch?.attr ?? '',
    modelCodes: spec.ciMatch?.modelCodes ?? [],
    enrichTags: spec.ciMatch?.enrichTags ?? [],
  },
  resourceScope: {
    enabled: spec.resourceScope?.enabled ?? false,
    modelCodes: spec.resourceScope?.modelCodes ?? [],
    envs: spec.resourceScope?.envs ?? [],
    tags: spec.resourceScope?.tags ?? [],
  },
  relabel: (spec.relabel ?? []).map((step) => ({
    action: step.action || undefined,
    sourceLabels: step.sourceLabels ?? [],
    separator: step.separator ?? '',
    regex: step.regex ?? '',
    targetLabel: step.targetLabel ?? '',
    replacement: step.replacement ?? '',
  })),
  dropExpr: spec.dropExpr ?? '',
  topologyInhibit: spec.topologyInhibit ?? false,
  escalationId: spec.escalationId ?? '',
  actions: {
    ticket: {
      enabled: spec.actions?.ticket?.enabled ?? false,
      templateId: spec.actions?.ticket?.templateId ?? '',
      agentUserId: spec.actions?.ticket?.agentUserId ?? '',
    },
    workflow: {
      enabled: spec.actions?.workflow?.enabled ?? false,
      definitionKey: spec.actions?.workflow?.definitionKey ?? '',
      agentUserId: spec.actions?.workflow?.agentUserId ?? '',
    },
    aiSummary: spec.actions?.aiSummary ?? false,
  },
});

// ---------- 屏蔽规则 ----------

export interface NormalizedMuteSpec
  extends Required<
    Omit<
      MuteSpec,
      'groupId' | 'startTime' | 'endTime' | 'periodic' | 'mode' | 'timeType'
    >
  > {
  mode?: MonitorMuteMode;
  timeType?: MonitorMuteTimeType;
  /** 缺失 = 作用于全部分组（真正的可选项，不补值） */
  groupId?: string;
  startTime?: string;
  endTime?: string;
  /** 仅周期屏蔽有 */
  periodic?: NormalizedEffectiveTime;
}

/** enabled 缺失 = false（已停用）；条件列表缺失 = 不限 */
export const normalizeMuteSpec = (spec: MuteSpec): NormalizedMuteSpec => ({
  groupId: spec.groupId || undefined,
  name: spec.name ?? '',
  reason: spec.reason ?? '',
  ruleIds: spec.ruleIds ?? [],
  datasourceIds: spec.datasourceIds ?? [],
  severities: spec.severities ?? [],
  matchers: fillMatchers(spec.matchers),
  mode: spec.mode || undefined,
  timeType: spec.timeType || undefined,
  startTime: spec.startTime || undefined,
  endTime: spec.endTime || undefined,
  periodic: spec.periodic ? normalizeEffectiveTime(spec.periodic) : undefined,
  enabled: spec.enabled ?? false,
});

// ---------- 告警订阅 ----------

export interface NormalizedSubscriptionSpec
  extends Required<Omit<AlertSubscriptionSpec, 'receivers'>> {
  receivers: Required<SubscriptionReceivers>;
}

/** onFiring / onResolved / followRepeat / enabled / receivers.self 缺失 = false */
export const normalizeSubscriptionSpec = (
  spec: AlertSubscriptionSpec,
): NormalizedSubscriptionSpec => ({
  name: spec.name ?? '',
  groupIds: spec.groupIds ?? [],
  ruleIds: spec.ruleIds ?? [],
  datasourceIds: spec.datasourceIds ?? [],
  severities: spec.severities ?? [],
  onFiring: spec.onFiring ?? false,
  onResolved: spec.onResolved ?? false,
  matchers: fillMatchers(spec.matchers),
  receivers: {
    self: spec.receivers?.self ?? false,
    userIds: spec.receivers?.userIds ?? [],
    scheduleIds: spec.receivers?.scheduleIds ?? [],
    groups: spec.receivers?.groups ?? [],
  },
  followRepeat: spec.followRepeat ?? false,
  enabled: spec.enabled ?? false,
});

// ---------- 升级策略 ----------

export interface NormalizedEscalationLevel {
  /** 零值不合法：万一缺失就留空，由必填校验要求补填 */
  trigger?: MonitorEscalationTrigger;
  afterM?: number;
  targets: {
    userIds: string[];
    schedules: { id: string; backupOnly: boolean }[];
    oncallGroupIds: string[];
    depts: { id: string; up: number }[];
  };
  repeatIntervalM: number;
  maxNotify: number;
}

export interface NormalizedEscalationSpec {
  /** 空 = 全局策略（真正的可选项，不补值） */
  groupId?: string;
  name: string;
  description: string;
  mode?: MonitorEscalationMode;
  minSeverity?: MonitorSeverity;
  levels: NormalizedEscalationLevel[];
  enabled: boolean;
}

/**
 * enabled / backupOnly 缺失 = false；repeatIntervalM（只在升级时通知一次）/ maxNotify（不限）/
 * depts[].up（本部门负责人）缺失 = 0；groupId 缺失或空串 = 全局策略。
 */
export const normalizeEscalationSpec = (
  spec: EscalationSpec,
): NormalizedEscalationSpec => ({
  groupId: spec.groupId || undefined,
  name: spec.name ?? '',
  description: spec.description ?? '',
  mode: spec.mode || undefined,
  minSeverity: spec.minSeverity || undefined,
  levels: (spec.levels ?? []).map((level) => ({
    trigger: level.trigger || undefined,
    afterM: level.afterM || undefined,
    targets: {
      userIds: level.targets?.userIds ?? [],
      schedules: (level.targets?.schedules ?? []).map((schedule) => ({
        id: schedule.id,
        backupOnly: schedule.backupOnly ?? false,
      })),
      oncallGroupIds: level.targets?.oncallGroupIds ?? [],
      depts: (level.targets?.depts ?? []).map((dept) => ({
        id: dept.id,
        up: dept.up ?? 0,
      })),
    },
    repeatIntervalM: level.repeatIntervalM ?? 0,
    maxNotify: level.maxNotify ?? 0,
  })),
  enabled: spec.enabled ?? false,
});

// ---------- 抑制规则 ----------

export type NormalizedInhibitSelector = Required<InhibitSelector>;

export interface NormalizedInhibitSpec {
  /** 空 = 作用于全部分组（真正的可选项，不补值） */
  groupId?: string;
  name: string;
  description: string;
  source: NormalizedInhibitSelector;
  target: NormalizedInhibitSelector;
  equalLabels: string[];
  enabled: boolean;
}

const fillSelector = (
  selector?: InhibitSelector | null,
): NormalizedInhibitSelector => ({
  ruleIds: selector?.ruleIds ?? [],
  severities: selector?.severities ?? [],
  matchers: fillMatchers(selector?.matchers),
});

/** source / target 缺失或为 null = 该侧不限；enabled 缺失 = false；groupId 缺失或空串 = 全部分组 */
export const normalizeInhibitSpec = (
  spec: InhibitSpec,
): NormalizedInhibitSpec => ({
  groupId: spec.groupId || undefined,
  name: spec.name ?? '',
  description: spec.description ?? '',
  source: fillSelector(spec.source),
  target: fillSelector(spec.target),
  equalLabels: spec.equalLabels ?? [],
  enabled: spec.enabled ?? false,
});

// ---------- 记录规则 ----------

export interface NormalizedRecordRuleSpec
  extends Required<Omit<RecordRuleSpec, 'intervalS'>> {
  /** 零值不合法：万一缺失就留空，由必填校验要求补填 */
  intervalS?: number;
}

/** enabled 缺失 = false；labels 缺失 = 无附加标签 */
export const normalizeRecordRuleSpec = (
  spec: RecordRuleSpec,
): NormalizedRecordRuleSpec => ({
  groupId: spec.groupId ?? '',
  name: spec.name ?? '',
  description: spec.description ?? '',
  datasourceId: spec.datasourceId ?? '',
  expr: spec.expr ?? '',
  intervalS: spec.intervalS || undefined,
  labels: spec.labels ?? {},
  enabled: spec.enabled ?? false,
});

// ---------- 查询结果 ----------

/**
 * 采样值 / 时间戳缺失（零值被省略的编码下）时就地补回 0，否则值恰为 0 的点（如 `up == 0`）会被
 * 当成没有值。就地修改是为了不给大结果（上万个点）再分配一遍对象。
 */
export const normalizeQueryResult = (result: QueryResult): QueryResult => {
  for (const series of result.series ?? []) {
    for (const point of series.points ?? []) {
      if (point.value == null) point.value = 0;
      if (point.timestampMs == null) point.timestampMs = '0';
    }
  }
  return result;
};
