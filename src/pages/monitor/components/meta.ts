/**
 * 监控告警域枚举元数据与表单上限：只保存结构与 i18n 键（文案在 locales/<lang>/monitor.ts）。
 * 级别文案与颜色沿用通知域的 NOTIFY_SEVERITY_META（全平台同一口径：提示 / 警告 / 严重 / 致命）。
 */
import type {
  EvalPointStep,
  ImportConflictPolicy,
  ImportItemStatus,
  ImportResultAction,
  MonitorAlertStatus,
  MonitorAuthType,
  MonitorDatasourceScope,
  MonitorEscalationMode,
  MonitorEscalationTrigger,
  MonitorEvalStatus,
  MonitorHandleState,
  MonitorHealthStatus,
  MonitorMatcherOp,
  MonitorMuteMode,
  MonitorMuteState,
  MonitorMuteTimeType,
  MonitorNotifyKind,
  MonitorScopeLevel,
  MonitorSeverity,
  RuleBatchAction,
  RuleVersionAction,
} from '@/services/monitor/typings';
import type { EnumMeta } from '@/utils/i18n';

export const SEVERITY_ORDER: readonly MonitorSeverity[] = [1, 2, 3, 4];
export const EVAL_STATUS_META: EnumMeta<MonitorEvalStatus> = {
  0: { textId: 'enum.monitor.evalStatus.0', status: 'Default' },
  1: { textId: 'enum.monitor.evalStatus.1', status: 'Success' },
  2: { textId: 'enum.monitor.evalStatus.2', status: 'Error' },
  3: { textId: 'enum.monitor.evalStatus.3', status: 'Default' },
  4: { textId: 'enum.monitor.evalStatus.4', status: 'Warning' },
  5: { textId: 'enum.monitor.evalStatus.5', status: 'Default' },
};

export const ALERT_STATUS_META: EnumMeta<MonitorAlertStatus> = {
  1: { textId: 'enum.monitor.alertStatus.1', status: 'Error' },
  2: { textId: 'enum.monitor.alertStatus.2', status: 'Success' },
  3: { textId: 'enum.monitor.alertStatus.3', status: 'Default' },
};

export const HEALTH_STATUS_META: EnumMeta<MonitorHealthStatus> = {
  0: { textId: 'enum.monitor.health.0', status: 'Default' },
  1: { textId: 'enum.monitor.health.1', status: 'Success' },
  2: { textId: 'enum.monitor.health.2', status: 'Error' },
};

export const AUTH_TYPE_META: EnumMeta<MonitorAuthType> = {
  1: { textId: 'enum.monitor.authType.1' },
  2: { textId: 'enum.monitor.authType.2' },
  3: { textId: 'enum.monitor.authType.3' },
};
export const AUTH_TYPE_ORDER: readonly MonitorAuthType[] = [1, 2, 3];

export const DATASOURCE_SCOPE_META: EnumMeta<MonitorDatasourceScope> = {
  1: { textId: 'enum.monitor.datasourceScope.1' },
  2: { textId: 'enum.monitor.datasourceScope.2' },
};
export const DATASOURCE_SCOPE_ORDER: readonly MonitorDatasourceScope[] = [1, 2];

export const SCOPE_LEVEL_META: EnumMeta<MonitorScopeLevel> = {
  0: { textId: 'enum.monitor.scopeLevel.0' },
  1: { textId: 'enum.monitor.scopeLevel.1' },
  2: { textId: 'enum.monitor.scopeLevel.2' },
};
/** 可授权的级别（0 不可授权） */
export const GRANT_LEVEL_ORDER: readonly (1 | 2)[] = [1, 2];

export const MUTE_MODE_META: EnumMeta<MonitorMuteMode> = {
  1: { textId: 'enum.monitor.muteMode.1' },
  2: { textId: 'enum.monitor.muteMode.2' },
};
export const MUTE_MODE_ORDER: readonly MonitorMuteMode[] = [1, 2];

export const MUTE_TIME_TYPE_META: EnumMeta<MonitorMuteTimeType> = {
  1: { textId: 'enum.monitor.muteTimeType.1' },
  2: { textId: 'enum.monitor.muteTimeType.2' },
};
export const MUTE_TIME_TYPE_ORDER: readonly MonitorMuteTimeType[] = [1, 2];

export const MUTE_STATE_META: EnumMeta<MonitorMuteState> = {
  pending: { textId: 'enum.monitor.muteState.pending', status: 'Warning' },
  active: { textId: 'enum.monitor.muteState.active', status: 'Processing' },
  expired: { textId: 'enum.monitor.muteState.expired', status: 'Default' },
  disabled: { textId: 'enum.monitor.muteState.disabled', status: 'Default' },
};

