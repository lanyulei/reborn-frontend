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
import type { EnumMeta } from '@/utils/i18n';

/**
 * 枚举 / 选项元数据：只保存结构（值、徽标状态、顺序）与 i18n 键（textId），
 * 展示文案在组件内经 `useValueEnum` / `useEnumText` / `useOptions`
 * （src/utils/i18n.ts）按当前语言解析；对应文案见 src/locales/<lang>/enum.ts。
 */

/** 性别元数据与选项顺序（新建/编辑用户、个人设置表单共用） */
export const GENDER_META: Record<Gender, { textId: string }> = {
  male: { textId: 'enum.gender.male' },
  female: { textId: 'enum.gender.female' },
  unknown: { textId: 'enum.gender.unknown' },
};
export const GENDER_ORDER: readonly Gender[] = ['male', 'female', 'unknown'];

/** 密码长度（创建用户 / 重置密码 / 修改密码一致，对应后端 8-64 位断言） */
export const PASSWORD_LENGTH = { min: 8, max: 64 } as const;

/** 用户状态元数据：枚举展示与选项的唯一数据源 */
export const USER_STATUS_META: EnumMeta<UserStatus> = {
  1: { textId: 'enum.userStatus.1', status: 'Success' },
  2: { textId: 'enum.userStatus.2', status: 'Error' },
  3: { textId: 'enum.userStatus.3', status: 'Warning' },
  4: { textId: 'enum.userStatus.4', status: 'Default' },
};
export const USER_STATUS_ORDER: readonly UserStatus[] = [1, 2, 3, 4];

/** 登录结果元数据（2/3 对外统一口径防枚举，细分值仅供审计检索） */
export const LOGIN_LOG_RESULT_META: EnumMeta<LoginLogResult> = {
  1: { textId: 'enum.loginLogResult.1', status: 'Success' },
  2: { textId: 'enum.loginLogResult.2', status: 'Error' },
  3: { textId: 'enum.loginLogResult.3', status: 'Error' },
  4: { textId: 'enum.loginLogResult.4', status: 'Warning' },
  5: { textId: 'enum.loginLogResult.5', status: 'Default' },
};

/** 渠道类型元数据：展示文案 / 标签色 / 配置表单分支 / 凭据语义的唯一数据源 */
export interface NotifyChannelTypeMeta {
  /** 展示文案 i18n 键（表格标签、类型筛选） */
  textId: string;
  /** Tag 颜色 */
  color: string;
  /** 配置表单分支：email / webhook / robot（钉钉/企微/飞书共用 robot） */
  kind: 'email' | 'webhook' | 'robot';
  /** 凭据表单项标签 i18n 键 */
  secretLabelId: string;
  /** 凭据是否必传（email/群机器人必传，webhook 可选） */
  secretRequired: boolean;
  /** 凭据占位 i18n 键 */
  secretPlaceholderId: string;
  /** 是否支持机器人签名密钥 sign_secret（钉钉加签 / 飞书签名校验；只写不读，可选） */
  signSecretSupported: boolean;
}

export const NOTIFY_CHANNEL_TYPE_META: Record<
  NotifyChannelType,
  NotifyChannelTypeMeta
> = {
  NOTIFY_CHANNEL_TYPE_EMAIL: {
    textId: 'enum.channelType.email',
    color: 'blue',
    kind: 'email',
    secretLabelId: 'enum.channelType.email.secretLabel',
    secretRequired: true,
    secretPlaceholderId: 'enum.channelType.email.secretPlaceholder',
    signSecretSupported: false,
  },
  NOTIFY_CHANNEL_TYPE_WEBHOOK: {
    textId: 'enum.channelType.webhook',
    color: 'purple',
    kind: 'webhook',
    secretLabelId: 'enum.channelType.webhook.secretLabel',
    secretRequired: false,
    secretPlaceholderId: 'enum.channelType.webhook.secretPlaceholder',
    signSecretSupported: false,
  },
  NOTIFY_CHANNEL_TYPE_DINGTALK: {
    textId: 'enum.channelType.dingtalk',
    color: 'cyan',
    kind: 'robot',
    secretLabelId: 'enum.channelType.dingtalk.secretLabel',
    secretRequired: true,
    secretPlaceholderId: 'enum.channelType.dingtalk.secretPlaceholder',
    signSecretSupported: true,
  },
  NOTIFY_CHANNEL_TYPE_WECOM: {
    textId: 'enum.channelType.wecom',
    color: 'green',
    kind: 'robot',
    secretLabelId: 'enum.channelType.wecom.secretLabel',
    secretRequired: true,
    secretPlaceholderId: 'enum.channelType.wecom.secretPlaceholder',
    signSecretSupported: false,
  },
  NOTIFY_CHANNEL_TYPE_FEISHU: {
    textId: 'enum.channelType.feishu',
    color: 'orange',
    kind: 'robot',
    secretLabelId: 'enum.channelType.feishu.secretLabel',
    secretRequired: true,
    secretPlaceholderId: 'enum.channelType.feishu.secretPlaceholder',
    signSecretSupported: true,
  },
};

/** Webhook 出站超时缺省值（秒，1-10）；与后端 biz.DefaultWebhookTimeoutS 一致，表单必填并以此预填 */
export const NOTIFY_WEBHOOK_TIMEOUT_DEFAULT_S = 5;

