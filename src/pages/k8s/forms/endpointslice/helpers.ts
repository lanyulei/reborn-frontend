// 纯函数：不要在这里引入 React / antd（校验脚本会用 Node 直接加载本文件）

import type { Translate } from '@/utils/i18n';
import {
  createId,
  createKeyValueItem,
  getRecordValue,
  NAME_PATTERN,
  PORT_NAME_PATTERN,
  toRecord,
  trimValue,
} from '../shared/manifest';
import type { StringListEditorItem } from '../shared/StringListEditor';
import type {
  CreateEndpointSliceFormValues,
  EndpointSliceAddressType,
  EndpointSliceConditionValue,
  EndpointSliceEndpointItem,
  EndpointSlicePortItem,
  EndpointSliceProtocol,
  EndpointSliceTargetRefValues,
} from './types';

export { createKeyValueItem, NAME_PATTERN, PORT_NAME_PATTERN };

export const ENDPOINT_SLICE_API_VERSION = 'discovery.k8s.io/v1';
export const ENDPOINT_SLICE_KIND = 'EndpointSlice';
export const ENDPOINT_SLICE_SERVICE_LABEL = 'kubernetes.io/service-name';

const ADDRESS_TYPES: EndpointSliceAddressType[] = ['FQDN', 'IPv4', 'IPv6'];
const ENDPOINT_PROTOCOLS: EndpointSliceProtocol[] = ['SCTP', 'TCP', 'UDP'];

const setStringField = (
  target: Record<string, unknown>,
  key: string,
  value?: string,
) => {
  const nextValue = trimValue(value);
  if (nextValue) {
    target[key] = nextValue;
  }
};

const toStringList = (items?: StringListEditorItem[]) =>
  Array.from(
    new Set((items || []).map((item) => trimValue(item.value)).filter(Boolean)),
  );

const toConditionValue = (value?: EndpointSliceConditionValue) => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
};

const buildTargetRef = (targetRef?: EndpointSliceTargetRefValues) => {
  const target: Record<string, unknown> = {};

  setStringField(target, 'apiVersion', targetRef?.apiVersion);
  setStringField(target, 'fieldPath', targetRef?.fieldPath);
  setStringField(target, 'kind', targetRef?.kind);
  setStringField(target, 'name', targetRef?.name);
  setStringField(target, 'namespace', targetRef?.namespace);
  setStringField(target, 'resourceVersion', targetRef?.resourceVersion);
  setStringField(target, 'uid', targetRef?.uid);

  return Object.keys(target).length > 0 ? target : undefined;
};

const buildEndpoint = (endpoint: EndpointSliceEndpointItem) => {
  const addresses = toStringList(endpoint.addresses);
  const conditions: Record<string, unknown> = {};
  const forNodes = toStringList(endpoint.forNodes);
  const forZones = toStringList(endpoint.forZones);
  const targetRef = buildTargetRef(endpoint.targetRef);
  const ready = toConditionValue(endpoint.ready);
  const serving = toConditionValue(endpoint.serving);
  const terminating = toConditionValue(endpoint.terminating);
  const nextEndpoint: Record<string, unknown> = {
    addresses,
  };

  if (ready !== undefined) {
    conditions.ready = ready;
  }
  if (serving !== undefined) {
    conditions.serving = serving;
  }
  if (terminating !== undefined) {
    conditions.terminating = terminating;
  }
  if (Object.keys(conditions).length > 0) {
    nextEndpoint.conditions = conditions;
  }
  if (forNodes.length > 0 || forZones.length > 0) {
    nextEndpoint.hints = {
      ...(forNodes.length > 0
        ? { forNodes: forNodes.map((name) => ({ name })) }
        : {}),
      ...(forZones.length > 0
        ? { forZones: forZones.map((name) => ({ name })) }
        : {}),
    };
  }
  setStringField(nextEndpoint, 'hostname', endpoint.hostname);
  setStringField(nextEndpoint, 'nodeName', endpoint.nodeName);
  setStringField(nextEndpoint, 'zone', endpoint.zone);
  if (targetRef) {
    nextEndpoint.targetRef = targetRef;
  }

  return nextEndpoint;
};

const buildPort = (port: EndpointSlicePortItem) => {
  const name = trimValue(port.name);
  const appProtocol = trimValue(port.appProtocol);
  const hasPort = typeof port.port === 'number' && Number.isFinite(port.port);

  if (!name && !appProtocol && !hasPort) {
    return undefined;
  }

  return {
    ...(appProtocol ? { appProtocol } : {}),
    ...(name ? { name } : {}),
    ...(hasPort ? { port: port.port } : {}),
    protocol: port.protocol || 'TCP',
  };
};