export const NOTIFY_KIND_META: Record<
  MonitorNotifyKind,
  { textId: string; color: string }
> = {
  1: { textId: 'enum.monitor.notifyKind.1', color: 'red' },
  2: { textId: 'enum.monitor.notifyKind.2', color: 'orange' },
  3: { textId: 'enum.monitor.notifyKind.3', color: 'green' },
  4: { textId: 'enum.monitor.notifyKind.4', color: 'purple' },
};

/** 处理状态（活跃告警列表）：未认领 / 已认领 / 已屏蔽 / 被抑制 */
export const HANDLE_STATE_META: Record<
  MonitorHandleState,
  { textId: string; color?: string }
> = {
  1: { textId: 'enum.monitor.handleState.1', color: 'red' },
  2: { textId: 'enum.monitor.handleState.2', color: 'blue' },
  3: { textId: 'enum.monitor.handleState.3' },
  4: { textId: 'enum.monitor.handleState.4' },
};
export const HANDLE_STATE_ORDER: readonly MonitorHandleState[] = [1, 2, 3, 4];

export const ESCALATION_MODE_META: EnumMeta<MonitorEscalationMode> = {
  1: { textId: 'enum.monitor.escalationMode.1' },
  2: { textId: 'enum.monitor.escalationMode.2' },
};
export const ESCALATION_MODE_ORDER: readonly MonitorEscalationMode[] = [1, 2];

export const ESCALATION_TRIGGER_META: EnumMeta<MonitorEscalationTrigger> = {
  1: { textId: 'enum.monitor.escalationTrigger.1' },
  2: { textId: 'enum.monitor.escalationTrigger.2' },
};
export const ESCALATION_TRIGGER_ORDER: readonly MonitorEscalationTrigger[] = [
  1, 2,
];

/** 标签匹配操作符（六种，与后端一致）；多值操作符用 values */
export const MATCHER_OPS: readonly MonitorMatcherOp[] = [
  '==',
  '!=',
  '=~',
  '!~',
  'in',
  'not in',
];
/** 操作符 → 文案 i18n 键 */
export const MATCHER_OP_TEXT_ID: Record<MonitorMatcherOp, string> = {
  '==': 'pages.monitor.matcher.op.eq',
  '!=': 'pages.monitor.matcher.op.ne',
  '=~': 'pages.monitor.matcher.op.re',
  '!~': 'pages.monitor.matcher.op.nre',
  in: 'pages.monitor.matcher.op.in',
  'not in': 'pages.monitor.matcher.op.nin',
};
export const isMultiValueOp = (op?: MonitorMatcherOp) =>
  op === 'in' || op === 'not in';

export const EVAL_STEP_META: Record<
  EvalPointStep,
  { textId: string; color?: string }
> = {
  pending: { textId: 'enum.monitor.evalStep.pending', color: 'gold' },
  fired: { textId: 'enum.monitor.evalStep.fired', color: 'red' },
  firing: { textId: 'enum.monitor.evalStep.firing', color: 'red' },
  muted_event: { textId: 'enum.monitor.evalStep.muted_event' },
  muted_notify: { textId: 'enum.monitor.evalStep.muted_notify' },
  inhibited: { textId: 'enum.monitor.evalStep.inhibited' },
  recovering: { textId: 'enum.monitor.evalStep.recovering', color: 'blue' },
  resolved: { textId: 'enum.monitor.evalStep.resolved', color: 'green' },
  dropped: { textId: 'enum.monitor.evalStep.dropped' },
  out_of_scope: { textId: 'enum.monitor.evalStep.out_of_scope' },
  inhibited_rule: { textId: 'enum.monitor.evalStep.inhibited_rule' },
  inhibited_topology: { textId: 'enum.monitor.evalStep.inhibited_topology' },
  muted_maintenance: { textId: 'enum.monitor.evalStep.muted_maintenance' },
};

export const VERSION_ACTION_META: Record<
  RuleVersionAction,
  { textId: string }
> = {
  create: { textId: 'enum.monitor.versionAction.create' },
  update: { textId: 'enum.monitor.versionAction.update' },
  enable: { textId: 'enum.monitor.versionAction.enable' },
  disable: { textId: 'enum.monitor.versionAction.disable' },
  move: { textId: 'enum.monitor.versionAction.move' },
  rollback: { textId: 'enum.monitor.versionAction.rollback' },
  import: { textId: 'enum.monitor.versionAction.import' },
  delete: { textId: 'enum.monitor.versionAction.delete' },
  batch: { textId: 'enum.monitor.versionAction.batch' },
};

