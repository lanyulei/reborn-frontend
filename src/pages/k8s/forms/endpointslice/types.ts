import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import type { StringListEditorItem } from '../shared/StringListEditor';

type EndpointSliceAddressType = 'FQDN' | 'IPv4' | 'IPv6';

type EndpointSliceProtocol = 'SCTP' | 'TCP' | 'UDP';

type EndpointSliceConditionValue = 'false' | 'true' | 'unset';

type EndpointSliceTargetRefValues = {
  apiVersion?: string;
  fieldPath?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  resourceVersion?: string;
  uid?: string;
};

type EndpointSliceEndpointItem = {
  addresses?: StringListEditorItem[];
  forNodes?: StringListEditorItem[];
  forZones?: StringListEditorItem[];
  hostname?: string;
  id: string;
  nodeName?: string;
  ready?: EndpointSliceConditionValue;
  serving?: EndpointSliceConditionValue;
  targetRef?: EndpointSliceTargetRefValues;
  terminating?: EndpointSliceConditionValue;
  zone?: string;
};

type EndpointSlicePortItem = {
  appProtocol?: string;
  id: string;
  name?: string;
  port?: number;
  protocol?: EndpointSliceProtocol;
};

type CreateEndpointSliceFormValues = {
  addressType?: EndpointSliceAddressType;
  annotations?: KeyValueEditorItem[];
  endpoints?: EndpointSliceEndpointItem[];
  labels?: KeyValueEditorItem[];
  name?: string;
  namespace?: string;
  ports?: EndpointSlicePortItem[];
  serviceName?: string;
};

export type {
  CreateEndpointSliceFormValues,
  EndpointSliceAddressType,
  EndpointSliceConditionValue,
  EndpointSliceEndpointItem,
  EndpointSlicePortItem,
  EndpointSliceProtocol,
  EndpointSliceTargetRefValues,
};
