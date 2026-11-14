/**
 * CmdbModelService 资源模型：资源类型 / 类型字段 / 关系类型。
 */
import { authRequest } from '@/services/system/request';
import { fetchAllPages } from '@/utils/paging';
import type { PagedResult } from '@/services/system/typings';
import type {
  CmdbCardinality,
  CmdbField,
  CmdbFieldOwner,
  CmdbFieldRule,
  CmdbFieldType,
  CmdbModel,
  CmdbModelCategory,
  CmdbModelStatus,
  CmdbOnDelete,
  CmdbRelationType,
  CmdbUniqueRule,
} from './typings';

export interface ListModelsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: CmdbModelCategory;
  status?: CmdbModelStatus;
}

export async function listModels(
  params: ListModelsParams,
): Promise<PagedResult<CmdbModel>> {
  return authRequest<PagedResult<CmdbModel>>('/api/v1/cmdb/model', {
    method: 'GET',
    params,
  });
}

/**
 * 全部模型（翻页取全）。同一时刻的并发调用共享一次请求，并做 5 秒短缓存——
 * 一个页面里常有多处同时要模型清单（目录、名称映射、下拉选项）。
 * `fresh` 跳过缓存（实例数等刚变化时用）；模型增删改后缓存自动失效。
 */
let allModelsCache: { at: number; promise: Promise<CmdbModel[]> } | null = null;
const ALL_MODELS_TTL_MS = 5000;

export function invalidateModelsCache(): void {
  allModelsCache = null;
}

export async function listAllModels(options?: {
  fresh?: boolean;
}): Promise<{ items: CmdbModel[] }> {
  const now = Date.now();
  if (
    options?.fresh ||
    !allModelsCache ||
    now - allModelsCache.at > ALL_MODELS_TTL_MS
  ) {
    const promise = fetchAllPages<CmdbModel>((page, pageSize) =>
      listModels({ page, pageSize }),
    );
    const entry = { at: now, promise };
    allModelsCache = entry;
    // 失败不缓存，下次调用重试
    promise.catch(() => {
      if (allModelsCache === entry) allModelsCache = null;
    });
  }
  return { items: await allModelsCache.promise };
}

export interface ModelDetail {
  model: CmdbModel;
  fields: CmdbField[];
  relationTypes: CmdbRelationType[];
  /** 唯一规则（按名称排序）；无规则时后端省略该字段 */
  uniqueRules?: CmdbUniqueRule[];
}

export async function getModel(
  code: string,
  /** silent：辅助性查询（如为历史行取字段定义，模型可能已删除）失败不弹错误 */
  options?: { silent?: boolean },
): Promise<ModelDetail> {
  return authRequest<ModelDetail>(`/api/v1/cmdb/model/${code}`, {
    method: 'GET',
    silent: options?.silent,
  });
}

export interface CreateModelParams {
  code: string;
  name: string;
  category: CmdbModelCategory;
  icon?: string;
  description?: string;
}

export async function createModel(
  body: CreateModelParams,
): Promise<{ model: CmdbModel }> {
  invalidateModelsCache();
  return authRequest<{ model: CmdbModel }>('/api/v1/cmdb/model', {
    method: 'POST',
    data: body,
  });
}

export interface UpdateModelParams {
  name?: string;
  category?: CmdbModelCategory;
  icon?: string;
  description?: string;
  status?: CmdbModelStatus;
}

export async function updateModel(
  code: string,
  body: UpdateModelParams,
): Promise<{ model: CmdbModel }> {
  invalidateModelsCache();
  return authRequest<{ model: CmdbModel }>(`/api/v1/cmdb/model/${code}`, {
    method: 'PUT',
    data: body,
  });
}

export async function deleteModel(code: string): Promise<void> {
  invalidateModelsCache();
  await authRequest<Record<string, never>>(`/api/v1/cmdb/model/${code}`, {
    method: 'DELETE',
  });
}

export interface FieldParams {
  code?: string;
  name?: string;
  type?: CmdbFieldType;
  required?: boolean;
  enumValues?: string[];
  enumLabels?: Record<string, string>;
  refModel?: string;
  rule?: CmdbFieldRule;
  owner?: CmdbFieldOwner;
  listVisible?: boolean;
  indexed?: boolean;
  sensitive?: boolean;
  sort?: number;
  description?: string;
}

export async function createField(
  modelCode: string,
  body: FieldParams,
): Promise<{ field: CmdbField }> {
  return authRequest<{ field: CmdbField }>(
    `/api/v1/cmdb/model/${modelCode}/field`,
    { method: 'POST', data: body },
  );
}

export async function updateField(
  modelCode: string,
  id: string,
  body: FieldParams,
): Promise<{ field: CmdbField }> {
  return authRequest<{ field: CmdbField }>(
    `/api/v1/cmdb/model/${modelCode}/field/${id}`,
    { method: 'PUT', data: body },
  );
}

