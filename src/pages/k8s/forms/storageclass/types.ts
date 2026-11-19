import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import type { StringListEditorItem } from '../shared/StringListEditor';

type StorageClassBooleanSelectValue = 'true' | 'false';

type StorageClassReclaimPolicy = 'Delete' | 'Retain';

type StorageClassVolumeBindingMode = 'Immediate' | 'WaitForFirstConsumer';

type CreateStorageClassFormValues = {
  allowVolumeExpansion?: StorageClassBooleanSelectValue;
  isDefault?: StorageClassBooleanSelectValue;
  mountOptions?: StringListEditorItem[];
  name?: string;
  parameters?: KeyValueEditorItem[];
  provisioner?: string;
  reclaimPolicy?: StorageClassReclaimPolicy;
  volumeBindingMode?: StorageClassVolumeBindingMode;
};

export type {
  CreateStorageClassFormValues,
  StorageClassBooleanSelectValue,
  StorageClassReclaimPolicy,
  StorageClassVolumeBindingMode,
};
