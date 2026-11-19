import type { CreateWorkloadFormValues } from '../types';

export const accessModeOptions = [
  { label: 'ReadWriteOnce', value: 'ReadWriteOnce' },
  { label: 'ReadOnlyMany', value: 'ReadOnlyMany' },
  { label: 'ReadWriteMany', value: 'ReadWriteMany' },
];

export const storageFieldNames: (keyof CreateWorkloadFormValues)[] = [
  'storageCategory',
  'storageType',
  'volumeType',
  'configResourceType',
  'volumeName',
  'emptyDirSizeLimit',
  'hostPath',
  'claimName',
  'claimStorageClassName',
  'claimCapacity',
  'claimAccessModes',
  'pvcNamePrefix',
  'pvcStorageClassName',
  'pvcAccessModes',
  'pvcSizeGi',
  'configResourceName',
  'containerMounts',
  'selectSpecificKeys',
  'specificKeyPaths',
];

export const createStorageConfigId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const getInitialStorageDraftValues = (): Pick<
  CreateWorkloadFormValues,
  (typeof storageFieldNames)[number]
> => ({
  storageCategory: 'none',
  storageType: 'none',
  volumeType: 'persistentVolumeClaim',
  configResourceType: 'configMap',
  volumeName: 'data',
  emptyDirSizeLimit: '200Mi',
  hostPath: undefined,
  claimName: undefined,
  claimStorageClassName: undefined,
  claimCapacity: undefined,
  claimAccessModes: undefined,
  pvcNamePrefix: '',
  pvcStorageClassName: undefined,
  pvcAccessModes: ['ReadWriteOnce'],
  pvcSizeGi: 10,
  configResourceName: undefined,
  containerMounts: [],
  selectSpecificKeys: false,
  specificKeyPaths: [],
});
