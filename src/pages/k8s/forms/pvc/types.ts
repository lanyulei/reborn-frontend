import type { KeyValueEditorItem } from '../shared/KeyValueEditor';

type PersistentVolumeClaimCreateMode = 'storageClass' | 'persistentVolume';

type PersistentVolumeClaimVolumeMode = 'Block' | 'Filesystem';

type StorageUnit = 'Mi' | 'Gi' | 'Ti';

type CreatePersistentVolumeClaimFormValues = {
  accessModes?: string[];
  annotations?: KeyValueEditorItem[];
  createMode?: PersistentVolumeClaimCreateMode;
  labels?: KeyValueEditorItem[];
  name?: string;
  namespace?: string;
  storageClassName?: string;
  storageSize?: number;
  storageUnit?: StorageUnit;
  volumeMode?: PersistentVolumeClaimVolumeMode;
  volumeName?: string;
  /** 所绑定持久卷的存储类（绑定已有持久卷时随选择带出；持久卷没有存储类时为空串） */
  volumeStorageClassName?: string;
};

export type {
  CreatePersistentVolumeClaimFormValues,
  PersistentVolumeClaimCreateMode,
  PersistentVolumeClaimVolumeMode,
  StorageUnit,
};
