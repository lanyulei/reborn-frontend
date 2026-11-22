/**
 * 复盘看板：待复盘 / 复盘中 / 已完成的故障（含超期标记）与全部改进项（按状态 / 负责人 / 超期筛选）两个页签。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Link, useSearchParams } from '@umijs/max';
import { Badge, Form, Tag } from 'antd';
import type React from 'react';
import { useRef } from 'react';
import { UserSelect } from '@/components/UserSelect';
import { listIncidents } from '@/services/incident/incident';
import { listActionItems } from '@/services/incident/postmortem';
import type {
  ActionItem,
  ActionItemStatus,
  Incident,
  ReviewStatus,
} from '@/services/incident/typings';
import { formatTime } from '@/utils/format';
import { useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { fetchIncidentUsers } from '../components/hooks';
import {
  ITEM_KIND_META,
  ITEM_STATUS_META,
  incidentPath,
  REVIEW_META,
} from '../components/meta';
import { useIncidentStyles } from '../components/styles';
import { RefName, ReviewBadge, SeverityTag } from '../components/tags';

type TabKey = 'incidents' | 'items';

const badge = (status?: string) =>
  (status?.toLowerCase() ?? 'default') as
    | 'success'
    | 'processing'
    | 'error'
    | 'default'
    | 'warning';

const ReviewBoard: React.FC = () => {
  const t = useT();
  const { styles } = useIncidentStyles();
  const actionRef = useRef<ActionType>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: TabKey =
    searchParams.get('tab') === 'items' ? 'items' : 'incidents';
  const reviewEnum = useValueEnum({
    1: REVIEW_META[1],
    2: REVIEW_META[2],
    3: REVIEW_META[3],
  });
  const itemStatusEnum = useValueEnum(ITEM_STATUS_META);

  const incidentColumns: ProColumns<Incident>[] = [
    {
      title: t('pages.incident.field.severity'),
      dataIndex: 'severity',
      search: false,
      width: 90,
      render: (_, row) => <SeverityTag severity={row.severity} />,
    },
    {
      title: t('pages.incident.field.number'),
      dataIndex: 'number',
      search: false,
      width: 170,
      render: (_, row) => (
        <Link
          to={`${incidentPath(row.id)}?tab=postmortem`}
          className={styles.mono}
        >
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
        <Link to={`${incidentPath(row.id)}?tab=postmortem`}>{row.title}</Link>
      ),
    },
    {
      title: t('pages.incident.field.reviewStatus'),
      dataIndex: 'reviewStatus',
      valueEnum: reviewEnum,
      initialValue: '1',
      width: 140,
      render: (_, row) => (
        <ReviewBadge
          status={row.reviewStatus}
          overdue={
            !!row.reviewDue &&
            row.reviewStatus !== 3 &&
            new Date(row.reviewDue) < new Date()
          }
        />
      ),
    },
    {
      title: t('pages.incident.review.overdueOnly'),
      dataIndex: 'reviewOverdue',
      hideInTable: true,
      valueEnum: { true: { text: t('pages.incident.review.overdue') } },
    },
    {
      title: t('pages.incident.field.business'),
      dataIndex: 'business',
      search: false,
      width: 120,
      ellipsis: true,
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
      title: t('pages.incident.field.resolveTime'),
      dataIndex: 'resolveTime',
      search: false,
      width: 160,
      render: (_, row) => formatTime(row.resolveTime),
    },
    {
      title: t('pages.incident.field.reviewDue'),
      dataIndex: 'reviewDue',
      search: false,
      width: 160,
      render: (_, row) => formatTime(row.reviewDue) || t('common.empty'),
    },
  ];

  const itemColumns: ProColumns<ActionItem>[] = [
    {
      title: t('pages.incident.item.title'),
      dataIndex: 'title',
      search: false,
      ellipsis: true,
    },
    {
      title: t('pages.incident.field.number'),
      dataIndex: 'incidentNumber',
      search: false,
      width: 170,
      render: (_, row) => (
        <Link
          to={`${incidentPath(row.incidentId)}?tab=postmortem`}
          className={styles.mono}
        >
          {row.incidentNumber}
        </Link>
      ),
    },
    {
      title: t('pages.incident.item.kind'),
      dataIndex: 'kind',
      search: false,
      width: 90,
      render: (_, row) => (row.kind ? t(ITEM_KIND_META[row.kind].textId) : ''),
    },
    {
      title: t('pages.incident.item.owner'),
      dataIndex: 'ownerId',
      width: 120,
      ellipsis: true,
      formItemRender: () => (
        <Form.Item noStyle>
          <UserSelect
            fetchUsers={fetchIncidentUsers}
            placeholder={t('pages.incident.field.userPlaceholder')}
          />
        </Form.Item>
      ),
      render: (_, row) => <RefName ref={row.owner} />,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: itemStatusEnum,
      width: 100,
      render: (_, row) => {
        const meta = row.status ? ITEM_STATUS_META[row.status] : undefined;
        return meta ? (
          <Badge status={badge(meta.status)} text={t(meta.textId)} />
        ) : null;
      },
    },
    {
      title: t('pages.incident.item.dueDate'),
      dataIndex: 'dueDate',
      search: false,
      width: 140,
      render: (_, row) => (
        <>
          {row.dueDate || t('common.empty')}
          {row.overdue && (
            <Tag color="error" style={{ marginInlineStart: 6 }}>
              {t('pages.incident.item.overdue')}
            </Tag>
          )}
        </>
      ),
    },
    {
      title: t('pages.incident.item.overdue'),
      dataIndex: 'overdue',
      hideInTable: true,
      valueEnum: { true: { text: t('pages.incident.item.overdueOnly') } },
    },
    {
      title: t('pages.incident.item.ticketNumber'),
      dataIndex: 'ticketNumber',
      search: false,
      width: 140,
      render: (_, row) => row.ticketNumber || t('common.empty'),
    },
  ];

  return (
    <PageContainer
      title={false}
      tabList={[
        { key: 'incidents', tab: t('pages.incident.review.tab.incidents') },
        { key: 'items', tab: t('pages.incident.review.tab.items') },
      ]}
      tabActiveKey={tab}
      onTabChange={(key) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', key);
        setSearchParams(params, { replace: true });
      }}
    >
      {tab === 'incidents' ? (
        <ProTable<Incident>
          key="incidents"
          rowKey="id"
          actionRef={actionRef}
          columns={incidentColumns}
          cardBordered
          request={async (params) => {
            const result = await listIncidents({
              page: params.current,
              pageSize: params.pageSize,
              reviewStatus: params.reviewStatus
                ? (Number(params.reviewStatus) as ReviewStatus)
                : undefined,
              reviewOverdue: parseBoolParam(params.reviewOverdue),
            });
            return toTableResult(result);
          }}
          columnEmptyText={t('common.empty')}
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 'max-content' }}
        />
      ) : (
        <ProTable<ActionItem>
          key="items"
          rowKey="id"
          actionRef={actionRef}
          columns={itemColumns}
          cardBordered
          request={async (params) => {
            const result = await listActionItems({
              page: params.current,
              pageSize: params.pageSize,
              status: params.status
                ? (Number(params.status) as ActionItemStatus)
                : undefined,
              ownerId: params.ownerId || undefined,
              overdue: parseBoolParam(params.overdue),
            });
            return toTableResult(result);
          }}
          columnEmptyText={t('common.empty')}
          search={{ labelWidth: 'auto' }}
          scroll={{ x: 'max-content' }}
        />
      )}
    </PageContainer>
  );
};

export default ReviewBoard;
