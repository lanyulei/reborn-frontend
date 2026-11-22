/**
 * KnowledgeAdminService 知识库管理：索引状态 / 重建 / 检索日志 / 统计。
 */
import type { PagedResult } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type {
  KnowledgeIndexStatus,
  KnowledgeSearchLog,
  KnowledgeStats,
} from './typings';

/** GetIndexStatus 索引状态 */
export async function getIndexStatus(): Promise<KnowledgeIndexStatus> {
  return authRequest('/api/v1/knowledge/admin/index', { method: 'GET' });
}

/** RebuildIndex 重建索引（空间或单篇） */
export async function rebuildIndex(body: {
  spaceId?: string;
  documentId?: string;
}): Promise<{ queued?: number }> {
  return authRequest('/api/v1/knowledge/admin/index:rebuild', {
    method: 'POST',
    data: body,
  });
}

/** ListSearchLogs 检索日志 */
export async function listSearchLogs(params: {
  page?: number;
  pageSize?: number;
  source?: string;
  noResult?: boolean;
  keyword?: string;
}): Promise<PagedResult<KnowledgeSearchLog>> {
  return authRequest('/api/v1/knowledge/admin/search-log', {
    method: 'GET',
    params,
  });
}

/** GetStats 统计（最近 days 天） */
export async function getStats(days?: number): Promise<KnowledgeStats> {
  return authRequest('/api/v1/knowledge/admin/stats', {
    method: 'GET',
    params: days ? { days } : undefined,
  });
}
