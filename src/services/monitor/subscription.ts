/**
 * MonitorSubscriptionService 告警订阅规则：按规则分组 / 规则 / 数据源 / 级别 / 事件标签订阅
 * 告警，命中时另发一条订阅通知给接收方（与规则自身的通知对象互相独立）。只能订阅自己可访问
 * 分组内的告警；为他人或群建订阅需要对所选分组「可管理」。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { monitorRequest } from './request';
import type {
  AlertPreviewResult,
  AlertSubscriptionSpec,
  MonitorAlertSubscription,
} from './typings';

export interface ListAlertSubscriptionsParams extends PageQuery {
  /** mine 我的订阅 / all 数据范围内的全部订阅 */
  scope: 'mine' | 'all';
  enabled?: boolean;
  /** 订阅分组过滤（订阅了该分组或其上级） */
  groupId?: string;
}

/** ListAlertSubscriptions 分页查询订阅规则 */
export async function listAlertSubscriptions(
  params: ListAlertSubscriptionsParams,
): Promise<PagedResult<MonitorAlertSubscription>> {
  return monitorRequest<PagedResult<MonitorAlertSubscription>>(
    '/api/v1/monitor/subscription',
    { method: 'GET', params },
  );
}

/** GetAlertSubscription 查询订阅规则详情 */
export async function getAlertSubscription(
  id: string,
): Promise<{ subscription: MonitorAlertSubscription }> {
  return monitorRequest<{ subscription: MonitorAlertSubscription }>(
    `/api/v1/monitor/subscription/${id}`,
    { method: 'GET' },
  );
}

/** CreateAlertSubscription 新建订阅规则；当前用户成为所有者 */
export async function createAlertSubscription(
  spec: AlertSubscriptionSpec,
): Promise<{ subscription: MonitorAlertSubscription }> {
  return monitorRequest<{ subscription: MonitorAlertSubscription }>(
    '/api/v1/monitor/subscription',
    { method: 'POST', data: { spec } },
  );
}

/** UpdateAlertSubscription 编辑订阅规则（整体替换）；version 不一致 409 */
export async function updateAlertSubscription(
  id: string,
  body: { spec: AlertSubscriptionSpec; version: number },
): Promise<{ subscription: MonitorAlertSubscription }> {
  return monitorRequest<{ subscription: MonitorAlertSubscription }>(
    `/api/v1/monitor/subscription/${id}`,
    { method: 'PUT', data: body },
  );
}

/** DeleteAlertSubscription 删除订阅规则 */
export async function deleteAlertSubscription(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/subscription/${id}`, {
    method: 'DELETE',
  });
}

/** PreviewAlertSubscription 保存前预览：当前活跃告警与最近 24 小时历史告警中会命中的事件 */
export async function previewAlertSubscription(
  spec: AlertSubscriptionSpec,
): Promise<AlertPreviewResult> {
  return monitorRequest<AlertPreviewResult>(
    '/api/v1/monitor/subscription:preview',
    { method: 'POST', data: { spec } },
  );
}
