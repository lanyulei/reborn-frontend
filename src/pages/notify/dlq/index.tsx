import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link, useAccess } from '@umijs/max';
import { App, Popconfirm } from 'antd';
import React, { useRef } from 'react';
import { NOTIFY_REPLAY_STATE_META } from '@/constants';
import {
  listDeadLetters,
  replayDeadLetter,
} from '@/services/notify/deadLetter';
import type {
  NotifyDeadLetter,
  NotifyReplayState,
} from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT, useValueEnum } from '@/utils/i18n';
import { timeRangeColumn, toTableResult } from '@/utils/table';
import { useChannelFilter } from '../components/bizScope';

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
  const t = useT();
  const replayStateEnum = useValueEnum(NOTIFY_REPLAY_STATE_META);
  const channelFilter = useChannelFilter<NotifyDeadLetter>({
    placeholderId: 'pages.notify.common.deliveryChannel',
    formRef,
    actionRef,
  });

  const reload = () => actionRef.current?.reload();
  const canReplay = has('notify.dlq.replay');
  // 任一操作（重放 / 下钻任务 / 下钻明细）可见才展示操作列
  const hasAnyAction =
    canReplay || access.canNotifyDispatch || access.canNotifyDeliveryLog;

  const columns: ProColumns<NotifyDeadLetter>[] = [
    {
      title: t('pages.notify.common.eventId'),
      dataIndex: 'eventId',
      copyable: true,
      ellipsis: true,
      fieldProps: { placeholder: t('pages.notify.common.eventId.placeholder') },
    },
    channelFilter.column,
    {
      title: t('pages.notify.dlq.column.replayState'),
      dataIndex: 'replayState',
      valueEnum: replayStateEnum,
      width: 100,
    },
    {
      title: t('pages.notify.common.dispatchId'),
      dataIndex: 'dispatchId',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: t('pages.notify.common.recipient'),
      dataIndex: 'recipient',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: t('pages.notify.common.attempts'),
      dataIndex: 'attempts',
      width: 90,
      search: false,
    },
    {
      title: t('pages.notify.common.failReason'),
      dataIndex: 'lastError',
      ellipsis: true,
      search: false,
      render: (_, record) => record.lastError || t('common.empty'),
    },
    {
      title: t('pages.notify.dlq.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    timeRangeColumn<NotifyDeadLetter>(t, {
      start: 'createTimeStart',
      end: 'createTimeEnd',
    }),
    {
      title: t('common.column.action'),
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
              title={t('pages.notify.dlq.replay.action')}
              description={t('pages.notify.dlq.replay.description')}
              onConfirm={async () => {
                await replayDeadLetter(record.id);
                message.success(t('pages.notify.dlq.replay.success'));
                reload();
              }}
            >
              <a>{t('pages.notify.dlq.replay.action')}</a>
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
              {t('pages.notify.common.viewDispatch')}
            </Link>,
          );
        }
        if (access.canNotifyDeliveryLog) {
          actions.push(
            <Link
              key="delivery"
              to={`/notify/trace/delivery-log?dispatchId=${record.dispatchId}`}
            >
              {t('pages.notify.common.viewDeliveryLog')}
            </Link>,
          );
        }
        return actions.length ? actions : t('common.empty');
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
        if (channelFilter.guard(params)) {
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
        return toTableResult(result);
      }}
    />
  );
};

export default DeadLetterList;
