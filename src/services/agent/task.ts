/**
 * AgentTaskService：任务列表 / 详情、人工召唤、取消、运行详情（两层可见）、故障的运行列表、评价。
 */
import type { PagedResult } from '@/services/system/typings';
import { agentRequest } from './request';
import type {
  AgentRun,
  AgentTask,
  Feedback,
  ListTasksParams,
  TranscriptMessage,
} from './typings';

const TASK = '/api/v1/agent-task';
const RUN = '/api/v1/agent-run';

export async function listTasks(
  params: ListTasksParams,
): Promise<PagedResult<AgentTask>> {
  return agentRequest<PagedResult<AgentTask>>(TASK, { method: 'GET', params });
}

export async function getTask(
  id: string,
  options?: { silent?: boolean },
): Promise<{ task: AgentTask; run?: AgentRun }> {
  return agentRequest<{ task: AgentTask; run?: AgentRun }>(`${TASK}/${id}`, {
    method: 'GET',
    silent: options?.silent,
  });
}

export async function runForIncident(body: {
  incidentId: string;
  profileId?: string;
  input?: string;
}): Promise<{ task: AgentTask; existing?: boolean }> {
  return agentRequest<{ task: AgentTask; existing?: boolean }>(`${TASK}:run`, {
    method: 'POST',
    data: body,
  });
}

export async function cancelTask(
  id: string,
  note?: string,
): Promise<AgentTask> {
  const { task } = await agentRequest<{ task: AgentTask }>(
    `${TASK}/${id}:cancel`,
    { method: 'POST', data: { note } },
  );
  return task;
}

export async function getRun(
  id: string,
  options?: { silent?: boolean },
): Promise<{
  run: AgentRun;
  transcript?: TranscriptMessage[];
  transcriptVisible?: boolean;
}> {
  return agentRequest(`${RUN}/${id}`, {
    method: 'GET',
    silent: options?.silent,
  });
}

export async function listIncidentRuns(
  incidentId: string,
  options?: { silent?: boolean },
): Promise<{ items?: AgentRun[]; activeTask?: AgentTask }> {
  return agentRequest(RUN, {
    method: 'GET',
    params: { incidentId },
    silent: options?.silent,
  });
}

export async function rateRun(
  id: string,
  feedback: Exclude<Feedback, 0>,
  note?: string,
): Promise<AgentRun> {
  const { run } = await agentRequest<{ run: AgentRun }>(`${RUN}/${id}:rate`, {
    method: 'POST',
    data: { feedback, note },
  });
  return run;
}
