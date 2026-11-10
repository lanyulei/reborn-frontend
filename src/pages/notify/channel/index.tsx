import { PlusOutlined } from '@ant-design/icons';
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
import { App, Button, Modal, Popconfirm, Tag, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import {
  NOTIFY_CHANNEL_TYPE_ENUM,
  NOTIFY_CHANNEL_TYPE_META,
  NOTIFY_CHANNEL_TYPE_TEXT,
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
  BizIdFormField,
  BizIdReadonlyField,
  bizIdColumn,
} from '../components/bizScope';

/** 渠道状态枚举（表格筛选 + 展示）；查询参数经 request 归一化为布尔 */
const CHANNEL_ENABLED_ENUM: NonNullable<ProColumns['valueEnum']> = {
  true: { text: '启用', status: 'Success' },
  false: { text: '停用', status: 'Error' },
};

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
  return { robot: atMobiles.length ? { atMobiles } : {} };
};

/** 限流参数（任一填写即携带；int64 转字符串，0 = 不限） */
const buildRateLimit = (values: ChannelFormValues) =>
  values.qps != null || values.burst != null
    ? {
        rateLimit: {
          qps: String(values.qps ?? 0),
          burst: String(values.burst ?? 0),
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
  const meta = NOTIFY_CHANNEL_TYPE_META[type];
  return (
    <>
      {meta.kind === 'email' && (
        <>
          <ProFormText
            name="host"
            label="SMTP 服务器"
            colProps={HALF}
            placeholder="如 smtp.example.com"
            rules={[
              { required: true, message: '请输入 SMTP 服务器' },
              { max: 253, message: '最多 253 位' },
            ]}
          />
          <ProFormDigit
            name="port"
            label="端口"
            colProps={HALF}
            placeholder="25 / 465 / 587"
            min={1}
            max={65535}
            fieldProps={{ precision: 0 }}
            rules={[{ required: true, message: '请输入端口' }]}
          />
          <ProFormText
            name="username"
            label="认证用户名"
            colProps={HALF}
            placeholder="可选"
            rules={[{ max: 64, message: '最多 64 位' }]}
          />
          <ProFormText
            name="fromAddr"
            label="发件人地址"
            colProps={HALF}
            placeholder="noreply@example.com"
            rules={[
              { required: true, message: '请输入发件人地址' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          />
          <ProFormSwitch name="starttls" label="STARTTLS" colProps={HALF} />
        </>
      )}
      {meta.kind === 'webhook' && (
        <>
          <ProFormText
            name="url"
            label="目标地址"
            colProps={FULL}
            placeholder="https://…"
            rules={[
              { required: true, message: '请输入目标地址' },
              { pattern: /^https:\/\//, message: '必须以 https:// 开头' },
            ]}
          />
          <ProFormList
            name="headers"
            label="附加请求头"
            colProps={FULL}
            tooltip="随出站请求携带的鉴权头等，最多 16 对"
            max={16}
            creatorButtonProps={{ creatorButtonText: '添加请求头' }}
          >
            <ProForm.Group>
              <ProFormText
                name="headerKey"
                label="名称"
                rules={[
                  { required: true, message: '请输入名称' },
                  { max: 128, message: '最多 128 位' },
                ]}
              />
              <ProFormText
                name="headerValue"
                label="值"
                rules={[{ max: 512, message: '最多 512 位' }]}
              />
            </ProForm.Group>
          </ProFormList>
          <ProFormDigit
            name="timeoutS"
            label="出站超时（秒）"
            colProps={HALF}
            tooltip="1-10 秒；后端缺省 5"
            initialValue={NOTIFY_WEBHOOK_TIMEOUT_DEFAULT_S}
            min={1}
            max={10}
            fieldProps={{ precision: 0 }}
            rules={[{ required: true, message: '请输入出站超时（1-10 秒）' }]}
          />
        </>
      )}
      {meta.kind === 'robot' && (
        <ProFormSelect
          name="atMobiles"
          label="@ 提醒手机号"
          colProps={FULL}
          tooltip="可选，最多 20 个、每个 5-32 位"
          fieldProps={{
            mode: 'tags',
            open: false,
            tokenSeparators: [',', ' '],
            placeholder: '输入手机号后回车，可多个',
          }}
          rules={[
            {
              validator: (_, value?: string[]) => {
                const list = value ?? [];
                if (list.length > 20) {
                  return Promise.reject(new Error('最多 20 个'));
                }
                if (list.some((item) => item.length < 5 || item.length > 32)) {
                  return Promise.reject(new Error('每个手机号 5-32 位'));
                }
                return Promise.resolve();
              },
            },
          ]}
        />
      )}
      <ProFormText.Password
        name="secret"
        label={meta.secretLabel}
        colProps={HALF}
        placeholder={
          editing ? '留空保留原凭据，填写即轮换' : meta.secretPlaceholder
        }
        rules={[
          {
            required: !editing && meta.secretRequired,
            message: `请输入${meta.secretLabel}`,
          },
          { min: 1, max: 512, message: '1-512 位' },
        ]}
      />
      {/* 机器人签名密钥（钉钉加签 / 飞书签名校验）：可选、只写不读 */}
      {meta.signSecretSupported && (
        <>
          <ProFormText.Password
            name="signSecret"
            label="签名密钥"
            colProps={HALF}
            tooltip="钉钉「加签」/ 飞书「签名校验」密钥，可选；只写不读"
            placeholder={
              editing ? '留空保留原密钥，填写即轮换' : '可选，1-512 位'
            }
            rules={[{ max: 512, message: '最多 512 位' }]}
          />
          {editing && (
            <ProFormSwitch
              name="clearSignSecret"
              label="清除签名密钥"
              colProps={HALF}
              tooltip="开启后保存将停用加签（忽略上方输入）"
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

  const columns: ProColumns<NotifyChannel>[] = [
    {
      title: '搜索项',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '渠道名称' },
    },
    bizIdColumn<NotifyChannel>(scope),
    {
      title: '渠道名称',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      // 名称搜索由「关键字」字段覆盖（后端 keyword 模糊匹配渠道名）
      search: false,
    },
    {
      title: '类型',
      dataIndex: 'type',
      valueEnum: NOTIFY_CHANNEL_TYPE_ENUM,
      width: 150,
      render: (_, record) => (
        <Tag color={NOTIFY_CHANNEL_TYPE_META[record.type].color}>
          {NOTIFY_CHANNEL_TYPE_TEXT[record.type]}
        </Tag>
      ),
    },
    {
      title: '配置摘要',
      dataIndex: 'config',
      search: false,
      ellipsis: true,
      render: (_, record) => {
        if (record.email) return `${record.email.host}:${record.email.port}`;
        if (record.webhook) return record.webhook.url;
        if (record.robot) {
          const count = record.robot.atMobiles?.length ?? 0;
          return count > 0 ? `@ ${count} 个手机号` : '—';
        }
        return '—';
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueEnum: CHANNEL_ENABLED_ENUM,
      width: 90,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      search: false,
      width: 160,
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
              编辑
            </a>,
          );
        }
        if (has('notify.channel.delete')) {
          actions.push(
            <Popconfirm
              key="delete"
              title="删除渠道"
              description="仍被路由引用的渠道需先从路由解绑；删除后名称可复用，历史投递记录不受影响，确定删除？"
              onConfirm={async () => {
                await deleteChannel(record.id);
                message.success('删除成功');
                reload();
              }}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>,
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
              测试
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
        label="限流 QPS"
        colProps={HALF}
        placeholder="0 = 不限"
        min={0}
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name="burst"
        label="突发上限"
        colProps={HALF}
        placeholder="0 = 不限"
        min={0}
        fieldProps={{ precision: 0 }}
      />
    </>
  );

  return (
    <>
      <PageContainer title={false}>
        <ProTable<NotifyChannel>
          headerTitle={
            has('notify.channel.create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                新建渠道
              </Button>
            )
          }
          rowKey="id"
          actionRef={actionRef}
          search={{ labelWidth: 'auto' }}
          columns={columns}
          request={async (params) => {
            const result = await listChannels({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword || undefined,
              bizId: params.bizId || undefined,
              type: params.type as NotifyChannelType | undefined,
              // valueEnum 键经表单序列化为字符串，此处归一化回布尔
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

      {/* 新建渠道（抽屉）：type 决定配置分支，创建后不可改；biz 创建后不可改。
          栅格：名称 + 业务 / 类型 + 启用 / 类型配置分支 / 凭据 + 签名密钥 / QPS + 突发 */}
      <DrawerForm<ChannelFormValues>
        key="create-channel"
        title="新建渠道"
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
          message.success('创建成功');
          reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="渠道名称"
          colProps={HALF}
          placeholder="1-128 位，同业务内唯一"
          rules={[
            { required: true, message: '请输入渠道名称' },
            { max: 128, message: '最多 128 位' },
          ]}
        />
        <BizIdFormField scope={scope} colProps={HALF} />
        <ProFormSelect
          name="type"
          label="渠道类型"
          colProps={HALF}
          tooltip="决定配置结构与发送适配器，创建后不可修改"
          valueEnum={NOTIFY_CHANNEL_TYPE_ENUM}
          placeholder="请选择渠道类型"
          rules={[{ required: true, message: '请选择渠道类型' }]}
        />
        <ProFormSwitch name="enabled" label="启用" colProps={HALF} />
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
          title={`编辑渠道：${editRow.name}`}
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
            }
            if (channel.rateLimit) {
              values.qps = Number(channel.rateLimit.qps);
              values.burst = Number(channel.rateLimit.burst);
            }
            return values;
          }}
          submitter={{
            searchConfig: { submitText: '保存', resetText: '取消' },
          }}
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
            message.success('保存成功');
            reload();
            return true;
          }}
        >
          <ProFormText
            name="name"
            label="渠道名称"
            colProps={HALF}
            rules={[
              { required: true, message: '请输入渠道名称' },
              { max: 128, message: '最多 128 位' },
            ]}
          />
          <BizIdReadonlyField bizId={editRow.bizId} colProps={HALF} />
          <ProFormSelect
            name="type"
            label="渠道类型"
            colProps={HALF}
            disabled
            tooltip="创建后不可修改，更换类型请新建渠道"
            valueEnum={NOTIFY_CHANNEL_TYPE_ENUM}
          />
          <ProFormSwitch name="enabled" label="启用" colProps={HALF} />
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
          title={`发送测试事件：${testRow.name}`}
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
            title: '通知渠道连通性测试',
          }}
          submitter={{
            searchConfig: { submitText: '发送', resetText: '取消' },
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
            message.success('测试事件已创建');
            setTestEventId(event.id);
            return true;
          }}
        >
          <ProFormText
            name="eventType"
            label="事件类型"
            colProps={HALF}
            tooltip="需有路由 event_pattern 覆盖该类型且渠道集合含本实例，才会实际投递"
            rules={[
              {
                pattern: /^[a-z0-9][a-z0-9._-]{0,127}$/,
                message: '小写字母/数字开头的点分串，最长 128 位',
              },
            ]}
          />
          <ProFormText
            name="title"
            label="事件标题"
            colProps={HALF}
            rules={[{ max: 255, message: '最多 255 位' }]}
          />
          <ProFormSelect
            name="recipients"
            label="指定收件人"
            colProps={FULL}
            tooltip="留空 = 交路由按收件策略解析（与生产事件同链路）"
            fieldProps={{
              mode: 'tags',
              open: false,
              tokenSeparators: [',', ' '],
              placeholder: '邮箱/群标识，回车确认，最多 20 个',
            }}
            rules={[
              {
                validator: (_, value?: string[]) => {
                  const list = value ?? [];
                  if (list.length > 20) {
                    return Promise.reject(new Error('最多 20 个'));
                  }
                  if (list.some((item) => !item || item.length > 255)) {
                    return Promise.reject(new Error('每个收件人 1-255 位'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          />
          <ProFormTextArea
            name="payloadText"
            label="附加载荷（JSON）"
            colProps={FULL}
            tooltip="可选，合并进事件 payload 的 test 上下文"
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
                      return Promise.reject(new Error('须为 JSON 对象'));
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error('JSON 格式不正确'));
                  }
                },
              },
            ]}
          />
        </ModalForm>
      )}

      {/* 测试事件创建结果：事件 ID 是异步链路的跟踪线索，可直接下钻到投递追踪 */}
      <Modal
        title="测试事件已创建"
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
          事件已进入异步投递链路（路由 → 模板 → 发送），可在「投递追踪」按事件
          ID 查看发送任务与投递明细：
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
