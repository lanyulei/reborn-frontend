import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import type { StringListEditorItem } from '../shared/StringListEditor';

type PersistentVolumeBooleanSelectValue = 'true' | 'false';

type PersistentVolumeHostPathType =
  | ''
  | 'BlockDevice'
  | 'CharDevice'
  | 'Directory'
  | 'DirectoryOrCreate'
  | 'File'
  | 'FileOrCreate'
  | 'Socket';

type PersistentVolumeNodeSelectorOperator =
  | 'DoesNotExist'
  | 'Exists'
  | 'Gt'
  | 'In'
  | 'Lt'
  | 'NotIn';

type PersistentVolumeReclaimPolicy = 'Delete' | 'Retain';

type StorageUnit = 'Mi' | 'Gi' | 'Ti';

type PersistentVolumeSourceType = 'csi' | 'hostPath' | 'local' | 'nfs';

type PersistentVolumeMode = 'Block' | 'Filesystem';

type CreatePersistentVolumeFormValues = {
  accessModes?: string[];
  annotations?: KeyValueEditorItem[];
  capacitySize?: number;
  capacityUnit?: StorageUnit;
  claimName?: string;
  claimNamespace?: string;
  csiDriver?: string;
  csiFsType?: string;
  csiReadOnly?: PersistentVolumeBooleanSelectValue;
  csiVolumeAttributes?: KeyValueEditorItem[];
  csiVolumeHandle?: string;
  hostPath?: string;
  hostPathType?: PersistentVolumeHostPathType;
  labels?: KeyValueEditorItem[];
  localFsType?: string;
  localPath?: string;
  mountOptions?: StringListEditorItem[];
  name?: string;
  nfsPath?: string;
  nfsReadOnly?: PersistentVolumeBooleanSelectValue;
  nfsServer?: string;
  nodeAffinityKey?: string;
  nodeAffinityOperator?: PersistentVolumeNodeSelectorOperator;
  nodeAffinityValues?: StringListEditorItem[];
  persistentVolumeReclaimPolicy?: PersistentVolumeReclaimPolicy;
  storageClassName?: string;
  volumeMode?: PersistentVolumeMode;
  volumeSourceType?: PersistentVolumeSourceType;
};

type PersistentVolumeValidationError = {
  field: keyof CreatePersistentVolumeFormValues;
  /** 提示语的 i18n 键，由调用方翻译 */
  messageId: string;
};

export type {
  CreatePersistentVolumeFormValues,
  PersistentVolumeBooleanSelectValue,
  PersistentVolumeHostPathType,
  PersistentVolumeMode,
  PersistentVolumeNodeSelectorOperator,
  PersistentVolumeReclaimPolicy,
  PersistentVolumeSourceType,
  PersistentVolumeValidationError,
  StorageUnit,
};
