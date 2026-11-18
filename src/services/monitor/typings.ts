/**
 * 监控告警域类型：与后端 api/monitor/v1 的 proto（protojson：camelCase、时间为 RFC3339
 * 字符串、int64 为字符串）一一对应。后端开启了 EmitUnpopulated：零值照常输出，未设置的消息 /
 * 时间 / optional 字段输出为 null——下面标成可选（`?`）的字段在运行时可能是 null，读取时一律用
 * `?.` / `??` / 真值判断，不要写 `=== undefined`，也不要靠解构缺省值。编辑表单读取 spec 见 normalize.ts。
 */

/** 级别：1=提示 2=警告 3=严重 4=致命 */
export type MonitorSeverity = 1 | 2 | 3 | 4;
/** 数据范围级别：0=无权限 1=只读 2=可管理 */
export type MonitorScopeLevel = 0 | 1 | 2;
/** 评估结果：0=未评估 1=正常 2=告警中 3=无数据 4=查询错误 5=不在生效时间 */
export type MonitorEvalStatus = 0 | 1 | 2 | 3 | 4 | 5;
/** 告警状态：1=告警中 2=已恢复 3=已关闭 */
export type MonitorAlertStatus = 1 | 2 | 3;
/** 数据源健康状态：0=未知 1=正常 2=异常 */
export type MonitorHealthStatus = 0 | 1 | 2;
/** 数据源认证方式：1=无 2=Basic 3=Bearer */
export type MonitorAuthType = 1 | 2 | 3;
/** 数据源范围：1=指定数据源 2=全部启用的数据源 */
export type MonitorDatasourceScope = 1 | 2;
/** 屏蔽方式：1=只屏蔽通知 2=屏蔽事件 */
export type MonitorMuteMode = 1 | 2;
/** 屏蔽时间类型：1=一次性 2=周期 */
export type MonitorMuteTimeType = 1 | 2;
/** 屏蔽规则当前状态 */
export type MonitorMuteState = 'pending' | 'active' | 'expired' | 'disabled';
/** 标签匹配操作符 */
export type MonitorMatcherOp = '==' | '!=' | '=~' | '!~' | 'in' | 'not in';
/** 通知类型：1=触发 2=重复 3=恢复 4=升级（升级到某一级时的首次通知与该级的重复提醒） */
export type MonitorNotifyKind = 1 | 2 | 3 | 4;
/** 通知来源：1=规则的通知对象 2=订阅规则 3=升级策略某一级的通知对象 */
export type MonitorNotifySource = 1 | 2 | 3;
/** 处理状态（按此顺序取第一个成立的）：4=被抑制 3=已屏蔽 2=已认领 1=未认领 */
export type MonitorHandleState = 1 | 2 | 3 | 4;
/** 抑制方式：0=未被抑制 1=抑制规则 2=拓扑抑制（上游资源有活跃告警） */
export type MonitorInhibitKind = 0 | 1 | 2;
/** 生效方式：留空 / windows 按时间窗；work_time 仅工作时间；off_time 仅非工作时间（按流程中心的工作日历） */
export type MonitorEffectiveMode = '' | 'windows' | 'work_time' | 'off_time';
/** 升级方式：1=叠加 2=接替 */
export type MonitorEscalationMode = 1 | 2;
/** 升级触发条件：1=持续未认领 2=持续未恢复 */
export type MonitorEscalationTrigger = 1 | 2;
/** 记录规则最近一次执行结果：0=未执行 1=已写回 2=查询无结果 3=查询失败 4=写回失败 */
export type MonitorRecordStatus = 0 | 1 | 2 | 3 | 4;

/** 被引用对象的 ID 与显示名；missing=对象已删除或不可用 */
export interface NamedRef {
  id: string;
  name?: string;
  missing?: boolean;
}

/** 一行事件标签匹配条件；多行之间是「并且」 */
export interface LabelMatcher {
  label: string;
  op: MonitorMatcherOp;
  /** == / != / =~ / !~ 时使用 */
  value?: string;
  /** in / not in 时使用，1-50 个 */
  values?: string[];
}

/** 一个按周重复的时间窗 */
export interface TimeWindow {
  /** 星期几，1-7 = 周一至周日 */
  days: number[];
  /** HH:MM（含） */
  start: string;
  /** HH:MM（不含）；早于 start 表示跨午夜，等于 start 表示全天 */
  end: string;
}

/** 按周重复的生效时间 */
export interface EffectiveTime {
  /** IANA 时区名，空按 UTC */
  timezone?: string;
  /** 时间窗，至多 10 个；为空表示全时段 */
  windows?: TimeWindow[];
  /**
   * 生效方式，仅规则的生效时间使用（屏蔽规则的周期时间须留空）。work_time / off_time 时 windows
   * 必须是空数组（否则 400），timezone 不起作用
   */
  mode?: MonitorEffectiveMode;
}

// ---------- 数据源 ----------

export interface DatasourceConnection {
  url: string;
  authType: MonitorAuthType;
  username?: string;
  /** 只写不读；编辑 / 测试已有数据源时不传 = 沿用已保存的凭据 */
  secret?: string;
  /**
   * 响应里值一律是掩码（见 datasource.ts 的 HEADER_VALUE_MASK）；编辑 / 测试时把掩码原样
   * 传回 = 沿用该键已保存的值
   */
  headers?: Record<string, string>;
  timeoutMs: number;
  tlsSkipVerify?: boolean;
}

