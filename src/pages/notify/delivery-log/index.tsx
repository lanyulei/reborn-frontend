import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import React, { useRef } from 'react';
import { DELIVERY_OK_META } from '@/constants';
import { listDeliveryLogs } from '@/services/notify/deliveryLog';
import type { NotifyDeliveryLog } from '@/services/notify/typings';
import { useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, timeRangeColumn, toTableResult } from '@/utils/table';
import { useChannelFilter } from '../components/bizScope';

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
  const t = useT();
  const okEnum = useValueEnum(DELIVERY_OK_META);
  const channelFilter = useChannelFilter<NotifyDeliveryLog>({
    placeholderId: 'pages.notify.common.deliveryChannel',
    formRef,
    actionRef,
  });

  const columns: ProColumns<NotifyDeliveryLog>[] = [
    {
      title: t('pages.notify.common.dispatchId'),
      dataIndex: 'dispatchId',
      copyable: true,
      ellipsis: true,
      fieldProps: {
        placeholder: t('pages.notify.common.dispatchId.placeholder'),
      },
    },
    channelFilter.column,
    {
      title: t('pages.notify.deliveryLog.column.ok'),
      dataIndex: 'ok',
      valueEnum: okEnum,
      width: 90,
    },
    {
      title: t('pages.notify.deliveryLog.column.attempt'),
      dataIndex: 'attempt',
      width: 110,
      search: false,
    },
    {
      title: t('pages.notify.deliveryLog.column.latency'),
      dataIndex: 'latencyMs',
      width: 100,
      search: false,
      render: (_, record) =>
        t('pages.notify.deliveryLog.latency.ms', { ms: record.latencyMs }),
    },
    {
      title: t('pages.notify.deliveryLog.column.providerMsgId'),
      dataIndex: 'providerMsgId',
      copyable: true,
      ellipsis: true,
      search: false,
      render: (_, record) => record.providerMsgId || t('common.empty'),
    },
    {
      title: t('pages.notify.common.failReason'),
      dataIndex: 'error',
      ellipsis: true,
      search: false,
      render: (_, record) => record.error || t('common.empty'),
    },
    {
      title: t('pages.notify.deliveryLog.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    timeRangeColumn<NotifyDeliveryLog>(t, {
      start: 'createTimeStart',
      end: 'createTimeEnd',
    }),
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
        if (channelFilter.guard(params)) {
          return { data: [], total: 0, success: true };
        }
        const result = await listDeliveryLogs({
          page: params.current,
          pageSize: params.pageSize,
          dispatchId: params.dispatchId || undefined,
          channelId: params.channelId || undefined,
          ok: parseBoolParam(params.ok),
          createTimeStart: params.createTimeStart,
          createTimeEnd: params.createTimeEnd,
        });
        return toTableResult(result);
      }}
    />
  );
};

export default DeliveryLogList;
