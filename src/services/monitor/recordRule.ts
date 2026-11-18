/**
 * MonitorRecordRuleService 记录规则：按固定频率预计算一条 PromQL，经数据源的 Remote Write 地址
 * 写回为新指标（名称即指标名）。数据源须配置了 Remote Write 地址
 * （400 MONITOR_RECORD_RULE_NO_WRITE_URL）。查看要求对所在分组「只读」以上，维护要求「可管理」。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { monitorRequest } from './request';
import type {
  MonitorRecordRule,
  MonitorRecordStatus,
  RecordRuleSpec,
  RecordRuleValidateResult,
} from './typings';

export interface ListRecordRulesParams extends PageQuery {
  /** 分组过滤（含全部下级） */
  groupId?: string;
  datasourceId?: string;
  enabled?: boolean;
  lastStatus?: MonitorRecordStatus;
}

/** ListRecordRules 分页查询记录规则 */
export async function listRecordRules(
  params: ListRecordRulesParams,
): Promise<PagedResult<MonitorRecordRule>> {
  return monitorRequest<PagedResult<MonitorRecordRule>>(
    '/api/v1/monitor/record-rule',
    { method: 'GET', params },
  );
}

/** GetRecordRule 查询记录规则详情 */
export async function getRecordRule(
  id: string,
): Promise<{ recordRule: MonitorRecordRule }> {
  return monitorRequest<{ recordRule: MonitorRecordRule }>(
    `/api/v1/monitor/record-rule/${id}`,
    { method: 'GET' },
  );
}

/** CreateRecordRule 新建记录规则；同一分组、同一数据源下指标名重复 409 */
export async function createRecordRule(
  spec: RecordRuleSpec,
): Promise<{ recordRule: MonitorRecordRule }> {
  return monitorRequest<{ recordRule: MonitorRecordRule }>(
    '/api/v1/monitor/record-rule',
    { method: 'POST', data: { spec } },
  );
}

/** UpdateRecordRule 编辑记录规则（整体替换）；version 不一致 409 */
export async function updateRecordRule(
  id: string,
  body: { spec: RecordRuleSpec; version: number },
): Promise<{ recordRule: MonitorRecordRule }> {
  return monitorRequest<{ recordRule: MonitorRecordRule }>(
    `/api/v1/monitor/record-rule/${id}`,
    { method: 'PUT', data: body },
  );
}

/** DeleteRecordRule 删除记录规则（已写回的指标数据不受影响） */
export async function deleteRecordRule(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/record-rule/${id}`, {
    method: 'DELETE',
  });
}

/** ToggleRecordRule 启用或停用记录规则 */
export async function toggleRecordRule(
  id: string,
  enabled: boolean,
): Promise<{ recordRule: MonitorRecordRule }> {
  return monitorRequest<{ recordRule: MonitorRecordRule }>(
    `/api/v1/monitor/record-rule/${id}:toggle`,
    { method: 'POST', data: { enabled } },
  );
}

/**
 * ValidateRecordRule 校验（不保存）：表达式、指标名、附加标签、数据源是否可写、是否重名，逐项
 * 返回问题。id = 正在编辑的规则（判断重名时把它自己排除在外）。
 */
export async function validateRecordRule(body: {
  spec: RecordRuleSpec;
  id?: string;
}): Promise<RecordRuleValidateResult> {
  return monitorRequest<RecordRuleValidateResult>(
    '/api/v1/monitor/record-rule:validate',
    { method: 'POST', data: body },
  );
}
