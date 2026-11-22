/**
 * IncidentProposalService：处置建议（提出 / 审批 / 取消 / 重开自动通过）。
 */
import { BASE, incidentRequest } from './request';
import type { CreateProposalParams, Proposal, ProposalStatus } from './typings';

type Resp = { proposal: Proposal };

export async function listProposals(
  id: string,
  status?: ProposalStatus,
): Promise<{ items?: Proposal[] }> {
  return incidentRequest<{ items?: Proposal[] }>(`${BASE}/${id}/proposal`, {
    method: 'GET',
    params: { status },
  });
}

export async function createProposal(
  id: string,
  body: CreateProposalParams,
): Promise<Proposal> {
  const { proposal } = await incidentRequest<Resp>(`${BASE}/${id}/proposal`, {
    method: 'POST',
    data: body,
  });
  return proposal;
}

export async function decideProposal(
  id: string,
  proposalId: string,
  approved: boolean,
  note?: string,
): Promise<Proposal> {
  const { proposal } = await incidentRequest<Resp>(
    `${BASE}/${id}/proposal/${proposalId}:decide`,
    { method: 'POST', data: { approved, note } },
  );
  return proposal;
}

export async function cancelProposal(
  id: string,
  proposalId: string,
): Promise<Proposal> {
  const { proposal } = await incidentRequest<Resp>(
    `${BASE}/${id}/proposal/${proposalId}:cancel`,
    { method: 'POST' },
  );
  return proposal;
}

/** 熔断后恢复低风险建议自动通过 */
export async function resetAutoApprove(id: string): Promise<void> {
  await incidentRequest(`${BASE}/${id}:auto-approve`, { method: 'POST' });
}
