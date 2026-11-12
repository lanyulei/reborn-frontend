/**
 * CmdbRelationService 资源关联：关联 / 解除 / 迁移 / 关联数据查询。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult } from '@/services/system/typings';
import type { CmdbDirection, CmdbRelatedCI } from './typings';

export async function linkCIs(
  ciId: string,
  relationType: string,
  direction: CmdbDirection,
  targetIds: string[],
): Promise<{ linked: number }> {
  return authRequest<{ linked: number }>(`/api/v1/cmdb/ci/${ciId}/relation`, {
    method: 'POST',
    data: { relationType, direction, targetIds },
  });
}

export async function unlinkCI(
  ciId: string,
  relationType: string,
  direction: CmdbDirection,
  targetId: string,
): Promise<void> {
  await authRequest<Record<string, never>>(
    `/api/v1/cmdb/ci/${ciId}/relation:unlink`,
    { method: 'POST', data: { relationType, direction, targetId } },
  );
}

export async function moveCI(
  ciId: string,
  relationType: string,
  direction: CmdbDirection,
  fromId: string,
  toId: string,
): Promise<void> {
  await authRequest<Record<string, never>>(
    `/api/v1/cmdb/ci/${ciId}/relation:move`,
    { method: 'POST', data: { relationType, direction, fromId, toId } },
  );
}

export async function listRelated(
  ciId: string,
  params: {
    relationType: string;
    direction: CmdbDirection;
    keyword?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<PagedResult<CmdbRelatedCI>> {
  return authRequest<PagedResult<CmdbRelatedCI>>(
    `/api/v1/cmdb/ci/${ciId}/related`,
    { method: 'GET', params },
  );
}

/** 拓扑节点（depth 距中心层数，中心为 0） */
export interface TopologyNode {
  id: string;
  name: string;
  modelCode: string;
  modelName: string;
  status: string;
  env?: string;
  depth: number;
}

/** 拓扑边（有向 src → dst） */
export interface TopologyEdge {
  id: string;
  relationType: string;
  name: string;
  srcId: string;
  dstId: string;
}

export interface TopologyResult {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  truncated?: boolean;
}

/** Neighbors 资源拓扑：按层展开（depth ≤3，maxNodes ≤500） */
export async function getNeighbors(
  ciId: string,
  params: { depth?: number; maxNodes?: number },
): Promise<TopologyResult> {
  return authRequest<TopologyResult>(`/api/v1/cmdb/ci/${ciId}/neighbors`, {
    method: 'GET',
    params,
  });
}
