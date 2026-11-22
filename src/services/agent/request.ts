/**
 * 运维 Agent 域请求包装（公共内核见 @/services/system/domainRequest）：
 * 错误提示按后端的 AGENT_* reason 映射成当前语言的文案，不认识的 reason 回退到后端 message。
 */
import { createDomainRequest } from '@/services/system/domainRequest';

const domain = createDomainRequest({
  reasonPrefix: 'pages.agent.error',
  /** 有对应文案的错误码（文案键 pages.agent.error.<reason>）；true = 后端 message 带具体原因，附在文案之后 */
  reasonsWithDetail: {
    AGENT_PROFILE_NOT_FOUND: false,
    AGENT_PROFILE_INVALID: true,
    AGENT_PROFILE_NAME_EXISTS: false,
    AGENT_VERSION_CONFLICT: false,
    AGENT_TASK_NOT_FOUND: false,
    AGENT_TASK_STATE_INVALID: true,
    AGENT_RUN_NOT_FOUND: false,
    AGENT_FORBIDDEN: false,
    AGENT_DISABLED: false,
    AGENT_ACCOUNT_INVALID: false,
    AGENT_TASK_EXISTS: false,
    AGENT_PROFILE_IN_USE: true,
    AGENT_TIME_RANGE_INVALID: false,
  },
  retryHintOn401: true,
});

export const agentReasonText = domain.reasonText;

/** 请求失败的提示文案：AGENT_* reason 取对应文案，其余沿用后端 message */
export const getAgentErrorMessage = domain.getErrorMessage;

export const agentRequest = domain.request;
