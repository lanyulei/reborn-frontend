/**
 * WorkflowConfigService 流程引擎的配置：工作日历、个人代理设置、自动任务可调用的 Webhook 端点。
 */
import { authRequest } from '@/services/system/request';
import type {
  WorkCalendar,
  WorkflowDelegation,
  WorkflowWebhook,
} from './typings';

const BASE = '/api/v1/workflow';

/** GetCalendar 工作日历（protojson 省略空列表，这里补齐） */
export async function getCalendar(): Promise<WorkCalendar> {
  const { calendar } = await authRequest<{ calendar?: Partial<WorkCalendar> }>(
    `${BASE}/calendar`,
    { method: 'GET' },
  );
  return {
    timezone: calendar?.timezone ?? '',
    weekdays: calendar?.weekdays ?? [],
    segments: calendar?.segments ?? [],
    holidays: calendar?.holidays ?? [],
    workdays: calendar?.workdays ?? [],
  };
}

/** UpdateCalendar 整组更新工作日历；只影响此后新算出的时限 */
export async function updateCalendar(calendar: WorkCalendar): Promise<void> {
  await authRequest<void>(`${BASE}/calendar`, {
    method: 'PUT',
    data: { calendar },
  });
}

/** ListMyDelegations 我的代理设置（开始时间倒序） */
export async function listMyDelegations(): Promise<WorkflowDelegation[]> {
  const { items } = await authRequest<{ items?: WorkflowDelegation[] }>(
    `${BASE}/delegation`,
    { method: 'GET' },
  );
  return items ?? [];
}

/** CreateDelegation 新增一条我的代理设置 */
export async function createDelegation(body: {
  delegateId: string;
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<void> {
  await authRequest<void>(`${BASE}/delegation`, { method: 'POST', data: body });
}

/** DeleteDelegation 删除我的一条代理设置（已交给代理人的待办不受影响） */
export async function deleteDelegation(id: string): Promise<void> {
  await authRequest<void>(`${BASE}/delegation/${id}`, { method: 'DELETE' });
}

/** ListWebhooks 全部 Webhook 端点（不含签名密钥）；status 为 0（停用）时响应里不出现，这里补齐 */
export async function listWebhooks(options?: {
  silent?: boolean;
}): Promise<WorkflowWebhook[]> {
  const { items } = await authRequest<{ items?: Partial<WorkflowWebhook>[] }>(
    `${BASE}/webhook`,
    { method: 'GET', silent: options?.silent },
  );
  return (items ?? []).map(
    (w) =>
      ({
        ...w,
        status: w.status ?? 0,
        hasSecret: !!w.hasSecret,
      }) as WorkflowWebhook,
  );
}

export interface WebhookSpec {
  name: string;
  url: string;
  description: string;
  status: 0 | 1;
  /** 创建时不传 = 不签名；更新时不传 = 保留原密钥，传空串 = 清除 */
  secret?: string;
}

/** CreateWebhook 创建端点 */
export async function createWebhook(spec: WebhookSpec): Promise<void> {
  await authRequest<void>(`${BASE}/webhook`, { method: 'POST', data: { spec } });
}

/** UpdateWebhook 整组更新端点 */
export async function updateWebhook(
  id: string,
  spec: WebhookSpec,
): Promise<void> {
  await authRequest<void>(`${BASE}/webhook/${id}`, {
    method: 'PUT',
    data: { spec },
  });
}

/** DeleteWebhook 删除端点；仍被已发布的流程引用时后端拒绝 */
export async function deleteWebhook(id: string): Promise<void> {
  await authRequest<void>(`${BASE}/webhook/${id}`, { method: 'DELETE' });
}

/** 接入凭据（不含令牌）：外部系统凭它的令牌调用流程引擎的开放接口 */
export interface WorkflowClient {
  id: string;
  name: string;
  /** 令牌开头几位（辨认用） */
  tokenPrefix: string;
  /** 代表用户：该系统发起的流程以他为发起人 */
  actingUserId: string;
  actingUserName?: string;
  /** 允许发起的流程标识 */
  definitionKeys: string[];
  /** 1=启用 0=停用 */
  status: 0 | 1;
  description?: string;
  lastUsedTime?: string;
  updateTime?: string;
}

export interface ClientSpec {
  name: string;
  actingUserId: string;
  definitionKeys: string[];
  status: 0 | 1;
  description: string;
}

/** ListClients 全部接入凭据；status 为 0、列表为空时响应里不出现，这里补齐 */
export async function listClients(): Promise<WorkflowClient[]> {
  const { items } = await authRequest<{ items?: Partial<WorkflowClient>[] }>(
    `${BASE}/client`,
    { method: 'GET' },
  );
  return (items ?? []).map(
    (item) =>
      ({
        ...item,
        status: item.status ?? 0,
        definitionKeys: item.definitionKeys ?? [],
      }) as WorkflowClient,
  );
}

/** CreateClient 创建接入凭据；令牌明文只在这次响应里出现 */
export async function createClient(
  spec: ClientSpec,
): Promise<{ client: WorkflowClient; token: string }> {
  return authRequest(`${BASE}/client`, { method: 'POST', data: { spec } });
}

/** UpdateClient 整组更新接入凭据（不改令牌） */
export async function updateClient(
  id: string,
  spec: ClientSpec,
): Promise<void> {
  await authRequest<void>(`${BASE}/client/${id}`, {
    method: 'PUT',
    data: { spec },
  });
}

/** RotateClientToken 重置令牌：旧令牌立即失效，新令牌明文只在这次响应里出现 */
export async function rotateClientToken(
  id: string,
): Promise<{ token: string }> {
  return authRequest(`${BASE}/client/${id}/token`, {
    method: 'POST',
    data: {},
  });
}

/** DeleteClient 删除接入凭据：令牌立即失效 */
export async function deleteClient(id: string): Promise<void> {
  await authRequest<void>(`${BASE}/client/${id}`, { method: 'DELETE' });
}
