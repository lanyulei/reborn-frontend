/**
 * 作业中心域请求包装（公共内核见 @/services/system/domainRequest）：
 * 1. 查询串里的数组按「重复键」序列化（statuses=1&statuses=2），与后端 repeated 查询参数的绑定方式一致；
 * 2. 常见业务错误码（乐观锁冲突、目标主机越权等）提示本地化文案，其余错误沿用后端文案。
 */
import {
  createDomainRequest,
  type DomainRequestOptions,
} from '@/services/system/domainRequest';

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
  | 'JOB_SCHEDULE_INVALID'
  | 'JOB_TRIGGER_INVALID'
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
  JOB_SCHEDULE_INVALID: 'pages.job.error.scheduleInvalid',
  JOB_TRIGGER_INVALID: 'pages.job.error.triggerInvalid',
};

/** 文案之后附后端 message 的错误码：不合法的具体原因（Cron、模板版本已变等）只有后端知道 */
const REASONS_WITH_DETAIL: ReadonlySet<JobErrorReason> = new Set([
  'JOB_SCHEDULE_INVALID',
  'JOB_TRIGGER_INVALID',
]);

const domain = createDomainRequest({
  reasonPrefix: 'pages.job.error',
  // 作业中心的文案键是驼峰短名（见 REASON_TEXT_ID），不按 reason 命名；
  // 仅 REASONS_WITH_DETAIL 里的错误码附后端 message
  reasonsWithDetail: Object.fromEntries(
    Object.keys(REASON_TEXT_ID).map((reason) => [
      reason,
      REASONS_WITH_DETAIL.has(reason as JobErrorReason),
    ]),
  ),
  textIds: REASON_TEXT_ID,
});

export {
  getErrorReason,
  getErrorStatus,
} from '@/services/system/domainRequest';

/** 错误 → 展示文案：有固定文案的错误码用本地化文案，否则用后端 message */
export const getJobErrorMessage = domain.getErrorMessage;

export type JobRequestOptions = DomainRequestOptions;

export const jobRequest = domain.request;
