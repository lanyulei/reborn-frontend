import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link, useAccess, useSearchParams } from '@umijs/max';
import { Descriptions, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef } from 'react';
import { NOTIFY_DISPATCH_STATUS_ENUM } from '@/constants';
import { listDispatches } from '@/services/notify/dispatch';
import { useBizScope, useChannelOptions } from '@/services/notify/hooks';
import type {
  NotifyDispatch,
  NotifyDispatchStatus,
} from '@/services/notify/typings';
import { useRequiredChannelFilter } from '../components/bizScope';

/**
 * 通知发送任务：路由命中后生成的发送任务（事件 × 渠道 × 收件人），
 * 状态机由管道推进（含退避重试与死信转移）。排障主路径：按事件 ID 下钻
 * 查看该事件的全部投递任务，再经任务 ID 进入投递明细。
 * biz 受限用户须按渠道筛选（运行表无 biz 列，后端以渠道归属 biz 隔离）。
 * 作为「投递追踪」容器的 Tab 子页渲染；支持 ?eventId= 预填筛选（来自事件/死信页下钻）。
 */
const DispatchList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const access = useAccess();
  const [searchParams] = useSearchParams();
  const { restricted } = useBizScope();
  const {
    channels,
    options: channelOptions,
    nameOf: channelNameOf,
  } = useChannelOptions();
  useRequiredChannelFilter(restricted, channels, formRef, actionRef);

  const columns: ProColumns<NotifyDispatch>[] = [
    {
      title: '事件 ID',
      dataIndex: 'eventId',
      copyable: true,
      ellipsis: true,
      fieldProps: { placeholder: '按事件下钻（精确）' },
    },
    {
      title: '渠道',
      dataIndex: 'channelId',
      ellipsis: true,
      render: (_, record) => channelNameOf(record.channelId),
      valueType: 'select',
      // options 经 state 驱动：渠道列表异步加载完成后搜索下拉随之更新
      fieldProps: {
        showSearch: true,
        optionFilterProp: 'label',
        options: channelOptions,
        allowClear: !restricted,
        placeholder: '目标渠道',
      },
      formItemProps: restricted
        ? { rules: [{ required: true, message: '请选择渠道' }] }
        : undefined,
    },
    {
      title: '收件目标',
      dataIndex: 'recipient',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: NOTIFY_DISPATCH_STATUS_ENUM,
      width: 100,
    },
    {
      title: '尝试次数',
      dataIndex: 'attempts',
      width: 90,
      search: false,
    },
    {
      title: '下次重试',
      dataIndex: 'nextRetryTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
      render: (_, record) => record.nextRetryTime || '—',
    },
    {
      title: '最近失败原因',
      dataIndex: 'lastError',
      ellipsis: true,
      search: false,
      render: (_, record) => record.lastError || '—',
    },
    {
      title: '生成时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    {
      title: '时间范围',
      dataIndex: 'timeRange',
      valueType: 'dateTimeRange',
      hideInTable: true,
      search: {
        transform: (value: [string, string]) => ({
          createTimeStart: value?.[0]
            ? dayjs(value[0]).toISOString()
            : undefined,
          createTimeEnd: value?.[1] ? dayjs(value[1]).toISOString() : undefined,
        }),
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      // 下钻：任务 → 逐次投递尝试明细（需投递明细页权限）
      hideInTable: !access.canNotifyDeliveryLog,
      render: (_, record) => (
        <Link to={`/notify/trace/delivery-log?dispatchId=${record.id}`}>
          查看明细
        </Link>
      ),
    },
  ];

  return (
    <ProTable<NotifyDispatch>
      rowKey="id"
      actionRef={actionRef}
      formRef={formRef}
      search={{ labelWidth: 'auto' }}
      // 下钻入口预填：事件页 / 死信页携带 eventId 跳入，筛选框可见、可清除
      form={{
        initialValues: { eventId: searchParams.get('eventId') ?? undefined },
      }}
      columns={columns}
      request={async (params) => {
        // 受限用户未选渠道时不发请求（后端要求 channel_id），等渠道选项加载后自动选中并重查
        if (restricted && !params.channelId) {
          return { data: [], total: 0, success: true };
        }
        const result = await listDispatches({
          page: params.current,
          pageSize: params.pageSize,
          eventId: params.eventId || undefined,
          channelId: params.channelId || undefined,
          status: params.status as NotifyDispatchStatus | undefined,
          createTimeStart: params.createTimeStart,
          createTimeEnd: params.createTimeEnd,
        });
        return {
          data: result.items,
          total: Number(result.total),
          success: true,
        };
      }}
      // 展开行：渲染快照与幂等键（排障复现）
      expandable={{
        expandedRowRender: (record) => (
          <Descriptions
            size="small"
            column={2}
            items={[
              {
                key: 'id',
                label: '任务 ID',
                children: (
                  <Typography.Text copyable>{record.id}</Typography.Text>
                ),
              },
              {
                key: 'templateId',
                label: '渲染模板版本',
                children: record.templateId || '—（纯文本通知）',
              },
              {
                key: 'content',
                label: '渲染快照',
                span: 2,
                children: record.content ? (
                  <Typography.Paragraph
                    code
                    copyable={{ text: JSON.stringify(record.content) }}
                    style={{ marginBottom: 0 }}
                  >
                    {JSON.stringify(record.content)}
                  </Typography.Paragraph>
                ) : (
                  '—'
                ),
              },
              {
                key: 'sendKey',
                label: '幂等键',
                span: 2,
                children: (
                  <Typography.Text copyable>{record.sendKey}</Typography.Text>
                ),
              },
            ]}
          />
        ),
      }}
    />
  );
};

export default DispatchList;