export async function deprecateField(
  modelCode: string,
  id: string,
): Promise<void> {
  await authRequest<Record<string, never>>(
    `/api/v1/cmdb/model/${modelCode}/field/${id}`,
    { method: 'DELETE' },
  );
}

export interface UniqueRuleParams {
  name?: string;
  fieldCodes?: string[];
}

/** 新增唯一规则；存量资源在这组字段上已有重复时 409（CMDB_UNIQUE_RULE_CONFLICT） */
export async function createUniqueRule(
  modelCode: string,
  body: Required<UniqueRuleParams>,
): Promise<{ rule: CmdbUniqueRule }> {
  return authRequest<{ rule: CmdbUniqueRule }>(
    `/api/v1/cmdb/model/${modelCode}/unique-rule`,
    { method: 'POST', data: body },
  );
}

/** 更新唯一规则；fieldCodes 非空时整组替换并重算（存量重复则 409） */
export async function updateUniqueRule(
  modelCode: string,
  id: string,
  body: UniqueRuleParams,
): Promise<{ rule: CmdbUniqueRule }> {
  return authRequest<{ rule: CmdbUniqueRule }>(
    `/api/v1/cmdb/model/${modelCode}/unique-rule/${id}`,
    { method: 'PUT', data: body },
  );
}

export async function deleteUniqueRule(
  modelCode: string,
  id: string,
): Promise<void> {
  await authRequest<Record<string, never>>(
    `/api/v1/cmdb/model/${modelCode}/unique-rule/${id}`,
    { method: 'DELETE' },
  );
}

export interface UniqueRuleCheck {
  /** 存量资源中取值重复的组数（int64 → 字符串）；0 = 可以建立（零值可能被省略） */
  conflictGroups?: string;
  /** 重复组样例（至多 5 组）；数据范围受限的用户看不到资源名称 */
  samples?: { count: string; names?: string[] }[];
}

/** 预检：存量资源在这组字段上是否有重复（只读）。静默：失败不弹错误，由表单自行处理 */
export async function checkUniqueRule(
  modelCode: string,
  fieldCodes: string[],
): Promise<UniqueRuleCheck> {
  return authRequest<UniqueRuleCheck>(
    `/api/v1/cmdb/model/${modelCode}/unique-rule:check`,
    { method: 'POST', data: { fieldCodes }, silent: true },
  );
}

export async function listRelationTypes(
  modelCode?: string,
): Promise<{ items: CmdbRelationType[] }> {
  return authRequest<{ items: CmdbRelationType[] }>(
    '/api/v1/cmdb/relation-type',
    { method: 'GET', params: modelCode ? { modelCode } : undefined },
  );
}

export interface RelationTypeParams {
  code?: string;
  name?: string;
  forwardName?: string;
  backwardName?: string;
  srcModel?: string;
  dstModel?: string;
  cardinality?: CmdbCardinality;
  onDelete?: CmdbOnDelete;
  description?: string;
}

export async function createRelationType(
  body: RelationTypeParams,
): Promise<{ relationType: CmdbRelationType }> {
  return authRequest<{ relationType: CmdbRelationType }>(
    '/api/v1/cmdb/relation-type',
    { method: 'POST', data: body },
  );
}

export async function updateRelationType(
  code: string,
  body: RelationTypeParams,
): Promise<{ relationType: CmdbRelationType }> {
  return authRequest<{ relationType: CmdbRelationType }>(
    `/api/v1/cmdb/relation-type/${code}`,
    { method: 'PUT', data: body },
  );
}

export async function deleteRelationType(code: string): Promise<void> {
  await authRequest<Record<string, never>>(
    `/api/v1/cmdb/relation-type/${code}`,
    { method: 'DELETE' },
  );
}

/** 详情布局区块 */
export interface ViewSection {
  type: 'attrs' | 'relation';
  title?: string;
  fields?: string[];
  relationType?: string;
  direction?: 'outgoing' | 'incoming';
  columns?: string[];
  collapsed?: boolean;
}

export interface ModelViewResult {
  modelCode: string;
  configured: boolean;
  sections: ViewSection[];
}

/** GetModelView 查询详情布局（未配置返回缺省生成） */
export async function getModelView(modelCode: string): Promise<ModelViewResult> {
  return authRequest<ModelViewResult>(`/api/v1/cmdb/model/${modelCode}/view`, {
    method: 'GET',
  });
}

/** UpdateModelView 整体替换详情布局 */
export async function updateModelView(
  modelCode: string,
  sections: ViewSection[],
): Promise<{ sections: ViewSection[] }> {
  return authRequest<{ sections: ViewSection[] }>(
    `/api/v1/cmdb/model/${modelCode}/view`,
    { method: 'PUT', data: { sections } },
  );
}
