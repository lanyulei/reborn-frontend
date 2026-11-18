/**
 * MonitorEscalationService 升级策略：告警持续未认领 / 未恢复时逐级通知更多的人。策略是独立可复用
 * 的对象，规则经 escalationId 引用。策略归属一个规则分组（该分组及其下级分组内的规则可引用），或
 * 为全局策略（groupId 留空，所有分组可引用，仅超级管理员可维护）。查看要求对归属分组「只读」
 * 以上，维护要求「可管理」。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { monitorRequest } from './request';
import type {
  EscalationEstimate,
  EscalationOption,
  EscalationSpec,
  MonitorEscalation,
  OncallGroupOption,
} from './typings';

export interface ListEscalationsParams extends PageQuery {
  /** 归属分组过滤（含全部下级） */
  groupId?: string;
  /** 只看全局策略（true）或只看分组策略（false） */
  global?: boolean;
  enabled?: boolean;
}

/** ListEscalations 分页查询升级策略（全局策略与数据范围内分组的策略） */
export async function listEscalations(
  params: ListEscalationsParams,
): Promise<PagedResult<MonitorEscalation>> {
  return monitorRequest<PagedResult<MonitorEscalation>>(
    '/api/v1/monitor/escalation',
    { method: 'GET', params },
  );
}

/** GetEscalation 查询升级策略详情 */
export async function getEscalation(
  id: string,
): Promise<{ escalation: MonitorEscalation }> {
  return monitorRequest<{ escalation: MonitorEscalation }>(
    `/api/v1/monitor/escalation/${id}`,
    { method: 'GET' },
  );
}

/** CreateEscalation 新建升级策略；同一归属下名称重复 409 */
export async function createEscalation(
  spec: EscalationSpec,
): Promise<{ escalation: MonitorEscalation }> {
  return monitorRequest<{ escalation: MonitorEscalation }>(
    '/api/v1/monitor/escalation',
    { method: 'POST', data: { spec } },
  );
}

/** UpdateEscalation 编辑升级策略（整体替换，归属分组不可更改）；version 不一致 409 */
export async function updateEscalation(
  id: string,
  body: { spec: EscalationSpec; version: number },
): Promise<{ escalation: MonitorEscalation }> {
  return monitorRequest<{ escalation: MonitorEscalation }>(
    `/api/v1/monitor/escalation/${id}`,
    { method: 'PUT', data: body },
  );
}

/** DeleteEscalation 删除升级策略；仍被规则引用 409 MONITOR_ESCALATION_IN_USE */
export async function deleteEscalation(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/escalation/${id}`, {
    method: 'DELETE',
  });
}

/**
 * EstimateEscalation 估算通知量（不保存）：一条始终无人认领、始终不恢复的告警在 24 小时内最多
 * 发出多少次通知。表单联动时调用，恒静默（表单尚未填完时 400 是常态）。
 */
export async function estimateEscalation(body: {
  spec: EscalationSpec;
  ruleRepeatIntervalM?: number;
  ruleMaxNotify?: number;
}): Promise<{ estimate?: EscalationEstimate | null }> {
  return monitorRequest<{ estimate?: EscalationEstimate | null }>(
    '/api/v1/monitor/escalation:estimate',
    { method: 'POST', data: body, silent: true },
  );
}

/**
 * ListEscalationOptions 规则表单的升级策略候选：该分组内的规则可引用的已启用策略（全局策略在前）。
 * 须对该分组「只读」以上；失败由调用方处理。
 */
export async function listEscalationOptions(
  groupId: string,
): Promise<{ items?: EscalationOption[] }> {
  return monitorRequest<{ items?: EscalationOption[] }>(
    '/api/v1/monitor/escalation-option',
    { method: 'GET', params: { groupId }, silent: true },
  );
}

/** ListOncallGroupOptions 值班分组候选项（升级策略的通知对象）；失败由调用方处理 */
export async function listOncallGroupOptions(): Promise<{
  items?: OncallGroupOption[];
}> {
  return monitorRequest<{ items?: OncallGroupOption[] }>(
    '/api/v1/monitor/oncall-group-option',
    { method: 'GET', silent: true },
  );
}
