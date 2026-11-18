/**
 * 作业中心域类型：与后端 api/job/v1 的 proto（protojson：camelCase、时间为 RFC3339
 * 字符串、int64 为字符串、零值字段省略）一一对应。
 */

/** 凭据类型：1=SSH 私钥 2=SSH 密码 */
export type JobCredentialType = 1 | 2;
/** 提权方式：空=不提权 */
export type JobBecomeMethod = '' | 'sudo' | 'su';
/** 项目认证方式：1=无 2=用户名 + 令牌 3=SSH 私钥 */
export type JobProjectAuthType = 1 | 2 | 3;
/** 目标主机选择方式：1=指定资源 2=按条件筛选 */
export type JobTargetMode = 1 | 2;
/** 执行参数数据类型 */
export type JobParamType = 'string' | 'text' | 'int' | 'float' | 'bool' | 'enum';
/** 执行状态：1=排队中 2=执行中 3=成功 4=失败 5=部分失败 6=已取消 7=超时 8=结果未知 9=待审批 10=审批未通过 */
export type JobExecutionStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
/** 作业类型：1=作业模板 2=执行命令 3=执行脚本 4=分发文件 */
export type JobKind = 1 | 2 | 3 | 4;
/** 快速执行的作业类型 */
export type JobAdhocKind = 2 | 3 | 4;
/** 触发来源：1=手动 2=定时作业 3=开放接口 4=告警 */
export type JobTriggerSource = 1 | 2 | 3 | 4;
/** 脚本解释器 */
export type JobInterpreter = 'bash' | 'sh' | 'python3';
/** 高危命令规则动作：1=拦截 2=须审批 3=仅提醒 */
export type JobRiskAction = 1 | 2 | 3;
/** 定时作业错过触发后的处理：1=跳过 2=补跑一次 */
export type JobMisfire = 1 | 2;
/** 触发器类型：1=开放接口 2=告警 */
export type JobTriggerType = 1 | 2;
/** 触发结果：1=已提交执行 2=已跳过 3=失败 */
export type JobFireResult = 1 | 2 | 3;
/** 流程信号状态：0=无需发送 1=待发送 2=已发送 3=已放弃 */
export type JobSignalState = 0 | 1 | 2 | 3;
/** 主机结果：0=未执行 1=成功 2=成功且有变更 3=失败 4=不可达 5=已跳过 */
export type JobHostStatus = 0 | 1 | 2 | 3 | 4 | 5;
/** 主机不能执行的原因 */
export type JobHostProblem =
  | 'address_empty'
  | 'address_invalid'
  | 'address_duplicate';

// ---------- 凭据 ----------

export interface JobCredentialSpec {
  name: string;
  type: JobCredentialType;
  username: string;
  /** 私钥或密码，只写不读；编辑时不传 = 保留原值 */
  secret?: string;
  becomeMethod?: JobBecomeMethod;
  becomeUser?: string;
  /** 提权密码，只写不读；编辑时不传 = 保留原值，传空串 = 清除 */
  becomeSecret?: string;
  description?: string;
}

export interface JobCredential {
  id: string;
  spec: JobCredentialSpec;
  hasBecomeSecret?: boolean;
  /** 私钥的公钥指纹（SHA256:...）；密码类型为空 */
  fingerprint?: string;
  /** 使用本凭据的作业模板数；大于 0 时不可删除 */
  templateCount?: number;
  version: number;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
}

export interface JobCredentialOption {
  id: string;
  name: string;
  type?: JobCredentialType;
  username?: string;
  becomeMethod?: JobBecomeMethod;
}

// ---------- 项目 ----------

export interface JobProjectSpec {
  name: string;
  repoUrl: string;
  ref: string;
  authType: JobProjectAuthType;
  username?: string;
  /** 访问令牌或 SSH 私钥，只写不读；编辑时不传 = 保留原值 */
  secret?: string;
  description?: string;
}

