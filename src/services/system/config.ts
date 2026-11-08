/**
 * SystemConfigService 系统配置：全局展示配置（标题/子标题/logo/页脚）读写
 */
import type { SystemConfig } from './typings';
import { authRequest } from './request';

/** GetSystemConfig 查询系统配置（匿名可读：登录页登录前拉取标题/logo） */
export async function getSystemConfig(): Promise<{ config: SystemConfig }> {
  return authRequest<{ config: SystemConfig }>('/api/v1/system/config', {
    method: 'GET',
  });
}

/** UpdateSystemConfig 全量覆盖系统配置（空串字段表示清空该项） */
export async function updateSystemConfig(
  data: SystemConfig,
): Promise<Record<string, never>> {
  return authRequest<Record<string, never>>('/api/v1/system/config', {
    method: 'PUT',
    data,
  });
}

/** Logo 上传大小上限（2MB，与后端 proto 校验一致） */
export const LOGO_MAX_SIZE = 2 * 1024 * 1024;

/** Logo 允许的 MIME 白名单（与后端 proto 校验一致） */
export const LOGO_MIME_WHITELIST = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
  'image/x-icon',
];

/**
 * UploadSystemLogo 上传本地 logo 图片（覆盖式单文件），返回带内容指纹
 * 的 URL；调用方将其填入表单 logo 字段随保存落库。
 * 文件转 base64 走 protojson bytes 契约。
 */
export async function uploadSystemLogo(file: File): Promise<{ url: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  // data:image/png;base64,xxxx → mime + base64 两段
  const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return authRequest<{ url: string }>('/api/v1/system/config/logo', {
    method: 'POST',
    data: { data: b64, mime },
  });
}
