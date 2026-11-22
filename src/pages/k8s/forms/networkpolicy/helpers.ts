// 纯函数：不要在这里引入 React / antd（校验脚本会用 Node 直接加载本文件）
// 校验文案通过参数 t（useT() 的返回值）翻译，本文件只持有 i18n 键
import type { Translate } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import {
  createId,
  createKeyValueItem,
  getRecordValue,
  NAME_PATTERN,
  toRecord,
  trimValue,
} from '../shared/manifest';
import type {
  CreateNetworkPolicyFormValues,
  NetworkPolicyLabelSelectorValues,
  NetworkPolicyPeerItem,
  NetworkPolicyPeerType,
  NetworkPolicyPolicyType,
  NetworkPolicyPortItem,
  NetworkPolicyRuleItem,
  NetworkPolicySelectorExpressionItem,
  NetworkPolicySelectorOperator,
} from './types';

export { createKeyValueItem, NAME_PATTERN, toRecord };

export const NETWORK_POLICY_API_VERSION = 'networking.k8s.io/v1';
export const NETWORK_POLICY_KIND = 'NetworkPolicy';

const parseIPv4 = (value: string): bigint | undefined => {
  const parts = value.split('.');
  if (parts.length !== 4) {
    return undefined;
  }

  let address = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || `${Number(part)}` !== part) {
      return undefined;
    }
    if (Number(part) > 255) {
      return undefined;
    }
    address = (address << 8n) | BigInt(Number(part));
  }
  return address;
};

const parseIPv6 = (value: string): bigint | undefined => {
  let text = value;

  // 末段允许内嵌 IPv4（如 ::ffff:10.0.0.1）
  if (text.includes('.')) {
    const lastColon = text.lastIndexOf(':');
    const ipv4 = parseIPv4(text.slice(lastColon + 1));
    if (lastColon < 0 || ipv4 === undefined) {
      return undefined;
    }
    text = `${text.slice(0, lastColon + 1)}${(ipv4 >> 16n).toString(16)}:${(ipv4 & 0xffffn).toString(16)}`;
  }

  const halves = text.split('::');
  if (halves.length > 2) {
    return undefined;
  }
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves[1] ? halves[1].split(':') : [];
  const compressed = halves.length === 2;

  if (compressed ? head.length + tail.length > 7 : head.length !== 8) {
    return undefined;
  }

  const groups = compressed
    ? [
        ...head,
        ...Array.from({ length: 8 - head.length - tail.length }, () => '0'),
        ...tail,
      ]
    : head;

  let address = 0n;
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
      return undefined;
    }
    address = (address << 16n) | BigInt(Number.parseInt(group, 16));
  }
  return address;
};

type ParsedCidr = { address: bigint; bits: 32 | 128; prefix: number };

const parseCidr = (value?: string): ParsedCidr | undefined => {
  const parts = trimValue(value).split('/');
  if (parts.length !== 2 || !/^\d{1,3}$/.test(parts[1])) {
    return undefined;
  }

  const bits = parts[0].includes(':') ? 128 : 32;
  const address = bits === 128 ? parseIPv6(parts[0]) : parseIPv4(parts[0]);
  const prefix = Number(parts[1]);

  if (address === undefined || prefix > bits) {
    return undefined;
  }
  return { address, bits, prefix };
};

/** 是否为合法的 IPv4 / IPv6 CIDR（如 10.0.0.0/24、fd00::/64） */
export const isValidCidr = (value?: string) => parseCidr(value) !== undefined;

/** except 必须是 cidr 的真子集：同地址族、落在 cidr 内且前缀更长 */
const isStrictSubsetCidr = (outer: ParsedCidr, inner: ParsedCidr) => {
  if (outer.bits !== inner.bits || inner.prefix <= outer.prefix) {
    return false;
  }
  const shift = BigInt(outer.bits - outer.prefix);
  return outer.address >> shift === inner.address >> shift;
};

// IANA 服务名：最长 15 个字符，小写字母 / 数字 / 连字符，至少一个字母，连字符不能在首尾或连续出现
const isValidPortName = (value: string) =>
  value.length <= 15 &&
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value) &&
  /[a-z]/.test(value) &&
  !value.includes('--');

