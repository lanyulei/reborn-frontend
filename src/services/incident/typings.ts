/**
 * 故障管理域类型（镜像 backend/core/api/incident/v1 的 protojson 形态：int64 为字符串、零值字段省略）。
 */

/** 引用对象：ID + 显示名；missing = 对象已不存在 */
export interface NamedRef {
  id: string;
  name?: string;
  missing?: boolean;
}

/** 等级 1=S1 致命 2=S2 严重 3=S3 一般 4=S4 轻微（数字越小越严重） */
export type IncidentSeverity = 1 | 2 | 3 | 4;
/** 状态 1=待响应 2=处理中 3=已缓解 4=已解决 5=已关闭 6=已合并 */
export type IncidentStatus = 1 | 2 | 3 | 4 | 5 | 6;
/** 复盘状态 0=无需 1=待复盘 2=进行中 3=已完成 */
export type ReviewStatus = 0 | 1 | 2 | 3;
/** 来源 1=手工 2=规则 3=开放接口 4=Agent */
export type IncidentSource = 1 | 2 | 3 | 4;
/** 操作者类型 1=用户 2=系统 3=Agent */
export type ActorType = 1 | 2 | 3;
/** 成员角色 2=处理人 3=关注人 */
export type MemberRole = 2 | 3;
/** 状态流转动作 */
export type TransitionAction =
  | 'respond'
  | 'mitigate'
  | 'resolve'
  | 'close'
  | 'reopen';

export interface Incident {
  id: string;
  number: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reviewStatus?: ReviewStatus;
  source?: IncidentSource;
  sourceRef?: NamedRef;
  business?: NamedRef;
  summary?: string;
  aiSummary?: string;
  rootCauseCode?: string;
  rootCause?: string;
  resolveNote?: string;
  commander?: NamedRef;
  responders?: NamedRef[];
  watchers?: NamedRef[];
  affectedCis?: NamedRef[];
  groups?: string[];
  isDrill?: boolean;
  occurTime?: string;
  openTime?: string;
  respondTime?: string;
  mitigateTime?: string;
  resolveTime?: string;
  firstResolveTime?: string;
  closeTime?: string;
  reopenCount?: number;
  mergedInto?: NamedRef;
  escalationLevel?: number;
  alertCount?: number;
  activeAlertCount?: number;
  updateCount?: number;
  proposalPending?: number;
  autoApprove?: boolean;
  agentOwner?: NamedRef;
  agentLeaseUntil?: string;
  reviewDue?: string;
  lastActivityTime?: string;
  canManage?: boolean;
  canHandle?: boolean;
  version?: number;
  createTime?: string;
  updateTime?: string;
  rule?: NamedRef;
}

export interface ListIncidentsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  statuses?: IncidentStatus[];
  /** 只看活跃（待响应 / 处理中 / 已缓解） */
  active?: boolean;
  severities?: IncidentSeverity[];
  businessId?: string;
  commanderId?: string;
  /** 只看我参与的 */
  mine?: boolean;
  isDrill?: boolean;
  reviewStatus?: ReviewStatus;
  reviewOverdue?: boolean;
  openTimeStart?: string;
  openTimeEnd?: string;
  ciId?: string;
}

export interface CreateIncidentParams {
  title: string;
  severity: IncidentSeverity;
  businessId?: string;
  summary?: string;
  alertIds?: string[];
  affectedCiIds?: string[];
  commanderId?: string;
  responderIds?: string[];
  groups?: string[];
  occurTime?: string;
  isDrill?: boolean;
}

export interface UpdateIncidentParams {
  title: string;
  businessId?: string;
  summary?: string;
  affectedCiIds?: string[];
  groups?: string[];
  occurTime?: string;
  isDrill?: boolean;
  version: number;
}

export interface TransitionParams {
  action: TransitionAction;
  note?: string;
  rootCauseCode?: string;
  /** 关闭：复盘未完成也强制关闭（须填原因） */
  force?: boolean;
}

/** 时间线类型字面量（后端 biz/incident 的 Event* 常量） */
export type TimelineType =
  | 'opened'
  | 'severity'
  | 'status'
  | 'commander'
  | 'member_add'
  | 'member_remove'
  | 'comment'
  | 'alert_attach'
  | 'alert_detach'
  | 'alert_resolved'
  | 'change'
  | 'update'
  | 'proposal'
  | 'proposal_decision'
  | 'proposal_result'
  | 'proposal_verify'
  | 'ticket'
  | 'ai_summary'
  | 'agent_finding'
  | 'merged'
  | 'merged_from'
  | 'reopen'
  | 'escalate'
  | 'stale'
  | 'review'
  | 'action_item'
  | 'agent_lease'
  | 'auto_approve'
  | 'notify'
  | 'storm'
  | 'edit';

