/**
 * CmdbModelService 资源模型：资源类型 / 类型字段 / 关系类型。
 */
import { authRequest } from '@/services/system/request';
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

export interface ModelDetail {
  model: CmdbModel;
  fields: CmdbField[];
  relationTypes: CmdbRelationType[];
}

export async function getModel(code: string): Promise<ModelDetail> {
  return authRequest<ModelDetail>(`/api/v1/cmdb/model/${code}`, {
    method: 'GET',
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
  return authRequest<{ model: CmdbModel }>(`/api/v1/cmdb/model/${code}`, {
    method: 'PUT',
    data: body,
  });
}

export async function deleteModel(code: string): Promise<void> {
  await authRequest<Record<string, never>>(`/api/v1/cmdb/model/${code}`, {
    method: 'DELETE',
  });
}

export interface FieldParams {
  code?: string;
  name?: string;
  type?: CmdbFieldType;
  required?: boolean;
  unique?: boolean;
  enumValues?: string[];
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
