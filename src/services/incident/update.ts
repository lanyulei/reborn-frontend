/**
 * IncidentUpdateService：对外公告、AI 草稿、分享链接；匿名状态页（凭分享令牌，不走登录态）。
 */
import { request } from '@umijs/max';
import { BASE, incidentRequest } from './request';
import type {
  IncidentUpdate,
  PublicIncident,
  ShareLink,
  UpdateKind,
} from './typings';

export async function listUpdates(
  id: string,
): Promise<{ items?: IncidentUpdate[] }> {
  return incidentRequest<{ items?: IncidentUpdate[] }>(`${BASE}/${id}/update`, {
    method: 'GET',
  });
}

export async function createUpdate(
  id: string,
  kind: UpdateKind,
  content: string,
): Promise<IncidentUpdate> {
  const { update } = await incidentRequest<{ update: IncidentUpdate }>(
    `${BASE}/${id}/update`,
    { method: 'POST', data: { kind, content } },
  );
  return update;
}

/** AI 起草公告（同步调用模型，可能耗时数秒） */
export async function draftUpdate(
  id: string,
  kind: UpdateKind,
): Promise<string> {
  const { content } = await incidentRequest<{ content?: string }>(
    `${BASE}/${id}/update:draft`,
    { method: 'POST', data: { kind } },
  );
  return content ?? '';
}

export async function listShareLinks(
  id: string,
): Promise<{ items?: ShareLink[] }> {
  return incidentRequest<{ items?: ShareLink[] }>(`${BASE}/${id}/share`, {
    method: 'GET',
  });
}

export async function createShareLink(
  id: string,
  body: { name: string; expireHours?: number },
): Promise<{ link: ShareLink; token: string }> {
  return incidentRequest(`${BASE}/${id}/share`, { method: 'POST', data: body });
}

export async function getShareLinkToken(
  id: string,
  shareId: string,
): Promise<{ link: ShareLink; token: string }> {
  return incidentRequest(`${BASE}/${id}/share/${shareId}/token`, {
    method: 'GET',
  });
}

export async function resetShareLink(
  id: string,
  shareId: string,
): Promise<{ link: ShareLink; token: string }> {
  return incidentRequest(`${BASE}/${id}/share/${shareId}:reset`, {
    method: 'POST',
  });
}

export async function deleteShareLink(
  id: string,
  shareId: string,
): Promise<void> {
  await incidentRequest(`${BASE}/${id}/share/${shareId}`, {
    method: 'DELETE',
  });
}

/** 匿名状态页的网页地址 */
export const publicIncidentUrl = (token: string): string =>
  `${window.location.origin}/public/incident/${encodeURIComponent(token)}`;

/** 匿名读取状态页：不走 authRequest（不触发刷新令牌 / 跳转登录） */
export async function getPublicIncident(token: string): Promise<PublicIncident> {
  return request<PublicIncident>(
    `/api/v1/public/incident/${encodeURIComponent(token)}`,
    { method: 'GET', skipErrorHandler: true },
  );
}
