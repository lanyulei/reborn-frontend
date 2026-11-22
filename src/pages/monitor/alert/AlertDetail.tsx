/**
 * 告警事件详情（列表抽屉与 /monitor/alert/:id 深链页共用）：基本信息、处理状态、标签、附加信息、
 * AI 摘要、关联资源与影响面、关联工单、触发表达式（可带到即时查询复算）、事件时间线（触发、每次
 * 通知、升级、认领、屏蔽、备注、恢复……），头部是事件操作（认领 / 转交 / 备注 / 转工单 / 手动关闭）
 * 与「屏蔽」「订阅同类告警」两个快捷入口（按该事件预填）。
 * 本组件除事件详情外不主动请求任何接口：仅作为通知对象打开的用户别的接口一概调不通。
 */
import { history, Link, useAccess } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Descriptions,
  Empty,
  Flex,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { KnowledgeSidebar } from '@/components/KnowledgeSidebar';
import { SectionTitle } from '@/components/SectionTitle';
import { AlertIncidentBlock } from '@/pages/incident/components/AlertIncidentBlock';
import { K8sAlertLink } from '@/pages/k8s/components/monitorLink';
import {
  type AlertDetail,
  getAlert,
  isFirstNotifyUndelivered,
} from '@/services/monitor/alert';
import {
  getErrorReason,
  getMonitorErrorMessage,
} from '@/services/monitor/request';
import type { MonitorAlert, RuleGroup } from '@/services/monitor/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT } from '@/utils/i18n';
import {
  explorePath,
  formatDuration,
  formatTime,
  formatValue,
  labelEntries,
} from '../components/format';
import type { DatasourceOptionsState } from '../components/hooks';
import { labelsToMatchers } from '../components/MatchersEditor';
import { ALERT_STATUS_META, SEVERITY_ORDER } from '../components/meta';
import { useMonitorStyles } from '../components/styles';
import { LabelTags, SeverityTag } from '../components/tags';
import { MuteDrawer } from '../mute/MuteDrawer';
import { SubscriptionDrawer } from '../subscription/SubscriptionDrawer';
import { type AlertOp, alertOpStates } from './meta';
import { OpButton, useAlertOps } from './OpDialogs';
import { CIBlock, HandleBlock, TicketBlock } from './Related';
import { AlertTimeline, NotifyLogBody, notifyLogColor } from './Timeline';

const STATUS_BADGE = { 1: 'error', 2: 'success', 3: 'default' } as const;
const isHttpUrl = (text: string) => /^https?:\/\/\S+$/.test(text);
/** 头部按钮的顺序（手动关闭在最后） */
const HEADER_OPS: readonly AlertOp[] = [
  'ack',
  'unack',
  'transfer',
  'comment',
  'ticket',
  'close',
];

type Access = ReturnType<typeof useAccess>;
type Has = ReturnType<typeof usePermissions>;

/** 有「屏蔽规则」菜单与新建权限（另须对事件所在分组可管理，见组件内） */
export const canQuickMute = (access: Access, has: Has): boolean =>
  Boolean(access.canMonitorMute) && has('monitor.mute.create');
/** 有「告警订阅」菜单与新建权限 */
export const canQuickSubscribe = (access: Access, has: Has): boolean =>
  Boolean(access.canMonitorSubscription) && has('monitor.subscription.create');

/** 该事件所在规则的候选显示名（预填屏蔽 / 订阅的「指定规则」） */
const ruleKnown = (alert: MonitorAlert) =>
  alert.ruleId && alert.ruleExists
    ? [{ id: alert.ruleId, label: alert.ruleName || alert.ruleId }]
    : [];