export interface Finding {
  title?: string;
  conclusion?: string;
  /** 置信度 0-100 */
  confidence?: number;
  evidence?: string[];
  nextStep?: string;
  /** 产出该发现的运维 Agent 运行 ID */
  runId?: string;
}

export interface EventDetail {
  text?: string;
  from?: number;
  to?: number;
  user?: NamedRef;
  alertIds?: string[];
  alertCount?: number;
  incident?: NamedRef;
  proposal?: NamedRef;
  ticket?: NamedRef;
  update?: NamedRef;
  level?: number;
  version?: number;
  change?: ChangeRef;
  finding?: Finding;
  fileIds?: string[];
  execKind?: string;
  execRef?: string;
  error?: string;
}

export interface TimelineItem {
  id: string;
  type: TimelineType | string;
  actorType?: ActorType;
  actor?: NamedRef;
  detail?: EventDetail;
  pinned?: boolean;
  createTime?: string;
}

export interface ListTimelineParams {
  page?: number;
  pageSize?: number;
  types?: string[];
  pinnedOnly?: boolean;
}

/** 关联方式 1=规则 2=手工 3=合并 */
export type AttachMethod = 1 | 2 | 3;

export interface IncidentAlert {
  alertId: string;
  ruleName?: string;
  severity?: number;
  /** 告警状态 1=告警中 2=已恢复 3=已关闭 */
  status?: number;
  labels?: Record<string, string>;
  ci?: NamedRef;
  firstFireTime?: string;
  resolveTime?: string;
  method?: AttachMethod;
  attachTime?: string;
  attachUser?: NamedRef;
  /** 当前用户能否打开这条告警 */
  canView?: boolean;
  value?: string;
}

export interface AttachAlertsResult {
  incident: Incident;
  attached?: number;
  /** 已关联到别的活跃故障且未选择移动而跳过的条数 */
  skipped?: number;
}

export interface ImpactNode {
  id: string;
  name?: string;
  modelCode?: string;
  modelName?: string;
  /** 0 = 直接受影响；1+ = 下游层级 */
  depth?: number;
  canView?: boolean;
  /** 经由哪个上游到达 */
  via?: string;
}

export interface ImpactResult {
  nodes?: ImpactNode[];
  truncated?: boolean;
  modelCounts?: Record<string, number>;
}

/** 变更与故障的关系 0=未标记 1=疑似原因 2=已排除 3=修复操作 */
export type ChangeRelation = 0 | 1 | 2 | 3;

export interface ChangeRef {
  domain: string;
  kind?: string;
  refId?: string;
  summary?: string;
  refTime?: string;
  relation?: ChangeRelation;
  operator?: NamedRef;
  ci?: NamedRef;
  url?: string;
  markedBy?: NamedRef;
}

export interface MarkChangeParams {
  domain: string;
  kind?: string;
  refId?: string;
  summary?: string;
  refTime?: string;
  relation: ChangeRelation;
}

export interface IncidentUpdateBrief {
  id: string;
  kind?: UpdateKind;
  content?: string;
  author?: NamedRef;
  createTime?: string;
}

export interface PlaybookBrief {
  id: string;
  name?: string;
  description?: string;
  stepCount?: number;
}

export interface SimilarIncident {
  id: string;
  number?: string;
  title?: string;
  severity?: IncidentSeverity;
  rootCauseCode?: string;
  rootCause?: string;
  openTime?: string;
  score?: number;
}

export interface IncidentContext {
  incident: Incident;
  alerts?: IncidentAlert[];
  impact?: ImpactNode[];
  changes?: ChangeRef[];
  timeline?: TimelineItem[];
  updates?: IncidentUpdateBrief[];
  playbooks?: PlaybookBrief[];
  similar?: SimilarIncident[];
  pendingProposals?: number;
  notes?: string[];
}

/** 候选状态 1=待定 2=已升级 3=已忽略 4=已过期 */
export type CandidateStatus = 1 | 2 | 3 | 4;

