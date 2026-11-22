/**
 * 故障管理域请求包装（公共内核见 @/services/system/domainRequest）：
 * 查询串数组按重复键序列化；错误提示按后端的 INCIDENT_* reason 映射成当前语言的文案，
 * 不认识的 reason 回退到后端 message。
 */
import { createDomainRequest } from '@/services/system/domainRequest';

const domain = createDomainRequest({
  reasonPrefix: 'pages.incident.error',
  /** 有对应文案的错误码（文案键 pages.incident.error.<reason>）；true = 后端 message 带具体原因，附在文案之后 */
  reasonsWithDetail: {
    INCIDENT_FORBIDDEN: false,
    INCIDENT_VERSION_CONFLICT: false,
    INCIDENT_TIME_RANGE_INVALID: true,
    INCIDENT_SECRET_UNAVAILABLE: false,
    INCIDENT_RATE_LIMITED: false,
    INCIDENT_NOT_FOUND: false,
    INCIDENT_INVALID: true,
    INCIDENT_STATE_INVALID: true,
    INCIDENT_ALERT_LINKED: false,
    INCIDENT_ALERT_NOT_FOUND: false,
    INCIDENT_REVIEW_REQUIRED: false,
    INCIDENT_AGENT_BUSY: false,
    INCIDENT_BUSINESS_NOT_FOUND: false,
    INCIDENT_BUSINESS_CODE_EXISTS: false,
    INCIDENT_BUSINESS_INVALID: true,
    INCIDENT_BUSINESS_IN_USE: true,
    INCIDENT_RULE_NOT_FOUND: false,
    INCIDENT_RULE_NAME_EXISTS: false,
    INCIDENT_RULE_INVALID: true,
    INCIDENT_PLAYBOOK_NOT_FOUND: false,
    INCIDENT_PLAYBOOK_NAME_EXISTS: false,
    INCIDENT_PLAYBOOK_INVALID: true,
    INCIDENT_PLAYBOOK_IN_USE: true,
    INCIDENT_PROPOSAL_NOT_FOUND: false,
    INCIDENT_PROPOSAL_INVALID: true,
    INCIDENT_PROPOSAL_NOT_PENDING: false,
    INCIDENT_PROPOSAL_DUPLICATE: false,
    INCIDENT_UPDATE_INVALID: true,
    INCIDENT_SHARE_NOT_FOUND: false,
    INCIDENT_SHARE_INVALID: true,
    INCIDENT_POSTMORTEM_INVALID: true,
    INCIDENT_POSTMORTEM_LOCKED: false,
    INCIDENT_ACTION_ITEM_NOT_FOUND: false,
    INCIDENT_SOURCE_NOT_FOUND: false,
    INCIDENT_SOURCE_NAME_EXISTS: false,
    INCIDENT_SOURCE_INVALID: true,
    INCIDENT_SOURCE_UNAUTHORIZED: false,
    INCIDENT_SOURCE_FORBIDDEN: false,
    INCIDENT_WEBHOOK_NOT_FOUND: false,
    INCIDENT_WEBHOOK_INVALID: true,
    INCIDENT_SETTING_INVALID: true,
    INCIDENT_CANDIDATE_NOT_FOUND: false,
    INCIDENT_AI_UNAVAILABLE: false,
  },
  retryHintOn401: true,
});

export const incidentReasonText = domain.reasonText;

export { getErrorReason } from '@/services/system/domainRequest';

/** 请求失败的提示文案：INCIDENT_* reason 取对应文案，其余沿用后端 message */
export const getIncidentErrorMessage = domain.getErrorMessage;

export const incidentRequest = domain.request;

/** 自定义动词路由（:transition 等）与资源路径拼接 */
export const BASE = '/api/v1/incident';