/** 通知严重级元数据：1 info / 2 warning / 3 critical / 4 fatal（事件、路由下限、静默上限共用） */
export const NOTIFY_SEVERITY_META: EnumMeta<NotifySeverity> = {
  1: { textId: 'enum.severity.1', status: 'Default' },
  2: { textId: 'enum.severity.2', status: 'Warning' },
  3: { textId: 'enum.severity.3', status: 'Error' },
  4: { textId: 'enum.severity.4', status: 'Error' },
};

/** 模板渠道维度元数据（小写字符串体系，含 '*' 通配；区别于渠道类型枚举） */
export const NOTIFY_TEMPLATE_CHANNEL_META: Record<
  NotifyTemplateChannelType,
  { textId: string }
> = {
  '*': { textId: 'enum.templateChannel.any' },
  email: { textId: 'enum.templateChannel.email' },
  webhook: { textId: 'enum.templateChannel.webhook' },
  dingtalk: { textId: 'enum.templateChannel.dingtalk' },
  wecom: { textId: 'enum.templateChannel.wecom' },
  feishu: { textId: 'enum.templateChannel.feishu' },
};

/** 可订阅渠道类型（webhook 为系统目标非用户可达，不参与订阅） */
export const NOTIFY_SUBSCRIBABLE_CHANNEL_TYPES = [
  'email',
  'dingtalk',
  'wecom',
  'feishu',
] as const;

/**
 * 事件匹配模式格式（与后端 protovalidate 同式）：'*' 全匹配 / 精确点分串 /
 * 尾部通配（monitor.alert.*）；路由 / 静默 / 订阅 / 来源白名单共用。
 */
export const NOTIFY_EVENT_PATTERN_REGEX =
  /^(\*|[a-z0-9][a-z0-9._-]{0,127}|[a-z0-9][a-z0-9._-]{0,125}\.\*)$/;

/** 事件路由状态元数据：1 received / 2 routed / 3 suppressed / 4 failed */
export const NOTIFY_EVENT_STATUS_META: EnumMeta<NotifyEventStatus> = {
  1: { textId: 'enum.eventStatus.1', status: 'Default' },
  2: { textId: 'enum.eventStatus.2', status: 'Success' },
  3: { textId: 'enum.eventStatus.3', status: 'Warning' },
  4: { textId: 'enum.eventStatus.4', status: 'Error' },
};

/** NATS 发布状态元数据：0 pending / 1 published */
export const NOTIFY_PUBLISH_STATE_META: EnumMeta<NotifyPublishState> = {
  0: { textId: 'enum.publishState.0', status: 'Default' },
  1: { textId: 'enum.publishState.1', status: 'Success' },
};

/** 发送任务状态元数据：1 pending / 2 sending / 3 sent / 4 failed（重试中）/ 5 dead（死信） */
export const NOTIFY_DISPATCH_STATUS_META: EnumMeta<NotifyDispatchStatus> = {
  1: { textId: 'enum.dispatchStatus.1', status: 'Default' },
  2: { textId: 'enum.dispatchStatus.2', status: 'Processing' },
  3: { textId: 'enum.dispatchStatus.3', status: 'Success' },
  4: { textId: 'enum.dispatchStatus.4', status: 'Warning' },
  5: { textId: 'enum.dispatchStatus.5', status: 'Error' },
};

/** 死信重放状态元数据：1 none / 2 pending / 3 replayed */
export const NOTIFY_REPLAY_STATE_META: EnumMeta<NotifyReplayState> = {
  1: { textId: 'enum.replayState.1', status: 'Default' },
  2: { textId: 'enum.replayState.2', status: 'Processing' },
  3: { textId: 'enum.replayState.3', status: 'Success' },
};

/** 事件来源元数据：api（生产者经 ingress）/ internal（core 同事务直插） */
export const NOTIFY_EVENT_SOURCE_META: Record<string, { textId: string }> = {
  api: { textId: 'enum.eventSource.api' },
  internal: { textId: 'enum.eventSource.internal' },
};

/** 通用启停元数据（渠道/路由/模板/静默/订阅/来源列表的状态列共用；键为表单序列化后的字符串） */
export const ENABLED_META: EnumMeta<'true' | 'false'> = {
  true: { textId: 'enum.enabled.true', status: 'Success' },
  false: { textId: 'enum.enabled.false', status: 'Error' },
};

/** 投递结果元数据（投递明细 ok 列） */
export const DELIVERY_OK_META: EnumMeta<'true' | 'false'> = {
  true: { textId: 'enum.deliveryOk.true', status: 'Success' },
  false: { textId: 'enum.deliveryOk.false', status: 'Error' },
};

/** 角色状态元数据与选项顺序（表格筛选 + 新建/编辑表单共用） */
export const ROLE_STATUS_META: EnumMeta<RoleStatus> = {
  1: { textId: 'enum.roleStatus.1', status: 'Success' },
  0: { textId: 'enum.roleStatus.0', status: 'Default' },
};
export const ROLE_STATUS_ORDER: readonly RoleStatus[] = [1, 0];

/** 角色名称最大长度（新建/编辑一致） */
export const ROLE_NAME_MAX = 64;
