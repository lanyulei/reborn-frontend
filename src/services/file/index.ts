/**
 * FileService 通用附件：上传得到文件 ID（业务提交时由业务接口绑定）、查询元数据、下载。
 * 上传 / 下载须登录；未绑定的临时文件仅上传者本人可读，已绑定文件按所属业务对象的权限判定。
 */
import { authRequest } from '@/services/system/request';

/** 单文件上限（与后端 proto 校验一致） */
export const FILE_MAX_SIZE = 5 * 1024 * 1024;

/** File 文件元数据（size 为 int64 字符串） */
export interface FileMeta {
  id: string;
  filename: string;
  size: string;
  mime: string;
  createUser?: string;
  createTime?: string;
}

/** 文件内容 → Base64（分块转换，避免大文件展开实参时栈溢出） */
async function toBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** UploadFile 上传一个文件（≤5MiB）；类型由后端按内容判定 */
export async function uploadFile(file: File): Promise<{ file: FileMeta }> {
  return authRequest<{ file: FileMeta }>('/api/v1/file', {
    method: 'POST',
    data: { filename: file.name, data: await toBase64(file) },
  });
}

/** GetFile 查询文件元数据 */
export async function getFile(id: string): Promise<{ file: FileMeta }> {
  return authRequest<{ file: FileMeta }>(`/api/v1/file/${id}`, {
    method: 'GET',
  });
}

/** DownloadFile 下载文件内容（携带登录态取回二进制，由调用方触发浏览器保存） */
export async function downloadFile(id: string): Promise<Blob> {
  return authRequest<Blob>(`/api/v1/file/${id}/content`, {
    method: 'GET',
    responseType: 'blob',
  });
}
