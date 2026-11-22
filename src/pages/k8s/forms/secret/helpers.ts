/**
 * 保密字典表单 ⇄ 清单的纯逻辑（不依赖 React / antd，可单独用 Node 运行）。
 *
 * 写出规则：用户输入的文本进 stringData；解码后不是合法 UTF-8 的值保持 base64 原文留在 data，
 * 表单里只读展示，绝不解码改写。
 */
import type { Translate } from '@/utils/i18n';
import { validLabelKey } from '../../components/workloadForm';
import {
  createId,
  getRecordValue,
  getStringValue,
  NAME_PATTERN,
  trimValue as normalizeText,
} from '../shared/manifest';
import type {
  CreateSecretFormValues,
  RegistryProtocol,
  SecretDataItem,
  SecretMetadataItem,
  SecretType,
} from './types';

export { NAME_PATTERN };

export const SECRET_API_VERSION = 'v1';
export const SECRET_KIND = 'Secret';

export const SECRET_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;
export const DOCKER_CONFIG_JSON_KEY = '.dockerconfigjson';
/** 二进制值的展示文案 id（在渲染处用 t 翻译） */
export const BINARY_VALUE_TEXT_ID = 'pages.k8s.forms.secret.binaryValue';

type Manifest = Record<string, unknown>;

export const createSecretDataItem = (
  keyName = '',
  value = '',
  binary = false,
): SecretDataItem => ({
  id: createId(),
  keyName,
  value,
  ...(binary ? { binary: true } : {}),
});

export const createSecretMetadataItem = (
  keyName = '',
  value = '',
): SecretMetadataItem => ({
  id: createId(),
  keyName,
  value,
});

/** 类型选项：labelId 在渲染处用 t 翻译 */
export const secretTypeOptions: { labelId: string; value: SecretType }[] = [
  {
    labelId: 'pages.k8s.forms.secret.type.opaque',
    value: 'Opaque',
  },
  {
    labelId: 'pages.k8s.forms.secret.type.tls',
    value: 'kubernetes.io/tls',
  },
  {
    labelId: 'pages.k8s.forms.secret.type.dockerconfigjson',
    value: 'kubernetes.io/dockerconfigjson',
  },
  {
    labelId: 'pages.k8s.forms.secret.type.basicAuth',
    value: 'kubernetes.io/basic-auth',
  },
];

export const registryProtocolOptions: {
  label: RegistryProtocol;
  value: RegistryProtocol;
}[] = [
  {
    label: 'https://',
    value: 'https://',
  },
  {
    label: 'http://',
    value: 'http://',
  },
];

export const getInitialCreateSecretValues = (
  namespace?: string,
): CreateSecretFormValues => ({
  name: undefined,
  namespace,
  labels: [],
  annotations: [],
  type: 'Opaque',
  dataItems: [],
  tlsCertificate: undefined,
  tlsPrivateKey: undefined,
  registryProtocol: 'https://',
  registryAddress: undefined,
  registryUsername: undefined,
  registryPassword: undefined,
  registryEmail: undefined,
  registryConfigSource: undefined,
  basicAuthUsername: undefined,
  basicAuthPassword: undefined,
});

export const encodeBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

/** base64 → 文本；不是合法 base64 或解码后不是合法 UTF-8 时返回 undefined（BOM 原样保留） */
export const decodeBase64Text = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }

  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    return undefined;
  }
};

const isSecretType = (value?: string): value is SecretType =>
  secretTypeOptions.some((option) => option.value === value);

/** 各类型由专用表单项维护的键（不进通用数据列表） */
const getTypedKeys = (type: SecretType): string[] => {
  if (type === 'kubernetes.io/tls') {
    return ['tls.crt', 'tls.key'];
  }
  if (type === 'kubernetes.io/dockerconfigjson') {
    return [DOCKER_CONFIG_JSON_KEY];
  }
  if (type === 'kubernetes.io/basic-auth') {
    return ['username', 'password'];
  }

  return [];
};

