/**
 * UserService 用户管理：分页查询 / 创建 / 详情 / 更新 / 删除 /
 * 重置密码 / 角色绑定查询与全量覆盖 / 状态变更
 */
import type {
  Gender,
  PageQuery,
  PagedResult,
  SystemRole,
  SystemUser,
  CreateMachineUserParams,
  UserDeptAssignment,
  UserKind,
  UserStatus,
} from './typings';
import { authRequest } from './request';

export interface ListUsersParams extends PageQuery {
  /** 状态过滤：1=可用 2=停用 3=暂停 4=离职 */
  status?: UserStatus;
  /** 部门过滤：只返回属于该部门的用户 */
  deptId?: string;
  /** 与 deptId 同用：是否包含其全部下级部门的用户 */
  includeSubDepts?: boolean;
  /** 账号类型过滤：1=人 2=机器 */
  kind?: UserKind;
}

export interface CreateUserParams {
  /** 3-64 位字母/数字/下划线/中划线 */
  username: string;
  /** 8-64 位明文 */
  password: string;
  /** 1-64 位 */
  nickname: string;
  /** 可选 */
  email?: string;
  /** 可选 */
  phone?: string;
  /** 必填：male / female / unknown */
  gender: Gender;
  isAdmin: boolean;
  /** 未指定默认可用（1） */
  status?: UserStatus;
  /** 所属部门，可选；与建号同事务写入 */
  depts?: UserDeptAssignment;
}

export interface UpdateUserParams {
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  isAdmin?: boolean;
  /** 所属部门整组替换；不传 = 不改，deptIds 为空 = 移出全部部门 */
  depts?: UserDeptAssignment;
}

/** ListUsers 分页查询用户，page_size 上限 100 */
export async function listUsers(
  params: ListUsersParams,
  /** silent：辅助性查询（如 id→名称映射）无权限时不弹错误 */
  options?: { silent?: boolean },
): Promise<PagedResult<SystemUser>> {
  return authRequest<PagedResult<SystemUser>>('/api/v1/system/user', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** CreateUser 创建用户；username/email/phone 在未删除行内唯一 */
export async function createUser(
  body: CreateUserParams,
): Promise<{ user: SystemUser }> {
  return authRequest<{ user: SystemUser }>('/api/v1/system/user', {
    method: 'POST',
    data: body,
  });
}

/** CreateMachineUser 新建机器账号：没有口令、不能登录，只绑指定角色 */
export async function createMachineUser(
  body: CreateMachineUserParams,
): Promise<{ user: SystemUser }> {
  return authRequest<{ user: SystemUser }>('/api/v1/system/user:machine', {
    method: 'POST',
    data: body,
  });
}

/** GetUser 查询用户详情，绝不返回密码 */
export async function getUser(id: string): Promise<{ user: SystemUser }> {
  return authRequest<{ user: SystemUser }>(`/api/v1/system/user/${id}`, {
    method: 'GET',
  });
}

/** UpdateUser 更新用户资料（可选字段，传哪个改哪个）；username 不可改 */
export async function updateUser(
  id: string,
  body: UpdateUserParams,
): Promise<void> {
  await authRequest<void>(`/api/v1/system/user/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteUser 删除用户（软删），并物理删除其全部角色绑定 */
export async function deleteUser(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/system/user/${id}`, { method: 'DELETE' });
}

/** ResetUserPassword 管理员重置用户密码 */
export async function resetUserPassword(
  id: string,
  password: string,
): Promise<void> {
  await authRequest<void>(`/api/v1/system/user/${id}/password`, {
    method: 'POST',
    data: { password },
  });
}

/** ListUserRoles 查询用户已绑定的角色列表 */
export async function listUserRoles(
  id: string,
): Promise<{ items: SystemRole[] }> {
  return authRequest<{ items: SystemRole[] }>(
    `/api/v1/system/user/${id}/role`,
    { method: 'GET' },
  );
}

/** BindUserRoles 全量覆盖用户的角色绑定（空数组清空绑定） */
export async function bindUserRoles(
  id: string,
  roleIds: string[],
): Promise<void> {
  await authRequest<void>(`/api/v1/system/user/${id}/role`, {
    method: 'PUT',
    data: { roleIds },
  });
}

/** UpdateUserStatus 变更用户状态（可用/停用/暂停/离职） */
export async function updateUserStatus(
  id: string,
  status: UserStatus,
): Promise<void> {
  await authRequest<void>(`/api/v1/system/user/${id}/status`, {
    method: 'POST',
    data: { status },
  });
}