export interface DatasourceSpec {
  name: string;
  connection: DatasourceConnection;
  remoteWriteUrl?: string;
  description?: string;
  isDefault?: boolean;
  enabled?: boolean;
}

export interface MonitorDatasource {
  id: string;
  spec: DatasourceSpec;
  type?: string;
  hasSecret?: boolean;
  healthStatus?: MonitorHealthStatus;
  healthError?: string;
  healthTime?: string;
  /** 指定使用本数据源的规则数；大于 0 时不可删除 */
  ruleCount?: number;
  version: number;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
}

export interface DatasourceOption {
  id: string;
  name: string;
  isDefault?: boolean;
  enabled?: boolean;
  healthStatus?: MonitorHealthStatus;
}

export interface DatasourceTestResult {
  ok?: boolean;
  latencyMs?: number;
  error?: string;
}

export interface QueryPoint {
  /** Unix 毫秒（int64 字符串） */
  timestampMs?: string;
  /** NaN、正负无穷为字符串 "NaN" / "Infinity" / "-Infinity" */
  value?: number | string;
}

export interface QuerySeries {
  labels?: Record<string, string>;
  points?: QueryPoint[];
}

export interface QueryResult {
  /** vector / scalar / matrix / string */
  resultType?: string;
  series?: QuerySeries[];
  truncated?: boolean;
  warnings?: string[];
  durationMs?: number;
}

// ---------- 规则分组 ----------

export interface RuleGroup {
  id: string;
  parentId?: string;
  name: string;
  fullName?: string;
  description?: string;
  sort?: number;
  depth?: number;
  /** 当前用户对本分组的级别；0 仅用于展示层级 */
  level?: MonitorScopeLevel;
  ruleCount?: number;
  childCount?: number;
  builtin?: boolean;
  createTime?: string;
  updateTime?: string;
}

export interface GroupRoleScope {
  roleId: string;
  roleName?: string;
  roleEnabled?: boolean;
  level: 1 | 2;
  updateUserName?: string;
  updateTime?: string;
}

export interface InheritedGroupRoleScope {
  roleId: string;
  roleName?: string;
  level: 1 | 2;
  groupId?: string;
  groupName?: string;
}

// ---------- 告警规则 ----------

export interface RuleQuery {
  expr: string;
  severity: MonitorSeverity;
}

export interface RuleNotify {
  userIds?: string[];
  scheduleIds?: string[];
  deptIds?: string[];
  /** 通知事件关联的 CMDB 资源的负责人（负责人是可用的系统用户时才有收件人） */
  ciOwner?: boolean;
}

/** 事件如何关联 CMDB 资源；全部留空 = 全局缺省（ident → 名称，其次 instance → ip 属性） */
export interface RuleCIMatch {
  /** 不关联资源（富化、维护态屏蔽、拓扑抑制、通知资源负责人随之不起作用） */
  disabled?: boolean;
  /** 用哪个事件标签去找资源；留空用全局缺省 */
  label?: string;
  /** name 资源名称 / attr 资源的某个属性；label 非空时必填 */
  by?: '' | 'name' | 'attr';
  /** by=attr 时比对的属性，留空为 ip；须是 rule-option 返回的可关联属性之一 */
  attr?: string;
  /** 只在这些模型的资源里找，至多 20 个 */
  modelCodes?: string[];
  /** 富化时写入事件的资源标签（ci_tag_<标签>="true"），至多 10 个 */
  enrichTags?: string[];
}

/** 规则仅对指定资源生效：各项之间是「并且」，留空 = 不限 */
export interface RuleResourceScope {
  enabled?: boolean;
  modelCodes?: string[];
  envs?: string[];
  tags?: string[];
}

export type RuleRelabelAction =
  | 'replace'
  | 'labelmap'
  | 'labeldrop'
  | 'labelkeep';

/** 一步事件标签改写（语义同 Prometheus relabel_config 的同名动作），在计算事件指纹之前执行 */
export interface RuleRelabelStep {
  action: RuleRelabelAction;
  /** 仅 replace，至多 5 个 */
  sourceLabels?: string[];
  /** 仅 replace；留空为 ";" */
  separator?: string;
  /** replace 留空为 "(.*)"，其余动作必填；至多 256 字节 */
  regex?: string;
  /** 仅 replace 且必填；不得以 __ 开头 */
  targetLabel?: string;
  /** replace / labelmap；留空为 "$1" */
  replacement?: string;
}

/** 触发时自动建单；启用时 templateId 与 agentUserId 必填 */
export interface RuleTicketAction {
  enabled?: boolean;
  templateId?: string;
  /** 代理提单人（须是可用用户） */
  agentUserId?: string;
}

/** 触发时发起流程；启用时 definitionKey 与 agentUserId 必填 */
export interface RuleWorkflowAction {
  enabled?: boolean;
  definitionKey?: string;
  agentUserId?: string;
}