const normalizeRegistryServer = (
  protocol: RegistryProtocol,
  address?: string,
) => {
  const trimmedAddress = normalizeText(address);

  if (!trimmedAddress) {
    return '';
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedAddress)) {
    return trimmedAddress;
  }

  return `${protocol}${trimmedAddress}`;
};

const getRegistryServerParts = (server?: string) => {
  const value = normalizeText(server);
  const matched = value.match(/^(https?:\/\/)(.+)$/i);

  if (!matched) {
    return {
      registryProtocol: 'https://' as RegistryProtocol,
      registryAddress: value,
    };
  }

  return {
    registryProtocol: matched[1].toLowerCase() as RegistryProtocol,
    registryAddress: matched[2],
  };
};

const parseDockerConfig = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    return getRecordValue(JSON.parse(value));
  } catch {
    return undefined;
  }
};

/**
 * 生成 .dockerconfigjson。表单只维护第一个镜像服务；来自已有对象时（registryConfigSource）
 * 其余镜像服务以及未建模的字段原样保留。
 */
export const getDockerConfigJson = (values: CreateSecretFormValues) => {
  const server = normalizeRegistryServer(
    values.registryProtocol || 'https://',
    values.registryAddress,
  );
  const username = normalizeText(values.registryUsername);
  const password = values.registryPassword || '';
  const email = normalizeText(values.registryEmail);
  const source = parseDockerConfig(values.registryConfigSource);
  const sourceAuths = Object.entries(getRecordValue(source?.auths) || {});
  const { email: _sourceEmail, ...sourceAuth } =
    getRecordValue(sourceAuths[0]?.[1]) || {};
  const auths: Record<string, unknown> = {
    [server]: {
      ...sourceAuth,
      username,
      password,
      ...(email ? { email } : {}),
      auth: encodeBase64(`${username}:${password}`),
    },
  };

  sourceAuths.slice(1).forEach(([key, value]) => {
    if (key !== server) {
      auths[key] = value;
    }
  });

  return JSON.stringify({ ...source, auths });
};

const hasRegistryValues = (values: CreateSecretFormValues) =>
  Boolean(
    normalizeText(values.registryAddress) ||
      normalizeText(values.registryUsername) ||
      values.registryPassword,
  );

/** 表单值 → data（二进制原文）与 stringData（文本） */
export const buildSecretData = (values: CreateSecretFormValues) => {
  const data: Record<string, string> = {};
  const stringData: Record<string, string> = {};
  const setText = (key: string, value?: string) => {
    // 专用表单项没有值、而数据列表里带着这个键（二进制或无法解析的原文）：保留原值
    if (value === undefined && (key in data || key in stringData)) {
      return;
    }
    delete data[key];
    stringData[key] = value || '';
  };

  (values.dataItems || []).forEach((item) => {
    const keyName = normalizeText(item.keyName);

    if (!keyName) {
      return;
    }
    if (item.binary) {
      delete stringData[keyName];
      data[keyName] = item.value;
      return;
    }
    delete data[keyName];
    stringData[keyName] = item.value ?? '';
  });

  if (values.type === 'kubernetes.io/tls') {
    setText('tls.crt', values.tlsCertificate);
    setText('tls.key', values.tlsPrivateKey);
  }
  if (values.type === 'kubernetes.io/dockerconfigjson') {
    const carried =
      DOCKER_CONFIG_JSON_KEY in data || DOCKER_CONFIG_JSON_KEY in stringData;
    setText(
      DOCKER_CONFIG_JSON_KEY,
      hasRegistryValues(values) || !carried
        ? getDockerConfigJson(values)
        : undefined,
    );
  }
  if (values.type === 'kubernetes.io/basic-auth') {
    setText('username', values.basicAuthUsername);
    setText('password', values.basicAuthPassword);
  }

  return { data, stringData };
};

