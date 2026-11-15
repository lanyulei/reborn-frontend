/**
 * OncallScheduleService 值班表与班次：值班表配置 / 排班预览 / 班次查询 / 替班 /
 * 当前值班人。保存配置即重排全部尚未开始的自动班次。
 */
import { authRequest } from '@/services/system/request';
import type {
  OncallCurrentDuty,
  OncallNotificationStatus,
  OncallNotifyKind,
  OncallNotifyRecipient,
  OncallNotifyResult,
  OncallNotifyTarget,
  OncallSchedule,
  OncallScheduleConfig,
  OncallScheduleStatus,
  OncallShift,
  OncallShiftIssue,
  OncallShiftRole,
} from './typings';

/** ListSchedules 查询值班表（可按分组过滤），不分页 */
export async function listSchedules(
  groupId?: string,
): Promise<{ items: OncallSchedule[] }> {
  return authRequest<{ items: OncallSchedule[] }>('/api/v1/oncall/schedule', {
    method: 'GET',
    params: { groupId: groupId || undefined },
  });
}

/** CreateSchedule 新建值班表并生成班次 */
export async function createSchedule(body: {
  groupId: string;
  config: OncallScheduleConfig;
}): Promise<{ schedule: OncallSchedule }> {
  return authRequest<{ schedule: OncallSchedule }>('/api/v1/oncall/schedule', {
    method: 'POST',
    data: body,
  });
}

/** GetSchedule 查询值班表详情；silent 时失败不弹提示 */
export async function getSchedule(
  id: string,
  options?: { silent?: boolean },
): Promise<{ schedule: OncallSchedule }> {
  return authRequest<{ schedule: OncallSchedule }>(
    `/api/v1/oncall/schedule/${id}`,
    { method: 'GET', ...options },
  );
}

/** UpdateSchedule 修改配置（整体替换）并重排尚未开始的自动班次 */
export async function updateSchedule(
  id: string,
  config: OncallScheduleConfig,
): Promise<{ schedule: OncallSchedule }> {
  return authRequest<{ schedule: OncallSchedule }>(
    `/api/v1/oncall/schedule/${id}`,
    { method: 'PUT', data: { config } },
  );
}

/** UpdateScheduleStatus 启用 / 停用值班表 */
export async function updateScheduleStatus(
  id: string,
  status: OncallScheduleStatus,
): Promise<void> {
  await authRequest<void>(`/api/v1/oncall/schedule/${id}/status`, {
    method: 'PUT',
    data: { status },
  });
}

/** DeleteSchedule 删除值班表（班次一并清除，公共地址随之失效） */
export async function deleteSchedule(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/oncall/schedule/${id}`, {
    method: 'DELETE',
  });
}

/**
 * SendScheduleNotification 手动发送值班通知（分组管理员）：自动通知没有发出时补发。
 * 同一张值班表、同一种通知每分钟至多一次；失败静默抛出由调用方展示。
 */
export async function sendScheduleNotification(
  id: string,
  body: { kind: OncallNotifyKind; target?: OncallNotifyTarget },
): Promise<{ eventIds?: string[]; recipients?: OncallNotifyRecipient[] }> {
  return authRequest<{
    eventIds?: string[];
    recipients?: OncallNotifyRecipient[];
  }>(`/api/v1/oncall/schedule/${id}/notification`, {
    method: 'POST',
    data: body,
  });
}

/** ListScheduleNotificationResults 查询手动发送的通知的投递结果（轮询用，失败静默） */
export async function listScheduleNotificationResults(
  id: string,
  eventIds: string[],
): Promise<{ items?: OncallNotifyResult[] }> {
  // 重复参数写成 eventIds=a&eventIds=b（后端按此解析；默认的数组序列化会带 []）
  const query = eventIds
    .map((eventId) => `eventIds=${encodeURIComponent(eventId)}`)
    .join('&');
  return authRequest<{ items?: OncallNotifyResult[] }>(
    `/api/v1/oncall/schedule/${id}/notification?${query}`,
    { method: 'GET', silent: true },
  );
}

/** GetNotificationStatus 值班通知是否配通（只读检查；失败静默，由调用方按「未知」处理） */
export async function getNotificationStatus(): Promise<{
  items?: OncallNotificationStatus[];
}> {
  return authRequest<{ items?: OncallNotificationStatus[] }>(
    '/api/v1/oncall/notification-status',
    { method: 'GET', silent: true },
  );
}

export interface PreviewScheduleResult {
  items?: OncallShift[];
  issues?: OncallShiftIssue[];
}

/** PreviewSchedule 用草稿配置预览排班与异常，不写库；失败静默抛出由调用方展示 */
export async function previewSchedule(body: {
  groupId: string;
  scheduleId?: string;
  config: OncallScheduleConfig;
  /** 预览天数 7-90；缺省 30 */
  days?: number;
}): Promise<PreviewScheduleResult> {
  return authRequest<PreviewScheduleResult>('/api/v1/oncall/schedule:preview', {
    method: 'POST',
    data: body,
    silent: true,
  });
}

export interface ListShiftsParams {
  /** 范围开始（含），RFC3339 */
  startTime: string;
  /** 范围结束（不含）；与开始相距不超过 100 天 */
  endTime: string;
  groupId?: string;
  scheduleId?: string;
  userId?: string;
  /** 仅返回我的班次（优先于 userId） */
  mine?: boolean;
}

export interface ListShiftsResult {
  items?: OncallShift[];
  issues?: OncallShiftIssue[];
}

/** ListShifts 按时间范围查询班次，并返回范围内的排班异常 */
export async function listShifts(
  params: ListShiftsParams,
): Promise<ListShiftsResult> {
  return authRequest<ListShiftsResult>('/api/v1/oncall/shift', {
    method: 'GET',
    params,
  });
}

/** CreateOverride 替班：把某段时间的值班人换成另一名分组成员 */
export async function createOverride(body: {
  scheduleId: string;
  role: OncallShiftRole;
  userId: string;
  startTime: string;
  endTime: string;
  remark?: string;
}): Promise<{ items?: OncallShift[] }> {
  return authRequest<{ items?: OncallShift[] }>(
    '/api/v1/oncall/shift/override',
    { method: 'POST', data: body },
  );
}

/** RevokeOverride 撤销替班：恢复为自动排班结果 */
export async function revokeOverride(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/oncall/shift/override/${id}`, {
    method: 'DELETE',
  });
}

/** GetCurrentDuty 此刻的值班人与下一次交接时间；两个条件都不传返回全部启用的值班表 */
export async function getCurrentDuty(
  params: { groupId?: string; scheduleId?: string } = {},
  options?: { silent?: boolean },
): Promise<{ items?: OncallCurrentDuty[] }> {
  return authRequest<{ items?: OncallCurrentDuty[] }>(
    '/api/v1/oncall/current',
    { method: 'GET', params, ...options },
  );
}
