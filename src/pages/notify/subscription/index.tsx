import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProForm,
  ProFormDependency,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  NOTIFY_SUBSCRIBABLE_CHANNEL_TYPES,
  NOTIFY_TEMPLATE_CHANNEL_TEXT,
} from '@/constants';
import {
  deleteSubscription,
  listSubscriptions,
  upsertSubscription,
} from '@/services/notify/subscription';
import type {
  NotifySubscription,
  SubscriptionPref,
} from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import { BIZ_ID_RULE } from '../components/bizScope';

/** 订阅状态枚举（表格筛选 + 展示）；查询参数经 request 归一化为布尔 */
const SUBSCRIPTION_ENABLED_ENUM: NonNullable<ProColumns['valueEnum']> = {
  true: { text: '启用', status: 'Success' },
  false: { text: '停用', status: 'Error' },
};

/** 两列栅格：半行 / 整行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

/** 机器人渠道偏好选项（email 仅订阅开关，地址取用户资料） */
const ROBOT_PREF_OPTIONS = [
  { label: '订阅（默认绑定）', value: 'subscribed' },
  { label: '指定目标群', value: 'target' },
];

/** 机器人渠道定义：偏好字段 / 目标群字段 / 渠道键 */
const ROBOT_FIELDS = [
  {
    pref: 'prefDingtalk',
    target: 'targetDingtalk',
    key: 'dingtalk',
    label: '钉钉',
  },
  { pref: 'prefWecom', target: 'targetWecom', key: 'wecom', label: '企业微信' },
  { pref: 'prefFeishu', target: 'targetFeishu', key: 'feishu', label: '飞书' },
] as const;

/** 订阅表单值（渠道偏好扁平化，提交时组装 channel_prefs） */
interface SubscriptionFormValues {
  /** 目标用户；留空 = 本人，指定他人须管理员（代管） */
  userId?: string;
  /** 业务；留空 = default（自然键之一） */
  bizId?: string;
  eventPattern: string;
  prefEmail?: 'subscribed';
  prefDingtalk?: 'subscribed' | 'target';
  prefWecom?: 'subscribed' | 'target';
  prefFeishu?: 'subscribed' | 'target';
  targetDingtalk?: string;
  targetWecom?: string;
  targetFeishu?: string;
  enabled?: boolean;
}

/** 表单值 → channel_prefs（恰设其一：subscribed 或 target；至少 1 项由提交前校验保证） */
const buildChannelPrefs = (
  values: SubscriptionFormValues,
): Record<string, SubscriptionPref> => {
  const prefs: Record<string, SubscriptionPref> = {};
  if (values.prefEmail === 'subscribed') prefs.email = { subscribed: true };
  for (const { pref, target, key } of ROBOT_FIELDS) {
    if (values[pref] === 'subscribed') prefs[key] = { subscribed: true };
    if (values[pref] === 'target' && values[target]) {
      prefs[key] = { target: values[target] };
    }
  }
  return prefs;
};

/** 订阅实体 → 表单值（编辑回显；实体字段齐全，无需详情接口） */
const subscriptionToValues = (
  record: NotifySubscription,
): SubscriptionFormValues => {
  const prefs = record.channelPrefs ?? {};
  const robotValue = (key: string): 'subscribed' | 'target' | undefined =>
    prefs[key]?.subscribed
      ? 'subscribed'
      : prefs[key]?.target
        ? 'target'
        : undefined;
  return {
    userId: record.userId,
    bizId: record.bizId,
    eventPattern: record.eventPattern,
    prefEmail: prefs.email?.subscribed ? 'subscribed' : undefined,
    prefDingtalk: robotValue('dingtalk'),
    prefWecom: robotValue('wecom'),
    prefFeishu: robotValue('feishu'),
    targetDingtalk: prefs.dingtalk?.target,
    targetWecom: prefs.wecom?.target,
    targetFeishu: prefs.feishu?.target,
    enabled: record.enabled,
  };
};

