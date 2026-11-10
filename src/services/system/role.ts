/**
 * RoleService 角色管理：分页查询 / 创建 / 详情 / 更新 / 删除
 */
import type {
  CatalogMenu,
  PageQuery,
  PagedResult,
  RoleGrant,
  RoleStatus,
  SystemRole,
} from './typings';
import { authRequest } from './request';

export interface ListRolesParams extends PageQuery {
  /** 状态过滤：1=启用 0=禁用 */
  status?: RoleStatus;
}

export interface CreateRoleParams {
  /** 1-64 位 */
  name: string;
  /** 2-64 位小写字母/数字/下划线，创建后不可改 */
  code: string;
  /** 未指定默认启用（1） */
  status?: RoleStatus;
  /** 可管理的通知 biz 列表，≤64 项去重；空 = 不限 */
  bizScope?: string[];
}

export interface UpdateRoleParams {
  /** 新角色展示名 */
  name?: string;
  /** 新状态：1=启用 0=禁用 */
  status?: RoleStatus;
  /** 通知 biz 范围整组替换：items 为空 = 清空 = 不限；不传 = 不改 */
  bizScope?: { items: string[] };
}

/** ListRoles 分页查询角色，page_size 上限 100 */
export async function listRoles(
  params: ListRolesParams,
): Promise<PagedResult<SystemRole>> {
  return authRequest<PagedResult<SystemRole>>('/api/v1/system/role', {
    method: 'GET',
    params,
  });
}

/** CreateRole 创建角色；code 在未删除行内唯一 */
export async function createRole(
  body: CreateRoleParams,
): Promise<{ role: SystemRole }> {
  return authRequest<{ role: SystemRole }>('/api/v1/system/role', {
    method: 'POST',
    data: body,
  });
}

/** GetRole 查询角色详情 */
export async function getRole(id: string): Promise<{ role: SystemRole }> {
  return authRequest<{ role: SystemRole }>(`/api/v1/system/role/${id}`, {
    method: 'GET',
  });
}

/** UpdateRole 更新角色（name / status）；code 不可改 */
export async function updateRole(
  id: string,
  body: UpdateRoleParams,
): Promise<void> {
  await authRequest<void>(`/api/v1/system/role/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** GetRolePermissions 查询角色三类直接授权（菜单/页面元素/接口码） */
export async function getRolePermissions(
  id: string,
): Promise<RoleGrant> {
  return authRequest<RoleGrant>(`/api/v1/system/role/${id}/permission`, {
    method: 'GET',
  });
}

/** SetRolePermissions 全量覆盖角色三类直接授权（三类全空即清空）；菜单/元素仅控前端可见性，接口校验只认 apis */
export async function setRolePermissions(
  id: string,
  grants: RoleGrant,
): Promise<void> {
  await authRequest<void>(`/api/v1/system/role/${id}/permission`, {
    method: 'PUT',
    data: grants,
  });
}

/** ListPermissionCatalog 查询权限目录（菜单→元素→接口三级，供接口勾选联动与从属标记） */
export async function listPermissionCatalog(): Promise<{
  menus: CatalogMenu[];
}> {
  return authRequest<{ menus: CatalogMenu[] }>(
    '/api/v1/system/permission-catalog',
    { method: 'GET' },
  );
}

/** DeleteRole 删除角色（软删），并物理删除其全部用户绑定 */
export async function deleteRole(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/system/role/${id}`, { method: 'DELETE' });
}
