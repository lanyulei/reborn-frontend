// 纯函数：不要在这里引入 React / antd（校验脚本会用 Node 直接加载本文件）
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

const validateEndpointAddresses = (values: CreateEndpointSliceFormValues) => {
  const endpoints = values.endpoints || [];

  if (endpoints.length === 0) {
    return '请至少添加一个端点';
  }

  for (const [index, endpoint] of endpoints.entries()) {
    const addresses = toStringList(endpoint.addresses);

    if (addresses.length === 0) {
      return `端点 ${index + 1} 至少需要填写一个地址`;
    }

    const invalidAddress = addresses.find(
      (address) => !isValidEndpointAddress(values.addressType, address),
    );

    if (invalidAddress) {
      return `端点 ${index + 1} 的地址 ${invalidAddress} 与地址类型 ${values.addressType} 不匹配`;
    }
  }

  return undefined;
};

const validatePorts = (ports?: EndpointSlicePortItem[]) => {
  const names = new Set<string>();

  for (const [index, port] of (ports || []).entries()) {
    const name = trimValue(port.name);

    if (name) {
      if (names.has(name)) {
        return `端口 ${index + 1} 的名称不能重复`;
      }
      names.add(name);
    }
    if (
      port.port !== undefined &&
      (!Number.isInteger(port.port) || port.port < 1 || port.port > 65535)
    ) {
      return `端口 ${index + 1} 的端口号必须在 1-65535 之间`;
    }
  }

  return undefined;
};

const validateBasicInfo = (values: CreateEndpointSliceFormValues) => {
  const name = trimValue(values.name);
  const serviceName = trimValue(values.serviceName);

  if (!name) {
    return '请输入名称';
  }
  if (name.length > 63 || !NAME_PATTERN.test(name)) {
    return '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾，最长 63 个字符';
  }
  if (!trimValue(values.namespace)) {
    return '请选择命名空间';
  }
  if (!serviceName) {
    return '请选择或输入关联服务';
  }
  if (serviceName.length > 63 || !NAME_PATTERN.test(serviceName)) {
    return '服务名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾，最长 63 个字符';
  }
  if (!values.addressType || !ADDRESS_TYPES.includes(values.addressType)) {
    return '请选择地址类型';
  }

  return undefined;
};

export const validateEndpointSliceStep = (
  values: CreateEndpointSliceFormValues,
  step: number,
) => {
  if (step === 0) {
    return validateBasicInfo(values);
  }
  if (step === 1) {
    return validateEndpointAddresses(values);
  }
  if (step === 2) {
    return validatePorts(values.ports);
  }

  return undefined;
};

export const validateEndpointSliceFormValues = (
  values: CreateEndpointSliceFormValues,
) => {
  for (const step of [0, 1, 2]) {
    const message = validateEndpointSliceStep(values, step);
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
) => {
  const endpointRecord = getRecordValue(endpoint);
  if (!endpointRecord) {
    return `YAML endpoints[${index}] 必须为对象`;
  }

  if (!Array.isArray(endpointRecord.addresses)) {
    return `YAML endpoints[${index}].addresses 必须为字符串数组`;
  }

  const hasInvalidAddressItem = endpointRecord.addresses.some(
    (item) => typeof item !== 'string' || !item.trim(),
  );
  if (hasInvalidAddressItem) {
    return `YAML endpoints[${index}].addresses 必须全部为非空字符串`;
  }

  const addresses = endpointRecord.addresses.map((item) => item.trim());
  if (addresses.length === 0) {
    return `YAML endpoints[${index}].addresses 必须至少包含一个字符串地址`;
  }

  const invalidAddress = addresses.find(
    (address) => !isValidEndpointAddress(addressType, address),
  );
  if (invalidAddress) {
    return `YAML endpoints[${index}] 的地址 ${invalidAddress} 与地址类型 ${addressType} 不匹配`;
  }

  return undefined;
};

const validateYamlPorts = (ports: unknown) => {
  if (ports === undefined) {
    return undefined;
  }
  if (!Array.isArray(ports)) {
    return 'YAML ports 必须为数组';
  }

  const names = new Set<string>();
  for (const [index, port] of ports.entries()) {
    const portRecord = getRecordValue(port);
    if (!portRecord) {
      return `YAML ports[${index}] 必须为对象`;
    }

    const protocol = portRecord.protocol;
    if (
      protocol !== undefined &&
      (typeof protocol !== 'string' ||
        !ENDPOINT_PROTOCOLS.includes(protocol as EndpointSliceProtocol))
    ) {
      return `YAML ports[${index}].protocol 必须为 SCTP、TCP 或 UDP`;
    }
    if (
      portRecord.port !== undefined &&
      (typeof portRecord.port !== 'number' ||
        !Number.isInteger(portRecord.port) ||
        portRecord.port < 1 ||
        portRecord.port > 65535)
    ) {
      return `YAML ports[${index}].port 必须为 1-65535 的整数`;
    }
    if (portRecord.name !== undefined && typeof portRecord.name !== 'string') {
      return `YAML ports[${index}].name 必须为字符串`;
    }
    if (typeof portRecord.name === 'string' && portRecord.name.trim()) {
      const name = portRecord.name.trim();
      if (name.length > 15 || !PORT_NAME_PATTERN.test(name)) {
        return `YAML ports[${index}].name 只能包含小写字母、数字和连字符（-），最长 15 个字符`;
      }
      if (names.has(name)) {
        return `YAML ports[${index}].name 不能重复`;
      }
      names.add(name);
    }
    if (
      portRecord.appProtocol !== undefined &&
      typeof portRecord.appProtocol !== 'string'
    ) {
      return `YAML ports[${index}].appProtocol 必须为字符串`;
    }
  }

  return undefined;
};

export const getEndpointSliceYamlValidationError = (
  resource: Record<string, unknown>,
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
    return 'YAML 必须包含 metadata.name 和 metadata.namespace';
  }
  if (!serviceName) {
    return `YAML 必须包含 metadata.labels.${ENDPOINT_SLICE_SERVICE_LABEL}`;
  }
  if (kind !== ENDPOINT_SLICE_KIND) {
    return `YAML kind 必须为 ${ENDPOINT_SLICE_KIND}`;
  }
  if (apiVersion !== ENDPOINT_SLICE_API_VERSION) {
    return `YAML apiVersion 必须为 ${ENDPOINT_SLICE_API_VERSION}`;
  }
  if (!addressType || !ADDRESS_TYPES.includes(addressType)) {
    return 'YAML addressType 必须为 FQDN、IPv4 或 IPv6';
  }
  if (!Array.isArray(resource.endpoints) || resource.endpoints.length === 0) {
    return 'YAML endpoints 必须至少包含一个端点';
  }

  for (const [index, endpoint] of resource.endpoints.entries()) {
    const endpointError = validateYamlEndpoint(endpoint, addressType, index);
    if (endpointError) {
      return endpointError;
    }
  }

  return validateYamlPorts(resource.ports);
};

/** 清单里的 metadata.namespace（没有时为空串） */
export const getManifestNamespace = (resource: Record<string, unknown>) => {
  const namespace = getRecordValue(resource.metadata)?.namespace;
  return typeof namespace === 'string' ? namespace.trim() : '';
};
