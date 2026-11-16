/**
 * 流程引擎域类型定义（来源：backend/core/api/workflow/v1，出参 camelCase，int64 为 string）
 */

/** 流程定义状态：1=启用 0=停用 */
export type DefinitionStatus = 0 | 1;

/** 实例状态：1=进行中 2=已通过 3=已拒绝 4=已撤回 5=已终止 */
export type InstanceStatus = 1 | 2 | 3 | 4 | 5;

/** 任务状态：1=待处理 2=已同意 3=已拒绝 4=已取消 5=已退回 6=已抄送 */
export type TaskStatus = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 处理人状态：1=待处理 2=排队中 3=已同意 4=已拒绝 5=已取消 6=已转办 7=已退回 8=已抄送
 * 9=等待加签 / 委派的人处理
 */
export type AssigneeStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 席位来源：空=节点规则解析 before=前加签 after=后加签 delegate=委派 */
export type SeatOrigin = '' | 'before' | 'after' | 'delegate';

/** 流转动作 */
export type HistoryAction =
  | 'start'
  | 'approve'
  | 'reject'
  | 'return'
  | 'transfer'
  | 'reassign'
  | 'skip'
  | 'cc'
  | 'cancel'
  | 'terminate'
  | 'complete'
  | 'addSign'
  | 'delegate'
  | 'reply'
  | 'handover'
  | 'timeout'
  | 'timer'
  | 'service'
  | 'serviceFailed'
  | 'subProcess'
  | 'amend'
  | 'conditionError';

/** 流程定义（不含流程图） */
export interface WorkflowDefinition {
  id: string;
  key: string;
  name: string;
  category?: string;
  description?: string;
  status: DefinitionStatus;
  /** 草稿修订号（保存 / 发布时回传做乐观锁） */
  revision: number;
  /** 当前发布的版本号；0 = 从未发布 */
  publishedVersion?: number;
  createTime?: string;
  updateTime?: string;
}

/** 流程图的一条校验问题 */
export interface GraphIssue {
  nodeId?: string;
  edgeId?: string;
  /** 稳定的问题码，如 ASSIGNEE_MISSING */
  code: string;
  message: string;
}

/** 已发布版本 */
export interface DefinitionVersion {
  id: string;
  version: number;
  createUser?: string;
  createTime?: string;
}

/** 流程实例 */
export interface WorkflowInstance {
  id: string;
  definitionId: string;
  definitionKey: string;
  definitionName: string;
  version: number;
  businessType?: string;
  businessId?: string;
  title: string;
  initiator: string;
  initiatorName?: string;
  initiatorDept?: string;
  status: InstanceStatus;
  startTime?: string;
  endTime?: string;
  /** 当前待处理的节点名称 */
  currentNodes?: string[];
  /** 父流程实例 ID；由子流程节点发起时有值 */
  parentInstanceId?: string;
  /** 所在流程树的顶层实例 ID（顶层实例即自身） */
  rootId?: string;
  /** 顶层实例挂的业务对象：子流程自身不挂业务对象，沿用顶层的 */
  rootBusinessType?: string;
  rootBusinessId?: string;
}

export interface WorkflowTaskAssignee {
  userId: string;
  userName?: string;
  status: AssigneeStatus;
  comment?: string;
  actionTime?: string;
  origin?: SeatOrigin;
  /** 被代理人：本席位是代理人替他处理 */
  onBehalf?: string;
  onBehalfName?: string;
}

/** 任务（实例详情内） */
export interface WorkflowTask {
  id: string;
  nodeId: string;
  nodeName?: string;
  kind: 'approve' | 'cc';
  mode?: string;
  status: TaskStatus;
  createTime?: string;
  endTime?: string;
  /** 处理时限；节点未配置超时为空 */
  dueTime?: string;
  assignees?: WorkflowTaskAssignee[];
}

/** 实例正停在其上的一个等待节点（定时 / 自动任务） */
export interface InstanceWait {
  /** 作业 ID；等信号的定时节点没有作业，为空串 */
  jobId: string;
  nodeId: string;
  /**
   * timer=定时 service=自动任务 signal=等待外部信号；死信还可能是
   * timeout / remind / resume / stop（引擎内部作业遇到不可恢复的错误）
   */
  kind: 'timer' | 'service' | 'signal' | 'timeout' | 'remind' | 'resume' | 'stop';
  /** 1=等待中 4=死信（重试耗尽，待重试；定时 / 自动任务还可跳过） */
  status: 1 | 4;
  dueTime?: string;
  attempts: number;
  lastError?: string;
  /** 等待的信号名（kind = signal） */
  signal?: string;
}

/** 由子流程节点发起的子流程 */
export interface ChildInstance {
  id: string;
  nodeId: string;
  definitionName: string;
  status: InstanceStatus;
}

/** 一条流转历史 */
export interface WorkflowHistory {
  id: string;
  nodeId?: string;
  nodeName?: string;
  action: HistoryAction;
  operator?: string;
  operatorName?: string;
  comment?: string;
  detail?: Record<string, unknown>;
  createTime?: string;
}

/** 实例详情 */
export interface InstanceDetail {
  instance: WorkflowInstance;
  graph?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  tasks?: WorkflowTask[];
  histories?: WorkflowHistory[];
  /** 当前用户可处理的任务 ID；没有为空 */
  myTaskId?: string;
  canCancel?: boolean;
  canManage?: boolean;
  /** 当前用户能否改派待处理的任务（流程进行中且有改派权限） */
  canReassign?: boolean;
  /** 当前用户待处理席位的来源：delegate 时只需给出意见 */
  mySeatOrigin?: SeatOrigin;
  waits: InstanceWait[];
  children: ChildInstance[];
}

/** 模拟运行经过的一个节点 */
export interface SimulatedStep {
  nodeId: string;
  nodeName?: string;
  type: string;
  mode?: string;
  assignees: { id: string; name?: string }[];
  /** 处理人为空，节点被跳过 */
  skipped?: boolean;
}

/** 工作日历 */
export interface WorkCalendar {
  timezone: string;
  /** 每周的工作日：0=周日 … 6=周六 */
  weekdays: number[];
  segments: { start: string; end: string }[];
  holidays: string[];
  workdays: string[];
}

/** 代理设置 */
export interface WorkflowDelegation {
  id: string;
  delegateId: string;
  delegateName?: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

/** 自动任务可调用的 Webhook 端点（不含签名密钥） */
export interface WorkflowWebhook {
  id: string;
  name: string;
  url: string;
  description?: string;
  /** 1=启用 0=停用 */
  status: 0 | 1;
  hasSecret: boolean;
  updateTime?: string;
}

/** 待办 / 已办 / 抄送列表项 */
export interface TaskItem {
  taskId: string;
  instanceId: string;
  title: string;
  definitionName: string;
  nodeName?: string;
  initiator: string;
  initiatorName?: string;
  instanceStatus: InstanceStatus;
  status: AssigneeStatus;
  createTime?: string;
  actionTime?: string;
  businessType?: string;
  businessId?: string;
}