export const createStringListItem = (value = ''): StringListEditorItem => ({
  id: createId(),
  value,
});

export const createEndpointSliceEndpointItem = (
  values?: Partial<EndpointSliceEndpointItem>,
): EndpointSliceEndpointItem => ({
  addresses: values?.addresses || [createStringListItem('10.0.0.10')],
  forNodes: values?.forNodes || [],
  forZones: values?.forZones || [],
  hostname: values?.hostname,
  id: values?.id || createId(),
  nodeName: values?.nodeName,
  ready: values?.ready || 'true',
  serving: values?.serving || 'unset',
  targetRef: values?.targetRef || {},
  terminating: values?.terminating || 'unset',
  zone: values?.zone,
});

export const createEndpointSlicePortItem = (
  values?: Partial<EndpointSlicePortItem>,
): EndpointSlicePortItem => ({
  appProtocol: values?.appProtocol,
  id: values?.id || createId(),
  name: values?.name,
  port: values?.port,
  protocol: values?.protocol || 'TCP',
});

export const getInitialCreateEndpointSliceValues = (
  namespace?: string,
): CreateEndpointSliceFormValues => ({
  addressType: 'IPv4',
  annotations: [createKeyValueItem()],
  endpoints: [createEndpointSliceEndpointItem()],
  labels: [createKeyValueItem()],
  name: undefined,
  namespace,
  ports: [
    createEndpointSlicePortItem({
      appProtocol: 'http',
      name: 'http',
      port: 80,
      protocol: 'TCP',
    }),
  ],
  serviceName: undefined,
});

export const getEndpointSliceStepFields = (step: number) => {
  if (step === 0) {
    return ['name', 'namespace', 'serviceName', 'addressType'];
  }
  if (step === 1) {
    return ['endpoints'];
  }
  if (step === 2) {
    return ['ports'];
  }
  return ['labels', 'annotations'];
};

export const buildCreateEndpointSliceManifest = (
  values: CreateEndpointSliceFormValues,
) => {
  const labels = toRecord(values.labels);
  const annotations = toRecord(values.annotations);
  const serviceName = trimValue(values.serviceName);

  if (serviceName) {
    labels[ENDPOINT_SLICE_SERVICE_LABEL] = serviceName;
  }

  const metadata: Record<string, unknown> = {
    name: trimValue(values.name),
    namespace: trimValue(values.namespace),
  };
  if (Object.keys(labels).length > 0) {
    metadata.labels = labels;
  }
  if (Object.keys(annotations).length > 0) {
    metadata.annotations = annotations;
  }

  const ports = (values.ports || []).map(buildPort).filter(Boolean);

  return {
    apiVersion: ENDPOINT_SLICE_API_VERSION,
    kind: ENDPOINT_SLICE_KIND,
    metadata,
    addressType: values.addressType || 'IPv4',
    endpoints: (values.endpoints || []).map(buildEndpoint),
    ...(ports.length > 0 ? { ports } : {}),
  };
};

export const hasStringListContent = (items?: StringListEditorItem[]) =>
  toStringList(items).length > 0;

export const getEndpointContentCount = (
  values: CreateEndpointSliceFormValues,
) =>
  (values.endpoints || []).filter((endpoint) =>
    hasStringListContent(endpoint.addresses),
  ).length;

export const getPortContentCount = (values: CreateEndpointSliceFormValues) =>
  (values.ports || []).filter((port) =>
    Boolean(trimValue(port.name) || trimValue(port.appProtocol) || port.port),
  ).length;

export const getMetadataContentCount = (
  values: CreateEndpointSliceFormValues,
) =>
  (values.labels || []).filter((item) => trimValue(item.keyName)).length +
  (values.annotations || []).filter((item) => trimValue(item.keyName)).length;

const isValidIPv4Address = (value: string) => {
  const parts = value.split('.');
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }
    const numericPart = Number(part);
    return numericPart >= 0 && numericPart <= 255 && `${numericPart}` === part;
  });
};

const isValidFqdnAddress = (value: string) =>
  value.length <= 253 &&
  value
    .split('.')
    .every((part) => /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(part));

const isValidEndpointAddress = (
  addressType: EndpointSliceAddressType | undefined,
  value: string,
) => {
  if (addressType === 'IPv4') {
    return isValidIPv4Address(value);
  }
  if (addressType === 'IPv6') {
    return (
      value.includes(':') &&
      value.length <= 45 &&
      /^[0-9a-fA-F:.]+$/.test(value)
    );
  }
  if (addressType === 'FQDN') {
    return isValidFqdnAddress(value);
  }

  return false;
};