export const BATCH_ACTION_META: Record<RuleBatchAction, { textId: string }> = {
  enable: { textId: 'enum.monitor.batchAction.enable' },
  disable: { textId: 'enum.monitor.batchAction.disable' },
  move: { textId: 'enum.monitor.batchAction.move' },
  set_severity: { textId: 'enum.monitor.batchAction.set_severity' },
  set_timing: { textId: 'enum.monitor.batchAction.set_timing' },
  add_labels: { textId: 'enum.monitor.batchAction.add_labels' },
  remove_labels: { textId: 'enum.monitor.batchAction.remove_labels' },
  set_notify: { textId: 'enum.monitor.batchAction.set_notify' },
  set_escalation: { textId: 'enum.monitor.batchAction.set_escalation' },
  delete: { textId: 'enum.monitor.batchAction.delete' },
};
/** 批量菜单顺序（删除在最后） */
export const BATCH_ACTION_ORDER: readonly RuleBatchAction[] = [
  'enable',
  'disable',
  'move',
  'set_severity',
  'set_timing',
  'add_labels',
  'remove_labels',
  'set_notify',
  'set_escalation',
  'delete',
];

export const IMPORT_STATUS_META: Record<
  ImportItemStatus,
  { textId: string; color?: string }
> = {
  new: { textId: 'enum.monitor.importStatus.new', color: 'green' },
  conflict: { textId: 'enum.monitor.importStatus.conflict', color: 'gold' },
  invalid: { textId: 'enum.monitor.importStatus.invalid', color: 'red' },
  skipped: { textId: 'enum.monitor.importStatus.skipped' },
};

export const IMPORT_CONFLICT_META: Record<
  ImportConflictPolicy,
  { textId: string }
> = {
  skip: { textId: 'enum.monitor.importConflict.skip' },
  overwrite: { textId: 'enum.monitor.importConflict.overwrite' },
  rename: { textId: 'enum.monitor.importConflict.rename' },
};
export const IMPORT_CONFLICT_ORDER: readonly ImportConflictPolicy[] = [
  'skip',
  'overwrite',
  'rename',
];

export const IMPORT_RESULT_META: Record<
  ImportResultAction,
  { textId: string; color?: string }
> = {
  created: { textId: 'enum.monitor.importResult.created', color: 'green' },
  updated: { textId: 'enum.monitor.importResult.updated', color: 'blue' },
  skipped: { textId: 'enum.monitor.importResult.skipped' },
  failed: { textId: 'enum.monitor.importResult.failed', color: 'red' },
};

/** 标签名规则（Prometheus 标签名） */
export const LABEL_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
/** 列表的标签筛选项：name=value */
export const LABEL_FILTER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*=.+$/;
/** 通知群标识：以 $ 开头，如 $group:ops */
export const ROBOT_GROUP_REGEX = /^\$[A-Za-z0-9:_.-]{1,63}$/;

/** 表单上限（与后端 proto 校验一致） */
export const MONITOR_LIMITS = {
  nameMax: 128,
  ruleDescMax: 512,
  exprMax: 8192,
  queryMax: 4,
  ruleDatasourceMax: 20,
  ruleLabelMax: 20,
  labelValueMax: 256,
  annotationMax: 10,
  annotationValueMax: 2048,
  evalInterval: { min: 15, max: 3600 },
  holdSeconds: { min: 0, max: 86400 },
  repeatInterval: { min: 5, max: 10080 },
  maxNotify: { min: 0, max: 1000 },
  groupKeyLabelMax: 10,
  notifyUserMax: 50,
  notifyScheduleMax: 20,
  notifyDeptMax: 20,
  summaryMax: 255,
  matcherMax: 20,
  matcherValueMax: 256,
  matcherValuesMax: 50,
  windowMax: 10,
  timezoneMax: 64,
  muteReasonMax: 255,
  refRuleMax: 200,
  refDatasourceMax: 50,
  subscriptionGroupMax: 50,
  robotGroupMax: 10,
  groupNameMax: 64,
  groupDescMax: 255,
  groupSortMax: 9999,
  roleScopeMax: 200,
  datasourceNameMax: 64,
  urlMax: 512,
  usernameMax: 128,
  secretMax: 4096,
  headerMax: 20,
  headerKeyMax: 64,
  headerValueMax: 1024,
  timeoutMs: { min: 1000, max: 30000 },
  datasourceDescMax: 255,
  batchMax: 200,
  importBytesMax: 1048576,
  labelFilterMax: 5,
  keywordMax: 128,
} as const;
