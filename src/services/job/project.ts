/**
 * JobProjectService 作业项目：存放 Playbook 的 Git 仓库。仓库凭据只写不读。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { jobRequest } from './request';
import type { JobProject, JobProjectOption, JobProjectSpec } from './typings';

/** ListJobProjects 分页查询项目 */
export async function listJobProjects(
  params: PageQuery,
): Promise<PagedResult<JobProject>> {
  return jobRequest<PagedResult<JobProject>>('/api/v1/job/project', {
    method: 'GET',
    params,
  });
}

/** GetJobProject 查询项目详情 */
export async function getJobProject(
  id: string,
): Promise<{ project: JobProject }> {
  return jobRequest<{ project: JobProject }>(`/api/v1/job/project/${id}`, {
    method: 'GET',
  });
}

/** CreateJobProject 新建项目；名称重复 409 */
export async function createJobProject(
  spec: JobProjectSpec,
): Promise<{ project: JobProject }> {
  return jobRequest<{ project: JobProject }>('/api/v1/job/project', {
    method: 'POST',
    data: { spec },
  });
}

/** UpdateJobProject 编辑项目（整体替换；secret 不传则保留原值）；version 不一致 409 */
export async function updateJobProject(
  id: string,
  body: { spec: JobProjectSpec; version: number },
): Promise<{ project: JobProject }> {
  return jobRequest<{ project: JobProject }>(`/api/v1/job/project/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteJobProject 删除项目；仍被作业模板使用时 409 */
export async function deleteJobProject(id: string): Promise<void> {
  await jobRequest<void>(`/api/v1/job/project/${id}`, { method: 'DELETE' });
}

/** ListJobProjectOptions 项目下拉选项（按名称排序，至多 500 个） */
export async function listJobProjectOptions(): Promise<{
  items?: JobProjectOption[];
}> {
  return jobRequest<{ items?: JobProjectOption[] }>(
    '/api/v1/job/project-option',
    { method: 'GET', silent: true },
  );
}
