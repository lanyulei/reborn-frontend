/**
 * KnowledgeSpaceService 知识空间：列表 / 详情 / 新建 / 编辑 / 删除 / ACL。
 */
import { authRequest } from '@/services/system/request';
import type {
  KnowledgeAclEntry,
  KnowledgeSpace,
  KnowledgeSpaceType,
  KnowledgeVisibility,
} from './typings';

export interface SaveSpaceParams {
  code?: string;
  name?: string;
  type?: KnowledgeSpaceType;
  description?: string;
  visibility?: KnowledgeVisibility;
  ownerId?: string;
  embeddingEnabled?: boolean;
  reviewRequired?: boolean;
  reviewDays?: number;
}

/** ListSpaces 当前用户可见的空间（不分页） */
export async function listSpaces(
  params?: { keyword?: string; type?: string },
  options?: { silent?: boolean },
): Promise<{ items?: KnowledgeSpace[] }> {
  return authRequest('/api/v1/knowledge/space', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** GetSpace 空间详情 */
export async function getSpace(
  id: string,
): Promise<{ space: KnowledgeSpace }> {
  return authRequest(`/api/v1/knowledge/space/${id}`, { method: 'GET' });
}

/** CreateSpace 新建空间 */
export async function createSpace(
  body: SaveSpaceParams,
): Promise<{ space: KnowledgeSpace }> {
  return authRequest('/api/v1/knowledge/space', {
    method: 'POST',
    data: body,
  });
}

/** UpdateSpace 修改空间（未提供的字段不改） */
export async function updateSpace(
  id: string,
  body: SaveSpaceParams,
): Promise<{ space: KnowledgeSpace }> {
  return authRequest(`/api/v1/knowledge/space/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteSpace 删除空间（仍有文档时 409） */
export async function deleteSpace(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/knowledge/space/${id}`, {
    method: 'DELETE',
  });
}

/** GetSpaceAcl 空间 ACL */
export async function getSpaceAcl(
  id: string,
): Promise<{ items?: KnowledgeAclEntry[] }> {
  return authRequest(`/api/v1/knowledge/space/${id}/acl`, { method: 'GET' });
}

/** SetSpaceAcl 整组替换 ACL */
export async function setSpaceAcl(
  id: string,
  items: Omit<KnowledgeAclEntry, 'subjectName'>[],
): Promise<{ items?: KnowledgeAclEntry[] }> {
  return authRequest(`/api/v1/knowledge/space/${id}/acl`, {
    method: 'PUT',
    data: { items },
  });
}
