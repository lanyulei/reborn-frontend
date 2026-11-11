/**
 * AssistantService 会话管理：列表 / 历史消息 / 删除（仅本人会话）。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult } from '@/services/system/typings';
import type { AssistantConversation, AssistantMessage } from './typings';

/** ListConversations 分页查询本人会话，最近活动倒序；page_size 上限 100 */
export async function listConversations(params: {
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AssistantConversation>> {
  return authRequest<PagedResult<AssistantConversation>>(
    '/api/v1/assistant/conversation',
    { method: 'GET', params },
  );
}

/** ListMessages 查询会话历史（按轮次聚合） */
export async function listMessages(
  id: string,
): Promise<{ items: AssistantMessage[] }> {
  return authRequest<{ items: AssistantMessage[] }>(
    `/api/v1/assistant/conversation/${id}/message`,
    { method: 'GET' },
  );
}

/** DeleteConversation 软删本人会话 */
export async function deleteConversation(id: string): Promise<void> {
  await authRequest<Record<string, never>>(
    `/api/v1/assistant/conversation/${id}`,
    { method: 'DELETE' },
  );
}
