import type { Translate } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import {
  createKeyValueItem,
  getRecordValue,
  NAME_PATTERN,
  trimValue as normalizeName,
} from '../shared/manifest';
import type {
  CreatePersistentVolumeClaimFormValues,
  PersistentVolumeClaimCreateMode,
  StorageUnit,
} from './types';

const PVC_API_VERSION = 'v1';
const PVC_KIND = 'PersistentVolumeClaim';

const STORAGE_UNITS: StorageUnit[] = ['Mi', 'Gi', 'Ti'];

const getInitialPersistentVolumeClaimValues = (
  namespace?: string,
): CreatePersistentVolumeClaimFormValues => ({
  accessModes: ['ReadWriteOnce'],
  annotations: [createKeyValueItem()],
  createMode: 'storageClass',
  labels: [createKeyValueItem()],
  name: undefined,
  namespace: namespace || undefined,
  storageClassName: undefined,
  storageSize: 10,
  storageUnit: 'Gi',
  volumeMode: 'Filesystem',
  volumeName: undefined,
  volumeStorageClassName: undefined,
});

const keyValueItemsToRecord = (items?: KeyValueEditorItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value] as const)
    .filter(([key]) => key);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const getModeDescription = (
  mode: PersistentVolumeClaimCreateMode | undefined,
  t: Translate,
) => {
  if (mode === 'persistentVolume') {
    return t('pages.k8s.forms.pvc.mode.persistentVolume');
  }
  return t('pages.k8s.forms.pvc.mode.storageClass');
};

/** 数值 + 单位 → Kubernetes 数量（如 10Gi、1.5Ti） */
const formatQuantity = (size?: number | null, unit?: StorageUnit) =>
  `${typeof size === 'number' && size > 0 ? size : 10}${unit || 'Gi'}`;

/** 把 10Gi / 500Mi / 1Ti 这类数量拆成数值 + 单位；其它写法返回 undefined */
const parseQuantity = (
  quantity?: string,
): { size: number; unit: StorageUnit } | undefined => {
  const match = /^(\d+(?:\.\d+)?)(Mi|Gi|Ti)$/.exec(quantity?.trim() || '');
  if (!match) {
    return undefined;
  }
  const size = Number(match[1]);
  return size > 0 ? { size, unit: match[2] as StorageUnit } : undefined;
};

const buildCreatePersistentVolumeClaimManifest = (
  values: CreatePersistentVolumeClaimFormValues,
): Record<string, unknown> => {
  const labels = keyValueItemsToRecord(values.labels);
  const annotations = keyValueItemsToRecord(values.annotations);
  const mode = values.createMode || 'storageClass';
  const spec: Record<string, unknown> = {
    accessModes:
      values.accessModes && values.accessModes.length > 0
        ? values.accessModes
        : ['ReadWriteOnce'],
    volumeMode: values.volumeMode || 'Filesystem',
    resources: {
      requests: {
        storage: formatQuantity(values.storageSize, values.storageUnit),
      },
    },
  };

  if (mode === 'persistentVolume') {
    // 绑定已有持久卷：存储类须与持久卷一致；持久卷没有存储类时写空串，避免被默认存储类接管
    spec.storageClassName = normalizeName(values.volumeStorageClassName);
    spec.volumeName = normalizeName(values.volumeName);
  } else {
    spec.storageClassName = normalizeName(values.storageClassName);
  }

  return {
    apiVersion: PVC_API_VERSION,
    kind: PVC_KIND,
    metadata: {
      name: normalizeName(values.name),
      namespace: normalizeName(values.namespace),
      ...(labels ? { labels } : {}),
      ...(annotations ? { annotations } : {}),
    },
    spec,
  };
};

const getPersistentVolumeClaimStepFields = (
  step: number,
  values?: CreatePersistentVolumeClaimFormValues,
): (keyof CreatePersistentVolumeClaimFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    const mode = values?.createMode || 'storageClass';
    return [
      'createMode',
      ...(mode === 'persistentVolume'
        ? (['volumeName', 'volumeStorageClassName'] as const)
        : (['storageClassName'] as const)),
      'accessModes',
      'volumeMode',
      'storageSize',
      'storageUnit',
    ];
  }

  return ['labels', 'annotations'];
};

/** YAML 模式提交前的检查；通过返回 undefined，否则返回提示语 */
const validatePersistentVolumeClaimManifest = (
  resource: Record<string, unknown>,
  t: Translate,
): string | undefined => {
  const metadata = getRecordValue(resource.metadata);
  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
  const namespace =
    typeof metadata?.namespace === 'string' ? metadata.namespace.trim() : '';

  if (!name || !namespace) {
    return t('pages.k8s.forms.common.yaml.nameNamespaceRequired');
  }
  if (resource.kind !== PVC_KIND) {
    return t('pages.k8s.forms.common.yaml.kindMismatch', { kind: PVC_KIND });
  }
  if (resource.apiVersion !== PVC_API_VERSION) {
    return t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
      apiVersion: PVC_API_VERSION,
    });
  }
  return undefined;
};

export {
  buildCreatePersistentVolumeClaimManifest,
  createKeyValueItem,
  formatQuantity,
  getInitialPersistentVolumeClaimValues,
  getModeDescription,
  getPersistentVolumeClaimStepFields,
  getRecordValue,
  NAME_PATTERN,
  PVC_API_VERSION,
  PVC_KIND,
  parseQuantity,
  STORAGE_UNITS,
  validatePersistentVolumeClaimManifest,
};
