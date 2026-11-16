/**
 * 流程域的枚举元数据与候选数据适配：状态 → 徽标 / 标签色、动作 → 时间线颜色，
 * 以及把流程域的候选接口适配成通用选择器 / 设计器需要的形状。
 */
import { userLabel } from '@/components/UserSelect';
import { listWorkflowUserCandidates } from '@/services/workflow/runtime';
import type {
  AssigneeStatus,
  DefinitionStatus,
  HistoryAction,
  InstanceStatus,
} from '@/services/workflow/typings';
import type { EnumMeta } from '@/utils/i18n';

/** 流程定义状态 */
export const DEFINITION_STATUS_META: EnumMeta<DefinitionStatus> = {
  1: { textId: 'common.status.enabled', status: 'Success' },
  0: { textId: 'common.status.disabled', status: 'Default' },
};
export const DEFINITION_STATUS_ORDER: readonly DefinitionStatus[] = [1, 0];

/** 实例状态 */
export const INSTANCE_STATUS_META: EnumMeta<InstanceStatus> = {
  1: { textId: 'enum.workflow.instance.1', status: 'Processing' },
  2: { textId: 'enum.workflow.instance.2', status: 'Success' },
  3: { textId: 'enum.workflow.instance.3', status: 'Error' },
  4: { textId: 'enum.workflow.instance.4', status: 'Default' },
  5: { textId: 'enum.workflow.instance.5', status: 'Warning' },
};

/** 处理人状态（已办列表「我的处理结果」、详情里的处理人标签） */
export const ASSIGNEE_STATUS_META: Record<
  AssigneeStatus,
  { textId: string; color?: string }
> = {
  1: { textId: 'enum.workflow.assignee.1', color: 'processing' },
  2: { textId: 'enum.workflow.assignee.2' },
  3: { textId: 'enum.workflow.assignee.3', color: 'success' },
  4: { textId: 'enum.workflow.assignee.4', color: 'error' },
  5: { textId: 'enum.workflow.assignee.5' },
  6: { textId: 'enum.workflow.assignee.6' },
  7: { textId: 'enum.workflow.assignee.7', color: 'warning' },
  8: { textId: 'enum.workflow.assignee.8' },
  9: { textId: 'enum.workflow.assignee.9' },
};

/** 流转动作 → 时间线节点颜色 */
export const HISTORY_ACTION_COLOR: Record<HistoryAction, string> = {
  start: 'blue',
  approve: 'green',
  reject: 'red',
  return: 'orange',
  transfer: 'blue',
  reassign: 'orange',
  skip: 'gray',
  cc: 'gray',
  cancel: 'gray',
  terminate: 'red',
  complete: 'green',
  addSign: 'blue',
  delegate: 'blue',
  reply: 'blue',
  handover: 'orange',
  amend: 'blue',
  conditionError: 'orange',
  timeout: 'orange',
  timer: 'gray',
  service: 'green',
  serviceFailed: 'red',
  subProcess: 'blue',
};

/** 流程域的用户候选（转办 / 改派 / 设计器选人；稳定引用，可直接传给 UserSelect） */
export const fetchWorkflowUsers = async (keyword: string) => {
  const { items } = await listWorkflowUserCandidates(keyword);
  return (items ?? []).map((u) => ({ id: u.id, label: userLabel(u) }));
};
