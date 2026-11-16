/**
 * 全部工单（管理视图）：按状态 / 优先级 / 服务筛选，查看任意工单的详情与流程进度；
 * 终止流程、改派任务等管理动作仍以流程引擎的权限为准。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Tag } from 'antd';
import type React from 'react';
import { useRef } from 'react';
import { listManagedCatalog, listTickets } from '@/services/ticket';
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from '@/services/ticket/typings';
import { useOptions, useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import {
  PriorityTag,
  TICKET_PRIORITY_META,
  TICKET_PRIORITY_ORDER,
  TICKET_STATUS_META,
  ticketSla,
} from '../components/meta';

const AllTickets: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const t = useT();
  const statusEnum = useValueEnum(TICKET_STATUS_META);
  const priorityOptions = useOptions(
    TICKET_PRIORITY_META,
    TICKET_PRIORITY_ORDER,
  );

  const open = (ticket: Ticket) => history.push(`/ticket/detail/${ticket.id}`);

  const columns: ProColumns<Ticket>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.ticket.search.placeholder') },
    },
    {
      title: t('pages.ticket.column.number'),
      dataIndex: 'number',
      search: false,
      copyable: true,
      width: 190,
    },
    {
      title: t('pages.ticket.column.title'),
      dataIndex: 'title',
      search: false,
      ellipsis: true,
      render: (_, record) => <a onClick={() => open(record)}>{record.title}</a>,
    },
    {
      title: t('pages.ticket.column.template'),
      dataIndex: 'templateId',
      valueType: 'select',
      ellipsis: true,
      width: 160,
      fieldProps: { showSearch: true },
      // 筛选项含已停用的模板：它们名下仍可能有工单
      request: async () => {
        const { items } = await listManagedCatalog();
        return (items ?? []).map((category) => ({
          label: category.name,
          options: (category.templates ?? []).map((item) => ({
            label: item.name,
            value: item.id,
          })),
        }));
      },
      render: (_, record) => record.templateName,
    },
    {
      title: t('pages.ticket.column.priority'),
      dataIndex: 'priority',
      valueType: 'select',
      fieldProps: { options: priorityOptions },
      width: 90,
      render: (_, record) => <PriorityTag priority={record.priority} />,
    },
    {
      title: t('pages.ticket.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 110,
    },
    {
      title: t('pages.ticket.column.sla'),
      key: 'sla',
      search: false,
      width: 90,
      render: (_, record) => {
        if (!record.responseDue && !record.resolveDue) return t('common.empty');
        const sla = ticketSla(record);
        const breached =
          sla.response.state === 'breached' || sla.resolve.state === 'breached';
        return breached ? (
          <Tag color="error">{t('pages.ticket.sla.state.breached')}</Tag>
        ) : (
          <Tag color="success">{t('pages.ticket.sla.state.ok')}</Tag>
        );
      },
    },
    {
      title: t('pages.ticket.filter.overdue'),
      dataIndex: 'overdue',
      valueType: 'switch',
      hideInTable: true,
    },
    {
      title: t('pages.ticket.column.creator'),
      dataIndex: 'creatorName',
      search: false,
      width: 120,
      renderText: (_, record) => record.creatorName || record.creator,
    },
    {
      title: t('pages.ticket.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('pages.ticket.column.endTime'),
      dataIndex: 'endTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <a onClick={() => open(record)}>{t('common.action.view')}</a>
      ),
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<Ticket>
        cardBordered
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) =>
          toTableResult(
            await listTickets({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              templateId: params.templateId || undefined,
              status: params.status
                ? (Number(params.status) as TicketStatus)
                : undefined,
              priority: params.priority
                ? (Number(params.priority) as TicketPriority)
                : undefined,
              overdue: params.overdue ? true : undefined,
            }),
          )
        }
      />
    </PageContainer>
  );
};

export default AllTickets;
