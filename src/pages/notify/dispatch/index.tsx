import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link, useAccess, useSearchParams } from '@umijs/max';
import { Descriptions, Tag, Typography } from 'antd';
import React, { useRef } from 'react';
import { NOTIFY_DISPATCH_STATUS_META } from '@/constants';
import { listDispatches } from '@/services/notify/dispatch';
import type {
  NotifyDispatch,
  NotifyDispatchStatus,
} from '@/services/notify/typings';
import { useT, useValueEnum } from '@/utils/i18n';
import { timeRangeColumn, toTableResult } from '@/utils/table';
import { useChannelFilter } from '../components/bizScope';
import { JsonView } from '../components/JsonView';

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
  const t = useT();
  const statusEnum = useValueEnum(NOTIFY_DISPATCH_STATUS_META);
  const channelFilter = useChannelFilter<NotifyDispatch>({
    placeholderId: 'pages.notify.dispatch.column.channel.placeholder',
    formRef,
    actionRef,
  });

  const columns: ProColumns<NotifyDispatch>[] = [
    {
      title: t('pages.notify.common.eventId'),
      dataIndex: 'eventId',
      copyable: true,
      ellipsis: true,
      fieldProps: { placeholder: t('pages.notify.common.eventId.placeholder') },
    },
    channelFilter.column,
    {
      title: t('pages.notify.common.recipient'),
      dataIndex: 'recipient',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: t('common.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 100,
    },
    {
      title: t('pages.notify.common.attempts'),
      dataIndex: 'attempts',
      width: 90,
      search: false,
    },
    {
      title: t('pages.notify.dispatch.column.nextRetry'),
      dataIndex: 'nextRetryTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
      render: (_, record) => record.nextRetryTime || t('common.empty'),
    },
    {
      title: t('pages.notify.dispatch.column.lastError'),
      dataIndex: 'lastError',
      ellipsis: true,
      search: false,
      render: (_, record) => record.lastError || t('common.empty'),
    },
    {
      title: t('pages.notify.dispatch.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    timeRangeColumn<NotifyDispatch>(t, {
      start: 'createTimeStart',
      end: 'createTimeEnd',
    }),
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 100,
      // 下钻：任务 → 逐次投递尝试明细（需投递明细页权限）
      hideInTable: !access.canNotifyDeliveryLog,
      render: (_, record) => (
        <Link to={`/notify/trace/delivery-log?dispatchId=${record.id}`}>
          {t('pages.notify.common.viewDeliveryLog')}
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
        if (channelFilter.guard(params)) {
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
        return toTableResult(result);
      }}
      // 展开行：渲染快照按人读字段拆开（模板 / 聚合 / 标题 / 正文），原始 JSON 块收尾备查
      expandable={{
        expandedRowRender: (record) => {
          const snapshot = record.content;
          const rendered = Boolean(snapshot?.subject || snapshot?.body);
          const templateId = snapshot?.template_id || record.templateId;
          const pending = (
            <Typography.Text type="secondary">
              {t('pages.notify.dispatch.detail.pending')}
            </Typography.Text>
          );
          return (
            <Descriptions
              bordered
              size="small"
              column={2}
              styles={{ label: { width: 120, whiteSpace: 'nowrap' } }}
              items={[
                {
                  key: 'id',
                  label: t('pages.notify.common.dispatchId'),
                  children: (
                    <Typography.Text copyable>{record.id}</Typography.Text>
                  ),
                },
                {
                  key: 'sendKey',
                  label: t('pages.notify.dispatch.detail.sendKey'),
                  children: (
                    <Typography.Text copyable>{record.sendKey}</Typography.Text>
                  ),
                },
                {
                  key: 'template',
                  label: t('pages.notify.dispatch.detail.template'),
                  children: templateId ? (
                    <>
                      <Typography.Text copyable>{templateId}</Typography.Text>
                      {snapshot?.template_version != null && (
                        <Tag style={{ marginInlineStart: 8 }}>
                          v{snapshot.template_version}
                        </Tag>
                      )}
                    </>
                  ) : (
                    <Typography.Text type="secondary">
                      {t('pages.notify.dispatch.detail.template.default')}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'agg',
                  label: t('pages.notify.dispatch.detail.agg'),
                  children: snapshot?.agg ? (
                    <>
                      <Tag color="blue">
                        {t('pages.notify.dispatch.detail.agg.count', {
                          count: snapshot.agg.count,
                        })}
                      </Tag>
                      {snapshot.agg.digest ? (
                        <Tag color="orange">
                          {t('pages.notify.dispatch.detail.agg.digest')}
                        </Tag>
                      ) : (
                        <Tag>
                          {t('pages.notify.dispatch.detail.agg.samples', {
                            count: snapshot.agg.samples?.length ?? 0,
                          })}
                        </Tag>
                      )}
                    </>
                  ) : (
                    <Typography.Text type="secondary">
                      {t('pages.notify.dispatch.detail.agg.single')}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'subject',
                  label: t('pages.notify.dispatch.detail.subject'),
                  span: 2,
                  children: rendered
                    ? snapshot?.subject || t('common.empty')
                    : pending,
                },
                {
                  key: 'body',
                  label: t('pages.notify.dispatch.detail.body'),
                  span: 2,
                  children: rendered ? (
                    <Typography.Paragraph
                      style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
                    >
                      {snapshot?.body || t('common.empty')}
                    </Typography.Paragraph>
                  ) : (
                    pending
                  ),
                },
                {
                  key: 'raw',
                  label: t('pages.notify.dispatch.detail.raw'),
                  span: 2,
                  children: (
                    <JsonView
                      value={snapshot}
                      emptyText={t('pages.notify.dispatch.detail.raw.empty')}
                    />
                  ),
                },
              ]}
            />
          );
        },
      }}
    />
  );
};

export default DispatchList;
