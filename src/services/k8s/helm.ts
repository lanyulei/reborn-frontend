/**
 * K8sHelmRepoService Helm 仓库（凭据只写不读）与 Chart 目录；K8sHelmReleaseService 集群上的 Release。
 * 仓库的测试 / 目录 / Chart 详情、以及 Release 的全部接口，响应是数据面返回的 JSON
 * （结构见 backend/kit/k8scontract/helm.go）。Release 以当前用户的身份访问集群。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { clusterPath, k8sRequest } from './request';
import type { ResourceRef } from './typings';

const REPO = '/api/v1/k8s/helm-repo';

export interface HelmRepoSpec {
  name: string;
  /** 1 = HTTP 仓库；2 = OCI 仓库 */
  type: number;
  url: string;
  username?: string;
  caCert?: string;
  insecureSkipVerify?: boolean;
  description?: string;
  enabled?: boolean;
}

export interface HelmRepo {
  id: string;
  spec: HelmRepoSpec;
  hasSecret?: boolean;
  version: number;
  createTime?: string;
  updateTime?: string;
}

export interface HelmRepoOption {
  id: string;
  name: string;
  type: number;
  url: string;
}

export interface HelmRepoTestResult {
  ok: boolean;
  charts: number;
  durationMs: number;
  error?: string;
}

export interface HelmChartVersion {
  version: string;
  appVersion?: string;
  created?: string;
  deprecated?: boolean;
}

export interface HelmChartSummary {
  name: string;
  description?: string;
  icon?: string;
  home?: string;
  keywords?: string[] | null;
  versions: HelmChartVersion[] | null;
}

export interface HelmChartDetail {
  name: string;
  version: string;
  appVersion?: string;
  description?: string;
  values: string;
  schema?: string;
  readme?: string;
}

export interface HelmRelease {
  namespace: string;
  name: string;
  revision: number;
  status: string;
  chart: string;
  chartVersion: string;
  appVersion?: string;
  updateTime: string;
  description?: string;
}

export interface HelmReleaseDetail {
  release: HelmRelease;
  values: string;
  notes?: string;
  manifest: string;
  resources: { kind: string; ref: ResourceRef }[] | null;
  history: HelmRelease[] | null;
}

export interface HelmApplyBody {
  namespace: string;
  name: string;
  repoId: string;
  chart: string;
  version: string;
  values?: string;
}

export interface HelmPreview {
  upgrade: boolean;
  manifest: string;
  currentManifest?: string;
  values: string;
  currentValues?: string;
  currentChart?: string;
  notes?: string;
}

export interface HelmApplyResult {
  /** 20 秒内未完成：操作仍在执行，稍后查看 Release 状态 */
  pending: boolean;
  revision?: number;
  status?: string;
  notes?: string;
}

export interface QuotaUsage {
  resource: string;
  used: string;
  hard: string;
  ratio: number;
}

export interface NamespaceQuota {
  namespace: string;
  quotas: string[] | null;
  items: QuotaUsage[] | null;
}

interface Silent {
  silent?: boolean;
}

export const listHelmRepos = (params: PageQuery) =>
  k8sRequest<PagedResult<HelmRepo>>(REPO, { method: 'GET', params });

export const createHelmRepo = (body: { spec: HelmRepoSpec; secret?: string }) =>
  k8sRequest<{ repo: HelmRepo }>(REPO, { method: 'POST', data: body });

export const updateHelmRepo = (
  id: string,
  body: { spec: HelmRepoSpec; secret?: string; version: number },
) => k8sRequest<{ repo: HelmRepo }>(`${REPO}/${id}`, { method: 'PUT', data: body });

export const deleteHelmRepo = (id: string) =>
  k8sRequest<unknown>(`${REPO}/${id}`, { method: 'DELETE' });

export const listHelmRepoOptions = (options?: Silent) =>
  k8sRequest<{ items: HelmRepoOption[] }>(`${REPO}-option`, {
    method: 'GET',
    ...options,
  });

export const testHelmRepo = (body: {
  id?: string;
  spec: HelmRepoSpec;
  secret?: string;
  chart?: string;
}) =>
  k8sRequest<HelmRepoTestResult>(`${REPO}:test`, {
    method: 'POST',
    data: body,
    timeout: 150000,
  });

export const listHelmCharts = (
  repoId: string,
  params: { keyword?: string; chart?: string; refresh?: boolean },
  options?: Silent,
) =>
  k8sRequest<{
    items: HelmChartSummary[] | null;
    truncated?: boolean;
    fetchTime: string;
  }>(`${REPO}/${repoId}/chart`, {
    method: 'GET',
    params,
    timeout: 150000,
    ...options,
  });

export const getHelmChart = (
  repoId: string,
  chart: string,
  version: string,
  options?: Silent,
) =>
  k8sRequest<HelmChartDetail>(`${REPO}/${repoId}/chart-detail`, {
    method: 'GET',
    params: { chart, version },
    timeout: 150000,
    ...options,
  });

export const listHelmReleases = (
  clusterId: string,
  params: { namespace?: string; keyword?: string },
  options?: Silent,
) =>
  k8sRequest<{
    items: HelmRelease[] | null;
    partialNamespaces?: string[] | null;
  }>(clusterPath(clusterId, '/helm-release'), {
    method: 'GET',
    params,
    ...options,
  });

export const getHelmRelease = (
  clusterId: string,
  namespace: string,
  name: string,
  options?: Silent,
) =>
  k8sRequest<HelmReleaseDetail>(clusterPath(clusterId, '/helm-release-detail'), {
    method: 'GET',
    params: { namespace, name },
    ...options,
  });

const post = <T>(clusterId: string, verb: string, data: unknown, silent = false) =>
  k8sRequest<T>(clusterPath(clusterId, `/helm-release:${verb}`), {
    method: 'POST',
    data,
    timeout: 150000,
    silent,
  });

export const previewHelmRelease = (
  clusterId: string,
  body: HelmApplyBody & { upgrade: boolean },
) => post<HelmPreview>(clusterId, 'preview', body, true);

export const installHelmRelease = (clusterId: string, body: HelmApplyBody) =>
  post<HelmApplyResult>(clusterId, 'install', body, true);

export const upgradeHelmRelease = (clusterId: string, body: HelmApplyBody) =>
  post<HelmApplyResult>(clusterId, 'upgrade', body, true);

export const rollbackHelmRelease = (
  clusterId: string,
  body: { namespace: string; name: string; revision: number },
) => post<HelmApplyResult>(clusterId, 'rollback', body);

export const uninstallHelmRelease = (
  clusterId: string,
  body: { namespace: string; name: string },
) => post<HelmApplyResult>(clusterId, 'uninstall', body);

export const listNamespaceQuotas = (
  clusterId: string,
  namespace?: string,
  options?: Silent,
) =>
  k8sRequest<{ items: NamespaceQuota[] | null }>(
    clusterPath(clusterId, '/namespace-quota'),
    { method: 'GET', params: { namespace }, ...options },
  );
