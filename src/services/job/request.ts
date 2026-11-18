/**
 * 作业中心域请求包装：在 authRequest 之上补两件事——
 * 1. 查询串里的数组按「重复键」序列化（statuses=1&statuses=2），与后端 repeated 查询参数的绑定方式一致；
 * 2. 常见业务错误码（乐观锁冲突、目标主机越权等）提示本地化文案，其余错误沿用后端文案。
 */
import type { RequestOptions } from '@@/plugin-request/request';
import { message } from 'antd';
import { authRequest, getErrorMessage } from '@/services/system/request';
import { t } from '@/utils/i18n';

/** 作业中心域错误码（后端 job.v1.ErrorReason，仅列出前端需要分支处理的） */
export type JobErrorReason =
  | 'JOB_VERSION_CONFLICT'
  | 'JOB_SECRET_UNAVAILABLE'
  | 'JOB_CREDENTIAL_IN_USE'
  | 'JOB_PROJECT_IN_USE'
  | 'JOB_TEMPLATE_NOT_FOUND'
  | 'JOB_TEMPLATE_DISABLED'
  | 'JOB_TARGET_FORBIDDEN'
  | 'JOB_RUN_FORBIDDEN'
  | 'JOB_EXECUTION_NOT_FOUND'
  | 'JOB_EXECUTION_CONFLICT'
  | 'JOB_EXECUTION_FINISHED'
  | 'JOB_RISK_BLOCKED'
  | 'JOB_APPROVAL_UNAVAILABLE'
  | 'JOB_TRIGGER_DISABLED';

/** 有固定本地化文案的错误码 → i18n 键；其余错误码的具体原因以后端 message 为准 */
const REASON_TEXT_ID: Partial<Record<JobErrorReason, string>> = {
  JOB_VERSION_CONFLICT: 'pages.job.error.conflict',
  JOB_SECRET_UNAVAILABLE: 'pages.job.error.secretUnavailable',
  JOB_CREDENTIAL_IN_USE: 'pages.job.error.credentialInUse',
  JOB_PROJECT_IN_USE: 'pages.job.error.projectInUse',
  JOB_TEMPLATE_DISABLED: 'pages.job.error.templateDisabled',
  JOB_TARGET_FORBIDDEN: 'pages.job.error.targetForbidden',
  JOB_RUN_FORBIDDEN: 'pages.job.error.runForbidden',
  JOB_EXECUTION_CONFLICT: 'pages.job.error.executionConflict',
  JOB_EXECUTION_FINISHED: 'pages.job.error.executionFinished',
  JOB_RISK_BLOCKED: 'pages.job.error.riskBlocked',
  JOB_APPROVAL_UNAVAILABLE: 'pages.job.error.approvalUnavailable',
};

/** 取后端 Kratos Status 的 reason（网络错误等无响应体时为 undefined） */
export const getErrorReason = (error: unknown): string | undefined =>
  (error as { response?: { data?: { reason?: string } } } | undefined)?.response
    ?.data?.reason;

/** 取 HTTP 状态码（网络错误等无响应时为 undefined） */
export const getErrorStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | undefined)?.response?.status;

/** 错误 → 展示文案：有固定文案的错误码用本地化文案，否则用后端 message */
export const getJobErrorMessage = (error: unknown): string => {
  const textId = REASON_TEXT_ID[getErrorReason(error) as JobErrorReason];
  return textId ? t(textId) : getErrorMessage(error);
};

/** 查询参数 → 查询串：数组展开为重复键，undefined / null / 空串跳过 */
const serializeParams = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== null && item !== '') {
        search.append(key, String(item));
      }
    }
  }
  return search.toString();
};

export interface JobRequestOptions extends RequestOptions {
  /** 静默：失败不弹提示，由调用方自行展示 */
  silent?: boolean;
}

export async function jobRequest<T>(
  url: string,
  options: JobRequestOptions = {},
): Promise<T> {
  const { silent, ...rest } = options;
  try {
    return await authRequest<T>(url, {
      ...rest,
      paramsSerializer: serializeParams,
      silent: true,
    });
  } catch (error) {
    // 401 的刷新 / 跳转登录由 authRequest 处理，这里不再提示
    if (!silent && getErrorStatus(error) !== 401) {
      message.error(getJobErrorMessage(error));
    }
    throw error;
  }
}
