/**
 * 事件详情里第二、三期的几块：处理状态（认领 / 关闭 / 抑制 / 升级）、关联资源卡片与影响面、
 * AI 摘要、关联工单与流程。跨域链接只在「有对应菜单权限」且「后端说当前用户能看」时给出。
 */
import { Link, useAccess } from '@umijs/max';
import { Badge, Descriptions, Table, Tag } from 'antd';
import type React from 'react';
import { SectionTitle } from '@/components/SectionTitle';
import { CMDB_CI_STATUS_META } from '@/pages/cmdb/components/meta';
import { TICKET_STATUS_META } from '@/pages/ticket/components/meta';
import type { AlertDetail } from '@/services/monitor/alert';
import type {
  AlertCI,
  AlertImpactCI,
  AlertTicket,
  MonitorAlert,
} from '@/services/monitor/typings';
import { useT } from '@/utils/i18n';
import { formatDuration, formatTime } from '../components/format';
import { HANDLE_STATE_META } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { TicketLink } from './TicketModal';
import { InhibitSource, WorkflowLink } from './Timeline';

/** 徽标状态（EnumMeta.status）→ Badge 的 status */
const badgeStatus = (status?: string) =>
  (status?.toLowerCase() ?? 'default') as
    | 'success'
    | 'processing'
    | 'error'
    | 'default'
    | 'warning';

/** 处理状态标签 +「关闭中」「已升级」标记（列表与详情共用） */
export const HandleStateTags: React.FC<{ alert: MonitorAlert }> = ({
  alert,
}) => {
  const t = useT();
  const meta = alert.handleState
    ? HANDLE_STATE_META[alert.handleState]
    : undefined;
  return (
    <>
      {meta && <Tag color={meta.color}>{t(meta.textId)}</Tag>}
      {alert.closing && (
        <Tag color="warning">{t('pages.monitor.alert.closing')}</Tag>
      )}
      {(alert.escalationLevel ?? 0) > 0 && (
        <Tag color="purple">
          {t('pages.monitor.alert.escalated', { level: alert.escalationLevel })}
        </Tag>
      )}
    </>
  );
};

/** 被屏蔽的说明：屏蔽规则名；没有屏蔽规则而关联了资源 = 资源处于维护态 */
export const muteText = (
  alert: MonitorAlert,
  t: ReturnType<typeof useT>,
): string =>
  alert.muteName ||
  (alert.muted && !alert.muteId && alert.ciId
    ? t('pages.monitor.alert.mute.maintenance')
    : '');

