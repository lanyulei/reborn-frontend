/**
 * 业务域请求包装的公共内核（运维 Agent / 故障管理 / 监控告警 / 作业中心 / 容器平台的 request.ts
 * 在此之上各自配置）：
 * - 读取后端 Kratos Status 的 reason / metadata 与 HTTP 状态码；
 * - 查询串里的数组按「重复键」序列化；
 * - createDomainRequest：按该域的错误码表生成「错误 → 本地化文案」与带提示的请求函数。
 *
 * 令牌刷新、跳转登录仍只在 authRequest 里（./request.ts），这里不碰认证流程。
 */
import type { RequestOptions } from '@@/plugin-request/request';
import { getAccessToken } from '@/utils/auth';
import { message } from '@/utils/feedback';
import { t } from '@/utils/i18n';
import { authRequest, getErrorMessage } from './request';

interface ErrorLike {
  reason?: string;
  message?: string;
  status?: number;
  metadata?: Record<string, string>;
  response?: {
    status?: number;
    data?: {
      reason?: string;
      message?: string;
      metadata?: Record<string, string>;
    };
  };
}

/** 取后端 Kratos Status 的 reason（网络错误等无响应体时为 undefined；流式请求的错误对象直接带 reason） */
export const getErrorReason = (error: unknown): string | undefined => {
  const err = error as ErrorLike | undefined;
  return err?.response?.data?.reason ?? err?.reason;
};

/** 取后端 Kratos Status 的 metadata */
export const getErrorMetadata = (
  error: unknown,
): Record<string, string> | undefined => {
  const err = error as ErrorLike | undefined;
  return err?.response?.data?.metadata ?? err?.metadata;
};

/** 取 HTTP 状态码（网络错误等无响应时为 undefined） */
export const getErrorStatus = (error: unknown): number | undefined => {
  const err = error as ErrorLike | undefined;
  return err?.response?.status ?? err?.status;
};

/** 取后端 Kratos Status 的 message（英文原文，作为具体原因附在本地化文案之后） */
const getErrorDetail = (error: unknown): string | undefined => {
  const err = error as ErrorLike | undefined;
  return err?.response?.data?.message ?? err?.message;
};

/**
 * 查询参数 → 查询串：数组展开为重复键（statuses=1&statuses=2，与后端 repeated 查询参数的
 * 绑定方式一致），undefined / null / 空串跳过。
 */
export const serializeRepeatedParams = (
  params: Record<string, unknown>,
): string => {
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

export interface DomainRequestOptions extends RequestOptions {
  /** 静默：失败不弹提示，由调用方自行展示 */
  silent?: boolean;
}

/** reason + 后端 message（+ metadata）→ 当前语言的提示；不认识的 reason 原样返回后端 message */
export type ReasonText = (
  reason: string | undefined,
  detail: string | undefined,
  metadata?: Record<string, string>,
) => string | undefined;

interface DomainRequestConfig {
  /** 错误码文案键前缀：reason → `${reasonPrefix}.${reason}` */
  reasonPrefix: string;
  /** 有对应文案的错误码；true = 后端 message 带具体原因（哪一项不合法、被谁引用……），附在文案之后 */
  reasonsWithDetail: Record<string, boolean>;
  /** 个别错误码的文案键不按 `${reasonPrefix}.${reason}` 命名时在此指定 */
  textIds?: Record<string, string>;
  /** 带 metadata 的定制提示（如引用计数、认领人）；返回 undefined 则走通用映射 */
  metadataText?: (
    reason: string,
    metadata: Record<string, string>,
  ) => string | undefined;
  /**
   * 401 且令牌仍在（刷新令牌遇到暂时性故障，没有登出）时提示「请求失败，请重试」。
   * 域请求恒以 silent 调用 authRequest，后者这时不会提示；开启后由这里补上同一句。
   */
  retryHintOn401?: boolean;
}

/**
 * 生成一个域的请求层：
 * - reasonText：reason + 后端 message → 本地化文案（批量操作的逐条结果也用它）；
 * - getErrorMessage：错误 → 展示文案（该域的错误码映射；不认识的错误码回退后端 message）；
 * - request：数组查询参数按重复键序列化；失败时提示该域的本地化文案。
 * 401 的刷新 / 跳转登录由 authRequest 处理，这里不重复提示。
 */
export const createDomainRequest = ({
  reasonPrefix,
  reasonsWithDetail,
  textIds,
  metadataText,
  retryHintOn401,
}: DomainRequestConfig) => {
  const reasonText: ReasonText = (reason, detail, metadata) => {
    if (!reason || !(reason in reasonsWithDetail)) return detail;
    const special = metadata && metadataText?.(reason, metadata);
    if (special) return special;
    const text = t(textIds?.[reason] ?? `${reasonPrefix}.${reason}`);
    return reasonsWithDetail[reason] && detail
      ? t('app.request.withDetail', { text, detail })
      : text;
  };

  const domainErrorMessage = (error: unknown, fallback?: string): string => {
    const reason = getErrorReason(error);
    return (
      (reason &&
        reasonText(reason, getErrorDetail(error), getErrorMetadata(error))) ||
      getErrorMessage(error, fallback)
    );
  };

  const domainRequest = async <T>(
    url: string,
    options: DomainRequestOptions = {},
  ): Promise<T> => {
    const { silent, ...rest } = options;
    try {
      return await authRequest<T>(url, {
        ...rest,
        paramsSerializer: serializeRepeatedParams,
        silent: true,
      });
    } catch (error) {
      if (silent) throw error;
      if (getErrorStatus(error) !== 401) {
        message.error(domainErrorMessage(error));
      } else if (retryHintOn401 && getAccessToken() !== null) {
        message.error(t('app.request.retry'));
      }
      throw error;
    }
  };

  return {
    reasonText,
    getErrorMessage: domainErrorMessage,
    request: domainRequest,
  };
};
