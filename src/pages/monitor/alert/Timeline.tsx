/**
 * 事件时间线：触发、每次通知、升级、认领 / 转交、屏蔽、抑制、备注、工单、恢复 / 关闭等，按时间升序。
 * 通知类条目（type=notification）内嵌一条通知记录，与第一期的「通知时间线」同样展示。
 * 后端新增的类型在旧前端上也要能看：不认识的类型按原样显示类型名与说明，不报错。
 */
import { Link, useAccess } from '@umijs/max';
import { Flex, Tag, Timeline } from 'antd';
import type React from 'react';
import type {
  AlertEventDetail,
  AlertNotifyLog,
  AlertTicket,
  AlertTimelineItem,
  AlertTimelineType,
  MonitorSeverity,
  NamedRef,
} from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { formatTime } from '../components/format';
import { NOTIFY_KIND_META } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { SeverityTag } from '../components/tags';
import { ACTION_KINDS, CLOSE_CAUSES, TIMELINE_TYPE_COLOR } from './meta';
import { TicketLink } from './TicketModal';

const refName = (ref?: NamedRef | null) => ref?.name || ref?.id || '';
const isSeverity = (value?: number): value is MonitorSeverity =>
  value === 1 || value === 2 || value === 3 || value === 4;

/** 通知类型的元数据；不认识的类型（更新的后端）按「触发」处理 */
const notifyKind = (log: AlertNotifyLog) =>
  NOTIFY_KIND_META[log.kind ?? 1] ?? NOTIFY_KIND_META[1];
export const notifyLogColor = (log: AlertNotifyLog) => notifyKind(log).color;

/** 一条通知记录：类型（升级带级数）、第几次、来源、接收方、说明、时间与投递情况 */
export const NotifyLogBody: React.FC<{ log: AlertNotifyLog }> = ({ log }) => {
  const t = useT();
  const access = useAccess();
  const { styles } = useMonitorStyles();
  const kind = notifyKind(log);
  return (
    <>
      <Flex gap={8} wrap align="center">
        <Tag color={kind.color} style={{ marginInlineEnd: 0 }}>
          {t(kind.textId)}
        </Tag>
        {(log.level ?? 0) > 0 && (
          <span>
            {t('pages.monitor.alert.timeline.level', { level: log.level })}
          </span>
        )}
        <span>{t('pages.monitor.alert.notify.seq', { n: log.seq ?? 1 })}</span>
        <span>
          {log.source === 2
            ? t('pages.monitor.alert.notify.source.subscription', {
                name: log.subscriptionName || log.subscriptionId || '',
              })
            : log.source === 3
              ? t('pages.monitor.alert.notify.source.escalation')
              : t('pages.monitor.alert.notify.source.rule')}
        </span>
      </Flex>
      <div style={{ marginTop: 4 }}>
        {(log.recipients ?? []).length > 0 ? (
          (log.recipients ?? []).map((recipient) => (
            <Tag
              key={`${recipient.type}-${recipient.id}`}
              color={recipient.type === 'group' ? 'cyan' : undefined}
            >
              {recipient.name || recipient.id}
            </Tag>
          ))
        ) : (
          <span className={styles.hint}>
            {t('pages.monitor.alert.notify.noRecipient')}
          </span>
        )}
      </div>
      {log.note && <div className={styles.hint}>{log.note}</div>}
      <div className={styles.hint}>
        {formatTime(log.createTime)}
        {access.canNotifyDispatch &&
          (log.notifyEventIds ?? []).map((eventId, index) => (
            <Link
              key={eventId}
              to={`/notify/trace/dispatch?eventId=${eventId}`}
              style={{ marginInlineStart: 12 }}
            >
              {t('pages.monitor.alert.notify.delivery', { n: index + 1 })}
            </Link>
          ))}
      </div>
    </>
  );
};

/** 抑制来源：抑制规则名 / 拓扑抑制，外加造成抑制的源告警（可跳到它的详情） */
export const InhibitSource: React.FC<{
  kind?: number;
  inhibitId?: string;
  inhibitName?: string;
  alertId?: string;
  alertName?: string;
}> = ({ kind, inhibitId, inhibitName, alertId, alertName }) => {
  const t = useT();
  const rule = inhibitName || inhibitId;
  return (
    <>
      {kind === 2
        ? t('pages.monitor.alert.inhibit.topology')
        : rule
          ? t('pages.monitor.alert.inhibit.rule', { name: rule })
          : null}
      {alertId && (
        <Link
          to={`/monitor/alert/${alertId}`}
          style={{ marginInlineStart: kind === 2 || rule ? 12 : 0 }}
        >
          {alertName
            ? t('pages.monitor.alert.inhibit.sourceNamed', { name: alertName })
            : t('pages.monitor.alert.inhibit.source')}
        </Link>
      )}
    </>
  );
};

const known = (type?: string): type is AlertTimelineType =>
  !!type && type in TIMELINE_TYPE_COLOR;

