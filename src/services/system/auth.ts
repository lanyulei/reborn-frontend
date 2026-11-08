/**
 * AuthService 认证服务：登录 / 登出 / 当前登录者 / 刷新令牌
 * 接口契约见 backend/core/api/openapi.swagger.json
 */
import { request } from '@umijs/max';
import type { SystemRole, SystemUser } from './typings';
import { authRequest } from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  /** 秒，int64 字符串 */
  expiresIn: string;
  refreshToken: string;
}

export interface LoginResult extends TokenPair {
  user: SystemUser;
}

export interface LoginProfile {
  user: SystemUser;
  roles: SystemRole[];
  /** 有效接口操作 code 并集（32 位 md5 hex）；isAdmin 用户由前端直接放行，可为空 */
  permissions?: string[];
  /** 有效菜单（页面）码并集（仅启用角色），菜单可见性判定用 */
  menus?: string[];
  /** 有效页面元素码并集（仅启用角色），页面内按钮/操作显隐用 */
  elements?: string[];
}

/** Login 登录：校验用户名密码，签发 access + refresh 双令牌 */
export async function login(body: LoginParams): Promise<LoginResult> {
  return request<LoginResult>('/api/v1/login', {
    method: 'POST',
    data: body,
    skipErrorHandler: true,
  });
}

/** Logout 登出：吊销当前用户全部刷新令牌（身份取自 Bearer token） */
export async function logout(): Promise<void> {
  await request<void>('/api/v1/logout', {
    method: 'POST',
    skipErrorHandler: true,
  });
}

/** GetLoginProfile 查询当前登录用户信息与角色 */
export async function getLoginProfile(): Promise<LoginProfile> {
  return authRequest<LoginProfile>('/api/v1/me', { method: 'GET' });
}
