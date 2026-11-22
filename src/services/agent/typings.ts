/**
 * 运维 Agent 域类型（镜像 backend/core/api/agent/v1 的 protojson 形态：int64 为字符串、零值字段省略）。
 */

/** 引用对象：ID + 显示名；missing = 对象已不存在 */
export interface AgentNamedRef {
  id: string;
  name?: string;
  missing?: boolean;
}

/** 阶段键 */
export type StageKey = 'collect' | 'hypothesize' | 'verify' | 'conclude';
/** Profile 类型：故障诊断（四阶段）/ 经验沉淀（收集 → 结论，产出知识草稿） */
export type ProfileKind = 'diagnose' | 'postmortem';
export const STAGE_KEYS_BY_KIND: Record<ProfileKind, readonly StageKey[]> = {
  diagnose: ['collect', 'hypothesize', 'verify', 'conclude'],
  postmortem: ['collect', 'conclude'],
};
export const STAGE_KEYS: readonly StageKey[] = [
  'collect',
  'hypothesize',
  'verify',
  'conclude',
];

/** 任务状态 */
export type TaskStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'no_finding'
  | 'failed'
  | 'cancelled'
  | 'skipped'
  | 'expired';
/** 运行状态 */
export type RunStatus =
  | 'running'
  | 'succeeded'
  | 'no_finding'
  | 'failed'
  | 'cancelled';
/** 阶段状态 */
export type StageStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';
/** 来源 1=故障开启/升级 2=人工召唤 3=复盘完成 4=巡检计划 5=干跑 */
export type TaskSource = 1 | 2 | 3 | 4 | 5;
/** 评价 0=未评 1=有用 2=无用 */
export type Feedback = 0 | 1 | 2;

export interface StageSpec {
  key: StageKey;
  maxSteps: number;
  tools?: string[];
}

export interface BudgetSpec {
  maxSteps: number;
  timeoutS: number;
  /** int64 → 字符串 */
  promptTokens: string | number;
  completionTokens: string | number;
}

export interface AutoSpec {
  enabled?: boolean;
  minConfidence?: number;
  requireMetricEvidence?: boolean;
  maxTargets?: number;
  envs?: string[];
}

export interface ProfileSpec {
  name: string;
  description?: string;
  kind: ProfileKind;
  agentUserId: string;
  priority?: number;
  enabled?: boolean;
  severities?: number[];
  businessIds?: string[];
  hourlyLimit?: number;
  stages?: StageSpec[];
  budget?: BudgetSpec;
  auto?: AutoSpec;
  knowledgeSpaceId?: string;
}

export interface AgentProfile {
  id: string;
  spec: ProfileSpec;
  agentUser?: AgentNamedRef;
  breakerOpen?: boolean;
  breakerReason?: string;
  version: number;
  createTime?: string;
  updateTime?: string;
  updateUser?: AgentNamedRef;
}

export interface ProfileHistory {
  id: string;
  version: number;
  actor?: AgentNamedRef;
  before?: ProfileSpec;
  after?: ProfileSpec;
  note?: string;
  createTime?: string;
}

export interface ToolOption {
  name: string;
  title?: string;
  module?: string;
  write?: boolean;
  stages?: StageKey[];
}

export interface AgentTask {
  id: string;
  profile?: AgentNamedRef;
  kind?: string;
  source?: TaskSource;
  dryRun?: boolean;
  incident?: AgentNamedRef;
  incidentTitle?: string;
  severity?: number;
  status: TaskStatus;
  attempts?: number;
  reason?: string;
  runId?: string;
  requester?: AgentNamedRef;
  input?: string;
  queuedTime?: string;
  startTime?: string;
  endTime?: string;
  nextTime?: string;
  updateTime?: string;
}

export interface RunStage {
  key: StageKey;
  status: StageStatus;
  steps?: number;
  promptTokens?: string;
  completionTokens?: string;
  durationMs?: string;
  summary?: string;
  endReason?: string;
  lastMessageId?: string;
}

export interface RunFinding {
  title?: string;
  conclusion?: string;
  confidence?: number;
  evidence?: string[];
  nextStep?: string;
}

export interface DeniedCall {
  tool: string;
  reason?: string;
  message?: string;
}

export interface CapturedCall {
  tool: string;
  input?: string;
}

export interface TranscriptToolCall {
  id?: string;
  tool: string;
  title?: string;
  write?: boolean;
  status?: string;
  input?: string;
  output?: string;
  error?: string;
  durationMs?: string;
}

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content?: string;
  reasoning?: string;
  toolCalls?: TranscriptToolCall[];
  createTime?: string;
}

export interface AgentRun {
  id: string;
  taskId?: string;
  profile?: AgentNamedRef;
  incident?: AgentNamedRef;
  agentUser?: AgentNamedRef;
  conversationId?: string;
  status: RunStatus;
  dryRun?: boolean;
  stages?: RunStage[];
  promptTokens?: string;
  completionTokens?: string;
  tokensEstimated?: boolean;
  finding?: RunFinding;
  findingEventId?: string;
  proposals?: AgentNamedRef[];
  denied?: DeniedCall[];
  captured?: CapturedCall[];
  endReason?: string;
  feedback?: Feedback;
  feedbackUser?: AgentNamedRef;
  feedbackNote?: string;
  feedbackTime?: string;
  startTime?: string;
  endTime?: string;
  canRate?: boolean;
}

export interface ListProfilesParams {
  keyword?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListTasksParams {
  profileId?: string;
  incidentId?: string;
  status?: TaskStatus;
  source?: TaskSource;
  page?: number;
  pageSize?: number;
}

export interface StatusCount {
  status: TaskStatus;
  count?: number;
}

export interface ProfileStat {
  profile?: AgentNamedRef;
  tasks?: number;
  succeeded?: number;
  noFinding?: number;
  failed?: number;
  helpful?: number;
  unhelpful?: number;
  promptTokens?: string;
  completionTokens?: string;
  avgDurationS?: number;
}

export interface AgentOverview {
  tasksByStatus?: StatusCount[];
  runs?: number;
  succeeded?: number;
  noFinding?: number;
  failed?: number;
  avgDurationS?: number;
  p95DurationS?: number;
  promptTokens?: string;
  completionTokens?: string;
  proposals?: number;
  autoEligible?: number;
  helpful?: number;
  unhelpful?: number;
  byProfile?: ProfileStat[];
  todayTasks?: number;
  todayPromptTokens?: string;
  dailyPromptBudget?: string;
}
