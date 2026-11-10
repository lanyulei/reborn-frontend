import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link, useAccess } from '@umijs/max';
import { App, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import React, { useRef } from 'react';
import { NOTIFY_REPLAY_STATE_ENUM } from '@/constants';
import {
  listDeadLetters,
  replayDeadLetter,
} from '@/services/notify/deadLetter';
import { useBizScope, useChannelOptions } from '@/services/notify/hooks';
import type {
  NotifyDeadLetter,
  NotifyReplayState,
} from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import { useRequiredChannelFilter } from '../components/bizScope';

/**
 * 死信队列：发送任务重试超限后的落点。查询排障 + 控制台唯一的写动作
 * 「标记重放」——replay_state 仅允许 未重放 → 待重放（条件更新保证状态机），
 * 死信 worker 轮询待重放行重新生成任务后置已重放。
 * biz 受限用户须按渠道筛选（运行表无 biz 列，后端以渠道归属 biz 隔离）。
 * 作为「投递追踪」容器的 Tab 子页渲染；行内可下钻到同事件任务 / 本任务投递明细。
 */
const DeadLetterList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance | undefined>(undefined);
  const { message } = App.useApp();
  const has = usePermissions();
  const access = useAccess();
  const { restricted } = useBizScope();
  const {
    channels,
    options: channelOptions,
    nameOf: channelNameOf,
  } = useChannelOptions();
  useRequiredChannelFilter(restricted, channels, formRef, actionRef);

  const reload = () => actionRef.current?.reload();
  const canReplay = has('notify.dlq.replay');
  // 任一操作（重放 / 下钻任务 / 下钻明细）可见才展示操作列
  const hasAnyAction =
    canReplay || access.canNotifyDispatch || access.canNotifyDeliveryLog;

  const columns: ProColumns<NotifyDeadLetter>[] = [
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
        placeholder: '投递渠道',
      },
      formItemProps: restricted
        ? { rules: [{ required: true, message: '请选择渠道' }] }
        : undefined,
    },
    {
      title: '重放状态',
      dataIndex: 'replayState',
      valueEnum: NOTIFY_REPLAY_STATE_ENUM,
      width: 100,
    },
    {
      title: '任务 ID',
      dataIndex: 'dispatchId',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: '收件目标',
      dataIndex: 'recipient',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: '尝试次数',
      dataIndex: 'attempts',
      width: 90,
      search: false,
    },
    {
      title: '失败原因',
      dataIndex: 'lastError',
      ellipsis: true,
      search: false,
      render: (_, record) => record.lastError || '—',
    },
    {
      title: '转入时间',
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
      width: 200,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        // 状态机：仅未重放（none）的行可标记
        if (canReplay && record.replayState === 1) {
          actions.push(
            <Popconfirm
              key="replay"
              title="标记重放"
              description="死信 worker 将重新生成发送任务，确定标记？"
              onConfirm={async () => {
                await replayDeadLetter(record.id);
                message.success('已标记待重放');
                reload();
              }}
            >
              <a>标记重放</a>
            </Popconfirm>,
          );
        }
        // 下钻：同事件的全部发送任务 / 本任务的逐次投递明细
        if (access.canNotifyDispatch) {
          actions.push(
            <Link
              key="dispatch"
              to={`/notify/trace/dispatch?eventId=${record.eventId}`}
            >
              查看任务
            </Link>,
          );
        }
        if (access.canNotifyDeliveryLog) {
          actions.push(
            <Link
              key="delivery"
              to={`/notify/trace/delivery-log?dispatchId=${record.dispatchId}`}
            >
              查看明细
            </Link>,
          );
        }
        return actions.length ? actions : '—';
      },
    },
  ];

  return (
    <ProTable<NotifyDeadLetter>
      rowKey="id"
      actionRef={actionRef}
      formRef={formRef}
      search={{ labelWidth: 'auto' }}
      columns={columns}
      request={async (params) => {
        // 受限用户未选渠道时不发请求（后端要求 channel_id），等渠道选项加载后自动选中并重查
        if (restricted && !params.channelId) {
          return { data: [], total: 0, success: true };
        }
        const result = await listDeadLetters({
          page: params.current,
          pageSize: params.pageSize,
          eventId: params.eventId || undefined,
          channelId: params.channelId || undefined,
          replayState: params.replayState as NotifyReplayState | undefined,
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

export default DeadLetterList;
