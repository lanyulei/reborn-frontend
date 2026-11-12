/**
 * CmdbScopeService 数据范围：角色可见的资源类型与环境。
 */
import { authRequest } from '@/services/system/request';

export interface RoleScope {
  roleId: string;
  roleName?: string;
  roleCode?: string;
  /** 空 = 不限 */
  modelCodes: string[];
  /** 空 = 不限 */
  envs: string[];
}

export interface MyScope {
  unrestricted: boolean;
  modelCodes: string[];
  envs: string[];
}

export async function listRoleScopes(): Promise<{ items: RoleScope[] }> {
  return authRequest<{ items: RoleScope[] }>('/api/v1/cmdb/scope/role', {
    method: 'GET',
  });
}

export async function setRoleScope(
  roleId: string,
  body: { modelCodes: string[]; envs: string[] },
): Promise<{ scope: RoleScope }> {
  return authRequest<{ scope: RoleScope }>(`/api/v1/cmdb/scope/role/${roleId}`, {
    method: 'PUT',
    data: body,
  });
}

export async function getMyScope(): Promise<MyScope> {
  return authRequest<MyScope>('/api/v1/cmdb/scope/me', { method: 'GET' });
}
