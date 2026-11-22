/**
 * 故障管理页面共享的枚举元数据与常量：只保存结构（值、徽标状态、颜色、顺序）与 i18n 键，
 * 文案见 src/locales/<lang>/incident.ts。
 */
import type { RouteTab } from '@/components/RouteTabs';
import type {
  ActionItemKind,
  ActionItemStatus,
  ActorType,
  AttachMethod,
  CandidateStatus,
  ChangeRelation,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  ProposalStatus,
  ReviewStatus,
  RiskLevel,
  StepApproval,
  TargetMode,
  UpdateKind,
} from '@/services/incident/typings';
import type { EnumMeta } from '@/utils/i18n';

/** 等级：S1 最严重；颜色从致命到轻微 */
export const SEVERITY_META: Record<
  IncidentSeverity,
  { textId: string; color: string; status: 'Error' | 'Warning' | 'Default' }
> = {
  1: { textId: 'enum.incident.severity.1', color: 'red', status: 'Error' },
  2: {
    textId: 'enum.incident.severity.2',
    color: 'volcano',
    status: 'Error',
  },
  3: {
    textId: 'enum.incident.severity.3',
    color: 'orange',
    status: 'Warning',
  },
  4: { textId: 'enum.incident.severity.4', color: 'blue', status: 'Default' },
};
export const SEVERITY_ORDER: readonly IncidentSeverity[] = [1, 2, 3, 4];

export const STATUS_META: EnumMeta<IncidentStatus> = {
  1: { textId: 'enum.incident.status.1', status: 'Error' },
  2: { textId: 'enum.incident.status.2', status: 'Processing' },
  3: { textId: 'enum.incident.status.3', status: 'Warning' },
  4: { textId: 'enum.incident.status.4', status: 'Success' },
  5: { textId: 'enum.incident.status.5', status: 'Default' },
  6: { textId: 'enum.incident.status.6', status: 'Default' },
};
export const STATUS_ORDER: readonly IncidentStatus[] = [1, 2, 3, 4, 5, 6];
/** 活跃状态：待响应 / 处理中 / 已缓解 */
export const ACTIVE_STATUSES: readonly IncidentStatus[] = [1, 2, 3];

export const REVIEW_META: EnumMeta<ReviewStatus> = {
  0: { textId: 'enum.incident.review.0', status: 'Default' },
  1: { textId: 'enum.incident.review.1', status: 'Warning' },
  2: { textId: 'enum.incident.review.2', status: 'Processing' },
  3: { textId: 'enum.incident.review.3', status: 'Success' },
};
export const REVIEW_ORDER: readonly ReviewStatus[] = [1, 2, 3];

export const SOURCE_META: EnumMeta<IncidentSource> = {
  1: { textId: 'enum.incident.source.1' },
  2: { textId: 'enum.incident.source.2' },
  3: { textId: 'enum.incident.source.3' },
  4: { textId: 'enum.incident.source.4' },
};

export const ACTOR_META: Record<ActorType, { textId: string }> = {
  1: { textId: 'enum.incident.actor.1' },
  2: { textId: 'enum.incident.actor.2' },
  3: { textId: 'enum.incident.actor.3' },
};

export const ATTACH_METHOD_META: Record<AttachMethod, { textId: string }> = {
  1: { textId: 'enum.incident.attach.1' },
  2: { textId: 'enum.incident.attach.2' },
  3: { textId: 'enum.incident.attach.3' },
};

export const CANDIDATE_STATUS_META: EnumMeta<CandidateStatus> = {
  1: { textId: 'enum.incident.candidate.1', status: 'Processing' },
  2: { textId: 'enum.incident.candidate.2', status: 'Success' },
  3: { textId: 'enum.incident.candidate.3', status: 'Default' },
  4: { textId: 'enum.incident.candidate.4', status: 'Default' },
};
export const CANDIDATE_STATUS_ORDER: readonly CandidateStatus[] = [1, 2, 3, 4];

export const RELATION_META: Record<
  ChangeRelation,
  { textId: string; color?: string }
> = {
  0: { textId: 'enum.incident.relation.0' },
  1: { textId: 'enum.incident.relation.1', color: 'error' },
  2: { textId: 'enum.incident.relation.2', color: 'default' },
  3: { textId: 'enum.incident.relation.3', color: 'success' },
};
export const RELATION_ORDER: readonly ChangeRelation[] = [1, 2, 3];

export const PROPOSAL_STATUS_META: EnumMeta<ProposalStatus> = {
  1: { textId: 'enum.incident.proposal.1', status: 'Warning' },
  2: { textId: 'enum.incident.proposal.2', status: 'Processing' },
  3: { textId: 'enum.incident.proposal.3', status: 'Default' },
  4: { textId: 'enum.incident.proposal.4', status: 'Processing' },
  5: { textId: 'enum.incident.proposal.5', status: 'Success' },
  6: { textId: 'enum.incident.proposal.6', status: 'Error' },
  7: { textId: 'enum.incident.proposal.7', status: 'Default' },
  8: { textId: 'enum.incident.proposal.8', status: 'Default' },
};

export const RISK_META: Record<RiskLevel, { textId: string; color: string }> = {
  1: { textId: 'enum.incident.risk.1', color: 'green' },
  2: { textId: 'enum.incident.risk.2', color: 'orange' },
  3: { textId: 'enum.incident.risk.3', color: 'red' },
};
export const RISK_ORDER: readonly RiskLevel[] = [1, 2, 3];

