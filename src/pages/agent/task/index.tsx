/**
 * Agent 运行记录：任务列表（故障 / Profile / 来源 / 状态 / 发起人 / 时间），运行详情抽屉，取消排队 / 进行中的任务。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useSearchParams } from '@umijs/max';
import { App, Space, Tag } from 'antd';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ConfirmLink } from '@/components/TableActions';
import { useIncidentStyles } from '@/pages/incident/components/styles';
import { SeverityTag } from '@/pages/incident/components/tags';
import { listProfiles } from '@/services/agent/profile';
import { cancelTask, listTasks } from '@/services/agent/task';
import type {
  AgentTask,
  TaskSource,
  TaskStatus,
} from '@/services/agent/typings';
import { usePermissions } from '@/services/system/permissions';
import { formatTime } from '@/utils/format';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import {
  SOURCE_META,
  SOURCE_ORDER,
  TASK_STATUS_META,
} from '../components/meta';
import { RunDrawer } from '../components/RunDrawer';

const TaskList: React.FC = () => {
  const t = useT();
  const has = usePermissions();
  const { message } = App.useApp();
  const { styles } = useIncidentStyles();
  const actionRef = useRef<ActionType>(null);
  const [params, setParams] = useSearchParams();
  const statusEnum = useValueEnum(TASK_STATUS_META);
  const sourceText = useEnumText(SOURCE_META);
  const [runId, setRunId] = useState<string | undefined>(
    params.get('runId') ?? undefined,
  );

  // 地址栏带 runId（故障时间线 / 通知跳转）直接打开运行详情
  useEffect(() => {
    const id = params.get('runId');
    if (id) setRunId(id);
  }, [params]);

  const closeRun = () => {
    setRunId(undefined);
    if (params.has('runId')) {
      const next = new URLSearchParams(params);
      next.delete('runId');
      setParams(next, { replace: true });
    }
  };

  const columns: ProColumns<AgentTask>[] = [
    {
      title: t('pages.agent.task.column.incident'),
      dataIndex: 'incidentId',
      search: false,
      ellipsis: true,
      render: (_, r) => (
        <div>
          <Space size={6}>
            {r.incident && (
              <Link to={`/incident/detail/${r.incident.id}?tab=agent`}>
                {r.incident.name || r.incident.id}
              </Link>
            )}
            <SeverityTag severity={r.severity} />
            {r.dryRun && <Tag>{t('pages.agent.task.dryRun')}</Tag>}
          </Space>
          {r.incidentTitle && (
            <div className={styles.hint}>{r.incidentTitle}</div>
          )}
        </div>
      ),
    },
    {
      title: t('pages.agent.task.column.profile'),
      dataIndex: 'profileId',
      valueType: 'select',
      width: 160,
      ellipsis: true,
      request: async () => {
        const res = await listProfiles(
          { page: 1, pageSize: 100 },
          { silent: true },
        );
        return res.items.map((p) => ({ label: p.spec.name, value: p.id }));
      },
      render: (_, r) => r.profile?.name ?? t('common.empty'),
    },
    {
      title: t('pages.agent.task.column.source'),
      dataIndex: 'source',
      valueType: 'select',
      width: 130,
      valueEnum: Object.fromEntries(
        SOURCE_ORDER.map((s) => [s, { text: sourceText(s) }]),
      ),
      render: (_, r) => (r.source ? sourceText(r.source) : t('common.empty')),
    },
    {
      title: t('pages.agent.task.column.status'),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: statusEnum,
      width: 110,
    },
    {
      title: t('pages.agent.task.column.requester'),
      dataIndex: 'requester',
      search: false,
      width: 120,
      ellipsis: true,
      render: (_, r) => r.requester?.name ?? t('common.empty'),
    },
    {
      title: t('pages.agent.task.column.queuedTime'),
      dataIndex: 'queuedTime',
      search: false,
      width: 160,
      render: (_, r) => formatTime(r.queuedTime),
    },
    {
      title: t('pages.agent.task.column.endTime'),
      dataIndex: 'endTime',
      search: false,
      width: 160,
      render: (_, r) =>
        r.endTime
          ? formatTime(r.endTime)
          : r.nextTime && r.status === 'queued'
            ? t('pages.agent.task.nextTime', { time: formatTime(r.nextTime) })
            : t('common.empty'),
    },
    {
      title: t('pages.agent.task.column.result'),
      dataIndex: 'reason',
      search: false,
      ellipsis: true,
      render: (_, r) => (
        <span>
          {(r.attempts ?? 0) > 1 && (
            <Tag>{t('pages.agent.task.attempts', { n: r.attempts })}</Tag>
          )}
          {r.reason || t('common.empty')}
        </span>
      ),
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, r) => [
        r.runId ? (
          <a key="run" onClick={() => setRunId(r.runId)}>
            {t('pages.agent.task.viewRun')}
          </a>
        ) : null,
        has('agent.task.run') &&
        (r.status === 'queued' || r.status === 'running') ? (
          <ConfirmLink
            key="cancel"
            danger
            title={t('pages.agent.task.cancelConfirm')}
            onConfirm={async () => {
              await cancelTask(r.id);
              message.success(t('pages.agent.task.cancelled'));
              actionRef.current?.reload();
            }}
          >
            {t('pages.agent.task.cancel')}
          </ConfirmLink>
        ) : null,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<AgentTask>
        cardBordered
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        columnEmptyText={t('common.empty')}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 'max-content' }}
        polling={10_000}
        request={async (p) =>
          toTableResult(
            await listTasks({
              page: p.current,
              pageSize: p.pageSize,
              profileId: (p.profileId as string | undefined) || undefined,
              status: (p.status as TaskStatus | undefined) || undefined,
              source: p.source ? (Number(p.source) as TaskSource) : undefined,
            }),
          )
        }
      />
      <RunDrawer
        runId={runId}
        onClose={closeRun}
        onChanged={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default TaskList;
