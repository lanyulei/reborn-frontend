/**
 * JobScheduleService 定时作业：按 Cron 表达式以固定参数执行作业模板，以负责人的身份提交。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { jobRequest } from './request';
import type { JobSchedule, JobScheduleSpec } from './typings';

export interface ListJobSchedulesParams extends PageQuery {
  templateId?: string;
  enabled?: boolean;
}

/** ListJobSchedules 分页查询定时作业 */
export async function listJobSchedules(
  params: ListJobSchedulesParams,
): Promise<PagedResult<JobSchedule>> {
  return jobRequest<PagedResult<JobSchedule>>('/api/v1/job/schedule', {
    method: 'GET',
    params,
  });
}

/** CreateJobSchedule 新建定时作业；Cron 表达式或参数不合法 400 */
export async function createJobSchedule(
  spec: JobScheduleSpec,
): Promise<{ schedule: JobSchedule }> {
  return jobRequest<{ schedule: JobSchedule }>('/api/v1/job/schedule', {
    method: 'POST',
    data: { spec },
  });
}

/** UpdateJobSchedule 编辑定时作业（整体替换；启停也经此接口）；负责人变更为当前操作人 */
export async function updateJobSchedule(
  id: string,
  body: { spec: JobScheduleSpec; version: number },
): Promise<{ schedule: JobSchedule }> {
  return jobRequest<{ schedule: JobSchedule }>(`/api/v1/job/schedule/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteJobSchedule 删除定时作业；已提交的执行不受影响 */
export async function deleteJobSchedule(id: string): Promise<void> {
  await jobRequest<void>(`/api/v1/job/schedule/${id}`, { method: 'DELETE' });
}

/** PreviewJobSchedule 校验 Cron 表达式并返回接下来的 5 个触发时间；失败由调用方展示 */
export async function previewJobSchedule(body: {
  cron: string;
  timezone: string;
}): Promise<{ nextTimes?: string[] }> {
  return jobRequest<{ nextTimes?: string[] }>('/api/v1/job/schedule:preview', {
    method: 'POST',
    data: body,
    silent: true,
  });
}