/** 规则触发后的事件动作；每个事件每种动作至多执行一次 */
export interface RuleActions {
  ticket?: RuleTicketAction;
  workflow?: RuleWorkflowAction;
  aiSummary?: boolean;
}

/** 规则的可编辑内容（新建、编辑、历史版本、导入预览共用） */
export interface RuleSpec {
  groupId: string;
  name: string;
  description?: string;
  enabled?: boolean;
  labels?: Record<string, string>;
  datasourceScope: MonitorDatasourceScope;
  datasourceIds?: string[];
  queries: RuleQuery[];
  levelInhibit?: boolean;
  evalIntervalS: number;
  forS?: number;
  recoverS?: number;
  nodataKeepS?: number;
  effective?: EffectiveTime;
  annotations?: Record<string, string>;
  recoveryExpr?: string;
  notify?: RuleNotify;
  notifyRecovery?: boolean;
  repeatIntervalM?: number;
  maxNotify?: number;
  groupKeyLabels?: string[];
  /** 关联 CMDB 资源的方式；不传为全局缺省 */
  ciMatch?: RuleCIMatch;
  /** 仅对指定资源生效；不传为不限 */
  resourceScope?: RuleResourceScope;
  /** 事件标签改写步骤，至多 10 步，按顺序执行 */
  relabel?: RuleRelabelStep[];
  /** 条件丢弃表达式（模板，渲染结果恰为 true 时丢弃），至多 2048 字节 */
  dropExpr?: string;
  /** 拓扑抑制：关联资源的上游资源正在告警时本事件不通知 */
  topologyInhibit?: boolean;
  /** 升级策略；留空不升级 */
  escalationId?: string;
  /** 事件动作（自动建单 / 触发流程 / AI 摘要） */
  actions?: RuleActions;
}

export interface RuleEvalTask {
  datasourceId: string;
  datasourceName?: string;
  lastStatus?: MonitorEvalStatus;
  lastEvalTime?: string;
  lastError?: string;
  lastDurationMs?: number;
  firingCount?: number;
  nextEvalTime?: string;
}

export interface MonitorRule {
  id: string;
  spec: RuleSpec;
  groupName?: string;
  datasources?: NamedRef[];
  notifyUsers?: NamedRef[];
  notifySchedules?: NamedRef[];
  notifyDepts?: NamedRef[];
  maxSeverity?: MonitorSeverity;
  version: number;
  status?: MonitorEvalStatus;
  firingCount?: number;
  lastEvalTime?: string;
  lastError?: string;
  /** 仅详情接口返回 */
  evalTasks?: RuleEvalTask[];
  canManage?: boolean;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
  /** 引用的升级策略（与 spec.escalationId 对应）；未引用时为 null */
  escalation?: NamedRef | null;
  /** 自动建单的工单模板 */
  ticketTemplate?: NamedRef | null;
  /** 自动建单的代理提单人 */
  ticketAgent?: NamedRef | null;
  /** 触发的流程（id 为流程标识 definitionKey） */
  workflowDefinition?: NamedRef | null;
  /** 流程发起人 */
  workflowAgent?: NamedRef | null;
}

export type RuleBatchAction =
  | 'enable'
  | 'disable'
  | 'move'
  | 'set_severity'
  | 'set_timing'
  | 'add_labels'
  | 'remove_labels'
  | 'set_notify'
  | 'set_escalation'
  | 'delete';

/** 批量操作请求：action 决定使用哪些参数字段，其余须留空 */
export interface BatchRulesBody {
  ids: string[];
  action: RuleBatchAction;
  groupId?: string;
  severity?: MonitorSeverity;
  evalIntervalS?: number;
  forS?: number;
  recoverS?: number;
  labels?: Record<string, string>;
  labelNames?: string[];
  notify?: RuleNotify;
  notifyRecovery?: boolean;
  repeatIntervalM?: number;
  maxNotify?: number;
  /** action=set_escalation：不传 = 取消升级策略 */
  escalationId?: string;
}

export interface BatchRuleResult {
  id: string;
  name?: string;
  ok?: boolean;
  reason?: string;
  message?: string;
}

export interface BatchRulesResult {
  results?: BatchRuleResult[];
  succeeded?: number;
  failed?: number;
}

export type RuleVersionAction =
  | 'create'
  | 'update'
  | 'enable'
  | 'disable'
  | 'move'
  | 'rollback'
  | 'import'
  | 'delete'
  | 'batch';

export interface RuleVersion {
  ruleId: string;
  version: number;
  action?: RuleVersionAction;
  summary?: string;
  operatorId?: string;
  operatorName?: string;
  createTime?: string;
  /** 仅 GetRuleVersion 返回 */
  spec?: RuleSpec;
  groupName?: string;
}

export interface RuleExprResult {
  expr?: string;
  valid?: boolean;
  error?: string;
}

