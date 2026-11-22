import type { Translate } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import {
  createId,
  createKeyValueItem,
  NAME_PATTERN,
  toRecord,
} from '../shared/manifest';
import type {
  CreateHorizontalPodAutoscalerFormValues,
  HpaMetricItem,
  HpaMetricSelectorRequirementItem,
  HpaMetricTargetType,
  HpaMetricType,
  HpaScalingPolicyItem,
} from './types';

export { createKeyValueItem, NAME_PATTERN };

export const HPA_API_VERSION = 'autoscaling/v2';
export const HPA_KIND = 'HorizontalPodAutoscaler';

export const createMetricSelectorRequirementItem = (
  values?: Partial<HpaMetricSelectorRequirementItem>,
): HpaMetricSelectorRequirementItem => ({
  id: createId(),
  keyName: values?.keyName,
  operator: values?.operator || 'In',
  values: values?.values,
});

export const createHpaMetricItem = (
  values?: Partial<HpaMetricItem>,
): HpaMetricItem => {
  const type = values?.type || 'Resource';
  const targetType = values?.targetType || getDefaultTargetType(type);

  return {
    id: createId(),
    type,
    resourceName:
      values?.resourceName ||
      (type === 'Resource' || type === 'ContainerResource' ? 'cpu' : undefined),
    container: values?.container,
    metricName: values?.metricName,
    describedObjectApiVersion: values?.describedObjectApiVersion || 'apps/v1',
    describedObjectKind: values?.describedObjectKind || 'Deployment',
    describedObjectName: values?.describedObjectName,
    targetType,
    averageUtilization:
      values?.averageUtilization ??
      (targetType === 'Utilization' ? 70 : undefined),
    averageValue: values?.averageValue,
    value: values?.value,
    selectorLabels: values?.selectorLabels || [createKeyValueItem()],
    selectorExpressions: values?.selectorExpressions || [],
  };
};

export const createHpaScalingPolicyItem = (
  values?: Partial<HpaScalingPolicyItem>,
): HpaScalingPolicyItem => ({
  id: createId(),
  type: values?.type || 'Percent',
  value: values?.value ?? 100,
  periodSeconds: values?.periodSeconds ?? 60,
});

export const getDefaultTargetType = (
  metricType?: HpaMetricType,
): HpaMetricTargetType => {
  if (metricType === 'Resource' || metricType === 'ContainerResource') {
    return 'Utilization';
  }
  if (metricType === 'Pods') {
    return 'AverageValue';
  }
  return 'Value';
};

export const getInitialCreateHpaValues = (
  namespace?: string,
): CreateHorizontalPodAutoscalerFormValues => ({
  name: undefined,
  namespace,
  targetApiVersion: 'apps/v1',
  targetKind: 'Deployment',
  targetName: undefined,
  minReplicas: 1,
  maxReplicas: 5,
  metrics: [createHpaMetricItem()],
  enableScaleUpBehavior: false,
  scaleUpSelectPolicy: 'Max',
  scaleUpStabilizationWindowSeconds: 0,
  scaleUpTolerance: undefined,
  scaleUpPolicies: [createHpaScalingPolicyItem()],
  enableScaleDownBehavior: false,
  scaleDownSelectPolicy: 'Max',
  scaleDownStabilizationWindowSeconds: 300,
  scaleDownTolerance: undefined,
  scaleDownPolicies: [createHpaScalingPolicyItem()],
  labels: [createKeyValueItem()],
  annotations: [createKeyValueItem()],
});

export const getHpaStepFields = (step: number) => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    return ['targetApiVersion', 'targetKind', 'targetName'];
  }
  if (step === 2) {
    return ['minReplicas', 'maxReplicas', 'metrics'];
  }
  return [
    'enableScaleUpBehavior',
    'scaleUpSelectPolicy',
    'scaleUpStabilizationWindowSeconds',
    'scaleUpTolerance',
    'scaleUpPolicies',
    'enableScaleDownBehavior',
    'scaleDownSelectPolicy',
    'scaleDownStabilizationWindowSeconds',
    'scaleDownTolerance',
    'scaleDownPolicies',
    'labels',
    'annotations',
  ];
};

export const getTargetApiVersionByKind = (kind?: string) =>
  kind === 'ReplicationController' ? 'v1' : 'apps/v1';

const normalizeText = (value?: string) => value?.trim() || undefined;