export interface JobProject {
  id: string;
  spec: JobProjectSpec;
  hasSecret?: boolean;
  /** 使用本项目的作业模板数；大于 0 时不可删除 */
  templateCount?: number;
  version: number;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
}

export interface JobProjectOption {
  id: string;
  name: string;
  ref?: string;
}

// ---------- 执行节点 ----------

export interface JobRunnerSpec {
  name: string;
  zone?: string;
  enabled?: boolean;
  description?: string;
}

export interface JobRunner {
  id: string;
  spec: JobRunnerSpec;
  /** 最近 45 秒内有心跳 */
  online?: boolean;
  /** 最近一次心跳时间；从未接入时为空 */
  lastSeen?: string;
  agentVersion?: string;
  hostname?: string;
  capacity?: number;
  running?: number;
  version: number;
  createTime?: string;
  updateTime?: string;
}

// ---------- 作业模板 ----------

export interface JobTarget {
  modelCode: string;
  mode: JobTargetMode;
  /** mode=1 时 1-500 个 */
  ciIds?: string[];
  env?: string;
  tag?: string;
  keyword?: string;
  /** 存放连接地址的资源属性码；空 = 用资源名称 */
  addressField?: string;
}

export interface JobParam {
  code: string;
  name: string;
  type: JobParamType;
  required?: boolean;
  /** 缺省值的文本形式（bool 为 true / false） */
  default?: string;
  /** type=enum 时 1-50 个 */
  options?: string[];
  description?: string;
}

/** 执行选项；数值为 0（省略）表示取缺省值 */
export interface JobOptions {
  forks?: number;
  timeoutS?: number;
  port?: number;
  become?: boolean;
  check?: boolean;
  diff?: boolean;
  verbosity?: number;
  /** 滚动执行的每批主机数；0 = 不分批 */
  batchSize?: number;
  /** 滚动执行的失败阈值 0-100；仅分批时生效 */
  maxFailPercent?: number;
}

export interface JobTemplateSpec {
  name: string;
  description?: string;
  projectId: string;
  playbook: string;
  credentialId: string;
  target: JobTarget;
  params?: JobParam[];
  options?: JobOptions;
  runnerZone?: string;
  exclusive?: boolean;
  enabled?: boolean;
  /** 每次执行都须审批（预检模式除外） */
  requireApproval?: boolean;
  /** 作业切片的每片主机数；0 = 不切片 */
  sliceSize?: number;
}

export interface JobTemplate {
  id: string;
  spec: JobTemplateSpec;
  /** 项目已被删除时为空 */
  projectName?: string;
  projectRef?: string;
  /** 凭据已被删除时为空 */
  credentialName?: string;
  /** 资源类型已不存在或不在当前用户数据范围内时为空 */
  modelName?: string;
  version: number;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
}

export interface JobTargetHost {
  ciId: string;
  name?: string;
  env?: string;
  address?: string;
  /** 空 = 可以执行 */
  problem?: JobHostProblem | '';
}

export interface JobTargetPreview {
  /** 至多 500 台 */
  hosts?: JobTargetHost[];
  /** 匹配的主机超过 500 台（这样的目标不能提交执行） */
  truncated?: boolean;
}

export interface JobTemplateHosts extends JobTargetPreview {
  /** 模板指定、但不在当前用户数据范围内（或已不存在）的主机数 */
  outOfScope?: number;
  /** 实际执行（非预检）时需要审批的原因；空 = 无需审批 */
  approvalReasons?: string[];
  /** 审批流程当前是否可发起 */
  approvalReady?: boolean;
  /** 本次提交的主机数上限 */
  maxHosts?: number;
}

// ---------- 执行 ----------

export interface JobExecutionDetail {
  projectName?: string;
  repoUrl?: string;
  ref?: string;
  playbook?: string;
  credentialName?: string;
  /** 参数取值（变量名 → 值） */
  params?: Record<string, unknown>;
  options?: JobOptions;
  runnerZone?: string;
  logTruncated?: boolean;
  /** 快速执行的内容（kind 为 2-4 时） */
  adhoc?: JobAdhoc;
  /** 快速执行提交时的目标主机配置 */
  target?: JobTarget;
  credentialId?: string;
}

