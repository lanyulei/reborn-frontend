/**
 * 带 401 自动刷新的请求包装器。
 * access token 过期（401）时用 refresh token 换发新双令牌并重试一次；
 * 刷新失败或重试仍 401 则清空令牌并跳转登录页。
 */
import type { RequestOptions } from '@@/plugin-request/request';
import { request } from '@umijs/max';
import { message } from 'antd';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getTokenExpiresAt,
  setTokens,
} from '@/utils/auth';
import { t } from '@/utils/i18n';

interface AuthRequestOptions extends RequestOptions {
  /** 内部标记：已重试过，避免循环 */
  retried?: boolean;
  /**
   * 静默：失败不弹全局错误提示，由调用方自行降级（如无权限的辅助性查询）。
   * 401 的刷新 / 跳转登录逻辑不受影响。
   */
  silent?: boolean;
}

/**
 * 提取后端 Kratos Status{code,reason,message} 错误信息。
 * umi request 基于 axios：非 2xx 错误体挂在 error.response.data
 * （error.data 不存在，error.message 是 axios 通用文案，仅作网络错误兜底）。
 */
export function getErrorMessage(error: unknown, fallback = t('app.request.retry')): string {
  const err = error as
    | {
        response?: { data?: { message?: string } };
        data?: { message?: string };
        message?: string;
      }
    | undefined;
  return (
    err?.response?.data?.message || err?.data?.message || err?.message || fallback
  );
}

/**
 * 刷新结果：ok 已持有新令牌；invalid 刷新令牌确已失效（需重新登录）；
 * error 网络 / 服务端暂时性故障（令牌可能仍有效，不应登出）。
 */
type RefreshResult = 'ok' | 'invalid' | 'error';

/** 刷新令牌单飞：并发 401 只触发一次刷新 */
let refreshPromise: Promise<RefreshResult> | null = null;

async function doRefresh(): Promise<RefreshResult> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return 'invalid';
  try {
    const result = await request<{
      accessToken: string;
      expiresIn: string;
      refreshToken: string;
    }>('/api/v1/token/refresh', {
      method: 'POST',
      data: { refreshToken },
      skipErrorHandler: true,
    });
    setTokens(result.accessToken, result.refreshToken, result.expiresIn);
    return 'ok';
  } catch (error) {
    // 另一个标签页已先一步轮换了令牌：本地存储里已是新令牌，直接沿用
    const current = getRefreshToken();
    if (current && current !== refreshToken) return 'ok';
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    // 仅 4xx（令牌无效 / 已吊销）视为需要重新登录；网络错误与 5xx 保留令牌
    return status !== undefined && status >= 400 && status < 500
      ? 'invalid'
      : 'error';
  }
}

function refreshOnce(): Promise<RefreshResult> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export function redirectToLogin(): void {
  clearTokens();
  const { pathname, search, hash } = window.location;
  if (pathname !== '/user/login') {
    const redirect = encodeURIComponent(pathname + search + hash);
    window.location.href = `/user/login?redirect=${redirect}`;
  }
}

/** 距过期小于该阈值即预刷新（流式长连接无法在中途换令牌） */
const REFRESH_AHEAD_MS = 60_000;

/**
 * 保证 access token 在近期内有效：临近过期则用 refresh token 单飞换发。
 * 返回是否持有可用令牌；流式请求（SSE）在发起前调用，普通请求仍走 authRequest 的 401 重试。
 */
export async function ensureFreshToken(): Promise<boolean> {
  const expiresAt = getTokenExpiresAt();
  const fresh =
    getAccessToken() !== null &&
    (expiresAt === null || expiresAt - Date.now() > REFRESH_AHEAD_MS);
  if (fresh) return true;
  const result = await refreshOnce();
  // 暂时性故障不视为未登录：仍持有令牌就继续（真过期由调用方的 401 分支处理）
  return result === 'ok' || (result === 'error' && getAccessToken() !== null);
}

export async function authRequest<T>(
  url: string,
  options: AuthRequestOptions = {},
): Promise<T> {
  const { retried, silent, ...rest } = options;
  try {
    return await request<T>(url, { ...rest, skipErrorHandler: true });
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 401) {
      if (retried) {
        redirectToLogin();
        throw error;
      }
      const refreshed = await refreshOnce();
      if (refreshed === 'ok') {
        return authRequest<T>(url, { ...options, retried: true });
      }
      if (refreshed === 'invalid') {
        redirectToLogin();
        throw error;
      }
      // 刷新遇到暂时性故障：不登出，按普通失败提示
      if (!silent) message.error(t('app.request.retry'));
      throw error;
    }
    if (!silent) message.error(getErrorMessage(error));
    throw error;
  }
}
