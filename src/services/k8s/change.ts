/**
 * K8sChangeService 变更审批：变更单查询与撤回、自助申请（命名空间 / 集群权限）、平台设置。
 *
 * 集群配置了审批模板后，写操作返回 428 K8S_CHANGE_SUBMITTED（metadata 带变更单与工单标识）：
 * 集群此时没有被改动，审批通过后由系统以发起人的身份执行。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import type { ChangeSubmitted } from './approval';
import { k8sRequest } from './request';


/** 变更单状态：1 待审批 2 已批准 3 执行中 4 成功 5 失败 6 审批未通过 7 已撤回 8 已过期 */
export type ChangeStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
/** 类型：1 写操作 2 申请命名空间 3 申请权限 */
export type ChangeKind = 1 | 2 | 3;

export interface ChangeField {
  path: string;
  before?: string;
  after?: string;
}

export interface ChangeItem {
  apiGroup?: string;
  apiVersion?: string;
  resource?: string;
  namespace?: string;
  name?: string;
  kind?: string;
  action?: string;
  beforeYaml?: string;
  afterYaml?: string;
  fields?: ChangeField[];
}

export interface K8sChange {
  id: string;
  kind: ChangeKind;
  clusterId: string;
  clusterName?: string;
  namespace?: string;
  resource?: string;
  resKind?: string;
  name?: string;
  action?: string;
  summary?: string;
  status: ChangeStatus;
  requesterId?: string;
  requesterName?: string;
  ticketId?: string;
  ticketNumber?: string;
  message?: string;
  createTime?: string;
  approveTime?: string;
  expireTime?: string;
  finishTime?: string;
  items?: ChangeItem[];
  applied?: string[];
  params?: string;
}

export interface ChangeSettings {
  namespaceRequestTemplateId?: string;
  permissionRequestTemplateId?: string;
}

export interface RequestCluster {
  id: string;
  name: string;
  displayName?: string;
  env?: string;
}

const BASE = '/api/v1/k8s';

export interface ListChangesParams extends PageQuery {
  scope?: 'mine' | 'all';
  status?: number;
  clusterId?: string;
  keyword?: string;
}

export async function listChanges(
  params: ListChangesParams,
): Promise<PagedResult<K8sChange>> {
  return k8sRequest<PagedResult<K8sChange>>(`${BASE}/change`, {
    method: 'GET',
    params,
  });
}

export async function getChange(id: string): Promise<{ change: K8sChange }> {
  return k8sRequest<{ change: K8sChange }>(`${BASE}/change/${id}`, {
    method: 'GET',
  });
}

export async function cancelChange(id: string): Promise<void> {
  return k8sRequest<void>(`${BASE}/change/${id}:cancel`, {
    method: 'POST',
    data: {},
  });
}

export async function getChangeSettings(options?: {
  silent?: boolean;
}): Promise<{ settings?: ChangeSettings }> {
  return k8sRequest<{ settings?: ChangeSettings }>(`${BASE}/change-setting`, {
    method: 'GET',
    silent: options?.silent,
  });
}

export async function updateChangeSettings(
  settings: ChangeSettings,
): Promise<{ settings?: ChangeSettings }> {
  return k8sRequest<{ settings?: ChangeSettings }>(`${BASE}/change-setting`, {
    method: 'PUT',
    data: { settings },
  });
}

export async function listRequestClusters(): Promise<{
  items?: RequestCluster[];
}> {
  return k8sRequest<{ items?: RequestCluster[] }>(`${BASE}/request-cluster`, {
    method: 'GET',
    silent: true,
  });
}

export interface NamespaceRequestBody {
  name: string;
  quota?: Record<string, string>;
  limitDefault?: Record<string, string>;
  limitDefaultRequest?: Record<string, string>;
  reason?: string;
}

export async function requestNamespace(
  clusterId: string,
  body: NamespaceRequestBody,
): Promise<ChangeSubmitted> {
  return k8sRequest<ChangeSubmitted>(
    `${BASE}/cluster/${clusterId}/namespace-request`,
    { method: 'POST', data: body },
  );
}

export async function requestPermission(
  clusterId: string,
  body: { namespace: string; level: number; reason?: string },
): Promise<ChangeSubmitted> {
  return k8sRequest<ChangeSubmitted>(
    `${BASE}/cluster/${clusterId}/permission-request`,
    { method: 'POST', data: body },
  );
}
