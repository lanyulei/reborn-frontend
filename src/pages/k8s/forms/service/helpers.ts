import type { Translate } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import {
  createId,
  createKeyValueItem,
  getArrayValue,
  getRecordValue,
  getStringValue,
  NAME_PATTERN,
  PORT_NAME_PATTERN,
  toRecord,
} from '../shared/manifest';
import type {
  CreateServiceFormValues,
  ServicePortItem,
  ServicePortProtocol,
  WorkloadContainerPort,
  WorkloadSelectorItem,
} from './types';

export { createKeyValueItem, NAME_PATTERN, PORT_NAME_PATTERN };

export const SERVICE_API_VERSION = 'v1';
export const SERVICE_KIND = 'Service';

export const PORT_NAME_MAX_LENGTH = 15;
export const NODE_PORT_MIN = 30000;
export const NODE_PORT_MAX = 32767;
export const DEFAULT_SESSION_AFFINITY_TIMEOUT_SECONDS = 10800;

const APP_PROTOCOLS: ServicePortProtocol[] = [
  'GRPC',
  'HTTP',
  'HTTP2',
  'HTTPS',
  'MONGO',
  'REDIS',
  'TLS',
];

/**
 * 生成合法且不重复的端口名称：小写 DNS 标签、最长 15 个字符。
 * 第一个用协议名（http），之后依次为 http-1、http-2 …
 */
export const createServicePortName = (
  protocol: ServicePortProtocol,
  existingNames: (string | undefined)[] = [],
) => {
  const base = protocol.toLowerCase();
  const used = new Set(existingNames.map((name) => name?.trim()));

  if (!used.has(base)) {
    return base;
  }
  let index = 1;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
};

/** 按给定值创建端口行；名称原样保留（不自动生成），用于从清单还原 */
export const createServicePortItem = (
  values?: Partial<ServicePortItem>,
): ServicePortItem => ({
  id: createId(),
  protocol: values?.protocol || 'HTTP',
  name: values?.name,
  containerPort: values?.containerPort,
  targetPort: values?.targetPort,
  servicePort: values?.servicePort,
  nodePort: values?.nodePort,
  appProtocol: values?.appProtocol,
});

/** 新增一行端口：带一个与已有端口不重名的合法名称 */
export const createDefaultServicePortItem = (
  existingPorts: ServicePortItem[] = [],
  values?: Partial<ServicePortItem>,
): ServicePortItem => {
  const protocol = values?.protocol || 'HTTP';

  return createServicePortItem({
    ...values,
    protocol,
    name:
      values?.name ||
      createServicePortName(
        protocol,
        existingPorts.map((port) => port?.name),
      ),
  });
};

export const getInitialCreateServiceValues = (
  namespace?: string,
): CreateServiceFormValues => ({
  name: undefined,
  namespace,
  internalAccessMode: 'ClusterIP',
  selectors: [createKeyValueItem()],
  ports: [createDefaultServicePortItem()],
  enableExternalAccess: false,
  externalAccessMode: 'NodePort',
  enableSessionAffinity: false,
  sessionAffinityTimeoutSeconds: DEFAULT_SESSION_AFFINITY_TIMEOUT_SECONDS,
  externalAccessAnnotations: [createKeyValueItem()],
  loadBalancerProvider: undefined,
  loadBalancerClass: undefined,
  allocateLoadBalancerNodePorts: true,
  externalTrafficPolicy: undefined,
  internalTrafficPolicy: undefined,
  ipFamilyPolicy: undefined,
  ipFamilies: undefined,
  trafficDistribution: undefined,
  labels: [createKeyValueItem()],
  annotations: [createKeyValueItem()],
});

const toNullableRecordPatch = (
  nextItems?: KeyValueEditorItem[],
  previousRecord?: Record<string, unknown>,
) => {
  const nextRecord = toRecord(nextItems);
  const patch = Object.keys(previousRecord || {}).reduce<
    Record<string, string | null>
  >((record, keyName) => {
    if (!(keyName in nextRecord)) {
      record[keyName] = null;
    }
    return record;
  }, {});

  Object.entries(nextRecord).forEach(([keyName, value]) => {
    patch[keyName] = value;
  });

  return patch;
};

const toKeyValueItems = (record?: Record<string, unknown>) => {
  const entries = Object.entries(record || {});

  return entries.length > 0
    ? entries.map(([keyName, value]) =>
        createKeyValueItem(keyName, String(value ?? '')),
      )
    : [createKeyValueItem()];
};

