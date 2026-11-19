import type { KeyValueEditorItem } from '../shared/KeyValueEditor';

type IngressClassBooleanSelectValue = 'true' | 'false';

type IngressClassParameterScope = 'Cluster' | 'Namespace';

type CreateIngressClassFormValues = {
  annotations?: KeyValueEditorItem[];
  controller?: string;
  enableParameters?: IngressClassBooleanSelectValue;
  isDefaultClass?: IngressClassBooleanSelectValue;
  labels?: KeyValueEditorItem[];
  name?: string;
  parameterApiGroup?: string;
  parameterKind?: string;
  parameterName?: string;
  parameterNamespace?: string;
  parameterScope?: IngressClassParameterScope;
};

export type {
  CreateIngressClassFormValues,
  IngressClassBooleanSelectValue,
  IngressClassParameterScope,
};
