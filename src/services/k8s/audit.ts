/** K8sAuditService 操作审计与终端会话记录（只读）。缺省回看 7 天，跨度上限 90 天。 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { k8sRequest } from './request';
import type { ExecSession, K8sAudit } from './typings';

export interface ListAuditsParams extends PageQuery {
  createTimeStart?: string;
  createTimeEnd?: string;
  clusterId?: string;
  namespace?: string;
  resource?: string;
  name?: string;
  action?: string;
  userId?: string;
  result?: number;
  keyword?: string;
}

export async function listAudits(
  params: ListAuditsParams,
  options?: { silent?: boolean },
): Promise<PagedResult<K8sAudit>> {
  return k8sRequest<PagedResult<K8sAudit>>('/api/v1/k8s/audit', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

export async function getAudit(id: string): Promise<{ audit: K8sAudit }> {
  return k8sRequest<{ audit: K8sAudit }>(`/api/v1/k8s/audit/${id}`, {
    method: 'GET',
  });
}

export interface ListExecSessionsParams extends PageQuery {
  startTimeStart?: string;
  startTimeEnd?: string;
  clusterId?: string;
  userId?: string;
  keyword?: string;
}

export async function listExecSessions(
  params: ListExecSessionsParams,
): Promise<PagedResult<ExecSession>> {
  return k8sRequest<PagedResult<ExecSession>>('/api/v1/k8s/exec-session', {
    method: 'GET',
    params,
  });
}