/**
 * 订阅管理（订阅中心）：一行 = 某用户在某业务对某事件模式的渠道偏好。
 * 保存为 Upsert 语义——同自然键 (用户, 业务, 事件模式) 重复保存即整组替换
 * 偏好与启停，故编辑态自然键字段锁定（改键 = 新建另一条订阅）。
 * 表单最多 11 字段 → 抽屉 + 两列栅格（机器人偏好与目标群同行，布局稳定）。
 */
const SubscriptionList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();

  const [saveOpen, setSaveOpen] = useState(false);
  // 编辑行（null = 新建）；行数据已含全部字段，直接回显
  const [editRow, setEditRow] = useState<NotifySubscription | null>(null);

  const reload = () => actionRef.current?.reload();

  const hasAnyAction =
    has('notify.subscription.upsert') || has('notify.subscription.delete');

  const columns: ProColumns<NotifySubscription>[] = [
    {
      title: '搜索项',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '事件匹配模式' },
    },
    {
      title: '订阅人',
      dataIndex: 'userId',
      copyable: true,
      ellipsis: true,
      tooltip: '用户 ID（本人或管理员代管）',
      fieldProps: { placeholder: '用户 ID（缺省查本人）' },
    },
    {
      title: '业务',
      dataIndex: 'bizId',
      width: 110,
      ellipsis: true,
      search: false,
    },
    {
      title: '事件匹配模式',
      dataIndex: 'eventPattern',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: '渠道偏好',
      dataIndex: 'channelPrefs',
      search: false,
      render: (_, record) => {
        const entries = Object.entries(record.channelPrefs ?? {}).filter(
          ([key]) =>
            (NOTIFY_SUBSCRIBABLE_CHANNEL_TYPES as readonly string[]).includes(
              key,
            ),
        );
        return entries.length ? (
          <span>
            {entries.map(([key, pref]) => (
              <Tag key={key}>
                {
                  NOTIFY_TEMPLATE_CHANNEL_TEXT[
                    key as keyof typeof NOTIFY_TEMPLATE_CHANNEL_TEXT
                  ]
                }
                {pref?.target ? `：${pref.target}` : ''}
              </Tag>
            ))}
          </span>
        ) : (
          '—'
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueEnum: SUBSCRIPTION_ENABLED_ENUM,
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
        if (has('notify.subscription.upsert')) {
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
        if (has('notify.subscription.delete')) {
          actions.push(
            <Popconfirm
              key="delete"
              title="删除订阅"
              description="删除后同键可重建，确定删除？"
              onConfirm={async () => {
                await deleteSubscription(record.id);
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
   * 新建/编辑共用字段组：订阅人 + 业务 / 事件模式 / 渠道偏好分组
   * （邮件；每个机器人渠道「偏好 + 目标群」同行，目标群仅在选「指定目标群」时可填）/ 启用。
   * editing 时自然键锁定：Upsert 按键替换，改键即新建另一条订阅。
   */
  const subscriptionFields = (editing: boolean) => (
    <>
      <ProFormText
        name="userId"
        label="订阅人"
        colProps={HALF}
        disabled={editing}
        tooltip="留空 = 本人；指定他人须管理员（代管）"
        placeholder="留空 = 本人"
        rules={[
          {
            pattern:
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            message: '用户 ID 为 UUID 格式',
          },
        ]}
      />
      <ProFormText
        name="bizId"
        label="业务"
        colProps={HALF}
        disabled={editing}
        tooltip="订阅按业务隔离匹配；留空 = default"
        placeholder="留空 = default"
        rules={[BIZ_ID_RULE]}
      />
      <ProFormText
        name="eventPattern"
        label="事件匹配模式"
        colProps={FULL}
        disabled={editing}
        tooltip="精确 / 前缀通配（monitor.alert.*）/ 全匹配（*），与路由同式"
        placeholder="monitor.alert.*"
        rules={[
          { required: true, message: '请输入事件匹配模式' },
          {
            pattern:
              /^(\*|[a-z0-9][a-z0-9._-]{0,127}|[a-z0-9][a-z0-9._-]{0,125}\.\*)$/,
            message: '精确 / 前缀通配（monitor.alert.*）/ 全匹配（*）',
          },
        ]}
      />
      <ProForm.Group
        title="渠道偏好（至少一项）"
        colProps={FULL}
        rowProps={{ gutter: 16 }}
      >
        <ProFormSelect
          name="prefEmail"
          label="邮件"
          colProps={HALF}
          tooltip="订阅后收件地址取用户资料邮箱"
          allowClear
          placeholder="不订阅"
          options={[{ label: '订阅', value: 'subscribed' }]}
        />
        {ROBOT_FIELDS.map(({ pref, target, key, label }) => (
          <React.Fragment key={key}>
            <ProFormSelect
              name={pref}
              label={label}
              colProps={HALF}
              allowClear
              placeholder="不订阅"
              options={[...ROBOT_PREF_OPTIONS]}
            />
            {/* 目标群常驻同行（布局稳定），仅在选「指定目标群」时可填且必填 */}
            <ProFormDependency name={[pref]}>
              {({ [pref]: prefValue }) => {
                const active = prefValue === 'target';
                return (
                  <ProFormText
                    name={target}
                    label={`${label}目标群`}
                    colProps={HALF}
                    disabled={!active}
                    tooltip="机器人目标群标识，如 $group:ops"
                    placeholder={
                      active ? '$group:ops' : '选择「指定目标群」后填写'
                    }
                    rules={
                      active
                        ? [
                            { required: true, message: `请输入${label}目标群` },
                            { max: 64, message: '最多 64 位' },
                          ]
                        : []
                    }
                  />
                );
              }}
            </ProFormDependency>
          </React.Fragment>
        ))}
        {/* 启用置于分组末尾，与飞书目标群同行补齐栅格 */}
        <ProFormSwitch name="enabled" label="启用" colProps={HALF} />
      </ProForm.Group>
    </>
  );

  /** 保存订阅（Upsert）：至少一项渠道偏好，否则拦截提交 */
  const handleUpsert = async (values: SubscriptionFormValues) => {
    const channelPrefs = buildChannelPrefs(values);
    if (!Object.keys(channelPrefs).length) {
      message.error('请至少为一个渠道配置订阅偏好');
      return false;
    }
    await upsertSubscription({
      userId: values.userId || undefined,
      bizId: values.bizId || undefined,
      eventPattern: values.eventPattern,
      channelPrefs,
      enabled: values.enabled ?? true,
    });
    message.success('保存成功');
    reload();
    return true;
  };

  return (
    <>
      <PageContainer title={false}>
        <ProTable<NotifySubscription>
          headerTitle={
            has('notify.subscription.upsert') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSaveOpen(true);
                }}
              >
                新建订阅
              </Button>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          request={async (params) => {
            const result = await listSubscriptions({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              userId: params.userId || undefined,
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
      </PageContainer>

      {/* 新建订阅（抽屉）：同 (用户, 业务, 事件模式) 已存在即整组替换 */}
      <DrawerForm<SubscriptionFormValues>
        key="create-subscription"
        title="新建订阅"
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open={saveOpen}
        onOpenChange={setSaveOpen}
        drawerProps={{ destroyOnHidden: true }}
        initialValues={{ enabled: true }}
        submitter={{
          searchConfig: { submitText: '保存', resetText: '取消' },
        }}
        onFinish={handleUpsert}
      >
        {subscriptionFields(false)}
      </DrawerForm>

      {/* 编辑订阅（抽屉）：自然键锁定，行数据直接回显；保存即 Upsert 替换偏好与启停 */}
      {editRow && (
        <DrawerForm<SubscriptionFormValues>
          key={`edit-subscription-${editRow.id}`}
          title={`编辑订阅：${editRow.eventPattern}`}
          width={720}
          grid
          rowProps={{ gutter: 16 }}
          open={!!editRow}
          onOpenChange={(open) => {
            if (!open) setEditRow(null);
          }}
          drawerProps={{ destroyOnHidden: true }}
          initialValues={subscriptionToValues(editRow)}
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
          onFinish={handleUpsert}
        >
          {subscriptionFields(true)}
        </DrawerForm>
      )}
    </>
  );
};

export default SubscriptionList;
