/**
 * RBAC 风险评估（纯函数，直接作用于 Role / ClusterRole / RoleBinding / ClusterRoleBinding 的原始对象）。
 * 等级：Critical（严重）> High（高危）> Medium（中危）> None（未发现风险）。
 */

import type { Translate } from '@/utils/i18n';

type RbacRiskLevel = 'Critical' | 'High' | 'Medium' | 'None';

type RbacRiskReasonId =
  | 'all'
  | 'writeSecret'
  | 'readSecret'
  | 'writeRbac'
  | 'podAccess'
  | 'impersonate'
  | 'wildcard'
  | 'clusterAdmin'
  | 'broadGroup';

/** 风险原因：以 id 表达，broadGroup 附带组名；文案在渲染时用 formatRbacRiskReason 翻译 */
type RbacRiskReason = {
  id: RbacRiskReasonId;
  name?: string;
};

type RbacRisk = {
  level: RbacRiskLevel;
  reasons: RbacRiskReason[];
};

type RbacPolicyRule = {
  apiGroups?: string[];
  nonResourceURLs?: string[];
  resourceNames?: string[];
  resources?: string[];
  verbs?: string[];
};

type RbacSubject = {
  apiGroup?: string;
  kind?: string;
  name?: string;
  namespace?: string;
};

/** Role / ClusterRole 原始对象中与风险评估相关的部分 */
type RbacRoleLike = {
  rules?: RbacPolicyRule[] | null;
};

/** RoleBinding / ClusterRoleBinding 原始对象中与风险评估相关的部分 */
type RbacBindingLike = {
  roleRef?: { apiGroup?: string; kind?: string; name?: string };
  subjects?: RbacSubject[] | null;
};

/** 风险等级文案的 i18n 键 */
const RISK_LEVEL_TEXT_ID: Record<RbacRiskLevel, string> = {
  Critical: 'pages.k8s.forms.role.risk.level.critical',
  High: 'pages.k8s.forms.role.risk.level.high',
  Medium: 'pages.k8s.forms.role.risk.level.medium',
  None: 'pages.k8s.forms.role.risk.level.none',
};

/** 风险原因文案的 i18n 键（broadGroup 带 {name} 占位） */
const RISK_REASON_TEXT_ID: Record<RbacRiskReasonId, string> = {
  all: 'pages.k8s.forms.role.risk.reason.all',
  writeSecret: 'pages.k8s.forms.role.risk.reason.writeSecret',
  readSecret: 'pages.k8s.forms.role.risk.reason.readSecret',
  writeRbac: 'pages.k8s.forms.role.risk.reason.writeRbac',
  podAccess: 'pages.k8s.forms.role.risk.reason.podAccess',
  impersonate: 'pages.k8s.forms.role.risk.reason.impersonate',
  wildcard: 'pages.k8s.forms.role.risk.reason.wildcard',
  clusterAdmin: 'pages.k8s.forms.role.risk.reason.clusterAdmin',
  broadGroup: 'pages.k8s.forms.role.risk.reason.broadGroup',
};

/** 风险原因 → 当前语言文案 */
const formatRbacRiskReason = (reason: RbacRiskReason, t: Translate) =>
  reason.name === undefined
    ? t(RISK_REASON_TEXT_ID[reason.id])
    : t(RISK_REASON_TEXT_ID[reason.id], { name: reason.name });

const reasonKey = (reason: RbacRiskReason) =>
  `${reason.id}:${reason.name ?? ''}`;

const hasReason = (reasons: RbacRiskReason[], id: RbacRiskReasonId) =>
  reasons.some((reason) => reason.id === id);

const RBAC_RESOURCES = [
  'roles',
  'rolebindings',
  'clusterroles',
  'clusterrolebindings',
];
const POD_ACCESS_RESOURCES = ['pods/exec', 'pods/attach', 'pods/portforward'];
const BROAD_GROUPS = [
  'system:authenticated',
  'system:unauthenticated',
  'system:serviceaccounts',
  'system:masters',
];

const riskOrder: Record<RbacRiskLevel, number> = {
  Critical: 3,
  High: 2,
  Medium: 1,
  None: 0,
};

/** 比较两个风险等级：> 0 表示 first 更高 */
const compareRbacRiskLevel = (first?: RbacRiskLevel, second?: RbacRiskLevel) =>
  riskOrder[first || 'None'] - riskOrder[second || 'None'];

const maxRbacRiskLevel = (levels: RbacRiskLevel[]) =>
  levels.reduce<RbacRiskLevel>(
    (current, level) =>
      compareRbacRiskLevel(level, current) > 0 ? level : current,
    'None',
  );

