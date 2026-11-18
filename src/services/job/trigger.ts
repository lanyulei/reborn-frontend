/**
 * JobTriggerService 触发器：由外部事件（开放接口 / 监控告警）执行作业模板，以负责人的身份提交。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { jobRequest } from './request';
import type {
  JobFireResult,
  JobTrigger,
  JobTriggerFire,
  JobTriggerSpec,
  JobTriggerType,
} from './typings';

export interface ListJobTriggersParams extends PageQuery {
  type?: JobTriggerType;
  templateId?: string;
}

/** ListJobTriggers 分页查询触发器 */
export async function listJobTriggers(
  params: ListJobTriggersParams,
): Promise<PagedResult<JobTrigger>> {
  return jobRequest<PagedResult<JobTrigger>>('/api/v1/job/trigger', {
    method: 'GET',
    params,
  });
}

/** CreateJobTrigger 新建触发器；接口触发器同时返回调用令牌（只返回这一次） */
export async function createJobTrigger(
  spec: JobTriggerSpec,
): Promise<{ trigger: JobTrigger; token?: string }> {
  return jobRequest<{ trigger: JobTrigger; token?: string }>(
    '/api/v1/job/trigger',
    { method: 'POST', data: { spec } },
  );
}

/** UpdateJobTrigger 编辑触发器（整体替换，类型不可改；启停也经此接口）；负责人变更为当前操作人 */
export async function updateJobTrigger(
  id: string,
  body: { spec: JobTriggerSpec; version: number },
): Promise<{ trigger: JobTrigger }> {
  return jobRequest<{ trigger: JobTrigger }>(`/api/v1/job/trigger/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** ResetJobTriggerToken 重置接口触发器的调用令牌：旧令牌立即失效 */
export async function resetJobTriggerToken(
  id: string,
): Promise<{ token: string }> {
  return jobRequest<{ token: string }>(
    `/api/v1/job/trigger/${id}:reset-token`,
    { method: 'POST', data: {} },
  );
}

/** DeleteJobTrigger 删除触发器：其调用令牌立即失效 */
export async function deleteJobTrigger(id: string): Promise<void> {
  await jobRequest<void>(`/api/v1/job/trigger/${id}`, { method: 'DELETE' });
}

/** ListJobTriggerFires 分页查询触发记录（按触发时间倒序） */
export async function listJobTriggerFires(params: {
  page?: number;
  pageSize?: number;
  triggerId?: string;
  result?: JobFireResult;
}): Promise<PagedResult<JobTriggerFire>> {
  return jobRequest<PagedResult<JobTriggerFire>>('/api/v1/job/trigger-fire', {
    method: 'GET',
    params,
  });
}