/** 导入规则的公共选项（预览与导入共用，两次请求须一致） */
export interface ImportRulesOptions {
  /** Prometheus / vmalert 规则 YAML，或本系统导出的 JSON */
  content: string;
  groupId: string;
  datasourceScope: MonitorDatasourceScope;
  datasourceIds?: string[];
  /** 对 JSON 不起作用，但仍须传 1-4 */
  defaultSeverity: MonitorSeverity;
  /** 非空时覆盖 JSON 文件里的通知对象 */
  notify?: RuleNotify;
  /**
   * severity 标签取值 → 级别（仅 YAML，至多 50 项，键不区分大小写）；未命中时退回内置对照，
   * 再退回 defaultSeverity
   */
  severityMap?: Record<string, MonitorSeverity>;
}

export type ImportItemStatus = 'new' | 'conflict' | 'invalid' | 'skipped';

export interface ImportRuleItem {
  /** 在文件中的序号（从 0 起） */
  index?: number;
  sourceGroup?: string;
  name?: string;
  status?: ImportItemStatus;
  spec?: RuleSpec;
  existingRuleId?: string;
  error?: string;
  warnings?: string[];
}

export interface ImportPreviewResult {
  items?: ImportRuleItem[];
  total?: number;
  newCount?: number;
  conflictCount?: number;
  invalidCount?: number;
  skippedCount?: number;
}

export type ImportConflictPolicy = 'skip' | 'overwrite' | 'rename';
export type ImportResultAction = 'created' | 'updated' | 'skipped' | 'failed';

export interface ImportRuleResult {
  index?: number;
  name?: string;
  action?: ImportResultAction;
  ruleId?: string;
  error?: string;
}

export interface ImportRulesResult {
  results?: ImportRuleResult[];
  created?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
}

export interface ExportRulesResult {
  content?: string;
  filename?: string;
  count?: number;
}

export interface EvalQueryDetail {
  index?: number;
  severity?: MonitorSeverity;
  series?: number;
  truncated?: boolean;
  error?: string;
}

export type EvalPointStep =
  | 'pending'
  | 'fired'
  | 'firing'
  | 'muted_event'
  | 'muted_notify'
  | 'inhibited'
  | 'recovering'
  | 'resolved'
  | 'dropped'
  | 'out_of_scope'
  | 'inhibited_rule'
  | 'inhibited_topology'
  | 'muted_maintenance';

export interface EvalPoint {
  fingerprint?: string;
  labels?: Record<string, string>;
  severity?: MonitorSeverity;
  /** 文本形式，可能为 NaN / +Inf / -Inf */
  value?: string;
  step?: EvalPointStep;
  alertId?: string;
  muteId?: string;
  /** 造成抑制的源告警事件（step 为 inhibited_rule / inhibited_topology 时） */
  inhibitAlertId?: string;
  /** 关联到的 CMDB 资源 */
  ciId?: string;
}

export interface RuleEvalRecord {
  id: string;
  ruleId?: string;
  datasourceId?: string;
  datasourceName?: string;
  evalTime?: string;
  durationMs?: number;
  status?: Exclude<MonitorEvalStatus, 0>;
  error?: string;
  series?: number;
  anomalies?: number;
  recovered?: number;
  queries?: EvalQueryDetail[];
  points?: EvalPoint[];
  pointsTruncated?: boolean;
}

// ---------- 告警事件 ----------

export interface MonitorAlert {
  id: string;
  fingerprint?: string;
  ruleId?: string;
  ruleName?: string;
  ruleExists?: boolean;
  groupId?: string;
  groupName?: string;
  datasourceId?: string;
  datasourceName?: string;
  severity?: MonitorSeverity;
  status?: MonitorAlertStatus;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  expr?: string;
  /** NaN、正负无穷为字符串；无值时不返回 */
  value?: number | string;
  recoveryValue?: number | string;
  firstFireTime?: string;
  lastFireTime?: string;
  resolveTime?: string;
  /** 持续秒数（int64 字符串） */
  durationS?: string;
  muted?: boolean;
  muteId?: string;
  muteName?: string;
  notifyCount?: number;
  lastNotifyTime?: string;
  /** 认领人；未认领为空 */
  ackUserId?: string;
  ackUserName?: string;
  ackTime?: string;
  /** 认领耗时秒（int64 字符串）；未认领为 0 */
  ackDurationS?: string;
  /** 手动关闭的操作人；不是手动关闭的为空 */
  closedById?: string;
  closedByName?: string;
  closeReason?: string;
  /** 已下达手动关闭、评估引擎尚未执行（事件仍是告警中） */
  closing?: boolean;
  inhibited?: boolean;
  inhibitKind?: MonitorInhibitKind;
  /** 命中的抑制规则；拓扑抑制或未被抑制时为空 */
  inhibitId?: string;
  inhibitName?: string;
  /** 造成抑制的源告警事件 */
  inhibitAlertId?: string;
  inhibitAlertName?: string;
  /** 关联的 CMDB 资源；未关联为空 */
  ciId?: string;
  ciName?: string;
  /** 已升级到第几级，0=未升级 */
  escalationLevel?: number;
  ticketId?: string;
  ticketNumber?: string;
  workflowInstanceId?: string;
  aiSummary?: string;
  handleState?: MonitorHandleState;
  /** 当前用户能否手动关闭、转工单（对事件所在分组「可管理」） */
  canManage?: boolean;
  /** 当前用户能否认领 / 取消认领 / 转交 / 备注（对事件所在分组「只读」以上） */
  canAck?: boolean;
}

