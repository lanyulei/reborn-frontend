/**
 * MonitorRuleGroupService 告警规则分组与角色数据范围：分组是一棵树（至多 5 层），是规则的
 * 归属，也是数据范围的授权单位（授权给角色即包含其全部下级）。
 */
import { monitorRequest } from './request';
import type {
  GroupRoleScope,
  InheritedGroupRoleScope,
  RuleGroup,
} from './typings';

export interface RuleGroupBody {
  name: string;
  description?: string;
  sort?: number;
}

/** ListRuleGroups 查询当前用户可见的全部分组（平铺，上级在前），带当前用户的级别 */
export async function listRuleGroups(options?: {
  silent?: boolean;
}): Promise<{ items?: RuleGroup[]; isAdmin?: boolean }> {
  return monitorRequest<{ items?: RuleGroup[]; isAdmin?: boolean }>(
    '/api/v1/monitor/rule-group',
    { method: 'GET', silent: options?.silent },
  );
}

/** CreateRuleGroup 新建分组；不传 parentId 为顶级分组（仅超级管理员） */
export async function createRuleGroup(
  body: RuleGroupBody & { parentId?: string },
): Promise<{ group: RuleGroup }> {
  return monitorRequest<{ group: RuleGroup }>('/api/v1/monitor/rule-group', {
    method: 'POST',
    data: body,
  });
}

/** UpdateRuleGroup 修改分组名称、说明与排序（不能更换上级） */
export async function updateRuleGroup(
  id: string,
  body: RuleGroupBody,
): Promise<{ group: RuleGroup }> {
  return monitorRequest<{ group: RuleGroup }>(
    `/api/v1/monitor/rule-group/${id}`,
    { method: 'PUT', data: body },
  );
}

/** DeleteRuleGroup 删除分组；仍有下级分组或规则时 409 */
export async function deleteRuleGroup(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/rule-group/${id}`, {
    method: 'DELETE',
  });
}

/** ListGroupRoleScopes 查询某分组上直接授权的角色与从上级继承的授权 */
export async function listGroupRoleScopes(groupId: string): Promise<{
  items?: GroupRoleScope[];
  inherited?: InheritedGroupRoleScope[];
}> {
  return monitorRequest<{
    items?: GroupRoleScope[];
    inherited?: InheritedGroupRoleScope[];
  }>('/api/v1/monitor/role-scope', { method: 'GET', params: { groupId } });
}

/** SetGroupRoleScopes 整组替换某分组的角色授权（传空数组即清空）；仅超级管理员 */
export async function setGroupRoleScopes(body: {
  groupId: string;
  items: { roleId: string; level: 1 | 2 }[];
}): Promise<{ items?: GroupRoleScope[] }> {
  return monitorRequest<{ items?: GroupRoleScope[] }>(
    '/api/v1/monitor/role-scope',
    { method: 'PUT', data: body },
  );
}
