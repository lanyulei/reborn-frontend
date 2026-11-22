/**
 * AgentStatsService：概览（任务按终态、运行耗时、token 用量、申请自动的建议数、有用率、按 Profile 分布、今日预算）。
 */
import { agentRequest } from './request';
import type { AgentOverview } from './typings';

export async function getAgentOverview(params: {
  startTime?: string;
  endTime?: string;
  profileId?: string;
}): Promise<AgentOverview> {
  return agentRequest<AgentOverview>('/api/v1/agent-stats/overview', {
    method: 'GET',
    params,
    silent: true,
  });
}
