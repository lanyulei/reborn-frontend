/**
 * NotifySilenceService 通知静默（免打扰）管理：事件命中任一启用静默规则
 * （event_pattern 匹配 + severity ≤ severity_max + 当前时间落时间窗）即置
 * suppressed，不再生成通知任务。更新语义与路由一致：spec 整组替换，
 * enabled 独立启停。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type { NotifySilence, SilenceWindow } from './typings';

/** SilenceSpecPayload 静默规则载荷（创建/更新共用，整组替换） */
export interface SilenceSpecPayload {
  /** 事件匹配模式：精确 / 前缀通配（'monitor.alert.*'）/ 全匹配（'*'），与路由同式 */
  eventPattern: string;
  /** 严重级上限（1-4），该级及以下的事件才可被静默，未指定默认 2 */
  severityMax?: number;
  /** 免打扰时间窗；缺省全程静默（整组替换语义下更新不传即清除窗口） */
  timeWindow?: SilenceWindow;
}

export interface ListSilencesParams extends PageQuery {
  /** 启用状态过滤 */
  enabled?: boolean;
  /** 业务过滤；biz 受限用户必填（否则 NOTIFY_BIZ_REQUIRED） */
  bizId?: string;
}

/** CreateSilence 创建静默规则 */
export async function createSilence(body: {
  /** 业务租户标识，未指定默认 default；受限用户须在可管范围内 */
  bizId?: string;
  spec: SilenceSpecPayload;
  /** 未指定默认启用 */
  enabled?: boolean;
}): Promise<{ silence: NotifySilence }> {
  return authRequest<{ silence: NotifySilence }>('/api/v1/notify/silence', {
    method: 'POST',
    data: body,
  });
}

/** GetSilence 查询静默规则详情 */
export async function getSilence(
  id: string,
): Promise<{ silence: NotifySilence }> {
  return authRequest<{ silence: NotifySilence }>(
    `/api/v1/notify/silence/${id}`,
    { method: 'GET' },
  );
}

/** UpdateSilence 更新静默规则：spec 与 enabled 至少传其一；biz_id 不可改 */
export async function updateSilence(
  id: string,
  body: { spec?: SilenceSpecPayload; enabled?: boolean },
): Promise<void> {
  await authRequest<void>(`/api/v1/notify/silence/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteSilence 删除静默规则（软删） */
export async function deleteSilence(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/notify/silence/${id}`, { method: 'DELETE' });
}

/** ListSilences 分页查询静默规则，page_size 上限 100 */
export async function listSilences(
  params: ListSilencesParams,
): Promise<PagedResult<NotifySilence>> {
  return authRequest<PagedResult<NotifySilence>>('/api/v1/notify/silence', {
    method: 'GET',
    params,
  });
}
