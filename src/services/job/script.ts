/**
 * JobScriptService 脚本库：可复用的脚本，快速执行时引用。列表不含脚本内容。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { jobRequest } from './request';
import type { JobInterpreter, JobScript, JobScriptSpec } from './typings';

export interface ListJobScriptsParams extends PageQuery {
  interpreter?: JobInterpreter;
}

/** ListJobScripts 分页查询脚本（不含脚本内容） */
export async function listJobScripts(
  params: ListJobScriptsParams,
  options?: { silent?: boolean },
): Promise<PagedResult<JobScript>> {
  return jobRequest<PagedResult<JobScript>>('/api/v1/job/script', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** GetJobScript 查询脚本详情（含脚本内容） */
export async function getJobScript(
  id: string,
  options?: { silent?: boolean },
): Promise<{ script: JobScript }> {
  return jobRequest<{ script: JobScript }>(`/api/v1/job/script/${id}`, {
    method: 'GET',
    silent: options?.silent,
  });
}

/** CreateJobScript 新建脚本；名称重复 409 */
export async function createJobScript(
  spec: JobScriptSpec,
): Promise<{ script: JobScript }> {
  return jobRequest<{ script: JobScript }>('/api/v1/job/script', {
    method: 'POST',
    data: { spec },
  });
}

/** UpdateJobScript 编辑脚本（整体替换）；version 不一致 409 */
export async function updateJobScript(
  id: string,
  body: { spec: JobScriptSpec; version: number },
): Promise<{ script: JobScript }> {
  return jobRequest<{ script: JobScript }>(`/api/v1/job/script/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteJobScript 删除脚本；已有的执行记录不受影响 */
export async function deleteJobScript(id: string): Promise<void> {
  await jobRequest<void>(`/api/v1/job/script/${id}`, { method: 'DELETE' });
}
