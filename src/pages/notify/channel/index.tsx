import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  ModalForm,
  PageContainer,
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Link, useAccess } from '@umijs/max';
import { App, Modal, Tag, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import { CreateButton, DeleteConfirmLink } from '@/components/TableActions';
import {
  ENABLED_META,
  NOTIFY_CHANNEL_TYPE_META,
  NOTIFY_WEBHOOK_TIMEOUT_DEFAULT_S,
} from '@/constants';
import {
  createChannel,
  deleteChannel,
  getChannel,
  listChannels,
  sendTestEvent,
  updateChannel,
} from '@/services/notify/channel';
import { useBizScope } from '@/services/notify/hooks';
import type {
  NotifyChannel,
  NotifyChannelType,
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
import {
  BizIdFormField,
  BizIdReadonlyField,
  useBizIdColumn,
} from '../components/bizScope';

/** 两列栅格：半行 / 整行 */
const HALF = { span: 12 };
const FULL = { span: 24 };

/** 渠道表单值（扁平结构，按 type 取对应分支字段；int64 限流以 number 承接、提交转字符串） */
interface ChannelFormValues {
  /** 业务（仅创建；留空 = default，受限用户必选） */
  bizId?: string;
  name: string;
  type: NotifyChannelType;
  enabled?: boolean;
  secret?: string;
  /** 机器人签名密钥（钉钉/飞书）；编辑留空 = 保留 */
  signSecret?: string;
  /** 编辑态：清除签名密钥（停用加签），优先于 signSecret 输入 */
  clearSignSecret?: boolean;
  /** 令牌桶：每秒补充令牌速率，0 = 不限 */
  qps?: number;
  /** 令牌桶：容量（突发上限），0 = 不限 */
  burst?: number;
  /** 每分钟配额（qps=0 时生效），0 = 按渠道类型缺省 */
  perMinute?: number;
  // email（type=EMAIL）
  host?: string;
  port?: number;
  username?: string;
  fromAddr?: string;
  starttls?: boolean;
  // webhook（type=WEBHOOK）
  url?: string;
  headers?: { headerKey: string; headerValue: string }[];
  timeoutS?: number;
  // robot（type=DINGTALK/WECOM/FEISHU）
  atMobiles?: string[];
  /** 卡片消息（模板 format=card）跳转链接，须 https */
  cardUrl?: string;
  /** 卡片按钮文字（须同时配置 cardUrl） */
  cardButton?: string;
}

/** 表单 headers 键值对列表 → API map（过滤未填名称的行） */
const headersListToMap = (
  list?: ChannelFormValues['headers'],
): Record<string, string> | undefined => {
  if (!list?.length) return undefined;
  const map: Record<string, string> = {};
  for (const item of list) {
    if (item?.headerKey) map[item.headerKey] = item.headerValue ?? '';
  }
  return Object.keys(map).length ? map : undefined;
};

/** API map → 表单键值对列表（编辑回显） */
const headersMapToList = (map?: Record<string, string>) =>
  map
    ? Object.entries(map).map(([headerKey, headerValue]) => ({
        headerKey,
        headerValue,
      }))
    : undefined;

/** 按类型组装 config 字段（恰好一种，整体替换语义；可选子字段不落空值） */
const buildChannelConfig = (values: ChannelFormValues) => {
  const { kind } = NOTIFY_CHANNEL_TYPE_META[values.type];
  if (kind === 'email') {
    return {
      email: {
        host: values.host ?? '',
        port: values.port ?? 0,
        username: values.username ?? '',
        fromAddr: values.fromAddr ?? '',
        starttls: values.starttls ?? false,
      },
    };
  }
  if (kind === 'webhook') {
    const headers = headersListToMap(values.headers);
    return {
      webhook: {
        url: values.url ?? '',
        // v1 仅支持 POST
        method: 'POST',
        ...(headers && { headers }),
        // 表单必填且带缺省值；兜底仍落缺省，与后端 biz.DefaultWebhookTimeoutS 一致
        timeoutS: values.timeoutS ?? NOTIFY_WEBHOOK_TIMEOUT_DEFAULT_S,
      },
    };
  }
  const atMobiles = values.atMobiles?.filter(Boolean) ?? [];
  const cardUrl = values.cardUrl?.trim();
  const cardButton = values.cardButton?.trim();
  return {
    robot: {
      ...(atMobiles.length && { atMobiles }),
      ...(cardUrl && { cardUrl }),
      ...(cardUrl && cardButton && { cardButton }),
    },
  };
};

/** 限流参数（任一填写即携带；int64 转字符串，0 = 不限） */
const buildRateLimit = (values: ChannelFormValues) =>
  values.qps != null || values.burst != null || values.perMinute != null
    ? {
        rateLimit: {
          qps: String(values.qps ?? 0),
          burst: String(values.burst ?? 0),
          perMinute: String(values.perMinute ?? 0),
        },
      }
    : {};

/**
 * 签名密钥提交语义（仅钉钉/飞书）：创建仅在填写时携带；编辑时
 * 清除开关 → 空串（停用加签）、填写 → 轮换、留空 → 不传（保留）。
 */
const buildSignSecret = (values: ChannelFormValues, editing: boolean) => {
  if (!NOTIFY_CHANNEL_TYPE_META[values.type].signSecretSupported) return {};
  if (editing && values.clearSignSecret) return { signSecret: '' };
  return values.signSecret ? { signSecret: values.signSecret } : {};
};

/**
 * 类型化配置 + 凭据表单字段组（新建/编辑共用，两列栅格）：
 * 按 meta.kind 切换 email / webhook / robot 分支，凭据标签与必填语义随类型变化；
 * editing 模式下凭据可选（留空=保留旧密文，填写=轮换）。
 */
const ChannelConfigFields: React.FC<{
  type: NotifyChannelType;
  editing?: boolean;
}> = ({ type, editing }) => {
  const t = useT();
  const rules = useFormRules();
  const meta = NOTIFY_CHANNEL_TYPE_META[type];
  const secretLabel = t(meta.secretLabelId);
  return (
    <>
      {meta.kind === 'email' && (
        <>
          <ProFormText
            name="host"
            label={t('pages.notify.channel.form.host')}
            colProps={HALF}
            placeholder={t('pages.notify.channel.form.host.placeholder')}
            rules={[
              rules.required(t('pages.notify.channel.form.host')),
              rules.max(253),
            ]}
          />
          <ProFormDigit
            name="port"
            label={t('pages.notify.channel.form.port')}
            colProps={HALF}
            placeholder="25 / 465 / 587"
            min={1}
            max={65535}
            fieldProps={{ precision: 0 }}
            rules={[rules.required(t('pages.notify.channel.form.port'))]}
          />
          <ProFormText
            name="username"
            label={t('pages.notify.channel.form.username')}
            colProps={HALF}
            placeholder={t('common.optional')}
            rules={[rules.max(64)]}
          />
          <ProFormText
            name="fromAddr"
            label={t('pages.notify.channel.form.fromAddr')}
            colProps={HALF}
            placeholder="noreply@example.com"
            rules={[
              rules.required(t('pages.notify.channel.form.fromAddr')),
              rules.email(),
            ]}
          />
          <ProFormSwitch name="starttls" label="STARTTLS" colProps={HALF} />
        </>
      )}
      {meta.kind === 'webhook' && (
        <>
          <ProFormText
            name="url"
            label={t('pages.notify.channel.form.url')}
            colProps={FULL}
            placeholder="https://…"
            rules={[
              rules.required(t('pages.notify.channel.form.url')),
              {
                pattern: /^https:\/\//,
                message: t('pages.notify.channel.form.url.https'),
              },
            ]}
          />
          <ProFormList
            name="headers"
            label={t('pages.notify.channel.form.headers')}
            colProps={FULL}
            tooltip={t('pages.notify.channel.form.headers.tooltip')}
            max={16}
            creatorButtonProps={{
              creatorButtonText: t('pages.notify.channel.form.headers.add'),
            }}
          >
            <ProForm.Group colProps={FULL} rowProps={{ gutter: 16 }}>
              <ProFormText
                name="headerKey"
                colProps={HALF}
                label={t('pages.notify.channel.form.headers.key')}
                rules={[
                  rules.required(t('pages.notify.channel.form.headers.key')),
                  rules.max(128),
                ]}
              />
              <ProFormText
                name="headerValue"
                colProps={HALF}
                label={t('pages.notify.channel.form.headers.value')}
                rules={[rules.max(512)]}
              />
            </ProForm.Group>
          </ProFormList>
          <ProFormDigit
            name="timeoutS"
            label={t('pages.notify.channel.form.timeout')}
            colProps={HALF}
            tooltip={t('pages.notify.channel.form.timeout.tooltip')}
            initialValue={NOTIFY_WEBHOOK_TIMEOUT_DEFAULT_S}
            min={1}
            max={10}
            fieldProps={{ precision: 0 }}
            rules={[
              {
                required: true,
                message: t('pages.notify.channel.form.timeout.required'),
              },
            ]}
          />
        </>
      )}
      {meta.kind === 'robot' && (
        <>
          <ProFormSelect
            name="atMobiles"
            label={t('pages.notify.channel.form.atMobiles')}
            colProps={FULL}
            tooltip={t('pages.notify.channel.form.atMobiles.tooltip')}
            fieldProps={{
              mode: 'tags',
              open: false,
              tokenSeparators: [',', ' '],
              placeholder: t('pages.notify.channel.form.atMobiles.placeholder'),
            }}
            rules={[
              {
                validator: (_, value?: string[]) => {
                  const list = value ?? [];
                  if (list.length > 20) {
                    return Promise.reject(
                      new Error(t('pages.notify.channel.form.atMobiles.max')),
                    );
                  }
                  if (
                    list.some((item) => item.length < 5 || item.length > 32)
                  ) {
                    return Promise.reject(
                      new Error(
                        t('pages.notify.channel.form.atMobiles.length'),
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          />
          <ProFormText
            name="cardUrl"
            label={t('pages.notify.channel.form.cardUrl')}
            colProps={HALF}
            tooltip={t('pages.notify.channel.form.cardUrl.tooltip')}
            placeholder="https://"
            rules={[
              rules.max(2048),
              {
                pattern: /^https:\/\//,
                message: t('pages.notify.channel.form.cardUrl.rule'),
              },
            ]}
          />
          <ProFormText
            name="cardButton"
            label={t('pages.notify.channel.form.cardButton')}
            colProps={HALF}
            dependencies={['cardUrl']}
            placeholder={t('pages.notify.channel.form.cardButton.placeholder')}
            rules={[
              rules.max(32),
              ({ getFieldValue }) => ({
                validator: (_, value?: string) =>
                  value?.trim() && !getFieldValue('cardUrl')?.trim()
                    ? Promise.reject(
                        new Error(
                          t('pages.notify.channel.form.cardButton.needUrl'),
                        ),
                      )
                    : Promise.resolve(),
              }),
            ]}
          />
        </>
      )}
      <ProFormText.Password
        name="secret"
        label={secretLabel}
        colProps={HALF}
        placeholder={
          editing
            ? t('pages.notify.channel.form.secret.editPlaceholder')
            : t(meta.secretPlaceholderId)
        }
        rules={[
          {
            required: !editing && meta.secretRequired,
            message: t('common.validation.required', { label: secretLabel }),
          },
          rules.lengthRange(1, 512),
        ]}
      />
      {/* 机器人签名密钥（钉钉加签 / 飞书签名校验）：可选、只写不读 */}
      {meta.signSecretSupported && (
        <>
          <ProFormText.Password
            name="signSecret"
            label={t('pages.notify.channel.form.signSecret')}
            colProps={HALF}
            tooltip={t('pages.notify.channel.form.signSecret.tooltip')}
            placeholder={
              editing
                ? t('pages.notify.channel.form.signSecret.editPlaceholder')
                : t('pages.notify.channel.form.signSecret.placeholder')
            }
            rules={[rules.max(512)]}
          />
          {editing && (
            <ProFormSwitch
              name="clearSignSecret"
              label={t('pages.notify.channel.form.clearSignSecret')}
              colProps={HALF}
              tooltip={t('pages.notify.channel.form.clearSignSecret.tooltip')}
            />
          )}
        </>
      )}
    </>
  );
};

/** 测试事件表单值（可选项均有缺省值；载荷为 JSON 文本，提交时解析） */
interface TestEventFormValues {
  eventType?: string;
  title?: string;
  recipients?: string[];
  payloadText?: string;
}

/**
 * 通知渠道：一行渠道 = 一个可独立发送/限流/启停的端点实例。
 * type 创建后不可改（换适配器须新建）；secret 只写不读（编辑留空=保留，填写=轮换）；
 * 编辑回显经 getChannel 拉取（不含 secret）；测试事件走生产同链路，结果异步跟踪。
 * biz 范围：受限用户仅能在角色授予的业务内查询/创建。
 * 新建/编辑字段较多（≥8）→ 抽屉 + 两列栅格；测试事件 4 字段 → 模态框。
 */
const ChannelList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const has = usePermissions();
  const scope = useBizScope();
  const t = useT();
  const rules = useFormRules();
  const submitter = useSubmitter();
  const enabledEnum = useValueEnum(ENABLED_META);
  const channelTypeEnum = useValueEnum(NOTIFY_CHANNEL_TYPE_META);
  const channelTypeText = useEnumText(NOTIFY_CHANNEL_TYPE_META);
  const bizIdColumn = useBizIdColumn<NotifyChannel>(scope);
  // 路由级权限：测试事件结果是否可下钻到「投递追踪 / 发送任务」
  const access = useAccess();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<NotifyChannel | null>(null);
  const [testRow, setTestRow] = useState<NotifyChannel | null>(null);
  // 已落库的测试事件 ID（异步投递结果经事件/任务/明细页跟踪）
  const [testEventId, setTestEventId] = useState<string | null>(null);

  const reload = () => actionRef.current?.reload();

  // 任一操作权限都没有时，整个「操作」列不展示
  const hasAnyAction =
    has('notify.channel.edit') ||
    has('notify.channel.delete') ||
    has('notify.channel.test');

  const nameRules = [
    rules.required(t('pages.notify.channel.column.name')),
    rules.max(128),
  ];

  const columns: ProColumns<NotifyChannel>[] = [
    {
      title: t('common.column.keyword'),
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: t('pages.notify.channel.column.name') },
    },
    bizIdColumn,
    {
      title: t('pages.notify.channel.column.name'),
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      // 名称搜索由「关键字」字段覆盖（后端 keyword 模糊匹配渠道名）
      search: false,
    },
    {
      title: t('pages.notify.channel.column.type'),
      dataIndex: 'type',
      valueEnum: channelTypeEnum,
      width: 150,
      render: (_, record) => (
        <Tag color={NOTIFY_CHANNEL_TYPE_META[record.type].color}>
          {channelTypeText(record.type)}
        </Tag>
      ),
    },
    {
      title: t('pages.notify.channel.column.config'),
      dataIndex: 'config',
      search: false,
      ellipsis: true,
      width: 240,
      render: (_, record) => {
        if (record.email) return `${record.email.host}:${record.email.port}`;
        if (record.webhook) return record.webhook.url;
        if (record.robot) {
          const count = record.robot.atMobiles?.length ?? 0;
          return count > 0
            ? t('pages.notify.channel.config.atMobiles', { count })
            : t('common.empty');
        }
        return t('common.empty');
      },
    },
    {
      title: t('common.column.status'),
      dataIndex: 'enabled',
      valueEnum: enabledEnum,
      width: 90,
    },
    {
      title: t('common.column.createTime'),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
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
      fixed: 'right',
      width: 140,
      hideInTable: !hasAnyAction,
      render: (_, record) => {
        // 元素权限显隐：无对应权限码的操作不渲染
        const actions: React.ReactNode[] = [];
        if (has('notify.channel.edit')) {
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
        if (has('notify.channel.delete')) {
          actions.push(
            <DeleteConfirmLink
              key="delete"
              title={t('pages.notify.channel.delete.title')}
              description={t('pages.notify.channel.delete.description')}
              onConfirm={async () => {
                await deleteChannel(record.id);
                message.success(t('common.msg.deleted'));
                reload();
              }}
            />,
          );
        }
        // 测试事件：停用实例被路由跳过，测试无意义，仅启用渠道展示
        if (has('notify.channel.test') && record.enabled) {
          actions.push(
            <a
              key="test"
              onClick={() => {
                setTestRow(record);
              }}
            >
              {t('pages.notify.channel.action.test')}
            </a>,
          );
        }
        return actions;
      },
    },
  ];

  /** 限流两项（新建/编辑共用，同行） */
  const rateLimitFields = (
    <>
      <ProFormDigit
        name="qps"
        label={t('pages.notify.channel.form.qps')}
        colProps={HALF}
        placeholder={t('pages.notify.common.zeroUnlimited')}
        min={0}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name="burst"
        label={t('pages.notify.channel.form.burst')}
        colProps={HALF}
        placeholder={t('pages.notify.common.zeroUnlimited')}
        min={0}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name="perMinute"
        label={t('pages.notify.channel.form.perMinute')}
        colProps={HALF}
        tooltip={t('pages.notify.channel.form.perMinute.tooltip')}
        placeholder={t('pages.notify.channel.form.perMinute.placeholder')}
        min={0}
        fieldProps={{ precision: 0 }}
      />
    </>
  );

  return (
    <>
      <PageContainer title={false}>
        <ProTable<NotifyChannel>
          cardBordered
          headerTitle={
            has('notify.channel.create') && (
              <CreateButton
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                {t('pages.notify.channel.create.title')}
              </CreateButton>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          scroll={{ x: 'max-content' }}
          request={async (params) => {
            const result = await listChannels({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              bizId: params.bizId || undefined,
              type: params.type as NotifyChannelType | undefined,
              enabled: parseBoolParam(params.enabled),
            });
            return toTableResult(result);
          }}
        />
      </PageContainer>

      {/* 新建渠道（抽屉）：type 决定配置分支，创建后不可改；biz 创建后不可改。
          栅格：名称 + 业务 / 类型 + 启用 / 类型配置分支 / 凭据 + 签名密钥 / QPS + 突发 */}
      <DrawerForm<ChannelFormValues>
        key="create-channel"
        title={t('pages.notify.channel.create.title')}
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
          await createChannel({
            bizId: values.bizId || undefined,
            name: values.name,
            type: values.type,
            ...buildChannelConfig(values),
            ...buildRateLimit(values),
            enabled: values.enabled ?? true,
            secret: values.secret || undefined,
            ...buildSignSecret(values, false),
          });
          message.success(t('common.msg.created'));
          reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={t('pages.notify.channel.column.name')}
          colProps={HALF}
          placeholder={t('pages.notify.channel.form.name.placeholder')}
          rules={nameRules}
        />
        <BizIdFormField scope={scope} colProps={HALF} />
        <ProFormSelect
          name="type"
          label={t('pages.notify.channel.form.type')}
          colProps={HALF}
          tooltip={t('pages.notify.channel.form.type.tooltip')}
          valueEnum={channelTypeEnum}
          placeholder={t('common.validation.select', {
            label: t('pages.notify.channel.form.type'),
          })}
          rules={[rules.select(t('pages.notify.channel.form.type'))]}
        />
        <ProFormSwitch
          name="enabled"
          label={t('common.column.enabled')}
          colProps={HALF}
        />
        {/* 选择类型后渲染对应配置分支与凭据项 */}
        <ProFormDependency name={['type']}>
          {({ type }) => (type ? <ChannelConfigFields type={type} /> : null)}
        </ProFormDependency>
        {rateLimitFields}
      </DrawerForm>

      {/* 编辑渠道（抽屉）：type/biz 不可改；secret 留空=保留旧密文，填写=轮换；打开时拉取详情 */}
      {editRow && (
        <DrawerForm<ChannelFormValues>
          key={`edit-channel-${editRow.id}`}
          title={t('pages.notify.channel.edit.title', { name: editRow.name })}
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
            const { channel } = await getChannel(id);
            // name/type 必有（type 不可改），其余按类型补齐，构成完整表单值
            const values: ChannelFormValues = {
              name: channel.name,
              type: channel.type,
              enabled: channel.enabled,
            };
            if (channel.email) {
              values.host = channel.email.host;
              values.port = channel.email.port;
              values.username = channel.email.username;
              values.fromAddr = channel.email.fromAddr;
              values.starttls = channel.email.starttls;
            }
            if (channel.webhook) {
              values.url = channel.webhook.url;
              values.headers = headersMapToList(channel.webhook.headers);
              // 历史行可能无超时值（缺省补齐前落库），回显时兜底缺省
              values.timeoutS =
                channel.webhook.timeoutS || NOTIFY_WEBHOOK_TIMEOUT_DEFAULT_S;
            }
            if (channel.robot) {
              values.atMobiles = channel.robot.atMobiles ?? [];
              values.cardUrl = channel.robot.cardUrl;
              values.cardButton = channel.robot.cardButton;
            }
            if (channel.rateLimit) {
              values.qps = Number(channel.rateLimit.qps);
              values.burst = Number(channel.rateLimit.burst);
              values.perMinute = Number(channel.rateLimit.perMinute ?? 0);
            }
            return values;
          }}
          submitter={submitter.save}
          onFinish={async (values) => {
            await updateChannel(editRow.id, {
              name: values.name,
              ...buildChannelConfig(values),
              ...buildRateLimit(values),
              enabled: values.enabled ?? true,
              // 不传 = 保留旧密文，传新值 = 轮换
              ...(values.secret ? { secret: values.secret } : {}),
              ...buildSignSecret(values, true),
            });
            message.success(t('common.msg.saved'));
            reload();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label={t('pages.notify.channel.column.name')}
            colProps={HALF}
            rules={nameRules}
          />
          <BizIdReadonlyField bizId={editRow.bizId} colProps={HALF} />
          <ProFormSelect
            name="type"
            label={t('pages.notify.channel.form.type')}
            colProps={HALF}
            disabled
            tooltip={t('pages.notify.channel.form.type.readonlyTooltip')}
            valueEnum={channelTypeEnum}
          />
          <ProFormSwitch
            name="enabled"
            label={t('common.column.enabled')}
            colProps={HALF}
          />
          <ProFormDependency name={['type']}>
            {({ type }) =>
              type ? <ChannelConfigFields type={type} editing /> : null
            }
          </ProFormDependency>
          {rateLimitFields}
        </DrawerForm>
      )}

      {/* 发送测试事件（模态框，4 字段）：走与生产事件完全相同的链路（路由 → 模板 → 发送），投递结果异步跟踪 */}
      {testRow && (
        <ModalForm<TestEventFormValues>
          key={`test-channel-${testRow.id}`}
          title={t('pages.notify.channel.test.title', { name: testRow.name })}
          width={640}
          grid
          rowProps={{ gutter: 16 }}
          open={!!testRow}
          onOpenChange={(open) => {
            if (!open) setTestRow(null);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={{
            eventType: 'notify.test',
            title: t('pages.notify.channel.test.defaultTitle'),
          }}
          submitter={{
            searchConfig: {
              submitText: t('pages.notify.channel.test.submit'),
              resetText: t('common.action.cancel'),
            },
          }}
          onFinish={async (values) => {
            const { event } = await sendTestEvent(testRow.id, {
              eventType: values.eventType || undefined,
              title: values.title || undefined,
              recipients: values.recipients?.length
                ? values.recipients
                : undefined,
              payload: values.payloadText
                ? (JSON.parse(values.payloadText) as Record<string, unknown>)
                : undefined,
            });
            message.success(t('pages.notify.channel.test.created'));
            setTestEventId(event.id);
            return true;
          }}
        >
          <ProFormText
            name="eventType"
            label={t('pages.notify.channel.test.eventType')}
            colProps={HALF}
            tooltip={t('pages.notify.channel.test.eventType.tooltip')}
            rules={[
              {
                pattern: /^[a-z0-9][a-z0-9._-]{0,127}$/,
                message: t('pages.notify.channel.test.eventType.rule'),
              },
            ]}
          />
          <ProFormText
            name="title"
            label={t('pages.notify.channel.test.eventTitle')}
            colProps={HALF}
            rules={[rules.max(255)]}
          />
          <ProFormSelect
            name="recipients"
            label={t('pages.notify.channel.test.recipients')}
            colProps={FULL}
            tooltip={t('pages.notify.channel.test.recipients.tooltip')}
            fieldProps={{
              mode: 'tags',
              open: false,
              tokenSeparators: [',', ' '],
              placeholder: t(
                'pages.notify.channel.test.recipients.placeholder',
              ),
            }}
            rules={[
              {
                validator: (_, value?: string[]) => {
                  const list = value ?? [];
                  if (list.length > 20) {
                    return Promise.reject(
                      new Error(t('pages.notify.channel.test.recipients.max')),
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
          <ProFormTextArea
            name="payloadText"
            label={t('pages.notify.channel.test.payload')}
            colProps={FULL}
            tooltip={t('pages.notify.channel.test.payload.tooltip')}
            fieldProps={{
              rows: 3,
              placeholder: '{"key": "value"}',
            }}
            rules={[
              {
                validator: (_: unknown, value?: string) => {
                  if (!value) return Promise.resolve();
                  try {
                    const parsed = JSON.parse(value);
                    if (
                      typeof parsed !== 'object' ||
                      parsed === null ||
                      Array.isArray(parsed)
                    ) {
                      return Promise.reject(
                        new Error(
                          t('pages.notify.channel.test.payload.object'),
                        ),
                      );
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(
                      new Error(t('pages.notify.channel.test.payload.invalid')),
                    );
                  }
                },
              },
            ]}
          />
        </ModalForm>
      )}

      {/* 测试事件创建结果：事件 ID 是异步链路的跟踪线索，可直接下钻到投递追踪 */}
      <Modal
        title={t('pages.notify.channel.test.created')}
        open={!!testEventId}
        onOk={() => {
          setTestEventId(null);
        }}
        onCancel={() => {
          setTestEventId(null);
        }}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Typography.Paragraph type="secondary">
          {t('pages.notify.channel.test.result.desc')}
        </Typography.Paragraph>
        <Typography.Paragraph copyable={{ text: testEventId ?? '' }}>
          {access.canNotifyDispatch ? (
            <Link
              to={`/notify/trace/dispatch?eventId=${testEventId}`}
              onClick={() => {
                setTestEventId(null);
              }}
            >
              {testEventId}
            </Link>
          ) : (
            testEventId
          )}
        </Typography.Paragraph>
      </Modal>
    </>
  );
};

export default ChannelList;
