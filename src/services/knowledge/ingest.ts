/**
 * KnowledgeIngestService 文件导入任务。
 */
import type { PagedResult } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type { KnowledgeIngestJob, KnowledgeJobStatus } from './typings';

export interface CreateIngestParams {
  spaceId: string;
  /** 已上传的临时文件 ID（file 域 UploadFile） */
  fileId: string;
  documentId?: string;
  title?: string;
  tags?: string[];
  publish?: boolean;
}

/** CreateIngestJob 创建导入任务 */
export async function createIngestJob(
  body: CreateIngestParams,
): Promise<{ job: KnowledgeIngestJob }> {
  return authRequest('/api/v1/knowledge/ingest', { method: 'POST', data: body });
}

/** ListIngestJobs 分页查询导入任务 */
export async function listIngestJobs(params: {
  page?: number;
  pageSize?: number;
  spaceId?: string;
  status?: KnowledgeJobStatus;
}): Promise<PagedResult<KnowledgeIngestJob>> {
  return authRequest('/api/v1/knowledge/ingest', { method: 'GET', params });
}

/** RetryIngestJob 重试失败任务 */
export async function retryIngestJob(
  id: string,
): Promise<{ job: KnowledgeIngestJob }> {
  return authRequest(`/api/v1/knowledge/ingest/${id}:retry`, {
    method: 'POST',
    data: {},
  });
}
