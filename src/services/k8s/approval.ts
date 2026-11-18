/**
 * 变更审批在请求层用到的两件事（不依赖请求包装，避免循环引用）：
 * 「紧急变更（免审批）」开关，与写操作被转为变更单时的通知。
 */
export const CHANGE_SUBMITTED = 'K8S_CHANGE_SUBMITTED';
export const EMERGENCY_HEADER = 'X-K8s-Emergency';
/** 请求层在写操作被转为变更单时派发的窗口事件（detail: ChangeSubmitted） */
export const CHANGE_SUBMITTED_EVENT = 'k8s-change-submitted';

export interface ChangeSubmitted {
  changeId: string;
  ticketId: string;
  ticketNumber: string;
}

// ---------------------------------------------------------------------------
// 紧急变更（免审批）开关：只对一个集群生效，由作用域栏里的开关控制；离开页面即关闭。
// 是否真的允许由服务端按接口授权判定，这里只决定要不要带上请求头。
// ---------------------------------------------------------------------------

let emergencyCluster = '';
const listeners = new Set<() => void>();

export const getEmergencyCluster = (): string => emergencyCluster;

export const setEmergencyCluster = (clusterId: string) => {
  if (emergencyCluster === clusterId) return;
  emergencyCluster = clusterId;
  for (const fn of listeners) fn();
};

export const subscribeEmergency = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** 当前页面所在的、变更需审批的集群（由 ApprovalBar 维护；各弹窗里的说明据此显示）；没有为空串 */
let approvalCluster = '';

export const getApprovalCluster = (): string => approvalCluster;

export const setApprovalCluster = (clusterId: string) => {
  if (approvalCluster === clusterId) return;
  approvalCluster = clusterId;
  for (const fn of listeners) fn();
};

/** 该请求地址是否属于开启了紧急变更的集群 */
export const emergencyHeaders = (url: string): Record<string, string> =>
  emergencyCluster && url.includes(`/k8s/cluster/${emergencyCluster}/`)
    ? { [EMERGENCY_HEADER]: '1' }
    : {};

/** 写操作被转为变更单：通知页面（ApprovalBar 监听并展示带链接的提示） */
export const announceSubmitted = (metadata?: Record<string, string>) => {
  window.dispatchEvent(
    new CustomEvent<ChangeSubmitted>(CHANGE_SUBMITTED_EVENT, {
      detail: {
        changeId: metadata?.change_id ?? '',
        ticketId: metadata?.ticket_id ?? '',
        ticketNumber: metadata?.ticket_number ?? '',
      },
    }),
  );
};
