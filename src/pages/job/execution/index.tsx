/**
 * 执行记录：按提交时间倒序列出作业执行。当前页有排队中 / 执行中的记录时每 5 秒自动刷新
 * （页面可见时），执行中的行实时显示已用时长。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, Link, useSearchParams } from '@umijs/max';
import { Alert, App, Button, Tag, Tooltip } from 'antd';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { ConfirmLink } from '@/components/TableActions';
import {
  cancelJobExecution,
  listJobExecutions,
} from '@/services/job/execution';
import type {
  JobExecution,
  JobExecutionStatus,
  JobKind,
  JobTriggerSource,
} from '@/services/job/typings';
import { usePermissions } from '@/services/system/permissions';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { timeRangeColumn } from '@/utils/table';
import {
  formatDuration,
  formatTime,
  secondsBetween,
} from '../components/format';
import { useNow, usePageVisible, usePolledRequest } from '../components/hooks';
import {
  EXECUTION_STATUS_META,
  isActiveStatus,
  JOB_LIMITS,
  KIND_META,
  TRIGGER_SOURCE_META,
} from '../components/meta';
import { useJobStyles } from '../components/styles';
import { TemplateSelect } from '../components/TemplateSelect';
import { CheckModeTag, ExecutionStatusTag, KindTag } from '../components/tags';

/** 自动刷新间隔 */
const REFRESH_MS = 5000;

/** 主机结果概括：12 ✓ / 1 ✗ / 0 不可达（共 13） */
const HostSummary: React.FC<{ record: JobExecution }> = ({ record }) => {
  const t = useT();
  const { styles, cx } = useJobStyles();
  const failed = record.hostFailed ?? 0;
  const unreachable = record.hostUnreachable ?? 0;
  return (
    <Tooltip
      title={t('pages.job.execution.hosts.tooltip', {
        ok: record.hostOk ?? 0,
        failed,
        unreachable,
        total: record.hostTotal ?? 0,
      })}
    >
      <span className={styles.tabular}>
        <span className={styles.success}>{record.hostOk ?? 0} ✓</span>
        {' / '}
        <span className={cx(failed > 0 && styles.danger)}>{failed} ✗</span>
        {' / '}
        <span className={cx(unreachable > 0 && styles.danger)}>
          {t('pages.job.execution.hosts.unreachable', { n: unreachable })}
        </span>
        <span className={styles.secondary} style={{ marginInlineStart: 6 }}>
          {t('pages.job.execution.hosts.total', { n: record.hostTotal ?? 0 })}
        </span>
      </span>
    </Tooltip>
  );
};

