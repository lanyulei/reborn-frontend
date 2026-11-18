/**
 * MonitorInhibitService 抑制规则：存在满足「源条件」的活跃告警时，抑制满足「目标条件」且相等标签
 * 取值相同的告警的通知（语义同 Alertmanager inhibit）；被抑制的事件照常留档并标注被谁抑制。
 * 查看要求对作用分组「只读」以上，维护要求「可管理」；作用于全部分组的抑制规则仅超级管理员可维护。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { monitorRequest } from './request';
import type {
  InhibitPreviewResult,
  InhibitSpec,
  MonitorInhibit,
} from './typings';

export interface ListInhibitsParams extends PageQuery {
  /** 作用分组过滤（含全部下级） */
  groupId?: string;
  enabled?: boolean;
}

/** ListInhibits 分页查询抑制规则 */
export async function listInhibits(
  params: ListInhibitsParams,
): Promise<PagedResult<MonitorInhibit>> {
  return monitorRequest<PagedResult<MonitorInhibit>>(
    '/api/v1/monitor/inhibit',
    { method: 'GET', params },
  );
}

/** GetInhibit 查询抑制规则详情 */
export async function getInhibit(
  id: string,
): Promise<{ inhibit: MonitorInhibit }> {
  return monitorRequest<{ inhibit: MonitorInhibit }>(
    `/api/v1/monitor/inhibit/${id}`,
    { method: 'GET' },
  );
}

/** CreateInhibit 新建抑制规则 */
export async function createInhibit(
  spec: InhibitSpec,
): Promise<{ inhibit: MonitorInhibit }> {
  return monitorRequest<{ inhibit: MonitorInhibit }>(
    '/api/v1/monitor/inhibit',
    { method: 'POST', data: { spec } },
  );
}

/** UpdateInhibit 编辑抑制规则（整体替换）；version 不一致 409 */
export async function updateInhibit(
  id: string,
  body: { spec: InhibitSpec; version: number },
): Promise<{ inhibit: MonitorInhibit }> {
  return monitorRequest<{ inhibit: MonitorInhibit }>(
    `/api/v1/monitor/inhibit/${id}`,
    { method: 'PUT', data: body },
  );
}

/** DeleteInhibit 删除抑制规则 */
export async function deleteInhibit(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/inhibit/${id}`, {
    method: 'DELETE',
  });
}

/** PreviewInhibit 保存前预览：当前满足源条件的活跃告警，与会被抑制的活跃告警（各至多 50 条） */
export async function previewInhibit(
  spec: InhibitSpec,
): Promise<InhibitPreviewResult> {
  return monitorRequest<InhibitPreviewResult>(
    '/api/v1/monitor/inhibit:preview',
    { method: 'POST', data: { spec } },
  );
}
