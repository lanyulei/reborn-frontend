/**
 * NotifyRouteService 通知路由管理：路由决定事件如何变成通知任务——
 * event_pattern + severity 下限 + 标签匹配筛选事件，命中后对 channel_ids
 * 内每个启用渠道并发生成任务；收件策略 fixed 先行、订阅者追加。
 * 更新语义：spec（规则字段互为整体）整组替换，enabled 独立启停。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type { NotifyRoute, RouteRecipient } from './typings';

/** RouteSpecPayload 路由规则载荷（创建/更新共用，整组替换）；数值调优项可选 */
export interface RouteSpecPayload {
  /** 可读名称（≤64，列表展示）；整组替换语义下不传 / 空串 = 清除 */
  name?: string;
  /** 说明（≤255）；不传 / 空串 = 清除 */
  description?: string;
  /** 事件匹配模式：精确 / 前缀通配（'monitor.alert.*'）/ 全匹配（'*'） */
  eventPattern: string;
  /** 严重级下限（1-4），未指定默认 1 */
  severityMin?: number;
  /** payload 标签匹配条件（扁平键值全部相等才命中）；空/不传 = 无条件 */
  tagMatch?: Record<string, string>;
  /** 优先级 1-9（1 最高），未指定默认 5 */
  priority?: number;
  /** 命中的渠道实例集合（同 biz），至少 1 个、最多 50 个、不可重复 */
  channelIds: string[];
  /** 收件策略：含邮件渠道时 fixed 与 subscription 至少启用其一；Webhook/群机器人以实例为隐含收件，可整组留空 */
  recipient: RouteRecipient;
  /** 聚合窗口秒数，未指定默认 0（不聚合），>0 须 30-300 */
  aggregateWindowS?: number;
  /** 聚合抑制阈值，未指定默认 500 */
  suppressThreshold?: number;
  /** 抑制时长分钟，未指定默认 30 */
  suppressDurationM?: number;
}

export interface ListRoutesParams extends PageQuery {
  /** 关键字：模糊匹配 name / event_pattern */
  keyword?: string;
  /** 启用状态过滤 */
  enabled?: boolean;
  /** 业务过滤；biz 受限用户必填（否则 NOTIFY_BIZ_REQUIRED） */
  bizId?: string;
}

/** CreateRoute 创建路由；channel_ids 须为同 biz 未删除渠道 */
export async function createRoute(body: {
  /** 业务租户标识，未指定默认 default；受限用户须在可管范围内 */
  bizId?: string;
  spec: RouteSpecPayload;
  /** 未指定默认启用 */
  enabled?: boolean;
}): Promise<{ route: NotifyRoute }> {
  return authRequest<{ route: NotifyRoute }>('/api/v1/notify/route', {
    method: 'POST',
    data: body,
  });
}

/** GetRoute 查询路由详情 */
export async function getRoute(
  id: string,
): Promise<{ route: NotifyRoute }> {
  return authRequest<{ route: NotifyRoute }>(`/api/v1/notify/route/${id}`, {
    method: 'GET',
  });
}

/** UpdateRoute 更新路由：spec 与 enabled 至少传其一；biz_id 与 channel_ids 仍须同 biz 存在 */
export async function updateRoute(
  id: string,
  body: { spec?: RouteSpecPayload; enabled?: boolean },
): Promise<void> {
  await authRequest<void>(`/api/v1/notify/route/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteRoute 删除路由（软删）；在途任务照常完成 */
export async function deleteRoute(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/notify/route/${id}`, { method: 'DELETE' });
}

/** ListRoutes 分页查询路由，page_size 上限 100 */
export async function listRoutes(
  params: ListRoutesParams,
): Promise<PagedResult<NotifyRoute>> {
  return authRequest<PagedResult<NotifyRoute>>('/api/v1/notify/route', {
    method: 'GET',
    params,
  });
}
