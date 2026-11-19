type CreateRoleType = 'Role' | 'ClusterRole';

type MetadataItem = {
  id: string;
  keyName: string;
  value: string;
};

type PolicyRuleMode = 'resource' | 'nonResource';

type PolicyRuleFormValue = {
  mode?: PolicyRuleMode;
  apiGroups?: string[];
  resources?: string[];
  verbs?: string[];
  resourceNames?: string[];
  nonResourceURLs?: string[];
};

type LabelSelectorExpressionFormValue = {
  key?: string;
  operator?: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
  values?: string[];
};

type CreateRoleFormValues = {
  type?: CreateRoleType;
  name?: string;
  namespace?: string;
  labels?: MetadataItem[];
  annotations?: MetadataItem[];
  rules?: PolicyRuleFormValue[];
  aggregationEnabled?: boolean;
  aggregationLabels?: MetadataItem[];
  aggregationExpressions?: LabelSelectorExpressionFormValue[];
};

export type {
  CreateRoleFormValues,
  CreateRoleType,
  LabelSelectorExpressionFormValue,
  MetadataItem,
  PolicyRuleFormValue,
  PolicyRuleMode,
};