const EventBody: React.FC<{
  type?: string;
  detail: AlertEventDetail;
  ticket?: AlertTicket | null;
}> = ({ type, detail, ticket }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  const text = detail.text ? (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {detail.text}
    </div>
  ) : null;
  // 时间线条目只带工单 ID 与编号；能否查看以详情返回的关联工单为准
  const ticketRef = detail.ticketId ? (
    <TicketLink
      ticket={{
        id: detail.ticketId,
        number: detail.ticketNumber,
        canView: ticket?.id === detail.ticketId && ticket.canView === true,
      }}
    />
  ) : null;

  switch (type) {
    case 'fire':
    case 'resolve':
      return isSeverity(detail.severity) ? (
        <SeverityTag severity={detail.severity} />
      ) : null;
    case 'close':
      return (
        <>
          {detail.cause && (
            <div>
              {CLOSE_CAUSES.includes(detail.cause)
                ? t(`pages.monitor.alert.timeline.cause.${detail.cause}`)
                : detail.cause}
            </div>
          )}
          {text}
        </>
      );
    case 'mute':
    case 'unmute':
      return detail.maintenance ? (
        <div>{t('pages.monitor.alert.mute.maintenance')}</div>
      ) : detail.muteName || detail.muteId ? (
        <div>
          {t('pages.monitor.alert.timeline.mute', {
            name: detail.muteName || detail.muteId,
          })}
        </div>
      ) : null;
    case 'inhibit':
    case 'uninhibit':
      return (
        <div>
          <InhibitSource
            kind={detail.inhibitKind}
            inhibitId={detail.inhibitId}
            inhibitName={detail.inhibitName}
            alertId={detail.inhibitAlertId}
          />
        </div>
      );
    case 'escalate':
      return (detail.level ?? 0) > 0 ? (
        <div>
          {t('pages.monitor.alert.timeline.level', { level: detail.level })}
        </div>
      ) : null;
    case 'transfer':
      return (
        <>
          <div>
            {detail.fromUser
              ? t('pages.monitor.alert.timeline.transfer', {
                  from: refName(detail.fromUser),
                  to: refName(detail.toUser),
                })
              : t('pages.monitor.alert.timeline.assign', {
                  to: refName(detail.toUser),
                })}
          </div>
          {text}
        </>
      );
    case 'ticket':
      return (
        <div>
          {ticketRef}
          {detail.auto && (
            <Tag style={{ marginInlineStart: 8 }}>
              {t('pages.monitor.alert.ticket.auto')}
            </Tag>
          )}
        </div>
      );
    case 'ticket_note':
      return ticketRef && <div>{ticketRef}</div>;
    case 'workflow':
      return detail.workflowInstanceId ? (
        <div>
          <WorkflowLink id={detail.workflowInstanceId} />
        </div>
      ) : null;
    case 'action_failed':
      return (
        <>
          {!!detail.actionKind && (
            <div>
              {ACTION_KINDS.includes(detail.actionKind)
                ? t(
                    `pages.monitor.alert.timeline.actionKind.${detail.actionKind}`,
                  )
                : detail.actionKind}
            </div>
          )}
          {detail.error && (
            <div className={styles.hint} style={{ wordBreak: 'break-word' }}>
              {detail.error}
            </div>
          )}
          {text}
        </>
      );
    default:
      // comment / notify / ack / unack / ai_summary，以及不认识的类型：有说明就显示说明
      return text;
  }
};

/** 流程实例：有流程菜单时链接到实例详情（能否查看由该页判定） */
export const WorkflowLink: React.FC<{ id: string }> = ({ id }) => {
  const t = useT();
  const access = useAccess();
  return access.canWorkflow ? (
    <Link to={`/workflow/instance/${id}`}>
      {t('pages.monitor.alert.workflow.view')}
    </Link>
  ) : (
    <span>{t('pages.monitor.alert.workflow.started')}</span>
  );
};

export const AlertTimeline: React.FC<{
  items: readonly AlertTimelineItem[];
  /** 详情返回的关联工单：时间线里的工单编号据此决定是否给链接 */
  ticket?: AlertTicket | null;
}> = ({ items, ticket }) => {
  const t = useT();
  const { styles } = useMonitorStyles();
  return (
    <Timeline
      items={items.map((item) => {
        if (item.type === 'notification' && item.notifyLog) {
          return {
            key: item.id,
            color: notifyLogColor(item.notifyLog),
            content: <NotifyLogBody log={item.notifyLog} />,
          };
        }
        const color = known(item.type)
          ? TIMELINE_TYPE_COLOR[item.type]
          : 'gray';
        return {
          key: item.id,
          color,
          content: (
            <>
              <Flex gap={8} wrap align="center">
                <Tag color={color} style={{ marginInlineEnd: 0 }}>
                  {known(item.type)
                    ? t(`pages.monitor.alert.timeline.type.${item.type}`)
                    : item.type || t('common.empty')}
                </Tag>
                {item.operator && <span>{refName(item.operator)}</span>}
              </Flex>
              <EventBody
                type={item.type}
                detail={item.detail ?? {}}
                ticket={ticket}
              />
              <div className={styles.hint}>{formatTime(item.time)}</div>
            </>
          ),
        };
      })}
    />
  );
};

export default AlertTimeline;
