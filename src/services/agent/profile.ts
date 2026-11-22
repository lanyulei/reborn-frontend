/**
 * AgentProfileService：Profile 的列表 / 详情 / 新建 / 编辑 / 删除 / 干跑 / 变更历史 / 可用工具目录。
 */
import type { PagedResult } from '@/services/system/typings';
import { agentRequest } from './request';
import type {
  AgentProfile,
  ListProfilesParams,
  ProfileHistory,
  ProfileSpec,
  ToolOption,
} from './typings';

const BASE = '/api/v1/agent-profile';

export async function listProfiles(
  params: ListProfilesParams,
  options?: { silent?: boolean },
): Promise<PagedResult<AgentProfile>> {
  return agentRequest<PagedResult<AgentProfile>>(BASE, {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

export async function getProfile(id: string): Promise<AgentProfile> {
  const { profile } = await agentRequest<{ profile: AgentProfile }>(
    `${BASE}/${id}`,
    { method: 'GET' },
  );
  return profile;
}

export async function createProfile(spec: ProfileSpec): Promise<AgentProfile> {
  const { profile } = await agentRequest<{ profile: AgentProfile }>(BASE, {
    method: 'POST',
    data: { spec },
  });
  return profile;
}

export async function updateProfile(
  id: string,
  spec: ProfileSpec,
  version: number,
  resetBreaker?: boolean,
): Promise<AgentProfile> {
  const { profile } = await agentRequest<{ profile: AgentProfile }>(
    `${BASE}/${id}`,
    { method: 'PUT', data: { spec, version, resetBreaker } },
  );
  return profile;
}

export async function deleteProfile(id: string, version: number): Promise<void> {
  await agentRequest<Record<string, never>>(`${BASE}/${id}`, {
    method: 'DELETE',
    params: { version },
  });
}

/** 干跑：异步，返回任务 ID */
export async function testProfile(
  id: string,
  incidentId: string,
): Promise<{ taskId: string }> {
  return agentRequest<{ taskId: string }>(`${BASE}/${id}:test`, {
    method: 'POST',
    data: { incidentId },
  });
}

export async function listProfileHistory(
  id: string,
  params: { page?: number; pageSize?: number },
): Promise<PagedResult<ProfileHistory>> {
  return agentRequest<PagedResult<ProfileHistory>>(`${BASE}/${id}/history`, {
    method: 'GET',
    params,
  });
}

export async function listProfileTools(): Promise<ToolOption[]> {
  const { items } = await agentRequest<{ items?: ToolOption[] }>(
    '/api/v1/agent-profile-tool',
    { method: 'GET', silent: true },
  );
  return items ?? [];
}