const getPortNumber = (value?: string) => {
  const portValue = trimValue(value);
  if (!/^\d+$/.test(portValue)) {
    return undefined;
  }
  const numberValue = Number(portValue);
  return Number.isInteger(numberValue) ? numberValue : undefined;
};

const getPortManifestValue = (value?: string) => {
  const portValue = trimValue(value);
  if (!portValue) {
    return undefined;
  }
  return /^\d+$/.test(portValue) ? Number(portValue) : portValue;
};

export const createSelectorExpressionItem = (
  values?: Partial<NetworkPolicySelectorExpressionItem>,
): NetworkPolicySelectorExpressionItem => ({
  id: values?.id || createId(),
  keyName: values?.keyName,
  operator: values?.operator || 'In',
  values: values?.values || [],
});

export const createLabelSelectorValues = (
  values?: Partial<NetworkPolicyLabelSelectorValues>,
): NetworkPolicyLabelSelectorValues => ({
  matchExpressions: values?.matchExpressions || [],
  matchLabels:
    values?.matchLabels && values.matchLabels.length > 0
      ? values.matchLabels
      : [createKeyValueItem()],
});

export const createNetworkPolicyPeerItem = (
  values?: Partial<NetworkPolicyPeerItem>,
): NetworkPolicyPeerItem => {
  const type = values?.type || 'podSelector';

  return {
    id: values?.id || createId(),
    type,
    ipBlockCidr: values?.ipBlockCidr,
    ipBlockExcept: values?.ipBlockExcept,
    podSelector:
      values?.podSelector ||
      (type === 'podSelector' || type === 'podAndNamespaceSelector'
        ? createLabelSelectorValues()
        : undefined),
    namespaceSelector:
      values?.namespaceSelector ||
      (type === 'namespaceSelector' || type === 'podAndNamespaceSelector'
        ? createLabelSelectorValues()
        : undefined),
  };
};

export const createNetworkPolicyPortItem = (
  values?: Partial<NetworkPolicyPortItem>,
): NetworkPolicyPortItem => ({
  id: values?.id || createId(),
  endPort: values?.endPort,
  port: values?.port,
  protocol: values?.protocol || 'TCP',
});

export const createNetworkPolicyRuleItem = (
  values?: Partial<NetworkPolicyRuleItem>,
): NetworkPolicyRuleItem => ({
  id: values?.id || createId(),
  peers: values?.peers || [],
  ports: values?.ports || [],
});

export const getInitialCreateNetworkPolicyValues = (
  namespace?: string,
): CreateNetworkPolicyFormValues => ({
  annotations: [createKeyValueItem()],
  egress: [],
  ingress: [],
  labels: [createKeyValueItem()],
  name: undefined,
  namespace,
  podSelector: createLabelSelectorValues(),
  policyTypes: ['Ingress'],
});

export const getNetworkPolicyStepFields = (step: number) => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    return ['podSelector', 'policyTypes'];
  }
  if (step === 2) {
    return ['ingress'];
  }
  if (step === 3) {
    return ['egress'];
  }
  return ['labels', 'annotations'];
};

export const selectorOperatorNeedsValues = (
  operator?: NetworkPolicySelectorOperator,
) => operator === 'In' || operator === 'NotIn';

const getCleanExpressionValues = (values?: string[]) =>
  Array.from(
    new Set((values || []).map((item) => trimValue(item)).filter(Boolean)),
  );

const buildLabelSelector = (selector?: NetworkPolicyLabelSelectorValues) => {
  const matchLabels = toRecord(selector?.matchLabels);
  const matchExpressions = (selector?.matchExpressions || [])
    .map((expression) => {
      const keyName = trimValue(expression.keyName);
      if (!keyName) {
        return undefined;
      }

      const requirement: Record<string, unknown> = {
        key: keyName,
        operator: expression.operator,
      };
      const values = getCleanExpressionValues(expression.values);

      if (selectorOperatorNeedsValues(expression.operator)) {
        requirement.values = values;
      }

      return requirement;
    })
    .filter(Boolean);

  return {
    ...(Object.keys(matchLabels).length > 0 ? { matchLabels } : {}),
    ...(matchExpressions.length > 0 ? { matchExpressions } : {}),
  };
};

