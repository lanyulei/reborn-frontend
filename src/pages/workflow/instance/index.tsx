/**
 * 流程监控：全部流程实例的管理视图，可查看任意实例并终止流程 / 改派任务 /
 * 处理等待节点，以及把某人名下的待办交接给另一个人。
 */
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import { Button, Tag } from 'antd';
import type React from 'react';
import { useRef, useState } from 'react';
import { usePermissions } from '@/services/system/permissions';
import { TICKET_BUSINESS_TYPE } from '@/services/ticket';
import { listInstances } from '@/services/workflow/runtime';
import type {
  InstanceStatus,
  WorkflowInstance,
} from '@/services/workflow/typings';
import { useT, useValueEnum } from '@/utils/i18n';
import { toTableResult } from '@/utils/table';
import { instanceDetailPath } from '../components/detailPath';
import { INSTANCE_STATUS_META } from '../components/meta';
import { Handover } from './Handover';

/** 业务类型筛选里「不挂业务对象的独立流程」的取值（与后端约定） */
const NO_BUSINESS = '-';

const InstanceMonitor: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const t = useT();
  const access = useAccess();
  const has = usePermissions();
  const [handoverOpen, setHandoverOpen] = useState(false);
  const statusEnum = useValueEnum(INSTANCE_STATUS_META);

  const open = (record: WorkflowInstance) =>
    history.push(
      instanceDetailPath(
        { ...record, instanceId: record.id },
        !!access.canTicket,
      ),
    );

  const columns: ProColumns<WorkflowInstance>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.workflow.search.placeholder') },
    },
    {
      title: t('pages.workflow.column.title'),
      dataIndex: 'title',
      search: false,
      ellipsis: true,
      render: (_, record) => <a onClick={() => open(record)}>{record.title}</a>,
    },
    {
      title: t('pages.workflow.column.definition'),
      dataIndex: 'definitionName',
      search: false,
      ellipsis: true,
      width: 160,
      renderText: (_, record) =>
        `${record.definitionName} · v${record.version}`,
    },
    {
      title: t('pages.workflow.column.businessType'),
      dataIndex: 'businessType',
      valueType: 'select',
      valueEnum: {
        [TICKET_BUSINESS_TYPE]: {
          text: t('pages.workflow.businessType.ticket'),
        },
        [NO_BUSINESS]: { text: t('pages.workflow.businessType.none') },
      },
      width: 110,
      render: (_, record) =>
        record.businessType === TICKET_BUSINESS_TYPE ? (
          <Tag color="blue">{t('pages.workflow.businessType.ticket')}</Tag>
        ) : (
          // 不挂业务对象：手动 / 外部系统发起的独立流程，或子流程
          <Tag>{t('pages.workflow.businessType.none')}</Tag>
        ),
    },
    {
      title: t('pages.workflow.column.node'),
      dataIndex: 'currentNodes',
      search: false,
      ellipsis: true,
      width: 160,
      renderText: (_, record) =>
        record.currentNodes?.join('、') || t('common.empty'),
    },
    {
      title: t('pages.workflow.column.initiator'),
      dataIndex: 'initiatorName',
      search: false,
      width: 120,
      renderText: (_, record) => record.initiatorName || record.initiator,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 110,
    },
    {
      title: t('pages.workflow.column.startTime'),
      dataIndex: 'startTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('pages.workflow.column.endTime'),
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
    <>
      <PageContainer title={false}>
        <ProTable<WorkflowInstance>
          cardBordered
          headerTitle={
            has('workflow.instance.handover') && (
              <Button onClick={() => setHandoverOpen(true)}>
                {t('pages.workflow.handover.title')}
              </Button>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          request={async (params) => {
            const result = await listInstances({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              status: params.status
                ? (Number(params.status) as InstanceStatus)
                : undefined,
              businessType: params.businessType || undefined,
            });
            return toTableResult(result);
          }}
        />
      </PageContainer>
      <Handover
        open={handoverOpen}
        onClose={() => setHandoverOpen(false)}
        onDone={() => actionRef.current?.reload()}
      />
    </>
  );
};

export default InstanceMonitor;
