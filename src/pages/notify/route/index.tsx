import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { NOTIFY_SEVERITY_ENUM } from '@/constants';
import {
  DEFAULT_BIZ_ID,
  useBizScope,
  useChannelOptions,
} from '@/services/notify/hooks';
import type { RouteSpecPayload } from '@/services/notify/route';
import {
  createRoute,
  deleteRoute,
  getRoute,
  listRoutes,
  updateRoute,
} from '@/services/notify/route';
import type { NotifyRoute } from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  BizIdFormField,
  BizIdReadonlyField,
  bizIdColumn,
} from '../components/bizScope';

/** 路由状态枚举（表格筛选 + 展示）；查询参数经 request 归一化为布尔 */
const ROUTE_ENABLED_ENUM: NonNullable<ProColumns['valueEnum']> = {
  true: { text: '启用', status: 'Success' },
  false: { text: '停用', status: 'Error' },
};

/** 两列栅格：半行 / 整行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

/** 事件匹配模式规则（路由/静默/订阅/生产者白名单同式） */
const EVENT_PATTERN_RULES = [
  { required: true, message: '请输入事件匹配模式' },
  {
    pattern: /^(\*|[a-z0-9][a-z0-9._-]{0,127}|[a-z0-9][a-z0-9._-]{0,125}\.\*)$/,
    message: '精确 / 前缀通配（monitor.alert.*）/ 全匹配（*）',
  },
];

/** 路由表单值（扁平结构；提交时组装为 spec 整组替换语义；biz 仅创建） */
interface RouteFormValues {
  bizId?: string;
  eventPattern: string;
  severityMin?: number;
  /** 标签匹配键值对列表（提交转 map） */
  tags?: { tagKey: string; tagValue: string }[];
  priority?: number;
  channelIds?: string[];
  /** 固定收件人（tags 输入） */
  recipientFixed?: string[];
  recipientSubscription?: boolean;
  aggregateWindowS?: number;
  suppressThreshold?: number;
  suppressDurationM?: number;
  enabled?: boolean;
}

/** 表单键值对列表 → API map（过滤未填键的行） */
const tagsListToMap = (
  list?: RouteFormValues['tags'],
): Record<string, string> | undefined => {
  if (!list?.length) return undefined;
  const map: Record<string, string> = {};
  for (const item of list) {
    if (item?.tagKey) map[item.tagKey] = item.tagValue ?? '';
  }
  return Object.keys(map).length ? map : undefined;
};

/** API map → 表单键值对列表（编辑回显） */
const tagsMapToList = (map?: Record<string, string>) =>
  map
    ? Object.entries(map).map(([tagKey, tagValue]) => ({ tagKey, tagValue }))
    : undefined;

/** 表单值 → 路由规则载荷（可选调优项仅在填写时携带，走服务端缺省） */
const buildRouteSpec = (values: RouteFormValues): RouteSpecPayload => {
  const tagMatch = tagsListToMap(values.tags);
  return {
    eventPattern: values.eventPattern,
    ...(values.severityMin != null && { severityMin: values.severityMin }),
    ...(tagMatch && { tagMatch }),
    ...(values.priority != null && { priority: values.priority }),
    channelIds: values.channelIds ?? [],
    recipient: {
      fixed: values.recipientFixed ?? [],
      subscription: values.recipientSubscription ?? false,
    },
    ...(values.aggregateWindowS != null && {
      aggregateWindowS: values.aggregateWindowS,
    }),
    ...(values.suppressThreshold != null && {
      suppressThreshold: values.suppressThreshold,
    }),
    ...(values.suppressDurationM != null && {
      suppressDurationM: values.suppressDurationM,
    }),
  };
};

/**
 * 通知路由：事件如何变成通知任务——event_pattern + 严重级下限 + 标签匹配
 * 筛选事件，命中后对渠道集合并发生成任务；收件策略 fixed 先行、订阅者追加。
 * 规则字段经 spec 整组替换，enabled 独立启停；channel_ids 须与路由同 biz。
 * 表单 12 字段 → 抽屉 + 两列栅格（标签列表 / 渠道 / 固定收件人独占一行）。
 */
