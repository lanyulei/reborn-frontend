/**
 * IncidentConfigService：触发规则、业务字典、处置预案、接入源、Webhook、设置。
 */
import type { PagedResult } from '@/services/system/typings';
import { incidentRequest } from './request';
import type {
  Business,
  BusinessSpec,
  IncidentRule,
  IncidentSettings,
  IncidentSourceClient,
  IncidentWebhook,
  Playbook,
  PlaybookSpec,
  PlaybookTarget,
  RuleSpec,
  SettingsResult,
  SourceSpec,
  TestRuleResult,
  WebhookSpec,
} from './typings';

export interface ListConfigParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  enabled?: boolean;
}

// ---- 触发规则 ----

const RULE = '/api/v1/incident-rule';

export async function listRules(
  params: ListConfigParams,
): Promise<PagedResult<IncidentRule>> {
  return incidentRequest<PagedResult<IncidentRule>>(RULE, {
    method: 'GET',
    params,
  });
}

export async function getRule(id: string): Promise<IncidentRule> {
  const { rule } = await incidentRequest<{ rule: IncidentRule }>(
    `${RULE}/${id}`,
    { method: 'GET' },
  );
  return rule;
}

export async function createRule(spec: RuleSpec): Promise<IncidentRule> {
  const { rule } = await incidentRequest<{ rule: IncidentRule }>(RULE, {
    method: 'POST',
    data: { spec },
  });
  return rule;
}

export async function updateRule(
  id: string,
  spec: RuleSpec,
  version: number,
): Promise<IncidentRule> {
  const { rule } = await incidentRequest<{ rule: IncidentRule }>(
    `${RULE}/${id}`,
    { method: 'PUT', data: { spec, version } },
  );
  return rule;
}

export async function deleteRule(id: string): Promise<void> {
  await incidentRequest(`${RULE}/${id}`, { method: 'DELETE' });
}

/** 回放最近 hours 小时的告警，看规则会怎样归并（不落库） */
export async function testRule(
  spec: RuleSpec,
  hours: number,
): Promise<TestRuleResult> {
  return incidentRequest<TestRuleResult>(`${RULE}:test`, {
    method: 'POST',
    data: { spec, hours },
  });
}

// ---- 业务字典 ----

const BUSINESS = '/api/v1/incident-business';

export async function listBusinesses(
  params: ListConfigParams,
  options?: { silent?: boolean },
): Promise<PagedResult<Business>> {
  return incidentRequest<PagedResult<Business>>(BUSINESS, {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

export async function createBusiness(spec: BusinessSpec): Promise<Business> {
  const { business } = await incidentRequest<{ business: Business }>(BUSINESS, {
    method: 'POST',
    data: { spec },
  });
  return business;
}

export async function updateBusiness(
  id: string,
  spec: BusinessSpec,
  version: number,
): Promise<Business> {
  const { business } = await incidentRequest<{ business: Business }>(
    `${BUSINESS}/${id}`,
    { method: 'PUT', data: { spec, version } },
  );
  return business;
}

export async function deleteBusiness(id: string): Promise<void> {
  await incidentRequest(`${BUSINESS}/${id}`, { method: 'DELETE' });
}

// ---- 处置预案 ----

const PLAYBOOK = '/api/v1/incident-playbook';

export async function listPlaybooks(
  params: ListConfigParams,
  options?: { silent?: boolean },
): Promise<PagedResult<Playbook>> {
  return incidentRequest<PagedResult<Playbook>>(PLAYBOOK, {
    method: 'GET',
    params,
    silent: options?.silent,
  });
}

export async function getPlaybook(id: string): Promise<Playbook> {
  const { playbook } = await incidentRequest<{ playbook: Playbook }>(
    `${PLAYBOOK}/${id}`,
    { method: 'GET' },
  );
  return playbook;
}

export async function createPlaybook(spec: PlaybookSpec): Promise<Playbook> {
  const { playbook } = await incidentRequest<{ playbook: Playbook }>(PLAYBOOK, {
    method: 'POST',
    data: { spec },
  });
  return playbook;
}

export async function updatePlaybook(
  id: string,
  spec: PlaybookSpec,
  version: number,
): Promise<Playbook> {
  const { playbook } = await incidentRequest<{ playbook: Playbook }>(
    `${PLAYBOOK}/${id}`,
    { method: 'PUT', data: { spec, version } },
  );
  return playbook;
}

export async function deletePlaybook(id: string): Promise<void> {
  await incidentRequest(`${PLAYBOOK}/${id}`, { method: 'DELETE' });
}

/** 预案步骤可选的目标：当前用户能运行的作业模板与流程定义 */
export async function listPlaybookTargets(): Promise<{
  items?: PlaybookTarget[];
}> {
  return incidentRequest<{ items?: PlaybookTarget[] }>(
    '/api/v1/incident-playbook-target',
    { method: 'GET', silent: true },
  );
}

// ---- 接入源 ----

const SOURCE = '/api/v1/incident-source';

export async function listSources(): Promise<{
  items?: IncidentSourceClient[];
}> {
  return incidentRequest<{ items?: IncidentSourceClient[] }>(SOURCE, {
    method: 'GET',
  });
}

export async function createSource(
  spec: SourceSpec,
): Promise<{ source: IncidentSourceClient; token: string }> {
  return incidentRequest(SOURCE, { method: 'POST', data: { spec } });
}

export async function updateSource(
  id: string,
  spec: SourceSpec,
  version: number,
): Promise<IncidentSourceClient> {
  const { source } = await incidentRequest<{ source: IncidentSourceClient }>(
    `${SOURCE}/${id}`,
    { method: 'PUT', data: { spec, version } },
  );
  return source;
}

export async function resetSourceToken(
  id: string,
): Promise<{ source: IncidentSourceClient; token: string }> {
  return incidentRequest(`${SOURCE}/${id}:token`, { method: 'POST' });
}

export async function deleteSource(id: string): Promise<void> {
  await incidentRequest(`${SOURCE}/${id}`, { method: 'DELETE' });
}

// ---- Webhook ----

const WEBHOOK = '/api/v1/incident-webhook';

export async function listWebhooks(): Promise<{ items?: IncidentWebhook[] }> {
  return incidentRequest<{ items?: IncidentWebhook[] }>(WEBHOOK, {
    method: 'GET',
  });
}

export async function createWebhook(
  spec: WebhookSpec,
): Promise<IncidentWebhook> {
  const { webhook } = await incidentRequest<{ webhook: IncidentWebhook }>(
    WEBHOOK,
    { method: 'POST', data: { spec } },
  );
  return webhook;
}

export async function updateWebhook(
  id: string,
  spec: WebhookSpec,
  version: number,
): Promise<IncidentWebhook> {
  const { webhook } = await incidentRequest<{ webhook: IncidentWebhook }>(
    `${WEBHOOK}/${id}`,
    { method: 'PUT', data: { spec, version } },
  );
  return webhook;
}

export async function deleteWebhook(id: string): Promise<void> {
  await incidentRequest(`${WEBHOOK}/${id}`, { method: 'DELETE' });
}

// ---- 设置 ----

const SETTING = '/api/v1/incident-setting';

export async function getSettings(): Promise<SettingsResult> {
  return incidentRequest<SettingsResult>(SETTING, { method: 'GET' });
}

export async function updateSettings(
  settings: IncidentSettings,
): Promise<SettingsResult> {
  return incidentRequest<SettingsResult>(SETTING, {
    method: 'PUT',
    data: { settings },
  });
}
