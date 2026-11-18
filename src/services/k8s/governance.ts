/**
 * K8sGovernanceService / K8sFileService：限时 kubeconfig、巡检、终端录制回放、K8s 告警规则模板、
 * 容器文件传输。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { ensureFreshToken, redirectToLogin } from '@/services/system/request';
import { getAccessToken } from '@/utils/auth';
import { clusterPath, k8sRequest } from './request';
import { K8sStreamError } from './stream';

export interface KubeToken {
  id: string;
  userId?: string;
  username?: string;
  clusterId?: string;
  clusterName?: string;
  note?: string;
  createTime?: string;
  expireTime?: string;
  lastUsedTime?: string;
  lastUsedIp?: string;
  revokeTime?: string;
  active?: boolean;
}

export interface IssuedKubeconfig {
  token: KubeToken;
  /** 令牌明文，只返回这一次 */
  secret: string;
  /** 集群代理入口；未配置对外地址时是以 / 开头的相对路径 */
  server: string;
  kubeconfig: string;
}

export const issueKubeconfig = (
  clusterId: string,
  body: { ttlSeconds: number; note?: string },
) =>
  k8sRequest<IssuedKubeconfig>(clusterPath(clusterId, '/kubeconfig'), {
    method: 'POST',
    data: body,
  });

export interface ListKubeTokensParams extends PageQuery {
  all?: boolean;
  userId?: string;
  clusterId?: string;
  activeOnly?: boolean;
}

export const listKubeTokens = (params: ListKubeTokensParams) =>
  k8sRequest<PagedResult<KubeToken>>('/api/v1/k8s/kube-token', {
    method: 'GET',
    params,
  });

export const revokeKubeToken = (id: string) =>
  k8sRequest<void>(`/api/v1/k8s/kube-token/${id}:revoke`, {
    method: 'POST',
    data: {},
  });

export const revokeUserKubeTokens = (userId: string) =>
  k8sRequest<{ revoked?: number }>('/api/v1/k8s/kube-token:revoke-user', {
    method: 'POST',
    data: { userId },
  });

export interface InspectionCheckStat {
  check: string;
  severity: number;
  count?: number;
}

export interface InspectionRun {
  id: string;
  clusterId: string;
  clusterName?: string;
  /** 1 定时 2 手动 */
  trigger?: number;
  /** 1 待执行 2 执行中 3 完成 4 失败 */
  status?: number;
  score?: number;
  critical?: number;
  warning?: number;
  info?: number;
  checks?: InspectionCheckStat[];
  pods?: number;
  workloads?: number;
  nodes?: number;
  certs?: number;
  partial?: boolean;
  error?: string;
  createTime?: string;
  finishTime?: string;
}

export interface InspectionFinding {
  check: string;
  severity: number;
  namespace?: string;
  kind?: string;
  name?: string;
  message?: string;
}

export const listInspectionRuns = (
  params: PageQuery & { clusterId: string },
  options?: { silent?: boolean },
) =>
  k8sRequest<PagedResult<InspectionRun>>('/api/v1/k8s/inspection', {
    method: 'GET',
    params,
    silent: options?.silent,
  });

export const getInspectionRun = (id: string) =>
  k8sRequest<{
    run: InspectionRun;
    findings?: InspectionFinding[];
    scoped?: boolean;
  }>(`/api/v1/k8s/inspection/${id}`, { method: 'GET' });

export const runInspection = (clusterId: string) =>
  k8sRequest<{ run: InspectionRun }>('/api/v1/k8s/inspection', {
    method: 'POST',
    data: { clusterId },
  });

export interface ExecRecordEvent {
  /** int64 字符串 */
  offsetMs?: string;
  /** o 输出 r 窗口大小 */
  type: string;
  /** base64 */
  data?: string;
  cols?: number;
  rows?: number;
}

export const getExecRecord = (sessionId: string) =>
  k8sRequest<{
    events?: ExecRecordEvent[];
    truncated?: boolean;
    durationMs?: string;
  }>(`/api/v1/k8s/exec-session/${sessionId}/record`, { method: 'GET' });

export const getAlertRuleTemplate = () =>
  k8sRequest<{ content: string; rules?: number }>(
    '/api/v1/k8s/alert-rule-template',
    { method: 'GET' },
  );

export interface PodFileTarget {
  namespace: string;
  pod: string;
  container?: string;
}

const fileUrl = (
  clusterId: string,
  action: 'download' | 'upload',
  params: Record<string, string | undefined>,
): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.append(key, value);
  }
  return `${clusterPath(clusterId, `/pod/file:${action}`)}?${search}`;
};

const authHeader = async (): Promise<Record<string, string>> => {
  if (!(await ensureFreshToken())) {
    redirectToLogin();
    throw new K8sStreamError(401, 'TOKEN_INVALID', 'unauthenticated');
  }
  return { Authorization: `Bearer ${getAccessToken() ?? ''}` };
};

const failed = async (response: Response): Promise<K8sStreamError> => {
  let reason = String(response.status);
  let message = response.statusText;
  try {
    const err = (await response.json()) as {
      reason?: string;
      message?: string;
    };
    reason = err.reason ?? reason;
    message = err.message ?? message;
  } catch {
    // 非 JSON 错误体：保留状态文案
  }
  if (response.status === 401) redirectToLogin();
  return new K8sStreamError(response.status, reason, message);
};

const filenameOf = (response: Response, fallback: string): string => {
  const header = response.headers.get('Content-Disposition') ?? '';
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      // 回退到普通 filename
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1] ?? fallback;
};

/** 从容器下载文件（目录为 tar）。内容整体读入内存后交给浏览器保存，上限由后端控制（缺省 100MB）。 */
export async function downloadPodFile(
  clusterId: string,
  target: PodFileTarget,
  path: string,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(
    fileUrl(clusterId, 'download', { ...target, path }),
    { headers: await authHeader(), signal },
  );
  if (!response.ok) throw await failed(response);
  const fallback = path.split('/').filter(Boolean).pop() ?? 'download';
  return {
    blob: await response.blob(),
    filename: filenameOf(response, fallback),
  };
}

/** 向容器的目录 path 上传一个文件（请求体为文件原文） */
export async function uploadPodFile(
  clusterId: string,
  target: PodFileTarget,
  path: string,
  file: File,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(
    fileUrl(clusterId, 'upload', { ...target, path, name: file.name }),
    {
      method: 'POST',
      headers: {
        ...(await authHeader()),
        'Content-Type': 'application/octet-stream',
      },
      body: file,
      signal,
    },
  );
  if (!response.ok) throw await failed(response);
}