export interface JobExecution {
  id: string;
  templateId?: string;
  templateName?: string;
  templateVersion?: number;
  trigger?: JobTriggerSource;
  creatorId?: string;
  creatorName?: string;
  status: JobExecutionStatus;
  error?: string;
  hostTotal?: number;
  /** 成功的主机数（含有变更的） */
  hostOk?: number;
  hostFailed?: number;
  hostUnreachable?: number;
  cancelRequested?: boolean;
  cancelUserId?: string;
  cancelUserName?: string;
  runnerId?: string;
  runnerName?: string;
  commitId?: string;
  createTime?: string;
  startTime?: string;
  finishTime?: string;
  /** 仅详情接口返回 */
  detail?: JobExecutionDetail;
  check?: boolean;
  /** 作业类型；templateName 对快速执行是其显示名 */
  kind?: JobKind;
  /** 触发来源的对象 ID（定时作业 / 触发器）；手动为空 */
  triggerRef?: string;
  triggerName?: string;
  /** 作业切片的分组 ID；未切片为空 */
  groupId?: string;
  sliceNo?: number;
  sliceTotal?: number;
  approvalReason?: string;
  /** 审批流程实例 ID */
  approvalInstanceId?: string;
  riskHits?: JobRiskHit[];
}

export interface JobExecutionHost {
  seq: number;
  ciId: string;
  name?: string;
  env?: string;
  address?: string;
  port?: number;
  status?: JobHostStatus;
  ok?: number;
  changed?: number;
  failed?: number;
  unreachable?: number;
  skipped?: number;
}

export interface JobExecutionLog {
  /** 本次返回的日志内容，一次至多约 1MB */
  content?: string;
  /** int64 字符串；没有新日志时等于请求的 afterSeq（为 0 时省略） */
  lastSeq?: string;
  /** 还有未返回的日志块：应立即再取 */
  more?: boolean;
  status?: JobExecutionStatus;
  truncated?: boolean;
}

// ---------- 快速执行 ----------

/** 快速执行的内容；按 kind 填写对应的字段 */
export interface JobAdhoc {
  command?: string;
  /** 脚本内容；与 scriptId 二选一 */
  script?: string;
  interpreter?: JobInterpreter | '';
  scriptArgs?: string;
  scriptId?: string;
  /** 只读 */
  scriptName?: string;
  /** 只读 */
  scriptVersion?: number;
  /** 先经文件上传接口得到的文件 ID；响应里恒为空 */
  fileId?: string;
  fileName?: string;
  dest?: string;
  /** 0 开头的三位八进制，缺省 0644 */
  mode?: string;
  /** 只读，int64 字符串 */
  fileSize?: string;
  /** 只读 */
  fileSha256?: string;
}

export interface JobRiskHit {
  /** 试匹配尚未保存的规则时为空 */
  ruleId?: string;
  name?: string;
  action?: JobRiskAction;
  description?: string;
  /** 命中的片段（至多 120 字符） */
  match?: string;
}

export interface JobAdhocCheck {
  hosts?: JobTargetHost[];
  truncated?: boolean;
  riskHits?: JobRiskHit[];
  /** 命中了「拦截」规则（不允许提交） */
  blocked?: boolean;
  approvalReasons?: string[];
  approvalReady?: boolean;
  maxHosts?: number;
}

// ---------- 执行统计 ----------

export interface JobStatCount {
  /** 状态 / 类型 / 来源的数值，或模板 ID */
  key: string;
  name?: string;
  /** int64 字符串 */
  count?: string;
  failed?: string;
}

export interface JobStatTrendPoint {
  /** yyyy-mm-dd */
  day: string;
  total?: string;
  success?: string;
  failed?: string;
}

