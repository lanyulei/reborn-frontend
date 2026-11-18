/**
 * MonitorAlertService 告警事件：活跃告警 = 告警中；历史告警 = 已恢复或已关闭。
 * 只返回数据范围内的事件，详情另允许该事件的通知对象查看。
 * 事件操作：认领 / 取消认领 / 转交 / 备注要求对事件所在分组「只读」以上（Alert.canAck）；手动关闭 /
 * 转工单要求「可管理」（Alert.canManage）；仅作为通知对象能看到事件的人不能操作。
 */
import type { PagedResult } from '@/services/system/typings';
import { monitorRequest } from './request';
import type {
  AlertAggregate,
  AlertCI,
  AlertImpactCI,
  AlertNotifyLog,
  AlertTicket,
  AlertTimelineItem,
  BatchAlertsResult,
  MonitorAlert,
  MonitorAlertStatus,
  MonitorHandleState,
  MonitorSeverity,
  ShiftAlertCount,
} from './typings';

/** 列表与聚合共用的过滤条件 */
export interface AlertFilterParams {
  /** 分组过滤（含全部下级） */
  groupId?: string;
  datasourceId?: string;
  severities?: MonitorSeverity[];
  muted?: boolean;
  acked?: boolean;
  inhibited?: boolean;
  /** 事件标签过滤，每项形如 name=value，至多 5 项 */
  labels?: string[];
}

export interface ListAlertsParams extends AlertFilterParams {
  page?: number;
  pageSize?: number;
  /** 活跃告警传 [1]，历史告警传 [2, 3] */
  statuses?: MonitorAlertStatus[];
  ruleId?: string;
  /** 规则名称模糊匹配 */
  keyword?: string;
  fireTimeStart?: string;
  fireTimeEnd?: string;
  /** 只看我负责的事件：通知过我的，或由我认领的 */
  mine?: boolean;
  fingerprint?: string;
  /** 关联的 CMDB 资源（资源详情页的告警页签） */
  ciId?: string;
  ackUserId?: string;
  /** 处理状态：1=未认领 2=已认领 3=已屏蔽 4=被抑制 */
  handleState?: MonitorHandleState;
}

