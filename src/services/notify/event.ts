/**
 * NotifyEventService 通知事件查询：只读运行表 notify_event（管道写 / core 读）。
 * 事件是 append-only 运行数据——先落库后应答，无管理写路径；本服务仅提供
 * 控制台排障检索（biz/事件类型/状态/时间四维过滤，event_type 为精确匹配）。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult } from '@/services/system/typings';
import type { NotifyEvent, NotifyEventStatus, NotifyTimeRangeQuery } from './typings';

export interface ListEventsParams extends NotifyTimeRangeQuery {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页数量，1-100 */
  pageSize?: number;
  /** 业务租户标识过滤，精确匹配 */
  bizId?: string;
  /** 事件类型过滤，精确匹配 */
  eventType?: string;
  /** 路由状态过滤：1 received / 2 routed / 3 suppressed / 4 failed */
  status?: NotifyEventStatus;
}

/** ListEvents 分页查询事件，page_size 上限 100；按落库时间倒序 */
export async function listEvents(
  params: ListEventsParams,
): Promise<PagedResult<NotifyEvent>> {
  return authRequest<PagedResult<NotifyEvent>>('/api/v1/notify/event', {
    method: 'GET',
    params,
  });
}
