import {
  formatValue,
  getArrayValue,
  getRecordValue,
  getStringValue,
} from './helpers';

type IngressBasicInfo = {
  namespace?: string;
  gateway_address?: string;
  ingress_class?: string;
  create_time?: string;
};

type IngressRuleItem = {
  key: string;
  host?: string;
  protocol: 'HTTP' | 'HTTPS';
  path?: string;
  path_type?: string;
  service_name?: string;
  service_port?: string;
  accessible_url?: string;
};

const getIngressMetadata = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.metadata);

const getIngressSpec = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.spec);

const getIngressGatewayAddress = (manifest?: Record<string, unknown>) => {
  const status = getRecordValue(manifest?.status);
  const loadBalancer = getRecordValue(status?.loadBalancer);
  const addresses = getArrayValue(loadBalancer?.ingress)
    .map((item) => getRecordValue(item))
    .map((item) => getStringValue(item?.ip) || getStringValue(item?.hostname))
    .filter(Boolean);

  return Array.from(new Set(addresses)).join('、') || undefined;
};

const getIngressTlsHosts = (manifest?: Record<string, unknown>) =>
  new Set(
    getArrayValue(getIngressSpec(manifest)?.tls)
      .map((item) => getRecordValue(item))
      .flatMap((item) => getArrayValue(item?.hosts))
      .map((item) => getStringValue(item))
      .filter(Boolean),
  );

const getBackendService = (backend?: Record<string, unknown>) => {
  const service = getRecordValue(backend?.service);
  const port = getRecordValue(service?.port);
  const portName = getStringValue(port?.name);
  const portNumber = typeof port?.number === 'number' ? port.number : undefined;

  return {
    service_name: getStringValue(service?.name),
    service_port:
      portName || (portNumber === undefined ? undefined : String(portNumber)),
  };
};

const buildAccessibleUrl = (
  protocol: IngressRuleItem['protocol'],
  host?: string,
  path?: string,
) => {
  if (!host || host === '*' || host.startsWith('*.')) {
    return undefined;
  }

  const normalizedPath = path?.startsWith('/') ? path : `/${path || ''}`;

  return `${protocol.toLowerCase()}://${host}${normalizedPath}`;
};

const buildRuleItem = ({
  backend,
  host,
  index,
  path,
  pathType,
  tlsHosts,
}: {
  backend?: Record<string, unknown>;
  host?: string;
  index: string;
  path?: string;
  pathType?: string;
  tlsHosts: Set<string | undefined>;
}): IngressRuleItem => {
  const protocol = host && tlsHosts.has(host) ? 'HTTPS' : 'HTTP';
  const backendService = getBackendService(backend);

  return {
    key: index,
    host: host || '*',
    protocol,
    path: path || '/',
    path_type: pathType,
    accessible_url: buildAccessibleUrl(protocol, host, path || '/'),
    ...backendService,
  };
};

const buildIngressBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
): IngressBasicInfo => {
  const metadata = getIngressMetadata(manifest);
  const spec = getIngressSpec(manifest);

  return {
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace || '-',
    gateway_address: getIngressGatewayAddress(manifest),
    ingress_class: getStringValue(spec?.ingressClassName),
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const buildIngressRules = (
  manifest?: Record<string, unknown>,
): IngressRuleItem[] => {
  const spec = getIngressSpec(manifest);
  const tlsHosts = getIngressTlsHosts(manifest);
  const defaultBackend = getRecordValue(spec?.defaultBackend);
  const defaultRule = defaultBackend
    ? [
        buildRuleItem({
          backend: defaultBackend,
          host: '*',
          index: 'default-backend',
          path: '/',
          tlsHosts,
        }),
      ]
    : [];
  const ruleItems = getArrayValue(spec?.rules).flatMap(
    (ruleItem, ruleIndex) => {
      const rule = getRecordValue(ruleItem);
      const host = getStringValue(rule?.host);
      const http = getRecordValue(rule?.http);
      const paths = getArrayValue(http?.paths);

      if (paths.length === 0) {
        return [
          buildRuleItem({
            host,
            index: `rule-${ruleIndex}`,
            path: '/',
            tlsHosts,
          }),
        ];
      }

      return paths.map((pathItem, pathIndex) => {
        const pathRecord = getRecordValue(pathItem);

        return buildRuleItem({
          backend: getRecordValue(pathRecord?.backend),
          host,
          index: `rule-${ruleIndex}-${pathIndex}`,
          path: getStringValue(pathRecord?.path),
          pathType: getStringValue(pathRecord?.pathType),
          tlsHosts,
        });
      });
    },
  );

  return [...defaultRule, ...ruleItems];
};

const formatIngressRuleValue = formatValue;

export type { IngressBasicInfo, IngressRuleItem };
export { buildIngressBasicInfo, buildIngressRules, formatIngressRuleValue };
