/**
 * KnowledgeService 文档：列表 / 详情 / 草稿 / 发布 / 审核 / 复审 / 归档 / 删除 / 版本 / 关联 / 相关 / 概览。
 */
import type { PagedResult } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type {
  KnowledgeDocStatus,
  KnowledgeDocument,
  KnowledgeLink,
  KnowledgeLinkTargetType,
  KnowledgeOverview,
  KnowledgeRelatedDocument,
  KnowledgeRelatedTargetType,
  KnowledgeVersion,
} from './typings';

export interface ListDocumentsParams {
  page?: number;
  pageSize?: number;
  spaceId?: string;
  status?: KnowledgeDocStatus;
  keyword?: string;
  tag?: string;
  ownerId?: string;
  reviewPending?: boolean;
  reviewOverdue?: boolean;
}

export interface CreateDocumentParams {
  spaceId: string;
  title: string;
  slug?: string;
  content?: string;
  tags?: string[];
  summary?: string;
  ownerId?: string;
  source?: 'manual' | 'assistant';
  sourceRef?: string;
  publish?: boolean;
}

export interface UpdateDocumentParams {
  title?: string;
  content?: string;
  /** 整组替换；省略 = 不改 */
  tags?: { items: string[] };
  summary?: string;
  ownerId?: string;
  /** RFC3339 */
  reviewAt?: string;
  clearReviewAt?: boolean;
}

/** ListDocuments 分页查询文档 */
export async function listDocuments(
  params: ListDocumentsParams,
): Promise<PagedResult<KnowledgeDocument>> {
  return authRequest('/api/v1/knowledge/document', { method: 'GET', params });
}

/** GetDocument 文档详情；headingPath 非空只取该节 */
export async function getDocument(
  id: string,
  headingPath?: string,
): Promise<{ document: KnowledgeDocument }> {
  return authRequest(`/api/v1/knowledge/document/${id}`, {
    method: 'GET',
    params: headingPath ? { headingPath } : undefined,
  });
}

/** CreateDocument 新建草稿（可随即发布） */
export async function createDocument(
  body: CreateDocumentParams,
): Promise<{ document: KnowledgeDocument }> {
  return authRequest('/api/v1/knowledge/document', {
    method: 'POST',
    data: body,
  });
}

/** UpdateDocument 保存草稿 */
export async function updateDocument(
  id: string,
  body: UpdateDocumentParams,
): Promise<{ document: KnowledgeDocument }> {
  return authRequest(`/api/v1/knowledge/document/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** PublishDocument 发布（空间要求审核时 pendingReview=true） */
export async function publishDocument(
  id: string,
  note?: string,
): Promise<{ document: KnowledgeDocument; pendingReview?: boolean }> {
  return authRequest(`/api/v1/knowledge/document/${id}:publish`, {
    method: 'POST',
    data: { note: note || undefined },
  });
}

/** ReviewDocument 审核：通过即发布 / 驳回 */
export async function reviewDocument(
  id: string,
  approved: boolean,
  note?: string,
): Promise<{ document: KnowledgeDocument }> {
  return authRequest(`/api/v1/knowledge/document/${id}:review`, {
    method: 'POST',
    data: { approved, note: note || undefined },
  });
}

/** ConfirmDocumentReview 确认仍然有效（复审顺延） */
export async function confirmDocumentReview(
  id: string,
): Promise<{ document: KnowledgeDocument }> {
  return authRequest(`/api/v1/knowledge/document/${id}:confirm-review`, {
    method: 'POST',
    data: {},
  });
}

/** ArchiveDocument 归档 */
export async function archiveDocument(
  id: string,
): Promise<{ document: KnowledgeDocument }> {
  return authRequest(`/api/v1/knowledge/document/${id}:archive`, {
    method: 'POST',
    data: {},
  });
}

/** RestoreDocument 恢复归档 */
export async function restoreDocument(
  id: string,
): Promise<{ document: KnowledgeDocument }> {
  return authRequest(`/api/v1/knowledge/document/${id}:restore`, {
    method: 'POST',
    data: {},
  });
}

/** DeleteDocument 删除（软删） */
export async function deleteDocument(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/knowledge/document/${id}`, {
    method: 'DELETE',
  });
}

/** ListVersions 版本列表（不含正文） */
export async function listVersions(
  id: string,
): Promise<{ items?: KnowledgeVersion[] }> {
  return authRequest(`/api/v1/knowledge/document/${id}/version`, {
    method: 'GET',
  });
}

/** GetVersion 版本内容 */
export async function getVersion(
  id: string,
  version: number,
): Promise<{ version: KnowledgeVersion }> {
  return authRequest(`/api/v1/knowledge/document/${id}/version/${version}`, {
    method: 'GET',
  });
}

/** RollbackDocument 以历史版本发布新版本 */
export async function rollbackDocument(
  id: string,
  version: number,
): Promise<{ document: KnowledgeDocument }> {
  return authRequest(`/api/v1/knowledge/document/${id}:rollback`, {
    method: 'POST',
    data: { version },
  });
}

/** AddLink 添加关联 */
export async function addLink(
  id: string,
  body: {
    targetType: KnowledgeLinkTargetType;
    targetId: string;
    targetName?: string;
  },
): Promise<{ link: KnowledgeLink }> {
  return authRequest(`/api/v1/knowledge/document/${id}/link`, {
    method: 'POST',
    data: body,
  });
}

/** RemoveLink 移除关联 */
export async function removeLink(id: string, linkId: string): Promise<void> {
  await authRequest<void>(`/api/v1/knowledge/document/${id}/link/${linkId}`, {
    method: 'DELETE',
  });
}

/** ListRelated 与对象相关的文档（显式关联 + 语义检索） */
export async function listRelated(
  params: {
    targetType: KnowledgeRelatedTargetType;
    targetId: string;
    query?: string;
    limit?: number;
  },
  options?: { silent?: boolean },
): Promise<{ items?: KnowledgeRelatedDocument[] }> {
  return authRequest('/api/v1/knowledge/related', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** GetOverview 首页概览 */
export async function getOverview(): Promise<KnowledgeOverview> {
  return authRequest('/api/v1/knowledge/overview', { method: 'GET' });
}
