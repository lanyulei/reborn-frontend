/**
 * 带 401 自动刷新的请求包装器。
 * access token 过期（401）时用 refresh token 换发新双令牌并重试一次；
 * 刷新失败或重试仍 401 则清空令牌并跳转登录页。
 */
import type { RequestOptions } from '@@/plugin-request/request';
import { request } from '@umijs/max';
import { message } from '@/utils/feedback';
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
  /**
   * 刷新令牌确已失效时是否整页跳转登录页（默认 true）。
   * 启动期 getInitialState 拉 /me 自己 history.replace 到登录页，传 false 避免双重跳转。
   */
  redirectOnInvalid?: boolean;
}

/**
 * 提取后端 Kratos Status{code,reason,message} 错误信息。
 * umi request 基于 axios：非 2xx 错误体挂在 error.response.data
 * （error.data 不存在）。HTTP 错误体没有 message 时用本地化兜底文案；
 * error.message 是 axios 通用英文文案，只在网络错误等没有响应时才用。
 */
export function getErrorMessage(
  error: unknown,
  fallback = t('app.request.retry'),
): string {
  const err = error as
    | {
        response?: { data?: { message?: string } };
        data?: { message?: string };
        message?: string;
      }
    | undefined;
  const body = err?.response?.data?.message || err?.data?.message;
  if (body) return body;
  return err?.response ? fallback : err?.message || fallback;
}

/**
 * 刷新结果：ok 已持有新令牌；invalid 刷新令牌确已失效（需重新登录）；
 * error 网络 / 服务端暂时性故障（令牌可能仍有效，不应登出）。
 */
type RefreshResult = 'ok' | 'invalid' | 'error';

/** 刷新令牌单飞：并发 401 只触发一次刷新 */
let refreshPromise: Promise<RefreshResult> | null = null;

/** 刷新被 4xx 拒绝后，等另一标签页的新令牌写入 localStorage 落定再复查 */
const ROTATION_SETTLE_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 另一标签页已先一步轮换了令牌：本地存储里已不是我们用过的那把 */
const rotatedElsewhere = (used: string): boolean => {
  const current = getRefreshToken();
  return current !== null && current !== used;
};

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
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    // 网络错误与 5xx 保留令牌
    if (status === undefined || status < 400 || status >= 500) return 'error';
    // 4xx：令牌无效 / 已吊销——也可能是另一标签页刚用同一把刷新令牌换发成功（旧令牌随即作废）。
    // 稍等它把新令牌写进 localStorage，存储里已换成新令牌则直接沿用，否则才视为需要重新登录。
    if (rotatedElsewhere(refreshToken)) return 'ok';
    await sleep(ROTATION_SETTLE_MS);
    return rotatedElsewhere(refreshToken) ? 'ok' : 'invalid';
  }
}

/**
 * 跨标签页互斥：支持 Web Locks 时同源各标签页排队刷新，拿到锁后先复查令牌——
 * 排队期间别的标签页已换发过就直接沿用，不再拿旧令牌去撞接口。不支持时退化为单标签页单飞。
 */
function refreshWithLock(): Promise<RefreshResult> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return doRefresh();
  const before = getRefreshToken();
  return locks.request('token-refresh', () =>
    before !== null && rotatedElsewhere(before) ? 'ok' : doRefresh(),
  ) as Promise<RefreshResult>;
}

function refreshOnce(): Promise<RefreshResult> {
  refreshPromise ??= refreshWithLock().finally(() => {
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
  const { retried, silent, redirectOnInvalid = true, ...rest } = options;
  // 记下本次请求带的 access token：请求在途期间别处（其他请求的刷新 / 其他标签页）
  // 可能已换发新令牌，这时的 401 只需用新令牌重试，不必再刷新一次
  const usedToken = getAccessToken();
  try {
    return await request<T>(url, { ...rest, skipErrorHandler: true });
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 401) {
      if (retried) {
        if (redirectOnInvalid) redirectToLogin();
        throw error;
      }
      const currentToken = getAccessToken();
      if (currentToken !== null && currentToken !== usedToken) {
        return authRequest<T>(url, { ...options, retried: true });
      }
      const refreshed = await refreshOnce();
      if (refreshed === 'ok') {
        return authRequest<T>(url, { ...options, retried: true });
      }
      if (refreshed === 'invalid') {
        if (redirectOnInvalid) redirectToLogin();
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
