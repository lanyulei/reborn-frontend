import { getRecordValue, getStringValue } from './helpers';
import type { ResourceDataItem } from './ResourceDataFields';

const DOCKER_CONFIG_JSON_KEY = '.dockerconfigjson';
const TLS_CERTIFICATE_KEY = 'tls.crt';
const TLS_PRIVATE_KEY = 'tls.key';
const BASIC_AUTH_USERNAME_KEY = 'username';
const BASIC_AUTH_PASSWORD_KEY = 'password';

type SecretBasicInfo = {
  namespace?: string;
  type?: string;
  create_time?: string;
};

type SecretDockerConfigItem = {
  key: string;
  server: string;
  username?: string;
  password?: string;
  email?: string;
};

type SecretDataView = {
  type?: string;
  dataItems: ResourceDataItem[];
  tlsCertificate?: string;
  tlsPrivateKey?: string;
  dockerConfigItems: SecretDockerConfigItem[];
  dockerExtraItems: ResourceDataItem[];
  basicAuthUsername?: string;
  basicAuthPassword?: string;
};

const getSecretMetadata = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.metadata);

const buildSecretBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
): SecretBasicInfo => {
  const metadata = getSecretMetadata(manifest);

  return {
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace || '-',
    type: getStringValue(manifest?.type) || 'Opaque',
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const getSecretDataRecord = (manifest?: Record<string, unknown>) => ({
  ...(getRecordValue(manifest?.data) || {}),
  ...(getRecordValue(manifest?.stringData) || {}),
});

const getSecretDataItems = (
  data?: Record<string, unknown>,
  excludedKeys: string[] = [],
): ResourceDataItem[] =>
  Object.entries(data || {})
    .filter(
      ([key, value]) =>
        key &&
        !excludedKeys.includes(key) &&
        value !== undefined &&
        value !== null,
    )
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));

const decodeBase64Text = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return undefined;
  }
};

const parseJsonRecord = (value?: string) => {
  const candidates = [value, decodeBase64Text(value)].filter(
    Boolean,
  ) as string[];

  for (const candidate of candidates) {
    try {
      return getRecordValue(JSON.parse(candidate));
    } catch {
      // Keep trying the next representation.
    }
  }

  return undefined;
};

const getAuthPairFromEncodedValue = (value?: string) => {
  const decoded = decodeBase64Text(value);

  if (!decoded) {
    return {};
  }

  const separatorIndex = decoded.indexOf(':');

  if (separatorIndex < 0) {
    return {};
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
};

const buildDockerConfigItems = (value?: unknown): SecretDockerConfigItem[] => {
  const config = parseJsonRecord(getStringValue(value));
  const auths = getRecordValue(config?.auths);

  return Object.entries(auths || {})
    .filter(([server]) => Boolean(server))
    .map(([server, authValue], index) => {
      const auth = getRecordValue(authValue);
      const authPair = getAuthPairFromEncodedValue(getStringValue(auth?.auth));

      return {
        key: `${server}-${index}`,
        server,
        username: getStringValue(auth?.username) || authPair.username,
        password: getStringValue(auth?.password) || authPair.password,
        email: getStringValue(auth?.email),
      };
    });
};

const buildSecretDataView = (
  manifest?: Record<string, unknown>,
): SecretDataView => {
  const data = getSecretDataRecord(manifest);
  const type = getStringValue(manifest?.type) || 'Opaque';

  return {
    type,
    dataItems: getSecretDataItems(data),
    tlsCertificate: getStringValue(data[TLS_CERTIFICATE_KEY]),
    tlsPrivateKey: getStringValue(data[TLS_PRIVATE_KEY]),
    dockerConfigItems: buildDockerConfigItems(data[DOCKER_CONFIG_JSON_KEY]),
    dockerExtraItems: getSecretDataItems(data, [DOCKER_CONFIG_JSON_KEY]),
    basicAuthUsername: getStringValue(data[BASIC_AUTH_USERNAME_KEY]),
    basicAuthPassword: getStringValue(data[BASIC_AUTH_PASSWORD_KEY]),
  };
};

export type { SecretBasicInfo, SecretDataView, SecretDockerConfigItem };
export { buildSecretBasicInfo, buildSecretDataView };