const uniqueReasons = (reasons: RbacRiskReason[]) => {
  const seen = new Set<string>();
  return reasons.filter((reason) => {
    const key = reasonKey(reason);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const hasAny = (values?: string[]) => Boolean(values?.includes('*'));

const hasWriteVerb = (verbs: string[]) =>
  verbs.some((verb) =>
    ['*', 'create', 'update', 'patch', 'delete', 'deletecollection'].includes(
      verb.toLowerCase(),
    ),
  );

const hasReadVerb = (verbs: string[]) =>
  verbs.some((verb) =>
    ['*', 'get', 'list', 'watch'].includes(verb.toLowerCase()),
  );

/** 单条权限规则的风险 */
const analyzeRbacRuleRisk = (rule: RbacPolicyRule): RbacRisk => {
  const reasons: RbacRiskReason[] = [];
  const resources = rule.resources || [];
  const verbs = rule.verbs || [];

  if (hasAny(rule.apiGroups) && hasAny(resources) && hasAny(verbs)) {
    reasons.push({ id: 'all' });
  }
  if (resources.includes('secrets') && hasWriteVerb(verbs)) {
    reasons.push({ id: 'writeSecret' });
  }
  if (resources.includes('secrets') && hasReadVerb(verbs)) {
    reasons.push({ id: 'readSecret' });
  }
  if (
    resources.some((resource) => RBAC_RESOURCES.includes(resource)) &&
    hasWriteVerb(verbs)
  ) {
    reasons.push({ id: 'writeRbac' });
  }
  if (
    resources.some((resource) => POD_ACCESS_RESOURCES.includes(resource)) &&
    hasWriteVerb(verbs)
  ) {
    reasons.push({ id: 'podAccess' });
  }
  if (verbs.includes('impersonate')) {
    reasons.push({ id: 'impersonate' });
  }
  if (hasAny(resources) || hasAny(verbs)) {
    reasons.push({ id: 'wildcard' });
  }

  if (hasReason(reasons, 'all') || hasReason(reasons, 'writeRbac')) {
    return { level: 'Critical', reasons };
  }
  if (hasReason(reasons, 'writeSecret') || hasReason(reasons, 'impersonate')) {
    return { level: 'High', reasons };
  }
  if (reasons.length) {
    return { level: 'Medium', reasons };
  }

  return { level: 'None', reasons: [] };
};

/** 一组权限规则的风险：取各规则的最高等级，原因去重合并 */
const analyzeRbacRulesRisk = (rules?: RbacPolicyRule[] | null): RbacRisk => {
  const risks = (rules || []).map(analyzeRbacRuleRisk);

  return {
    level: maxRbacRiskLevel(risks.map((risk) => risk.level)),
    reasons: uniqueReasons(risks.flatMap((risk) => risk.reasons)),
  };
};

/** Role / ClusterRole 的风险 */
const analyzeRbacRoleRisk = (role: RbacRoleLike): RbacRisk =>
  analyzeRbacRulesRisk(role.rules);

/**
 * RoleBinding / ClusterRoleBinding 的风险。
 * rules 为所引用角色的权限规则；取不到（未传）时只按引用的角色名与授权主体判断。
 */
const analyzeRbacBindingRisk = (
  binding: RbacBindingLike,
  rules?: RbacPolicyRule[] | null,
): RbacRisk => {
  const ruleRisk = analyzeRbacRulesRisk(rules);
  const subjectReasons = (binding.subjects || []).flatMap<RbacRiskReason>(
    (subject) =>
      subject.kind === 'Group' && BROAD_GROUPS.includes(subject.name || '')
        ? [{ id: 'broadGroup', name: subject.name }]
        : [],
  );
  const roleReasons =
    binding.roleRef?.name === 'cluster-admin'
      ? [{ id: 'clusterAdmin' as const }]
      : [];
  const reasons = uniqueReasons([
    ...ruleRisk.reasons,
    ...subjectReasons,
    ...roleReasons,
  ]);

  if (
    roleReasons.length ||
    subjectReasons.some(
      (reason) =>
        reason.id === 'broadGroup' && reason.name === 'system:masters',
    )
  ) {
    return { level: 'Critical', reasons };
  }
  if (subjectReasons.length && ruleRisk.level !== 'None') {
    return { level: 'Critical', reasons };
  }

  return { level: ruleRisk.level, reasons };
};

export type {
  RbacBindingLike,
  RbacPolicyRule,
  RbacRisk,
  RbacRiskLevel,
  RbacRiskReason,
  RbacRiskReasonId,
  RbacRoleLike,
  RbacSubject,
};
export {
  analyzeRbacBindingRisk,
  analyzeRbacRoleRisk,
  analyzeRbacRuleRisk,
  analyzeRbacRulesRisk,
  compareRbacRiskLevel,
  formatRbacRiskReason,
  maxRbacRiskLevel,
  RISK_LEVEL_TEXT_ID,
  RISK_REASON_TEXT_ID,
};
