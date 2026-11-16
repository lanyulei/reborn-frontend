/**
 * WorkflowInstanceService / WorkflowTaskService 流程运行时：发起、实例查询、
 * 待办 / 已办 / 抄送、任务处理动作。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { normalizePaged } from './paged';
import type {
  InstanceDetail,
  InstanceStatus,
  InstanceWait,
  TaskItem,
  WorkflowInstance,
} from './typings';

const BASE = '/api/v1/workflow';

/** 任务动作的统一响应：动作完成后的实例状态 */
export interface TaskActionResult {
  instanceStatus: InstanceStatus;
}

/** GetInstance 实例详情（流程图 + 任务 + 流转历史 + 等待节点 + 子流程） */
export async function getInstance(id: string): Promise<InstanceDetail> {
  const result = await authRequest<
    Omit<InstanceDetail, 'waits' | 'children'> & {
      waits?: Partial<InstanceWait>[];
      children?: InstanceDetail['children'];
    }
  >(`${BASE}/instance/${id}`, { method: 'GET' });
  // protojson 省略零值：补齐尝试次数与列表
  return {
    ...result,
    waits: (result.waits ?? []).map((w) => ({
      ...w,
      jobId: w.jobId ?? '',
      nodeId: w.nodeId ?? '',
      attempts: w.attempts ?? 0,
    })) as InstanceWait[],
    children: result.children ?? [],
  };
}

/** ListInstances 全部流程实例（管理视图） */
export async function listInstances(
  params: PageQuery & {
    status?: InstanceStatus;
    definitionId?: string;
    initiator?: string;
    /** 业务类型（如 ticket）；'-' = 不挂业务对象的独立流程 */
    businessType?: string;
  },
): Promise<PagedResult<WorkflowInstance>> {
  return normalizePaged(
    await authRequest(`${BASE}/instance`, { method: 'GET', params }),
  );
}

/** CancelInstance 发起人撤回 */
export async function cancelInstance(
  id: string,
  comment?: string,
): Promise<void> {
  await authRequest<void>(`${BASE}/instance/${id}/cancel`, {
    method: 'POST',
    data: { comment: comment ?? '' },
  });
}

/** TerminateInstance 管理员终止（原因必填） */
export async function terminateInstance(
  id: string,
  reason: string,
): Promise<void> {
  await authRequest<void>(`${BASE}/instance/${id}/terminate`, {
    method: 'POST',
    data: { reason },
  });
}

/** ApproveTask 同意 */
export async function approveTask(
  id: string,
  comment?: string,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/task/${id}/approve`, {
    method: 'POST',
    data: { comment: comment ?? '' },
  });
}

/** RejectTask 拒绝（理由必填） */
export async function rejectTask(
  id: string,
  comment: string,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/task/${id}/reject`, {
    method: 'POST',
    data: { comment },
  });
}

/** ReturnTask 退回到此前走过的节点（理由必填） */
export async function returnTask(
  id: string,
  toNodeId: string,
  comment: string,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/task/${id}/return`, {
    method: 'POST',
    data: { toNodeId, comment },
  });
}

/** ListReturnTargets 当前任务可退回到的节点 */
export async function listReturnTargets(
  id: string,
): Promise<{ items: { nodeId: string; nodeName: string }[] }> {
  return authRequest(`${BASE}/task/${id}/return-target`, { method: 'GET' });
}

/** TransferTask 转办 */
export async function transferTask(
  id: string,
  toUserId: string,
  comment?: string,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/task/${id}/transfer`, {
    method: 'POST',
    data: { toUserId, comment: comment ?? '' },
  });
}

/** ReassignTask 管理员改派（原因必填） */
export async function reassignTask(
  id: string,
  userIds: string[],
  reason: string,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/task/${id}/reassign`, {
    method: 'POST',
    data: { userIds, reason },
  });
}

/** AddSignTask 加签：before=他们同意后回到自己手上 after=自己现在同意，他们同意后才生效 */
export async function addSignTask(
  id: string,
  userIds: string[],
  position: 'before' | 'after',
  comment?: string,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/task/${id}/add-sign`, {
    method: 'POST',
    data: { userIds, position, comment: comment ?? '' },
  });
}

/** DelegateTask 委派：请对方先给出意见，之后回到自己手上 */
export async function delegateTask(
  id: string,
  toUserId: string,
  comment?: string,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/task/${id}/delegate`, {
    method: 'POST',
    data: { toUserId, comment: comment ?? '' },
  });
}

/** SignalInstance 投递外部信号：正在等待它的定时节点继续 */
export async function signalInstance(
  id: string,
  name: string,
  variables?: Record<string, unknown>,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/instance/${id}/signal`, {
    method: 'POST',
    data: { name, variables },
  });
}

/** RetryInstanceJob 重试进入死信的自动任务 */
export async function retryInstanceJob(
  id: string,
  jobId: string,
): Promise<void> {
  await authRequest<void>(`${BASE}/instance/${id}/job/${jobId}/retry`, {
    method: 'POST',
    data: {},
  });
}

/** SkipInstanceJob 跳过一个等待节点（原因必填） */
export async function skipInstanceJob(
  id: string,
  jobId: string,
  reason: string,
): Promise<TaskActionResult> {
  return authRequest(`${BASE}/instance/${id}/job/${jobId}/skip`, {
    method: 'POST',
    data: { reason },
  });
}

/** HandoverTasks 交接待办；一次至多处理 100 个实例，more 为真时应带上 nextCursor 再次调用 */
export async function handoverTasks(body: {
  fromUserId: string;
  toUserId: string;
  reason: string;
  /** 续传游标：首次留空，之后带上一次响应的 nextCursor */
  cursor?: string;
}): Promise<{
  moved: number;
  failed: number;
  more: boolean;
  nextCursor: string;
}> {
  const result = await authRequest<{
    moved?: number;
    failed?: number;
    more?: boolean;
    nextCursor?: string;
  }>(
    `${BASE}/handover`,
    { method: 'POST', data: body },
  );
  return {
    moved: result.moved ?? 0,
    failed: result.failed ?? 0,
    more: !!result.more,
    nextCursor: result.nextCursor ?? '',
  };
}

/** ListUserCandidates 可选用户（可用的系统用户，仅 ID 与显示名，最多 50 个） */
export async function listWorkflowUserCandidates(
  keyword?: string,
): Promise<{ items: { id: string; username: string; nickname: string }[] }> {
  return authRequest(`${BASE}/user-candidate`, {
    method: 'GET',
    params: { keyword: keyword || undefined },
    silent: true,
  });
}
