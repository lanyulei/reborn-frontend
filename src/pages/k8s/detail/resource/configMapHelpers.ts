import { getRecordValue, getStringValue } from './helpers';
import type { ResourceDataItem } from './ResourceDataFields';

type ConfigMapBasicInfo = {
  namespace?: string;
  create_time?: string;
};

const getConfigMapMetadata = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.metadata);

const buildConfigMapBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
): ConfigMapBasicInfo => {
  const metadata = getConfigMapMetadata(manifest);

  return {
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace || '-',
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const getConfigMapDataItems = (
  data?: Record<string, unknown>,
): ResourceDataItem[] =>
  Object.entries(data || {})
    .filter(([key, value]) => key && value !== undefined && value !== null)
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));

const buildConfigMapDataItems = (
  manifest?: Record<string, unknown>,
): ResourceDataItem[] => [
  ...getConfigMapDataItems(getRecordValue(manifest?.data)),
  ...getConfigMapDataItems(getRecordValue(manifest?.binaryData)),
];

export type { ConfigMapBasicInfo };
export { buildConfigMapBasicInfo, buildConfigMapDataItems };
