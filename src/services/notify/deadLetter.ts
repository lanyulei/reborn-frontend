/**
 * NotifyDeadLetterService 死信重放：查询运行表 notify_dlq（sender 在任务
 * 重试超限后写入），并标记重放。重放是控制台唯一的写动作：replay_state
 * 仅允许 none → pending（条件更新保证状态机），dlq worker 轮询 pending 行
 * 重新生成任务后置 replayed。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult } from '@/services/system/typings';
import type {
  NotifyDeadLetter,
  NotifyReplayState,
  NotifyTimeRangeQuery,
} from './typings';

export interface ListDeadLettersParams extends NotifyTimeRangeQuery {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页数量，1-100 */
  pageSize?: number;
  /** 源事件过滤，精确匹配（事件 → 死信下钻） */
  eventId?: string;
  /** 投递渠道过滤，精确匹配 */
  channelId?: string;
  /** 重放状态过滤：1 none / 2 pending / 3 replayed */
  replayState?: NotifyReplayState;
}

/** ListDeadLetters 分页查询死信，page_size 上限 100；按转入时间倒序 */
export async function listDeadLetters(
  params: ListDeadLettersParams,
): Promise<PagedResult<NotifyDeadLetter>> {
  return authRequest<PagedResult<NotifyDeadLetter>>(
    '/api/v1/notify/dead-letter',
    { method: 'GET', params },
  );
}

/** ReplayDeadLetter 标记死信待重放（replay_state: none → pending），返回更新后的行；
 * 仅 replay_state=none 的行可标记，否则 409 */
export async function replayDeadLetter(
  id: string,
): Promise<{ deadLetter: NotifyDeadLetter }> {
  return authRequest<{ deadLetter: NotifyDeadLetter }>(
    `/api/v1/notify/dead-letter/${id}:replay`,
    { method: 'POST', data: {} },
  );
}
