import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Link, useAccess } from '@umijs/max';
import { Descriptions, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import {
  NOTIFY_EVENT_STATUS_ENUM,
  NOTIFY_PUBLISH_STATE_ENUM,
  NOTIFY_SEVERITY_ENUM,
} from '@/constants';
import { listEvents } from '@/services/notify/event';
import { useBizScope } from '@/services/notify/hooks';
import type { NotifyEvent, NotifyEventStatus } from '@/services/notify/typings';
import { bizIdColumn } from '../components/bizScope';
import { JsonView } from '../components/JsonView';

/** 事件来源标识：api（生产者经 ingress）/ internal（core 同事务直插） */
const EVENT_SOURCE_TEXT: Record<string, string> = {
  api: '生产者接入',
  internal: '内置产生',
};

/**
 * 通知事件：append-only 运行数据（先落库后应答，无写路径），
 * 控制台排障检索——业务/事件类型/路由状态/时间四维过滤（事件类型为精确匹配）。
 * 展开行查看载荷、去重/聚合键与发布退避详情；行内可下钻到该事件的发送任务。
 * 作为「投递追踪」容器的 Tab 子页渲染，内容区由容器提供。
 */
const EventList: React.FC = () => {
  const scope = useBizScope();
  const access = useAccess();

  const columns: ProColumns<NotifyEvent>[] = [
    // 业务：受限用户为范围内单选且必填（后端 NOTIFY_BIZ_REQUIRED），不限用户可选精确过滤
    bizIdColumn<NotifyEvent>(scope),
    {
      title: '事件类型',
      dataIndex: 'eventType',
      copyable: true,
      ellipsis: true,
      fieldProps: { placeholder: '事件类型（精确）' },
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      search: false,
    },
    {
      title: '严重级',
      dataIndex: 'severity',
      valueEnum: NOTIFY_SEVERITY_ENUM,
      width: 90,
      search: false,
    },
    {
      title: '路由状态',
      dataIndex: 'status',
      valueEnum: NOTIFY_EVENT_STATUS_ENUM,
      width: 110,
    },
    {
      title: '发布状态',
      dataIndex: 'publishState',
      valueEnum: NOTIFY_PUBLISH_STATE_ENUM,
      width: 100,
      search: false,
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
      search: false,
      render: (_, record) => (
        <Tag>{EVENT_SOURCE_TEXT[record.source] ?? record.source}</Tag>
      ),
    },
    {
      title: '发布尝试',
      dataIndex: 'publishAttempts',
      width: 90,
      search: false,
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
        // 本地时间 → UTC ISO（RFC3339），映射为 createTimeStart/createTimeEnd
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
      // 下钻：事件 → 该事件的全部发送任务（需发送任务页权限）
      hideInTable: !access.canNotifyDispatch,
      render: (_, record) => (
        <Link to={`/notify/trace/dispatch?eventId=${record.id}`}>查看任务</Link>
      ),
    },
  ];

  return (
    <ProTable<NotifyEvent>
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
        return {
          data: result.items,
          total: Number(result.total),
          success: true,
        };
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
                label: '事件 ID',
                children: (
                  <Typography.Text copyable>{record.id}</Typography.Text>
                ),
              },
              {
                key: 'nextPublishTime',
                label: '下次发布时间',
                children: record.nextPublishTime
                  ? dayjs(record.nextPublishTime).format('YYYY-MM-DD HH:mm:ss')
                  : '—',
              },
              {
                key: 'dedupKey',
                label: '去重指纹',
                children: record.dedupKey ? (
                  <Typography.Text copyable>{record.dedupKey}</Typography.Text>
                ) : (
                  '—'
                ),
              },
              {
                key: 'groupKey',
                label: '聚合分组键',
                children: record.groupKey ? (
                  <Typography.Text copyable>{record.groupKey}</Typography.Text>
                ) : (
                  '—'
                ),
              },
              {
                key: 'recipients',
                label: '显式收件',
                span: 2,
                children: record.recipients?.length ? (
                  record.recipients.map((item) => <Tag key={item}>{item}</Tag>)
                ) : (
                  <Typography.Text type="secondary">
                    —（走路由收件策略解析）
                  </Typography.Text>
                ),
              },
              {
                key: 'payload',
                label: '载荷',
                span: 2,
                children: (
                  <JsonView value={record.payload} emptyText="—（无载荷）" />
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