/** 各计数为 int64 字符串；零值省略 */
export interface JobStats {
  total?: string;
  finished?: string;
  success?: string;
  avgDurationSeconds?: string;
  hostRuns?: string;
  byStatus?: JobStatCount[];
  byKind?: JobStatCount[];
  byTrigger?: JobStatCount[];
  topTemplates?: JobStatCount[];
  trend?: JobStatTrendPoint[];
  timezone?: string;
  active?: string;
  runnersOnline?: number;
  runnersTotal?: number;
}

// ---------- 脚本库 ----------

export interface JobScriptSpec {
  name: string;
  interpreter: JobInterpreter;
  /** 列表接口不返回 */
  content?: string;
  description?: string;
}

export interface JobScript {
  id: string;
  spec: JobScriptSpec;
  size?: number;
  version: number;
  createTime?: string;
  updateTime?: string;
  updateUserId?: string;
  updateUserName?: string;
}

// ---------- 安全策略 ----------

export interface JobRiskRuleSpec {
  name: string;
  /** RE2 正则 */
  pattern: string;
  action: JobRiskAction;
  enabled?: boolean;
  description?: string;
}

export interface JobRiskRule {
  id: string;
  spec: JobRiskRuleSpec;
  version: number;
  updateTime?: string;
  updateUserName?: string;
}

export interface JobPolicy {
  protectedEnvs?: string[];
  /** 审批所用的流程定义标识；空 = 未配置 */
  approvalWorkflowKey?: string;
  adhocApproval?: boolean;
  /** 0 = 取系统上限 500 */
  maxHosts?: number;
  version?: number;
  updateTime?: string;
  updateUserName?: string;
  /** 只读 */
  approvalWorkflowName?: string;
  /** 只读：审批流程当前是否可发起 */
  approvalWorkflowReady?: boolean;
}

// ---------- 定时作业 ----------

export interface JobScheduleSpec {
  name: string;
  templateId: string;
  /** 标准 5 段 Cron 表达式 */
  cron: string;
  /** IANA 时区 */
  timezone: string;
  params?: Record<string, unknown>;
  misfire: JobMisfire;
  enabled?: boolean;
  description?: string;
  /** 保存人确认过的模板版本；保存时传表单展示的模板版本，模板此后被改过则启用被拒 */
  templateVersion?: number;
}

export interface JobSchedule {
  id: string;
  spec: JobScheduleSpec;
  /** 模板已被删除时为空 */
  templateName?: string;
  ownerId?: string;
  ownerName?: string;
  /** 停用时为空 */
  nextTime?: string;
  lastTime?: string;
  lastExecutionId?: string;
  lastError?: string;
  version: number;
  createTime?: string;
  updateTime?: string;
}

// ---------- 触发器 ----------

export interface JobAlertMatch {
  ruleIds?: string[];
  severities?: number[];
  labels?: Record<string, string>;
  hostLabel?: string;
}

export interface JobTriggerSpec {
  name: string;
  type: JobTriggerType;
  templateId: string;
  params?: Record<string, unknown>;
  passParams?: boolean;
  signal?: string;
  alert?: JobAlertMatch;
  cooldownS?: number;
  enabled?: boolean;
  description?: string;
  /** 保存人确认过的模板版本；保存时传表单展示的模板版本，模板此后被改过则启用被拒 */
  templateVersion?: number;
}

export interface JobTrigger {
  id: string;
  spec: JobTriggerSpec;
  templateName?: string;
  ownerId?: string;
  ownerName?: string;
  lastFireTime?: string;
  version: number;
  createTime?: string;
  updateTime?: string;
  /** 与 spec.alert.ruleIds 一一对应；规则已不存在的为空串 */
  ruleNames?: string[];
}

export interface JobTriggerFire {
  id: string;
  triggerId?: string;
  triggerName?: string;
  result?: JobFireResult;
  reason?: string;
  executionId?: string;
  summary?: string;
  workflowInstanceId?: string;
  signalState?: JobSignalState;
  createTime?: string;
}