export interface Candidate {
  id: string;
  rule?: NamedRef;
  correlationKey?: string;
  alertCount?: number;
  ciCount?: number;
  alerts?: IncidentAlert[];
  status?: CandidateStatus;
  incident?: NamedRef;
  firstTime?: string;
  updateTime?: string;
}

export interface RootCause {
  code: string;
  name: string;
}

export interface IncidentOptions {
  schedules?: NamedRef[];
  businesses?: NamedRef[];
  rootCauses?: RootCause[];
  ticketTemplates?: NamedRef[];
  playbooks?: PlaybookBrief[];
}

// ---------- 配置：规则 / 业务 / 预案 / 接入源 / Webhook / 设置 ----------

export type MatcherOp = '==' | '!=' | '=~' | '!~' | 'in' | 'not in';

export interface LabelMatcher {
  label: string;
  op: MatcherOp;
  value?: string;
  values?: string[];
}

export interface RuleMatch {
  minSeverity?: number;
  groupIds?: string[];
  ruleIds?: string[];
  matchers?: LabelMatcher[];
  modelCodes?: string[];
}

export interface RuleCorrelation {
  /** 归并键：business / group / rule / ci / label:<名> */
  keys?: string[];
  windowM?: number;
  minAlerts?: number;
  minCis?: number;
}

export interface RuleIncident {
  severity?: IncidentSeverity | 0;
  titleTemplate?: string;
  businessId?: string;
  businessLabel?: string;
  isDrill?: boolean;
}

export interface RuleResponseSpec {
  commanderScheduleId?: string;
  commanderUserId?: string;
  responderBackup?: boolean;
  responderOncallGroupId?: string;
  responderCiOwner?: boolean;
  responderUserIds?: string[];
  groups?: string[];
}

/** 预案模式 0=不用 1=推荐 2=自动提出建议 */
export type PlaybookMode = 0 | 1 | 2;
/** 自动恢复 0=按设置 1=开 2=关 */
export type AutoResolveMode = 0 | 1 | 2;

export interface RuleAction {
  playbookId?: string;
  playbookMode?: PlaybookMode;
  autoResolve?: AutoResolveMode;
  aiSummary?: boolean;
  /** 开故障与等级上调时入队一次运维 Agent 诊断任务 */
  agent?: boolean;
}

export interface RuleSpec {
  name: string;
  description?: string;
  sort?: number;
  enabled?: boolean;
  match?: RuleMatch;
  correlation?: RuleCorrelation;
  incident?: RuleIncident;
  response?: RuleResponseSpec;
  action?: RuleAction;
}

export interface IncidentRule {
  id: string;
  spec: RuleSpec;
  groupRefs?: NamedRef[];
  ruleRefs?: NamedRef[];
  business?: NamedRef;
  playbook?: NamedRef;
  commanderSchedule?: NamedRef;
  commanderUser?: NamedRef;
  incidentCount?: number;
  version?: number;
  createTime?: string;
  updateTime?: string;
  updateUser?: NamedRef;
}

export interface TestRuleGroup {
  correlationKey?: string;
  alertCount?: number;
  ciCount?: number;
  wouldOpen?: boolean;
  title?: string;
  severity?: IncidentSeverity;
  alerts?: IncidentAlert[];
}

export interface TestRuleResult {
  scanned?: number;
  matched?: number;
  groups?: TestRuleGroup[];
}

export interface Business {
  id: string;
  code: string;
  name: string;
  description?: string;
  owner?: NamedRef;
  schedule?: NamedRef;
  groups?: string[];
  ci?: NamedRef;
  labelValues?: string[];
  sort?: number;
  enabled?: boolean;
  version?: number;
  createTime?: string;
  updateTime?: string;
}

export interface BusinessSpec {
  code: string;
  name: string;
  description?: string;
  ownerId?: string;
  scheduleId?: string;
  groups?: string[];
  ciId?: string;
  labelValues?: string[];
  sort?: number;
  enabled?: boolean;
}

/** 步骤审批 0=按风险 1=须指挥审批 2=可自动 */
export type StepApproval = 0 | 1 | 2;
/** 风险 1=低 2=中 3=高 */
export type RiskLevel = 1 | 2 | 3;
/** 执行目标 0=受影响资源 1=告警资源 2=模板自带 */
export type TargetMode = 0 | 1 | 2;

