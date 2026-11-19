import { getArrayValue, getRecordValue } from '../shared/manifest';
import type {
  CreateRoleFormValues,
  CreateRoleType,
  LabelSelectorExpressionFormValue,
  MetadataItem,
  PolicyRuleFormValue,
} from './types';

const RBAC_API_VERSION = 'rbac.authorization.k8s.io/v1';
const ROLE_NAME_PATTERN =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

const normalizeText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const createMetadataItem = (): MetadataItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  keyName: '',
  value: '',
});

const normalizeStringList = (values?: string[]) =>
  (values || []).map((value) => value.trim()).filter(Boolean);

const normalizeApiGroups = (values?: string[]) =>
  (values || [])
    .map((value) => value.trim())
    .filter((value, index, list) => list.indexOf(value) === index);

const metadataItemsToRecord = (items?: MetadataItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value.trim()] as const)
    .filter(([key]) => key);

  return entries.length ? Object.fromEntries(entries) : undefined;
};

const normalizePolicyRule = (rule: PolicyRuleFormValue) => {
  const verbs = normalizeStringList(rule.verbs);

  if (rule.mode === 'nonResource') {
    return {
      nonResourceURLs: normalizeStringList(rule.nonResourceURLs),
      verbs,
    };
  }

  const resourceNames = normalizeStringList(rule.resourceNames);
  return {
    apiGroups: normalizeApiGroups(rule.apiGroups),
    resources: normalizeStringList(rule.resources),
    verbs,
    ...(resourceNames.length ? { resourceNames } : {}),
  };
};

const normalizeSelectorExpressions = (
  expressions?: LabelSelectorExpressionFormValue[],
) =>
  (expressions || [])
    .map((expression) => {
      const key = normalizeText(expression.key);
      const operator = expression.operator;
      const values = normalizeStringList(expression.values);

      if (!key || !operator) {
        return undefined;
      }

      return {
        key,
        operator,
        ...(operator === 'In' || operator === 'NotIn' ? { values } : {}),
      };
    })
    .filter((item) => Boolean(item));

const buildAggregationRule = (values: CreateRoleFormValues) => {
  if (values.type !== 'ClusterRole' || !values.aggregationEnabled) {
    return undefined;
  }

  const matchLabels = metadataItemsToRecord(values.aggregationLabels);
  const matchExpressions = normalizeSelectorExpressions(
    values.aggregationExpressions,
  );
  const selector =
    matchLabels || matchExpressions.length
      ? {
          ...(matchLabels ? { matchLabels } : {}),
          ...(matchExpressions.length ? { matchExpressions } : {}),
        }
      : undefined;

  return selector ? { clusterRoleSelectors: [selector] } : undefined;
};

const buildCreateRoleManifest = (values: CreateRoleFormValues) => {
  const type = values.type || 'Role';
  const labels = metadataItemsToRecord(values.labels);
  const annotations = metadataItemsToRecord(values.annotations);
  const namespace =
    type === 'Role' ? normalizeText(values.namespace) : undefined;
  const aggregationRule = buildAggregationRule(values);

  return {
    apiVersion: RBAC_API_VERSION,
    kind: type,
    metadata: {
      name: normalizeText(values.name),
      ...(namespace ? { namespace } : {}),
      ...(labels ? { labels } : {}),
      ...(annotations ? { annotations } : {}),
    },
    ...(aggregationRule ? { aggregationRule } : {}),
    rules: (values.rules || []).map(normalizePolicyRule),
  };
};

const getInitialCreateRoleValues = (
  type: CreateRoleType = 'Role',
  namespace?: string,
): CreateRoleFormValues => ({
  type,
  name: '',
  namespace: type === 'Role' ? namespace || undefined : undefined,
  labels: [],
  annotations: [],
  rules: [
    {
      mode: 'resource',
      apiGroups: [''],
      resources: ['pods'],
      verbs: ['get', 'list', 'watch'],
      resourceNames: [],
      nonResourceURLs: [],
    },
  ],
  aggregationEnabled: false,
  aggregationLabels: [],
  aggregationExpressions: [],
});

const getCreateRoleStepFields = (
  step: number,
): (keyof CreateRoleFormValues)[] => {
  if (step === 0) {
    return ['type', 'name', 'namespace'];
  }
  if (step === 1) {
    return ['rules'];
  }
  return ['labels', 'annotations', 'aggregationEnabled'];
};

/** 权限规则检查：每条规则须有动作，且配置（API 组 + 资源）或非资源 URL；通过返回 undefined */
const getPolicyRulesError = (
  values: CreateRoleFormValues,
): string | undefined => {
  const rules = values.rules || [];

  if (!rules.length) {
    return '请至少添加一条权限规则';
  }

  for (const [index, rule] of rules.entries()) {
    const verbs = normalizeStringList(rule.verbs);
    const apiGroups = normalizeApiGroups(rule.apiGroups);
    const resources = normalizeStringList(rule.resources);
    const nonResourceURLs = normalizeStringList(rule.nonResourceURLs);

    if (!verbs.length) {
      return `权限规则 ${index + 1} 需要选择动作`;
    }
    if (rule.mode === 'nonResource') {
      if (values.type !== 'ClusterRole') {
        return '非资源 URL 权限仅适用于 ClusterRole';
      }
      if (!nonResourceURLs.length) {
        return `权限规则 ${index + 1} 需要填写非资源 URL`;
      }
      continue;
    }
    if (!apiGroups.length) {
      return `权限规则 ${index + 1} 需要选择 API 组`;
    }
    if (!resources.length) {
      return `权限规则 ${index + 1} 需要选择资源`;
    }
  }

  return undefined;
};