/** 处理状态：认领人 / 认领时间 / 认领耗时、关闭人与原因、被谁抑制、升级级数 */
export const HandleBlock: React.FC<{
  alert: MonitorAlert;
  /** 仅作为通知对象查看时后端不给屏蔽规则，「维护态」的推断不成立 */
  canViewRule: boolean;
}> = ({ alert, canViewRule }) => {
  const t = useT();
  const mute = canViewRule ? muteText(alert, t) : alert.muteName;
  return (
    <>
      <SectionTitle>{t('pages.monitor.alert.section.handle')}</SectionTitle>
      <Descriptions
        bordered
        size="small"
        column={2}
        styles={{ label: { width: 120, whiteSpace: 'nowrap' } }}
        items={[
          {
            key: 'state',
            label: t('pages.monitor.alert.column.handleState'),
            span: 2,
            children: (
              <>
                <HandleStateTags alert={alert} />
                {!alert.handleState &&
                  !alert.closing &&
                  !alert.escalationLevel &&
                  t('common.empty')}
              </>
            ),
          },
          ...(alert.ackUserId
            ? [
                {
                  key: 'ackUser',
                  label: t('pages.monitor.alert.column.ackUser'),
                  children: alert.ackUserName || alert.ackUserId,
                },
                {
                  key: 'ackTime',
                  label: t('pages.monitor.alert.ackTime'),
                  children: `${formatTime(alert.ackTime) || t('common.empty')}${t(
                    'pages.monitor.alert.ackAfter',
                    { duration: formatDuration(alert.ackDurationS, t) },
                  )}`,
                },
              ]
            : []),
          ...(alert.closedById || alert.closeReason
            ? [
                {
                  key: 'closedBy',
                  label: t('pages.monitor.alert.closedBy'),
                  children:
                    alert.closedByName || alert.closedById || t('common.empty'),
                },
                {
                  key: 'closeReason',
                  label: t('pages.monitor.alert.close.reason'),
                  children: (
                    <span style={{ whiteSpace: 'pre-wrap' }}>
                      {alert.closeReason || t('common.empty')}
                    </span>
                  ),
                },
              ]
            : []),
          ...(alert.muted && mute
            ? [
                {
                  key: 'mute',
                  label: t('pages.monitor.alert.mutedBy'),
                  span: 2,
                  children: mute,
                },
              ]
            : []),
          ...(alert.inhibited
            ? [
                {
                  key: 'inhibit',
                  label: t('pages.monitor.alert.inhibitedBy'),
                  span: 2,
                  children: (
                    <InhibitSource
                      kind={alert.inhibitKind}
                      inhibitId={alert.inhibitId}
                      inhibitName={alert.inhibitName}
                      alertId={alert.inhibitAlertId}
                      alertName={alert.inhibitAlertName}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
    </>
  );
};

const CIName: React.FC<{
  ci: Pick<AlertCI, 'id' | 'name' | 'canView'>;
  exists?: boolean;
}> = ({ ci, exists = true }) => {
  const access = useAccess();
  const text = ci.name || ci.id;
  return ci.canView && exists && access.canCmdbCI ? (
    <Link to={`/cmdb/ci/${ci.id}`}>{text}</Link>
  ) : (
    <span>{text}</span>
  );
};

/** 关联资源卡片 + 影响面（下游资源） */
export const CIBlock: React.FC<{
  detail: AlertDetail;
  /** 查看该资源的全部告警；不传时有告警事件菜单则给链接（深链页） */
  onShowCi?: (ci: { id: string; name: string }) => void;
}> = ({ detail, onShowCi }) => {
  const t = useT();
  const access = useAccess();
  const { styles } = useMonitorStyles();
  const { ci } = detail;
  const impact = detail.impact ?? [];
  if (!ci) return null;
  const status =
    ci.status && ci.status in CMDB_CI_STATUS_META
      ? CMDB_CI_STATUS_META[ci.status as keyof typeof CMDB_CI_STATUS_META]
      : undefined;
  const ciName = ci.name || ci.id;
  return (
    <>
      <SectionTitle>{t('pages.monitor.alert.ci.title')}</SectionTitle>
      <Descriptions
        bordered
        size="small"
        column={2}
        styles={{ label: { width: 120, whiteSpace: 'nowrap' } }}
        items={[
          {
            key: 'name',
            label: t('pages.monitor.alert.ci.name'),
            children: (
              <>
                <CIName ci={ci} exists={ci.exists === true} />
                {!ci.exists && (
                  <Tag style={{ marginInlineStart: 8 }}>
                    {t('pages.monitor.alert.ci.deleted')}
                  </Tag>
                )}
              </>
            ),
          },
          {
            key: 'model',
            label: t('pages.monitor.alert.ci.model'),
            children: ci.modelName || ci.modelCode || t('common.empty'),
          },
          {
            key: 'env',
            label: t('pages.monitor.alert.ci.env'),
            children: ci.env || t('common.empty'),
          },
          {
            key: 'owner',
            label: t('pages.monitor.alert.ci.owner'),
            children: ci.owner || t('common.empty'),
          },
          {
            key: 'status',
            label: t('common.column.status'),
            children: status ? (
              <Badge
                status={badgeStatus(status.status)}
                text={t(status.textId)}
              />
            ) : (
              ci.status || t('common.empty')
            ),
          },
          {
            key: 'firing',
            label: t('pages.monitor.alert.ci.firing'),
            children: (
              <>
                {ci.firingCount ?? 0}
                {onShowCi ? (
                  <a
                    style={{ marginInlineStart: 12 }}
                    onClick={() => onShowCi({ id: ci.id, name: ciName })}
                  >
                    {t('pages.monitor.alert.ci.alerts')}
                  </a>
                ) : (
                  access.canMonitorAlert && (
                    <Link
                      to={`/monitor/alert?ciId=${ci.id}&ciName=${encodeURIComponent(ciName)}`}
                      style={{ marginInlineStart: 12 }}
                    >
                      {t('pages.monitor.alert.ci.alerts')}
                    </Link>
                  )
                )}
              </>
            ),
          },
          {
            key: 'tags',
            label: t('pages.monitor.alert.ci.tags'),
            span: 2,
            children:
              (ci.tags ?? []).length > 0
                ? (ci.tags ?? []).map((tag) => <Tag key={tag}>{tag}</Tag>)
                : t('common.empty'),
          },
        ]}
      />

      <SectionTitle>{t('pages.monitor.alert.impact.title')}</SectionTitle>
      {impact.length === 0 ? (
        <span className={styles.hint}>
          {t('pages.monitor.alert.impact.empty')}
        </span>
      ) : (
        <>
          <Table<AlertImpactCI>
            size="small"
            rowKey="id"
            dataSource={impact}
            pagination={
              impact.length > 10
                ? { pageSize: 10, showSizeChanger: false }
                : false
            }
            columns={[
              {
                title: t('pages.monitor.alert.ci.name'),
                dataIndex: 'name',
                render: (_, row) => <CIName ci={row} />,
              },
              {
                title: t('pages.monitor.alert.ci.model'),
                dataIndex: 'modelName',
                render: (_, row) =>
                  row.modelName || row.modelCode || t('common.empty'),
              },
              {
                title: t('pages.monitor.alert.impact.depth'),
                dataIndex: 'depth',
                width: 110,
                render: (_, row) =>
                  t('pages.monitor.alert.impact.depthN', { n: row.depth ?? 1 }),
              },
              {
                title: t('pages.monitor.alert.ci.firing'),
                dataIndex: 'firingCount',
                width: 110,
                render: (_, row) =>
                  (row.firingCount ?? 0) > 0 ? (
                    <Tag color="error">{row.firingCount}</Tag>
                  ) : (
                    0
                  ),
              },
            ]}
          />
          {detail.impactTruncated && (
            <div className={styles.hint} style={{ marginTop: 8 }}>
              {t('pages.monitor.alert.impact.truncated')}
            </div>
          )}
        </>
      )}
    </>
  );
};

/** 关联工单与流程实例 */
export const TicketBlock: React.FC<{
  ticket?: AlertTicket | null;
  workflowInstanceId?: string;
}> = ({ ticket, workflowInstanceId }) => {
  const t = useT();
  if (!ticket && !workflowInstanceId) return null;
  const status =
    ticket?.status && ticket.status in TICKET_STATUS_META
      ? TICKET_STATUS_META[ticket.status as keyof typeof TICKET_STATUS_META]
      : undefined;
  return (
    <>
      <SectionTitle>{t('pages.monitor.alert.section.linked')}</SectionTitle>
      <Descriptions
        bordered
        size="small"
        column={2}
        styles={{ label: { width: 120, whiteSpace: 'nowrap' } }}
        items={[
          ...(ticket
            ? [
                {
                  key: 'ticket',
                  label: t('pages.monitor.alert.ticket.number'),
                  children: (
                    <>
                      <TicketLink ticket={ticket} />
                      {ticket.auto && (
                        <Tag style={{ marginInlineStart: 8 }}>
                          {t('pages.monitor.alert.ticket.auto')}
                        </Tag>
                      )}
                    </>
                  ),
                },
                {
                  key: 'ticketStatus',
                  label: t('pages.monitor.alert.ticket.status'),
                  children: status ? (
                    <Badge
                      status={badgeStatus(status.status)}
                      text={t(status.textId)}
                    />
                  ) : (
                    t('common.empty')
                  ),
                },
                {
                  key: 'ticketTitle',
                  label: t('pages.monitor.alert.ticket.titleField'),
                  span: 2,
                  // 无权查看该工单时后端不返回标题
                  children: ticket.title || t('common.empty'),
                },
              ]
            : []),
          ...(workflowInstanceId
            ? [
                {
                  key: 'workflow',
                  label: t('pages.monitor.alert.workflow.title'),
                  span: 2,
                  children: <WorkflowLink id={workflowInstanceId} />,
                },
              ]
            : []),
        ]}
      />
    </>
  );
};