const validateEndpointAddresses = (
  values: CreateEndpointSliceFormValues,
  t: Translate,
) => {
  const endpoints = values.endpoints || [];

  if (endpoints.length === 0) {
    return t('pages.k8s.forms.endpointslice.validation.endpoints.required');
  }

  for (const [index, endpoint] of endpoints.entries()) {
    const addresses = toStringList(endpoint.addresses);

    if (addresses.length === 0) {
      return t(
        'pages.k8s.forms.endpointslice.validation.endpoint.addressRequired',
        {
          index: index + 1,
        },
      );
    }

    const invalidAddress = addresses.find(
      (address) => !isValidEndpointAddress(values.addressType, address),
    );

    if (invalidAddress) {
      return t(
        'pages.k8s.forms.endpointslice.validation.endpoint.addressMismatch',
        {
          index: index + 1,
          address: invalidAddress,
          addressType: values.addressType,
        },
      );
    }
  }

  return undefined;
};

const validatePorts = (
  ports: EndpointSlicePortItem[] | undefined,
  t: Translate,
) => {
  const names = new Set<string>();

  for (const [index, port] of (ports || []).entries()) {
    const name = trimValue(port.name);

    if (name) {
      if (names.has(name)) {
        return t(
          'pages.k8s.forms.endpointslice.validation.port.nameDuplicate',
          { index: index + 1 },
        );
      }
      names.add(name);
    }
    if (
      port.port !== undefined &&
      (!Number.isInteger(port.port) || port.port < 1 || port.port > 65535)
    ) {
      return t('pages.k8s.forms.endpointslice.validation.port.range', {
        index: index + 1,
      });
    }
  }

  return undefined;
};

const validateBasicInfo = (
  values: CreateEndpointSliceFormValues,
  t: Translate,
) => {
  const name = trimValue(values.name);
  const serviceName = trimValue(values.serviceName);

  if (!name) {
    return t('pages.k8s.forms.common.name.required');
  }
  if (name.length > 63 || !NAME_PATTERN.test(name)) {
    return t('pages.k8s.forms.endpointslice.validation.name.invalid');
  }
  if (!trimValue(values.namespace)) {
    return t('pages.k8s.forms.common.namespace.required');
  }
  if (!serviceName) {
    return t('pages.k8s.forms.endpointslice.serviceName.required');
  }
  if (serviceName.length > 63 || !NAME_PATTERN.test(serviceName)) {
    return t('pages.k8s.forms.endpointslice.validation.serviceName.invalid');
  }
  if (!values.addressType || !ADDRESS_TYPES.includes(values.addressType)) {
    return t('pages.k8s.forms.endpointslice.addressType.required');
  }

  return undefined;
};

export const validateEndpointSliceStep = (
  values: CreateEndpointSliceFormValues,
  step: number,
  t: Translate,
) => {
  if (step === 0) {
    return validateBasicInfo(values, t);
  }
  if (step === 1) {
    return validateEndpointAddresses(values, t);
  }
  if (step === 2) {
    return validatePorts(values.ports, t);
  }

  return undefined;
};

export const validateEndpointSliceFormValues = (
  values: CreateEndpointSliceFormValues,
  t: Translate,
) => {
  for (const step of [0, 1, 2]) {
    const message = validateEndpointSliceStep(values, step, t);
    if (message) {
      return message;
    }
  }

  return undefined;
};

const validateYamlEndpoint = (
  endpoint: unknown,
  addressType: EndpointSliceAddressType,
  index: number,
  t: Translate,
) => {
  const endpointRecord = getRecordValue(endpoint);
  if (!endpointRecord) {
    return t('pages.k8s.forms.endpointslice.yaml.endpoint.notObject', {
      index,
    });
  }

  if (!Array.isArray(endpointRecord.addresses)) {
    return t('pages.k8s.forms.endpointslice.yaml.endpoint.addressesNotArray', {
      index,
    });
  }

  const hasInvalidAddressItem = endpointRecord.addresses.some(
    (item) => typeof item !== 'string' || !item.trim(),
  );
  if (hasInvalidAddressItem) {
    return t(
      'pages.k8s.forms.endpointslice.yaml.endpoint.addressesNotStrings',
      { index },
    );
  }

  const addresses = endpointRecord.addresses.map((item) => item.trim());
  if (addresses.length === 0) {
    return t('pages.k8s.forms.endpointslice.yaml.endpoint.addressesEmpty', {
      index,
    });
  }

  const invalidAddress = addresses.find(
    (address) => !isValidEndpointAddress(addressType, address),
  );
  if (invalidAddress) {
    return t('pages.k8s.forms.endpointslice.yaml.endpoint.addressMismatch', {
      index,
      address: invalidAddress,
      addressType,
    });
  }

  return undefined;
};

