/**
 * NotifySubscriptionService 用户订阅管理（订阅中心）：本人或 admin 代管。
 * 自然键 (user_id, biz_id, event_pattern) 唯一，保存为 Upsert 语义
 * （存在即整组替换偏好与启停，不存在即新建）。路由收件策略 subscription
 * 开启时，管道按用户 channel_prefs 与路由实例类型的交集解析订阅者。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type { NotifySubscription, SubscriptionPref } from './typings';

export interface UpsertSubscriptionParams {
  /** 目标用户，缺省=操作者本人，指定他人须 admin（代管） */
  userId?: string;
  /** 业务租户标识，未指定默认 default（订阅为用户侧自服务，不受 biz 范围守卫约束） */
  bizId?: string;
  /** 事件匹配模式，与路由同式 */
  eventPattern: string;
  /** 渠道偏好，至少 1 项；key 限 email/dingtalk/wecom/feishu（webhook 非用户可达） */
  channelPrefs: Record<string, SubscriptionPref>;
  /** 未指定默认启用 */
  enabled?: boolean;
}

export interface ListSubscriptionsParams extends PageQuery {
  /** 目标用户，缺省=本人，指定他人须 admin（代管） */
  userId?: string;
  /** 启用状态过滤 */
  enabled?: boolean;
}

/** UpsertSubscription 保存订阅：同自然键重复保存=替换渠道偏好与启停 */
export async function upsertSubscription(
  body: UpsertSubscriptionParams,
): Promise<{ subscription: NotifySubscription }> {
  return authRequest<{ subscription: NotifySubscription }>(
    '/api/v1/notify/subscription',
    { method: 'POST', data: body },
  );
}

/** DeleteSubscription 删除订阅（软删，同键可重建）；仅订阅本人或 admin */
export async function deleteSubscription(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/notify/subscription/${id}`, {
    method: 'DELETE',
  });
}

/** ListSubscriptions 分页查询订阅，page_size 上限 100 */
export async function listSubscriptions(
  params: ListSubscriptionsParams,
): Promise<PagedResult<NotifySubscription>> {
  return authRequest<PagedResult<NotifySubscription>>(
    '/api/v1/notify/subscription',
    { method: 'GET', params },
  );
}
