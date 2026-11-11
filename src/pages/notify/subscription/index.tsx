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
import { App, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  ENABLED_META,
  NOTIFY_EVENT_PATTERN_REGEX,
  NOTIFY_SUBSCRIBABLE_CHANNEL_TYPES,
  NOTIFY_TEMPLATE_CHANNEL_META,
} from '@/constants';
import {
  deleteSubscription,
  listSubscriptions,
  upsertSubscription,
} from '@/services/notify/subscription';
import type {
  NotifySubscription,
  NotifyTemplateChannelType,
  SubscriptionPref,
} from '@/services/notify/typings';
import { usePermissions } from '@/services/system/permissions';
import {
  useEnumText,
  useFormRules,
  useSubmitter,
  useT,
  useValueEnum,
} from '@/utils/i18n';
import { parseBoolParam, toTableResult } from '@/utils/table';
import { BIZ_ID_PATTERN } from '../components/bizScope';

/** 两列栅格：半行 / 整行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

/** 机器人渠道定义：偏好字段 / 目标群字段 / 渠道键（文案取模板渠道枚举） */
const ROBOT_FIELDS = [
  { pref: 'prefDingtalk', target: 'targetDingtalk', key: 'dingtalk' },
  { pref: 'prefWecom', target: 'targetWecom', key: 'wecom' },
  { pref: 'prefFeishu', target: 'targetFeishu', key: 'feishu' },
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
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const enabledEnum = useValueEnum(ENABLED_META);
  const channelText = useEnumText(NOTIFY_TEMPLATE_CHANNEL_META);

  const [saveOpen, setSaveOpen] = useState(false);
  // 编辑行（null = 新建）；行数据已含全部字段，直接回显
  const [editRow, setEditRow] = useState<NotifySubscription | null>(null);

  const reload = () => actionRef.current?.reload();

  const hasAnyAction =
    has('notify.subscription.upsert') || has('notify.subscription.delete');

  /** 机器人渠道偏好选项（email 仅订阅开关，地址取用户资料） */
  const robotPrefOptions = [
    {
      label: t('pages.notify.subscription.form.pref.subscribedDefault'),
      value: 'subscribed',
    },
    { label: t('pages.notify.subscription.form.pref.target'), value: 'target' },
  ];

  const columns: ProColumns<NotifySubscription>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.notify.common.eventPattern') },
    },
    {
      title: t('pages.notify.subscription.column.userId'),
      dataIndex: 'userId',
      copyable: true,
      ellipsis: true,
      tooltip: t('pages.notify.subscription.column.userId.tooltip'),
      fieldProps: {
        placeholder: t('pages.notify.subscription.column.userId.placeholder'),
      },
    },
    {
      title: t('pages.notify.common.biz'),
      dataIndex: 'bizId',
      width: 110,
      ellipsis: true,
      search: false,
    },
    {
      title: t('pages.notify.common.eventPattern'),
      dataIndex: 'eventPattern',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: t('pages.notify.subscription.column.channelPrefs'),
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
            {entries.map(([key, pref]) => {
              const channel = channelText(key as NotifyTemplateChannelType);
              return (
                <Tag key={key}>
                  {pref?.target
                    ? t('pages.notify.subscription.prefWithTarget', {
                        channel,
                        target: pref.target,
                      })
                    : channel}
                </Tag>
              );
            })}
          </span>
        ) : (
          t('common.empty')
        );
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
        if (has('notify.subscription.upsert')) {
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
        if (has('notify.subscription.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.notify.subscription.delete.title')}
              description={t('pages.notify.subscription.delete.description')}
              onConfirm={async () => {
                await deleteSubscription(record.id);
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
   * 新建/编辑共用字段组：订阅人 + 业务 / 事件模式 / 渠道偏好分组
   * （邮件；每个机器人渠道「偏好 + 目标群」同行，目标群仅在选「指定目标群」时可填）/ 启用。
   * editing 时自然键锁定：Upsert 按键替换，改键即新建另一条订阅。
   */
  const subscriptionFields = (editing: boolean) => (
    <>
      <ProFormText
        name="userId"
        label={t('pages.notify.subscription.column.userId')}
        colProps={HALF}
        disabled={editing}
        tooltip={t('pages.notify.subscription.form.userId.tooltip')}
        placeholder={t('pages.notify.subscription.form.userId.placeholder')}
        rules={[
          {
            pattern:
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            message: t('pages.notify.subscription.form.userId.rule'),
          },
        ]}
      />
      <ProFormText
        name="bizId"
        label={t('pages.notify.common.biz')}
        colProps={HALF}
        disabled={editing}
        tooltip={t('pages.notify.subscription.form.biz.tooltip')}
        placeholder={t('pages.notify.common.biz.placeholder')}
        rules={[
          {
            pattern: BIZ_ID_PATTERN,
            message: t('pages.notify.common.bizIdRule'),
          },
        ]}
      />
      <ProFormText
        name="eventPattern"
        label={t('pages.notify.common.eventPattern')}
        colProps={FULL}
        disabled={editing}
        tooltip={t('pages.notify.subscription.form.eventPattern.tooltip')}
        placeholder="monitor.alert.*"
        rules={[
          rules.required(t('pages.notify.common.eventPattern')),
          {
            pattern: NOTIFY_EVENT_PATTERN_REGEX,
            message: t('pages.notify.common.eventPattern.rule'),
          },
        ]}
      />
      <ProForm.Group
        title={t('pages.notify.subscription.form.prefs.title')}
        colProps={FULL}
        rowProps={{ gutter: 16 }}
      >
        <ProFormSelect
          name="prefEmail"
          label={channelText('email')}
          colProps={HALF}
          tooltip={t('pages.notify.subscription.form.email.tooltip')}
          allowClear
          placeholder={t('pages.notify.subscription.form.pref.none')}
          options={[
            {
              label: t('pages.notify.subscription.form.pref.subscribed'),
              value: 'subscribed',
            },
          ]}
        />
        {ROBOT_FIELDS.map(({ pref, target, key }) => {
          const label = channelText(key);
          const targetLabel = t('pages.notify.subscription.form.target.label', {
            channel: label,
          });
          return (
            <React.Fragment key={key}>
              <ProFormSelect
                name={pref}
                label={label}
                colProps={HALF}
                allowClear
                placeholder={t('pages.notify.subscription.form.pref.none')}
                options={robotPrefOptions}
              />
              {/* 目标群常驻同行（布局稳定），仅在选「指定目标群」时可填且必填 */}
              <ProFormDependency name={[pref]}>
                {({ [pref]: prefValue }) => {
                  const active = prefValue === 'target';
                  return (
                    <ProFormText
                      name={target}
                      label={targetLabel}
                      colProps={HALF}
                      disabled={!active}
                      tooltip={t(
                        'pages.notify.subscription.form.target.tooltip',
                      )}
                      placeholder={
                        active
                          ? '$group:ops'
                          : t(
                              'pages.notify.subscription.form.target.placeholder',
                            )
                      }
                      rules={
                        active
                          ? [rules.required(targetLabel), rules.max(64)]
                          : []
                      }
                    />
                  );
                }}
              </ProFormDependency>
            </React.Fragment>
          );
        })}
        {/* 启用置于分组末尾，与飞书目标群同行补齐栅格 */}
        <ProFormSwitch
          name="enabled"
          label={t('common.column.enabled')}
          colProps={HALF}
        />
      </ProForm.Group>
    </>
  );

  /** 保存订阅（Upsert）：至少一项渠道偏好，否则拦截提交 */
  const handleUpsert = async (values: SubscriptionFormValues) => {
    const channelPrefs = buildChannelPrefs(values);
    if (!Object.keys(channelPrefs).length) {
      message.error(t('pages.notify.subscription.msg.atLeastOne'));
      return false;
    }
    await upsertSubscription({
      userId: values.userId || undefined,
      bizId: values.bizId || undefined,
      eventPattern: values.eventPattern,
      channelPrefs,
      enabled: values.enabled ?? true,
    });
    message.success(t('common.msg.saved'));
    reload();
    return true;
  };

  return (
    <>
      <PageContainer title={false}>
        <ProTable<NotifySubscription>
          headerTitle={
            has('notify.subscription.upsert') && (
              <CreateButton
                onClick={() => {
                  setSaveOpen(true);
                }}
              >
                {t('pages.notify.subscription.create.title')}
              </CreateButton>
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
              enabled: parseBoolParam(params.enabled),
            });
            return toTableResult(result);
          }}
        />
      </PageContainer>

      {/* 新建订阅（抽屉）：同 (用户, 业务, 事件模式) 已存在即整组替换 */}
      <DrawerForm<SubscriptionFormValues>
        key="create-subscription"
        title={t('pages.notify.subscription.create.title')}
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        open={saveOpen}
        onOpenChange={setSaveOpen}
        drawerProps={{ destroyOnHidden: true }}
        initialValues={{ enabled: true }}
        submitter={submitter.save}
        onFinish={handleUpsert}
      >
        {subscriptionFields(false)}
      </DrawerForm>

      {/* 编辑订阅（抽屉）：自然键锁定，行数据直接回显；保存即 Upsert 替换偏好与启停 */}
      {editRow && (
        <DrawerForm<SubscriptionFormValues>
          key={`edit-subscription-${editRow.id}`}
          title={t('pages.notify.subscription.edit.title', {
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
          initialValues={subscriptionToValues(editRow)}
          submitter={submitter.save}
          onFinish={handleUpsert}
        >
          {subscriptionFields(true)}
        </DrawerForm>
      )}
    </>
  );
};

export default SubscriptionList;
