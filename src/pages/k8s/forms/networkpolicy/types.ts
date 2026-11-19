import type { KeyValueEditorItem } from '../shared/KeyValueEditor';

type NetworkPolicyProtocol = 'SCTP' | 'TCP' | 'UDP';

type NetworkPolicyPolicyType = 'Egress' | 'Ingress';

type NetworkPolicySelectorOperator = 'DoesNotExist' | 'Exists' | 'In' | 'NotIn';

type NetworkPolicyPeerType =
  | 'ipBlock'
  | 'namespaceSelector'
  | 'podAndNamespaceSelector'
  | 'podSelector';

type NetworkPolicySelectorExpressionItem = {
  id: string;
  keyName?: string;
  operator: NetworkPolicySelectorOperator;
  values?: string[];
};

type NetworkPolicyLabelSelectorValues = {
  matchExpressions?: NetworkPolicySelectorExpressionItem[];
  matchLabels?: KeyValueEditorItem[];
};

type NetworkPolicyPeerItem = {
  id: string;
  ipBlockCidr?: string;
  ipBlockExcept?: string[];
  namespaceSelector?: NetworkPolicyLabelSelectorValues;
  podSelector?: NetworkPolicyLabelSelectorValues;
  type: NetworkPolicyPeerType;
};

type NetworkPolicyPortItem = {
  id: string;
  endPort?: number;
  port?: string;
  protocol: NetworkPolicyProtocol;
};

type NetworkPolicyRuleItem = {
  id: string;
  peers?: NetworkPolicyPeerItem[];
  ports?: NetworkPolicyPortItem[];
};

type CreateNetworkPolicyFormValues = {
  annotations?: KeyValueEditorItem[];
  egress?: NetworkPolicyRuleItem[];
  ingress?: NetworkPolicyRuleItem[];
  labels?: KeyValueEditorItem[];
  name?: string;
  namespace?: string;
  podSelector?: NetworkPolicyLabelSelectorValues;
  policyTypes?: NetworkPolicyPolicyType[];
};

export type {
  CreateNetworkPolicyFormValues,
  NetworkPolicyLabelSelectorValues,
  NetworkPolicyPeerItem,
  NetworkPolicyPeerType,
  NetworkPolicyPolicyType,
  NetworkPolicyPortItem,
  NetworkPolicyProtocol,
  NetworkPolicyRuleItem,
  NetworkPolicySelectorExpressionItem,
  NetworkPolicySelectorOperator,
};
