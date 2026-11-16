/**
 * DeptService 部门管理（组织架构）：部门树查询 / 创建 / 更新 / 移动 / 删除 /
 * 成员添加与移除。用户所属部门的整组维护走 UserService（见 user.ts 的 depts）。
 */
import { authRequest } from './request';
import type {
  DeptMember,
  DeptStatus,
  PagedResult,
  SystemDept,
} from './typings';

export interface CreateDeptParams {
  /** 上级部门 ID；不传 = 根部门 */
  parentId?: string;
  /** 1-64 位，同一上级下唯一 */
  name: string;
  /** 2-64 位字母/数字/下划线/中划线，可选 */
  code?: string;
  /** 同级排序值，升序，0-9999 */
  sort?: number;
  description?: string;
  /** 负责人用户 ID，按顺序，最多 20 个 */
  leaderIds?: string[];
}

export interface UpdateDeptParams {
  name?: string;
  /** 传空串 = 清空 */
  code?: string;
  sort?: number;
  status?: DeptStatus;
  description?: string;
  /** 负责人整组替换：userIds 为空 = 清空；不传 = 不改 */
  leaders?: { userIds: string[] };
}

/** ListDepts 查询全部部门（平铺；上级在前，同级按 sort、创建时间升序） */
export async function listDepts(options?: {
  /** silent：辅助性查询（部门选择器 / 名称映射）无权限时不弹错误 */
  silent?: boolean;
}): Promise<{ items: SystemDept[] }> {
  return authRequest<{ items: SystemDept[] }>('/api/v1/system/dept', {
    method: 'GET',
    silent: options?.silent,
  });
}

/** GetDept 查询部门详情（含负责人） */
export async function getDept(id: string): Promise<{ dept: SystemDept }> {
  return authRequest<{ dept: SystemDept }>(`/api/v1/system/dept/${id}`, {
    method: 'GET',
  });
}

/** CreateDept 创建部门；同一上级下名称唯一，层级上限 10 */
export async function createDept(
  body: CreateDeptParams,
): Promise<{ dept: SystemDept }> {
  return authRequest<{ dept: SystemDept }>('/api/v1/system/dept', {
    method: 'POST',
    data: body,
  });
}

/** UpdateDept 更新部门资料与负责人（可选字段，传哪个改哪个） */
export async function updateDept(
  id: string,
  body: UpdateDeptParams,
): Promise<{ dept: SystemDept }> {
  return authRequest<{ dept: SystemDept }>(`/api/v1/system/dept/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** MoveDept 调整部门的上级（连同整棵子树）；parentId 不传 = 移为根部门 */
export async function moveDept(id: string, parentId?: string): Promise<void> {
  await authRequest<void>(`/api/v1/system/dept/${id}/move`, {
    method: 'POST',
    data: { parentId },
  });
}

/** DeleteDept 删除部门（软删）；存在下级部门或成员时拒绝 */
export async function deleteDept(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/system/dept/${id}`, { method: 'DELETE' });
}

/** AddDeptMembers 把用户加入部门（已在部门内的跳过） */
export async function addDeptMembers(
  id: string,
  userIds: string[],
): Promise<void> {
  await authRequest<void>(`/api/v1/system/dept/${id}/member`, {
    method: 'POST',
    data: { userIds },
  });
}

/** ListDeptMembers 分页查询部门成员（最小披露，不含邮箱 / 手机号） */
export async function listDeptMembers(
  id: string,
  params: {
    page?: number;
    pageSize?: number;
    /** 是否包含全部下级部门的成员 */
    includeSubDepts?: boolean;
    /** 登录名 / 昵称模糊匹配 */
    keyword?: string;
  },
): Promise<PagedResult<DeptMember>> {
  return authRequest<PagedResult<DeptMember>>(
    `/api/v1/system/dept/${id}/member`,
    { method: 'GET', params },
  );
}

/** ListUserCandidates 可选用户（可用的系统用户，仅 ID 与显示名，最多 50 个） */
export async function listDeptUserCandidates(
  keyword?: string,
): Promise<{ items: { id: string; username: string; nickname: string }[] }> {
  return authRequest('/api/v1/system/dept-user-candidate', {
    method: 'GET',
    params: { keyword: keyword || undefined },
    silent: true,
  });
}

/** RemoveDeptMember 把用户移出部门 */
export async function removeDeptMember(
  id: string,
  userId: string,
): Promise<void> {
  await authRequest<void>(`/api/v1/system/dept/${id}/member/${userId}`, {
    method: 'DELETE',
  });
}
