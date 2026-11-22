/**
 * 故障列表：活跃 / 我参与的 / 全部 / 候选故障四个页签。活跃页按等级、状态、业务、指挥官筛选并自动刷新；
 * 候选页展示规则聚合中尚未达阈值的告警组，可手动升级或忽略。
 */
import { SyncOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, Link, useSearchParams } from '@umijs/max';
import { App, Badge, Select, Space, Tag, Tooltip, theme } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { ConfirmLink, CreateButton } from '@/components/TableActions';
import {
  dismissCandidate,
  listCandidates,
  listIncidents,
  promoteCandidate,
} from '@/services/incident/incident';
import type {
  Candidate,
  CandidateStatus,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  ListIncidentsParams,
} from '@/services/incident/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, timeRangeColumn, toTableResult } from '@/utils/table';
import { CreateIncidentModal } from '../components/CreateIncidentModal';
import { useIncidentOptions } from '../components/hooks';
import {
  CANDIDATE_STATUS_META,
  INCIDENT_LIMITS,
  incidentPath,
  SEVERITY_META,
  STATUS_META,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import {
  RefName,
  ReviewBadge,
  SeverityTag,
  StatusBadge,
} from '../components/tags';

type TabKey = 'active' | 'mine' | 'all' | 'candidate';
const TABS: readonly TabKey[] = ['active', 'mine', 'all', 'candidate'];
const REFRESH_OPTIONS = [0, 15, 30, 60] as const;

const IncidentList: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const { styles } = useIncidentStyles();
  const actionRef = useRef<ActionType>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const tab: TabKey = tabParam && TABS.includes(tabParam) ? tabParam : 'active';
  const [refresh, setRefresh] = useState<number>(30);
  const [createOpen, setCreateOpen] = useState(false);
  const { options } = useIncidentOptions(['businesses']);
  const severityEnum = useValueEnum(SEVERITY_META);
  const statusEnum = useValueEnum(STATUS_META);
  const candidateText = useEnumText(CANDIDATE_STATUS_META);

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const columns: ProColumns<Incident>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.incident.list.keywordPlaceholder'),
        maxLength: INCIDENT_LIMITS.keywordMax,
      },
    },
    {
      title: t('pages.incident.field.severity'),
      dataIndex: 'severity',
      valueEnum: severityEnum,
      width: 90,
      render: (_, row) => <SeverityTag severity={row.severity} />,
    },
    {
      title: t('pages.incident.field.number'),
      dataIndex: 'number',
      search: false,
      width: 170,
      render: (_, row) => (
        <Link to={incidentPath(row.id)} className={styles.mono}>
          {row.number}
        </Link>
      ),
    },
    {
      title: t('pages.incident.field.title'),
      dataIndex: 'title',
      search: false,
      ellipsis: true,
      render: (_, row) => (
        <Space size={6} wrap>
          <Link to={incidentPath(row.id)}>{row.title}</Link>
          {row.isDrill && <Tag>{t('pages.incident.drill')}</Tag>}
          {(row.escalationLevel ?? 0) > 0 && (
            <Tag color="purple">
              {t('pages.incident.escalated', { level: row.escalationLevel })}
            </Tag>
          )}
          {(row.proposalPending ?? 0) > 0 && (
            <Tag color="warning">
              {t('pages.incident.proposalPending', { n: row.proposalPending })}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 100,
      search: tab === 'active' ? false : undefined,
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      title: t('pages.incident.field.business'),
      dataIndex: 'businessId',
      width: 120,
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        options: (options.businesses ?? []).map((b) => ({
          value: b.id,
          label: b.name || b.id,
        })),
      },
      render: (_, row) => <RefName ref={row.business} />,
    },
    {
      title: t('pages.incident.field.commander'),
      dataIndex: 'commander',
      search: false,
      width: 110,
      ellipsis: true,
      render: (_, row) => <RefName ref={row.commander} />,
    },
    {
      title: t('pages.incident.field.alerts'),
      dataIndex: 'alertCount',
      search: false,
      width: 90,
      render: (_, row) =>
        row.alertCount ? (
          <Tooltip title={t('pages.incident.list.alertsTip')}>
            <Badge
              count={row.activeAlertCount ?? 0}
              size="small"
              offset={[8, 0]}
              showZero={false}
            >
              <span>{row.alertCount}</span>
            </Badge>
          </Tooltip>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.incident.field.reviewStatus'),
      dataIndex: 'reviewStatus',
      search: false,
      width: 110,
      hideInTable: tab === 'active',
      render: (_, row) =>
        row.reviewStatus ? (
          <ReviewBadge status={row.reviewStatus} />
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.incident.field.openTime'),
      dataIndex: 'openTime',
      search: false,
      width: 160,
      render: (_, row) => formatTime(row.openTime),
    },
    {
      title: t('pages.incident.field.isDrill'),
      dataIndex: 'isDrill',
      hideInTable: true,
      valueEnum: {
        true: { text: t('pages.incident.drill') },
        false: { text: t('pages.incident.notDrill') },
      },
    },
    timeRangeColumn<Incident>(t, {
      start: 'openTimeStart',
      end: 'openTimeEnd',
    }),
  ];

  const candidateColumns: ProColumns<Candidate>[] = [
    {
      title: t('pages.incident.candidate.rule'),
      dataIndex: 'rule',
      search: false,
      render: (_, row) => <RefName ref={row.rule} />,
    },
    {
      title: t('pages.incident.candidate.key'),
      dataIndex: 'correlationKey',
      search: false,
      ellipsis: true,
      render: (_, row) => (
        <span className={styles.mono}>{row.correlationKey}</span>
      ),
    },
    {
      title: t('pages.incident.candidate.alerts'),
      dataIndex: 'alertCount',
      search: false,
      width: 90,
    },
    {
      title: t('pages.incident.candidate.cis'),
      dataIndex: 'ciCount',
      search: false,
      width: 90,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      width: 100,
      valueEnum: useValueEnum(CANDIDATE_STATUS_META),
      initialValue: '1',
      render: (_, row) => (row.status ? candidateText(row.status) : ''),
    },
    {
      title: t('pages.incident.candidate.incident'),
      dataIndex: 'incident',
      search: false,
      width: 160,
      render: (_, row) =>
        row.incident?.id ? (
          <Link to={incidentPath(row.incident.id)}>
            {row.incident.name || row.incident.id}
          </Link>
        ) : (
          t('common.empty')
        ),
    },
    {
      title: t('pages.incident.candidate.firstTime'),
      dataIndex: 'firstTime',
      search: false,
      width: 160,
      render: (_, row) => formatTime(row.firstTime),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 140,
      hideInTable: !has('incident.list.create'),
      render: (_, row) =>
        row.status === 1
          ? [
              <ConfirmLink
                key="promote"
                title={t('pages.incident.candidate.promote.title')}
                description={t('pages.incident.candidate.promote.desc')}
                onConfirm={async () => {
                  const incident = await promoteCandidate(row.id, {});
                  message.success(
                    t('pages.incident.msg.created', { n: incident.number }),
                  );
                  history.push(incidentPath(incident.id));
                }}
              >
                {t('pages.incident.candidate.promote')}
              </ConfirmLink>,
              <ConfirmLink
                key="dismiss"
                danger
                title={t('pages.incident.candidate.dismiss.title')}
                description={t('pages.incident.candidate.dismiss.desc')}
                onConfirm={async () => {
                  await dismissCandidate(row.id);
                  message.success(t('pages.incident.candidate.dismissed'));
                  actionRef.current?.reload();
                }}
              >
                {t('pages.incident.candidate.dismiss')}
              </ConfirmLink>,
            ]
          : null,
    },
  ];

  // 工具栏标题容器自带 500 字重 / 16px：恢复默认字体，控件不加粗不加黑
  const toolbar = (
    <Space style={{ fontSize: token.fontSize, fontWeight: 400 }}>
      {has('incident.list.create') && (
        <CreateButton onClick={() => setCreateOpen(true)}>
          {t('pages.incident.create.title')}
        </CreateButton>
      )}
      <Select<number>
        value={refresh}
        onChange={setRefresh}
        options={REFRESH_OPTIONS.map((s) => ({
          value: s,
          label: s
            ? t('pages.incident.list.refreshEvery', { s })
            : t('pages.incident.list.refreshOff'),
        }))}
        suffix={<SyncOutlined />}
        style={{ width: 140 }}
      />
    </Space>
  );

  return (
    <PageContainer
      title={false}
      tabList={TABS.map((key) => ({
        key,
        tab: t(`pages.incident.list.tab.${key}`),
      }))}
      tabActiveKey={tab}
      onTabChange={(key) => setTab(key as TabKey)}
    >
      {tab === 'candidate' ? (
        <ProTable<Candidate>
          key="candidate"
          rowKey="id"
          actionRef={actionRef}
          columns={candidateColumns}
          cardBordered
          headerTitle={toolbar}
          polling={refresh ? refresh * 1000 : undefined}
          request={async (params) => {
            const result = await listCandidates({
              page: params.current,
              pageSize: params.pageSize,
              status: params.status
                ? (Number(params.status) as CandidateStatus)
                : undefined,
            });
            return toTableResult(result);
          }}
          columnEmptyText={t('common.empty')}
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 'max-content' }}
        />
      ) : (
        <ProTable<Incident>
          key={tab}
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          cardBordered
          headerTitle={toolbar}
          polling={tab === 'active' && refresh ? refresh * 1000 : undefined}
          request={async (params) => {
            const query: ListIncidentsParams = {
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword?.trim() || undefined,
              active: tab === 'active' || undefined,
              mine: tab === 'mine' || undefined,
              severities: params.severity
                ? [Number(params.severity) as IncidentSeverity]
                : undefined,
              statuses:
                tab !== 'active' && params.status
                  ? [Number(params.status) as IncidentStatus]
                  : undefined,
              businessId: params.businessId || undefined,
              isDrill: parseBoolParam(params.isDrill),
              openTimeStart: params.openTimeStart,
              openTimeEnd: params.openTimeEnd,
            };
            return toTableResult(await listIncidents(query));
          }}
          columnEmptyText={t('common.empty')}
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 'max-content' }}
        />
      )}
      <CreateIncidentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(incident) => history.push(incidentPath(incident.id))}
      />
    </PageContainer>
  );
};

export default IncidentList;