/** 标签 / 注解行 → 对象（空键丢弃） */
export const buildMetadataRecord = (items?: SecretMetadataItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = normalizeText(item.keyName);
    if (keyName) {
      record[keyName] = item.value ?? '';
    }
    return record;
  }, {});

const toMetadataItems = (value: unknown) =>
  Object.entries(getRecordValue(value) || {}).flatMap(([keyName, item]) =>
    typeof item === 'string' ? [createSecretMetadataItem(keyName, item)] : [],
  );

const getDockerConfigValues = (value?: string) => {
  const config = parseDockerConfig(value);
  const firstAuth = Object.entries(getRecordValue(config?.auths) || {})[0];

  if (!firstAuth) {
    return undefined;
  }

  const [server, authValue] = firstAuth;
  const auth = getRecordValue(authValue);
  const authPair = decodeBase64Text(getStringValue(auth?.auth));
  const separatorIndex = authPair?.indexOf(':') ?? -1;

  return {
    ...getRegistryServerParts(server),
    registryUsername:
      getStringValue(auth?.username) ||
      (separatorIndex >= 0 ? authPair?.slice(0, separatorIndex) : undefined),
    registryPassword:
      getStringValue(auth?.password) ||
      (separatorIndex >= 0 ? authPair?.slice(separatorIndex + 1) : undefined),
    registryEmail: getStringValue(auth?.email),
  };
};

/**
 * 已有 Secret → 表单值。data 里解码后是合法 UTF-8 的值按文本展示；否则标记为 binary，
 * value 保持 base64 原文。专用表单项维护的键（tls.crt 等）是文本时不进数据列表。
 * 表单不支持的类型按「默认」展示，写回时类型保持不变（见 buildUpdatedSecretSettingsManifest）。
 */
export const getSecretFormValuesFromManifest = (
  manifest?: Manifest,
  fallbackNamespace?: string,
): CreateSecretFormValues => {
  const metadata = getRecordValue(manifest?.metadata);
  const manifestType = getStringValue(manifest?.type);
  const type = isSecretType(manifestType) ? manifestType : 'Opaque';
  const typedKeys = getTypedKeys(type);
  const stringData = getRecordValue(manifest?.stringData) || {};
  const text: Record<string, string> = {};
  const dataItems: SecretDataItem[] = [];
  const addText = (keyName: string, value: string) => {
    text[keyName] = value;
    if (keyName && !typedKeys.includes(keyName)) {
      dataItems.push(createSecretDataItem(keyName, value));
    }
  };

  Object.entries(getRecordValue(manifest?.data) || {}).forEach(
    ([keyName, value]) => {
      // stringData 里的同名键在写入时覆盖 data
      if (
        typeof value !== 'string' ||
        typeof stringData[keyName] === 'string'
      ) {
        return;
      }

      const decoded = decodeBase64Text(value);
      if (decoded === undefined) {
        dataItems.push(createSecretDataItem(keyName, value, true));
        return;
      }
      addText(keyName, decoded);
    },
  );
  Object.entries(stringData).forEach(([keyName, value]) => {
    if (typeof value === 'string') {
      addText(keyName, value);
    }
  });

  const dockerConfigSource =
    type === 'kubernetes.io/dockerconfigjson'
      ? text[DOCKER_CONFIG_JSON_KEY]
      : undefined;
  const dockerConfigValues = getDockerConfigValues(dockerConfigSource);
  // 解析不出镜像服务的 .dockerconfigjson：作为普通数据带着走，写回时不改写
  if (dockerConfigSource !== undefined && !dockerConfigValues) {
    dataItems.push(
      createSecretDataItem(DOCKER_CONFIG_JSON_KEY, dockerConfigSource),
    );
  }
  const namespace = getStringValue(metadata?.namespace) || fallbackNamespace;

  return {
    ...getInitialCreateSecretValues(namespace),
    name: getStringValue(metadata?.name),
    namespace,
    labels: toMetadataItems(metadata?.labels),
    annotations: toMetadataItems(metadata?.annotations),
    type,
    dataItems,
    tlsCertificate: type === 'kubernetes.io/tls' ? text['tls.crt'] : undefined,
    tlsPrivateKey: type === 'kubernetes.io/tls' ? text['tls.key'] : undefined,
    registryProtocol: dockerConfigValues?.registryProtocol || 'https://',
    registryAddress: dockerConfigValues?.registryAddress,
    registryUsername: dockerConfigValues?.registryUsername,
    registryPassword: dockerConfigValues?.registryPassword,
    registryEmail: dockerConfigValues?.registryEmail,
    registryConfigSource: dockerConfigValues ? dockerConfigSource : undefined,
    basicAuthUsername:
      type === 'kubernetes.io/basic-auth' ? text.username : undefined,
    basicAuthPassword:
      type === 'kubernetes.io/basic-auth' ? text.password : undefined,
  };
};

