/**
 * NotifyDispatchService 通知发送任务查询：只读运行表 notify_dispatch
 * （管道写 / core 读）。一行 = 路由命中后生成的一个发送任务
 * （事件 × 渠道 × 收件人），状态机由管道 sender 推进（含退避重试与死信
 * 转移）；本服务仅提供控制台排障检索，无写路径。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult } from '@/services/system/typings';
import type {
  NotifyDispatch,
  NotifyDispatchStatus,
  NotifyTimeRangeQuery,
} from './typings';

export interface ListDispatchesParams extends NotifyTimeRangeQuery {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页数量，1-100 */
  pageSize?: number;
  /** 源事件过滤，精确匹配（事件 → 投递任务下钻主路径） */
  eventId?: string;
  /** 目标渠道过滤，精确匹配 */
  channelId?: string;
  /** 任务状态过滤：1 pending / 2 sending / 3 sent / 4 failed / 5 dead */
  status?: NotifyDispatchStatus;
}

/** ListDispatches 分页查询发送任务，page_size 上限 100；按生成时间倒序 */
export async function listDispatches(
  params: ListDispatchesParams,
): Promise<PagedResult<NotifyDispatch>> {
  return authRequest<PagedResult<NotifyDispatch>>('/api/v1/notify/dispatch', {
    method: 'GET',
    params,
  });
}
