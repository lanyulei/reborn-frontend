import type { KeyValueEditorItem } from '../shared/KeyValueEditor';

export type HpaMetricType =
  | 'Resource'
  | 'ContainerResource'
  | 'Pods'
  | 'Object'
  | 'External';

export type HpaMetricTargetType = 'Utilization' | 'Value' | 'AverageValue';

export type HpaSelectorOperator = 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';

export type HpaScalingPolicyType = 'Pods' | 'Percent';

export type HpaScalingSelectPolicy = 'Max' | 'Min' | 'Disabled';

export type HpaMetricSelectorRequirementItem = {
  id: string;
  keyName?: string;
  operator?: HpaSelectorOperator;
  values?: string;
};

export type HpaMetricItem = {
  id: string;
  type: HpaMetricType;
  resourceName?: string;
  container?: string;
  metricName?: string;
  describedObjectApiVersion?: string;
  describedObjectKind?: string;
  describedObjectName?: string;
  targetType?: HpaMetricTargetType;
  averageUtilization?: number;
  averageValue?: string;
  value?: string;
  selectorLabels?: KeyValueEditorItem[];
  selectorExpressions?: HpaMetricSelectorRequirementItem[];
};

export type HpaScalingPolicyItem = {
  id: string;
  type?: HpaScalingPolicyType;
  value?: number;
  periodSeconds?: number;
};

export type CreateHorizontalPodAutoscalerFormValues = {
  name?: string;
  namespace?: string;
  targetApiVersion?: string;
  targetKind?: string;
  targetName?: string;
  minReplicas?: number;
  maxReplicas?: number;
  metrics?: HpaMetricItem[];
  enableScaleUpBehavior?: boolean;
  scaleUpSelectPolicy?: HpaScalingSelectPolicy;
  scaleUpStabilizationWindowSeconds?: number;
  scaleUpTolerance?: string;
  scaleUpPolicies?: HpaScalingPolicyItem[];
  enableScaleDownBehavior?: boolean;
  scaleDownSelectPolicy?: HpaScalingSelectPolicy;
  scaleDownStabilizationWindowSeconds?: number;
  scaleDownTolerance?: string;
  scaleDownPolicies?: HpaScalingPolicyItem[];
  labels?: KeyValueEditorItem[];
  annotations?: KeyValueEditorItem[];
};
