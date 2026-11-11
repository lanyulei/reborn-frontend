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
import { App, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  ENABLED_META,
  NOTIFY_EVENT_PATTERN_REGEX,
  NOTIFY_SEVERITY_META,
} from '@/constants';
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
import { useFormRules, useSubmitter, useT, useValueEnum } from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import {
  BizIdFormField,
  BizIdReadonlyField,
  useBizIdColumn,
} from '../components/bizScope';

/** 两列栅格：半行 / 整行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

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
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const enabledEnum = useValueEnum(ENABLED_META);
  const severityEnum = useValueEnum(NOTIFY_SEVERITY_META);
  const bizIdColumn = useBizIdColumn<NotifyRoute>(scope);
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
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.notify.common.eventPattern') },
    },
    bizIdColumn,
    {
      title: t('pages.notify.common.eventPattern'),
      dataIndex: 'eventPattern',
      copyable: true,
      ellipsis: true,
      // 模糊搜索由「关键字」字段覆盖（后端 keyword 匹配 event_pattern）
      search: false,
    },
    {
      title: t('pages.notify.route.column.severityMin'),
      dataIndex: 'severityMin',
      valueEnum: severityEnum,
      width: 110,
      search: false,
    },
    {
      title: t('pages.notify.route.column.priority'),
      dataIndex: 'priority',
      width: 80,
      search: false,
    },
    {
      title: t('pages.notify.common.channel'),
      dataIndex: 'channelIds',
      search: false,
      ellipsis: true,
      render: (_, record) =>
        (record.channelIds ?? []).map((id) => (
          <Tag key={id}>{channelNameOf(id)}</Tag>
        )),
    },
    {
      title: t('pages.notify.route.column.recipient'),
      dataIndex: 'recipient',
      search: false,
      width: 150,
      render: (_, record) => {
        const parts: string[] = [];
        if (record.recipient?.fixed?.length) {
          parts.push(
            t('pages.notify.route.recipient.fixed', {
              count: record.recipient.fixed.length,
            }),
          );
        }
        if (record.recipient?.subscription) {
          parts.push(t('pages.notify.route.recipient.subscription'));
        }
        return parts.join(' + ') || t('common.empty');
      },
    },
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
    },
    {
      title: t('common.column.updateTime'),
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
    },
    {
      title: t('common.column.action'),
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
              {t('common.action.edit')}
            </a>,
          );
        }
        if (has('notify.route.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.notify.route.delete.title')}
              description={t('pages.notify.route.delete.description')}
              onConfirm={async () => {
                await deleteRoute(record.id);
                message.success(t('common.msg.deleted'));
                reload();
              }}
            />,
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
        label={t('pages.notify.common.eventPattern')}
        colProps={HALF}
        tooltip={t('pages.notify.common.eventPattern.rule')}
        placeholder="monitor.alert.*"
        rules={[
          rules.required(t('pages.notify.common.eventPattern')),
          {
            pattern: NOTIFY_EVENT_PATTERN_REGEX,
            message: t('pages.notify.common.eventPattern.rule'),
          },
        ]}
      />
      <ProFormSelect
        name="severityMin"
        label={t('pages.notify.route.column.severityMin')}
        colProps={HALF}
        tooltip={t('pages.notify.route.form.severityMin.tooltip')}
        valueEnum={severityEnum}
        allowClear
        placeholder={t('pages.notify.route.form.severityMin.placeholder')}
      />
      <ProFormDigit
        name="priority"
        label={t('pages.notify.route.column.priority')}
        colProps={HALF}
        tooltip={t('pages.notify.route.form.priority.tooltip')}
        min={1}
        max={9}
        fieldProps={{ precision: 0 }}
        placeholder={t('pages.notify.route.form.priority.placeholder')}
      />
      <ProFormList
        name="tags"
        label={t('pages.notify.route.form.tags')}
        colProps={FULL}
        tooltip={t('pages.notify.route.form.tags.tooltip')}
        max={16}
        creatorButtonProps={{
          creatorButtonText: t('pages.notify.route.form.tags.add'),
        }}
      >
        <ProForm.Group>
          <ProFormText
            name="tagKey"
            label={t('pages.notify.route.form.tags.key')}
            rules={[
              rules.required(t('pages.notify.route.form.tags.key')),
              rules.max(64),
            ]}
          />
          <ProFormText
            name="tagValue"
            label={t('pages.notify.route.form.tags.value')}
            rules={[
              rules.required(t('pages.notify.route.form.tags.value')),
              rules.max(255),
            ]}
          />
        </ProForm.Group>
      </ProFormList>
      <ProFormDependency name={['bizId']}>
        {({ bizId }) => (
          <ProFormSelect
            name="channelIds"
            label={t('pages.notify.route.form.channels')}
            colProps={FULL}
            tooltip={t('pages.notify.route.form.channels.tooltip')}
            options={channelOptionsOf(fixedBizId ?? bizId ?? DEFAULT_BIZ_ID)}
            fieldProps={{
              mode: 'multiple',
              showSearch: true,
              optionFilterProp: 'label',
              placeholder: t('pages.notify.route.form.channels.placeholder'),
            }}
            rules={[rules.select(t('pages.notify.route.form.channels'))]}
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
              label={t('pages.notify.route.form.recipientFixed')}
              colProps={FULL}
              tooltip={t('pages.notify.route.form.recipientFixed.tooltip')}
              fieldProps={{
                mode: 'tags',
                open: false,
                tokenSeparators: [',', ' '],
                placeholder: needsRecipient
                  ? t(
                      'pages.notify.route.form.recipientFixed.placeholder.email',
                    )
                  : t('pages.notify.route.form.recipientFixed.placeholder'),
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
                          t('pages.notify.route.form.recipientFixed.required'),
                        ),
                      );
                    }
                    if (list.length > 100) {
                      return Promise.reject(
                        new Error(
                          t('pages.notify.route.form.recipientFixed.max'),
                        ),
                      );
                    }
                    if (list.some((item) => !item || item.length > 255)) {
                      return Promise.reject(
                        new Error(t('pages.notify.common.recipientLength')),
                      );
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
        label={t('pages.notify.route.form.recipientSubscription')}
        colProps={HALF}
        tooltip={t('pages.notify.route.form.recipientSubscription.tooltip')}
      />
      <ProFormDigit
        name="aggregateWindowS"
        label={t('pages.notify.route.form.aggregateWindow')}
        colProps={HALF}
        tooltip={t('pages.notify.route.form.aggregateWindow.tooltip')}
        min={0}
        max={300}
        fieldProps={{ precision: 0 }}
        placeholder={t('pages.notify.route.form.aggregateWindow.placeholder')}
        rules={[
          {
            validator: (_: unknown, value?: number) =>
              value != null && value !== 0 && (value < 30 || value > 300)
                ? Promise.reject(
                    new Error(
                      t('pages.notify.route.form.aggregateWindow.rule'),
                    ),
                  )
                : Promise.resolve(),
          },
        ]}
      />
      <ProFormDigit
        name="suppressThreshold"
        label={t('pages.notify.route.form.suppressThreshold')}
        colProps={HALF}
        tooltip={t('pages.notify.route.form.suppressThreshold.tooltip')}
        min={1}
        max={100000}
        fieldProps={{ precision: 0 }}
        placeholder={t('pages.notify.route.form.suppressThreshold.placeholder')}
      />
      <ProFormDigit
        name="suppressDurationM"
        label={t('pages.notify.route.form.suppressDuration')}
        colProps={HALF}
        tooltip={t('pages.notify.route.form.suppressDuration.tooltip')}
        min={1}
        max={1440}
        fieldProps={{ precision: 0 }}
        placeholder={t('pages.notify.route.form.suppressDuration.placeholder')}
      />
      <ProFormSwitch
        name="enabled"
        label={t('common.column.enabled')}
        colProps={HALF}
      />
    </>
  );

  return (
    <>
      <ProTable<NotifyRoute>
        headerTitle={
          has('notify.route.create') && (
            <CreateButton
              onClick={() => {
                setCreateOpen(true);
              }}
            >
              {t('pages.notify.route.create.title')}
            </CreateButton>
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
            enabled: parseBoolParam(params.enabled),
          });
          return toTableResult(result);
        }}
      />

      {/* 新建路由（抽屉）：spec 一次成型（整组替换语义，无部分更新）；biz 创建后不可改 */}
      <DrawerForm<RouteFormValues>
        key="create-route"
        title={t('pages.notify.route.create.title')}
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
        submitter={submitter.create}
        onFinish={async (values) => {
          await createRoute({
            bizId: values.bizId || undefined,
            spec: buildRouteSpec(values),
            enabled: values.enabled ?? true,
          });
          message.success(t('common.msg.created'));
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
          title={t('pages.notify.route.edit.title', {
            name: editRow.eventPattern,
          })}
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
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateRoute(editRow.id, {
              spec: buildRouteSpec(values),
              enabled: values.enabled ?? true,
            });
            message.success(t('common.msg.saved'));
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