const buildNetworkPolicyPeer = (peer: NetworkPolicyPeerItem) => {
  if (peer.type === 'ipBlock') {
    const cidr = trimValue(peer.ipBlockCidr);
    const except = getCleanExpressionValues(peer.ipBlockExcept);

    if (!cidr) {
      return undefined;
    }

    return {
      ipBlock: {
        cidr,
        ...(except.length > 0 ? { except } : {}),
      },
    };
  }

  if (peer.type === 'namespaceSelector') {
    return {
      namespaceSelector: buildLabelSelector(peer.namespaceSelector),
    };
  }

  if (peer.type === 'podAndNamespaceSelector') {
    return {
      namespaceSelector: buildLabelSelector(peer.namespaceSelector),
      podSelector: buildLabelSelector(peer.podSelector),
    };
  }

  return {
    podSelector: buildLabelSelector(peer.podSelector),
  };
};

const buildNetworkPolicyPorts = (ports?: NetworkPolicyPortItem[]) =>
  (ports || []).map((port) => {
    const nextPort: Record<string, unknown> = {
      protocol: port.protocol || 'TCP',
    };
    const portValue = getPortManifestValue(port.port);

    if (portValue !== undefined) {
      nextPort.port = portValue;
    }
    if (typeof port.endPort === 'number') {
      nextPort.endPort = port.endPort;
    }

    return nextPort;
  });

const buildNetworkPolicyRules = (
  rules: NetworkPolicyRuleItem[] | undefined,
  peerFieldName: 'from' | 'to',
) =>
  (rules || []).map((rule) => {
    const peers = (rule.peers || [])
      .map(buildNetworkPolicyPeer)
      .filter(Boolean);
    const ports = buildNetworkPolicyPorts(rule.ports);
    const nextRule: Record<string, unknown> = {};

    if (ports.length > 0) {
      nextRule.ports = ports;
    }
    if (peers.length > 0) {
      nextRule[peerFieldName] = peers;
    }

    return nextRule;
  });

const getSelectedPolicyTypes = (values: CreateNetworkPolicyFormValues) => {
  const selectedTypes = values.policyTypes || [];

  return (['Ingress', 'Egress'] as NetworkPolicyPolicyType[]).filter((type) =>
    selectedTypes.includes(type),
  );
};

