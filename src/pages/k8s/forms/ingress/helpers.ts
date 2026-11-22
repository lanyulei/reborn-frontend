import { type Translate, t } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import {
  createId,
  createKeyValueItem,
  getArrayValue,
  getRecordValue,
  getStringValue,
  NAME_PATTERN,
  toRecord,
} from '../shared/manifest';
import type {
  CreateIngressFormValues,
  IngressPathType,
  IngressRoutePathItem,
  IngressRouteRuleItem,
  IngressRuleProtocol,
  IngressServicePortOption,
} from './types';

export { createKeyValueItem, NAME_PATTERN, toRecord };

export const INGRESS_API_VERSION = 'networking.k8s.io/v1';
export const INGRESS_KIND = 'Ingress';

/** RFC 1123 子域名，允许最左一段为通配符（*.example.com） */
export const HOST_PATTERN =
  /^(\*\.)?[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
export const USE_REGEX_ANNOTATION = 'nginx.ingress.kubernetes.io/use-regex';
export const REWRITE_TARGET_ANNOTATION =
  'nginx.ingress.kubernetes.io/rewrite-target';

const PATH_TYPES: IngressPathType[] = [
  'Prefix',
  'Exact',
  'ImplementationSpecific',
];

const getNumberValue = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const getRecordList = (value: unknown) =>
  getArrayValue(value)
    .map((item) => getRecordValue(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));

const getStringList = (value: unknown) =>
  getArrayValue(value).filter(
    (item): item is string => typeof item === 'string',
  );

const mapRecordToKeyValueItems = (
  record?: Record<string, unknown>,
): KeyValueEditorItem[] =>
  Object.entries(record || {}).map(([keyName, value]) =>
    createKeyValueItem(keyName, String(value ?? '')),
  );

export const createIngressPathItem = (
  values?: Partial<IngressRoutePathItem>,
): IngressRoutePathItem => ({
  id: values?.id || createId(),
  path: values?.path || '/',
  pathType: values?.pathType || 'Prefix',
  serviceName: values?.serviceName,
  servicePort: values?.servicePort,
  ...(values?.backend ? { backend: values.backend } : {}),
});

export const createIngressRuleItem = (
  values?: Partial<IngressRouteRuleItem>,
): IngressRouteRuleItem => ({
  id: values?.id || createId(),
  host: values?.host,
  protocol: values?.protocol || 'HTTP',
  paths:
    values?.paths && values.paths.length > 0
      ? values.paths.map((path) => createIngressPathItem(path))
      : [createIngressPathItem()],
});

export const getInitialCreateIngressValues = (
  namespace?: string,
): CreateIngressFormValues => ({
  name: undefined,
  namespace,
  rules: [],
  ingressClassName: undefined,
  tlsSecretName: undefined,
  enablePathRewrite: false,
  rewriteTarget: '/',
  annotations: [createKeyValueItem()],
  labels: [createKeyValueItem()],
});

export const isValidIngressPath = (path?: IngressRoutePathItem) =>
  Boolean(
    path?.path?.trim()?.startsWith('/') &&
      path.pathType &&
      (path.backend ||
        (path.serviceName?.trim() &&
          path.servicePort &&
          (typeof path.servicePort === 'number'
            ? path.servicePort >= 1 && path.servicePort <= 65535
            : path.servicePort.trim()))),
  );

/** 域名可以留空（匹配所有域名），但 HTTPS 规则必须有域名才能写入 TLS */
export const isValidIngressRule = (rule?: IngressRouteRuleItem) =>
  Boolean(
    rule &&
      (rule.host?.trim() || rule.protocol !== 'HTTPS') &&
      (rule.paths || []).some(isValidIngressPath),
  );

/** 按域名合并规则（保持首次出现的顺序）；空域名的规则单独成组 */
const groupRulesByHost = (rules: IngressRouteRuleItem[]) =>
  rules.reduce<Map<string, IngressRoutePathItem[]>>((groups, rule) => {
    const host = rule?.host?.trim() || '';
    const paths = (rule?.paths || []).filter(isValidIngressPath);
    if (!isValidIngressRule(rule) || paths.length === 0) {
      return groups;
    }

    groups.set(host, [...(groups.get(host) || []), ...paths]);
    return groups;
  }, new Map());

const buildPathBackend = (path: IngressRoutePathItem) =>
  path.backend
    ? path.backend
    : {
        service: {
          name: path.serviceName?.trim(),
          port:
            typeof path.servicePort === 'number'
              ? { number: path.servicePort }
              : { name: path.servicePort?.trim() },
        },
      };

const buildIngressRouteRules = (values: CreateIngressFormValues) =>
  Array.from(groupRulesByHost(values.rules || [])).map(([host, paths]) => ({
    ...(host ? { host } : {}),
    http: {
      paths: paths.map((path) => ({
        path: path.path?.trim() || '/',
        pathType: path.pathType,
        backend: buildPathBackend(path),
      })),
    },
  }));

const getTlsHosts = (rules: IngressRouteRuleItem[]) =>
  Array.from(
    new Set(
      rules
        .filter(
          (rule) =>
            rule?.protocol === 'HTTPS' &&
            rule.host?.trim() &&
            (rule.paths || []).some(isValidIngressPath),
        )
        .map((rule) => rule.host?.trim() || ''),
    ),
  );

const getManifestRuleHosts = (manifest?: Record<string, unknown>) =>
  new Set(
    getRecordList(getRecordValue(manifest?.spec)?.rules)
      .map((rule) => getStringValue(rule.host))
      .filter((host): host is string => Boolean(host)),
  );

const getManifestTlsHosts = (manifest?: Record<string, unknown>) =>
  new Set(
    getRecordList(getRecordValue(manifest?.spec)?.tls).flatMap((item) =>
      getStringList(item.hosts),
    ),
  );

/**
 * 生成 spec.tls。
 * - 新建（没有已有清单）：所有 HTTPS 域名放进一个条目，带上表单里的 TLS Secret。
 * - 编辑：保留已有条目的分组与各自的 Secret，只增删域名；表单里的 TLS Secret
 *   对应已有清单中第一个 Secret，改名时同步改到使用它的条目上。
 */
const buildIngressTls = (
  values: CreateIngressFormValues,
  manifest?: Record<string, unknown>,
) => {
  const rules = values.rules || [];
  const tlsHosts = getTlsHosts(rules);
  const secretName = values.tlsSecretName?.trim() || undefined;
  const previous = getRecordList(getRecordValue(manifest?.spec)?.tls);

  if (previous.length === 0) {
    return tlsHosts.length > 0
      ? [{ hosts: tlsHosts, ...(secretName ? { secretName } : {}) }]
      : undefined;
  }

  const formHosts = new Set(
    rules.map((rule) => rule?.host?.trim()).filter(Boolean),
  );
  const previousRuleHosts = getManifestRuleHosts(manifest);
  const originalSecretName = getStringValue(
    previous.find((item) => getStringValue(item.secretName))?.secretName,
  );
  const remaining = new Set(tlsHosts);
  const entries = previous.flatMap((item) => {
    const previousHosts = getStringList(item.hosts);
    const hosts = previousHosts.filter(
      (host) =>
        remaining.has(host) ||
        // 证书域名本来就不对应任何规则（例如只做证书覆盖）：保留
        (!previousRuleHosts.has(host) && !formHosts.has(host)),
    );
    for (const host of hosts) {
      remaining.delete(host);
    }
    if (previousHosts.length > 0 && hosts.length === 0) {
      return [];
    }

    const entry: Record<string, unknown> = { ...item };
    if (previousHosts.length > 0) {
      entry.hosts = hosts;
    }
    if (getStringValue(item.secretName) === originalSecretName) {
      if (secretName) {
        entry.secretName = secretName;
      } else {
        delete entry.secretName;
      }
    }
    return [entry];
  });

  if (remaining.size > 0) {
    const target = entries.find(
      (entry) =>
        Array.isArray(entry.hosts) &&
        getStringValue(entry.secretName) === secretName,
    );
    if (target) {
      target.hosts = [...getStringList(target.hosts), ...remaining];
    } else {
      entries.push({
        hosts: Array.from(remaining),
        ...(secretName ? { secretName } : {}),
      });
    }
  }

  return entries.length > 0 ? entries : undefined;
};

export const buildIngressRouteSpec = (
  values: CreateIngressFormValues,
  manifest?: Record<string, unknown>,
) => {
  const spec: Record<string, unknown> = {
    rules: buildIngressRouteRules(values),
  };
  const tls = buildIngressTls(values, manifest);

  if (values.ingressClassName?.trim()) {
    spec.ingressClassName = values.ingressClassName.trim();
  }
  if (tls) {
    spec.tls = tls;
  }

  return spec;
};

/**
 * 表单注解 + 路径重写注解。开启路径重写时写入 rewrite-target；
 * use-regex 只在注解里还没有时补 "true"，已有的值（包括 "false"）不覆盖。
 */
const buildIngressAnnotations = (values: CreateIngressFormValues) => {
  const annotations = toRecord(values.annotations);

  delete annotations[REWRITE_TARGET_ANNOTATION];
  if (values.enablePathRewrite) {
    if (!(USE_REGEX_ANNOTATION in annotations)) {
      annotations[USE_REGEX_ANNOTATION] = 'true';
    }
    annotations[REWRITE_TARGET_ANNOTATION] =
      values.rewriteTarget?.trim() || '/';
  }

  return annotations;
};

export const buildIngressMetadata = (values: CreateIngressFormValues) => {
  const annotations = buildIngressAnnotations(values);
  const labels = toRecord(values.labels);

  return {
    ...(Object.keys(labels).length > 0 ? { labels } : {}),
    ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
  };
};

/**
 * 把表单值合并回已有清单（编辑用）：只替换表单管理的部分
 * （rules、tls、ingressClassName、labels、annotations），其余字段（defaultBackend、status 等）原样保留。
 */
export const buildIngressRouteManifest = (
  values: CreateIngressFormValues,
  manifest?: Record<string, unknown>,
) => {
  const currentSpec = getRecordValue(manifest?.spec) || {};
  const currentMetadata = getRecordValue(manifest?.metadata) || {};
  const routeSpec = buildIngressRouteSpec(values, manifest);
  const nextSpec: Record<string, unknown> = { ...currentSpec, ...routeSpec };
  const annotations = buildIngressAnnotations(values);
  const labels = toRecord(values.labels);

  if (!routeSpec.tls) {
    delete nextSpec.tls;
  }
  if (!values.ingressClassName?.trim()) {
    delete nextSpec.ingressClassName;
  }

  const metadata: Record<string, unknown> = {
    ...currentMetadata,
    ...(Object.keys(labels).length > 0 ? { labels } : {}),
    ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
  };

  if (Object.keys(labels).length === 0) {
    delete metadata.labels;
  }
  if (Object.keys(annotations).length === 0) {
    delete metadata.annotations;
  }

  return {
    ...(manifest || {}),
    metadata,
    spec: nextSpec,
  };
};

export const buildCreateIngressManifest = (values: CreateIngressFormValues) => {
  return {
    apiVersion: INGRESS_API_VERSION,
    kind: INGRESS_KIND,
    metadata: {
      name: values.name,
      namespace: values.namespace,
      ...buildIngressMetadata(values),
    },
    spec: buildIngressRouteSpec(values),
  };
};

/** 整张表单的跨步骤校验（提交前兜底）：返回第一条错误信息；组件内请传入 useT() 的结果 */
export const getIngressFormError = (
  values: CreateIngressFormValues,
  tr: Translate = t,
): string | undefined => {
  if (!values.name?.trim() || !values.namespace?.trim()) {
    return tr('pages.k8s.forms.ingress.nameNamespaceRequired');
  }
  if (!(values.rules || []).some(isValidIngressRule)) {
    return tr('pages.k8s.forms.ingress.rules.required');
  }
  if (values.enablePathRewrite && !values.rewriteTarget?.trim()) {
    return tr('pages.k8s.forms.ingress.rewriteTarget.required');
  }
  return undefined;
};

const toPathType = (value: unknown): IngressPathType =>
  PATH_TYPES.includes(value as IngressPathType)
    ? (value as IngressPathType)
    : 'Prefix';

export const buildIngressFormValuesFromManifest = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
): CreateIngressFormValues => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);
  const annotations = { ...getRecordValue(metadata?.annotations) };
  const rewriteTarget = getStringValue(annotations[REWRITE_TARGET_ANNOTATION]);
  const tlsHosts = getManifestTlsHosts(manifest);
  const tlsSecretName = getStringValue(
    getRecordList(spec?.tls).find((item) => getStringValue(item.secretName))
      ?.secretName,
  );
  // 没有域名的规则（匹配所有域名）同样保留
  const rules = getRecordList(spec?.rules).flatMap((rule) => {
    const host = getStringValue(rule.host);
    const paths = getRecordList(getRecordValue(rule.http)?.paths).flatMap(
      (pathRecord) => {
        const backend = getRecordValue(pathRecord.backend);
        const service = getRecordValue(backend?.service);
        const port = getRecordValue(service?.port);
        const servicePort =
          getNumberValue(port?.number) || getStringValue(port?.name);
        const base = {
          path: getStringValue(pathRecord.path) || '/',
          pathType: toPathType(pathRecord.pathType),
        };

        if (service && servicePort) {
          return [
            createIngressPathItem({
              ...base,
              serviceName: getStringValue(service.name),
              servicePort,
            }),
          ];
        }
        // 非 Service 后端（backend.resource）：原样带入
        return backend ? [createIngressPathItem({ ...base, backend })] : [];
      },
    );

    if (paths.length === 0) {
      return [];
    }

    return [
      createIngressRuleItem({
        host,
        protocol: host && tlsHosts.has(host) ? 'HTTPS' : 'HTTP',
        paths,
      }),
    ];
  });

  // 重写路径由表单字段表达；use-regex 是普通注解，留在注解列表里由用户决定
  delete annotations[REWRITE_TARGET_ANNOTATION];

  return {
    name: getStringValue(metadata?.name),
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace,
    rules,
    ingressClassName: getStringValue(spec?.ingressClassName),
    tlsSecretName,
    enablePathRewrite: Boolean(rewriteTarget),
    rewriteTarget: rewriteTarget || '/',
    annotations: mapRecordToKeyValueItems(annotations),
    labels: mapRecordToKeyValueItems(getRecordValue(metadata?.labels)),
  };
};

/** 从 Service 对象原文读出可选的后端端口：命名端口（值为名称）和端口号 */
export const getServicePortOptions = (
  service?: Record<string, unknown>,
): IngressServicePortOption[] => {
  const options = getRecordList(getRecordValue(service?.spec)?.ports).flatMap(
    (port) => {
      const name = getStringValue(port.name);
      const number = getNumberValue(port.port);
      const items: IngressServicePortOption[] = [];

      if (name) {
        items.push({ label: `${name} (${number || '-'})`, value: name });
      }
      if (number) {
        items.push({ label: String(number), value: number });
      }
      return items;
    },
  );

  return Array.from(
    new Map(options.map((option) => [option.value, option])).values(),
  );
};

export const INGRESS_PROTOCOL_OPTIONS: {
  label: string;
  value: IngressRuleProtocol;
}[] = [
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTPS', value: 'HTTPS' },
];

export const INGRESS_PATH_TYPE_OPTIONS: {
  label: string;
  value: IngressPathType;
}[] = [
  { label: 'Prefix', value: 'Prefix' },
  { label: 'Exact', value: 'Exact' },
  { label: 'ImplementationSpecific', value: 'ImplementationSpecific' },
];
