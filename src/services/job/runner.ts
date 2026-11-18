/**
 * JobRunnerService 执行节点：部署在各网络区域、实际运行 Ansible 的进程。
 * 接入令牌明文只在创建 / 重置时返回一次。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { jobRequest } from './request';
import type { JobRunner, JobRunnerSpec } from './typings';

/** ListJobRunners 分页查询执行节点；silent 用于自动刷新（失败不弹提示） */
export async function listJobRunners(
  params: PageQuery,
  options?: { silent?: boolean },
): Promise<PagedResult<JobRunner>> {
  return jobRequest<PagedResult<JobRunner>>('/api/v1/job/runner', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** CreateJobRunner 登记执行节点并返回接入令牌（只返回这一次）；名称重复 409 */
export async function createJobRunner(
  spec: JobRunnerSpec,
): Promise<{ runner: JobRunner; token: string }> {
  return jobRequest<{ runner: JobRunner; token: string }>(
    '/api/v1/job/runner',
    { method: 'POST', data: { spec } },
  );
}

/** UpdateJobRunner 编辑执行节点（整体替换）；version 不一致 409 */
export async function updateJobRunner(
  id: string,
  body: { spec: JobRunnerSpec; version: number },
): Promise<{ runner: JobRunner }> {
  return jobRequest<{ runner: JobRunner }>(`/api/v1/job/runner/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** ResetJobRunnerToken 重置接入令牌：旧令牌立即失效，返回新令牌（只返回这一次） */
export async function resetJobRunnerToken(
  id: string,
): Promise<{ token: string }> {
  return jobRequest<{ token: string }>(
    `/api/v1/job/runner/${id}:reset-token`,
    { method: 'POST', data: {} },
  );
}

/** DeleteJobRunner 删除执行节点：其令牌立即失效 */
export async function deleteJobRunner(id: string): Promise<void> {
  await jobRequest<void>(`/api/v1/job/runner/${id}`, { method: 'DELETE' });
}

/** ListJobRunnerZones 已登记的区域名（去重并排序，不含空区域） */
export async function listJobRunnerZones(): Promise<{ zones?: string[] }> {
  return jobRequest<{ zones?: string[] }>('/api/v1/job/runner-zone', {
    method: 'GET',
    silent: true,
  });
}