export interface PlaybookStep {
  name: string;
  /** job=作业模板 workflow=流程定义 */
  kind: 'job' | 'workflow';
  ref: string;
  params?: Record<string, string>;
  approval?: StepApproval;
  risk?: RiskLevel;
  targetMode?: TargetMode;
}

export interface PlaybookMatch {
  matchers?: LabelMatcher[];
  modelCodes?: string[];
  businessIds?: string[];
}

export interface PlaybookSpec {
  name: string;
  description?: string;
  doc?: string;
  steps?: PlaybookStep[];
  match?: PlaybookMatch;
  agentUserId?: string;
  enabled?: boolean;
}

export interface Playbook {
  id: string;
  spec: PlaybookSpec;
  stepRefs?: NamedRef[];
  agentUser?: NamedRef;
  businessRefs?: NamedRef[];
  execCount?: number;
  version?: number;
  createTime?: string;
  updateTime?: string;
  updateUser?: NamedRef;
}

export interface PlaybookTarget {
  kind: 'job' | 'workflow';
  ref: string;
  name?: string;
  description?: string;
  paramNames?: string[];
}

export interface IncidentSourceClient {
  id: string;
  name: string;
  description?: string;
  tokenPrefix?: string;
  defaultSeverity?: IncidentSeverity;
  business?: NamedRef;
  groups?: string[];
  allowedIps?: string[];
  enabled?: boolean;
  lastUsedTime?: string;
  version?: number;
  createTime?: string;
  updateTime?: string;
}

export interface SourceSpec {
  name: string;
  description?: string;
  defaultSeverity?: IncidentSeverity;
  businessId?: string;
  groups?: string[];
  allowedIps?: string[];
  enabled?: boolean;
}

export interface IncidentWebhook {
  id: string;
  name: string;
  url: string;
  hasSecret?: boolean;
  events?: string[];
  enabled?: boolean;
  version?: number;
  createTime?: string;
  updateTime?: string;
  pending?: number;
  failed?: number;
}

export interface WebhookSpec {
  name: string;
  url: string;
  /** 留空 = 不改 */
  secret?: string;
  events?: string[];
  enabled?: boolean;
}

export interface SeveritySetting {
  respondM?: number;
  staleM?: number;
  firstUpdateM?: number;
  reviewDays?: number;
  allowAutoResolve?: boolean;
  allowAutoApprove?: boolean;
}

export interface IncidentSettings {
  severities?: Record<string, SeveritySetting>;
  rootCauses?: RootCause[];
  fallbackScheduleId?: string;
  stormThreshold?: number;
  candidateTtlM?: number;
  reopenWindowH?: number;
  autoCloseDays?: number;
  personalEvents?: string[];
  proposalTtlM?: number;
  verifyWindowM?: number;
  changeLookbackH?: number;
  agentMaxFindings?: number;
  agentAutoCooldownM?: number;
  agentAutoMaxRunning?: number;
  agentAutoMaxRunningPerBusiness?: number;
  version?: number;
}

export interface SettingsResult {
  settings: IncidentSettings;
  fallbackSchedule?: NamedRef;
}

// ---------- 处置建议 ----------

/** 建议状态 1=待审批 2=已通过 3=已拒绝 4=执行中 5=成功 6=失败 7=已取消 8=已过期 */
export type ProposalStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface ProposalAction {
  kind?: 'job' | 'workflow';
  ref?: string;
  refName?: string;
  params?: Record<string, string>;
  ciIds?: string[];
  ciRefs?: NamedRef[];
}

export interface VerifyResult {
  alertsBefore?: number;
  alertsAfter?: number;
  resolved?: number;
  newAlerts?: number;
  worse?: boolean;
  checkedTime?: string;
}

export interface Proposal {
  id: string;
  incidentId: string;
  title?: string;
  reason?: string;
  evidence?: string[];
  action?: ProposalAction;
  playbook?: NamedRef;
  stepIndex?: number;
  risk?: RiskLevel;
  status?: ProposalStatus;
  auto?: boolean;
  proposerType?: ActorType;
  proposer?: NamedRef;
  decidedBy?: NamedRef;
  decidedTime?: string;
  decisionNote?: string;
  expireTime?: string;
  execKind?: string;
  execRef?: string;
  execUser?: NamedRef;
  result?: string;
  verifyUntil?: string;
  verifyResult?: VerifyResult;
  createTime?: string;
  updateTime?: string;
  canDecide?: boolean;
  execUrl?: string;
  /** Agent 提出时申请自动通过 */
  autoEligible?: boolean;
}

