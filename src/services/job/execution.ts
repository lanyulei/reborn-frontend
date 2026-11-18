/**
 * JobExecutionService 作业执行：提交执行、查看执行记录与实时日志、取消。
 */
import type { PagedResult } from '@/services/system/typings';
import { jobRequest } from './request';
import type {
  JobAdhoc,
  JobAdhocCheck,
  JobAdhocKind,
  JobExecution,
  JobExecutionHost,
  JobExecutionLog,
  JobExecutionStatus,
  JobHostStatus,
  JobKind,
  JobOptions,
  JobStats,
  JobTarget,
  JobTriggerSource,
} from './typings';

export interface SubmitJobExecutionBody {
  templateId: string;
  /** 参数取值（变量名 → 值）；未填且有缺省值的参数取缺省值 */
  params?: Record<string, unknown>;
  /** 只在这些主机上执行（须是模板目标主机的子集）；不传 = 模板的全部目标主机 */
  ciIds?: string[];
  /** 是否预检模式；不传取模板的设置 */
  check?: boolean;
  /** 幂等键：带相同 requestId 的重复提交返回同一条执行 */
  requestId?: string;
  /** 确认框展示的模板版本；模板此后被改过则拒绝（400） */
  templateVersion?: number;
}

/** SubmitJobExecution 按作业模板提交一次执行；失败由调用方展示在执行表单里 */
export async function submitJobExecution(
  body: SubmitJobExecutionBody,
): Promise<{ execution: JobExecution }> {
  return jobRequest<{ execution: JobExecution }>('/api/v1/job/execution', {
    method: 'POST',
    data: body,
    silent: true,
  });
}

export interface ListJobExecutionsParams {
  page?: number;
  pageSize?: number;
  templateId?: string;
  statuses?: JobExecutionStatus[];
  creatorId?: string;
  /** 只看我提交的 */
  mine?: boolean;
  /** 模板名称模糊匹配 */
  keyword?: string;
  /** 提交时间下限（含），RFC3339 */
  startTime?: string;
  /** 提交时间上限（不含），RFC3339 */
  endTime?: string;
  /** 只看在该 CMDB 资源上执行过的 */
  ciId?: string;
  kinds?: JobKind[];
  triggers?: JobTriggerSource[];
  /** 只看这一组切片 */
  groupId?: string;
  /** 只看由这个定时作业 / 触发器提交的 */
  triggerRef?: string;
}

/** ListJobExecutions 分页查询执行记录（按提交时间倒序，不含 detail） */
export async function listJobExecutions(
  params: ListJobExecutionsParams,
  options?: { silent?: boolean },
): Promise<PagedResult<JobExecution>> {
  return jobRequest<PagedResult<JobExecution>>('/api/v1/job/execution', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** GetJobExecution 查询执行详情（含 detail）；失败由调用方展示 */
export async function getJobExecution(
  id: string,
): Promise<{ execution: JobExecution }> {
  return jobRequest<{ execution: JobExecution }>(
    `/api/v1/job/execution/${id}`,
    { method: 'GET', silent: true },
  );
}

export interface ListJobExecutionHostsParams {
  page?: number;
  /** 1-500 */
  pageSize?: number;
  statuses?: JobHostStatus[];
  /** 名称 / 地址模糊匹配 */
  keyword?: string;
}

/** ListJobExecutionHosts 分页查询一次执行的主机及其结果（按序号排序） */
export async function listJobExecutionHosts(
  id: string,
  params: ListJobExecutionHostsParams,
  options?: { silent?: boolean },
): Promise<PagedResult<JobExecutionHost>> {
  return jobRequest<PagedResult<JobExecutionHost>>(
    `/api/v1/job/execution/${id}/host`,
    { method: 'GET', params, silent: options?.silent },
  );
}

/** GetJobExecutionLog 增量读取执行日志：返回序号大于 afterSeq 的日志块；失败由调用方退避重试 */
export async function getJobExecutionLog(
  id: string,
  afterSeq: string,
): Promise<JobExecutionLog> {
  return jobRequest<JobExecutionLog>(`/api/v1/job/execution/${id}/log`, {
    method: 'GET',
    // 0 也要带上（查询串序列化只跳过空值）
    params: { afterSeq },
    silent: true,
  });
}

/** CancelJobExecution 取消执行；已结束的执行 409 */
export async function cancelJobExecution(
  id: string,
): Promise<{ execution: JobExecution }> {
  return jobRequest<{ execution: JobExecution }>(
    `/api/v1/job/execution/${id}:cancel`,
    { method: 'POST', data: {} },
  );
}

export interface JobAdhocBody {
  kind: JobAdhocKind;
  adhoc: JobAdhoc;
  target: JobTarget;
  credentialId: string;
  /** check / diff 对快速执行无意义 */
  options?: JobOptions;
  runnerZone?: string;
  requestId?: string;
}

/** SubmitJobAdhoc 快速执行；失败由调用方展示 */
export async function submitJobAdhoc(
  body: JobAdhocBody,
): Promise<{ execution: JobExecution }> {
  return jobRequest<{ execution: JobExecution }>('/api/v1/job/adhoc', {
    method: 'POST',
    data: body,
    silent: true,
  });
}

/** CheckJobAdhoc 提交前检查：解析目标主机、匹配高危命令规则、判定是否需要审批；不落库 */
export async function checkJobAdhoc(
  body: Pick<JobAdhocBody, 'kind' | 'adhoc' | 'target'>,
): Promise<JobAdhocCheck> {
  return jobRequest<JobAdhocCheck>('/api/v1/job/adhoc:check', {
    method: 'POST',
    data: body,
  });
}

/** GetJobStats 执行统计 */
export async function getJobStats(params: {
  days?: number;
  timezone?: string;
}): Promise<JobStats> {
  return jobRequest<JobStats>('/api/v1/job/stats', { method: 'GET', params });
}
