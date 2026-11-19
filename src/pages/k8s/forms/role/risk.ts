/**
 * RBAC 风险评估（纯函数，直接作用于 Role / ClusterRole / RoleBinding / ClusterRoleBinding 的原始对象）。
 * 等级：Critical（严重）> High（高危）> Medium（中危）> None（未发现风险）。
 */

type RbacRiskLevel = 'Critical' | 'High' | 'Medium' | 'None';

type RbacRisk = {
  level: RbacRiskLevel;
  reasons: string[];
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

const RISK_LEVEL_TEXT: Record<RbacRiskLevel, string> = {
  Critical: '严重',
  High: '高危',
  Medium: '中危',
  None: '无',
};

const REASON_ALL = '拥有所有 API 组、所有资源和所有动作权限';
const REASON_WRITE_SECRET = '可写 Secret';
const REASON_READ_SECRET = '可读取 Secret';
const REASON_WRITE_RBAC = '可修改 RBAC 授权资源';
const REASON_POD_ACCESS = '可进入或转发 Pod 运行环境';
const REASON_IMPERSONATE = '可模拟其他主体身份';
const REASON_WILDCARD = '存在通配符权限';
const REASON_CLUSTER_ADMIN = '绑定 cluster-admin';

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

const uniqueText = (values: string[]) => Array.from(new Set(values));

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
  const reasons: string[] = [];
  const resources = rule.resources || [];
  const verbs = rule.verbs || [];

  if (hasAny(rule.apiGroups) && hasAny(resources) && hasAny(verbs)) {
    reasons.push(REASON_ALL);
  }
  if (resources.includes('secrets') && hasWriteVerb(verbs)) {
    reasons.push(REASON_WRITE_SECRET);
  }
  if (resources.includes('secrets') && hasReadVerb(verbs)) {
    reasons.push(REASON_READ_SECRET);
  }
  if (
    resources.some((resource) => RBAC_RESOURCES.includes(resource)) &&
    hasWriteVerb(verbs)
  ) {
    reasons.push(REASON_WRITE_RBAC);
  }
  if (
    resources.some((resource) => POD_ACCESS_RESOURCES.includes(resource)) &&
    hasWriteVerb(verbs)
  ) {
    reasons.push(REASON_POD_ACCESS);
  }
  if (verbs.includes('impersonate')) {
    reasons.push(REASON_IMPERSONATE);
  }
  if (hasAny(resources) || hasAny(verbs)) {
    reasons.push(REASON_WILDCARD);
  }

  if (reasons.includes(REASON_ALL) || reasons.includes(REASON_WRITE_RBAC)) {
    return { level: 'Critical', reasons };
  }
  if (
    reasons.includes(REASON_WRITE_SECRET) ||
    reasons.includes(REASON_IMPERSONATE)
  ) {
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
    reasons: uniqueText(risks.flatMap((risk) => risk.reasons)),
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
  const subjectReasons = (binding.subjects || []).flatMap((subject) =>
    subject.kind === 'Group' && BROAD_GROUPS.includes(subject.name || '')
      ? [`授权给宽泛系统组 ${subject.name}`]
      : [],
  );
  const roleReasons =
    binding.roleRef?.name === 'cluster-admin' ? [REASON_CLUSTER_ADMIN] : [];
  const reasons = uniqueText([
    ...ruleRisk.reasons,
    ...subjectReasons,
    ...roleReasons,
  ]);

  if (
    roleReasons.length ||
    subjectReasons.includes('授权给宽泛系统组 system:masters')
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
  RbacRoleLike,
  RbacSubject,
};
export {
  analyzeRbacBindingRisk,
  analyzeRbacRoleRisk,
  analyzeRbacRuleRisk,
  analyzeRbacRulesRisk,
  compareRbacRiskLevel,
  maxRbacRiskLevel,
  RISK_LEVEL_TEXT,
};
