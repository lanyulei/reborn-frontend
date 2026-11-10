import type { ProColumns } from '@ant-design/pro-components';

import type {
  NotifyChannelType,
  NotifyDispatchStatus,
  NotifyEventStatus,
  NotifyPublishState,
  NotifyReplayState,
  NotifySeverity,
  NotifyTemplateChannelType,
} from '@/services/notify/typings';
import type {
  Gender,
  LoginLogResult,
  RoleStatus,
  UserStatus,
} from '@/services/system/typings';

/** ProColumns valueEnum 徽标状态（含进行中，与 ProSchema 值枚举一致） */
type ProBadgeStatus =
  | 'Success'
  | 'Processing'
  | 'Error'
  | 'Default'
  | 'Warning';

/** 性别选项（新建/编辑用户、个人设置表单共用） */
export const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '未知', value: 'unknown' },
];

/** 性别文案（表格展示），与选项同源派生 */
export const GENDER_TEXT: Record<Gender, string> = Object.fromEntries(
  GENDER_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<Gender, string>;

/** 密码长度规则（创建用户 / 重置密码 / 修改密码一致，对应后端 8-64 位断言） */
export const PASSWORD_LENGTH_RULE = {
  min: 8,
  max: 64,
  message: '长度 8-64 位',
};

/** 用户状态元数据：枚举展示与选项的唯一数据源 */
const USER_STATUS_META: Record<
  UserStatus,
  { text: string; status: 'Success' | 'Error' | 'Warning' | 'Default' }
> = {
  1: { text: '可用', status: 'Success' },
  2: { text: '停用', status: 'Error' },
  3: { text: '暂停', status: 'Warning' },
  4: { text: '离职', status: 'Default' },
};

/** 用户状态枚举（表格筛选 + 展示） */
export const USER_STATUS_ENUM: NonNullable<ProColumns['valueEnum']> =
  USER_STATUS_META;

/** 用户状态选项（变更状态子菜单等），由同一份元数据派生 */
export const USER_STATUS_OPTIONS: { value: UserStatus; text: string }[] = (
  [1, 2, 3, 4] as UserStatus[]
).map((value) => ({ value, text: USER_STATUS_META[value].text }));

/** 登录结果元数据：枚举展示与选项的唯一数据源（2/3 对外统一口径防枚举，细分值仅供审计检索） */
const LOGIN_LOG_RESULT_META: Record<
  LoginLogResult,
  { text: string; status: 'Success' | 'Error' | 'Warning' | 'Default' }
> = {
  1: { text: '成功', status: 'Success' },
  2: { text: '用户不存在', status: 'Error' },
  3: { text: '密码错误', status: 'Error' },
  4: { text: '账号禁用', status: 'Warning' },
  5: { text: '签发令牌失败', status: 'Default' },
};

/** 登录结果枚举（登录日志表格筛选 + 展示） */
export const LOGIN_LOG_RESULT_ENUM: NonNullable<ProColumns['valueEnum']> =
  LOGIN_LOG_RESULT_META;

/** 渠道类型元数据：展示文案 / 标签色 / 配置表单分支 / 凭据语义的唯一数据源 */
export interface NotifyChannelTypeMeta {
  /** 展示文案（表格标签、类型筛选） */
  text: string;
  /** Tag 颜色 */
  color: string;
  /** 配置表单分支：email / webhook / robot（钉钉/企微/飞书共用 robot） */
  kind: 'email' | 'webhook' | 'robot';
  /** 凭据表单项标签 */
  secretLabel: string;
  /** 凭据是否必传（email/群机器人必传，webhook 可选） */
  secretRequired: boolean;
  secretPlaceholder: string;
  /** 是否支持机器人签名密钥 sign_secret（钉钉加签 / 飞书签名校验；只写不读，可选） */
  signSecretSupported: boolean;
}

export const NOTIFY_CHANNEL_TYPE_META: Record<
  NotifyChannelType,
  NotifyChannelTypeMeta
> = {
  NOTIFY_CHANNEL_TYPE_EMAIL: {
    text: '邮件（SMTP）',
    color: 'blue',
    kind: 'email',
    secretLabel: 'SMTP 密码',
    secretRequired: true,
    secretPlaceholder: 'SMTP 认证密码，1-512 位',
    signSecretSupported: false,
  },
  NOTIFY_CHANNEL_TYPE_WEBHOOK: {
    text: 'Webhook',
    color: 'purple',
    kind: 'webhook',
    secretLabel: 'HMAC 签名密钥',
    secretRequired: false,
    secretPlaceholder: '出站 HMAC-SHA256 签名密钥，可选，1-512 位',
    signSecretSupported: false,
  },
  NOTIFY_CHANNEL_TYPE_DINGTALK: {
    text: '钉钉机器人',
    color: 'cyan',
    kind: 'robot',
    secretLabel: '机器人 Token',
    secretRequired: true,
    secretPlaceholder: '钉钉群机器人 access_token，1-512 位',
    signSecretSupported: true,
  },
  NOTIFY_CHANNEL_TYPE_WECOM: {
    text: '企业微信机器人',
    color: 'green',
    kind: 'robot',
    secretLabel: '机器人 Key',
    secretRequired: true,
    secretPlaceholder: '企微群机器人 webhook 密钥，1-512 位',
    signSecretSupported: false,
  },
  NOTIFY_CHANNEL_TYPE_FEISHU: {
    text: '飞书机器人',
    color: 'orange',
    kind: 'robot',
    secretLabel: '机器人 Token',
    secretRequired: true,
    secretPlaceholder: '飞书群机器人签名密钥，1-512 位',
    signSecretSupported: true,
  },
};

/** Webhook 出站超时缺省值（秒，1-10）；与后端 biz.DefaultWebhookTimeoutS 一致，表单必填并以此预填 */
export const NOTIFY_WEBHOOK_TIMEOUT_DEFAULT_S = 5;

/** 渠道类型文案（表格展示），与元数据同源派生 */
export const NOTIFY_CHANNEL_TYPE_TEXT: Record<NotifyChannelType, string> =
  Object.fromEntries(
    Object.entries(NOTIFY_CHANNEL_TYPE_META).map(([value, meta]) => [
      value,
      meta.text,
    ]),
  ) as Record<NotifyChannelType, string>;

/** 渠道类型枚举（表格筛选），与元数据同源派生 */
export const NOTIFY_CHANNEL_TYPE_ENUM: NonNullable<ProColumns['valueEnum']> =
  Object.fromEntries(
    Object.entries(NOTIFY_CHANNEL_TYPE_META).map(([value, meta]) => [
      value,
      { text: meta.text },
    ]),
  );

/** 通知严重级元数据：1 info / 2 warning / 3 critical / 4 fatal（事件、路由下限、静默上限共用） */
const NOTIFY_SEVERITY_META: Record<
  NotifySeverity,
  { text: string; status: ProBadgeStatus }
> = {
  1: { text: '提示', status: 'Default' },
  2: { text: '警告', status: 'Warning' },
  3: { text: '严重', status: 'Error' },
  4: { text: '致命', status: 'Error' },
};

/** 严重级枚举（事件表格、路由/静默表单筛选） */
export const NOTIFY_SEVERITY_ENUM: NonNullable<ProColumns['valueEnum']> =
  NOTIFY_SEVERITY_META;

/** 模板渠道维度元数据（小写字符串体系，含 '*' 通配；区别于渠道类型枚举） */
const NOTIFY_TEMPLATE_CHANNEL_META: Record<
  NotifyTemplateChannelType,
  { text: string }
> = {
  '*': { text: '任意渠道' },
  email: { text: '邮件' },
  webhook: { text: 'Webhook' },
  dingtalk: { text: '钉钉' },
  wecom: { text: '企业微信' },
  feishu: { text: '飞书' },
};

/** 模板渠道维度文案（订阅偏好等展示复用，不含 '*'） */
export const NOTIFY_TEMPLATE_CHANNEL_TEXT: Record<
  NotifyTemplateChannelType,
  string
> = Object.fromEntries(
  Object.entries(NOTIFY_TEMPLATE_CHANNEL_META).map(([value, meta]) => [
    value,
    meta.text,
  ]),
) as Record<NotifyTemplateChannelType, string>;

/** 模板渠道维度枚举（模板表格筛选 + 表单选择） */
export const NOTIFY_TEMPLATE_CHANNEL_ENUM: NonNullable<
  ProColumns['valueEnum']
> = Object.fromEntries(
  Object.entries(NOTIFY_TEMPLATE_CHANNEL_META).map(([value, meta]) => [
    value,
    { text: meta.text },
  ]),
);

/** 可订阅渠道类型（webhook 为系统目标非用户可达，不参与订阅） */
export const NOTIFY_SUBSCRIBABLE_CHANNEL_TYPES = [
  'email',
  'dingtalk',
  'wecom',
  'feishu',
] as const;

/** 事件路由状态元数据：1 received / 2 routed / 3 suppressed / 4 failed */
const NOTIFY_EVENT_STATUS_META: Record<
  NotifyEventStatus,
  { text: string; status: ProBadgeStatus }
> = {
  1: { text: '已接收', status: 'Default' },
  2: { text: '已路由', status: 'Success' },
  3: { text: '已静默', status: 'Warning' },
  4: { text: '路由失败', status: 'Error' },
};

/** 事件路由状态枚举（事件表格筛选 + 展示） */
export const NOTIFY_EVENT_STATUS_ENUM: NonNullable<ProColumns['valueEnum']> =
  NOTIFY_EVENT_STATUS_META;

/** NATS 发布状态元数据：0 pending / 1 published */
const NOTIFY_PUBLISH_STATE_META: Record<
  NotifyPublishState,
  { text: string; status: ProBadgeStatus }
> = {
  0: { text: '待发布', status: 'Default' },
  1: { text: '已发布', status: 'Success' },
};

/** NATS 发布状态枚举（事件表格展示） */
export const NOTIFY_PUBLISH_STATE_ENUM: NonNullable<ProColumns['valueEnum']> =
  NOTIFY_PUBLISH_STATE_META;

/** 发送任务状态元数据：1 pending / 2 sending / 3 sent / 4 failed（重试中）/ 5 dead（死信） */
const NOTIFY_DISPATCH_STATUS_META: Record<
  NotifyDispatchStatus,
  { text: string; status: ProBadgeStatus }
> = {
  1: { text: '待发送', status: 'Default' },
  2: { text: '发送中', status: 'Processing' },
  3: { text: '已发送', status: 'Success' },
  4: { text: '重试中', status: 'Warning' },
  5: { text: '死信', status: 'Error' },
};

/** 发送任务状态枚举（任务表格筛选 + 展示） */
export const NOTIFY_DISPATCH_STATUS_ENUM: NonNullable<ProColumns['valueEnum']> =
  NOTIFY_DISPATCH_STATUS_META;

/** 死信重放状态元数据：1 none / 2 pending / 3 replayed */
const NOTIFY_REPLAY_STATE_META: Record<
  NotifyReplayState,
  { text: string; status: ProBadgeStatus }
> = {
  1: { text: '未重放', status: 'Default' },
  2: { text: '待重放', status: 'Processing' },
  3: { text: '已重放', status: 'Success' },
};

/** 死信重放状态枚举（死信表格筛选 + 展示） */
export const NOTIFY_REPLAY_STATE_ENUM: NonNullable<ProColumns['valueEnum']> =
  NOTIFY_REPLAY_STATE_META;

/** 角色状态选项（新建/编辑表单共用） */
export const ROLE_STATUS_OPTIONS: { label: string; value: RoleStatus }[] = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

/** 角色名称校验规则（新建/编辑一致） */
export const ROLE_NAME_RULES = [
  { required: true, message: '请输入角色名称' },
  { max: 64, message: '最多 64 位' },
];
