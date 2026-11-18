/**
 * JobCredentialService 作业凭据：登录目标主机的 SSH 账号（私钥或密码）与提权方式。
 * 密文只写不读：任何接口都不返回私钥、密码与提权密码。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { jobRequest } from './request';
import type {
  JobCredential,
  JobCredentialOption,
  JobCredentialSpec,
  JobCredentialType,
} from './typings';

export interface ListJobCredentialsParams extends PageQuery {
  type?: JobCredentialType;
}

/** ListJobCredentials 分页查询凭据 */
export async function listJobCredentials(
  params: ListJobCredentialsParams,
): Promise<PagedResult<JobCredential>> {
  return jobRequest<PagedResult<JobCredential>>('/api/v1/job/credential', {
    method: 'GET',
    params,
  });
}

/** GetJobCredential 查询凭据详情 */
export async function getJobCredential(
  id: string,
): Promise<{ credential: JobCredential }> {
  return jobRequest<{ credential: JobCredential }>(
    `/api/v1/job/credential/${id}`,
    { method: 'GET' },
  );
}

/** CreateJobCredential 新建凭据；名称重复 409 */
export async function createJobCredential(
  spec: JobCredentialSpec,
): Promise<{ credential: JobCredential }> {
  return jobRequest<{ credential: JobCredential }>('/api/v1/job/credential', {
    method: 'POST',
    data: { spec },
  });
}

/** UpdateJobCredential 编辑凭据（整体替换；secret / becomeSecret 不传则保留原值）；version 不一致 409 */
export async function updateJobCredential(
  id: string,
  body: { spec: JobCredentialSpec; version: number },
): Promise<{ credential: JobCredential }> {
  return jobRequest<{ credential: JobCredential }>(
    `/api/v1/job/credential/${id}`,
    { method: 'PUT', data: body },
  );
}

/** DeleteJobCredential 删除凭据；仍被作业模板使用时 409 */
export async function deleteJobCredential(id: string): Promise<void> {
  await jobRequest<void>(`/api/v1/job/credential/${id}`, { method: 'DELETE' });
}

/** ListJobCredentialOptions 凭据下拉选项（按名称排序，至多 500 个） */
export async function listJobCredentialOptions(): Promise<{
  items?: JobCredentialOption[];
}> {
  return jobRequest<{ items?: JobCredentialOption[] }>(
    '/api/v1/job/credential-option',
    { method: 'GET', silent: true },
  );
}
