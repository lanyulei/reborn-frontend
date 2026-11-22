import { t } from '@/utils/i18n';
import { DETAIL_NONE, isNamespaced, KIND_GVR } from '../../components/meta';
import {
  formatValue,
  getArrayValue,
  getNumberValue,
  getRecordValue,
  getStringValue,
} from './helpers';
import type { ResourceDataItem } from './ResourceDataFields';

const formatRecordEntries = (record?: Record<string, unknown>) =>
  Object.entries(record || {})
    .filter(([key, value]) => key && value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('、');

const formatObjectRef = (value?: Record<string, unknown>) => {
  if (!value) {
    return undefined;
  }

  return [
    getStringValue(value.apiVersion),
    getStringValue(value.kind),
    [getStringValue(value.namespace), getStringValue(value.name)]
      .filter(Boolean)
      .join('/'),
  ]
    .filter(Boolean)
    .join(' / ');
};

/** 某个对象的详情地址（不含集群参数，由 ClusterLink 补上）；不认识的 Kind 没有链接 */
const getResourceDetailPath = (
  kind?: string,
  name?: string,
  namespace?: string,
) => {
  const gvr = kind ? KIND_GVR[kind] : undefined;
  if (!gvr || !name) {
    return undefined;
  }
  return `/k8s/detail/${[
    gvr.group || DETAIL_NONE,
    gvr.version,
    gvr.resource,
    (isNamespaced(gvr) && namespace) || DETAIL_NONE,
    name,
  ]
    .map(encodeURIComponent)
    .join('/')}`;
};

const getObjectRefDetailPath = (
  value?: Record<string, unknown>,
  fallbackNamespace?: string,
) =>
  getResourceDetailPath(
    getStringValue(value?.kind),
    getStringValue(value?.name),
    getStringValue(value?.namespace) || fallbackNamespace || undefined,
  );

const getMetadata = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.metadata);

const getSpec = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.spec);

const getStatus = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.status);

const getHpaTarget = (manifest?: Record<string, unknown>) =>
  getRecordValue(getSpec(manifest)?.scaleTargetRef);

const buildHpaBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getMetadata(manifest);
  const spec = getSpec(manifest);
  const status = getStatus(manifest);
  const target = getHpaTarget(manifest);
  const namespace =
    getStringValue(metadata?.namespace) || fallbackNamespace || '-';

  return {
    namespace,
    target: formatObjectRef(target),
    target_path: getObjectRefDetailPath(target, namespace),
    min_replicas: getNumberValue(spec?.minReplicas),
    max_replicas: getNumberValue(spec?.maxReplicas),
    current_replicas: getNumberValue(status?.currentReplicas),
    desired_replicas: getNumberValue(status?.desiredReplicas),
    current_metrics: getArrayValue(status?.currentMetrics).length,
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const getMetricName = (metric?: Record<string, unknown>) => {
  const resource = getRecordValue(metric?.resource);
  const pods = getRecordValue(metric?.pods);
  const object = getRecordValue(metric?.object);
  const external = getRecordValue(metric?.external);
  const metricRecord =
    getRecordValue(pods?.metric) ||
    getRecordValue(object?.metric) ||
    getRecordValue(external?.metric);

  return (
    getStringValue(resource?.name) ||
    getStringValue(metricRecord?.name) ||
    getStringValue(metric?.type) ||
    '-'
  );
};

const buildHpaRelationItems = (
  manifest?: Record<string, unknown>,
): ResourceDataItem[] => {
  const metadata = getMetadata(manifest);
  const spec = getSpec(manifest);
  const target = getHpaTarget(manifest);
  const namespace = getStringValue(metadata?.namespace);
  const metrics = getArrayValue(spec?.metrics)
    .map((item) => getRecordValue(item))
    .map((item, index) => ({
      key: `metric-${index + 1}`,
      value: `${getStringValue(item?.type) || '-'} / ${getMetricName(item)}`,
    }));

  return [
    {
      key: t('pages.k8s.detail.basic.scaleTarget'),
      path: getObjectRefDetailPath(target, namespace),
      value: formatObjectRef(target) || '-',
    },
    ...metrics,
  ];
};

const buildPersistentVolumeBasicInfo = (manifest?: Record<string, unknown>) => {
  const metadata = getMetadata(manifest);
  const spec = getSpec(manifest);
  const status = getStatus(manifest);
  const capacity = getRecordValue(spec?.capacity);
  const claimRef = getRecordValue(spec?.claimRef);
  const claimNamespace = getStringValue(claimRef?.namespace);
  const claimName = getStringValue(claimRef?.name);

  return {
    status: getStringValue(status?.phase),
    capacity: getStringValue(capacity?.storage),
    access_modes: getArrayValue(spec?.accessModes).join('、'),
    reclaim_policy: getStringValue(spec?.persistentVolumeReclaimPolicy),
    storage_class: getStringValue(spec?.storageClassName),
    claim_ref: [claimNamespace, claimName].filter(Boolean).join('/'),
    claim_path: getResourceDetailPath(
      'PersistentVolumeClaim',
      claimName,
      claimNamespace,
    ),
    volume_mode: getStringValue(spec?.volumeMode),
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const buildPersistentVolumeRelationItems = (
  manifest?: Record<string, unknown>,
): ResourceDataItem[] => {
  const spec = getSpec(manifest);
  const claimRef = getRecordValue(spec?.claimRef);
  const nodeAffinity = getRecordValue(spec?.nodeAffinity);
  return [
    {
      key: t('pages.k8s.detail.basic.claimRef'),
      path: getObjectRefDetailPath(claimRef),
      value: formatObjectRef(claimRef) || '-',
    },
    {
      key: t('pages.k8s.detail.basic.nodeAffinity'),
      value: nodeAffinity ? JSON.stringify(nodeAffinity, null, 2) : '-',
    },
  ];
};

const buildNetworkPolicyBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getMetadata(manifest);
  const spec = getSpec(manifest);
  const podSelector = getRecordValue(spec?.podSelector);

  return {
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace || '-',
    pod_selector: getRecordValue(podSelector?.matchLabels) as
      | Record<string, string>
      | undefined,
    policy_types: getArrayValue(spec?.policyTypes).join('、'),
    ingress_rules: getArrayValue(spec?.ingress).length,
    egress_rules: getArrayValue(spec?.egress).length,
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const formatSelector = (selector?: Record<string, unknown>) => {
  const matchLabels = formatRecordEntries(
    getRecordValue(selector?.matchLabels),
  );
  const expressionCount = getArrayValue(selector?.matchExpressions).length;

  return [
    matchLabels,
    expressionCount
      ? t('pages.k8s.detail.netpol.expressions', { count: expressionCount })
      : undefined,
  ]
    .filter(Boolean)
    .join('、');
};

const formatPolicyPeer = (peer?: Record<string, unknown>) => {
  const namespaceSelector = getRecordValue(peer?.namespaceSelector);
  const podSelector = getRecordValue(peer?.podSelector);
  const ipBlock = getRecordValue(peer?.ipBlock);
  const parts = [
    namespaceSelector
      ? `ns(${formatSelector(namespaceSelector) || t('pages.k8s.detail.netpol.any')})`
      : undefined,
    podSelector
      ? `pod(${formatSelector(podSelector) || t('pages.k8s.detail.netpol.any')})`
      : undefined,
    ipBlock
      ? `ipBlock(${getStringValue(ipBlock.cidr) || '-'}${
          getArrayValue(ipBlock.except).length
            ? ` except ${getArrayValue(ipBlock.except).join(',')}`
            : ''
        })`
      : undefined,
  ].filter(Boolean);

  return parts.length ? parts.join(' + ') : t('pages.k8s.detail.netpol.any');
};

const summarizePeers = (peers: unknown[], label: string) => {
  if (!peers.length) {
    return t('pages.k8s.detail.netpol.anyPeer', { label });
  }

  return `${label} ${peers
    .map((item) => formatPolicyPeer(getRecordValue(item)))
    .filter(Boolean)
    .join('、')}`;
};

const summarizeRule = (
  rule?: Record<string, unknown>,
  direction: 'egress' | 'ingress' = 'ingress',
) => {
  const peers = getArrayValue(direction === 'ingress' ? rule?.from : rule?.to);
  const ports = getArrayValue(rule?.ports)
    .map((item) => getRecordValue(item))
    .map((item) => {
      const port =
        item?.port === undefined || item?.port === null
          ? t('pages.k8s.detail.all')
          : formatValue(item.port);
      const endPort =
        item?.endPort === undefined || item?.endPort === null
          ? undefined
          : formatValue(item.endPort);
      const protocol = getStringValue(item?.protocol) || 'TCP';
      const portRange = `${port}${endPort ? `-${endPort}` : ''}`;

      return [portRange, protocol].filter(Boolean).join('/');
    })
    .join('、');

  return [
    summarizePeers(
      peers,
      direction === 'ingress'
        ? t('pages.k8s.detail.source')
        : t('pages.k8s.detail.target'),
    ),
    ports
      ? t('pages.k8s.detail.netpol.ports', { ports })
      : t('pages.k8s.detail.netpol.allPorts'),
  ]
    .filter(Boolean)
    .join('；');
};

const buildNetworkPolicyRuleItems = (
  manifest?: Record<string, unknown>,
): ResourceDataItem[] => {
  const spec = getSpec(manifest);
  const ingress = getArrayValue(spec?.ingress)
    .map((item) => getRecordValue(item))
    .map((item, index) => ({
      key: `ingress-${index + 1}`,
      value:
        summarizeRule(item, 'ingress') || JSON.stringify(item || {}, null, 2),
    }));
  const egress = getArrayValue(spec?.egress)
    .map((item) => getRecordValue(item))
    .map((item, index) => ({
      key: `egress-${index + 1}`,
      value:
        summarizeRule(item, 'egress') || JSON.stringify(item || {}, null, 2),
    }));

  return [...ingress, ...egress];
};

const buildIngressClassBasicInfo = (manifest?: Record<string, unknown>) => {
  const metadata = getMetadata(manifest);
  const annotations = getRecordValue(metadata?.annotations);
  const spec = getSpec(manifest);
  const parameters = getRecordValue(spec?.parameters);

  return {
    default_class:
      getStringValue(
        annotations?.['ingressclass.kubernetes.io/is-default-class'],
      ) === 'true',
    controller: getStringValue(spec?.controller),
    parameters: formatObjectRef(parameters),
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const buildIngressClassParameterItems = (
  manifest?: Record<string, unknown>,
): ResourceDataItem[] => {
  const parameters = getRecordValue(getSpec(manifest)?.parameters);
  if (!parameters) {
    return [];
  }

  return [
    {
      key: 'parameters',
      value: JSON.stringify(parameters, null, 2),
    },
  ];
};

const buildEndpointSliceBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getMetadata(manifest);
  const labels = getRecordValue(metadata?.labels);
  const endpoints = getArrayValue(manifest?.endpoints);
  const readyCount = endpoints.filter((item) => {
    const endpoint = getRecordValue(item);
    const conditions = getRecordValue(endpoint?.conditions);
    return conditions?.ready !== false;
  }).length;
  const namespace =
    getStringValue(metadata?.namespace) || fallbackNamespace || '-';
  const serviceName = getStringValue(labels?.['kubernetes.io/service-name']);

  return {
    namespace,
    service_name: serviceName,
    service_path: getResourceDetailPath('Service', serviceName, namespace),
    address_type: getStringValue(manifest?.addressType),
    endpoints: endpoints.length,
    ready_endpoints: readyCount,
    ports: getArrayValue(manifest?.ports).length,
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const buildEndpointSliceEndpointItems = (
  manifest?: Record<string, unknown>,
): ResourceDataItem[] => {
  const metadata = getMetadata(manifest);
  const namespace = getStringValue(metadata?.namespace);

  return getArrayValue(manifest?.endpoints)
    .map((item) => getRecordValue(item))
    .map((endpoint, index) => {
      const conditions = getRecordValue(endpoint?.conditions);
      const targetRef = getRecordValue(endpoint?.targetRef);
      const addresses = getArrayValue(endpoint?.addresses)
        .map((value) => getStringValue(value))
        .filter(Boolean)
        .join('、');

      return {
        key: `endpoint-${index + 1}`,
        path: getObjectRefDetailPath(targetRef, namespace),
        value: [
          addresses,
          `ready=${formatValue(conditions?.ready)}`,
          formatObjectRef(targetRef),
        ]
          .filter(Boolean)
          .join('；'),
      };
    });
};

type HorizontalPodAutoscalerBasicInfo = ReturnType<typeof buildHpaBasicInfo>;
type PersistentVolumeBasicInfo = ReturnType<
  typeof buildPersistentVolumeBasicInfo
>;
type NetworkPolicyBasicInfo = ReturnType<typeof buildNetworkPolicyBasicInfo>;
type IngressClassBasicInfo = ReturnType<typeof buildIngressClassBasicInfo>;
type EndpointSliceBasicInfo = ReturnType<typeof buildEndpointSliceBasicInfo>;

export type {
  EndpointSliceBasicInfo,
  HorizontalPodAutoscalerBasicInfo,
  IngressClassBasicInfo,
  NetworkPolicyBasicInfo,
  PersistentVolumeBasicInfo,
};
export {
  buildEndpointSliceBasicInfo,
  buildEndpointSliceEndpointItems,
  buildHpaBasicInfo,
  buildHpaRelationItems,
  buildIngressClassBasicInfo,
  buildIngressClassParameterItems,
  buildNetworkPolicyBasicInfo,
  buildNetworkPolicyRuleItems,
  buildPersistentVolumeBasicInfo,
  buildPersistentVolumeRelationItems,
  getResourceDetailPath,
};