const getNumberValue = (value: unknown) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : undefined;

const getBooleanValue = (value: unknown) =>
  typeof value === 'boolean' ? value : undefined;

const getStringRecord = (value: unknown) => {
  const record = getRecordValue(value);
  if (!record) {
    return undefined;
  }
  return Object.entries(record).reduce<Record<string, string>>(
    (result, [keyName, item]) => {
      result[keyName] = String(item ?? '');
      return result;
    },
    {},
  );
};

const getKubernetesProtocol = (protocol: ServicePortProtocol) =>
  protocol === 'UDP' || protocol === 'SCTP' ? protocol : 'TCP';

const getAppProtocol = (protocol: ServicePortProtocol) =>
  APP_PROTOCOLS.includes(protocol) ? protocol.toLowerCase() : undefined;

const getFormProtocol = (
  protocol?: unknown,
  appProtocol?: unknown,
): ServicePortProtocol => {
  const kubernetesProtocol = getStringValue(protocol);
  if (kubernetesProtocol === 'UDP' || kubernetesProtocol === 'SCTP') {
    return kubernetesProtocol;
  }

  const normalizedAppProtocol = getStringValue(
    appProtocol,
  )?.toUpperCase() as ServicePortProtocol;

  return APP_PROTOCOLS.includes(normalizedAppProtocol)
    ? normalizedAppProtocol
    : 'TCP';
};

const isPortNumber = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 65535;

/**
 * 校验端口列表，返回第一条错误信息；全部合法时返回 undefined。
 * 规则：至少一个端口；服务端口 / 容器端口 1-65535；名称合法且不重复（多个端口时必填）；
 * 「服务端口 + 协议」不重复；NodePort 30000-32767 且不重复。
 */
export const getServicePortsError = (
  ports: ServicePortItem[] | undefined,
  t: Translate,
): string | undefined => {
  const items = (ports || []).filter(Boolean);
  if (items.length === 0) {
    return t('pages.k8s.forms.service.validation.ports.required');
  }

  const names = new Set<string>();
  const servicePorts = new Set<string>();
  const nodePorts = new Set<string>();

  for (const [index, port] of items.entries()) {
    const label = t('pages.k8s.forms.service.validation.port.label', {
      index: index + 1,
    });
    const name = port.name?.trim();
    const protocol = getKubernetesProtocol(port.protocol || 'TCP');

    if (port.servicePort === undefined || port.servicePort === null) {
      return t('pages.k8s.forms.service.validation.port.servicePortRequired', {
        label,
      });
    }
    if (!isPortNumber(port.servicePort)) {
      return t('pages.k8s.forms.service.validation.port.servicePortRange', {
        label,
      });
    }
    if (
      port.containerPort !== undefined &&
      port.containerPort !== null &&
      !isPortNumber(port.containerPort)
    ) {
      return t('pages.k8s.forms.service.validation.port.containerPortRange', {
        label,
      });
    }
    if (!name && items.length > 1) {
      return t('pages.k8s.forms.service.validation.port.nameRequiredMultiple', {
        label,
      });
    }
    if (name) {
      if (name.length > PORT_NAME_MAX_LENGTH) {
        return t('pages.k8s.forms.service.validation.port.nameMaxLength', {
          label,
          max: PORT_NAME_MAX_LENGTH,
        });
      }
      if (!PORT_NAME_PATTERN.test(name)) {
        return t('pages.k8s.forms.service.validation.port.namePattern', {
          label,
        });
      }
      if (names.has(name)) {
        return t('pages.k8s.forms.service.validation.port.nameDuplicate', {
          label,
          name,
        });
      }
      names.add(name);
    }

    const servicePortKey = `${port.servicePort}/${protocol}`;
    if (servicePorts.has(servicePortKey)) {
      return t('pages.k8s.forms.service.validation.port.servicePortDuplicate', {
        label,
        key: servicePortKey,
      });
    }
    servicePorts.add(servicePortKey);

    if (port.nodePort !== undefined && port.nodePort !== null) {
      if (
        !Number.isInteger(port.nodePort) ||
        port.nodePort < NODE_PORT_MIN ||
        port.nodePort > NODE_PORT_MAX
      ) {
        return t('pages.k8s.forms.service.validation.port.nodePortRange', {
          label,
          min: NODE_PORT_MIN,
          max: NODE_PORT_MAX,
        });
      }
      const nodePortKey = `${port.nodePort}/${protocol}`;
      if (nodePorts.has(nodePortKey)) {
        return t('pages.k8s.forms.service.validation.port.nodePortDuplicate', {
          label,
          key: nodePortKey,
        });
      }
      nodePorts.add(nodePortKey);
    }
  }

  return undefined;
};