const validateYamlPorts = (ports: unknown, t: Translate) => {
  if (ports === undefined) {
    return undefined;
  }
  if (!Array.isArray(ports)) {
    return t('pages.k8s.forms.endpointslice.yaml.ports.notArray');
  }

  const names = new Set<string>();
  for (const [index, port] of ports.entries()) {
    const portRecord = getRecordValue(port);
    if (!portRecord) {
      return t('pages.k8s.forms.endpointslice.yaml.port.notObject', { index });
    }

    const protocol = portRecord.protocol;
    if (
      protocol !== undefined &&
      (typeof protocol !== 'string' ||
        !ENDPOINT_PROTOCOLS.includes(protocol as EndpointSliceProtocol))
    ) {
      return t('pages.k8s.forms.endpointslice.yaml.port.protocolInvalid', {
        index,
      });
    }
    if (
      portRecord.port !== undefined &&
      (typeof portRecord.port !== 'number' ||
        !Number.isInteger(portRecord.port) ||
        portRecord.port < 1 ||
        portRecord.port > 65535)
    ) {
      return t('pages.k8s.forms.endpointslice.yaml.port.portInvalid', {
        index,
      });
    }
    if (portRecord.name !== undefined && typeof portRecord.name !== 'string') {
      return t('pages.k8s.forms.endpointslice.yaml.port.nameNotString', {
        index,
      });
    }
    if (typeof portRecord.name === 'string' && portRecord.name.trim()) {
      const name = portRecord.name.trim();
      if (name.length > 15 || !PORT_NAME_PATTERN.test(name)) {
        return t('pages.k8s.forms.endpointslice.yaml.port.nameInvalid', {
          index,
        });
      }
      if (names.has(name)) {
        return t('pages.k8s.forms.endpointslice.yaml.port.nameDuplicate', {
          index,
        });
      }
      names.add(name);
    }
    if (
      portRecord.appProtocol !== undefined &&
      typeof portRecord.appProtocol !== 'string'
    ) {
      return t('pages.k8s.forms.endpointslice.yaml.port.appProtocolNotString', {
        index,
      });
    }
  }

  return undefined;
};

export const getEndpointSliceYamlValidationError = (
  resource: Record<string, unknown>,
  t: Translate,
) => {
  const metadataRecord = getRecordValue(resource.metadata);
  const labelsRecord = getRecordValue(metadataRecord?.labels);
  const name =
    typeof metadataRecord?.name === 'string' ? metadataRecord.name.trim() : '';
  const namespace =
    typeof metadataRecord?.namespace === 'string'
      ? metadataRecord.namespace.trim()
      : '';
  const kind = typeof resource.kind === 'string' ? resource.kind : '';
  const apiVersion =
    typeof resource.apiVersion === 'string' ? resource.apiVersion : '';
  const addressType =
    typeof resource.addressType === 'string'
      ? (resource.addressType as EndpointSliceAddressType)
      : undefined;
  const serviceName =
    typeof labelsRecord?.[ENDPOINT_SLICE_SERVICE_LABEL] === 'string'
      ? labelsRecord[ENDPOINT_SLICE_SERVICE_LABEL].trim()
      : '';

  if (!name || !namespace) {
    return t('pages.k8s.forms.common.yaml.nameNamespaceRequired');
  }
  if (!serviceName) {
    return t('pages.k8s.forms.endpointslice.yaml.serviceLabelRequired', {
      label: ENDPOINT_SLICE_SERVICE_LABEL,
    });
  }
  if (kind !== ENDPOINT_SLICE_KIND) {
    return t('pages.k8s.forms.common.yaml.kindMismatch', {
      kind: ENDPOINT_SLICE_KIND,
    });
  }
  if (apiVersion !== ENDPOINT_SLICE_API_VERSION) {
    return t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
      apiVersion: ENDPOINT_SLICE_API_VERSION,
    });
  }
  if (!addressType || !ADDRESS_TYPES.includes(addressType)) {
    return t('pages.k8s.forms.endpointslice.yaml.addressTypeInvalid');
  }
  if (!Array.isArray(resource.endpoints) || resource.endpoints.length === 0) {
    return t('pages.k8s.forms.endpointslice.yaml.endpointsRequired');
  }

  for (const [index, endpoint] of resource.endpoints.entries()) {
    const endpointError = validateYamlEndpoint(endpoint, addressType, index, t);
    if (endpointError) {
      return endpointError;
    }
  }

  return validateYamlPorts(resource.ports, t);
};

/** 清单里的 metadata.namespace（没有时为空串） */
export const getManifestNamespace = (resource: Record<string, unknown>) => {
  const namespace = getRecordValue(resource.metadata)?.namespace;
  return typeof namespace === 'string' ? namespace.trim() : '';
};
