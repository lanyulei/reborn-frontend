/**
 * NotifyDeliveryLogService 投递明细查询：只读运行表 notify_delivery_log
 * （管道写 / core 读）。一行 = 发送任务的一次投递尝试结果（append-only，
 * 含成功/失败、耗时与渠道侧消息标识）；本服务仅提供控制台排障检索，无写路径。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult } from '@/services/system/typings';
import type { NotifyDeliveryLog, NotifyTimeRangeQuery } from './typings';

export interface ListDeliveryLogsParams extends NotifyTimeRangeQuery {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页数量，1-100 */
  pageSize?: number;
  /** 所属发送任务过滤，精确匹配（任务 → 逐次尝试明细下钻主路径） */
  dispatchId?: string;
  /** 投递渠道过滤，精确匹配 */
  channelId?: string;
  /** 投递结果过滤：true 仅成功 / false 仅失败 */
  ok?: boolean;
}

/** ListDeliveryLogs 分页查询投递明细，page_size 上限 100；按落库时间倒序 */
export async function listDeliveryLogs(
  params: ListDeliveryLogsParams,
): Promise<PagedResult<NotifyDeliveryLog>> {
  return authRequest<PagedResult<NotifyDeliveryLog>>(
    '/api/v1/notify/delivery-log',
    { method: 'GET', params },
  );
}
