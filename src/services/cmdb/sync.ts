/**
 * CmdbSyncService 同步控制面：采集源（云账号 / 虚拟化平台）配置、手动触发、运行记录。
 * 凭据只写不读：任何响应不返回。
 */
import { authRequest } from '@/services/system/request';

export type CmdbProvider = 'aliyun' | 'tencent' | 'aws' | 'vmware';
export type CmdbRunStatus = 'never' | 'running' | 'succeeded' | 'failed';

export interface SyncSource {
  id: string;
  name: string;
  provider: CmdbProvider;
  config: Record<string, unknown>;
  hasCredential: boolean;
  env?: string;
  intervalSeconds: number;
  gracePeriodSeconds: number;
  enabled: boolean;
  nextRunTime?: string;
  lastRunTime?: string;
  lastStatus: CmdbRunStatus;
  activeTask?: boolean;
  /** int64 字符串 */
  version: string;
  createTime?: string;
  updateTime?: string;
  /** 已配置回调令牌 */
  webhookEnabled?: boolean;
  /** 数据面回调路径（拼接数据面地址使用） */
  webhookPath?: string;
}

export interface SyncRunError {
  modelCode: string;
  externalId: string;
  name: string;
  reason: string;
}

export interface SyncRun {
  id: string;
  sourceId: string;
  taskId: string;
  status: CmdbRunStatus;
  discovered: number;
  created: number;
  updated: number;
  unchanged: number;
  disappeared: number;
  retired: number;
  failed: number;
  error?: string;
  errors?: SyncRunError[];
  startTime?: string;
  finishTime?: string;
}

export interface ListSourcesParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  provider?: CmdbProvider;
}

export async function listSources(
  params: ListSourcesParams,
  /** silent：辅助性查询（如 id→名称映射）无权限时不弹错误 */
  options?: { silent?: boolean },
): Promise<{ items: SyncSource[]; total: string }> {
  return authRequest<{ items: SyncSource[]; total: string }>(
    '/api/v1/cmdb/sync/source',
    { method: 'GET', params, silent: options?.silent },
  );
}

export interface CreateSourceBody {
  name: string;
  provider: CmdbProvider;
  config: Record<string, unknown>;
  credential: string;
  env?: string;
  intervalSeconds?: number;
  gracePeriodSeconds?: number;
  enabled?: boolean;
}

export async function createSource(
  body: CreateSourceBody,
): Promise<{ source: SyncSource }> {
  return authRequest<{ source: SyncSource }>('/api/v1/cmdb/sync/source', {
    method: 'POST',
    data: body,
  });
}

export interface UpdateSourceBody {
  version: string;
  name: string;
  config: Record<string, unknown>;
  /** 不传 = 保留旧凭据 */
  credential?: string;
  env: string;
  intervalSeconds: number;
  gracePeriodSeconds: number;
  enabled: boolean;
}

export async function updateSource(
  id: string,
  body: UpdateSourceBody,
): Promise<{ source: SyncSource }> {
  return authRequest<{ source: SyncSource }>(
    `/api/v1/cmdb/sync/source/${id}`,
    { method: 'PUT', data: body },
  );
}

export async function deleteSource(id: string): Promise<void> {
  await authRequest<unknown>(`/api/v1/cmdb/sync/source/${id}`, {
    method: 'DELETE',
  });
}

export async function triggerSync(id: string): Promise<{ taskId: string }> {
  return authRequest<{ taskId: string }>(
    `/api/v1/cmdb/sync/source/${id}:trigger`,
    { method: 'POST', data: {} },
  );
}

export async function listRuns(
  id: string,
  params: { page?: number; pageSize?: number },
): Promise<{ items: SyncRun[]; total: string }> {
  return authRequest<{ items: SyncRun[]; total: string }>(
    `/api/v1/cmdb/sync/source/${id}/run`,
    { method: 'GET', params },
  );
}

export interface WebhookRotateResult {
  /** 令牌明文，仅返回一次 */
  token: string;
  path: string;
  header: string;
}

/** RotateWebhook 生成/轮换回调令牌（明文只返回一次，库中只存哈希） */
export async function rotateWebhook(id: string): Promise<WebhookRotateResult> {
  return authRequest<WebhookRotateResult>(
    `/api/v1/cmdb/sync/source/${id}/webhook`,
    { method: 'POST', data: {} },
  );
}

/** DisableWebhook 停用回调 */
export async function disableWebhook(id: string): Promise<void> {
  await authRequest<unknown>(`/api/v1/cmdb/sync/source/${id}/webhook`, {
    method: 'DELETE',
  });
}
