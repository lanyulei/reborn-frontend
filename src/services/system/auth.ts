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
  /** 可管理的通知 biz 并集（字典序）；bizUnrestricted=true 时为空 */
  bizScope?: string[];
  /** 通知 biz 不受限（超管或任一启用角色 scope 为空）；受限用户列表查询须带 biz 过滤 */
  bizUnrestricted?: boolean;
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
export async function getLoginProfile(options?: {
  /** silent：启动时由 getInitialState 自行处理失败（跳登录 / 重试页），不弹提示 */
  silent?: boolean;
}): Promise<LoginProfile> {
  return authRequest<LoginProfile>('/api/v1/me', {
    method: 'GET',
    silent: options?.silent,
  });
}

/**
 * UploadMyAvatar 上传当前登录用户头像（自助接口）；文件转 base64 走 protojson
 * bytes 契约，返回带内容指纹的访问地址（已写入用户 avatar 字段）。
 */
export async function uploadMyAvatar(file: File): Promise<{ url: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return authRequest<{ url: string }>('/api/v1/me/avatar', {
    method: 'POST',
    data: { data: b64, mime },
  });
}