export interface AlertRecipient {
  /** user 用户 / group 通知群 */
  type?: 'user' | 'group';
  id?: string;
  name?: string;
}

export interface AlertNotifyLog {
  id: string;
  kind?: MonitorNotifyKind;
  seq?: number;
  source?: MonitorNotifySource;
  subscriptionId?: string;
  subscriptionName?: string;
  recipients?: AlertRecipient[];
  notifyEventIds?: string[];
  note?: string;
  createTime?: string;
  /** 升级通知的级数 1-10；其余通知为 0 */
  level?: number;
}

export type AlertTimelineType =
  | 'fire'
  | 'resolve'
  | 'close'
  | 'mute'
  | 'unmute'
  | 'inhibit'
  | 'uninhibit'
  | 'escalate'
  | 'notify'
  | 'ack'
  | 'unack'
  | 'transfer'
  | 'comment'
  | 'ticket'
  | 'ticket_note'
  | 'workflow'
  | 'ai_summary'
  | 'action_failed'
  | 'notification';

/** 时间线条目的细节：始终是对象，各类型只填用得到的字段，其余为零值 */
export interface AlertEventDetail {
  /** 备注内容（comment）、关闭原因（close）、转交说明（transfer）或通知说明（notify） */
  text?: string;
  /** 关闭的缘由（close）：manual 手动关闭 / rule 规则被删除、停用或数据源不再适用 */
  cause?: string;
  fromUser?: NamedRef | null;
  toUser?: NamedRef | null;
  /** 屏蔽规则（mute / unmute）；因关联资源处于维护态而屏蔽时为空 */
  muteId?: string;
  muteName?: string;
  maintenance?: boolean;
  inhibitKind?: MonitorInhibitKind;
  inhibitId?: string;
  inhibitName?: string;
  inhibitAlertId?: string;
  /** 升级到第几级（escalate） */
  level?: number;
  /** 当时的级别（fire / resolve） */
  severity?: number;
  ticketId?: string;
  ticketNumber?: string;
  /** 是否由规则自动建单（ticket） */
  auto?: boolean;
  workflowInstanceId?: string;
  /** 失败的事件动作（action_failed）：1=自动建单 2=触发流程 3=AI 摘要 4=在工单上追加恢复记录 */
  actionKind?: number;
  error?: string;
}

export interface AlertTimelineItem {
  id: string;
  type?: AlertTimelineType;
  time?: string;
  /** 操作人；系统产生的条目为 null */
  operator?: NamedRef | null;
  detail?: AlertEventDetail | null;
  /** 仅 type=notification 时有值 */
  notifyLog?: AlertNotifyLog | null;
}

/** 事件关联的 CMDB 资源卡片 */
export interface AlertCI {
  id: string;
  name?: string;
  modelCode?: string;
  modelName?: string;
  env?: string;
  /** planning 规划中 / active 使用中 / maintenance 维护中 / retired 已退役 */
  status?: string;
  /** 负责人：是系统用户时为其显示名，否则为资源上登记的原文 */
  owner?: string;
  ownerId?: string;
  tags?: string[];
  /** 资源当前是否仍存在 */
  exists?: boolean;
  /** 当前用户能否在资源管理里查看该资源；false 时不给跳转链接 */
  canView?: boolean;
  firingCount?: number;
}

/** 影响面里的一个下游资源 */
export interface AlertImpactCI {
  id: string;
  name?: string;
  modelCode?: string;
  modelName?: string;
  /** 与事件关联资源的距离（1 = 直接下游） */
  depth?: number;
  firingCount?: number;
  canView?: boolean;
}

/** 事件关联的工单 */
export interface AlertTicket {
  id: string;
  number?: string;
  title?: string;
  /** 工单状态（取值同工单管理） */
  status?: number;
  auto?: boolean;
  /** false 时 title 为空、不给跳转链接 */
  canView?: boolean;
}

/** 批量操作中一个事件的结果 */
export interface AlertActionResult {
  id: string;
  ok?: boolean;
  reason?: string;
  message?: string;
}

export interface BatchAlertsResult {
  results?: AlertActionResult[];
  succeeded?: number;
  failed?: number;
}

/** 值班表一个班次的告警数 */
export interface ShiftAlertCount {
  userId?: string;
  userName?: string;
  /** 1=主班 2=备班 */
  role?: number;
  startTime?: string;
  endTime?: string;
  alertCount?: number;
}

export interface AlertAggregate {
  /** 规则 ID / 级别数字 / 分组 ID / 标签取值（没有该标签时为空串） */
  key?: string;
  name?: string;
  count?: number;
  maxSeverity?: MonitorSeverity;
  /** 下标 0-3 依次对应级别 1-4 */
  severityCounts?: number[];
  lastFireTime?: string;
}

// ---------- 屏蔽规则 ----------

/** 屏蔽规则的可编辑内容（新建、编辑、预览共用） */
export interface MuteSpec {
  /** 不传 = 作用于全部分组（仅超级管理员） */
  groupId?: string;
  name: string;
  reason: string;
  ruleIds?: string[];
  datasourceIds?: string[];
  severities?: MonitorSeverity[];
  matchers?: LabelMatcher[];
  mode: MonitorMuteMode;
  timeType: MonitorMuteTimeType;
  startTime?: string;
  endTime?: string;
  periodic?: EffectiveTime;
  enabled?: boolean;
}