const splitValues = (value?: string) =>
  (value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildSelector = (
  labels?: KeyValueEditorItem[],
  expressions?: HpaMetricSelectorRequirementItem[],
) => {
  const matchLabels = toRecord(labels);
  const matchExpressions = (expressions || [])
    .filter((item) => item.keyName?.trim())
    .map((item) => {
      const operator = item.operator || 'In';
      const requirement: Record<string, unknown> = {
        key: item.keyName?.trim(),
        operator,
      };

      if (operator === 'In' || operator === 'NotIn') {
        requirement.values = splitValues(item.values);
      }

      return requirement;
    });
  const selector: Record<string, unknown> = {};

  if (Object.keys(matchLabels).length > 0) {
    selector.matchLabels = matchLabels;
  }
  if (matchExpressions.length > 0) {
    selector.matchExpressions = matchExpressions;
  }

  return Object.keys(selector).length > 0 ? selector : undefined;
};

const buildMetricIdentifier = (metric?: HpaMetricItem) => {
  const metricName = normalizeText(metric?.metricName);
  const selector = buildSelector(
    metric?.selectorLabels,
    metric?.selectorExpressions,
  );

  if (!metricName) {
    return undefined;
  }

  return {
    name: metricName,
    ...(selector ? { selector } : {}),
  };
};

const buildMetricTarget = (metric?: HpaMetricItem) => {
  const targetType = metric?.targetType || getDefaultTargetType(metric?.type);
  const target: Record<string, unknown> = {
    type: targetType,
  };

  if (targetType === 'Utilization') {
    target.averageUtilization = metric?.averageUtilization;
  }
  if (targetType === 'AverageValue') {
    target.averageValue = normalizeText(metric?.averageValue);
  }
  if (targetType === 'Value') {
    target.value = normalizeText(metric?.value);
  }

  return target;
};

const buildMetricSpec = (metric: HpaMetricItem) => {
  const target = buildMetricTarget(metric);

  if (metric.type === 'Resource') {
    return {
      type: metric.type,
      resource: {
        name: normalizeText(metric.resourceName),
        target,
      },
    };
  }
  if (metric.type === 'ContainerResource') {
    return {
      type: metric.type,
      containerResource: {
        container: normalizeText(metric.container),
        name: normalizeText(metric.resourceName),
        target,
      },
    };
  }
  if (metric.type === 'Pods') {
    return {
      type: metric.type,
      pods: {
        metric: buildMetricIdentifier(metric),
        target,
      },
    };
  }
  if (metric.type === 'Object') {
    return {
      type: metric.type,
      object: {
        describedObject: {
          apiVersion: normalizeText(metric.describedObjectApiVersion),
          kind: normalizeText(metric.describedObjectKind),
          name: normalizeText(metric.describedObjectName),
        },
        metric: buildMetricIdentifier(metric),
        target,
      },
    };
  }

  return {
    type: metric.type,
    external: {
      metric: buildMetricIdentifier(metric),
      target,
    },
  };
};

const buildScalingRules = (
  enabled?: boolean,
  values?: {
    policies?: HpaScalingPolicyItem[];
    selectPolicy?: string;
    stabilizationWindowSeconds?: number;
    tolerance?: string;
  },
) => {
  if (!enabled) {
    return undefined;
  }

  const policies = (values?.policies || [])
    .filter(
      (item) =>
        item.type &&
        typeof item.value === 'number' &&
        typeof item.periodSeconds === 'number',
    )
    .map((item) => ({
      type: item.type,
      value: item.value,
      periodSeconds: item.periodSeconds,
    }));
  const rules: Record<string, unknown> = {};
  const tolerance = normalizeText(values?.tolerance);

  if (policies.length > 0) {
    rules.policies = policies;
  }
  if (values?.selectPolicy) {
    rules.selectPolicy = values.selectPolicy;
  }
  if (typeof values?.stabilizationWindowSeconds === 'number') {
    rules.stabilizationWindowSeconds = values.stabilizationWindowSeconds;
  }
  if (tolerance) {
    rules.tolerance = tolerance;
  }

  return Object.keys(rules).length > 0 ? rules : undefined;
};

export const buildCreateHpaManifest = (
  values: CreateHorizontalPodAutoscalerFormValues,
) => {
  const labels = toRecord(values.labels);
  const annotations = toRecord(values.annotations);
  const metadata: Record<string, unknown> = {
    name: values.name,
    namespace: values.namespace,
  };
  const behavior: Record<string, unknown> = {};
  const scaleUp = buildScalingRules(values.enableScaleUpBehavior, {
    policies: values.scaleUpPolicies,
    selectPolicy: values.scaleUpSelectPolicy,
    stabilizationWindowSeconds: values.scaleUpStabilizationWindowSeconds,
    tolerance: values.scaleUpTolerance,
  });
  const scaleDown = buildScalingRules(values.enableScaleDownBehavior, {
    policies: values.scaleDownPolicies,
    selectPolicy: values.scaleDownSelectPolicy,
    stabilizationWindowSeconds: values.scaleDownStabilizationWindowSeconds,
    tolerance: values.scaleDownTolerance,
  });

  if (Object.keys(labels).length > 0) {
    metadata.labels = labels;
  }
  if (Object.keys(annotations).length > 0) {
    metadata.annotations = annotations;
  }
  if (scaleUp) {
    behavior.scaleUp = scaleUp;
  }
  if (scaleDown) {
    behavior.scaleDown = scaleDown;
  }

  return {
    apiVersion: HPA_API_VERSION,
    kind: HPA_KIND,
    metadata,
    spec: {
      scaleTargetRef: {
        apiVersion: normalizeText(values.targetApiVersion),
        kind: normalizeText(values.targetKind),
        name: normalizeText(values.targetName),
      },
      ...(typeof values.minReplicas === 'number'
        ? { minReplicas: values.minReplicas }
        : {}),
      maxReplicas: values.maxReplicas,
      metrics: (values.metrics || []).map(buildMetricSpec),
      ...(Object.keys(behavior).length > 0 ? { behavior } : {}),
    },
  };
};

const getMetricError = (metric: HpaMetricItem, label: string, t: Translate) => {
  const targetType = metric.targetType || getDefaultTargetType(metric.type);

  if (
    (metric.type === 'Resource' || metric.type === 'ContainerResource') &&
    !normalizeText(metric.resourceName)
  ) {
    return t('pages.k8s.forms.hpa.error.resourceName', { label });
  }
  if (metric.type === 'ContainerResource' && !normalizeText(metric.container)) {
    return t('pages.k8s.forms.hpa.error.container', { label });
  }
  if (
    (metric.type === 'Pods' ||
      metric.type === 'Object' ||
      metric.type === 'External') &&
    !normalizeText(metric.metricName)
  ) {
    return t('pages.k8s.forms.hpa.error.metricName', { label });
  }
  if (
    metric.type === 'Object' &&
    !(
      normalizeText(metric.describedObjectApiVersion) &&
      normalizeText(metric.describedObjectKind) &&
      normalizeText(metric.describedObjectName)
    )
  ) {
    return t('pages.k8s.forms.hpa.error.describedObject', { label });
  }
  if (targetType === 'Utilization') {
    const utilization = metric.averageUtilization;
    if (
      typeof utilization !== 'number' ||
      !Number.isInteger(utilization) ||
      utilization < 1
    ) {
      return t('pages.k8s.forms.hpa.error.averageUtilization', { label });
    }
  }
  if (targetType === 'AverageValue' && !normalizeText(metric.averageValue)) {
    return t('pages.k8s.forms.hpa.error.averageValue', { label });
  }
  if (targetType === 'Value' && !normalizeText(metric.value)) {
    return t('pages.k8s.forms.hpa.error.value', { label });
  }
  return undefined;
};

const hasScalingPolicy = (items?: HpaScalingPolicyItem[]) =>
  (items || []).some(
    (item) =>
      item?.type &&
      typeof item.value === 'number' &&
      typeof item.periodSeconds === 'number',
  );

/** 整张表单的跨步骤校验（提交前兜底）：返回第一条错误信息 */
export const getHpaFormError = (
  values: CreateHorizontalPodAutoscalerFormValues,
  t: Translate,
): string | undefined => {
  if (!values.name?.trim() || !values.namespace?.trim()) {
    return t('pages.k8s.forms.hpa.error.nameNamespace');
  }
  if (
    !normalizeText(values.targetApiVersion) ||
    !normalizeText(values.targetKind) ||
    !normalizeText(values.targetName)
  ) {
    return t('pages.k8s.forms.hpa.error.target');
  }
  if (typeof values.maxReplicas !== 'number' || values.maxReplicas < 1) {
    return t('pages.k8s.forms.hpa.maxReplicas.required');
  }
  if (typeof values.minReplicas === 'number') {
    if (values.minReplicas < 1) {
      return t('pages.k8s.forms.hpa.minReplicas.min');
    }
    if (values.minReplicas > values.maxReplicas) {
      return t('pages.k8s.forms.hpa.maxReplicas.belowMin');
    }
  }

  const metrics = (values.metrics || []).filter(Boolean);
  if (metrics.length === 0) {
    return t('pages.k8s.forms.hpa.metrics.required');
  }
  for (const [index, metric] of metrics.entries()) {
    const error = getMetricError(
      metric,
      t('pages.k8s.forms.hpa.error.metricLabel', { index: index + 1 }),
      t,
    );
    if (error) {
      return error;
    }
  }
  if (
    values.enableScaleUpBehavior &&
    !hasScalingPolicy(values.scaleUpPolicies)
  ) {
    return t('pages.k8s.forms.hpa.error.policiesRequired', {
      label: t('pages.k8s.forms.hpa.scaleUp'),
    });
  }
  if (
    values.enableScaleDownBehavior &&
    !hasScalingPolicy(values.scaleDownPolicies)
  ) {
    return t('pages.k8s.forms.hpa.error.policiesRequired', {
      label: t('pages.k8s.forms.hpa.scaleDown'),
    });
  }
  return undefined;
};
