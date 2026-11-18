/**
 * JobTemplateService 作业模板：把「项目中的一个 Playbook + 目标主机 + 凭据 + 执行参数 + 执行选项」
 * 固定下来，执行时只需填写参数。实际能执行到哪些主机，按执行人的 CMDB 数据范围判定。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { jobRequest } from './request';
import type {
  JobTarget,
  JobTargetPreview,
  JobTemplate,
  JobTemplateHosts,
  JobTemplateSpec,
} from './typings';

export interface ListJobTemplatesParams extends PageQuery {
  projectId?: string;
  enabled?: boolean;
}

/** ListJobTemplates 分页查询作业模板 */
export async function listJobTemplates(
  params: ListJobTemplatesParams,
  options?: { silent?: boolean },
): Promise<PagedResult<JobTemplate>> {
  return jobRequest<PagedResult<JobTemplate>>('/api/v1/job/template', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** GetJobTemplate 查询作业模板详情 */
export async function getJobTemplate(
  id: string,
  options?: { silent?: boolean },
): Promise<{ template: JobTemplate }> {
  return jobRequest<{ template: JobTemplate }>(`/api/v1/job/template/${id}`, {
    method: 'GET',
    silent: options?.silent,
  });
}

/** CreateJobTemplate 新建作业模板；名称重复 409 */
export async function createJobTemplate(
  spec: JobTemplateSpec,
): Promise<{ template: JobTemplate }> {
  return jobRequest<{ template: JobTemplate }>('/api/v1/job/template', {
    method: 'POST',
    data: { spec },
  });
}

/** UpdateJobTemplate 编辑作业模板（整体替换）；version 不一致 409 */
export async function updateJobTemplate(
  id: string,
  body: { spec: JobTemplateSpec; version: number },
): Promise<{ template: JobTemplate }> {
  return jobRequest<{ template: JobTemplate }>(`/api/v1/job/template/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteJobTemplate 删除作业模板；已有的执行记录保留 */
export async function deleteJobTemplate(id: string): Promise<void> {
  await jobRequest<void>(`/api/v1/job/template/${id}`, { method: 'DELETE' });
}

/** PreviewJobTarget 预览一份尚未保存的目标主机配置会选中哪些主机（按当前用户的 CMDB 数据范围） */
export async function previewJobTarget(
  target: JobTarget,
  options?: { silent?: boolean },
): Promise<JobTargetPreview> {
  return jobRequest<JobTargetPreview>('/api/v1/job/target:preview', {
    method: 'POST',
    data: { target },
    silent: options?.silent,
  });
}

/** ListJobTemplateHosts 模板当前会选中的主机（执行前确认用）；失败由调用方展示 */
export async function listJobTemplateHosts(
  id: string,
): Promise<JobTemplateHosts> {
  return jobRequest<JobTemplateHosts>(`/api/v1/job/template/${id}/host`, {
    method: 'GET',
    silent: true,
  });
}
