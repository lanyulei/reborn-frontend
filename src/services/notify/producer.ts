/**
 * NotifyProducerService 通知生产者管理：一行 = 一个事件生产者（如监控引擎）
 * 的接入凭据。token 明文仅在创建/轮换响应中出现一次，落库只存 SHA-256，
 * 任何读接口不回显。更新语义：spec（名称/白名单/过期时间）整组替换
 * （不传 expire_time 即清除），enabled 独立启停；biz_id 创建后不可改。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type { NotifyProducer } from './typings';

/** ProducerSpecPayload 生产者配置载荷（创建与整组替换更新共用） */
export interface ProducerSpecPayload {
  /** 生产者名称；同 biz 未删除行内唯一，1-64 位 */
  name: string;
  /** 事件类型白名单，空 = 不限（token scope 仍限定 biz）；最多 32 项、不可重复 */
  eventWhitelist?: string[];
  /** 过期时间（RFC3339）；未指定 = 永不过期（整组替换时不传即清除） */
  expireTime?: string;
  /** 每秒接入事件上限，0 = 不限（0-1000000）；管道 ingress 按生产者计数，超限 429 */
  qpsLimit?: number;
  /** 每日（UTC）接入事件上限，0 = 不限（0-1000000000） */
  dailyLimit?: number;
}

export interface ListProducersParams extends PageQuery {
  /** 启用状态过滤 */
  enabled?: boolean;
  /** 业务过滤；biz 受限用户必填（否则 NOTIFY_BIZ_REQUIRED） */
  bizId?: string;
}

/** CreateProducer 创建生产者并签发 token；token 明文仅本次响应返回一次 */
export async function createProducer(body: {
  /** 业务租户标识（token scope），未指定默认 default，创建后不可改；受限用户须在可管范围内 */
  bizId?: string;
  spec: ProducerSpecPayload;
  /** 未指定默认启用 */
  enabled?: boolean;
}): Promise<{ producer: NotifyProducer; token: string }> {
  return authRequest<{ producer: NotifyProducer; token: string }>(
    '/api/v1/notify/producer',
    { method: 'POST', data: body },
  );
}

/** GetProducer 查询生产者详情（不含 token 与哈希） */
export async function getProducer(
  id: string,
): Promise<{ producer: NotifyProducer }> {
  return authRequest<{ producer: NotifyProducer }>(
    `/api/v1/notify/producer/${id}`,
    { method: 'GET' },
  );
}

/** UpdateProducer 更新生产者：spec 与 enabled 至少传其一 */
export async function updateProducer(
  id: string,
  body: { spec?: ProducerSpecPayload; enabled?: boolean },
): Promise<void> {
  await authRequest<void>(`/api/v1/notify/producer/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** RotateProducerToken 轮换 token：旧 token 立即失效（≤10s 生效），新 token 明文仅本次响应返回一次 */
export async function rotateProducerToken(
  id: string,
): Promise<{ producer: NotifyProducer; token: string }> {
  return authRequest<{ producer: NotifyProducer; token: string }>(
    `/api/v1/notify/producer/${id}/token:rotate`,
    { method: 'POST', data: {} },
  );
}

/** DeleteProducer 删除生产者（软删，token 随之作废；名称可复用） */
export async function deleteProducer(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/notify/producer/${id}`, {
    method: 'DELETE',
  });
}

/** ListProducers 分页查询生产者，page_size 上限 100 */
export async function listProducers(
  params: ListProducersParams,
): Promise<PagedResult<NotifyProducer>> {
  return authRequest<PagedResult<NotifyProducer>>('/api/v1/notify/producer', {
    method: 'GET',
    params,
  });
}
