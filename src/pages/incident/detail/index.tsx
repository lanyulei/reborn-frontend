/**
 * 故障详情：头部（编号 / 标题 / 等级 / 状态 / 业务 / 指挥 / 时间）、操作（响应 / 缓解 / 解决 / 关闭 / 重开、改等级、
 * 改指挥、成员、合并、转工单、编辑、问 AI），页签：概览（摘要 / AI 摘要 / 成员 / 推荐预案 / 相似故障）、时间线、
 * 关联告警、影响面与变更、处置建议、公告与分享、复盘。每 30 秒自动刷新头部。
 */
import { LeftOutlined, ReloadOutlined, RobotOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  history,
  Link,
  useAccess,
  useParams,
  useSearchParams,
} from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Dropdown,
  Empty,
  Flex,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { askAssistant } from '@/components/GlobalChat/ask';
import { KnowledgeSidebar } from '@/components/KnowledgeSidebar';
import { SectionTitle } from '@/components/SectionTitle';
import {
  getIncident,
  getIncidentContext,
  regenerateSummary,
} from '@/services/incident/incident';
import { getIncidentErrorMessage } from '@/services/incident/request';
import type {
  Incident,
  IncidentContext,
  TransitionAction,
} from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { incidentPath, SOURCE_META } from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import {
  CiLink,
  formatSeconds,
  RefName,
  RefNames,
  ReviewBadge,
  SeverityTag,
  StatusBadge,
} from '../components/tags';
import { AgentPanel } from './Agent';
import { AlertsPanel } from './Alerts';
import {
  CommanderModal,
  EditModal,
  MembersModal,
  MergeModal,
  SeverityModal,
  TicketModal,
  TransitionModal,
} from './Dialogs';
import { ImpactPanel } from './Impact';
import { PostmortemPanel } from './Postmortem';
import { ProposalsPanel } from './Proposals';
import { TimelinePanel } from './Timeline';
import { UpdatesPanel } from './Updates';

type Dialog =
  | { kind: 'transition'; action: TransitionAction }
  | { kind: 'severity' }
  | { kind: 'commander' }
  | { kind: 'members'; role: 2 | 3 }
  | { kind: 'merge' }
  | { kind: 'ticket' }
  | { kind: 'edit' }
  | null;

const TAB_KEYS = [
  'overview',
  'timeline',
  'alerts',
  'impact',
  'proposals',
  'updates',
  'postmortem',
  'agent',
] as const;
type TabKey = (typeof TAB_KEYS)[number];
const REFRESH_MS = 30_000;

/** 当前状态下可用的流转动作 */
const transitions = (inc: Incident): TransitionAction[] => {
  const list: TransitionAction[] = [];
  const handle = inc.canHandle === true;
  const manage = inc.canManage === true;
  if (inc.status === 1) list.push('respond');
  if (handle && (inc.status === 1 || inc.status === 2)) list.push('mitigate');
  if (handle && inc.status <= 3) list.push('resolve');
  if (manage && inc.status === 4) list.push('close', 'reopen');
  return list;
};

const seconds = (from?: string, to?: string) =>
  from && to
    ? (new Date(to).getTime() - new Date(from).getTime()) / 1000
    : undefined;

/** 服务端明确答复对象已不存在（404 / 410） */
const isGone = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return status === 404 || status === 410;
};