const setRecordField = (
  target: Record<string, unknown>,
  key: string,
  record: Record<string, string>,
) => {
  if (Object.keys(record).length > 0) {
    target[key] = record;
  } else {
    delete target[key];
  }
};

/**
 * 把表单值写回已有 Secret：只改表单建模的部分（类型、数据、标签、注解），其余字段原样保留。
 * values.labels / values.annotations 为 undefined 时不动原有标签 / 注解。
 */
export const buildUpdatedSecretSettingsManifest = (
  manifest: Manifest,
  values: CreateSecretFormValues,
): Manifest => {
  const metadata: Record<string, unknown> = {
    ...(getRecordValue(manifest.metadata) || {}),
  };
  const manifestType = getStringValue(manifest.type);
  const { data, stringData } = buildSecretData(values);

  if (values.labels !== undefined) {
    setRecordField(metadata, 'labels', buildMetadataRecord(values.labels));
  }
  if (values.annotations !== undefined) {
    setRecordField(
      metadata,
      'annotations',
      buildMetadataRecord(values.annotations),
    );
  }

  const nextManifest: Manifest = {
    ...manifest,
    metadata,
    // 类型不可变：表单不支持的类型（展示为「默认」）保持原值
    type:
      manifestType === undefined || isSecretType(manifestType)
        ? values.type
        : manifestType,
  };

  setRecordField(nextManifest, 'data', data);
  setRecordField(nextManifest, 'stringData', stringData);

  return nextManifest;
};

export const buildCreateSecretManifest = (
  values: CreateSecretFormValues,
): Manifest => {
  const labels = buildMetadataRecord(values.labels);
  const annotations = buildMetadataRecord(values.annotations);
  const { data, stringData } = buildSecretData(values);

  return {
    apiVersion: SECRET_API_VERSION,
    kind: SECRET_KIND,
    metadata: {
      name: normalizeText(values.name),
      namespace: normalizeText(values.namespace),
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    type: values.type,
    ...(Object.keys(data).length > 0 ? { data } : {}),
    stringData,
  };
};

export const validateSecretDataItems = (
  items: SecretDataItem[] | undefined,
  t: Translate,
) => {
  const normalizedKeys = (items || [])
    .map((item) => normalizeText(item.keyName))
    .filter(Boolean);

  if (normalizedKeys.length === 0) {
    return t('pages.k8s.forms.secret.data.atLeastOne');
  }
  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return t('pages.k8s.forms.common.dataKeyDuplicate');
  }

  return undefined;
};

export const validateSecretMetadataItems = (
  items: SecretMetadataItem[] | undefined,
  title: string,
  t: Translate,
) => {
  const keys = new Set<string>();

  for (const item of items || []) {
    const keyName = normalizeText(item.keyName);

    if (!keyName && normalizeText(item.value)) {
      return t('pages.k8s.forms.secret.metadata.keyRequired', { title });
    }
    if (keyName && !validLabelKey(keyName)) {
      return t('pages.k8s.forms.secret.metadata.keyInvalid', {
        title,
        keyName,
      });
    }
    if (keys.has(keyName)) {
      return t('pages.k8s.forms.secret.metadata.keyDuplicate', { title });
    }
    if (keyName) {
      keys.add(keyName);
    }
  }

  return undefined;
};