export interface MonitorMute {
  id: string;
  spec: MuteSpec;
  groupName?: string;
  rules?: NamedRef[];
  datasources?: NamedRef[];
  state?: MonitorMuteState;
  mutedCount?: number;
  version: number;
  canManage?: boolean;
  createTime?: string;
  updateTime?: string;
  createUserId?: string;
  createUserName?: string;
  updateUserId?: string;
  updateUserName?: string;
}

/** 预览命中（屏蔽规则 / 订阅规则共用） */
export interface AlertPreviewResult {
  alerts?: MonitorAlert[];
  total?: number;
}

// ---------- 告警订阅 ----------

export interface SubscriptionReceivers {
  self?: boolean;
  userIds?: string[];
  scheduleIds?: string[];
  /** 通知群标识，以 $ 开头，如 $group:ops */
  groups?: string[];
}

/** 订阅规则的可编辑内容（新建、编辑、预览共用） */
export interface AlertSubscriptionSpec {
  name: string;
  groupIds: string[];
  ruleIds?: string[];
  datasourceIds?: string[];
  severities: MonitorSeverity[];
  onFiring?: boolean;
  onResolved?: boolean;
  matchers?: LabelMatcher[];
  receivers: SubscriptionReceivers;
  followRepeat?: boolean;
  enabled?: boolean;
}

export interface MonitorAlertSubscription {
  id: string;
  spec: AlertSubscriptionSpec;
  ownerId?: string;
  ownerName?: string;
  groups?: NamedRef[];
  rules?: NamedRef[];
  datasources?: NamedRef[];
  receiverUsers?: NamedRef[];
  receiverSchedules?: NamedRef[];
  /** 所有者当前已无权访问的订阅分组 */
  outOfScopeGroupIds?: string[];
  lastHitTime?: string;
  hitCount7d?: number;
  version: number;
  canManage?: boolean;
  createTime?: string;
  updateTime?: string;
}

// ---------- 聚合视图 ----------

export interface AlertViewFilter {
  groupId?: string;
  datasourceId?: string;
  severities?: MonitorSeverity[];
  muted?: boolean;
  acked?: boolean;
  inhibited?: boolean;
  /** 每项形如 name=value，至多 5 项 */
  labels?: string[];
}

export interface AlertViewSpec {
  /** 1-64 字符；同一所有者下唯一 */
  name: string;
  /** rule / severity / group / label:<标签名> */
  by: string;
  filters?: AlertViewFilter | null;
  /** 公共视图（所有人可见）；仅超级管理员可设为 true */
  isPublic?: boolean;
}

export interface MonitorAlertView {
  id: string;
  spec: AlertViewSpec;
  ownerId?: string;
  ownerName?: string;
  mine?: boolean;
  canEdit?: boolean;
  createTime?: string;
  updateTime?: string;
}

// ---------- 升级策略 ----------

export interface EscalationSchedule {
  id: string;
  /** 仅通知备班（不通知主班） */
  backupOnly?: boolean;
}

export interface EscalationDept {
  id: string;
  /** 向上几级：0 = 本部门负责人，至多 5 */
  up?: number;
}

/** 升级策略一级的通知对象；四类取并集，至少填一类 */
export interface EscalationTargets {
  userIds?: string[];
  schedules?: EscalationSchedule[];
  /** 值班分组：通知各分组的管理员 */
  oncallGroupIds?: string[];
  /** 部门负责人（同一部门可按不同的上溯层级各列一项） */
  depts?: EscalationDept[];
}

export interface EscalationLevel {
  trigger: MonitorEscalationTrigger;
  /** 自事件首次触发起算的分钟数，1-10080；各级须严格递增 */
  afterM: number;
  targets?: EscalationTargets;
  /** 0 = 只在升级时通知一次，否则 5-10080 */
  repeatIntervalM?: number;
  /** 本级通知次数上限（含升级时的那一次），0-100，0 不限 */
  maxNotify?: number;
}

export interface EscalationSpec {
  /** 归属的规则分组；留空为全局策略（仅超级管理员）。新建后不可更改 */
  groupId?: string;
  name: string;
  description?: string;
  mode: MonitorEscalationMode;
  /** 最低级别 1-4：事件级别低于它时不升级 */
  minSeverity: MonitorSeverity;
  /** 1-10 级 */
  levels: EscalationLevel[];
  enabled?: boolean;
}

/** 一级通知对象的显示名（与 spec.levels 的同一下标对应） */
export interface EscalationLevelRefs {
  users?: NamedRef[];
  schedules?: NamedRef[];
  oncallGroups?: NamedRef[];
  /** 与 targets.depts 逐项对应 */
  depts?: NamedRef[];
}

/** 24 小时通知量估算（每次通知算一次，不乘以收件人数） */
export interface EscalationEstimate {
  /** 规则自身的通知次数；未给出规则的重复通知设置时为 1 */
  rule?: number;
  /** 各级的通知次数，下标与 levels 对应 */
  levels?: number[];
  total?: number;
}

