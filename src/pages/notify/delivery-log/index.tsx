import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import dayjs from 'dayjs';
import React, { useRef } from 'react';
import { listDeliveryLogs } from '@/services/notify/deliveryLog';
import { useBizScope, useChannelOptions } from '@/services/notify/hooks';
import type { NotifyDeliveryLog } from '@/services/notify/typings';
import { useRequiredChannelFilter } from '../components/bizScope';

/** 投递结果枚举（表格筛选 + 展示）；查询参数经 request 归一化为布尔 */
const DELIVERY_OK_ENUM: NonNullable<ProColumns['valueEnum']> = {
  true: { text: '成功', status: 'Success' },
  false: { text: '失败', status: 'Error' },
};

/**
 * 投递明细：发送任务每次投递尝试的结果（append-only，含成功/失败、耗时与
 * 渠道侧消息标识）。排障主路径：按任务 ID 下钻查看逐次尝试明细，
 * 失败时结合错误信息与渠道配置定位原因。
 * biz 受限用户须按渠道筛选（运行表无 biz 列，后端以渠道归属 biz 隔离）。
 * 作为「投递追踪」容器的 Tab 子页渲染；支持 ?dispatchId= 预填筛选（来自任务/死信页下钻）。
 */
const DeliveryLogList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const [searchParams] = useSearchParams();
  const { restricted } = useBizScope();
  const {
    channels,
    options: channelOptions,
    nameOf: channelNameOf,
  } = useChannelOptions();
  useRequiredChannelFilter(restricted, channels, formRef, actionRef);

  const columns: ProColumns<NotifyDeliveryLog>[] = [
    {
      title: '任务 ID',
      dataIndex: 'dispatchId',
      copyable: true,
      ellipsis: true,
      fieldProps: { placeholder: '按任务下钻（精确）' },
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
        placeholder: '投递渠道',
      },
      formItemProps: restricted
        ? { rules: [{ required: true, message: '请选择渠道' }] }
        : undefined,
    },
    {
      title: '结果',
      dataIndex: 'ok',
      valueEnum: DELIVERY_OK_ENUM,
      width: 90,
    },
    {
      title: '第几次尝试',
      dataIndex: 'attempt',
      width: 110,
      search: false,
    },
    {
      title: '耗时',
      dataIndex: 'latencyMs',
      width: 100,
      search: false,
      render: (_, record) => `${record.latencyMs} ms`,
    },
    {
      title: '渠道消息标识',
      dataIndex: 'providerMsgId',
      copyable: true,
      ellipsis: true,
      search: false,
      render: (_, record) => record.providerMsgId || '—',
    },
    {
      title: '失败原因',
      dataIndex: 'error',
      ellipsis: true,
      search: false,
      render: (_, record) => record.error || '—',
    },
    {
      title: '落库时间',
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
  ];

  return (
    <ProTable<NotifyDeliveryLog>
      rowKey="id"
      actionRef={actionRef}
      formRef={formRef}
      search={{ labelWidth: 'auto' }}
      // 下钻入口预填：任务页 / 死信页携带 dispatchId 跳入，筛选框可见、可清除
      form={{
        initialValues: {
          dispatchId: searchParams.get('dispatchId') ?? undefined,
        },
      }}
      columns={columns}
      request={async (params) => {
        // 受限用户未选渠道时不发请求（后端要求 channel_id），等渠道选项加载后自动选中并重查
        if (restricted && !params.channelId) {
          return { data: [], total: 0, success: true };
        }
        const result = await listDeliveryLogs({
          page: params.current,
          pageSize: params.pageSize,
          dispatchId: params.dispatchId || undefined,
          channelId: params.channelId || undefined,
          // valueEnum 键经表单序列化为字符串，此处归一化回布尔
          ok:
            params.ok === 'true'
              ? true
              : params.ok === 'false'
                ? false
                : undefined,
          createTimeStart: params.createTimeStart,
          createTimeEnd: params.createTimeEnd,
        });
        return {
          data: result.items,
          total: Number(result.total),
          success: true,
        };
      }}
    />
  );
};

export default DeliveryLogList;
