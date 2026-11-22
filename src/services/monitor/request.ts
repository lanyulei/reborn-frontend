/**
 * 监控告警域请求包装（公共内核见 @/services/system/domainRequest）：
 * 1. 查询串里的数组按「重复键」序列化（statuses=1&statuses=2），与后端 repeated 查询参数的绑定方式一致；
 * 2. 错误提示按后端的 MONITOR_* reason 映射成当前语言的文案（后端 message 是英文）；
 *    不认识的 reason 回退到后端 message。
 */
import { createDomainRequest } from '@/services/system/domainRequest';
import { t } from '@/utils/i18n';

const domain = createDomainRequest({
  reasonPrefix: 'pages.monitor.error',
  /**
   * 有对应文案的错误码（后端 monitor.v1.ErrorReason，文案键 pages.monitor.error.<reason>）。
   * true = 后端 message 带有具体原因（哪一项不合法、被谁引用、上游返回了什么），附在文案之后。
   */
  reasonsWithDetail: {
    MONITOR_FORBIDDEN: false,
    MONITOR_VERSION_CONFLICT: false,
    MONITOR_TIME_RANGE_INVALID: true,
    MONITOR_SECRET_UNAVAILABLE: false,
    MONITOR_NOT_IMPLEMENTED: false,
    MONITOR_DATASOURCE_NOT_FOUND: false,
    MONITOR_DATASOURCE_NAME_EXISTS: false,
    MONITOR_DATASOURCE_INVALID: true,
    MONITOR_DATASOURCE_IN_USE: true,
    MONITOR_DATASOURCE_DISABLED: false,
    MONITOR_DATASOURCE_UNREACHABLE: true,
    MONITOR_QUERY_INVALID: true,
    MONITOR_QUERY_BUSY: false,
    MONITOR_DATASOURCE_SECRET_REQUIRED: false,
    MONITOR_DATASOURCE_ADDRESS_BLOCKED: false,
    MONITOR_GROUP_NOT_FOUND: false,
    MONITOR_GROUP_NAME_EXISTS: false,
    MONITOR_GROUP_IN_USE: false,
    MONITOR_GROUP_INVALID: true,
    MONITOR_ROLE_SCOPE_INVALID: true,
    MONITOR_RULE_NOT_FOUND: false,
    MONITOR_RULE_NAME_EXISTS: false,
    MONITOR_RULE_INVALID: true,
    MONITOR_RULE_VERSION_NOT_FOUND: false,
    MONITOR_RULE_BATCH_INVALID: true,
    MONITOR_RULE_IMPORT_INVALID: true,
    MONITOR_RULE_TEMPLATE_NOT_FOUND: false,
    MONITOR_SIMULATE_INVALID: true,
    MONITOR_ALERT_NOT_FOUND: false,
    MONITOR_ALERT_NOT_FIRING: false,
    MONITOR_ALERT_ALREADY_ACKED: false,
    MONITOR_ALERT_ACTION_INVALID: true,
    MONITOR_ALERT_TICKET_EXISTS: false,
    MONITOR_ALERT_VIEW_NOT_FOUND: false,
    MONITOR_ALERT_VIEW_NAME_EXISTS: false,
    MONITOR_ALERT_VIEW_INVALID: true,
    MONITOR_MUTE_NOT_FOUND: false,
    MONITOR_MUTE_INVALID: true,
    MONITOR_SUBSCRIPTION_NOT_FOUND: false,
    MONITOR_SUBSCRIPTION_INVALID: true,
    MONITOR_ESCALATION_NOT_FOUND: false,
    MONITOR_ESCALATION_NAME_EXISTS: false,
    MONITOR_ESCALATION_INVALID: true,
    MONITOR_ESCALATION_IN_USE: false,
    MONITOR_INHIBIT_NOT_FOUND: false,
    MONITOR_INHIBIT_INVALID: true,
    MONITOR_RECORD_RULE_NOT_FOUND: false,
    MONITOR_RECORD_RULE_NAME_EXISTS: false,
    MONITOR_RECORD_RULE_INVALID: true,
    MONITOR_RECORD_RULE_NO_WRITE_URL: false,
  },
  metadataText: (reason, metadata) => {
    // 分组仍被屏蔽规则 / 订阅引用：附加信息里带数量
    if (
      reason === 'MONITOR_GROUP_IN_USE' &&
      (metadata.mute_count || metadata.subscription_count)
    ) {
      return t('pages.monitor.error.MONITOR_GROUP_IN_USE.refs', {
        mutes: Number(metadata.mute_count ?? 0),
        subscriptions: Number(metadata.subscription_count ?? 0),
      });
    }
    // 已被他人认领：附加信息里带认领人
    if (reason === 'MONITOR_ALERT_ALREADY_ACKED' && metadata.ack_user_name) {
      return t('pages.monitor.error.MONITOR_ALERT_ALREADY_ACKED.by', {
        name: metadata.ack_user_name,
      });
    }
    // 升级策略仍被规则引用：附加信息里带规则数
    if (reason === 'MONITOR_ESCALATION_IN_USE' && metadata.rule_count) {
      return t('pages.monitor.error.MONITOR_ESCALATION_IN_USE.refs', {
        count: Number(metadata.rule_count),
      });
    }
    return undefined;
  },
  // 401 且令牌仍保留（刷新令牌遇到暂时性故障）时补一句「请求失败，请重试」：
  // 共享请求层此时会提示，这里因恒以 silent 调用 authRequest 而要自己补上
  retryHintOn401: true,
});

/**
 * reason + 后端 message → 当前语言的提示（批量操作的逐条结果也用它）。
 * 不认识的 reason 原样返回后端 message。
 */
export const monitorReasonText = domain.reasonText;

export { getErrorReason } from '@/services/system/domainRequest';

/** 请求失败的提示文案：MONITOR_* reason 取对应文案，其余沿用后端 message */
export const getMonitorErrorMessage = domain.getErrorMessage;

export const monitorRequest = domain.request;