export interface MonitorEscalation {
  id: string;
  spec: EscalationSpec;
  /** 全局策略为空 */
  groupName?: string;
  levelRefs?: EscalationLevelRefs[];
  ruleCount?: number;
  estimate?: EscalationEstimate | null;
  version: number;
  canManage?: boolean;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
}

/** 规则表单里可选的升级策略 */
export interface EscalationOption {
  id: string;
  name?: string;
  global?: boolean;
  groupName?: string;
  levelCount?: number;
  mode?: MonitorEscalationMode;
  minSeverity?: MonitorSeverity;
}

export interface OncallGroupOption {
  id: string;
  name?: string;
}

// ---------- 抑制规则 ----------

/** 抑制规则的一侧条件：各项之间是「并且」，留空的不作限制 */
export interface InhibitSelector {
  ruleIds?: string[];
  severities?: MonitorSeverity[];
  matchers?: LabelMatcher[];
}

export interface InhibitSpec {
  /** 作用的规则分组（含下级）；留空为全部分组（仅超级管理员） */
  groupId?: string;
  name: string;
  description?: string;
  /** 源条件：不得为空 */
  source?: InhibitSelector | null;
  /** 目标条件：可留空，但不得与 equalLabels 同时为空 */
  target?: InhibitSelector | null;
  /** 相等标签，至多 10 个 */
  equalLabels?: string[];
  enabled?: boolean;
}

export interface MonitorInhibit {
  id: string;
  spec: InhibitSpec;
  groupName?: string;
  sourceRules?: NamedRef[];
  targetRules?: NamedRef[];
  /** 当前正被它抑制的活跃告警数 */
  inhibitedCount?: number;
  version: number;
  canManage?: boolean;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
  createUserId?: string;
  createUserName?: string;
}

export interface InhibitPreviewResult {
  /** 当前满足源条件的活跃告警，至多 50 条 */
  sources?: MonitorAlert[];
  sourceTotal?: number;
  /** 当前会被抑制的活跃告警，至多 50 条 */
  targets?: MonitorAlert[];
  targetTotal?: number;
}

// ---------- 记录规则 ----------

export interface RecordRuleSpec {
  groupId: string;
  /** 即写回的指标名；建议 level:metric:operation */
  name: string;
  description?: string;
  datasourceId: string;
  expr: string;
  /** 执行周期秒，15-3600 */
  intervalS: number;
  labels?: Record<string, string>;
  enabled?: boolean;
}

export interface MonitorRecordRule {
  id: string;
  spec: RecordRuleSpec;
  groupName?: string;
  datasourceName?: string;
  /** 数据源当前是否可写（存在、已启用且配置了 Remote Write 地址）；false 时规则不会执行 */
  writable?: boolean;
  version: number;
  lastStatus?: MonitorRecordStatus;
  lastEvalTime?: string;
  lastError?: string;
  lastDurationMs?: number;
  lastSeries?: number;
  nextEvalTime?: string;
  canManage?: boolean;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
}

export interface RecordRuleIssue {
  /** expr / name / labels / datasource_id / group_id */
  field?: string;
  reason?: string;
  message?: string;
}

export interface RecordRuleValidateResult {
  valid?: boolean;
  issues?: RecordRuleIssue[];
}

// ---------- 规则模板 / 模拟触发 / 规则配置候选项 ----------

export interface RuleTemplatePack {
  code: string;
  name?: string;
  description?: string;
  /** host 主机 / middleware 中间件 / database 数据库 / platform 本平台自监控 */
  category?: string;
  ruleCount?: number;
}

export interface RuleTemplateItem {
  name?: string;
  expr?: string;
  severity?: MonitorSeverity;
  forS?: number;
  summary?: string;
}

export interface RuleTemplatePackDetail {
  pack?: RuleTemplatePack | null;
  rules?: RuleTemplateItem[];
  /** 规则 YAML 原文，可原样作为 ImportRulesOptions.content 导入 */
  content?: string;
}

export type SimulateStageName =
  | 'query'
  | 'effective'
  | 'relabel'
  | 'ci'
  | 'drop'
  | 'scope'
  | 'level_inhibit'
  | 'inhibit'
  | 'mute'
  | 'notify'
  | 'send';

export type SimulateStageStatus = 'pass' | 'warn' | 'block' | 'error' | 'skip';

export interface SimulateStage {
  stage?: SimulateStageName;
  status?: SimulateStageStatus;
  /** 说明（中文，直接展示） */
  message?: string;
}

export interface SimulateQueryResult {
  index?: number;
  severity?: MonitorSeverity;
  series?: number;
  truncated?: boolean;
  error?: string;
  durationMs?: number;
}

export type SimulateOutcome =
  | 'notify'
  | 'dropped'
  | 'out_of_scope'
  | 'level_inhibited'
  | 'inhibited'
  | 'muted_event'
  | 'muted_notify'
  | 'maintenance';

