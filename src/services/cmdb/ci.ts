/**
 * CmdbCIService 资源：列表 / 详情 / 创建 / 更新（乐观锁）/ 状态流转 / 删除 / 历史。
 */
import { message } from 'antd';
import { authRequest, getErrorMessage } from '@/services/system/request';
import type { PagedResult } from '@/services/system/typings';
import type {
  CmdbCI,
  CmdbHistory,
  CmdbDirection,
  CmdbCIStatus,
  CmdbRelationSummary,
} from './typings';

export interface ListCIsParams {
  page?: number;
  pageSize?: number;
  modelCode?: string;
  keyword?: string;
  status?: CmdbCIStatus;
  env?: string;
  tag?: string;
  /** 属性等值过滤（键为字段编码） */
  attrs?: Record<string, unknown>;
  /** 关联条件：关系类型 + 方向；relTargetId 指定对端，relNone 为真 = 无该关联 */
  relType?: string;
  relDirection?: CmdbDirection;
  relTargetId?: string;
  relNone?: boolean;
  /** 游标分页（上一页 nextCursor）；提供时忽略 page */
  cursor?: string;
}

export async function listCIs(
  params: ListCIsParams,
): Promise<PagedResult<CmdbCI>> {
  const { attrs, ...rest } = params;
  // attrs 等值过滤按 attrs.<code>=<value> 展开为 query（kratos form 解码支持点路径）
  const flat: Record<string, unknown> = { ...rest };
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      flat[`attrs.${key}`] = value;
    }
  }
  return authRequest<PagedResult<CmdbCI>>('/api/v1/cmdb/ci', {
    method: 'GET',
    params: flat,
  });
}

export interface CIDetail {
  ci: CmdbCI;
  relations: CmdbRelationSummary[];
}

export async function getCI(id: string): Promise<CIDetail> {
  return authRequest<CIDetail>(`/api/v1/cmdb/ci/${id}`, { method: 'GET' });
}

export interface CreateCIParams {
  modelCode: string;
  name: string;
  status?: Exclude<CmdbCIStatus, 'retired'>;
  env?: string;
  owner?: string;
  tags?: string[];
  externalId?: string;
  attrs?: Record<string, unknown>;
}

export async function createCI(body: CreateCIParams): Promise<{ ci: CmdbCI }> {
  return authRequest<{ ci: CmdbCI }>('/api/v1/cmdb/ci', {
    method: 'POST',
    data: body,
  });
}

export interface UpdateCIParams {
  version: string;
  name?: string;
  env?: string;
  owner?: string;
  /** 整组替换；不传不改 */
  tags?: { items: string[] };
  externalId?: string;
  /** 按键合并，null 清空 */
  attrs?: Record<string, unknown>;
}

export async function updateCI(
  id: string,
  body: UpdateCIParams,
): Promise<{ ci: CmdbCI }> {
  return authRequest<{ ci: CmdbCI }>(`/api/v1/cmdb/ci/${id}`, {
    method: 'PUT',
    data: body,
  });
}

export async function transitionCI(
  id: string,
  version: string,
  status: CmdbCIStatus,
  /** silent：批量操作逐条失败不各弹一次，由调用方汇总提示 */
  options?: { silent?: boolean },
): Promise<{ ci: CmdbCI }> {
  return authRequest<{ ci: CmdbCI }>(`/api/v1/cmdb/ci/${id}:transition`, {
    method: 'POST',
    data: { version, status },
    silent: options?.silent,
  });
}

export async function deleteCI(
  id: string,
  options?: { silent?: boolean },
): Promise<void> {
  await authRequest<Record<string, never>>(`/api/v1/cmdb/ci/${id}`, {
    method: 'DELETE',
    silent: options?.silent,
  });
}

export interface ImportRelation {
  relationType: string;
  direction: CmdbDirection;
  /** 关系端为通配时必填 */
  targetModel?: string;
  targetName: string;
}

export interface ImportRow {
  name: string;
  status?: Exclude<CmdbCIStatus, 'retired'>;
  env?: string;
  owner?: string;
  tags?: string[];
  externalId?: string;
  attrs?: Record<string, unknown>;
  relations?: ImportRelation[];
}

export type ImportAction = 'create' | 'update' | 'skip' | 'error';

export interface ImportRowResult {
  row: number;
  name: string;
  action: ImportAction;
  message?: string;
  ciId?: string;
}

export interface ImportResult {
  dryRun: boolean;
  created?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  results: ImportRowResult[];
}

/** ImportCIs 按名称 upsert；dryRun 只校验预览 */
export async function importCIs(
  modelCode: string,
  rows: ImportRow[],
  dryRun: boolean,
): Promise<ImportResult> {
  return authRequest<ImportResult>('/api/v1/cmdb/ci:import', {
    method: 'POST',
    data: { modelCode, dryRun, rows },
  });
}

/** ExportCIs 下载 CSV（最多 10000 行） */
export async function exportCIs(
  params: Pick<
    ListCIsParams,
    | 'keyword'
    | 'status'
    | 'env'
    | 'tag'
    | 'attrs'
    | 'relType'
    | 'relDirection'
    | 'relTargetId'
    | 'relNone'
  > & {
    modelCode: string;
    /** csv（缺省）/ json */
    format?: 'csv' | 'json';
  },
): Promise<Blob> {
  const { attrs, ...rest } = params;
  // 与 listCIs 相同：attrs 等值过滤展开为 attrs.<code>=<value>
  const flat: Record<string, unknown> = { ...rest };
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      flat[`attrs.${key}`] = value;
    }
  }
  try {
    return await authRequest<Blob>('/api/v1/cmdb/ci:export', {
      method: 'GET',
      params: flat,
      responseType: 'blob',
      silent: true,
    });
  } catch (error) {
    // responseType=blob 时错误体也是 Blob：解析出后端 message 再提示
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    let text = '';
    if (data instanceof Blob) {
      try {
        text = (JSON.parse(await data.text()) as { message?: string }).message ?? '';
      } catch {
        // 非 JSON 错误体：用通用文案
      }
    }
    message.error(text || getErrorMessage(error));
    throw error;
  }
}

export async function listCIHistory(
  id: string,
  params: { page?: number; pageSize?: number },
): Promise<PagedResult<CmdbHistory>> {
  return authRequest<PagedResult<CmdbHistory>>(
    `/api/v1/cmdb/ci/${id}/history`,
    { method: 'GET', params },
  );
}

/** 全局搜索命中 */
export interface SearchHit {
  ci: CmdbCI;
  /** name / externalId / tags / 属性字段编码 */
  matchedField: string;
  matchedValue: string;
}

/** SearchCIs 全局搜索：名称 / 外部标识 / 标签 / 属性值子串匹配（受数据范围约束） */
export async function searchCIs(
  q: string,
  limit = 20,
): Promise<{ items: SearchHit[] }> {
  return authRequest<{ items: SearchHit[] }>('/api/v1/cmdb/ci:search', {
    method: 'GET',
    params: { q, limit },
  });
}

export interface ListHistoryParams {
  page?: number;
  pageSize?: number;
  modelCode?: string;
  action?: CmdbHistory['action'];
  operator?: string;
  keyword?: string;
  /** RFC3339 */
  from?: string;
  to?: string;
}

/** ListHistory 全局变更审计（受数据范围约束） */
export async function listHistory(
  params: ListHistoryParams,
): Promise<PagedResult<CmdbHistory>> {
  return authRequest<PagedResult<CmdbHistory>>('/api/v1/cmdb/history', {
    method: 'GET',
    params,
  });
}
