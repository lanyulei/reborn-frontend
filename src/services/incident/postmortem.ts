/**
 * IncidentPostmortemService：复盘文档（草稿 / 完成 / 修订 / 版本 / AI 初稿 / 时间线生成）与改进项。
 */
import type { PagedResult } from '@/services/system/typings';
import { BASE, incidentRequest } from './request';
import type {
  ActionItem,
  ActionItemStatus,
  Postmortem,
  PostmortemDoc,
  PostmortemVersion,
  SaveActionItemParams,
} from './typings';

type Resp = { postmortem: Postmortem };

export async function getPostmortem(id: string): Promise<Postmortem> {
  const { postmortem } = await incidentRequest<Resp>(
    `${BASE}/${id}/postmortem`,
    { method: 'GET' },
  );
  return postmortem;
}

export async function savePostmortem(
  id: string,
  doc: PostmortemDoc,
): Promise<Postmortem> {
  const { postmortem } = await incidentRequest<Resp>(
    `${BASE}/${id}/postmortem`,
    { method: 'PUT', data: { doc } },
  );
  return postmortem;
}

export async function completePostmortem(
  id: string,
  note?: string,
): Promise<Postmortem> {
  const { postmortem } = await incidentRequest<Resp>(
    `${BASE}/${id}/postmortem:complete`,
    { method: 'POST', data: { note } },
  );
  return postmortem;
}

export async function revisePostmortem(id: string): Promise<Postmortem> {
  const { postmortem } = await incidentRequest<Resp>(
    `${BASE}/${id}/postmortem:revise`,
    { method: 'POST' },
  );
  return postmortem;
}

export async function listPostmortemVersions(
  id: string,
): Promise<{ items?: PostmortemVersion[] }> {
  return incidentRequest<{ items?: PostmortemVersion[] }>(
    `${BASE}/${id}/postmortem/version`,
    { method: 'GET' },
  );
}

/** AI 起草复盘（时间线段用结构化事件生成，其余段调模型） */
export async function draftPostmortem(id: string): Promise<PostmortemDoc> {
  const { doc } = await incidentRequest<{ doc?: PostmortemDoc }>(
    `${BASE}/${id}/postmortem:draft`,
    { method: 'POST' },
  );
  return doc ?? {};
}

export async function generateTimeline(id: string): Promise<string> {
  const { text } = await incidentRequest<{ text?: string }>(
    `${BASE}/${id}/postmortem:timeline`,
    { method: 'GET' },
  );
  return text ?? '';
}

export async function listActionItems(params: {
  page?: number;
  pageSize?: number;
  incidentId?: string;
  status?: ActionItemStatus;
  ownerId?: string;
  overdue?: boolean;
}): Promise<PagedResult<ActionItem>> {
  return incidentRequest<PagedResult<ActionItem>>(
    '/api/v1/incident-action-item',
    { method: 'GET', params },
  );
}

export async function saveActionItem(
  id: string,
  body: SaveActionItemParams,
): Promise<ActionItem> {
  const { item } = await incidentRequest<{ item: ActionItem }>(
    `${BASE}/${id}/action-item`,
    { method: 'POST', data: body },
  );
  return item;
}

export async function deleteActionItem(
  id: string,
  itemId: string,
): Promise<void> {
  await incidentRequest(`${BASE}/${id}/action-item/${itemId}`, {
    method: 'DELETE',
  });
}

export async function createActionItemTicket(
  id: string,
  itemId: string,
  templateId: string,
  priority?: number,
): Promise<ActionItem> {
  const { item } = await incidentRequest<{ item: ActionItem }>(
    `${BASE}/${id}/action-item/${itemId}:ticket`,
    { method: 'POST', data: { templateId, priority } },
  );
  return item;
}