/** ListAlerts 分页查询告警事件（按最近触发时间倒序）；silent 时失败不弹提示 */
export async function listAlerts(
  params: ListAlertsParams,
  options?: { silent?: boolean },
): Promise<PagedResult<MonitorAlert>> {
  return monitorRequest<PagedResult<MonitorAlert>>('/api/v1/monitor/alert', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

export interface AlertDetail {
  alert: MonitorAlert;
  /** 通知时间线，按时间升序，至多 200 条 */
  notifyLogs?: AlertNotifyLog[];
  /** 当前用户能否查看该事件的规则；仅作为通知对象查看时为 false */
  canViewRule?: boolean;
  /**
   * 事件时间线，按时间升序，至多 500 条；通知类条目（type=notification）与 notifyLogs 是同一批
   * 记录。收件人视图只含触发 / 恢复 / 关闭与发给本人的通知
   */
  timeline?: AlertTimelineItem[];
  /** 关联的 CMDB 资源卡片；未关联为 null */
  ci?: AlertCI | null;
  /** 影响面：关联资源的下游资源（至多 3 层、50 个） */
  impact?: AlertImpactCI[];
  impactTruncated?: boolean;
  /** 关联的工单；没有为 null */
  ticket?: AlertTicket | null;
}

/**
 * 首次通知没有送达、引擎会自动重试：告警中、未被屏蔽、已通知次数为 0 且通知时间线为空。
 * 仅对能看到规则的完整视图判断——收件人视图的时间线只含发给本人的记录，为空不代表没发过。
 */
export const isFirstNotifyUndelivered = (detail: AlertDetail): boolean =>
  detail.canViewRule === true &&
  (detail.alert.status ?? 1) === 1 &&
  !detail.alert.muted &&
  (detail.alert.notifyCount ?? 0) === 0 &&
  (detail.notifyLogs ?? []).length === 0;

/** GetAlert 查询告警事件详情（含通知时间线）；失败由调用方展示空状态 */
export async function getAlert(id: string): Promise<AlertDetail> {
  return monitorRequest<AlertDetail>(`/api/v1/monitor/alert/${id}`, {
    method: 'GET',
    silent: true,
  });
}

/** AggregateAlerts 活跃告警聚合：by = rule / severity / group / label:<标签名> */
export async function aggregateAlerts(
  params: AlertFilterParams & { by: string },
): Promise<{ items?: AlertAggregate[]; total?: number }> {
  return monitorRequest<{ items?: AlertAggregate[]; total?: number }>(
    '/api/v1/monitor/alert-aggregate',
    { method: 'GET', params, silent: true },
  );
}

const alertAction = <T>(id: string, action: string, data: object = {}) =>
  monitorRequest<T>(`/api/v1/monitor/alert/${id}:${action}`, {
    method: 'POST',
    data,
  });

/**
 * AckAlert 认领：只能认领告警中的事件（409 MONITOR_ALERT_NOT_FIRING）；已被本人认领原样返回，
 * 已被他人认领 409 MONITOR_ALERT_ALREADY_ACKED（需要接手时用转交）
 */
export async function ackAlert(id: string): Promise<{ alert: MonitorAlert }> {
  return alertAction(id, 'ack');
}

/** UnackAlert 取消认领：认领人本人，或对事件所在分组「可管理」的人可以取消 */
export async function unackAlert(id: string): Promise<{ alert: MonitorAlert }> {
  return alertAction(id, 'unack');
}

/** TransferAlert 转交（此前未认领时等同于指派）；对方须是可用用户，不能是当前的认领人 */
export async function transferAlert(
  id: string,
  body: { userId: string; note?: string },
): Promise<{ alert: MonitorAlert }> {
  return alertAction(id, 'transfer', body);
}

/** CommentAlert 追加一条备注（1-2000 字符，不能全是空白）；任何状态的事件都可以备注 */
export async function commentAlert(
  id: string,
  text: string,
): Promise<{ item: AlertTimelineItem }> {
  return alertAction(id, 'comment', { text });
}

/**
 * CloseAlert 手动关闭告警中的事件。关闭由评估引擎在下一轮执行：返回时事件多半仍是告警中
 * （alert.closing=true、pending=true），应提示「已提交，稍后生效」并刷新，而不是当成失败
 */
export async function closeAlert(
  id: string,
  reason: string,
): Promise<{ alert: MonitorAlert; pending?: boolean }> {
  return alertAction(id, 'close', { reason });
}

/** BatchAckAlerts 批量认领（至多 200 条）：逐条独立执行，结果逐条返回 */
export async function batchAckAlerts(
  ids: string[],
): Promise<BatchAlertsResult> {
  return monitorRequest<BatchAlertsResult>('/api/v1/monitor/alert:batch-ack', {
    method: 'POST',
    data: { ids },
  });
}

/** BatchCloseAlerts 批量手动关闭（至多 200 条）；成功表示关闭已受理（引擎随后执行） */
export async function batchCloseAlerts(
  ids: string[],
  reason: string,
): Promise<BatchAlertsResult> {
  return monitorRequest<BatchAlertsResult>(
    '/api/v1/monitor/alert:batch-close',
    { method: 'POST', data: { ids, reason } },
  );
}

export interface CreateAlertTicketBody {
  templateId: string;
  /** 不传为「【级别】规则名称」 */
  title?: string;
  /** 1=低 2=普通 3=高 4=紧急；不传（0）按事件级别对应 */
  priority?: number;
  /** 工单表单数据（按模板的字段定义校验） */
  data?: Record<string, unknown>;
  /** 提单部门：须为当前用户所属部门；不传取主部门 */
  creatorDept?: string;
  /** 幂等键（客户端生成的 UUID）：重复提交返回首次创建的工单 */
  requestId?: string;
}

/**
 * CreateAlertTicket 把事件转为工单（提单人为当前用户，事件关联的资源自动作为工单的关联资源）。
 * 一个事件只能关联一张工单（409 MONITOR_ALERT_TICKET_EXISTS）；提单本身的校验失败时返回工单域
 * 的错误码。失败由调用方展示（silent）。
 */
export async function createAlertTicket(
  id: string,
  body: CreateAlertTicketBody,
): Promise<{ ticket: AlertTicket; alert: MonitorAlert }> {
  return monitorRequest(`/api/v1/monitor/alert/${id}:ticket`, {
    method: 'POST',
    data: body,
    silent: true,
  });
}

/**
 * ListShiftAlertCounts 某张值班表在一段时间内（至多 62 天）各班次的告警数；供值班日历展示。
 * 恒静默：没有监控告警权限时调用方不展示，不弹提示。
 */
export async function listShiftAlertCounts(params: {
  scheduleId: string;
  startTime: string;
  endTime: string;
}): Promise<{ items?: ShiftAlertCount[] }> {
  return monitorRequest<{ items?: ShiftAlertCount[] }>(
    '/api/v1/monitor/shift-alert-count',
    { method: 'GET', params, silent: true },
  );
}