const ExecutionList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const t = useT();
  const { styles } = useJobStyles();
  // 作业模板列表的「执行记录」带模板跳转过来
  const [searchParams] = useSearchParams();
  const statusEnum = useValueEnum(EXECUTION_STATUS_META);
  const visible = usePageVisible();
  const polled = usePolledRequest();
  // 当前页是否有未结束的执行：决定是否自动刷新、时长是否跳动
  const [hasActive, setHasActive] = useState(false);
  const now = useNow(hasActive && visible);

  const kindEnum = useValueEnum(KIND_META);
  const triggerEnum = useValueEnum(TRIGGER_SOURCE_META);
  const triggerText = useEnumText(TRIGGER_SOURCE_META);
  // 从定时作业 / 触发器的「执行记录」、切片标签带过来的过滤：不在筛选表单里，在表格上方提示并可清除
  const triggerRef = searchParams.get('triggerRef') ?? undefined;
  const groupId = searchParams.get('groupId') ?? undefined;

  const initialValues = useMemo(
    () => ({ templateId: searchParams.get('templateId') ?? undefined }),
    [searchParams],
  );

  const cancel = async (record: JobExecution) => {
    try {
      await cancelJobExecution(record.id);
    } catch {
      // 已由请求层提示（已结束等）
      actionRef.current?.reload();
      return;
    }
    message.success(t('pages.job.execution.cancel.requested'));
    actionRef.current?.reload();
  };

  const columns: ProColumns<JobExecution>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t('pages.job.execution.search.placeholder'),
        maxLength: JOB_LIMITS.keywordMax,
      },
    },
    {
      title: t('common.column.status'),
      dataIndex: 'statuses',
      valueType: 'select',
      valueEnum: statusEnum,
      fieldProps: { mode: 'multiple' },
      width: 120,
      render: (_, record) => <ExecutionStatusTag status={record.status} />,
    },
    {
      title: t('pages.job.execution.column.template'),
      dataIndex: 'templateId',
      formItemRender: (_, { value, onChange }) => (
        <TemplateSelect
          value={value as string | undefined}
          onChange={onChange}
        />
      ),
      render: (_, record) => (
        <span>
          <Link to={`/job/execution/${record.id}`}>
            {record.templateName || record.id}
          </Link>
          {(record.kind ?? 1) === 1 && (
            <span className={styles.secondary} style={{ marginInlineStart: 6 }}>
              v{record.templateVersion ?? 1}
            </span>
          )}
          {(record.sliceTotal ?? 0) > 0 && record.groupId && (
            <Tooltip title={t('pages.job.execution.slice.tooltip')}>
              <Link
                to={`/job/history?groupId=${record.groupId}`}
                style={{ marginInlineStart: 8 }}
              >
                <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
                  {t('pages.job.execution.slice', {
                    no: record.sliceNo ?? 0,
                    total: record.sliceTotal ?? 0,
                  })}
                </Tag>
              </Link>
            </Tooltip>
          )}
          {record.check && (
            <span style={{ marginInlineStart: 8 }}>
              <CheckModeTag />
            </span>
          )}
        </span>
      ),
    },
    {
      title: t('pages.job.execution.column.kind'),
      dataIndex: 'kinds',
      valueType: 'select',
      valueEnum: kindEnum,
      fieldProps: { mode: 'multiple' },
      width: 100,
      render: (_, record) => <KindTag kind={record.kind} />,
    },
    {
      title: t('pages.job.execution.column.trigger'),
      dataIndex: 'triggers',
      valueType: 'select',
      valueEnum: triggerEnum,
      fieldProps: { mode: 'multiple' },
      width: 160,
      render: (_, record) => {
        const source = record.trigger ?? 1;
        if (source === 1) return triggerText(1);
        // 来源对象已被删除时没有名称
        return (
          <span>
            {triggerText(source)}
            {record.triggerName && (
              <Link
                to={`/job/history?triggerRef=${record.triggerRef ?? ''}`}
                style={{ marginInlineStart: 6 }}
              >
                {record.triggerName}
              </Link>
            )}
          </span>
        );
      },
    },
    {
      title: t('pages.job.execution.column.hosts'),
      dataIndex: 'hostTotal',
      search: false,
      width: 240,
      render: (_, record) => <HostSummary record={record} />,
    },
    {
      title: t('pages.job.execution.column.creator'),
      dataIndex: 'creatorName',
      search: false,
      width: 120,
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('pages.job.execution.mine'),
      dataIndex: 'mine',
      valueType: 'switch',
      hideInTable: true,
    },
    {
      title: t('pages.job.execution.column.runner'),
      dataIndex: 'runnerName',
      search: false,
      width: 140,
      renderText: (value?: string) => value || t('common.empty'),
    },
    {
      title: t('pages.job.execution.column.createTime'),
      dataIndex: 'createTime',
      search: false,
      width: 170,
      renderText: (value?: string) => formatTime(value) || t('common.empty'),
    },
    {
      title: t('pages.job.execution.column.duration'),
      dataIndex: 'finishTime',
      search: false,
      width: 130,
      render: (_, record) => {
        // 执行中：已用时长随时间跳动；排队中尚未开始
        const seconds = secondsBetween(
          record.startTime,
          record.finishTime,
          now,
        );
        return (
          <span className={styles.tabular}>
            {seconds === undefined
              ? t('common.empty')
              : formatDuration(seconds, t)}
          </span>
        );
      },
    },
    timeRangeColumn<JobExecution>(t, { start: 'startTime', end: 'endTime' }),
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 120,
      render: (_, record) => {
        const actions: React.ReactNode[] = [
          <Link key="detail" to={`/job/execution/${record.id}`}>
            {t('pages.job.execution.detail')}
          </Link>,
        ];
        if (has('job.execution.cancel') && isActiveStatus(record.status)) {
          actions.push(
            record.cancelRequested ? (
              <span key="cancel" className={styles.secondary}>
                {t('pages.job.execution.cancelling')}
              </span>
            ) : (
              <ConfirmLink
                key="cancel"
                danger
                title={t('pages.job.execution.cancel.title', {
                  name: record.templateName ?? '',
                })}
                description={t(
                  record.status === 9
                    ? 'pages.job.execution.cancel.description.approval'
                    : record.status === 2
                      ? 'pages.job.execution.cancel.description.running'
                      : 'pages.job.execution.cancel.description.queued',
                )}
                onConfirm={() => cancel(record)}
              >
                {t(
                  record.status === 9
                    ? 'pages.job.execution.withdraw'
                    : 'pages.job.execution.cancel',
                )}
              </ConfirmLink>
            ),
          );
        }
        return actions;
      },
    },
  ];

  return (
    <PageContainer title={false}>
      {(triggerRef || groupId) && (
        <Alert
          type="info"
          showIcon
          title={t(
            groupId
              ? 'pages.job.execution.filter.group'
              : 'pages.job.execution.filter.triggerRef',
          )}
          action={
            <Button
              size="small"
              type="link"
              onClick={() => history.push('/job/history')}
            >
              {t('pages.job.execution.filter.clear')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      <ProTable<JobExecution>
        // 地址栏里的过滤变了：重建表格以重新查询
        key={`${triggerRef ?? ''}|${groupId ?? ''}`}
        cardBordered
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        form={{ initialValues }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        // 有未结束的执行且页面可见时自动刷新
        polling={hasActive && visible ? REFRESH_MS : undefined}
        request={async (params) => {
          const result = await polled(() =>
            listJobExecutions(
              {
                page: params.current,
                pageSize: params.pageSize,
                keyword: params.keyword || undefined,
                templateId: params.templateId || undefined,
                statuses: (params.statuses as string[] | undefined)?.map(
                  (status) => Number(status) as JobExecutionStatus,
                ),
                kinds: (params.kinds as string[] | undefined)?.map(
                  (kind) => Number(kind) as JobKind,
                ),
                triggers: (params.triggers as string[] | undefined)?.map(
                  (source) => Number(source) as JobTriggerSource,
                ),
                triggerRef,
                groupId,
                mine: params.mine === true ? true : undefined,
                startTime: params.startTime,
                endTime: params.endTime,
              },
              { silent: true },
            ),
          );
          if (result.success) {
            setHasActive(
              result.data.some((item) => isActiveStatus(item.status)),
            );
          }
          return result;
        }}
      />
    </PageContainer>
  );
};

export default ExecutionList;
