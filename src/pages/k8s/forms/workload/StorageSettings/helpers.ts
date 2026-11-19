import type {
  CreateWorkloadContainerValues,
  WorkloadConfigResourceType,
  WorkloadContainerMountItem,
  WorkloadMountMode,
  WorkloadStorageCategory,
  WorkloadStorageKeyPathItem,
  WorkloadStorageType,
  WorkloadVolumeType,
} from '../types';

const KUBERNETES_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const ABSOLUTE_PATH_PATTERN = /^\/.+/;
const STORAGE_QUANTITY_PATTERN =
  /^(0|[1-9]\d*)(m|Ki|Mi|Gi|Ti|Pi|Ei|K|M|G|T|P|E)?$/;

const volumeTypeOptions: { label: string; value: WorkloadVolumeType }[] = [
  { label: '持久卷', value: 'persistentVolumeClaim' },
  { label: '临时卷', value: 'emptyDir' },
  { label: 'HostPath 卷', value: 'hostPath' },
];

const configResourceTypeOptions: {
  label: string;
  value: WorkloadConfigResourceType;
}[] = [
  { label: '配置字典', value: 'configMap' },
  { label: '保密字典', value: 'secret' },
];

const createStorageItemId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getContainerStorageKey = (container: CreateWorkloadContainerValues) =>
  container.id || container.containerName || '';

const createContainerMountItem = (
  container: CreateWorkloadContainerValues,
  mountMode: WorkloadMountMode,
): WorkloadContainerMountItem => ({
  id: createStorageItemId(),
  containerId: container.id,
  containerName: container.containerName,
  mountMode,
  mountPath: '',
  subPath: '',
});

const createStorageKeyPathItem = (): WorkloadStorageKeyPathItem => ({
  id: createStorageItemId(),
  keyName: undefined,
  path: '',
});

const isConfigResourceStorage = (storageType?: WorkloadStorageType) =>
  storageType === 'configMap' || storageType === 'secret';

const isVolumeStorage = (storageType?: WorkloadStorageType) =>
  storageType === 'persistentVolumeClaim' ||
  storageType === 'volumeClaimTemplate' ||
  storageType === 'emptyDir' ||
  storageType === 'hostPath';

const getStorageCategoryFromType = (
  storageType?: WorkloadStorageType,
): WorkloadStorageCategory => {
  if (isVolumeStorage(storageType)) {
    return 'volume';
  }
  if (isConfigResourceStorage(storageType)) {
    return 'config';
  }
  return 'none';
};

const getDefaultMountMode = (
  storageCategory?: WorkloadStorageCategory,
): WorkloadMountMode => (storageCategory === 'config' ? 'readOnly' : 'none');

const getActivatedMountMode = (
  storageCategory?: WorkloadStorageCategory,
): WorkloadMountMode =>
  storageCategory === 'config' ? 'readOnly' : 'readWrite';

const normalizeContainerMounts = (
  containers: CreateWorkloadContainerValues[],
  currentMounts: WorkloadContainerMountItem[],
  storageCategory?: WorkloadStorageCategory,
) => {
  const defaultMountMode = getDefaultMountMode(storageCategory);

  return containers.map((container) => {
    const containerKey = getContainerStorageKey(container);
    const current = currentMounts.find(
      (item) =>
        item.containerId === container.id ||
        item.containerName === container.containerName ||
        item.containerId === containerKey,
    );

    const mountMode =
      storageCategory === 'none'
        ? 'none'
        : storageCategory === 'config' && current?.mountMode === 'readWrite'
          ? 'readOnly'
          : current?.mountMode || defaultMountMode;

    return {
      ...createContainerMountItem(container, defaultMountMode),
      ...current,
      containerId: container.id,
      containerName: container.containerName,
      mountMode,
    };
  });
};

const activateEmptyMounts = (
  mounts: WorkloadContainerMountItem[],
  storageCategory?: WorkloadStorageCategory,
) => {
  if (!mounts.every((item) => !item.mountMode || item.mountMode === 'none')) {
    return mounts;
  }

  return mounts.map((item) => ({
    ...item,
    mountMode: getActivatedMountMode(storageCategory),
  }));
};

const getMountModeOptions = (storageCategory?: WorkloadStorageCategory) =>
  storageCategory === 'config'
    ? [
        { label: '只读', value: 'readOnly' },
        { label: '不挂载', value: 'none' },
      ]
    : [
        { label: '读写', value: 'readWrite' },
        { label: '只读', value: 'readOnly' },
        { label: '不挂载', value: 'none' },
      ];

/** 还没被其它行占用的键（当前行已选的键保留） */
const getAvailableKeys = (
  keys: string[],
  keyPaths: WorkloadStorageKeyPathItem[],
  currentKey?: string,
) => {
  const selectedKeys = new Set(keyPaths.map((item) => item.keyName));

  return keys.filter((key) => key === currentKey || !selectedKeys.has(key));
};

const isRelativeVolumeItemPath = (value?: string) => {
  const nextValue = value?.trim();

  return Boolean(
    nextValue && !nextValue.startsWith('/') && !nextValue.includes('..'),
  );
};

const isVolumeItemPath = (value?: string) => {
  const nextValue = value?.trim();

  return Boolean(
    nextValue &&
      !nextValue.includes('..') &&
      (ABSOLUTE_PATH_PATTERN.test(nextValue) ||
        isRelativeVolumeItemPath(nextValue)),
  );
};

const sanitizeVolumeName = (value?: string, fallback = 'storage-volume') => {
  const normalized = (value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 63);

  return normalized || fallback;
};

export {
  ABSOLUTE_PATH_PATTERN,
  activateEmptyMounts,
  configResourceTypeOptions,
  createStorageKeyPathItem,
  getActivatedMountMode,
  getAvailableKeys,
  getContainerStorageKey,
  getMountModeOptions,
  getStorageCategoryFromType,
  isConfigResourceStorage,
  isRelativeVolumeItemPath,
  isVolumeItemPath,
  isVolumeStorage,
  KUBERNETES_NAME_PATTERN,
  normalizeContainerMounts,
  STORAGE_QUANTITY_PATTERN,
  sanitizeVolumeName,
  volumeTypeOptions,
};
