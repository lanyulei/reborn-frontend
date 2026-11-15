/**
 * OncallShareService 公共值班日历地址：免登录的只读日历。
 * 令牌在库内加密保存：有管理权的人可随时再次查看地址（getShareLinkToken）。
 */
import { request } from '@umijs/max';
import { authRequest } from '@/services/system/request';
import type {
  OncallPublicCalendar,
  OncallScopeType,
  OncallShareLink,
} from './typings';

/** ListShareLinks 查询某个范围下的公共地址（不含令牌）；个人范围忽略 scopeId */
export async function listShareLinks(params: {
  scopeType: OncallScopeType;
  scopeId?: string;
}): Promise<{ items?: OncallShareLink[] }> {
  return authRequest<{ items?: OncallShareLink[] }>(
    '/api/v1/oncall/share-link',
    { method: 'GET', params },
  );
}

/** CreateShareLink 新建公共地址，返回访问令牌 */
export async function createShareLink(body: {
  scopeType: OncallScopeType;
  scopeId?: string;
  name: string;
  showPhone?: boolean;
  /** 过期时间 RFC3339；不传为长期有效 */
  expireTime?: string;
}): Promise<{ link: OncallShareLink; token: string }> {
  return authRequest<{ link: OncallShareLink; token: string }>(
    '/api/v1/oncall/share-link',
    { method: 'POST', data: body },
  );
}

/** GetShareLinkToken 再次查看访问令牌（须有该地址的管理权） */
export async function getShareLinkToken(id: string): Promise<{ token: string }> {
  return authRequest<{ token: string }>(
    `/api/v1/oncall/share-link/${id}/token`,
    { method: 'GET' },
  );
}

/** ResetShareLink 重置令牌：旧地址立即失效，返回新令牌 */
export async function resetShareLink(id: string): Promise<{ token: string }> {
  return authRequest<{ token: string }>(
    `/api/v1/oncall/share-link/${id}/reset`,
    { method: 'POST', data: {} },
  );
}

/** DeleteShareLink 作废公共地址 */
export async function deleteShareLink(id: string): Promise<void> {
  await authRequest<void>(`/api/v1/oncall/share-link/${id}`, {
    method: 'DELETE',
  });
}

/** 公共日历网页链接 */
export const publicCalendarUrl = (token: string) =>
  `${window.location.origin}/public/oncall/${token}`;

/**
 * GetPublicCalendar 免登录读取日历数据（范围不超过 62 天）。
 * 匿名接口：不走 authRequest（不触发 401 刷新 / 跳转登录）；
 * 无效、过期、作废统一 404，由页面展示。
 */
export async function getPublicCalendar(
  token: string,
  params: { startTime: string; endTime: string },
): Promise<OncallPublicCalendar> {
  return request<OncallPublicCalendar>(`/api/v1/oncall/public/${token}`, {
    method: 'GET',
    params,
    skipErrorHandler: true,
  });
}
