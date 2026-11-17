/**
 * WorkflowDefinitionService 流程定义：列表 / 创建 / 更新 / 草稿保存 / 发布 / 删除 / 版本。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { normalizePaged } from './paged';
import type {
  DefinitionStatus,
  DefinitionVersion,
  GraphIssue,
  SimulatedStep,
  WorkflowDefinition,
} from './typings';

const BASE = '/api/v1/workflow/definition';

/**
 * 补齐响应里被省略的零值字段：停用（status=0）、从未保存过草稿（revision=0）、
 * 从未发布（publishedVersion=0）在 protojson 输出里都不出现。
 */
const normalize = (d: WorkflowDefinition): WorkflowDefinition => ({
  ...d,
  status: d.status ?? 0,
  revision: d.revision ?? 0,
  publishedVersion: d.publishedVersion ?? 0,
});

export interface ListDefinitionsParams extends PageQuery {
  status?: DefinitionStatus;
  /** true=已发布 false=从未发布 */
  published?: boolean;
}

/** ListDefinitions 分页查询流程定义 */
export async function listDefinitions(
  params: ListDefinitionsParams,
  options?: { silent?: boolean },
): Promise<PagedResult<WorkflowDefinition>> {
  const result = normalizePaged(
    await authRequest<Partial<PagedResult<WorkflowDefinition>>>(BASE, {
      method: 'GET',
      params,
      silent: options?.silent,
    }),
  );
  return { ...result, items: result.items.map(normalize) };
}

/** GetDefinition 流程定义详情（含草稿流程图与校验问题） */
export async function getDefinition(
  id: string,
  options?: { silent?: boolean },
): Promise<{
  definition: WorkflowDefinition;
  draft?: Record<string, unknown>;
  issues?: GraphIssue[];
}> {
  const result = await authRequest<{
    definition: WorkflowDefinition;
    draft?: Record<string, unknown>;
    issues?: GraphIssue[];
  }>(`${BASE}/${id}`, { method: 'GET', silent: options?.silent });
  return { ...result, definition: normalize(result.definition) };
}

/** CreateDefinition 创建流程定义（key 创建后不可改） */
export async function createDefinition(body: {
  key: string;
  name: string;
  category?: string;
  description?: string;
}): Promise<{ definition: WorkflowDefinition }> {
  const result = await authRequest<{ definition: WorkflowDefinition }>(BASE, {
    method: 'POST',
    data: body,
  });
  return { definition: normalize(result.definition) };
}

/** UpdateDefinition 更新名称 / 分类 / 说明 / 启停 */
export async function updateDefinition(
  id: string,
  body: {
    name?: string;
    category?: string;
    description?: string;
    status?: DefinitionStatus;
  },
): Promise<{ definition: WorkflowDefinition }> {
  const result = await authRequest<{ definition: WorkflowDefinition }>(
    `${BASE}/${id}`,
    { method: 'PUT', data: body },
  );
  return { definition: normalize(result.definition) };
}

/** 错误原因：草稿已被他人修改（保存 / 发布时带的修订号过期） */
export const WORKFLOW_DEFINITION_CONFLICT = 'WORKFLOW_DEFINITION_CONFLICT';

/** SaveDefinitionDraft 保存草稿流程图（可未完成）；返回新修订号与校验问题 */
export async function saveDefinitionDraft(
  id: string,
  graph: Record<string, unknown>,
  revision: number,
  options?: { silent?: boolean },
): Promise<{ revision: number; issues?: GraphIssue[] }> {
  const result = await authRequest<{
    revision?: number;
    issues?: GraphIssue[];
  }>(`${BASE}/${id}/draft`, {
    method: 'PUT',
    data: { graph, revision },
    ...options,
  });
  return { ...result, revision: result.revision ?? 0 };
}

/** PublishDefinition 发布当前草稿为新版本 */
export async function publishDefinition(
  id: string,
  revision: number,
  options?: { silent?: boolean },
): Promise<{ definition: WorkflowDefinition }> {
  const result = await authRequest<{ definition: WorkflowDefinition }>(
    `${BASE}/${id}/publish`,
    { method: 'POST', data: { revision }, ...options },
  );
  return { definition: normalize(result.definition) };
}

/** DeleteDefinition 删除流程定义；仍有进行中的实例时拒绝 */
export async function deleteDefinition(id: string): Promise<void> {
  await authRequest<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

/** ListDefinitionVersions 已发布版本列表（版本号倒序） */
export async function listDefinitionVersions(
  id: string,
): Promise<{ items: DefinitionVersion[] }> {
  return authRequest(`${BASE}/${id}/version`, { method: 'GET' });
}

/** GetDefinitionVersion 某个已发布版本的流程图 */
export async function getDefinitionVersion(
  id: string,
  version: number,
): Promise<{ version: DefinitionVersion; graph?: Record<string, unknown> }> {
  return authRequest(`${BASE}/${id}/version/${version}`, { method: 'GET' });
}

/**
 * SimulateDefinition 模拟运行一份流程图（不落库、不发通知、不调用外部系统）：返回将会
 * 依次经过的节点与各节点解析出的处理人。流程图不合法时后端返回 400，失败不自动提示，
 * 由调用方就地展示。
 */
export async function simulateDefinition(
  id: string,
  body: {
    graph: Record<string, unknown>;
    variables?: Record<string, unknown>;
    initiator?: string;
  },
): Promise<{ steps: SimulatedStep[]; status: number }> {
  const result = await authRequest<{
    steps?: (Omit<SimulatedStep, 'assignees'> & {
      assignees?: SimulatedStep['assignees'];
    })[];
    status?: number;
  }>(`${BASE}/${id}/simulate`, { method: 'POST', data: body, silent: true });
  return {
    steps: (result.steps ?? []).map((s) => ({
      ...s,
      assignees: s.assignees ?? [],
    })),
    status: result.status ?? 0,
  };
}