export interface SimulateEvent {
  /** 事件标签的最终内容（改写与富化之后） */
  labels?: Record<string, string>;
  /** 改写之前的标签 */
  sourceLabels?: Record<string, string>;
  severity?: MonitorSeverity;
  value?: number | string;
  fingerprint?: string;
  annotations?: Record<string, string>;
  outcome?: SimulateOutcome;
  reason?: string;
  /** matched / disabled / no_label / not_found / ambiguous / unavailable */
  ciStatus?: string;
  ci?: NamedRef | null;
  inhibitId?: string;
  inhibitAlertId?: string;
  muteId?: string;
}

export interface SimulateSubscription {
  id: string;
  name?: string;
  recipients?: NamedRef[];
}

export interface SimulateEscalationLevel {
  level?: number;
  afterM?: number;
  trigger?: MonitorEscalationTrigger;
  recipients?: NamedRef[];
}

export interface SimulateRuleBody {
  spec: RuleSpec;
  datasourceId: string;
  /** 查询没有结果时用来合成事件的序列标签，至多 30 个 */
  sampleLabels?: Record<string, string>;
  sampleValue?: number;
  /** true = 真实发送一条带 [TEST] 标记的通知；false = 干跑 */
  send?: boolean;
  /** 正在编辑的规则：判断抑制时把它自己的活跃告警排除在外 */
  ruleId?: string;
}

export interface SimulateRuleResult {
  stages?: SimulateStage[];
  queries?: SimulateQueryResult[];
  /** 查询没有结果，事件是用 sampleLabels 合成的 */
  synthetic?: boolean;
  inEffect?: boolean;
  /** 至多 20 个 */
  events?: SimulateEvent[];
  eventTotal?: number;
  recipients?: NamedRef[];
  recipientNotes?: string[];
  subscriptions?: SimulateSubscription[];
  escalation?: SimulateEscalationLevel[];
  /** 通知管理里是否有路由能匹配这条规则的告警事件 */
  routeMatched?: boolean;
  sent?: boolean;
  notifyEventIds?: string[];
}

export interface MonitorRuleOptions {
  ticketTemplates?: { id: string; name?: string; categoryName?: string }[];
  workflows?: { key: string; name?: string }[];
  ciModels?: { code: string; name?: string }[];
  ciEnvs?: string[];
  ciMatchAttrs?: string[];
  /** 智能助手是否已配置模型密钥（未配置时 AI 摘要不会生成） */
  aiAvailable?: boolean;
}

// ---------- 告警统计 ----------

export interface AlertOverview {
  firing?: number;
  /** 下标 0-3 依次对应级别 1-4 */
  firingBySeverity?: number[];
  unacked?: number;
  muted?: number;
  inhibited?: number;
  todayFired?: number;
  todayResolved?: number;
  todayClosed?: number;
}

export interface AlertTrendSeries {
  /** 级别数字（1-4）或规则分组 ID；「其他」为 other */
  key?: string;
  name?: string;
  counts?: number[];
  total?: number;
}

export interface AlertTrend {
  /** yyyy-mm-dd，升序、连续 */
  days?: string[];
  series?: AlertTrendSeries[];
  totals?: number[];
}

export interface AlertTopItem {
  key?: string;
  name?: string;
  count?: number;
  firing?: number;
  maxSeverity?: MonitorSeverity;
  groupName?: string;
  /** 规则 / 资源当前是否仍存在（可跳转） */
  exists?: boolean;
}

export interface AlertEfficiencyItem {
  /** 规则分组 ID 或级别数字；汇总行为 total */
  key?: string;
  name?: string;
  alerts?: number;
  acked?: number;
  resolved?: number;
  /** 平均认领耗时秒（int64 字符串）；没有可算的事件时为 0 */
  mttaS?: string;
  /** 平均恢复耗时秒（int64 字符串） */
  mttrS?: string;
}

export interface AlertNoise {
  alerts?: number;
  muted?: number;
  inhibited?: number;
  notified?: number;
  silent?: number;
  notifications?: number;
  ruleNotifications?: number;
  subscriptionNotifications?: number;
  escalationNotifications?: number;
}

// ---------- 引擎状态 ----------

export interface EngineInstance {
  instance: string;
  /** planner 任务物化与探活 / evaluator 规则评估 */
  roles?: string[];
  version?: string;
  leader?: boolean;
  /** 最近 60 秒内有心跳 */
  alive?: boolean;
  startTime?: string;
  lastSeen?: string;
  taskCount?: number;
  /** int64 字符串 */
  evalLagMs?: string;
  evalCount?: string;
  failCount?: string;
}

export interface EngineDatasourceIssue {
  id: string;
  name?: string;
  error?: string;
  since?: string;
  ruleCount?: number;
}

export interface EngineRuleIssue {
  ruleId: string;
  ruleName?: string;
  groupName?: string;
  datasourceId?: string;
  datasourceName?: string;
  error?: string;
  since?: string;
  failures?: number;
}

export interface EngineStatus {
  instances?: EngineInstance[];
  healthy?: boolean;
  taskTotal?: number;
  taskOverdue?: number;
  taskError?: number;
  /** int64 字符串 */
  maxLagMs?: string;
  recordTaskTotal?: number;
  recordTaskError?: number;
  datasources?: EngineDatasourceIssue[];
  rules?: EngineRuleIssue[];
  notifyPending?: number;
  ciSyncTime?: string;
  ciCount?: number;
}
