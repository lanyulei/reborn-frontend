/**
 * 双令牌存取（localStorage）
 * access token 短效走 Authorization 头；refresh token 仅用于 /api/v1/token/refresh。
 */

const ACCESS_TOKEN_KEY = 'monitor_access_token';
const REFRESH_TOKEN_KEY = 'monitor_refresh_token';
const EXPIRES_AT_KEY = 'monitor_token_expires_at';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** access token 过期时间戳（毫秒）；未知返回 null */
export function getTokenExpiresAt(): number | null {
  const raw = localStorage.getItem(EXPIRES_AT_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: string | number,
): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(
    EXPIRES_AT_KEY,
    String(Date.now() + Number(expiresIn) * 1000),
  );
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}
