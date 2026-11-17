/**
 * OncallGroupService 值班分组：分组 / 成员 / 可选成员 / 变更记录。
 * 修改类接口另要求操作者是分组管理员或超级管理员（403 ONCALL_FORBIDDEN）。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult, PageQuery } from '@/services/system/typings';
import type {
  OncallChangeLog,
  OncallGroup,
  OncallGroupMember,
  OncallMemberRole,
  OncallUserCandidate,
} from './typings';

export interface ListGroupsParams extends PageQuery {
  /** 仅返回我所在的分组 */
  mine?: boolean;
}

/** ListGroups 分页查询值班分组 */
export async function listGroups(
  params: ListGroupsParams,
  options?: { silent?: boolean },
): Promise<PagedResult<OncallGroup>> {
  return authRequest<PagedResult<OncallGroup>>('/api/v1/oncall/group', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** CreateGroup 新建分组；创建人自动成为管理员 */
export async function createGroup(body: {
  name: string;
  description?: string;
}): Promise<{ group: OncallGroup }> {
  return authRequest<{ group: OncallGroup }>('/api/v1/oncall/group', {
    method: 'POST',
    data: body,
  });
}

/** GetGroup 查询分组详情；silent 时失败不弹提示（详情页自行展示空状态） */
export async function getGroup(
  id: string,
  options?: { silent?: boolean },
): Promise<{ group: OncallGroup }> {
  return authRequest<{ group: OncallGroup }>(`/api/v1/oncall/group/${id}`, {
    method: 'GET',
    ...options,
  });
}

/** UpdateGroup 修改分组名称与说明 */
export async function updateGroup(
  id: string,
  body: { name: string; description?: string },
): Promise<void> {
  await authRequest<void>(`/api/v1/oncall/group/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteGroup 删除分组；分组下仍有值班表时 409 */
export async function deleteGroup(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/oncall/group/${id}`, { method: 'DELETE' });
}

/** ListGroupMembers 查询分组全部成员（管理员在前） */
export async function listGroupMembers(
  groupId: string,
): Promise<{ items: OncallGroupMember[] }> {
  return authRequest<{ items: OncallGroupMember[] }>(
    `/api/v1/oncall/group/${groupId}/member`,
    { method: 'GET' },
  );
}

/** AddGroupMembers 批量添加成员（已在组内的跳过） */
export async function addGroupMembers(
  groupId: string,
  body: { userIds: string[]; role: OncallMemberRole },
): Promise<{ added?: number }> {
  return authRequest<{ added?: number }>(
    `/api/v1/oncall/group/${groupId}/member`,
    { method: 'POST', data: body },
  );
}

/** UpdateGroupMember 修改成员身份；不能把最后一名管理员降级 */
export async function updateGroupMember(
  groupId: string,
  userId: string,
  role: OncallMemberRole,
): Promise<void> {
  await authRequest<void>(`/api/v1/oncall/group/${groupId}/member/${userId}`, {
    method: 'PUT',
    data: { role },
  });
}

/** RemoveGroupMember 移出成员；仍在轮转名单内或为最后一名管理员时 409 */
export async function removeGroupMember(
  groupId: string,
  userId: string,
): Promise<void> {
  await authRequest<void>(`/api/v1/oncall/group/${groupId}/member/${userId}`, {
    method: 'DELETE',
  });
}

/** ListUserCandidates 可选成员（可用的系统用户，仅 ID 与显示名，最多 50 个） */
export async function listUserCandidates(
  keyword?: string,
): Promise<{ items: OncallUserCandidate[] }> {
  return authRequest<{ items: OncallUserCandidate[] }>(
    '/api/v1/oncall/user-candidate',
    { method: 'GET', params: { keyword: keyword || undefined }, silent: true },
  );
}

/** ListChangeLogs 分页查询分组的变更记录（按时间倒序） */
export async function listChangeLogs(params: {
  page?: number;
  pageSize?: number;
  groupId: string;
  scheduleId?: string;
}): Promise<PagedResult<OncallChangeLog>> {
  return authRequest<PagedResult<OncallChangeLog>>(
    '/api/v1/oncall/change-log',
    { method: 'GET', params },
  );
}
