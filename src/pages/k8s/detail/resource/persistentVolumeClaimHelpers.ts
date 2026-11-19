import {
  formatValue,
  getArrayValue,
  getRecordValue,
  getStringValue,
} from './helpers';

const buildPersistentVolumeClaimBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
  fallbackProvisioner?: string,
) => {
  const metadata = getRecordValue(manifest?.metadata);
  const annotations = getRecordValue(metadata?.annotations);
  const spec = getRecordValue(manifest?.spec);
  const status = getRecordValue(manifest?.status);
  const statusCapacity = getRecordValue(status?.capacity);
  const specResources = getRecordValue(spec?.resources);
  const specRequests = getRecordValue(specResources?.requests);

  return {
    namespace: metadata?.namespace || fallbackNamespace || '-',
    status: getStringValue(status?.phase),
    capacity: statusCapacity?.storage || specRequests?.storage,
    access_modes:
      getArrayValue(status?.accessModes).join('、') ||
      getArrayValue(spec?.accessModes).join('、'),
    provisioner:
      getStringValue(
        annotations?.['volume.kubernetes.io/storage-provisioner'],
      ) ||
      getStringValue(
        annotations?.['volume.beta.kubernetes.io/storage-provisioner'],
      ) ||
      fallbackProvisioner,
    storage_class: spec?.storageClassName,
    volume_name: spec?.volumeName,
    create_time: metadata?.creationTimestamp,
  };
};

const getPersistentVolumeClaimStorageClassName = (
  manifest?: Record<string, unknown>,
) => {
  const spec = getRecordValue(manifest?.spec);

  return getStringValue(spec?.storageClassName);
};

const formatPersistentVolumeClaimValue = (value: unknown) => formatValue(value);

type PersistentVolumeClaimBasicInfo = ReturnType<
  typeof buildPersistentVolumeClaimBasicInfo
>;

export type { PersistentVolumeClaimBasicInfo };
export {
  buildPersistentVolumeClaimBasicInfo,
  formatPersistentVolumeClaimValue,
  getPersistentVolumeClaimStorageClassName,
};
