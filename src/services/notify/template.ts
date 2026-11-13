/**
 * NotifyTemplateService 通知模板管理：按 biz × event_type × channel_type 三维
 * 覆盖（'*' 通配），渲染解析链 (biz,event,channel) > (biz,event,*) >
 * (biz,*,channel) > (biz,*,*) > 内置默认模板。subject/body 为 Go template
 * （变量：Title/Payload/Severity/Count/Samples/BizID/EventTime）；更新即 version+1。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { authRequest } from '@/services/system/request';
import type {
  NotifyTemplate,
  NotifyTemplateChannelType,
  NotifyTemplateFormat,
} from './typings';

export interface ListTemplatesParams extends PageQuery {
  /** 事件类型精确过滤（含 '*'） */
  eventType?: string;
  /** 渠道类型精确过滤（含 '*'） */
  channelType?: NotifyTemplateChannelType;
  /** 启用状态过滤 */
  enabled?: boolean;
  /** 业务过滤；biz 受限用户必填（否则 NOTIFY_BIZ_REQUIRED） */
  bizId?: string;
}

export interface CreateTemplateParams {
  /** 业务租户标识，未指定默认 default；受限用户须在可管范围内 */
  bizId?: string;
  /** 事件类型或 '*' */
  eventType: string;
  /** 渠道类型或 '*' 通配 */
  channelType: NotifyTemplateChannelType;
  /** 标题模板（Go template），1-255 位 */
  subject: string;
  /** 正文模板（Go template），1-32768 位 */
  body: string;
  /** 输出格式，缺省 text */
  format?: NotifyTemplateFormat;
  /** 未指定默认启用 */
  enabled?: boolean;
}

/** 可选字段传哪个改哪个，至少传一个；任何更新 version+1 */
export interface UpdateTemplateParams {
  eventType?: string;
  channelType?: NotifyTemplateChannelType;
  subject?: string;
  body?: string;
  format?: NotifyTemplateFormat;
  enabled?: boolean;
}

/** ListTemplates 分页查询模板，page_size 上限 100 */
export async function listTemplates(
  params: ListTemplatesParams,
): Promise<PagedResult<NotifyTemplate>> {
  return authRequest<PagedResult<NotifyTemplate>>('/api/v1/notify/template', {
    method: 'GET',
    params,
  });
}

/** CreateTemplate 创建模板；同 biz 内 (event_type, channel_type) 组合唯一 */
export async function createTemplate(
  body: CreateTemplateParams,
): Promise<{ template: NotifyTemplate }> {
  return authRequest<{ template: NotifyTemplate }>('/api/v1/notify/template', {
    method: 'POST',
    data: body,
  });
}

/** GetTemplate 查询模板详情 */
export async function getTemplate(
  id: string,
): Promise<{ template: NotifyTemplate }> {
  return authRequest<{ template: NotifyTemplate }>(
    `/api/v1/notify/template/${id}`,
    { method: 'GET' },
  );
}

/** UpdateTemplate 部分更新模板；spec 可改但组合仍须唯一，任何更新 version+1 */
export async function updateTemplate(
  id: string,
  body: UpdateTemplateParams,
): Promise<void> {
  await authRequest<void>(`/api/v1/notify/template/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteTemplate 删除模板（软删，三维组合可复用）；历史投递记录不受影响 */
export async function deleteTemplate(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/notify/template/${id}`, { method: 'DELETE' });
}
