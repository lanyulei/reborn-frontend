/** UserSelect 的候选来源（稳定引用，可直接传给 fetchUsers）。 */
import { listTargetOptions } from '@/services/monitor/target';
import { listWorkflowUserCandidates } from '@/services/workflow/runtime';
import { userLabel } from './index';

/** 流程域的用户候选：转办 / 改派 / 设计器选人，以及工单里的人员字段、升级通知对象 */
export const fetchWorkflowUsers = async (keyword: string) => {
  const { items } = await listWorkflowUserCandidates(keyword);
  return (items ?? []).map((u) => ({ id: u.id, label: userLabel(u) }));
};

/** 监控告警域的用户候选：规则的通知对象、订阅的接收方、导入与批量设置通知对象 */
export const fetchMonitorUsers = async (keyword: string) => {
  const { users } = await listTargetOptions({ keyword, kinds: ['user'] });
  return (users ?? []).map((u) => ({ id: u.id, label: userLabel(u) }));
};
