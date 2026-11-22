/**
 * IncidentService：故障的列表 / 详情 / 创建 / 编辑 / 流转 / 合并 / 角色 / 时间线 / 关联告警 / 影响面 / 变更 /
 * 工单 / 上下文 / 检索 / 候选 / 选项。写操作须是指挥、处理人或管理员（由后端按角色再判一次）。
 */
import type { PagedResult } from '@/services/system/typings';
import { BASE, incidentRequest } from './request';
import type {
  AttachAlertsResult,
  Candidate,
  CandidateStatus,
  ChangeRef,
  CreateIncidentParams,
  ImpactResult,
  Incident,
  IncidentAlert,
  IncidentContext,
  IncidentOptions,
  IncidentSeverity,
  ListIncidentsParams,
  ListTimelineParams,
  MarkChangeParams,
  MemberRole,
  NamedRef,
  SimilarIncident,
  TimelineItem,
  TransitionParams,
  UpdateIncidentParams,
} from './typings';

type IncidentResp = { incident: Incident };

export async function listIncidents(
  params: ListIncidentsParams,
  options?: { silent?: boolean },
): Promise<PagedResult<Incident>> {
  return incidentRequest<PagedResult<Incident>>(BASE, {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

export async function getIncident(
  id: string,
  options?: { silent?: boolean },
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(`${BASE}/${id}`, {
    method: 'GET',
    silent: options?.silent,
  });
  return incident;
}

export async function createIncident(
  body: CreateIncidentParams,
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(BASE, {
    method: 'POST',
    data: body,
  });
  return incident;
}

export async function updateIncident(
  id: string,
  body: UpdateIncidentParams,
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(`${BASE}/${id}`, {
    method: 'PUT',
    data: body,
  });
  return incident;
}

export async function changeSeverity(
  id: string,
  severity: IncidentSeverity,
  note?: string,
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(
    `${BASE}/${id}:severity`,
    { method: 'POST', data: { severity, note } },
  );
  return incident;
}

export async function transitionIncident(
  id: string,
  body: TransitionParams,
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(
    `${BASE}/${id}:transition`,
    { method: 'POST', data: body },
  );
  return incident;
}

export async function mergeIncident(
  id: string,
  targetId: string,
  note?: string,
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(
    `${BASE}/${id}:merge`,
    { method: 'POST', data: { targetId, note } },
  );
  return incident;
}

export async function assignCommander(
  id: string,
  userId: string,
  note?: string,
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(
    `${BASE}/${id}:commander`,
    { method: 'POST', data: { userId, note } },
  );
  return incident;
}

export async function updateMembers(
  id: string,
  role: MemberRole,
  addUserIds: string[],
  removeUserIds: string[],
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(
    `${BASE}/${id}:members`,
    { method: 'POST', data: { role, addUserIds, removeUserIds } },
  );
  return incident;
}

export async function addComment(
  id: string,
  text: string,
  fileIds?: string[],
): Promise<TimelineItem> {
  const { item } = await incidentRequest<{ item: TimelineItem }>(
    `${BASE}/${id}/comment`,
    { method: 'POST', data: { text, fileIds } },
  );
  return item;
}

export async function pinEvent(
  id: string,
  eventId: string,
  pinned: boolean,
): Promise<TimelineItem> {
  const { item } = await incidentRequest<{ item: TimelineItem }>(
    `${BASE}/${id}/event/${eventId}:pin`,
    { method: 'POST', data: { pinned } },
  );
  return item;
}

export async function listTimeline(
  id: string,
  params: ListTimelineParams,
): Promise<PagedResult<TimelineItem>> {
  return incidentRequest<PagedResult<TimelineItem>>(`${BASE}/${id}/timeline`, {
    method: 'GET',
    params,
  });
}

export async function attachAlerts(
  id: string,
  alertIds: string[],
  move?: boolean,
): Promise<AttachAlertsResult> {
  return incidentRequest<AttachAlertsResult>(`${BASE}/${id}/alert`, {
    method: 'POST',
    data: { alertIds, move },
  });
}

export async function detachAlert(
  id: string,
  alertId: string,
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(
    `${BASE}/${id}/alert/${alertId}`,
    { method: 'DELETE' },
  );
  return incident;
}

export async function listIncidentAlerts(
  id: string,
  params: { page?: number; pageSize?: number },
): Promise<PagedResult<IncidentAlert>> {
  return incidentRequest<PagedResult<IncidentAlert>>(`${BASE}/${id}/alert`, {
    method: 'GET',
    params,
  });
}

/** 告警关联到的故障（当前有效的在前）；免接口授权，按调用者可见范围过滤 */
export async function listIncidentsByAlert(
  alertId: string,
): Promise<{ items?: Incident[] }> {
  return incidentRequest<{ items?: Incident[] }>(
    `/api/v1/incident-by-alert/${alertId}`,
    { method: 'GET', silent: true },
  );
}

export async function getImpact(
  id: string,
  depth?: number,
): Promise<ImpactResult> {
  return incidentRequest<ImpactResult>(`${BASE}/${id}/impact`, {
    method: 'GET',
    params: { depth },
  });
}

export async function listChanges(
  id: string,
  lookbackH?: number,
): Promise<{ items?: ChangeRef[]; notes?: string[] }> {
  return incidentRequest<{ items?: ChangeRef[]; notes?: string[] }>(
    `${BASE}/${id}/change`,
    { method: 'GET', params: { lookbackH } },
  );
}

export async function markChange(
  id: string,
  body: MarkChangeParams,
): Promise<ChangeRef> {
  const { change } = await incidentRequest<{ change: ChangeRef }>(
    `${BASE}/${id}/change`,
    { method: 'POST', data: body },
  );
  return change;
}

export async function createIncidentTicket(
  id: string,
  body: {
    templateId: string;
    title?: string;
    priority?: number;
    description?: string;
    requestId: string;
  },
): Promise<{ ticket?: NamedRef; ticketNumber?: string }> {
  return incidentRequest(`${BASE}/${id}/ticket`, { method: 'POST', data: body });
}

export async function getIncidentContext(id: string): Promise<IncidentContext> {
  return incidentRequest<IncidentContext>(`${BASE}/${id}/context`, {
    method: 'GET',
  });
}

export async function searchIncidents(
  q: string,
  excludeId?: string,
  limit = 20,
): Promise<{ items?: SimilarIncident[] }> {
  return incidentRequest<{ items?: SimilarIncident[] }>(`${BASE}:search`, {
    method: 'GET',
    params: { q, excludeId, limit },
    silent: true,
  });
}

export async function regenerateSummary(id: string): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(
    `${BASE}/${id}:summary`,
    { method: 'POST' },
  );
  return incident;
}

export async function listCandidates(params: {
  page?: number;
  pageSize?: number;
  status?: CandidateStatus;
}): Promise<PagedResult<Candidate>> {
  return incidentRequest<PagedResult<Candidate>>('/api/v1/incident-candidate', {
    method: 'GET',
    params,
  });
}

export async function promoteCandidate(
  id: string,
  body: { title?: string; severity?: IncidentSeverity },
): Promise<Incident> {
  const { incident } = await incidentRequest<IncidentResp>(
    `/api/v1/incident-candidate/${id}:promote`,
    { method: 'POST', data: body },
  );
  return incident;
}

export async function dismissCandidate(
  id: string,
  note?: string,
): Promise<void> {
  await incidentRequest(`/api/v1/incident-candidate/${id}:dismiss`, {
    method: 'POST',
    data: { note },
  });
}

/** 选项：kinds 取 schedules / businesses / root_causes / ticket_templates / playbooks（空 = 全部） */
export async function listIncidentOptions(
  kinds?: string[],
): Promise<IncidentOptions> {
  return incidentRequest<IncidentOptions>('/api/v1/incident-option', {
    method: 'GET',
    params: { kinds },
    silent: true,
  });
}
