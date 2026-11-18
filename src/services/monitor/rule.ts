/**
 * MonitorRuleService 告警规则：一条规则 = 一组 PromQL 查询（每条对应一个级别）+ 判定时间参数 +
 * 生效时间 + 事件内容 + 通知配置。查看要求对所在分组「只读」以上，修改类要求「可管理」
 * （403 MONITOR_FORBIDDEN）。每次保存记一个版本，可查看历史并回滚。
 */
import type { PagedResult, PageQuery } from '@/services/system/typings';
import { monitorRequest } from './request';
import type {
  BatchRulesBody,
  BatchRulesResult,
  ExportRulesResult,
  ImportConflictPolicy,
  ImportPreviewResult,
  ImportRulesOptions,
  ImportRulesResult,
  MonitorEvalStatus,
  MonitorRule,
  MonitorRuleOptions,
  MonitorSeverity,
  RuleEvalRecord,
  RuleExprResult,
  RuleSpec,
  RuleTemplatePack,
  RuleTemplatePackDetail,
  RuleVersion,
  SimulateRuleBody,
  SimulateRuleResult,
} from './typings';

export interface ListRulesParams extends PageQuery {
  /** 分组过滤（含全部下级） */
  groupId?: string;
  severity?: MonitorSeverity;
  datasourceId?: string;
  enabled?: boolean;
  firing?: boolean;
  lastStatus?: MonitorEvalStatus;
  /** 附加标签过滤，每项形如 name=value，至多 5 项 */
  labels?: string[];
  /** 引用了该升级策略的规则 */
  escalationId?: string;
}

