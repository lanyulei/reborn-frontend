/**
 * CmdbInsightService 资源目录与运营视角：模型分组 / 模型收藏 / 运营概览 / 模型变更审计。
 *
 * 读取类接口（分组、收藏、概览）用于页面增强，调用方按"可降级"处理：存量角色在
 * 重新保存授权前可能没有这些接口的权限（403），此时不应弹错误提示，而是回退到
 * 不含该能力的展示。因此读取走 quietGet（失败静默抛出，由调用方 catch 降级）；
 * 写入与审计列表仍走 authRequest（失败按后端 message 提示）。
 */
import { request } from '@umijs/max';
import { authRequest, ensureFreshToken } from '@/services/system/request';
import type { PagedResult } from '@/services/system/typings';
import type {
  CmdbModelGroup,
  CmdbOverview,
  CmdbQualityRow,
  CmdbSchemaAction,
  CmdbSchemaAudit,
  CmdbSchemaTargetType,
} from './typings';

/**
 * 静默 GET：不触发全局错误提示（令牌由请求拦截器附加）；失败抛出供调用方降级。
 * 令牌过期（401）时先单飞刷新再重试一次，避免把"需要刷新"误判为"无权限"。
 */
async function quietGet<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const run = () =>
    request<T>(url, { method: 'GET', params, skipErrorHandler: true });
  try {
    return await run();
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 401 && (await ensureFreshToken())) return run();
    throw error;
  }
}

/** ListModelGroups 全部模型分组（按顺序）；无权限时抛出，调用方回退为按模型推导 */
export async function listModelGroups(): Promise<{ items: CmdbModelGroup[] }> {
  return quietGet<{ items: CmdbModelGroup[] }>('/api/v1/cmdb/model-group');
}

export async function createModelGroup(body: {
  code: string;
  name: string;
  sort?: number;
}): Promise<{ group: CmdbModelGroup }> {
  return authRequest<{ group: CmdbModelGroup }>('/api/v1/cmdb/model-group', {
    method: 'POST',
    data: body,
  });
}

export async function updateModelGroup(
  code: string,
  body: { name?: string; sort?: number },
): Promise<{ group: CmdbModelGroup }> {
  return authRequest<{ group: CmdbModelGroup }>(
    `/api/v1/cmdb/model-group/${code}`,
    { method: 'PUT', data: body },
  );
}

export async function deleteModelGroup(code: string): Promise<void> {
  await authRequest<Record<string, never>>(`/api/v1/cmdb/model-group/${code}`, {
    method: 'DELETE',
  });
}

/** ListFavorites 当前用户收藏的模型编码；无权限时抛出，调用方隐藏收藏能力 */
export async function listFavorites(): Promise<{ modelCodes: string[] }> {
  return quietGet<{ modelCodes: string[] }>('/api/v1/cmdb/favorite');
}

export async function setFavorite(
  modelCode: string,
  favorite: boolean,
): Promise<void> {
  await authRequest<Record<string, never>>(
    `/api/v1/cmdb/favorite/${modelCode}`,
    { method: 'PUT', data: { favorite } },
  );
}

/** GetOverview 运营概览（受数据范围约束）；days 1-90，缺省 30 */
export async function getOverview(days?: number): Promise<CmdbOverview> {
  return quietGet<CmdbOverview>(
    '/api/v1/cmdb/overview',
    days ? { days } : undefined,
  );
}

/** GetQuality 数据质量：按模型的问题资源数（受数据范围约束） */
export async function getQuality(): Promise<{
  items?: CmdbQualityRow[];
  outdatedDays?: number;
}> {
  return quietGet<{ items?: CmdbQualityRow[]; outdatedDays?: number }>(
    '/api/v1/cmdb/quality',
  );
}

export interface ListSchemaAuditParams {
  page?: number;
  pageSize?: number;
  targetType?: CmdbSchemaTargetType;
  modelCode?: string;
  action?: CmdbSchemaAction;
  operator?: string;
  keyword?: string;
  /** RFC3339 */
  from?: string;
  to?: string;
}

/** ListSchemaAudit 模型变更审计：分组 / 模型 / 字段 / 关系类型的增删改 */
export async function listSchemaAudit(
  params: ListSchemaAuditParams,
): Promise<PagedResult<CmdbSchemaAudit>> {
  return authRequest<PagedResult<CmdbSchemaAudit>>(
    '/api/v1/cmdb/schema-audit',
    { method: 'GET', params },
  );
}