const RouteList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const scope = useBizScope();
  const {
    channels,
    optionsOf: channelOptionsOf,
    nameOf: channelNameOf,
  } = useChannelOptions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<NotifyRoute | null>(null);

  const reload = () => actionRef.current?.reload();

  const hasAnyAction = has('notify.route.edit') || has('notify.route.delete');

  const columns: ProColumns<NotifyRoute>[] = [
    {
      title: '搜索项',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '事件匹配模式' },
    },
    bizIdColumn<NotifyRoute>(scope),
    {
      title: '事件匹配模式',
      dataIndex: 'eventPattern',
      copyable: true,
      ellipsis: true,
      // 模糊搜索由「关键字」字段覆盖（后端 keyword 匹配 event_pattern）
      search: false,
    },
    {
      title: '严重级下限',
      dataIndex: 'severityMin',
      valueEnum: NOTIFY_SEVERITY_ENUM,
      width: 110,
      search: false,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      search: false,
    },
    {
      title: '渠道',
      dataIndex: 'channelIds',
      search: false,
      ellipsis: true,
      render: (_, record) =>
        (record.channelIds ?? []).map((id) => (
          <Tag key={id}>{channelNameOf(id)}</Tag>
        )),
    },
    {
      title: '收件策略',
      dataIndex: 'recipient',
      search: false,
      width: 150,
      render: (_, record) => {
        const parts: string[] = [];
        if (record.recipient?.fixed?.length)
          parts.push(`固定 ${record.recipient.fixed.length}`);
        if (record.recipient?.subscription) parts.push('订阅者');
        return parts.join(' + ') || '—';
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueEnum: ROUTE_ENABLED_ENUM,
      width: 90,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        const actions: React.ReactNode[] = [];
        if (has('notify.route.edit')) {
          actions.push(
            <a
              key="edit"
              onClick={() => {
                setEditRow(record);
              }}
            >
              编辑
            </a>,
          );
        }
        if (has('notify.route.delete')) {
          actions.push(
            <Popconfirm
              key="delete"
              title="删除路由"
              description="删除后在途发送任务照常完成，确定删除？"
              onConfirm={async () => {
                await deleteRoute(record.id);
                message.success('删除成功');
                reload();
              }}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>,
          );
        }
        return actions;
      },
    },
  ];

  /**
   * 新建/编辑共用字段组（业务字段由调用方置于最前，与事件模式同行）：
   * 事件模式 / 严重级 + 优先级 / 标签 / 渠道 / 固定收件人 / 追加订阅者 /
   * 聚合窗口 + 抑制阈值 / 抑制时长 + 启用。
   * 目标渠道仅列出与路由同 biz 的实例：新建跟随表单 bizId（留空 = default），
   * 编辑固定为路由自身 biz（fixedBizId）。
   */
  const routeFields = (fixedBizId?: string) => (
    <>
      <ProFormText
        name="eventPattern"
        label="事件匹配模式"
        colProps={HALF}
        tooltip="精确 / 前缀通配（monitor.alert.*）/ 全匹配（*）"
        placeholder="monitor.alert.*"
        rules={EVENT_PATTERN_RULES}
      />
      <ProFormSelect
        name="severityMin"
        label="严重级下限"
        colProps={HALF}
        tooltip="事件严重级 ≥ 下限才命中；缺省 1（提示）"
        valueEnum={NOTIFY_SEVERITY_ENUM}
        allowClear
        placeholder="缺省 1（提示）"
      />
      <ProFormDigit
        name="priority"
        label="优先级"
        colProps={HALF}
        tooltip="1-9，1 最高；多条路由命中时取最高优先级，缺省 5"
        min={1}
        max={9}
        fieldProps={{ precision: 0 }}
        placeholder="缺省 5"
      />
      <ProFormList
        name="tags"
        label="标签匹配"
        colProps={FULL}
        tooltip="payload 标签全部相等才命中（AND），最多 16 对；不填 = 无条件"
        max={16}
        creatorButtonProps={{ creatorButtonText: '添加标签条件' }}
      >
        <ProForm.Group>
          <ProFormText
            name="tagKey"
            label="键"
            rules={[
              { required: true, message: '请输入键' },
              { max: 64, message: '最多 64 位' },
            ]}
          />
          <ProFormText
            name="tagValue"
            label="值"
            rules={[
              { required: true, message: '请输入值' },
              { max: 255, message: '最多 255 位' },
            ]}
          />
        </ProForm.Group>
      </ProFormList>
      <ProFormDependency name={['bizId']}>
        {({ bizId }) => (
          <ProFormSelect
            name="channelIds"
            label="目标渠道"
            colProps={FULL}
            tooltip="命中的渠道实例集合（须与路由同业务），每个启用渠道并发生成任务"
            options={channelOptionsOf(fixedBizId ?? bizId ?? DEFAULT_BIZ_ID)}
            fieldProps={{
              mode: 'multiple',
              showSearch: true,
              optionFilterProp: 'label',
              placeholder: '选择渠道，1-50 个',
            }}
            rules={[{ required: true, message: '请选择目标渠道' }]}
          />
        )}
      </ProFormDependency>
      {/* 收件策略：仅邮件渠道依赖固定收件人/订阅者解析收件地址；Webhook 以实例 URL、
          群机器人以实例绑定群为隐含收件，可整组留空（与后端按渠道类型的校验一致） */}
      <ProFormDependency name={['recipientSubscription', 'channelIds']}>
        {({ recipientSubscription, channelIds }) => {
          const needsRecipient = (
            (channelIds as string[] | undefined) ?? []
          ).some(
            (id) =>
              channels.find((channel) => channel.id === id)?.type ===
              'NOTIFY_CHANNEL_TYPE_EMAIL',
          );
          return (
            <ProFormSelect
              name="recipientFixed"
              label="固定收件人"
              colProps={FULL}
              tooltip="邮件地址/群标识；邮件渠道必须由固定收件人或订阅者提供地址，Webhook 与群机器人以实例自身为收件可留空"
              fieldProps={{
                mode: 'tags',
                open: false,
                tokenSeparators: [',', ' '],
                placeholder: needsRecipient
                  ? '邮件渠道需要收件地址：输入后回车确认，最多 100 个'
                  : '可选：输入后回车确认，最多 100 个',
              }}
              rules={[
                {
                  validator: (_, value?: string[]) => {
                    const list = value ?? [];
                    if (
                      needsRecipient &&
                      !list.length &&
                      !recipientSubscription
                    ) {
                      return Promise.reject(
                        new Error(
                          '含邮件渠道：请配置固定收件人，或开启「追加订阅者」',
                        ),
                      );
                    }
                    if (list.length > 100) {
                      return Promise.reject(new Error('最多 100 个'));
                    }
                    if (list.some((item) => !item || item.length > 255)) {
                      return Promise.reject(new Error('每个收件人 1-255 位'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            />
          );
        }}
      </ProFormDependency>
      <ProFormSwitch
        name="recipientSubscription"
        label="追加订阅者"
        colProps={HALF}
        tooltip="按用户订阅偏好与路由渠道类型的交集解析订阅者，与固定收件人去重"
      />
      <ProFormDigit
        name="aggregateWindowS"
        label="聚合窗口（秒）"
        colProps={HALF}
        tooltip="0 = 不聚合（缺省）；>0 须 30-300，事件带分组键时聚合微批"
        min={0}
        max={300}
        fieldProps={{ precision: 0 }}
        placeholder="缺省 0"
        rules={[
          {
            validator: (_: unknown, value?: number) =>
              value != null && value !== 0 && (value < 30 || value > 300)
                ? Promise.reject(new Error('0 或 30-300'))
                : Promise.resolve(),
          },
        ]}
      />
      <ProFormDigit
        name="suppressThreshold"
        label="聚合抑制阈值"
        colProps={HALF}
        tooltip="分组计数超过后汇总转摘要模式，缺省 500"
        min={1}
        max={100000}
        fieldProps={{ precision: 0 }}
        placeholder="缺省 500"
      />
      <ProFormDigit
        name="suppressDurationM"
        label="抑制时长（分钟）"
        colProps={HALF}
        tooltip="超阈值后同分组键的静默窗口，缺省 30"
        min={1}
        max={1440}
        fieldProps={{ precision: 0 }}
        placeholder="缺省 30"
      />
      <ProFormSwitch name="enabled" label="启用" colProps={HALF} />
    </>
  );

  return (
    <>
      <ProTable<NotifyRoute>
        headerTitle={
          has('notify.route.create') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              新建路由
            </Button>
          )
        }
        rowKey="id"
        actionRef={actionRef}
        search={{ labelWidth: 'auto' }}
        columns={columns}
        request={async (params) => {
          const result = await listRoutes({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword || undefined,
            bizId: params.bizId || undefined,
            enabled:
              params.enabled === 'true'
                ? true
                : params.enabled === 'false'
                  ? false
                  : undefined,
          });
          return {
            data: result.items,
            total: Number(result.total),
            success: true,
          };
        }}
      />

      {/* 新建路由（抽屉）：spec 一次成型（整组替换语义，无部分更新）；biz 创建后不可改 */}
      <DrawerForm<RouteFormValues>
        key="create-route"
        title="新建路由"
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open={createOpen}
        onOpenChange={setCreateOpen}
        drawerProps={{ destroyOnHidden: true }}
        initialValues={{
          enabled: true,
          bizId: scope.restricted ? scope.defaultBizId : undefined,
        }}
        submitter={{
          searchConfig: { submitText: '创建', resetText: '取消' },
        }}
        onFinish={async (values) => {
          await createRoute({
            bizId: values.bizId || undefined,
            spec: buildRouteSpec(values),
            enabled: values.enabled ?? true,
          });
          message.success('创建成功');
          reload();
          return true;
        }}
      >
        <BizIdFormField scope={scope} colProps={HALF} />
        {routeFields()}
      </DrawerForm>

      {/* 编辑路由（抽屉）：spec 整组替换，enabled 独立启停；打开时拉取详情；业务只读占位 */}
      {editRow && (
        <DrawerForm<RouteFormValues>
          key={`edit-route-${editRow.id}`}
          title={`编辑路由：${editRow.eventPattern}`}
          width={720}
          grid
          rowProps={{ gutter: 16 }}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          drawerProps={{ destroyOnHidden: true }}
          params={{ id: editRow.id }}
          request={async ({ id }) => {
            const { route } = await getRoute(id);
            return {
              eventPattern: route.eventPattern,
              severityMin: route.severityMin,
              tags: tagsMapToList(route.tagMatch),
              priority: route.priority,
              channelIds: route.channelIds ?? [],
              recipientFixed: route.recipient?.fixed ?? [],
              recipientSubscription: route.recipient?.subscription ?? false,
              aggregateWindowS: route.aggregateWindowS,
              suppressThreshold: route.suppressThreshold,
              suppressDurationM: route.suppressDurationM,
              enabled: route.enabled,
            };
          }}
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          onFinish={async (values) => {
            await updateRoute(editRow.id, {
              spec: buildRouteSpec(values),
              enabled: values.enabled ?? true,
            });
            message.success('保存成功');
            reload();
            return true;
          }}
        >
          <BizIdReadonlyField bizId={editRow.bizId} colProps={HALF} />
          {routeFields(editRow.bizId)}
        </DrawerForm>
      )}
    </>
  );
};

export default RouteList;
