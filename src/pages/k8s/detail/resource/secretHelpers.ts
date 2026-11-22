import { getRecordValue, getStringValue } from './helpers';

type SecretBasicInfo = {
  namespace?: string;
  type?: string;
  create_time?: string;
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

export type { SecretBasicInfo };
export { buildSecretBasicInfo };
