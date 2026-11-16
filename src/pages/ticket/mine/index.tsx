/**
 * 我的工单：待我处理 / 我已处理 / 我提交的 三个视图，并可提交工单。
 * 待办与已办来自流程引擎的任务列表（按业务类型过滤），处理动作在工单详情里完成。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import { Button, Rate, Space, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { CreateButton } from '@/components/TableActions';
import { Delegations } from '@/pages/workflow/components/Delegations';
import { ASSIGNEE_STATUS_META } from '@/pages/workflow/components/meta';
import { usePermissions } from '@/services/system/permissions';
import { listMyTickets, listTicketTasks } from '@/services/ticket';
import type { TicketPriority, TicketStatus } from '@/services/ticket/typings';
import { useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { PriorityTag, TICKET_STATUS_META } from '../components/meta';

type View = 'todo' | 'done' | 'cc' | 'mine';
const VIEWS: readonly View[] = ['todo', 'done', 'cc', 'mine'];

/** 各视图统一成的行模型 */
interface Row {
  key: string;
  ticketId: string;
  instanceId: string;
  title: string;
  /** 编号与优先级仅「我提交的」有 */
  number?: string;
  priority?: TicketPriority;
  /** 满意度评分（仅「我提交的」）；0 = 未评价 */
  rating?: number;
  templateName?: string;
  nodeName?: string;
  creatorName?: string;
  status: TicketStatus;
  /** 我在任务上的处理结果（已办视图） */
  myStatus?: keyof typeof ASSIGNEE_STATUS_META;
  time?: string;
  actionTime?: string;
}

const MyTickets: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const has = usePermissions();
  const t = useT();
  const statusEnum = useValueEnum(TICKET_STATUS_META);
  // 当前视图记在地址里：从工单详情返回时回到原来的页签
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view') as View | null;
  const view: View =
    viewParam && VIEWS.includes(viewParam) ? viewParam : 'todo';
  const setView = (next: View) =>
    setSearchParams(next === 'todo' ? {} : { view: next }, { replace: true });

  const [delegationOpen, setDelegationOpen] = useState(false);
  const open = (row: Row) => history.push(`/ticket/detail/${row.ticketId}`);

  const columns: ProColumns<Row>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: t(
          view === 'mine'
            ? 'pages.ticket.search.placeholder'
            : 'pages.ticket.search.title',
        ),
      },
    },
    {
      title: t('pages.ticket.column.number'),
      dataIndex: 'number',
      search: false,
      copyable: true,
      width: 190,
      hideInTable: view !== 'mine',
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
      dataIndex: 'templateName',
      search: false,
      ellipsis: true,
      width: 160,
    },
    {
      title: t('pages.ticket.column.priority'),
      dataIndex: 'priority',
      search: false,
      width: 90,
      hideInTable: view !== 'mine',
      render: (_, record) => <PriorityTag priority={record.priority} />,
    },
    {
      title: t('pages.ticket.column.node'),
      dataIndex: 'nodeName',
      search: false,
      ellipsis: true,
      width: 160,
      hideInTable: view === 'mine',
    },
    {
      title: t('pages.ticket.column.creator'),
      dataIndex: 'creatorName',
      search: false,
      width: 120,
      hideInTable: view === 'mine',
    },
    {
      title: t('pages.ticket.column.myStatus'),
      dataIndex: 'myStatus',
      search: false,
      width: 100,
      hideInTable: view !== 'done',
      render: (_, record) => {
        const meta = record.myStatus && ASSIGNEE_STATUS_META[record.myStatus];
        return meta ? (
          <Tag color={meta.color}>{t(meta.textId)}</Tag>
        ) : (
          t('common.empty')
        );
      },
    },
    {
      title: t('pages.ticket.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      // 只有「我提交的」支持按状态筛选；待办恒为处理中
      search: view === 'mine' ? undefined : false,
      hideInTable: view === 'todo',
      width: 110,
    },
    {
      title: t('pages.ticket.rating.label'),
      dataIndex: 'rating',
      search: false,
      width: 150,
      hideInTable: view !== 'mine',
      render: (_, record) => {
        if (record.rating) return <Rate disabled value={record.rating} />;
        // 已结束（完成 / 拒绝）且尚未评价：点开详情去评价
        return record.status === 2 || record.status === 3 ? (
          <a onClick={() => open(record)}>{t('pages.ticket.rating.todo')}</a>
        ) : (
          t('common.empty')
        );
      },
    },
    {
      title: t(
        view === 'mine'
          ? 'pages.ticket.column.createTime'
          : 'pages.ticket.column.arriveTime',
      ),
      dataIndex: 'time',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('pages.ticket.column.actionTime'),
      dataIndex: 'actionTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
      hideInTable: view !== 'done',
    },
    {
      title: t('common.column.action'),
      valueType: 'option',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <a onClick={() => open(record)}>
          {t(
            view === 'todo'
              ? 'pages.ticket.action.handle'
              : 'common.action.view',
          )}
        </a>
      ),
    },
  ];

  return (
    <PageContainer
      title={false}
      tabList={VIEWS.map((key) => ({
        key,
        tab: t(`pages.ticket.view.${key}`),
      }))}
      tabActiveKey={view}
      onTabChange={(key) => setView(key as View)}
    >
      <ProTable<Row>
        // 切换视图时重置筛选与分页
        key={view}
        cardBordered
        headerTitle={
          <Space>
            {has('ticket.mine.create') && (
              <CreateButton onClick={() => history.push('/ticket/create')}>
                {t('pages.ticket.create.title')}
              </CreateButton>
            )}
            {/* 请假期间把新到的待办交给代理人 */}
            <Button onClick={() => setDelegationOpen(true)}>
              {t('pages.workflow.delegation.title')}
            </Button>
          </Space>
        }
        rowKey="key"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        request={async (params) => {
          const query = {
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
          };
          if (view === 'mine') {
            const result = toTableResult(
              await listMyTickets({
                ...query,
                status: params.status
                  ? (Number(params.status) as TicketStatus)
                  : undefined,
              }),
            );
            return {
              ...result,
              data: (result.data ?? []).map<Row>((it) => ({
                key: it.id,
                ticketId: it.id,
                instanceId: it.instanceId,
                title: it.title,
                number: it.number,
                priority: it.priority,
                rating: it.rating ?? 0,
                templateName: it.templateName,
                status: it.status,
                time: it.createTime,
              })),
            };
          }
          const result = toTableResult(await listTicketTasks(view, query));
          return {
            ...result,
            data: (result.data ?? []).map<Row>((it, index) => ({
              // 同一任务上可能有本人的两个席位（自己的 + 代他人的）：带上序号保证唯一
              key: `${it.taskId}-${it.status}-${it.actionTime ?? ''}-${index}`,
              ticketId: it.businessId ?? '',
              instanceId: it.instanceId,
              title: it.title,
              templateName: it.definitionName,
              nodeName: it.nodeName,
              creatorName: it.initiatorName || it.initiator,
              status: it.instanceStatus,
              myStatus: it.status,
              time: it.createTime,
              actionTime: it.actionTime,
            })),
          };
        }}
      />
      <Delegations
        open={delegationOpen}
        onClose={() => setDelegationOpen(false)}
      />
    </PageContainer>
  );
};

export default MyTickets;