/** ListRules 分页查询告警规则（仅数据范围内），带当前评估状态 */
export async function listRules(
  params: ListRulesParams,
  options?: { silent?: boolean },
): Promise<PagedResult<MonitorRule>> {
  return monitorRequest<PagedResult<MonitorRule>>('/api/v1/monitor/rule', {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

/** GetRule 查询规则详情（含在各数据源上的评估状态） */
export async function getRule(id: string): Promise<{ rule: MonitorRule }> {
  return monitorRequest<{ rule: MonitorRule }>(`/api/v1/monitor/rule/${id}`, {
    method: 'GET',
  });
}

/** CreateRule 新建规则；同分组内名称重复 409 */
export async function createRule(
  spec: RuleSpec,
): Promise<{ rule: MonitorRule }> {
  return monitorRequest<{ rule: MonitorRule }>('/api/v1/monitor/rule', {
    method: 'POST',
    data: { spec },
  });
}

/** UpdateRule 编辑规则（整体替换）；version 不一致 409 */
export async function updateRule(
  id: string,
  body: { spec: RuleSpec; version: number; summary?: string },
): Promise<{ rule: MonitorRule }> {
  return monitorRequest<{ rule: MonitorRule }>(`/api/v1/monitor/rule/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteRule 删除规则；其活跃告警随之关闭（不发恢复通知） */
export async function deleteRule(id: string): Promise<void> {
  await monitorRequest<void>(`/api/v1/monitor/rule/${id}`, {
    method: 'DELETE',
  });
}

/** ToggleRule 启用或停用规则；停用后其活跃告警随之关闭（不发恢复通知） */
export async function toggleRule(
  id: string,
  enabled: boolean,
): Promise<{ rule: MonitorRule }> {
  return monitorRequest<{ rule: MonitorRule }>(
    `/api/v1/monitor/rule/${id}:toggle`,
    { method: 'POST', data: { enabled } },
  );
}

/** CloneRule 克隆规则；新规则缺省停用，不传名称为「原名称 - 副本」 */
export async function cloneRule(
  id: string,
  body: { name?: string; groupId?: string },
): Promise<{ rule: MonitorRule }> {
  return monitorRequest<{ rule: MonitorRule }>(
    `/api/v1/monitor/rule/${id}:clone`,
    { method: 'POST', data: body },
  );
}

/** BatchRules 批量操作（至多 200 条）；逐条独立执行，结果逐条返回 */
export async function batchRules(
  body: BatchRulesBody,
): Promise<BatchRulesResult> {
  return monitorRequest<BatchRulesResult>('/api/v1/monitor/rule:batch', {
    method: 'POST',
    data: body,
  });
}

/** ListRuleVersions 分页查询规则的变更历史（按版本号倒序，不含快照内容） */
export async function listRuleVersions(
  id: string,
  params: { page?: number; pageSize?: number },
): Promise<PagedResult<RuleVersion>> {
  return monitorRequest<PagedResult<RuleVersion>>(
    `/api/v1/monitor/rule/${id}/version`,
    { method: 'GET', params },
  );
}

/** GetRuleVersion 查询规则某个历史版本的完整内容 */
export async function getRuleVersion(
  id: string,
  version: number,
): Promise<{ version: RuleVersion }> {
  return monitorRequest<{ version: RuleVersion }>(
    `/api/v1/monitor/rule/${id}/version/${version}`,
    { method: 'GET' },
  );
}

/** RollbackRule 回滚到某个历史版本的内容（生成一个新版本）；currentVersion 不一致 409 */
export async function rollbackRule(
  id: string,
  body: { version: number; currentVersion: number },
): Promise<{ rule: MonitorRule }> {
  return monitorRequest<{ rule: MonitorRule }>(
    `/api/v1/monitor/rule/${id}:rollback`,
    { method: 'POST', data: body },
  );
}

/** ValidateRuleExprs 校验 PromQL 语法（不保存），逐条返回结果 */
export async function validateRuleExprs(body: {
  exprs: string[];
  /** 不传使用缺省数据源 */
  datasourceId?: string;
}): Promise<{ results?: RuleExprResult[] }> {
  return monitorRequest<{ results?: RuleExprResult[] }>(
    '/api/v1/monitor/rule:validate',
    { method: 'POST', data: body },
  );
}

/**
 * PreviewImportRules 导入预览，不落库：内容是 Prometheus / vmalert 规则 YAML，或本系统导出的
 * JSON（首个非空白字符是 `{` 即按 JSON 处理）
 */
export async function previewImportRules(
  options: ImportRulesOptions,
): Promise<ImportPreviewResult> {
  return monitorRequest<ImportPreviewResult>(
    '/api/v1/monitor/rule:import-preview',
    { method: 'POST', data: { options } },
  );
}

/** ImportRules 导入到指定分组；逐条独立执行并返回结果 */
export async function importRules(body: {
  options: ImportRulesOptions;
  onConflict: ImportConflictPolicy;
  enabled: boolean;
}): Promise<ImportRulesResult> {
  return monitorRequest<ImportRulesResult>('/api/v1/monitor/rule:import', {
    method: 'POST',
    data: body,
  });
}

/** 导出格式：yaml = Prometheus / vmalert 规则（对外交换）；json = 本系统完整格式（可再导入） */
export type ExportRulesFormat = 'yaml' | 'json';

/** ExportRules 导出规则；ids 与 groupId 至少给一个，文件名随格式由后端给出 */
export async function exportRules(body: {
  ids?: string[];
  groupId?: string;
  format: ExportRulesFormat;
}): Promise<ExportRulesResult> {
  return monitorRequest<ExportRulesResult>('/api/v1/monitor/rule:export', {
    method: 'POST',
    data: body,
  });
}

export interface ListRuleEvalRecordsParams {
  page?: number;
  pageSize?: number;
  datasourceId?: string;
  status?: Exclude<MonitorEvalStatus, 0>;
  evalTimeStart?: string;
  evalTimeEnd?: string;
}

/** ListRuleEvalRecords 分页查询规则的判定记录（保留 7 天，按评估时间倒序） */
export async function listRuleEvalRecords(
  id: string,
  params: ListRuleEvalRecordsParams,
): Promise<PagedResult<RuleEvalRecord>> {
  return monitorRequest<PagedResult<RuleEvalRecord>>(
    `/api/v1/monitor/rule/${id}/eval-record`,
    { method: 'GET', params },
  );
}

/** ListRuleTemplatePacks 列出内置的规则模板包（按类别、名称排序） */
export async function listRuleTemplatePacks(): Promise<{
  items?: RuleTemplatePack[];
}> {
  return monitorRequest<{ items?: RuleTemplatePack[] }>(
    '/api/v1/monitor/rule-template',
    { method: 'GET' },
  );
}

/**
 * GetRuleTemplatePack 查看一个模板包：逐条规则的摘要与规则 YAML 原文。一键导入 = 把 content
 * 作为 ImportRulesOptions.content 走已有的导入预览 / 导入
 */
export async function getRuleTemplatePack(
  code: string,
): Promise<RuleTemplatePackDetail> {
  return monitorRequest<RuleTemplatePackDetail>(
    `/api/v1/monitor/rule-template/${encodeURIComponent(code)}`,
    { method: 'GET' },
  );
}

/**
 * SimulateRule 模拟触发（不保存规则、不产生告警事件）：按给出的规则内容走与评估引擎相同的处理
 * 流程并逐阶段返回结果；send=true 时另外真实发送一条带 [TEST] 标记的通知。要求对规则所在分组
 * 「可管理」。失败由调用方展示（silent）。
 */
export async function simulateRule(
  body: SimulateRuleBody,
): Promise<SimulateRuleResult> {
  return monitorRequest<SimulateRuleResult>('/api/v1/monitor/rule:simulate', {
    method: 'POST',
    data: body,
    silent: true,
  });
}

/**
 * ListMonitorRuleOptions 规则表单里第二、三期配置项的候选项（工单模板、流程定义、CMDB 模型 /
 * 环境 / 可关联属性、AI 是否可用）。随规则的新建 / 编辑与事件的转工单权限开放；失败由调用方处理。
 */
export async function listRuleOptions(): Promise<MonitorRuleOptions> {
  return monitorRequest<MonitorRuleOptions>('/api/v1/monitor/rule-option', {
    method: 'GET',
    silent: true,
  });
}