/** 整张表单的跨步骤校验（提交前兜底）：返回第一条错误信息 */
export const getServiceFormError = (
  values: CreateServiceFormValues,
  t: Translate,
): string | undefined => {
  if (!values.name?.trim() || !values.namespace?.trim()) {
    return t('pages.k8s.forms.service.validation.nameNamespaceRequired');
  }
  if (Object.keys(toRecord(values.selectors)).length === 0) {
    return t('pages.k8s.forms.service.validation.selectorRequired');
  }
  if (values.internalAccessMode === 'Headless' && values.enableExternalAccess) {
    return t('pages.k8s.forms.service.validation.headlessExternalAccess');
  }
  return getServicePortsError(values.ports, t);
};

const getServicePorts = (ports?: ServicePortItem[], withNodePort = true) =>
  (ports || [])
    .filter((port) => port?.servicePort)
    .map((port) => {
      const servicePort: Record<string, unknown> = {
        port: port.servicePort,
        protocol: getKubernetesProtocol(port.protocol),
      };
      const name = port.name?.trim();
      const appProtocol = getAppProtocol(port.protocol) || port.appProtocol;

      if (name) {
        servicePort.name = name;
      }
      if (port.containerPort) {
        servicePort.targetPort = port.containerPort;
      } else if (port.targetPort) {
        servicePort.targetPort = port.targetPort;
      }
      if (withNodePort && port.nodePort) {
        servicePort.nodePort = port.nodePort;
      }
      if (appProtocol) {
        servicePort.appProtocol = appProtocol;
      }

      return servicePort;
    });

const setIfDefined = (
  target: Record<string, unknown>,
  key: string,
  value?: boolean | string | string[],
) => {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return;
  }
  target[key] = value;
};

const getSessionAffinityTimeout = (values: CreateServiceFormValues) =>
  values.sessionAffinityTimeoutSeconds ||
  DEFAULT_SESSION_AFFINITY_TIMEOUT_SECONDS;

