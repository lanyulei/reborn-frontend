/**
 * K8sClusterService 集群登记、连通性、Agent 安装与吊销；K8sScopeService 角色数据范围。
 * 直连凭据只写不读：编辑时不传即沿用已保存的。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { k8sRequest } from './request';
import type {
  AgentInstall,
  Cluster,
  ClusterCredential,
  ClusterOption,
  ClusterSpec,
  ParsedKubeconfig,
  RoleScopeItem,
  TestClusterResult,
} from './typings';

const BASE = '/api/v1/k8s/cluster';

export interface ListClustersParams extends PageQuery {
  keyword?: string;
  env?: string;
  status?: number;
}

export async function listClusters(
  params: ListClustersParams,
  options?: { silent?: boolean },
): Promise<PagedResult<Cluster>> {
  return k8sRequest<PagedResult<Cluster>>(BASE, {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

export async function createCluster(body: {
  spec: ClusterSpec;
  credential?: ClusterCredential;
}): Promise<{ cluster: Cluster }> {
  return k8sRequest<{ cluster: Cluster }>(BASE, { method: 'POST', data: body });
}

export async function updateCluster(
  id: string,
  body: { spec: ClusterSpec; credential?: ClusterCredential; version: number },
): Promise<{ cluster: Cluster }> {
  return k8sRequest<{ cluster: Cluster }>(`${BASE}/${id}`, {
    method: 'PUT',
    data: body,
  });
}

export async function deleteCluster(id: string): Promise<void> {
  await k8sRequest<void>(`${BASE}/${id}`, { method: 'DELETE' });
}

export async function parseKubeconfig(body: {
  kubeconfig: string;
  context?: string;
}): Promise<ParsedKubeconfig> {
  return k8sRequest<ParsedKubeconfig>(`${BASE}:parse-kubeconfig`, {
    method: 'POST',
    data: body,
  });
}

export async function testCluster(body: {
  id?: string;
  apiServer: string;
  proxyUrl?: string;
  caCert?: string;
  credential?: ClusterCredential;
}): Promise<TestClusterResult> {
  return k8sRequest<TestClusterResult>(`${BASE}:test`, {
    method: 'POST',
    data: body,
    // 连接超时由后端控制，前端多等一会儿
    timeout: 60_000,
  });
}

/** InstallAgent 签发一次性注册令牌并返回安装清单 / 命令 */
export async function installAgent(id: string): Promise<AgentInstall> {
  return k8sRequest<AgentInstall>(`${BASE}/${id}:agent-install`, {
    method: 'POST',
    data: {},
  });
}

/** RevokeAgent 吊销该集群的全部 Agent 令牌 */
export async function revokeAgent(id: string): Promise<void> {
  await k8sRequest<void>(`${BASE}/${id}:agent-revoke`, {
    method: 'POST',
    data: {},
  });
}

/** ListClusterOptions 当前用户数据范围内的已启用集群（切换器用） */
export async function listClusterOptions(options?: {
  silent?: boolean;
}): Promise<{ items?: ClusterOption[] }> {
  return k8sRequest<{ items?: ClusterOption[] }>('/api/v1/k8s/cluster-option', {
    method: 'GET',
    silent: options?.silent,
  });
}

export async function getRoleScope(
  roleId: string,
): Promise<{ items?: RoleScopeItem[] }> {
  return k8sRequest<{ items?: RoleScopeItem[] }>('/api/v1/k8s/role-scope', {
    method: 'GET',
    params: { roleId },
    silent: true,
  });
}

export async function replaceRoleScope(
  roleId: string,
  items: Pick<RoleScopeItem, 'clusterId' | 'namespace' | 'level'>[],
): Promise<{ items?: RoleScopeItem[] }> {
  return k8sRequest<{ items?: RoleScopeItem[] }>('/api/v1/k8s/role-scope', {
    method: 'PUT',
    data: { roleId, items },
  });
}
