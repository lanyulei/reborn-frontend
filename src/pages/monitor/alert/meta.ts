/**
 * 告警事件页自用的元数据：事件操作的权限判断、时间线条目的颜色、表单上限（与 alert.proto /
 * alert_view.proto 的校验一致）。跨页面共用的枚举在 ../components/meta.ts。
 */
import type {
  AlertTimelineType,
  MonitorAlert,
} from '@/services/monitor/typings';
import type { usePermissions } from '@/services/system/permissions';

export const ALERT_LIMITS = {
  transferNoteMax: 500,
  commentMax: 2000,
  closeReasonMax: 255,
  ticketTitleMax: 255,
  viewNameMax: 64,
} as const;

/** 时间线条目的颜色（Timeline 圆点与类型标签同色）；notification 按通知类型另取 */
export const TIMELINE_TYPE_COLOR: Record<AlertTimelineType, string> = {
  fire: 'red',
  resolve: 'green',
  close: 'gray',
  mute: 'gray',
  unmute: 'gray',
  inhibit: 'gray',
  uninhibit: 'gray',
  escalate: 'purple',
  notify: 'blue',
  ack: 'blue',
  unack: 'orange',
  transfer: 'blue',
  comment: 'blue',
  ticket: 'cyan',
  ticket_note: 'cyan',
  workflow: 'cyan',
  ai_summary: 'purple',
  action_failed: 'red',
  notification: 'blue',
};

/** 关闭缘由（时间线 close 条目的 cause）里有文案的取值 */
export const CLOSE_CAUSES: readonly string[] = ['manual', 'rule'];
/** 事件动作（时间线 action_failed 条目的 actionKind）里有文案的取值 */
export const ACTION_KINDS: readonly number[] = [1, 2, 3, 4];

export type AlertOp =
  | 'ack'
  | 'unack'
  | 'transfer'
  | 'comment'
  | 'close'
  | 'ticket';

export interface AlertOpState {
  /** 是否渲染：元素权限 + 事件状态决定 */
  show: boolean;
  /** 是否可用：数据范围决定（canAck / canManage）；false 时置灰并提示 */
  enabled: boolean;
}

type Has = ReturnType<typeof usePermissions>;

/**
 * 各事件操作对当前用户的状态。元素权限决定渲染，数据范围决定可用：
 * 认领 / 取消认领 / 转交 / 备注要求 canAck，手动关闭 / 转工单要求 canManage；认领、转交、关闭只对
 * 告警中的事件。仅作为通知对象查看（canViewRule=false）时没有任何操作。
 */
export const alertOpStates = (
  alert: MonitorAlert,
  has: Has,
  canViewRule = true,
): Record<AlertOp, AlertOpState> => {
  const firing = (alert.status ?? 1) === 1;
  const canAck = alert.canAck === true;
  const canManage = alert.canManage === true;
  const ack = canViewRule && has('monitor.alert.ack') && firing;
  return {
    ack: { show: ack && !alert.ackUserId, enabled: canAck },
    // 认领人本人或对分组「可管理」的人才能取消：由后端判定，失败时提示其原因
    unack: { show: ack && !!alert.ackUserId, enabled: canAck },
    transfer: { show: ack, enabled: canAck },
    comment: {
      show: canViewRule && has('monitor.alert.comment'),
      enabled: canAck,
    },
    // 已下达关闭、引擎尚未执行时不再提供（界面上显示「关闭中」）
    close: {
      show:
        canViewRule && has('monitor.alert.close') && firing && !alert.closing,
      enabled: canManage,
    },
    // 一个事件只能关联一张工单；proto 不限制事件状态
    ticket: {
      show: canViewRule && has('monitor.alert.ticket') && !alert.ticketId,
      enabled: canManage,
    },
  };
};

/** 事件在弹窗 / 批量结果里的一行说明：规则名 + 标签 */
export const alertTitle = (alert: MonitorAlert): string => {
  const labels = Object.entries(alert.labels ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
  const name = alert.ruleName || alert.id;
  return labels ? `${name} {${labels}}` : name;
};
