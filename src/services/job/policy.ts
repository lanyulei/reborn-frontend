/**
 * JobPolicyService 安全策略：高危命令规则与全局策略。
 */
import { jobRequest } from './request';
import type {
  JobPolicy,
  JobRiskHit,
  JobRiskRule,
  JobRiskRuleSpec,
} from './typings';

/** ListJobRiskRules 查询全部高危命令规则（拦截在前，至多 200 条） */
export async function listJobRiskRules(): Promise<{ items?: JobRiskRule[] }> {
  return jobRequest<{ items?: JobRiskRule[] }>('/api/v1/job/risk-rule', {
    method: 'GET',
  });
}

/** CreateJobRiskRule 新建高危命令规则；正则无法编译 400 */
export async function createJobRiskRule(
  spec: JobRiskRuleSpec,
): Promise<{ rule: JobRiskRule }> {
  return jobRequest<{ rule: JobRiskRule }>('/api/v1/job/risk-rule', {
    method: 'POST',
    data: { spec },
  });
}

/** UpdateJobRiskRule 编辑高危命令规则（整体替换）；version 不一致 409 */
export async function updateJobRiskRule(
  id: string,
  body: { spec: JobRiskRuleSpec; version: number },
): Promise<{ rule: JobRiskRule }> {
  return jobRequest<{ rule: JobRiskRule }>(`/api/v1/job/risk-rule/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteJobRiskRule 删除高危命令规则 */
export async function deleteJobRiskRule(id: string): Promise<void> {
  await jobRequest<void>(`/api/v1/job/risk-rule/${id}`, { method: 'DELETE' });
}

/** TestJobRiskRules 试匹配全部启用的规则；给出 draft 时只用它匹配。不落库 */
export async function testJobRiskRules(body: {
  content: string;
  draft?: JobRiskRuleSpec;
}): Promise<{ hits?: JobRiskHit[] }> {
  return jobRequest<{ hits?: JobRiskHit[] }>('/api/v1/job/risk-rule:test', {
    method: 'POST',
    data: body,
  });
}

/** GetJobPolicy 查询全局策略 */
export async function getJobPolicy(): Promise<{ policy?: JobPolicy }> {
  return jobRequest<{ policy?: JobPolicy }>('/api/v1/job/policy', {
    method: 'GET',
  });
}

/** UpdateJobPolicy 更新全局策略（整体替换；version 须与当前一致） */
export async function updateJobPolicy(
  policy: JobPolicy,
): Promise<{ policy?: JobPolicy }> {
  return jobRequest<{ policy?: JobPolicy }>('/api/v1/job/policy', {
    method: 'PUT',
    data: { policy },
  });
}