/** 聚合规则检查；通过返回 undefined */
const getAggregationError = (
  values: CreateRoleFormValues,
): string | undefined => {
  if (values.type !== 'ClusterRole' || !values.aggregationEnabled) {
    return undefined;
  }

  const hasLabels = hasMetadataContent(values.aggregationLabels);
  const hasExpressions = (values.aggregationExpressions || []).some((item) =>
    item.key?.trim(),
  );

  if (!hasLabels && !hasExpressions) {
    return '请为聚合规则至少配置一个标签选择器';
  }

  const invalidExpressionIndex = (
    values.aggregationExpressions || []
  ).findIndex((item) => {
    if (!item.key?.trim()) {
      return false;
    }
    if (!item.operator) {
      return true;
    }
    return (
      (item.operator === 'In' || item.operator === 'NotIn') &&
      !normalizeStringList(item.values).length
    );
  });

  if (invalidExpressionIndex >= 0) {
    return `聚合匹配表达式 ${invalidExpressionIndex + 1} 需要选择操作符，In/NotIn 需要填写标签值`;
  }

  return undefined;
};

/**
 * YAML 模式提交前的检查；通过返回 undefined，否则返回提示语。
 * expectedKind 给定时（从固定类型的入口打开）kind 必须与之一致。
 */
const getRoleManifestError = (
  resource: Record<string, unknown>,
  expectedKind?: CreateRoleType,
): string | undefined => {
  const metadata = getRecordValue(resource.metadata);
  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
  const namespace =
    typeof metadata?.namespace === 'string' ? metadata.namespace.trim() : '';
  const kind = typeof resource.kind === 'string' ? resource.kind : '';
  const rules = getArrayValue(resource.rules);
  const aggregated = Boolean(getRecordValue(resource.aggregationRule));

  if (expectedKind && kind !== expectedKind) {
    return `YAML kind 必须为 ${expectedKind}`;
  }
  if (kind !== 'Role' && kind !== 'ClusterRole') {
    return 'YAML kind 必须为 Role 或 ClusterRole';
  }
  if (resource.apiVersion !== RBAC_API_VERSION) {
    return `YAML apiVersion 必须为 ${RBAC_API_VERSION}`;
  }
  if (!name) {
    return 'YAML 必须包含 metadata.name';
  }
  if (kind === 'Role' && !namespace) {
    return 'Role YAML 必须包含 metadata.namespace';
  }
  if (kind === 'ClusterRole' && namespace) {
    return 'ClusterRole YAML 不应包含 metadata.namespace';
  }
  // 聚合 ClusterRole 的 rules 由控制面按选择器填充，可以不写
  if (!rules.length && !(kind === 'ClusterRole' && aggregated)) {
    return 'YAML 必须至少包含一条 rules';
  }

  const invalidRuleIndex = rules.findIndex((rule) => {
    const ruleRecord = getRecordValue(rule);
    const verbs = getArrayValue(ruleRecord?.verbs);
    const resources = getArrayValue(ruleRecord?.resources);
    const apiGroups = getArrayValue(ruleRecord?.apiGroups);
    const nonResourceURLs = getArrayValue(ruleRecord?.nonResourceURLs);
    return (
      !ruleRecord ||
      !verbs.length ||
      (resources.length > 0 && apiGroups.length === 0) ||
      (resources.length > 0 && nonResourceURLs.length > 0) ||
      (resources.length === 0 && nonResourceURLs.length === 0) ||
      (kind === 'Role' && nonResourceURLs.length > 0)
    );
  });

  if (invalidRuleIndex >= 0) {
    return `YAML rules[${invalidRuleIndex}] 需要包含 verbs；资源权限需要 apiGroups 和 resources；resources 与 nonResourceURLs 不能同时或同时不配置（nonResourceURLs 仅适用于 ClusterRole）`;
  }

  return undefined;
};

const hasMetadataContent = (items?: MetadataItem[]) =>
  (items || []).some((item) => item.keyName.trim());

const hasAdvancedContent = (values: CreateRoleFormValues) =>
  hasMetadataContent(values.labels) ||
  hasMetadataContent(values.annotations) ||
  Boolean(
    values.type === 'ClusterRole' &&
      values.aggregationEnabled &&
      (hasMetadataContent(values.aggregationLabels) ||
        (values.aggregationExpressions || []).some((item) => item.key?.trim())),
  );

const hasRulesContent = (values: CreateRoleFormValues) =>
  (values.rules || []).some(
    (rule) =>
      normalizeStringList(rule.verbs).length > 0 &&
      (normalizeStringList(rule.resources).length > 0 ||
        normalizeStringList(rule.nonResourceURLs).length > 0),
  );

export {
  buildCreateRoleManifest,
  createMetadataItem,
  getAggregationError,
  getCreateRoleStepFields,
  getInitialCreateRoleValues,
  getPolicyRulesError,
  getRoleManifestError,
  hasAdvancedContent,
  hasRulesContent,
  normalizeApiGroups,
  normalizeStringList,
  RBAC_API_VERSION,
  ROLE_NAME_PATTERN,
};