const Overview: React.FC<{
  incident: Incident;
  context: IncidentContext | null;
  onRegenerate: () => void;
}> = ({ incident, context, onRegenerate }) => {
  const t = useT();
  const has = usePermissions();
  const { styles } = useIncidentStyles();
  const [regen, setRegen] = useState(false);
  return (
    <div>
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2, md: 3 }}
        items={[
          {
            key: 'occur',
            label: t('pages.incident.field.occurTime'),
            children: formatTime(incident.occurTime),
          },
          {
            key: 'open',
            label: t('pages.incident.field.openTime'),
            children: formatTime(incident.openTime),
          },
          {
            key: 'respond',
            label: t('pages.incident.field.respondTime'),
            children: formatTime(incident.respondTime) || t('common.empty'),
          },
          {
            key: 'mitigate',
            label: t('pages.incident.field.mitigateTime'),
            children: formatTime(incident.mitigateTime) || t('common.empty'),
          },
          {
            key: 'resolve',
            label: t('pages.incident.field.resolveTime'),
            children: formatTime(incident.resolveTime) || t('common.empty'),
          },
          {
            key: 'mttr',
            label: t('pages.incident.field.duration'),
            children: formatSeconds(
              seconds(
                incident.occurTime,
                incident.resolveTime ?? new Date().toISOString(),
              ),
            ),
          },
          {
            key: 'source',
            label: t('pages.incident.field.source'),
            children: (
              <>
                {incident.source
                  ? t(SOURCE_META[incident.source].textId)
                  : t('common.empty')}
                {incident.rule?.id && (
                  <span className={styles.hint}>
                    {' '}
                    · <RefName ref={incident.rule} />
                  </span>
                )}
              </>
            ),
          },
          {
            key: 'review',
            label: t('pages.incident.field.reviewStatus'),
            children: (
              <ReviewBadge
                status={incident.reviewStatus}
                overdue={
                  !!incident.reviewDue &&
                  incident.reviewStatus !== 3 &&
                  incident.reviewStatus !== 0 &&
                  new Date(incident.reviewDue) < new Date()
                }
              />
            ),
          },
          {
            key: 'groups',
            label: t('pages.incident.field.groups'),
            children: incident.groups?.length
              ? incident.groups.join('、')
              : t('common.empty'),
          },
          {
            key: 'rootCause',
            label: t('pages.incident.field.rootCause'),
            children:
              incident.rootCause || incident.rootCauseCode || t('common.empty'),
          },
          {
            key: 'agent',
            label: t('pages.incident.field.agentOwner'),
            children: incident.agentOwner?.id ? (
              <>
                <RefName ref={incident.agentOwner} />
                {incident.agentLeaseUntil && (
                  <span className={styles.hint}>
                    {' '}
                    ·{' '}
                    {t('pages.incident.field.leaseUntil', {
                      time: formatTime(incident.agentLeaseUntil),
                    })}
                  </span>
                )}
              </>
            ) : (
              t('common.empty')
            ),
          },
          {
            key: 'merged',
            label: t('pages.incident.field.mergedInto'),
            children: incident.mergedInto?.id ? (
              <Link to={incidentPath(incident.mergedInto.id)}>
                {incident.mergedInto.name || incident.mergedInto.id}
              </Link>
            ) : (
              t('common.empty')
            ),
          },
        ]}
      />

      <SectionTitle>{t('pages.incident.field.summary')}</SectionTitle>
      <div className={styles.pre}>
        {incident.summary || (
          <span className={styles.hint}>{t('common.empty')}</span>
        )}
      </div>
      {incident.resolveNote && (
        <>
          <SectionTitle>{t('pages.incident.field.resolveNote')}</SectionTitle>
          <div className={styles.pre}>{incident.resolveNote}</div>
        </>
      )}

      <Flex
        justify="space-between"
        align="center"
        style={{ marginTop: 20, marginBottom: 12 }}
      >
        <SectionTitle style={{ margin: 0 }}>
          {t('pages.incident.ai.title')}
        </SectionTitle>
        {has('incident.list.handle') &&
          incident.canHandle &&
          incident.status <= 4 && (
            <Button
              icon={<RobotOutlined />}
              loading={regen}
              onClick={async () => {
                setRegen(true);
                try {
                  await regenerateSummary(incident.id);
                  onRegenerate();
                } finally {
                  setRegen(false);
                }
              }}
            >
              {t('pages.incident.ai.regenerate')}
            </Button>
          )}
      </Flex>
      {incident.aiSummary ? (
        <div className={styles.summaryBox}>{incident.aiSummary}</div>
      ) : (
        <span className={styles.hint}>{t('pages.incident.ai.empty')}</span>
      )}

      <SectionTitle>{t('pages.incident.members.title')}</SectionTitle>
      <Descriptions
        size="small"
        column={1}
        items={[
          {
            key: 'c',
            label: t('pages.incident.field.commander'),
            children: <RefName ref={incident.commander} />,
          },
          {
            key: 'r',
            label: t('pages.incident.field.responders'),
            children: <RefNames refs={incident.responders} />,
          },
          {
            key: 'w',
            label: t('pages.incident.field.watchers'),
            children: <RefNames refs={incident.watchers} />,
          },
        ]}
      />

      <SectionTitle>{t('pages.incident.field.affectedCis')}</SectionTitle>
      {incident.affectedCis?.length ? (
        <Space size={[6, 6]} wrap>
          {incident.affectedCis.map((ci) => (
            <Tag key={ci.id} style={{ marginInlineEnd: 0 }}>
              <CiLink ci={ci} />
            </Tag>
          ))}
        </Space>
      ) : (
        <span className={styles.hint}>{t('common.empty')}</span>
      )}

      {(context?.playbooks?.length ?? 0) > 0 && (
        <>
          <SectionTitle>{t('pages.incident.overview.playbooks')}</SectionTitle>
          <Space size={[6, 6]} wrap>
            {context?.playbooks?.map((p) => (
              <Tooltip key={p.id} title={p.description}>
                <Tag color="geekblue">
                  {p.name} ·{' '}
                  {t('pages.incident.overview.steps', { n: p.stepCount ?? 0 })}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        </>
      )}
      {(context?.similar?.length ?? 0) > 0 && (
        <>
          <SectionTitle>{t('pages.incident.overview.similar')}</SectionTitle>
          {context?.similar?.map((s) => (
            <div key={s.id} style={{ marginBottom: 4 }}>
              <Link to={incidentPath(s.id)}>
                <span className={styles.mono}>{s.number}</span> {s.title}
              </Link>
              {s.rootCause && (
                <span className={styles.hint}> · {s.rootCause}</span>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

const IncidentDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const t = useT();
  const access = useAccess();
  const has = usePermissions();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const tab: TabKey =
    tabParam && TAB_KEYS.includes(tabParam) ? tabParam : 'overview';
  const [incident, setIncident] = useState<Incident | null>(null);
  const [context, setContext] = useState<IncidentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const seq = useRef(0);
  const contextSeq = useRef(0);
  /** 页面上正在展示的故障的路由 id：刷新失败时据此判断能否保留页面 */
  const shownIdRef = useRef<string | null>(null);

  /** notify：失败时给一条提示（手动刷新用；后台定时刷新保持静默） */
  const load = useCallback(
    async (silent = false, notify = false) => {
      const current = ++seq.current;
      if (!silent) setLoading(true);
      try {
        const inc = await getIncident(id, { silent: true });
        if (current !== seq.current) return;
        shownIdRef.current = id;
        setIncident(inc);
        setError(undefined);
      } catch (e) {
        if (current !== seq.current) return;
        const text = getIncidentErrorMessage(
          e,
          t('pages.incident.detail.notFound'),
        );
        // 这条故障还在页面上时，刷新遇到网络抖动 / 服务端错误不清空页面——页签里正在编辑的复盘、
        // 评论会随之丢失；服务端明确答复故障已不存在时才换成错误卡片
        if (shownIdRef.current === id && !isGone(e)) {
          if (notify) {
            message.error(text);
          }
          return;
        }
        shownIdRef.current = null;
        setIncident(null);
        setError(text);
      } finally {
        if (current === seq.current) setLoading(false);
      }
    },
    [id, message, t],
  );

  const loadContext = useCallback(async () => {
    // 只采纳最后一次加载的结果：切换故障、手动刷新与自动刷新交错时旧响应不覆盖新数据
    const current = ++contextSeq.current;
    try {
      const result = await getIncidentContext(id);
      if (current !== contextSeq.current) return;
      setContext(result);
    } catch {
      if (current !== contextSeq.current) return;
      setContext(null);
    }
  }, [id]);

  useEffect(() => {
    void load();
    void loadContext();
  }, [load, loadContext]);

  // 自动刷新头部（页面不可见时不刷）
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void load(true);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const refresh = () => {
    void load(true, true);
    void loadContext();
    setRefreshKey((k) => k + 1);
  };

  const setTab = (key: TabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', key);
    setSearchParams(params, { replace: true });
  };

  if (loading && !incident) {
    return (
      <PageContainer title={false}>
        <Spin />
      </PageContainer>
    );
  }
  if (!incident) {
    return (
      <PageContainer title={false}>
        <Card variant="outlined">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={error ?? t('pages.incident.detail.notFound')}
          >
            <Button onClick={() => void load()}>
              {t('pages.incident.retry')}
            </Button>
          </Empty>
        </Card>
      </PageContainer>
    );
  }

  const canHandle = incident.canHandle === true && has('incident.list.handle');
  const canManage = incident.canManage === true && has('incident.list.handle');
  const active = incident.status <= 4;
  const actions = transitions(incident).filter(
    (a) => a === 'respond' || has('incident.list.handle'),
  );
  const moreItems = [
    canHandle &&
      active && { key: 'severity', label: t('pages.incident.action.severity') },
    canManage &&
      active && {
        key: 'commander',
        label: t('pages.incident.action.commander'),
      },
    canHandle &&
      active && {
        key: 'responders',
        label: t('pages.incident.action.responders'),
      },
    canHandle &&
      active && { key: 'watchers', label: t('pages.incident.action.watchers') },
    canHandle &&
      active && { key: 'edit', label: t('pages.incident.action.edit') },
    canHandle &&
      active && { key: 'ticket', label: t('pages.incident.action.ticket') },
    canManage &&
      incident.status <= 3 && {
        key: 'merge',
        label: t('pages.incident.action.merge'),
        danger: true,
      },
  ].filter(Boolean) as { key: string; label: string; danger?: boolean }[];

  const openMore = (key: string) => {
    switch (key) {
      case 'severity':
        return setDialog({ kind: 'severity' });
      case 'commander':
        return setDialog({ kind: 'commander' });
      case 'responders':
        return setDialog({ kind: 'members', role: 2 });
      case 'watchers':
        return setDialog({ kind: 'members', role: 3 });
      case 'edit':
        return setDialog({ kind: 'edit' });
      case 'ticket':
        return setDialog({ kind: 'ticket' });
      case 'merge':
        return setDialog({ kind: 'merge' });
      default:
        return undefined;
    }
  };

  const onDone = () => {
    setDialog(null);
    refresh();
  };

  const tabItems = TAB_KEYS.map((key) => ({
    key,
    label:
      key === 'proposals' && (incident.proposalPending ?? 0) > 0
        ? `${t(`pages.incident.detail.tab.${key}`)} (${incident.proposalPending})`
        : t(`pages.incident.detail.tab.${key}`),
  }));

  return (
    <PageContainer title={false}>
      <Button
        type="link"
        icon={<LeftOutlined />}
        style={{ paddingInline: 0, marginBottom: 12 }}
        onClick={() => history.push('/incident/list')}
      >
        {t('pages.incident.detail.back')}
      </Button>
      <Flex vertical gap={16}>
        <Card variant="outlined">
          <Flex justify="space-between" align="flex-start" gap={16} wrap>
            <div style={{ minWidth: 0 }}>
              <Typography.Title level={4} className={styles.headTitle}>
                <span className={styles.mono}>{incident.number}</span>{' '}
                {incident.title}
              </Typography.Title>
              <Space size={4} wrap style={{ marginTop: 8 }}>
                <SeverityTag severity={incident.severity} />
                <StatusBadge status={incident.status} />
                {incident.isDrill && <Tag>{t('pages.incident.drill')}</Tag>}
                {(incident.escalationLevel ?? 0) > 0 && (
                  <Tag color="purple">
                    {t('pages.incident.escalated', {
                      level: incident.escalationLevel,
                    })}
                  </Tag>
                )}
                {(incident.reopenCount ?? 0) > 0 && (
                  <Tag color="warning">
                    {t('pages.incident.reopened', { n: incident.reopenCount })}
                  </Tag>
                )}
              </Space>
            </div>
            <Space wrap style={{ flex: 'none' }}>
              <Tooltip title={t('pages.incident.detail.refresh')}>
                <Button icon={<ReloadOutlined />} onClick={refresh} />
              </Tooltip>
              {access.canAssistant && (
                <Button
                  icon={<RobotOutlined />}
                  onClick={() =>
                    askAssistant(
                      t('pages.incident.ai.askPrefix', {
                        number: incident.number,
                      }),
                      { type: 'incident', id: incident.id },
                    )
                  }
                >
                  {t('pages.incident.ai.ask')}
                </Button>
              )}
              {actions.map((action) => (
                <Button
                  key={action}
                  type={
                    action === 'respond' || action === 'resolve'
                      ? 'primary'
                      : undefined
                  }
                  danger={action === 'close'}
                  onClick={() => setDialog({ kind: 'transition', action })}
                >
                  {t(`pages.incident.action.${action}`)}
                </Button>
              ))}
              {moreItems.length > 0 && (
                <Dropdown
                  menu={{
                    items: moreItems,
                    onClick: ({ key }) => openMore(key),
                  }}
                >
                  <Button>{t('common.action.more')}</Button>
                </Dropdown>
              )}
            </Space>
          </Flex>
          {incident.status === 6 && incident.mergedInto?.id && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 12 }}
              title={
                <>
                  {t('pages.incident.detail.mergedInto')}{' '}
                  <Link to={incidentPath(incident.mergedInto.id)}>
                    {incident.mergedInto.name || incident.mergedInto.id}
                  </Link>
                </>
              }
            />
          )}
          <Descriptions
            className={styles.headMeta}
            size="small"
            column={{ xs: 1, md: 2, xl: 4 }}
            items={[
              {
                key: 'business',
                label: t('pages.incident.field.business'),
                children: <RefName ref={incident.business} />,
              },
              {
                key: 'commander',
                label: t('pages.incident.field.commander'),
                children: <RefName ref={incident.commander} />,
              },
              {
                key: 'alerts',
                label: t('pages.incident.field.alerts'),
                children: (
                  <>
                    {incident.alertCount ?? 0}
                    {(incident.activeAlertCount ?? 0) > 0 &&
                      ` (${t('pages.incident.detail.activeAlerts', { n: incident.activeAlertCount })})`}
                  </>
                ),
              },
              {
                key: 'activity',
                label: t('pages.incident.field.lastActivity'),
                children: formatTime(incident.lastActivityTime),
              },
            ]}
          />
        </Card>

        <Card variant="outlined">
          <Tabs
            activeKey={tab}
            onChange={(key) => setTab(key as TabKey)}
            items={tabItems}
          />
          {tab === 'overview' && (
            <Overview
              incident={incident}
              context={context}
              onRegenerate={() => {
                message.success(t('pages.incident.ai.queued'));
                refresh();
              }}
            />
          )}
          {tab === 'timeline' && (
            <TimelinePanel incident={incident} refreshKey={refreshKey} />
          )}
          {tab === 'alerts' && (
            <AlertsPanel
              incident={incident}
              refreshKey={refreshKey}
              onChanged={refresh}
            />
          )}
          {tab === 'impact' && (
            <ImpactPanel incident={incident} refreshKey={refreshKey} />
          )}
          {tab === 'proposals' && (
            <ProposalsPanel
              incident={incident}
              refreshKey={refreshKey}
              onChanged={refresh}
            />
          )}
          {tab === 'updates' && (
            <UpdatesPanel
              incident={incident}
              refreshKey={refreshKey}
              onChanged={refresh}
            />
          )}
          {tab === 'postmortem' && (
            <PostmortemPanel
              incident={incident}
              refreshKey={refreshKey}
              onChanged={refresh}
            />
          )}
          {tab === 'agent' && (
            <AgentPanel
              incident={incident}
              refreshKey={refreshKey}
              onChanged={refresh}
            />
          )}
          {tab === 'overview' && access.canKnowledge && (
            <KnowledgeSidebar
              targetType="incident"
              targetId={incident.id}
              query={incident.title}
            />
          )}
        </Card>
      </Flex>
      {dialog?.kind === 'transition' && (
        <TransitionModal
          incident={incident}
          action={dialog.action}
          onClose={() => setDialog(null)}
          onDone={onDone}
        />
      )}
      {dialog?.kind === 'severity' && (
        <SeverityModal
          incident={incident}
          onClose={() => setDialog(null)}
          onDone={onDone}
        />
      )}
      {dialog?.kind === 'commander' && (
        <CommanderModal
          incident={incident}
          onClose={() => setDialog(null)}
          onDone={onDone}
        />
      )}
      {dialog?.kind === 'members' && (
        <MembersModal
          incident={incident}
          role={dialog.role}
          onClose={() => setDialog(null)}
          onDone={onDone}
        />
      )}
      {dialog?.kind === 'merge' && (
        <MergeModal
          incident={incident}
          onClose={() => setDialog(null)}
          onDone={onDone}
        />
      )}
      {dialog?.kind === 'ticket' && (
        <TicketModal
          incident={incident}
          onClose={() => setDialog(null)}
          onDone={onDone}
        />
      )}
      {dialog?.kind === 'edit' && (
        <EditModal
          incident={incident}
          onClose={() => setDialog(null)}
          onDone={onDone}
        />
      )}
    </PageContainer>
  );
};

export default IncidentDetail;
