import { getArrayValue, getRecordValue, getStringValue } from './helpers';
import type { ClusterServiceEndpointItem } from './types';

type ServiceBasicInfo = {
  namespace?: string;
  type?: string;
  cluster_ip?: string;
  external_ip?: string;
  ip_family_policy?: string;
  ip_families?: string;
  internal_traffic_policy?: string;
  external_traffic_policy?: string;
  traffic_distribution?: string;
  load_balancer_class?: string;
  session_affinity?: string;
  selector?: Record<string, string>;
  dns?: string;
  endpoints?: string;
  create_time?: string;
};

type ServicePortItem = {
  key: string;
  name?: string;
  protocol?: string;
  port?: number;
  target_port?: string;
  node_port?: number;
};

const _formatRecordEntries = (record?: Record<string, unknown>) =>
  Object.entries(record || {})
    .filter(([key, value]) => key && value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('、');

const getServiceSpec = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.spec);

const getServiceMetadata = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.metadata);

const getServiceSelector = (manifest?: Record<string, unknown>) =>
  getRecordValue(getServiceSpec(manifest)?.selector) as
    | Record<string, unknown>
    | undefined;

const getServiceLabelSelector = (manifest?: Record<string, unknown>) =>
  Object.entries(getServiceSelector(manifest) || {})
    .filter(([key, value]) => key && value)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(',');

const getServiceClusterIP = (manifest?: Record<string, unknown>) => {
  const spec = getServiceSpec(manifest);
  const clusterIPs = getArrayValue(spec?.clusterIPs)
    .map((item) => getStringValue(item))
    .filter(Boolean);

  if (clusterIPs.length > 0) {
    return clusterIPs.join('、');
  }

  return getStringValue(spec?.clusterIP);
};

const formatArrayValues = (value: unknown) =>
  getArrayValue(value)
    .map((item) => getStringValue(item))
    .filter(Boolean)
    .join('、');

const getServiceExternalIP = (manifest?: Record<string, unknown>) => {
  const spec = getServiceSpec(manifest);
  const status = getRecordValue(manifest?.status);
  const loadBalancer = getRecordValue(status?.loadBalancer);
  const ingressList = getArrayValue(loadBalancer?.ingress)
    .map((item) => getRecordValue(item))
    .map((item) => getStringValue(item?.ip) || getStringValue(item?.hostname))
    .filter(Boolean);
  const externalIPs = getArrayValue(spec?.externalIPs)
    .map((item) => getStringValue(item))
    .filter(Boolean);
  const nodePorts = getArrayValue(spec?.ports)
    .map((item) => getRecordValue(item))
    .map((item) => item?.nodePort)
    .filter(Boolean)
    .map((nodePort) => `NodePort:${String(nodePort)}`);

  return Array.from(new Set([...ingressList, ...externalIPs, ...nodePorts]))
    .filter(Boolean)
    .join('、');
};

const getServiceDNS = (manifest?: Record<string, unknown>) => {
  const metadata = getServiceMetadata(manifest);
  const name = getStringValue(metadata?.name);
  const namespace = getStringValue(metadata?.namespace);

  if (!name || !namespace) {
    return undefined;
  }

  return `${name}.${namespace}.svc.cluster.local`;
};

const getEndpointAddressText = (endpoint?: ClusterServiceEndpointItem) => {
  if (!endpoint) {
    return undefined;
  }

  const target = endpoint.targetName
    ? `(${endpoint.targetKind || '目标'}: ${endpoint.targetName})`
    : '';

  return [endpoint.ip, target].filter(Boolean).join(' ');
};

const getServiceEndpointsText = (endpoints?: ClusterServiceEndpointItem[]) =>
  (endpoints || []).map(getEndpointAddressText).filter(Boolean).join('、');

const buildServiceBasicInfo = (
  manifest?: Record<string, unknown>,
  endpoints?: ClusterServiceEndpointItem[],
  fallbackNamespace?: string,
): ServiceBasicInfo => {
  const metadata = getServiceMetadata(manifest);
  const spec = getServiceSpec(manifest);

  return {
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace || '-',
    type: getStringValue(spec?.type) || 'ClusterIP',
    cluster_ip: getServiceClusterIP(manifest),
    external_ip: getServiceExternalIP(manifest),
    ip_family_policy: getStringValue(spec?.ipFamilyPolicy),
    ip_families: formatArrayValues(spec?.ipFamilies),
    internal_traffic_policy: getStringValue(spec?.internalTrafficPolicy),
    external_traffic_policy: getStringValue(spec?.externalTrafficPolicy),
    traffic_distribution: getStringValue(spec?.trafficDistribution),
    load_balancer_class: getStringValue(spec?.loadBalancerClass),
    session_affinity: getStringValue(spec?.sessionAffinity),
    selector: getServiceSelector(manifest) as
      | Record<string, string>
      | undefined,
    dns: getServiceDNS(manifest),
    endpoints: getServiceEndpointsText(endpoints),
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const buildServicePorts = (
  manifest?: Record<string, unknown>,
): ServicePortItem[] =>
  getArrayValue(getServiceSpec(manifest)?.ports)
    .map((item, index) => {
      const port = getRecordValue(item);
      const targetPort = port?.targetPort;
      const servicePort = Number(port?.port);

      return {
        key: `${String(port?.name || 'port')}-${index}`,
        name: getStringValue(port?.name),
        protocol: getStringValue(port?.protocol) || 'TCP',
        port: Number.isNaN(servicePort) ? undefined : servicePort,
        target_port:
          typeof targetPort === 'number' || typeof targetPort === 'string'
            ? String(targetPort)
            : undefined,
        node_port:
          typeof port?.nodePort === 'number' ? port.nodePort : undefined,
      };
    })
    .filter((item) => item.port);

export type { ServiceBasicInfo, ServicePortItem };
export {
  buildServiceBasicInfo,
  buildServicePorts,
  getEndpointAddressText,
  getServiceLabelSelector,
  getServiceSelector,
};
