/**
 * NotifyChannelService 通知渠道管理：一行渠道 = 一个可独立发送/限流/启停的
 * 端点实例（邮件服务器 / Webhook 目标 / 群机器人）。type 与 config 结构必须
 * 匹配；secret 只写不读（不传=保留旧密文，传新值=轮换）。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type {
  EmailChannelConfig,
  NotifyChannel,
  NotifyChannelType,
  NotifyEvent,
  NotifyRateLimit,
  RobotChannelConfig,
  WebhookChannelConfig,
} from './typings';

export interface ListChannelsParams extends PageQuery {
  /** 渠道类型过滤 */
  type?: NotifyChannelType;
  /** 启用状态过滤 */
  enabled?: boolean;
  /** 业务过滤；biz 受限用户必填（否则 NOTIFY_BIZ_REQUIRED） */
  bizId?: string;
}

export interface CreateChannelParams {
  /** 业务租户标识，未指定默认 default；受限用户须在可管范围内 */
  bizId?: string;
  type: NotifyChannelType;
  name: string;
  /** 与 type 匹配的类型化配置，恰好一种 */
  email?: EmailChannelConfig;
  webhook?: WebhookChannelConfig;
  robot?: RobotChannelConfig;
  /** 未指定默认不限（qps=0/burst=0） */
  rateLimit?: NotifyRateLimit;
  /** 未指定默认启用 */
  enabled?: boolean;
  /** 渠道凭据明文（AES-256-GCM 加密落库，任何响应不返回）；email/群机器人必传，webhook 可选，1-512 位 */
  secret?: string;
  /** 机器人签名密钥（钉钉加签 / 飞书签名校验），可选、只写不读；仅 dingtalk/feishu 接受，1-512 位 */
  signSecret?: string;
}

export interface UpdateChannelParams {
  /** 可选字段传哪个改哪个，至少传一个；config 按类型整体替换（不可部分更新） */
  name?: string;
  email?: EmailChannelConfig;
  webhook?: WebhookChannelConfig;
  robot?: RobotChannelConfig;
  rateLimit?: NotifyRateLimit;
  enabled?: boolean;
  /** 不传=保留旧密文，传新值=轮换（旧凭据即刻作废） */
  secret?: string;
  /** 机器人签名密钥：不传 = 保留；传非空 = 轮换；传空串 = 清除（停用签名） */
  signSecret?: string;
}

/** ListChannels 分页查询渠道，page_size 上限 100 */
export async function listChannels(
  params: ListChannelsParams,
): Promise<PagedResult<NotifyChannel>> {
  return authRequest<PagedResult<NotifyChannel>>('/api/v1/notify/channel', {
    method: 'GET',
    params,
  });
}

/** CreateChannel 创建渠道；type 与 config 结构必须匹配 */
export async function createChannel(
  body: CreateChannelParams,
): Promise<{ channel: NotifyChannel }> {
  return authRequest<{ channel: NotifyChannel }>('/api/v1/notify/channel', {
    method: 'POST',
    data: body,
  });
}

/** GetChannel 查询渠道详情（不含 secret） */
export async function getChannel(
  id: string,
): Promise<{ channel: NotifyChannel }> {
  return authRequest<{ channel: NotifyChannel }>(
    `/api/v1/notify/channel/${id}`,
    { method: 'GET' },
  );
}

/** UpdateChannel 部分更新渠道；type 创建后不可改（换适配器须新建渠道） */
export async function updateChannel(
  id: string,
  body: UpdateChannelParams,
): Promise<void> {
  await authRequest<void>(`/api/v1/notify/channel/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteChannel 删除渠道（软删，名称可复用）；历史投递记录不受影响 */
export async function deleteChannel(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/notify/channel/${id}`, { method: 'DELETE' });
}

/** SendTestEventParams 发送测试事件请求（可选项均有缺省值） */
export interface SendTestEventParams {
  /** 测试事件类型，缺省 notify.test（需有路由 event_pattern 覆盖且 channel_ids 含目标实例才会实际投递） */
  eventType?: string;
  /** 测试事件标题，缺省「通知渠道连通性测试」 */
  title?: string;
  /** 显式测试收件列表；空 = 交路由解析（与生产事件同链路） */
  recipients?: string[];
  /** 附加测试载荷（合并进事件 payload 的 test 上下文） */
  payload?: Record<string, unknown>;
}

/** SendTestEvent 按渠道实例发送测试事件：走与生产事件完全相同的链路（路由 → 模板 → 发送），
 * 投递结果异步可查（经返回的 event.id 在事件/发送任务/投递明细页跟踪）；渠道须启用 */
export async function sendTestEvent(
  id: string,
  body: SendTestEventParams = {},
): Promise<{ event: NotifyEvent }> {
  return authRequest<{ event: NotifyEvent }>(
    `/api/v1/notify/channel/${id}:test`,
    { method: 'POST', data: body },
  );
}