export const buildCreateServiceManifest = (values: CreateServiceFormValues) => {
  const labels = toRecord(values.labels);
  const annotations = toRecord(values.annotations);
  const selectors = toRecord(values.selectors);
  const type =
    values.enableExternalAccess && values.externalAccessMode !== 'None'
      ? values.externalAccessMode
      : 'ClusterIP';
  const external = type === 'NodePort' || type === 'LoadBalancer';
  const spec: Record<string, unknown> = {
    type,
    selector: selectors,
    // nodePort 只对 NodePort / LoadBalancer 有效，ClusterIP 带上会被集群拒绝
    ports: getServicePorts(values.ports, external),
  };

  if (
    values.internalAccessMode === 'Headless' &&
    !values.enableExternalAccess
  ) {
    spec.clusterIP = 'None';
  }
  if (values.enableSessionAffinity) {
    spec.sessionAffinity = 'ClientIP';
    spec.sessionAffinityConfig = {
      clientIP: {
        timeoutSeconds: getSessionAffinityTimeout(values),
      },
    };
  }
  setIfDefined(spec, 'ipFamilyPolicy', values.ipFamilyPolicy);
  setIfDefined(spec, 'ipFamilies', values.ipFamilies);
  setIfDefined(spec, 'internalTrafficPolicy', values.internalTrafficPolicy);
  setIfDefined(spec, 'trafficDistribution', values.trafficDistribution);
  if (external) {
    setIfDefined(spec, 'externalTrafficPolicy', values.externalTrafficPolicy);
  }
  if (type === 'LoadBalancer') {
    setIfDefined(spec, 'loadBalancerClass', values.loadBalancerClass?.trim());
    setIfDefined(
      spec,
      'allocateLoadBalancerNodePorts',
      values.allocateLoadBalancerNodePorts,
    );
  }

  return {
    apiVersion: SERVICE_API_VERSION,
    kind: SERVICE_KIND,
    metadata: {
      name: values.name,
      namespace: values.namespace,
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    spec,
  };
};

export const buildServiceFormValuesFromManifest = (
  manifest?: Record<string, unknown>,
): CreateServiceFormValues => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);
  const serviceType = getStringValue(spec?.type) || 'ClusterIP';
  const sessionAffinityConfig = getRecordValue(spec?.sessionAffinityConfig);
  const clientIP = getRecordValue(sessionAffinityConfig?.clientIP);
  const annotations = getRecordValue(metadata?.annotations);
  const ports = getArrayValue(spec?.ports)
    .map((item) => getRecordValue(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((port) => {
      const protocol = getFormProtocol(port.protocol, port.appProtocol);
      const appProtocol = getStringValue(port.appProtocol);

      return createServicePortItem({
        protocol,
        name: getStringValue(port.name),
        containerPort: getNumberValue(port.targetPort),
        targetPort: getStringValue(port.targetPort),
        servicePort: getNumberValue(port.port),
        nodePort: getNumberValue(port.nodePort),
        // 表单协议能表示的 appProtocol 由协议还原，其余原样保留
        appProtocol: getAppProtocol(protocol) ? undefined : appProtocol,
      });
    });

  return {
    name: getStringValue(metadata?.name),
    namespace: getStringValue(metadata?.namespace),
    internalAccessMode: spec?.clusterIP === 'None' ? 'Headless' : 'ClusterIP',
    selectors: toKeyValueItems(getRecordValue(spec?.selector)),
    ports: ports.length > 0 ? ports : [createDefaultServicePortItem()],
    enableExternalAccess:
      serviceType === 'NodePort' || serviceType === 'LoadBalancer',
    externalAccessMode:
      serviceType === 'LoadBalancer'
        ? 'LoadBalancer'
        : serviceType === 'NodePort'
          ? 'NodePort'
          : 'None',
    enableSessionAffinity: spec?.sessionAffinity === 'ClientIP',
    sessionAffinityTimeoutSeconds:
      getNumberValue(clientIP?.timeoutSeconds) ||
      DEFAULT_SESSION_AFFINITY_TIMEOUT_SECONDS,
    externalAccessAnnotations: toKeyValueItems(annotations),
    loadBalancerProvider: getStringValue(
      annotations?.['kubeflare.io/load-balancer-provider'],
    ),
    loadBalancerClass: getStringValue(spec?.loadBalancerClass),
    allocateLoadBalancerNodePorts:
      getBooleanValue(spec?.allocateLoadBalancerNodePorts) ?? true,
    externalTrafficPolicy:
      getStringValue(spec?.externalTrafficPolicy) === 'Local'
        ? 'Local'
        : getStringValue(spec?.externalTrafficPolicy) === 'Cluster'
          ? 'Cluster'
          : undefined,
    internalTrafficPolicy:
      getStringValue(spec?.internalTrafficPolicy) === 'Local'
        ? 'Local'
        : getStringValue(spec?.internalTrafficPolicy) === 'Cluster'
          ? 'Cluster'
          : undefined,
    ipFamilyPolicy:
      getStringValue(spec?.ipFamilyPolicy) === 'PreferDualStack'
        ? 'PreferDualStack'
        : getStringValue(spec?.ipFamilyPolicy) === 'RequireDualStack'
          ? 'RequireDualStack'
          : getStringValue(spec?.ipFamilyPolicy) === 'SingleStack'
            ? 'SingleStack'
            : undefined,
    ipFamilies: getArrayValue(spec?.ipFamilies).filter(
      (item): item is 'IPv4' | 'IPv6' => item === 'IPv4' || item === 'IPv6',
    ),
    trafficDistribution:
      getStringValue(spec?.trafficDistribution) === 'PreferClose'
        ? 'PreferClose'
        : getStringValue(spec?.trafficDistribution) === 'PreferSameZone'
          ? 'PreferSameZone'
          : getStringValue(spec?.trafficDistribution) === 'PreferSameNode'
            ? 'PreferSameNode'
            : undefined,
    labels: toKeyValueItems(getRecordValue(metadata?.labels)),
    annotations: toKeyValueItems(annotations),
  };
};

/** 编辑「服务设置」时的 spec 合并补丁（选择器、端口、会话保持、网络策略） */
export const buildServiceSettingsSpecPatch = (
  values: CreateServiceFormValues,
) => {
  const spec: Record<string, unknown> = {
    selector: toRecord(values.selectors),
    ports: getServicePorts(values.ports),
  };

  if (values.enableSessionAffinity) {
    spec.sessionAffinity = 'ClientIP';
    spec.sessionAffinityConfig = {
      clientIP: {
        timeoutSeconds: getSessionAffinityTimeout(values),
      },
    };
  } else {
    spec.sessionAffinity = 'None';
    spec.sessionAffinityConfig = null;
  }
  setIfDefined(spec, 'ipFamilyPolicy', values.ipFamilyPolicy);
  setIfDefined(spec, 'ipFamilies', values.ipFamilies);
  setIfDefined(spec, 'internalTrafficPolicy', values.internalTrafficPolicy);
  setIfDefined(spec, 'trafficDistribution', values.trafficDistribution);

  return spec;
};

/** 编辑「外部访问」时的合并补丁（类型、nodePort、LoadBalancer 相关字段与注解） */
export const buildServiceExternalAccessSpecPatch = (
  values: CreateServiceFormValues,
  manifest?: Record<string, unknown>,
) => {
  const externalAccessMode = values.externalAccessMode;
  const enabled = externalAccessMode !== 'None';
  const metadata = getRecordValue(manifest?.metadata);
  const previousAnnotations = getRecordValue(metadata?.annotations);
  const annotations = toNullableRecordPatch(
    values.externalAccessAnnotations,
    previousAnnotations,
  );

  if (values.loadBalancerProvider) {
    annotations['kubeflare.io/load-balancer-provider'] =
      values.loadBalancerProvider;
  }

  return {
    spec: {
      type: enabled ? externalAccessMode : 'ClusterIP',
      ports: getServicePorts(values.ports, enabled),
      ...(enabled && externalAccessMode === 'LoadBalancer'
        ? {
            ...(values.loadBalancerClass?.trim()
              ? { loadBalancerClass: values.loadBalancerClass.trim() }
              : {}),
            allocateLoadBalancerNodePorts:
              values.allocateLoadBalancerNodePorts ?? true,
          }
        : {
            allocateLoadBalancerNodePorts: null,
          }),
      ...(enabled && values.externalTrafficPolicy
        ? { externalTrafficPolicy: values.externalTrafficPolicy }
        : { externalTrafficPolicy: null }),
    },
    ...(externalAccessMode === 'LoadBalancer'
      ? {
          metadata: {
            annotations,
          },
        }
      : {}),
  };
};

/** 从工作负载对象原文读出 Pod 模板标签、选择器和容器端口（工作负载选择弹窗用） */
export const getWorkloadSelectorDetail = (
  object?: Record<string, unknown>,
): Pick<WorkloadSelectorItem, 'labels' | 'ports' | 'selector'> => {
  const spec = getRecordValue(object?.spec);
  const template = getRecordValue(spec?.template);
  const podSpec = getRecordValue(template?.spec);
  const ports = getArrayValue(podSpec?.containers)
    .map((item) => getRecordValue(item))
    .flatMap((container) => getArrayValue(container?.ports))
    .map((item) => getRecordValue(item))
    .flatMap((port): WorkloadContainerPort[] => {
      const containerPort = getNumberValue(port?.containerPort);
      return containerPort
        ? [
            {
              name: getStringValue(port?.name),
              containerPort,
              protocol: getStringValue(port?.protocol),
            },
          ]
        : [];
    });

  return {
    labels: getStringRecord(getRecordValue(template?.metadata)?.labels),
    selector: getStringRecord(getRecordValue(spec?.selector)?.matchLabels),
    ports,
  };
};

/** 把工作负载的容器端口换成服务端口行（服务端口默认与容器端口相同，名称保证合法且不重复） */
export const createServicePortsFromWorkload = (
  ports?: WorkloadContainerPort[],
): ServicePortItem[] => {
  const seen = new Set<string>();

  return (ports || []).reduce<ServicePortItem[]>((items, port) => {
    const protocol: ServicePortProtocol =
      port.protocol === 'UDP' || port.protocol === 'SCTP'
        ? port.protocol
        : 'TCP';
    const key = `${port.containerPort}/${protocol}`;
    if (!isPortNumber(port.containerPort) || seen.has(key)) {
      return items;
    }
    seen.add(key);

    const usedNames = items.map((item) => item.name);
    const containerPortName = port.name?.trim();
    const name =
      containerPortName &&
      containerPortName.length <= PORT_NAME_MAX_LENGTH &&
      PORT_NAME_PATTERN.test(containerPortName) &&
      !usedNames.includes(containerPortName)
        ? containerPortName
        : createServicePortName(protocol, usedNames);

    items.push(
      createServicePortItem({
        protocol,
        name,
        containerPort: port.containerPort,
        servicePort: port.containerPort,
      }),
    );
    return items;
  }, []);
};
