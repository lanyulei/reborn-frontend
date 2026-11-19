import { formatValue, getRecordValue, getStringValue } from './helpers';

const DEFAULT_CLASS_ANNOTATIONS = [
  'storageclass.kubernetes.io/is-default-class',
  'storageclass.beta.kubernetes.io/is-default-class',
];

const VOLUME_CLONE_ANNOTATIONS = ['storageclass.kubeflare.io/allow-clone'];

const SNAPSHOT_ANNOTATIONS = [
  'storageclass.kubeflare.io/allow-snapshot',
  'storageclass.kubeflare.io/support-snapshot',
  'storageclass.kubernetes.io/support-snapshot',
];

const getBooleanAnnotation = (
  annotations: Record<string, unknown> | undefined,
  keys: string[],
) => {
  const value = keys
    .map((key) => getStringValue(annotations?.[key]))
    .find((item) => item !== undefined);

  if (value === undefined) {
    return undefined;
  }

  return value.toLowerCase() === 'true';
};

const buildStorageClassBasicInfo = (manifest?: Record<string, unknown>) => {
  const volumeOperations = buildStorageClassVolumeOperations(manifest);

  return {
    default_volume: isDefaultStorageClass(manifest),
    provisioner: manifest?.provisioner,
    allow_volume_clone: volumeOperations.allowVolumeClone,
    allow_volume_expansion: volumeOperations.allowVolumeExpansion,
    reclaim_policy: manifest?.reclaimPolicy,
    allow_volume_snapshot: volumeOperations.allowVolumeSnapshot,
  };
};

const isDefaultStorageClass = (manifest?: Record<string, unknown>) => {
  const metadata = getRecordValue(manifest?.metadata);
  const annotations = getRecordValue(metadata?.annotations);

  return getBooleanAnnotation(annotations, DEFAULT_CLASS_ANNOTATIONS);
};

const buildStorageClassVolumeOperations = (
  manifest?: Record<string, unknown>,
) => {
  const metadata = getRecordValue(manifest?.metadata);
  const annotations = getRecordValue(metadata?.annotations);
  const parameters = getRecordValue(manifest?.parameters);

  return {
    allowVolumeClone: getBooleanAnnotation(
      annotations,
      VOLUME_CLONE_ANNOTATIONS,
    ),
    allowVolumeExpansion:
      typeof manifest?.allowVolumeExpansion === 'boolean'
        ? manifest.allowVolumeExpansion
        : undefined,
    allowVolumeSnapshot:
      getBooleanAnnotation(annotations, SNAPSHOT_ANNOTATIONS) ??
      (typeof parameters?.allowVolumeSnapshot === 'string'
        ? parameters.allowVolumeSnapshot.toLowerCase() === 'true'
        : undefined),
  };
};

const applyStorageClassDefault = (
  manifest: Record<string, unknown>,
  isDefault = true,
) => {
  const metadata = getRecordValue(manifest.metadata) || {};
  const annotations = {
    ...(getRecordValue(metadata.annotations) || {}),
  } as Record<string, unknown>;

  DEFAULT_CLASS_ANNOTATIONS.forEach((key) => {
    annotations[key] = String(isDefault);
  });

  return {
    ...manifest,
    metadata: {
      ...metadata,
      annotations,
    },
  };
};

type StorageClassVolumeOperationValues = {
  allowVolumeClone?: boolean;
  allowVolumeExpansion?: boolean;
  allowVolumeSnapshot?: boolean;
};

const applyStorageClassVolumeOperations = (
  manifest: Record<string, unknown>,
  values: StorageClassVolumeOperationValues,
) => {
  const metadata = getRecordValue(manifest.metadata) || {};
  const annotations = {
    ...(getRecordValue(metadata.annotations) || {}),
  } as Record<string, unknown>;

  VOLUME_CLONE_ANNOTATIONS.forEach((key) => {
    annotations[key] = String(Boolean(values.allowVolumeClone));
  });
  SNAPSHOT_ANNOTATIONS.forEach((key) => {
    annotations[key] = String(Boolean(values.allowVolumeSnapshot));
  });

  return {
    ...manifest,
    allowVolumeExpansion: Boolean(values.allowVolumeExpansion),
    metadata: {
      ...metadata,
      annotations,
    },
  };
};

const formatStorageClassBoolean = (value: unknown) => {
  if (typeof value !== 'boolean') {
    return '-';
  }

  return value ? '是' : '否';
};

const getReclaimPolicyLabel = (value: unknown) => {
  if (value === 'Delete') {
    return '删除';
  }
  if (value === 'Retain') {
    return '保留';
  }
  if (value === 'Recycle') {
    return '回收';
  }

  return formatValue(value);
};

type StorageClassBasicInfo = ReturnType<typeof buildStorageClassBasicInfo>;
type StorageClassVolumeOperations = ReturnType<
  typeof buildStorageClassVolumeOperations
>;

export type { StorageClassBasicInfo, StorageClassVolumeOperations };
export {
  applyStorageClassDefault,
  applyStorageClassVolumeOperations,
  buildStorageClassBasicInfo,
  buildStorageClassVolumeOperations,
  formatStorageClassBoolean,
  getReclaimPolicyLabel,
  isDefaultStorageClass,
};