/**
 * 整份表单值的校验（返回第一条错误）。向导每次只挂载当前步骤，form.validateFields 只覆盖
 * 已挂载的表单项，提交前用它对全量值（form.getFieldsValue(true)）再检查一遍。
 */
export const getSecretFormError = (
  values: CreateSecretFormValues,
  t: Translate,
) => {
  const name = normalizeText(values.name);

  if (!name) {
    return t('pages.k8s.forms.common.name.required');
  }
  if (name.length > 63) {
    return t('pages.k8s.forms.common.name.maxLength');
  }
  if (!NAME_PATTERN.test(name)) {
    return t('pages.k8s.forms.common.name.pattern');
  }
  if (!normalizeText(values.namespace)) {
    return t('pages.k8s.forms.common.namespace.required');
  }

  const metadataError =
    validateSecretMetadataItems(
      values.labels,
      t('pages.k8s.forms.common.labels'),
      t,
    ) ||
    validateSecretMetadataItems(
      values.annotations,
      t('pages.k8s.forms.common.annotations'),
      t,
    );
  if (metadataError) {
    return metadataError;
  }

  if (values.type === 'kubernetes.io/tls') {
    if (!values.tlsCertificate) {
      return t('pages.k8s.forms.secret.certificate.required');
    }
    if (!values.tlsPrivateKey) {
      return t('pages.k8s.forms.secret.privateKey.required');
    }
    return undefined;
  }
  if (values.type === 'kubernetes.io/dockerconfigjson') {
    if (!normalizeText(values.registryAddress)) {
      return t('pages.k8s.forms.secret.registryAddress.required');
    }
    if (!normalizeText(values.registryUsername)) {
      return t('pages.k8s.forms.common.username.required');
    }
    if (!values.registryPassword) {
      return t('pages.k8s.forms.common.password.required');
    }
    return undefined;
  }
  if (values.type === 'kubernetes.io/basic-auth') {
    if (!values.basicAuthUsername) {
      return t('pages.k8s.forms.common.username.required');
    }
    if (!values.basicAuthPassword) {
      return t('pages.k8s.forms.common.password.required');
    }
    return undefined;
  }

  return validateSecretDataItems(values.dataItems, t);
};

export const getSecretStepFields = (
  step: number,
  type: SecretType,
): (keyof CreateSecretFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 2) {
    return ['labels', 'annotations'];
  }
  if (type === 'kubernetes.io/tls') {
    return ['type', 'tlsCertificate', 'tlsPrivateKey'];
  }
  if (type === 'kubernetes.io/dockerconfigjson') {
    return [
      'type',
      'registryProtocol',
      'registryAddress',
      'registryUsername',
      'registryPassword',
      'registryEmail',
      'dataItems',
    ];
  }
  if (type === 'kubernetes.io/basic-auth') {
    return ['type', 'basicAuthUsername', 'basicAuthPassword'];
  }

  return ['type', 'dataItems'];
};

export const hasSecretDataSettingsContent = (
  values: Partial<CreateSecretFormValues>,
) => {
  if (values.type === 'kubernetes.io/tls') {
    return Boolean(values.tlsCertificate && values.tlsPrivateKey);
  }
  if (values.type === 'kubernetes.io/dockerconfigjson') {
    return Boolean(
      values.registryAddress &&
        values.registryUsername &&
        values.registryPassword,
    );
  }
  if (values.type === 'kubernetes.io/basic-auth') {
    return Boolean(values.basicAuthUsername && values.basicAuthPassword);
  }

  return Boolean(values.dataItems?.some((item) => item.keyName.trim()));
};