export interface CreateProposalParams {
  playbookId?: string;
  stepIndex?: number;
  action?: ProposalAction;
  title?: string;
  reason?: string;
  evidence?: string[];
  /** 提出即通过（指挥） */
  approve?: boolean;
}

// ---------- 公告 / 分享 ----------

/** 公告类型 1=进展 2=缓解 3=解决 */
export type UpdateKind = 1 | 2 | 3;

export interface IncidentUpdate {
  id: string;
  kind?: UpdateKind;
  content?: string;
  author?: NamedRef;
  createTime?: string;
}

export interface ShareLink {
  id: string;
  name?: string;
  expireTime?: string;
  accessCount?: number;
  lastAccessTime?: string;
  creator?: NamedRef;
  createTime?: string;
}

export interface PublicIncident {
  number?: string;
  title?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  businessName?: string;
  occurTime?: string;
  resolveTime?: string;
  updates?: IncidentUpdate[];
  isDrill?: boolean;
}

// ---------- 复盘 ----------

export interface PostmortemDoc {
  summary?: string;
  impact?: string;
  timeline?: string;
  rootCauseCode?: string;
  rootCause?: string;
  trigger?: string;
  detection?: string;
  handling?: string;
  wentWell?: string;
  wentWrong?: string;
}

/** 改进项类型 1=修复 2=预防 3=监控 4=流程 */
export type ActionItemKind = 1 | 2 | 3 | 4;
/** 改进项状态 1=待办 2=进行中 3=已完成 4=已取消 */
export type ActionItemStatus = 1 | 2 | 3 | 4;

export interface ActionItem {
  id: string;
  incidentId: string;
  incidentNumber?: string;
  title: string;
  kind?: ActionItemKind;
  owner?: NamedRef;
  /** YYYY-MM-DD */
  dueDate?: string;
  status?: ActionItemStatus;
  ticket?: NamedRef;
  ticketNumber?: string;
  createTime?: string;
  updateTime?: string;
  overdue?: boolean;
}

export interface Postmortem {
  incidentId: string;
  status?: ReviewStatus;
  doc?: PostmortemDoc;
  currentVersion?: number;
  reviewDue?: string;
  overdue?: boolean;
  updateUser?: NamedRef;
  updateTime?: string;
  actionItems?: ActionItem[];
  canEdit?: boolean;
}

export interface PostmortemVersion {
  id: string;
  version?: number;
  doc?: PostmortemDoc;
  note?: string;
  creator?: NamedRef;
  createTime?: string;
}

export interface SaveActionItemParams {
  itemId?: string;
  title: string;
  kind?: ActionItemKind;
  ownerId?: string;
  dueDate?: string;
  status?: ActionItemStatus;
}

// ---------- 统计 ----------

export interface SeverityCount {
  severity: IncidentSeverity;
  count?: number;
}

export interface IncidentOverview {
  active?: number;
  activeBySeverity?: SeverityCount[];
  unresponded?: number;
  reviewPending?: number;
  reviewOverdue?: number;
  proposalPending?: number;
  todayOpened?: number;
  todayResolved?: number;
  candidates?: number;
}

export interface TrendPoint {
  bucket: string;
  total?: number;
  bySeverity?: SeverityCount[];
  durationS?: string;
}

export interface EfficiencyRow {
  severity: IncidentSeverity;
  count?: number;
  mttdS?: string;
  mttaS?: string;
  mttmS?: string;
  mttrS?: string;
}

export interface IncidentEfficiency {
  rows?: EfficiencyRow[];
  reopenRate?: number;
  reviewOverdueRate?: number;
  actionItemDoneRate?: number;
  actionItemTotal?: number;
  actionItemDone?: number;
}

export interface NamedCount {
  key: string;
  name?: string;
  count?: number;
  durationS?: string;
}

export interface IncidentDistribution {
  rootCauses?: NamedCount[];
  sources?: NamedCount[];
  businesses?: NamedCount[];
  rules?: NamedCount[];
  candidateTotal?: number;
  candidatePromoted?: number;
  alertLinked?: number;
}

export interface StatsRangeParams {
  startTime?: string;
  endTime?: string;
  businessId?: string;
  /** day / week */
  bucket?: string;
}
