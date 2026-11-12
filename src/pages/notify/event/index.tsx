import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link, useAccess } from '@umijs/max';
import { Descriptions, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import {
  NOTIFY_EVENT_SOURCE_META,
  NOTIFY_EVENT_STATUS_META,
  NOTIFY_PUBLISH_STATE_META,
  NOTIFY_SEVERITY_META,
} from '@/constants';
import { listEvents } from '@/services/notify/event';
import { useBizScope } from '@/services/notify/hooks';
import type { NotifyEvent, NotifyEventStatus } from '@/services/notify/typings';
import { useEnumText, useT, useValueEnum } from '@/utils/i18n';
import { timeRangeColumn, toTableResult } from '@/utils/table';
import { useBizIdColumn } from '../components/bizScope';
import { JsonView } from '../components/JsonView';

/**
 * 通知事件：append-only 运行数据（先落库后应答，无写路径），
 * 控制台排障检索——业务/事件类型/路由状态/时间四维过滤（事件类型为精确匹配）。
 * 展开行查看载荷、去重/聚合键与发布退避详情；行内可下钻到该事件的发送任务。
 * 作为「投递追踪」容器的 Tab 子页渲染，内容区由容器提供。
 */
const EventList: React.FC = () => {
  const scope = useBizScope();
  const access = useAccess();
  const t = useT();
  const severityEnum = useValueEnum(NOTIFY_SEVERITY_META);
  const statusEnum = useValueEnum(NOTIFY_EVENT_STATUS_META);
  const publishStateEnum = useValueEnum(NOTIFY_PUBLISH_STATE_META);
  const sourceText = useEnumText(NOTIFY_EVENT_SOURCE_META);
  // 业务：受限用户为范围内单选且必填（后端 NOTIFY_BIZ_REQUIRED），不限用户可选精确过滤
  const bizIdColumn = useBizIdColumn<NotifyEvent>(scope);

  const columns: ProColumns<NotifyEvent>[] = [
    bizIdColumn,
    {
      title: t('pages.notify.event.column.eventType'),
      dataIndex: 'eventType',
      copyable: true,
      ellipsis: true,
      fieldProps: {
        placeholder: t('pages.notify.event.column.eventType.placeholder'),
      },
    },
    {
      title: t('pages.notify.event.column.title'),
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
      search: false,
    },
    {
      title: t('pages.notify.event.column.severity'),
      dataIndex: 'severity',
      valueEnum: severityEnum,
      width: 90,
      search: false,
    },
    {
      title: t('pages.notify.event.column.status'),
      dataIndex: 'status',
      valueEnum: statusEnum,
      width: 110,
    },
    {
      title: t('pages.notify.event.column.publishState'),
      dataIndex: 'publishState',
      valueEnum: publishStateEnum,
      width: 100,
      search: false,
    },
    {
      title: t('pages.notify.event.column.source'),
      dataIndex: 'source',
      width: 100,
      search: false,
      render: (_, record) => (
        <Tag>
          {record.source in NOTIFY_EVENT_SOURCE_META
            ? sourceText(record.source)
            : record.source}
        </Tag>
      ),
    },
    {
      title: t('pages.notify.event.column.publishAttempts'),
      dataIndex: 'publishAttempts',
      width: 90,
      search: false,
    },
    {
      title: t('pages.notify.event.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 170,
    },
    timeRangeColumn<NotifyEvent>(t, {
      start: 'createTimeStart',
      end: 'createTimeEnd',
    }),
    {
      title: t('common.column.action'),
      valueType: 'option',
      width: 100,
      // 下钻：事件 → 该事件的全部发送任务（需发送任务页权限）
      hideInTable: !access.canNotifyDispatch,
      render: (_, record) => (
        <Link to={`/notify/trace/dispatch?eventId=${record.id}`}>
          {t('pages.notify.common.viewDispatch')}
        </Link>
      ),
    },
  ];

  return (
    <ProTable<NotifyEvent>
      cardBordered
      rowKey="id"
      search={{ labelWidth: 'auto' }}
      columns={columns}
      request={async (params) => {
        const result = await listEvents({
          page: params.current,
          pageSize: params.pageSize,
          bizId: params.bizId || undefined,
          eventType: params.eventType || undefined,
          status: params.status as NotifyEventStatus | undefined,
          createTimeStart: params.createTimeStart,
          createTimeEnd: params.createTimeEnd,
        });
        return toTableResult(result);
      }}
      // 展开行：标识/退避/去重聚合键成对排布，显式收件以标签呈现，载荷用美化 JSON 块收尾
      expandable={{
        expandedRowRender: (record) => (
          <Descriptions
            bordered
            size="small"
            column={2}
            styles={{ label: { width: 120, whiteSpace: 'nowrap' } }}
            items={[
              {
                key: 'id',
                label: t('pages.notify.common.eventId'),
                children: (
                  <Typography.Text copyable>{record.id}</Typography.Text>
                ),
              },
              {
                key: 'nextPublishTime',
                label: t('pages.notify.event.detail.nextPublishTime'),
                children: record.nextPublishTime
                  ? dayjs(record.nextPublishTime).format('YYYY-MM-DD HH:mm:ss')
                  : t('common.empty'),
              },
              {
                key: 'dedupKey',
                label: t('pages.notify.event.detail.dedupKey'),
                children: record.dedupKey ? (
                  <Typography.Text copyable>{record.dedupKey}</Typography.Text>
                ) : (
                  t('common.empty')
                ),
              },
              {
                key: 'groupKey',
                label: t('pages.notify.event.detail.groupKey'),
                children: record.groupKey ? (
                  <Typography.Text copyable>{record.groupKey}</Typography.Text>
                ) : (
                  t('common.empty')
                ),
              },
              {
                key: 'recipients',
                label: t('pages.notify.event.detail.recipients'),
                span: 2,
                children: record.recipients?.length ? (
                  record.recipients.map((item) => <Tag key={item}>{item}</Tag>)
                ) : (
                  <Typography.Text type="secondary">
                    {t('pages.notify.event.detail.recipients.empty')}
                  </Typography.Text>
                ),
              },
              {
                key: 'payload',
                label: t('pages.notify.event.detail.payload'),
                span: 2,
                children: (
                  <JsonView
                    value={record.payload}
                    emptyText={t('pages.notify.event.detail.payload.empty')}
                  />
                ),
              },
            ]}
          />
        ),
      }}
    />
  );
};

export default EventList;
