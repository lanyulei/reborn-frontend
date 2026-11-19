/**
 * 容器平台域请求包装：在 authRequest 之上，
 * 1. 常见错误码提示本地化文案，其余沿用后端 message（集群返回的原文）；
 * 2. 「缓存建立中」（K8S_CACHE_SYNCING）按退避自动重试，调用方无感。
 */
import {
  type DomainRequestOptions,
  getErrorMetadata,
  getErrorReason,
  getErrorStatus,
} from '@/services/system/domainRequest';
import { authRequest, getErrorMessage } from '@/services/system/request';
import { message } from '@/utils/feedback';
import { t } from '@/utils/i18n';
import {
  announceSubmitted,
  CHANGE_SUBMITTED,
  emergencyHeaders,
} from './approval';

/** 有固定本地化文案的错误码 → i18n 键 */
const REASON_TEXT_ID: Record<string, string> = {
  K8S_VERSION_CONFLICT: 'pages.k8s.error.versionConflict',
  K8S_SECRET_UNAVAILABLE: 'pages.k8s.error.secretUnavailable',
  K8S_CLUSTER_NAME_EXISTS: 'pages.k8s.error.clusterNameExists',
  K8S_AGENT_UNCONFIGURED: 'pages.k8s.error.agentUnconfigured',
  K8S_CACHE_SYNCING: 'pages.k8s.error.cacheSyncing',
  K8S_TOO_MANY_STREAMS: 'pages.k8s.error.tooManyStreams',
  K8S_EXEC_DISABLED: 'pages.k8s.error.execDisabled',
  K8S_PLANE_UNAVAILABLE: 'pages.k8s.error.planeUnavailable',
  K8S_CLUSTER_NOT_FOUND: 'pages.k8s.error.clusterNotFound',
  K8S_HELM_REPO_NAME_EXISTS: 'pages.k8s.error.helmRepoNameExists',
  K8S_HELM_REPO_NOT_FOUND: 'pages.k8s.error.helmRepoNotFound',
  K8S_FILE_TOO_LARGE: 'pages.k8s.error.fileTooLarge',
  K8S_KUBE_TOKEN_LIMIT: 'pages.k8s.error.kubeTokenLimit',
  K8S_INSPECTION_BUSY: 'pages.k8s.error.inspectionBusy',
};

/** 这些错误在后端 message 前加上固定说明（message 是集群返回的原文，对排查有用） */
const REASON_PREFIX_ID: Record<string, string> = {
  K8S_FORBIDDEN: 'pages.k8s.error.forbidden',
  K8S_CONFLICT: 'pages.k8s.error.conflict',
  K8S_REJECTED: 'pages.k8s.error.rejected',
  K8S_CLUSTER_UNREACHABLE: 'pages.k8s.error.unreachable',
};

export {
  getErrorMetadata,
  getErrorReason,
  getErrorStatus,
} from '@/services/system/domainRequest';

/** 写操作已转为变更单（HTTP 428）：不是失败，调用方应收起弹窗而不是展示错误 */
export const isChangeSubmitted = (error: unknown): boolean =>
  getErrorReason(error) === CHANGE_SUBMITTED;

/** 错误 → 展示文案 */
export const getK8sErrorMessage = (error: unknown): string => {
  const reason = getErrorReason(error) ?? '';
  if (REASON_TEXT_ID[reason]) return t(REASON_TEXT_ID[reason]);
  const detail = getErrorMessage(error);
  return REASON_PREFIX_ID[reason]
    ? `${t(REASON_PREFIX_ID[reason])}：${detail}`
    : detail;
};

/** 查询参数 → 查询串：undefined / null / 空串 / false 跳过（与后端零值等价） */
const serializeParams = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== false
    ) {
      search.append(key, String(value));
    }
  }
  return search.toString();
};

export type K8sRequestOptions = DomainRequestOptions;

/** 缓存建立中的重试间隔（毫秒）；用尽后把错误交给调用方 */
const SYNC_RETRY_MS = [1000, 2000, 3000, 5000, 5000, 8000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function k8sRequest<T>(
  url: string,
  options: K8sRequestOptions = {},
): Promise<T> {
  const { silent, ...rest } = options;
  // 「缓存建立中」只对读请求自动重试：GET，以及只做预检 / 预览的 POST（:preview）。
  // 写操作绝不自动重试——用户确认过的危险操作不能在十几秒后悄悄执行，更不能重复执行。
  const method = String(rest.method ?? 'GET').toUpperCase();
  const retriable =
    method === 'GET' || (method === 'POST' && /:preview(\?|$)/.test(url));
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await authRequest<T>(url, {
        ...rest,
        headers: { ...rest.headers, ...emergencyHeaders(url) },
        paramsSerializer: serializeParams,
        silent: true,
      });
    } catch (error) {
      // 该集群的变更需审批：写操作已转为变更单（不是失败）。页面上的审批提示条负责展示去向，
      // 这里照常抛出，让调用方停在原处（集群没有被改动）。
      if (getErrorReason(error) === CHANGE_SUBMITTED) {
        announceSubmitted(getErrorMetadata(error));
        throw error;
      }
      if (
        getErrorReason(error) === 'K8S_CACHE_SYNCING' &&
        retriable &&
        attempt < SYNC_RETRY_MS.length
      ) {
        await sleep(SYNC_RETRY_MS[attempt]);
        continue;
      }
      // 401 的刷新 / 跳转登录由 authRequest 处理，这里不再提示
      if (!silent && getErrorStatus(error) !== 401) {
        message.error(getK8sErrorMessage(error));
      }
      throw error;
    }
  }
}

/** 集群下的接口路径 */
export const clusterPath = (clusterId: string, path: string): string =>
  `/api/v1/k8s/cluster/${clusterId}${path}`;