export const AlertDetailView: React.FC<{
  id: string;
  /** 规则分组、是否超级管理员、数据源选项：页面取一次下传（快捷入口的权限判断与表单用） */
  groups: readonly RuleGroup[];
  isAdmin: boolean;
  datasources: DatasourceOptionsState;
  /** 查看同一对象（指纹）的历次告警；不传则不显示该入口 */
  onShowHistory?: (fingerprint: string) => void;
  /** 查看某个关联资源的全部告警；不传时有告警事件菜单则给列表页的链接 */
  onShowCi?: (ci: { id: string; name: string }) => void;
}> = ({ id, groups, isAdmin, datasources, onShowHistory, onShowCi }) => {
  const t = useT();
  const has = usePermissions();
  const access = useAccess();
  const { styles } = useMonitorStyles();
  const statusText = useEnumText(ALERT_STATUS_META);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AlertDetail>();
  // 加载失败：retryable = 网络 / 服务端错误（可重试）；否则是事件不存在或无权查看
  const [error, setError] = useState<{ text: string; retryable: boolean }>();
  const [quick, setQuick] = useState<'mute' | 'subscribe'>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDetail(await getAlert(id));
      setError(undefined);
    } catch (e) {
      setDetail(undefined);
      const status = (e as { response?: { status?: number } })?.response
        ?.status;
      // 不存在与无权查看后端同样返回 404（不泄露事件是否存在）；403 是账号层面的无权
      const gone =
        status === 404 ||
        status === 403 ||
        getErrorReason(e) === 'MONITOR_ALERT_NOT_FOUND';
      setError(
        gone
          ? { text: t('pages.monitor.alert.notFound'), retryable: false }
          : {
              text: t('pages.monitor.error.withDetail', {
                text: t('pages.monitor.alert.loadFailed'),
                detail: getMonitorErrorMessage(e),
              }),
              retryable: true,
            },
      );
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);
  // 事件操作成功（或因状态已变而失败）后重新取详情
  const ops = useAlertOps(() => void load());

  if (loading && !detail) {
    return (
      <div style={{ padding: 64, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }
  if (!detail?.alert) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={error?.text ?? t('pages.monitor.alert.notFound')}
      >
        {error?.retryable && (
          <Button loading={loading} onClick={() => void load()}>
            {t('pages.monitor.retry')}
          </Button>
        )}
      </Empty>
    );
  }

  const { alert, canViewRule } = detail;
  const notifyLogs = detail.notifyLogs ?? [];
  const timeline = detail.timeline ?? [];
  // 仅作为通知对象查看时 canViewRule=false：没有任何操作
  const opStates = alertOpStates(
    // 详情另带关联工单：已有工单就不再提供转工单
    detail.ticket ? { ...alert, ticketId: detail.ticket.id } : alert,
    has,
    canViewRule === true,
  );
  const status = alert.status ?? 1;
  const annotations = labelEntries(alert.annotations);
  // 快捷入口要在分组里建屏蔽 / 订阅：仅作为通知对象查看（不在数据范围内）或没有相应菜单与
  // 元素权限时不提供。屏蔽另要求对事件所在分组「可管理」（为自己订阅只读即可）
  const canManageGroup =
    isAdmin ||
    (groups.find((group) => group.id === alert.groupId)?.level ?? 0) >= 2;
  const canMute =
    canViewRule && status === 1 && canQuickMute(access, has) && canManageGroup;
  const canSubscribe = canViewRule && canQuickSubscribe(access, has);

  return (
    <div>
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Flex gap={8} align="center" style={{ minWidth: 0 }}>
          <SeverityTag severity={alert.severity} />
          <Typography.Text strong ellipsis>
            {alert.ruleName}
          </Typography.Text>
          <Badge status={STATUS_BADGE[status]} text={statusText(status)} />
          {alert.muted && (
            <Tag>
              {t('pages.monitor.alert.muted')}
              {alert.muteName ? ` · ${alert.muteName}` : ''}
            </Tag>
          )}
          {alert.closing && (
            <Tag color="warning">{t('pages.monitor.alert.closing')}</Tag>
          )}
        </Flex>
        <Flex gap={8} wrap>
          {HEADER_OPS.filter((op) => opStates[op].show).map((op) => (
            <OpButton
              key={op}
              op={op}
              state={opStates[op]}
              loading={ops.pending === `${op}:${alert.id}`}
              onClick={() => void ops.run(op, alert)}
            />
          ))}
          {canMute && (
            <Button onClick={() => setQuick('mute')}>
              {t('pages.monitor.alert.action.mute')}
            </Button>
          )}
          {canSubscribe && (
            <Button onClick={() => setQuick('subscribe')}>
              {t('pages.monitor.alert.action.subscribe')}
            </Button>
          )}
        </Flex>
      </Flex>

      <SectionTitle>{t('pages.monitor.alert.section.basic')}</SectionTitle>
      <Descriptions
        bordered
        size="small"
        column={2}
        styles={{ label: { width: 120, whiteSpace: 'nowrap' } }}
        items={[
          {
            key: 'rule',
            label: t('pages.monitor.alert.column.rule'),
            children:
              canViewRule && alert.ruleExists && access.canMonitorRule ? (
                <Link to={`/monitor/rule?ruleId=${alert.ruleId}`}>
                  {alert.ruleName}
                </Link>
              ) : (
                <>
                  {alert.ruleName}
                  {!alert.ruleExists && (
                    <Tag style={{ marginInlineStart: 8 }}>
                      {t('pages.monitor.alert.ruleDeleted')}
                    </Tag>
                  )}
                </>
              ),
          },
          {
            key: 'group',
            label: t('pages.monitor.common.group'),
            children: alert.groupName || t('common.empty'),
          },
          {
            key: 'datasource',
            label: t('pages.monitor.common.datasource'),
            children: alert.datasourceName || t('common.empty'),
          },
          {
            key: 'duration',
            label: t('pages.monitor.alert.column.duration'),
            children: formatDuration(alert.durationS, t),
          },
          {
            key: 'value',
            label: t('pages.monitor.alert.column.value'),
            children: formatValue(alert.value) || t('common.empty'),
          },
          {
            key: 'recoveryValue',
            label: t('pages.monitor.alert.recoveryValue'),
            children: formatValue(alert.recoveryValue) || t('common.empty'),
          },
          {
            key: 'firstFireTime',
            label: t('pages.monitor.alert.column.firstFireTime'),
            children: formatTime(alert.firstFireTime) || t('common.empty'),
          },
          {
            key: 'lastFireTime',
            label: t('pages.monitor.alert.lastFireTime'),
            children: formatTime(alert.lastFireTime) || t('common.empty'),
          },
          {
            key: 'resolveTime',
            label: t('pages.monitor.alert.column.resolveTime'),
            children: formatTime(alert.resolveTime) || t('common.empty'),
          },
          {
            key: 'notifyCount',
            label: t('pages.monitor.alert.column.notifyCount'),
            children: `${alert.notifyCount ?? 0}${
              alert.lastNotifyTime
                ? ` · ${formatTime(alert.lastNotifyTime)}`
                : ''
            }`,
          },
          {
            key: 'fingerprint',
            label: t('pages.monitor.alert.fingerprint'),
            span: 2,
            children: (
              <>
                <Typography.Text copyable className={styles.code}>
                  {alert.fingerprint}
                </Typography.Text>
                {onShowHistory && alert.fingerprint && (
                  <a
                    style={{ marginInlineStart: 12 }}
                    onClick={() => onShowHistory(alert.fingerprint as string)}
                  >
                    {t('pages.monitor.alert.sameObject')}
                  </a>
                )}
              </>
            ),
          },
        ]}
      />

      <HandleBlock alert={alert} canViewRule={canViewRule === true} />

      <SectionTitle>{t('pages.monitor.alert.column.labels')}</SectionTitle>
      <LabelTags labels={alert.labels} />
      <K8sAlertLink labels={alert.labels} />

      {annotations.length > 0 && (
        <>
          <SectionTitle>
            {t('pages.monitor.rule.form.annotations')}
          </SectionTitle>
          <Descriptions
            bordered
            size="small"
            column={1}
            styles={{ label: { width: 160 } }}
            items={annotations.map(([key, value]) => ({
              key,
              label: key,
              children: isHttpUrl(value) ? (
                <a href={value} target="_blank" rel="noopener noreferrer">
                  {value}
                </a>
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
              ),
            }))}
          />
        </>
      )}

      {alert.aiSummary && (
        <>
          <SectionTitle>{t('pages.monitor.alert.section.ai')}</SectionTitle>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {alert.aiSummary}
          </div>
        </>
      )}

      <CIBlock detail={detail} onShowCi={onShowCi} />
      <TicketBlock
        ticket={detail.ticket}
        workflowInstanceId={alert.workflowInstanceId}
      />
      {/* 所属故障：由故障域提供，仅有故障列表菜单的用户可见 */}
      {canViewRule && <AlertIncidentBlock alert={alert} />}
      {access.canKnowledge && (
        <KnowledgeSidebar
          targetType="monitor_alert"
          targetId={alert.id}
          query={alert.ruleName}
        />
      )}

      <SectionTitle>{t('pages.monitor.alert.section.expr')}</SectionTitle>
      <div className={styles.codeBlock}>{alert.expr}</div>
      {access.canMonitorExplore && alert.expr && alert.datasourceId && (
        <div style={{ marginTop: 8 }}>
          <a
            onClick={() =>
              history.push(explorePath(alert.datasourceId, alert.expr))
            }
          >
            {t('pages.monitor.alert.openExplore')}
          </a>
        </div>
      )}

      {timeline.length > 0 ? (
        <>
          <SectionTitle>{t('pages.monitor.alert.section.events')}</SectionTitle>
          {isFirstNotifyUndelivered(detail) && (
            <Alert
              type="warning"
              showIcon
              title={t('pages.monitor.alert.notify.undelivered')}
              style={{ marginBottom: 16 }}
            />
          )}
          <AlertTimeline items={timeline} ticket={detail.ticket} />
        </>
      ) : (
        // 旧版后端没有事件时间线：退回只有通知记录的时间线
        <>
          <SectionTitle>
            {t('pages.monitor.alert.section.timeline')}
          </SectionTitle>
          {isFirstNotifyUndelivered(detail) ? (
            <Alert
              type="warning"
              showIcon
              title={t('pages.monitor.alert.notify.undelivered')}
            />
          ) : notifyLogs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pages.monitor.alert.notify.empty')}
            />
          ) : (
            <Timeline
              items={notifyLogs.map((log) => ({
                key: log.id,
                color: notifyLogColor(log),
                content: <NotifyLogBody log={log} />,
              }))}
            />
          )}
        </>
      )}

      {ops.dialogs}
      {quick === 'mute' && (
        <MuteDrawer
          prefill={{
            name: t('pages.monitor.alert.mute.prefillName', {
              name: alert.ruleName ?? '',
            }),
            groupId: alert.groupId,
            ruleIds: ruleKnown(alert).map((rule) => rule.id),
            datasourceIds: alert.datasourceId ? [alert.datasourceId] : [],
            matchers: labelsToMatchers(alert.labels),
            mode: 1,
            timeType: 1,
            // 缺省屏蔽两小时，表单里可用快捷时长调整
            startTime: dayjs().toISOString(),
            endTime: dayjs().add(2, 'hour').toISOString(),
          }}
          prefillRules={ruleKnown(alert)}
          groups={groups}
          isAdmin={isAdmin}
          datasources={datasources}
          onClose={() => setQuick(undefined)}
          onSaved={() => void load()}
        />
      )}
      {quick === 'subscribe' && (
        <SubscriptionDrawer
          prefill={{
            name: t('pages.monitor.alert.subscribe.prefillName', {
              name: alert.ruleName ?? '',
            }),
            groupIds: alert.groupId ? [alert.groupId] : [],
            ruleIds: ruleKnown(alert).map((rule) => rule.id),
            severities: [...SEVERITY_ORDER],
            matchers: labelsToMatchers(alert.labels),
          }}
          prefillRules={ruleKnown(alert)}
          groups={groups}
          datasources={datasources}
          onClose={() => setQuick(undefined)}
        />
      )}
    </div>
  );
};

export default AlertDetailView;