export const APPROVAL_META: Record<StepApproval, { textId: string }> = {
  0: { textId: 'enum.incident.approval.0' },
  1: { textId: 'enum.incident.approval.1' },
  2: { textId: 'enum.incident.approval.2' },
};
export const APPROVAL_ORDER: readonly StepApproval[] = [0, 1, 2];

export const TARGET_MODE_META: Record<TargetMode, { textId: string }> = {
  0: { textId: 'enum.incident.target.0' },
  1: { textId: 'enum.incident.target.1' },
  2: { textId: 'enum.incident.target.2' },
};
export const TARGET_MODE_ORDER: readonly TargetMode[] = [0, 1, 2];

export const UPDATE_KIND_META: Record<
  UpdateKind,
  { textId: string; color: string }
> = {
  1: { textId: 'enum.incident.update.1', color: 'processing' },
  2: { textId: 'enum.incident.update.2', color: 'warning' },
  3: { textId: 'enum.incident.update.3', color: 'success' },
};
export const UPDATE_KIND_ORDER: readonly UpdateKind[] = [1, 2, 3];

export const ITEM_KIND_META: Record<ActionItemKind, { textId: string }> = {
  1: { textId: 'enum.incident.itemKind.1' },
  2: { textId: 'enum.incident.itemKind.2' },
  3: { textId: 'enum.incident.itemKind.3' },
  4: { textId: 'enum.incident.itemKind.4' },
};
export const ITEM_KIND_ORDER: readonly ActionItemKind[] = [1, 2, 3, 4];

export const ITEM_STATUS_META: EnumMeta<ActionItemStatus> = {
  1: { textId: 'enum.incident.itemStatus.1', status: 'Default' },
  2: { textId: 'enum.incident.itemStatus.2', status: 'Processing' },
  3: { textId: 'enum.incident.itemStatus.3', status: 'Success' },
  4: { textId: 'enum.incident.itemStatus.4', status: 'Default' },
};
export const ITEM_STATUS_ORDER: readonly ActionItemStatus[] = [1, 2, 3, 4];

/** 归并键可选项 */
export const CORRELATION_KEYS = ['business', 'group', 'rule', 'ci'] as const;

/** 可配置为个人提醒的通知动作段（与后端 knownPersonalEvents 一致） */
export const PERSONAL_EVENTS = [
  'opened',
  'assigned',
  'escalated',
  'stale',
  'proposal',
  'review_due',
  'status_changed',
  'severity_changed',
  'update',
  'merged',
  'agent',
] as const;

/** Webhook 可订阅的事件（空 = 全部） */
export const WEBHOOK_EVENTS = [
  'opened',
  'severity',
  'status',
  'commander',
  'update',
  'proposal',
  'merged',
] as const;

/** 时间线类型 → Timeline 圆点颜色（不认识的类型为灰） */
export const TIMELINE_COLOR: Record<string, string> = {
  opened: 'red',
  severity: 'orange',
  status: 'blue',
  commander: 'purple',
  member_add: 'purple',
  member_remove: 'gray',
  comment: 'green',
  alert_attach: 'orange',
  alert_detach: 'gray',
  alert_resolved: 'green',
  change: 'gold',
  update: 'cyan',
  proposal: 'geekblue',
  proposal_decision: 'geekblue',
  proposal_result: 'geekblue',
  proposal_verify: 'geekblue',
  ticket: 'blue',
  ai_summary: 'magenta',
  agent_finding: 'magenta',
  merged: 'gray',
  merged_from: 'gray',
  reopen: 'red',
  escalate: 'red',
  stale: 'orange',
  review: 'green',
  action_item: 'green',
  agent_lease: 'magenta',
  auto_approve: 'orange',
  notify: 'gray',
  storm: 'red',
  edit: 'gray',
};

/** 输入长度上限（与后端 proto 校验一致） */
export const INCIDENT_LIMITS = {
  titleMax: 255,
  summaryMax: 4000,
  noteMax: 2000,
  commentMax: 4000,
  updateMax: 4000,
  nameMax: 64,
  descriptionMax: 500,
  shareNameMax: 64,
  keywordMax: 100,
  docSectionMax: 20000,
} as const;

export const incidentPath = (id: string) => `/incident/detail/${id}`;

/** 故障配置分组：触发规则 / 处置预案 / 业务字典 / 接入与 Webhook / 设置 */
export const CONFIG_TABS: RouteTab[] = [
  {
    key: 'rule',
    path: '/incident/rule',
    labelKey: 'menu.incident.rule',
    accessKey: 'canIncidentRule',
  },
  {
    key: 'playbook',
    path: '/incident/playbook',
    labelKey: 'menu.incident.playbook',
    accessKey: 'canIncidentPlaybook',
  },
  {
    key: 'business',
    path: '/incident/business',
    labelKey: 'menu.incident.business',
    accessKey: 'canIncidentBusiness',
  },
  {
    key: 'source',
    path: '/incident/source',
    labelKey: 'menu.incident.source',
    accessKey: 'canIncidentSource',
  },
  {
    key: 'setting',
    path: '/incident/setting',
    labelKey: 'menu.incident.setting',
    accessKey: 'canIncidentSetting',
  },
];