export const buildCreateNetworkPolicyManifest = (
  values: CreateNetworkPolicyFormValues,
) => {
  const labels = toRecord(values.labels);
  const annotations = toRecord(values.annotations);
  const policyTypes = getSelectedPolicyTypes(values);
  const spec: Record<string, unknown> = {
    podSelector: buildLabelSelector(values.podSelector),
    policyTypes,
  };

  if (policyTypes.includes('Ingress')) {
    spec.ingress = buildNetworkPolicyRules(values.ingress, 'from');
  }
  if (policyTypes.includes('Egress')) {
    spec.egress = buildNetworkPolicyRules(values.egress, 'to');
  }

  return {
    apiVersion: NETWORK_POLICY_API_VERSION,
    kind: NETWORK_POLICY_KIND,
    metadata: {
      name: trimValue(values.name),
      namespace: trimValue(values.namespace),
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    spec,
  };
};

export const hasKeyValueContent = (items?: KeyValueEditorItem[]) =>
  (items || []).some((item) => trimValue(item.keyName));

export const hasSelectorContent = (
  selector?: NetworkPolicyLabelSelectorValues,
) =>
  hasKeyValueContent(selector?.matchLabels) ||
  (selector?.matchExpressions || []).some((item) => trimValue(item.keyName));

export const hasRulesContent = (rules?: NetworkPolicyRuleItem[]) =>
  (rules || []).length > 0;

export const hasMetadataContent = (values: CreateNetworkPolicyFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const validateSelectorExpressions = (
  selector: NetworkPolicyLabelSelectorValues | undefined,
  label: string,
  t: Translate,
) => {
  for (const expression of selector?.matchExpressions || []) {
    const keyName = trimValue(expression.keyName);
    const values = getCleanExpressionValues(expression.values);

    if (!keyName) {
      return t('pages.k8s.forms.networkpolicy.selector.expressionKeyRequired', {
        label,
      });
    }
    if (
      selectorOperatorNeedsValues(expression.operator) &&
      values.length === 0
    ) {
      return t(
        'pages.k8s.forms.networkpolicy.selector.expressionValuesRequired',
        { label, operator: expression.operator },
      );
    }
  }

  return undefined;
};

/** ipBlock.except 的错误：每一项须为合法 CIDR，且是 cidr 的真子集 */
export const getIpBlockExceptError = (
  peer: Pick<NetworkPolicyPeerItem, 'ipBlockCidr' | 'ipBlockExcept'>,
  t: Translate,
) => {
  const cidr = parseCidr(peer.ipBlockCidr);

  for (const item of getCleanExpressionValues(peer.ipBlockExcept)) {
    const except = parseCidr(item);
    if (!except) {
      return t('pages.k8s.forms.networkpolicy.ipBlock.exceptInvalid', {
        item,
      });
    }
    if (cidr && !isStrictSubsetCidr(cidr, except)) {
      return t('pages.k8s.forms.networkpolicy.ipBlock.exceptNotSubset', {
        item,
        cidr: trimValue(peer.ipBlockCidr),
      });
    }
  }

  return undefined;
};

/** 端口行的错误：端口须为 1-65535 的数字或合法端口名；结束端口要求端口为数字且不小于端口 */
export const getPortError = (
  port: Pick<NetworkPolicyPortItem, 'endPort' | 'port'>,
  t: Translate,
): { field: 'endPort' | 'port'; message: string } | undefined => {
  const portValue = trimValue(port.port);
  const portNumber = getPortNumber(port.port);

  if (portNumber !== undefined) {
    if (portNumber < 1 || portNumber > 65535) {
      return {
        field: 'port',
        message: t('pages.k8s.forms.networkpolicy.port.range'),
      };
    }
  } else if (portValue && !isValidPortName(portValue)) {
    return {
      field: 'port',
      message: t('pages.k8s.forms.networkpolicy.port.namePattern'),
    };
  }

  if (typeof port.endPort !== 'number') {
    return undefined;
  }
  if (portNumber === undefined) {
    return {
      field: 'endPort',
      message: t('pages.k8s.forms.networkpolicy.endPort.portMustBeNumber'),
    };
  }
  if (
    !Number.isInteger(port.endPort) ||
    port.endPort < 1 ||
    port.endPort > 65535
  ) {
    return {
      field: 'endPort',
      message: t('pages.k8s.forms.networkpolicy.endPort.range'),
    };
  }
  if (port.endPort < portNumber) {
    return {
      field: 'endPort',
      message: t('pages.k8s.forms.networkpolicy.endPort.lessThanPort'),
    };
  }

  return undefined;
};

const validatePeer = (
  peer: NetworkPolicyPeerItem,
  peerLabel: string,
  ruleIndex: number,
  t: Translate,
) => {
  const index = ruleIndex + 1;

  if (peer.type === 'ipBlock') {
    if (!trimValue(peer.ipBlockCidr)) {
      return t('pages.k8s.forms.networkpolicy.peer.cidrRequired', {
        peer: peerLabel,
        index,
      });
    }
    if (!isValidCidr(peer.ipBlockCidr)) {
      return t('pages.k8s.forms.networkpolicy.peer.cidrInvalid', {
        peer: peerLabel,
        index,
        cidr: trimValue(peer.ipBlockCidr),
      });
    }
    const exceptMessage = getIpBlockExceptError(peer, t);
    if (exceptMessage) {
      return t('pages.k8s.forms.networkpolicy.peer.prefix', {
        peer: peerLabel,
        index,
        message: exceptMessage,
      });
    }
  }

  const podSelectorMessage =
    peer.type === 'podSelector' || peer.type === 'podAndNamespaceSelector'
      ? validateSelectorExpressions(
          peer.podSelector,
          t('pages.k8s.forms.networkpolicy.peer.podSelectorOf', {
            peer: peerLabel,
            index,
          }),
          t,
        )
      : undefined;
  if (podSelectorMessage) {
    return podSelectorMessage;
  }

  const namespaceSelectorMessage =
    peer.type === 'namespaceSelector' || peer.type === 'podAndNamespaceSelector'
      ? validateSelectorExpressions(
          peer.namespaceSelector,
          t('pages.k8s.forms.networkpolicy.peer.namespaceSelectorOf', {
            peer: peerLabel,
            index,
          }),
          t,
        )
      : undefined;
  if (namespaceSelectorMessage) {
    return namespaceSelectorMessage;
  }

  return undefined;
};

const validatePort = (
  port: NetworkPolicyPortItem,
  ruleLabel: string,
  ruleIndex: number,
  t: Translate,
) => {
  const error = getPortError(port, t);

  return error
    ? t('pages.k8s.forms.networkpolicy.rule.prefix', {
        rule: ruleLabel,
        index: ruleIndex + 1,
        message: error.message,
      })
    : undefined;
};

const validateRules = (
  rules: NetworkPolicyRuleItem[] | undefined,
  ruleLabel: string,
  peerLabel: string,
  t: Translate,
) => {
  for (const [ruleIndex, rule] of (rules || []).entries()) {
    for (const peer of rule.peers || []) {
      const peerMessage = validatePeer(peer, peerLabel, ruleIndex, t);
      if (peerMessage) {
        return peerMessage;
      }
    }

    for (const port of rule.ports || []) {
      const portMessage = validatePort(port, ruleLabel, ruleIndex, t);
      if (portMessage) {
        return portMessage;
      }
    }
  }

  return undefined;
};

const validateBasicInfo = (
  values: CreateNetworkPolicyFormValues,
  t: Translate,
) => {
  const name = trimValue(values.name);

  if (!name) {
    return t('pages.k8s.forms.common.name.required');
  }
  if (name.length > 63 || !NAME_PATTERN.test(name)) {
    return t('pages.k8s.forms.common.name.dnsLabel');
  }
  if (!trimValue(values.namespace)) {
    return t('pages.k8s.forms.common.namespace.required');
  }

  return undefined;
};

export const validateNetworkPolicyStep = (
  values: CreateNetworkPolicyFormValues,
  step: number,
  t: Translate,
) => {
  if (step === 0) {
    return validateBasicInfo(values, t);
  }
  if (step === 1) {
    if (!values.policyTypes?.length) {
      return t('pages.k8s.forms.networkpolicy.policyTypes.required');
    }
    return validateSelectorExpressions(
      values.podSelector,
      t('pages.k8s.forms.common.podSelector'),
      t,
    );
  }
  if (step === 2 && values.policyTypes?.includes('Ingress')) {
    return validateRules(
      values.ingress,
      t('pages.k8s.forms.networkpolicy.ingress'),
      t('pages.k8s.forms.networkpolicy.source'),
      t,
    );
  }
  if (step === 3 && values.policyTypes?.includes('Egress')) {
    return validateRules(
      values.egress,
      t('pages.k8s.forms.networkpolicy.egress'),
      t('pages.k8s.forms.networkpolicy.destination'),
      t,
    );
  }

  return undefined;
};

export const validateNetworkPolicyFormValues = (
  values: CreateNetworkPolicyFormValues,
  t: Translate,
) => {
  for (const step of [0, 1, 2, 3]) {
    const message = validateNetworkPolicyStep(values, step, t);
    if (message) {
      return message;
    }
  }

  return undefined;
};

export const getDefaultPeerForType = (
  type: NetworkPolicyPeerType,
  peer?: NetworkPolicyPeerItem,
) =>
  createNetworkPolicyPeerItem({
    id: peer?.id,
    type,
    ipBlockCidr: peer?.ipBlockCidr,
    ipBlockExcept: peer?.ipBlockExcept,
    namespaceSelector: peer?.namespaceSelector,
    podSelector: peer?.podSelector,
  });

/** 清单里的 metadata.namespace（没有时为空串） */
export const getManifestNamespace = (resource: Record<string, unknown>) => {
  const namespace = getRecordValue(resource.metadata)?.namespace;
  return typeof namespace === 'string' ? namespace.trim() : '';
};

/** 手写 YAML 的本地预检；最终以服务端预检为准 */
export const getNetworkPolicyYamlValidationError = (
  resource: Record<string, unknown>,
  t: Translate,
) => {
  const name = getRecordValue(resource.metadata)?.name;

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    !getManifestNamespace(resource)
  ) {
    return t('pages.k8s.forms.common.yaml.nameNamespaceRequired');
  }
  if (resource.kind !== NETWORK_POLICY_KIND) {
    return t('pages.k8s.forms.common.yaml.kindMismatch', {
      kind: NETWORK_POLICY_KIND,
    });
  }
  if (resource.apiVersion !== NETWORK_POLICY_API_VERSION) {
    return t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
      apiVersion: NETWORK_POLICY_API_VERSION,
    });
  }

  return undefined;
};
