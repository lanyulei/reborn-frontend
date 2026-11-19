import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import {
  createId,
  createKeyValueItem,
  getRecordValue,
  NAME_PATTERN,
  trimValue as normalizeName,
} from '../shared/manifest';
import type { StringListEditorItem } from '../shared/StringListEditor';
import type { CreateStorageClassFormValues } from './types';

const STORAGE_CLASS_API_VERSION = 'storage.k8s.io/v1';
const STORAGE_CLASS_KIND = 'StorageClass';

const DEFAULT_CLASS_ANNOTATION = 'storageclass.kubernetes.io/is-default-class';

const createStringItem = (value = ''): StringListEditorItem => ({
  id: createId(),
  value,
});

const keyValueItemsToRecord = (items?: KeyValueEditorItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value] as const)
    .filter(([key]) => key);

  return entries.length > 0 ? Object.fromEntries(entries) : {};
};

const stringItemsToList = (items?: StringListEditorItem[]) =>
  (items || []).map((item) => item.value.trim()).filter(Boolean);

const getInitialStorageClassValues = (): CreateStorageClassFormValues => ({
  allowVolumeExpansion: 'false',
  isDefault: 'false',
  mountOptions: [createStringItem()],
  name: undefined,
  parameters: [createKeyValueItem()],
  provisioner: undefined,
  reclaimPolicy: 'Delete',
  volumeBindingMode: 'WaitForFirstConsumer',
});

const buildCreateStorageClassManifest = (
  values: CreateStorageClassFormValues,
): Record<string, unknown> => {
  const parameters = keyValueItemsToRecord(values.parameters);
  const mountOptions = stringItemsToList(values.mountOptions);

  return {
    apiVersion: STORAGE_CLASS_API_VERSION,
    kind: STORAGE_CLASS_KIND,
    metadata: {
      name: normalizeName(values.name),
      ...(values.isDefault === 'true'
        ? { annotations: { [DEFAULT_CLASS_ANNOTATION]: 'true' } }
        : {}),
    },
    provisioner: normalizeName(values.provisioner),
    reclaimPolicy: values.reclaimPolicy || 'Delete',
    volumeBindingMode: values.volumeBindingMode || 'WaitForFirstConsumer',
    allowVolumeExpansion: values.allowVolumeExpansion === 'true',
    ...(Object.keys(parameters).length > 0 ? { parameters } : {}),
    ...(mountOptions.length > 0 ? { mountOptions } : {}),
  };
};

const getStorageClassStepFields = (
  step: number,
): (keyof CreateStorageClassFormValues)[] => {
  if (step === 0) {
    return ['name', 'isDefault'];
  }

  return [
    'allowVolumeExpansion',
    'mountOptions',
    'parameters',
    'provisioner',
    'reclaimPolicy',
    'volumeBindingMode',
  ];
};

const validateStorageClassParameters = (items?: KeyValueEditorItem[]) => {
  const normalizedKeys = (items || [])
    .map((item) => normalizeName(item.keyName))
    .filter(Boolean);

  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return '参数键不能重复';
  }

  return undefined;
};

/** YAML 模式提交前的检查；通过返回 undefined，否则返回提示语 */
const validateStorageClassManifest = (
  resource: Record<string, unknown>,
): string | undefined => {
  const metadata = getRecordValue(resource.metadata);
  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';

  if (!name) {
    return 'YAML 必须包含 metadata.name';
  }
  if (resource.kind !== STORAGE_CLASS_KIND) {
    return `YAML kind 必须为 ${STORAGE_CLASS_KIND}`;
  }
  if (resource.apiVersion !== STORAGE_CLASS_API_VERSION) {
    return `YAML apiVersion 必须为 ${STORAGE_CLASS_API_VERSION}`;
  }
  if (
    typeof resource.provisioner !== 'string' ||
    !resource.provisioner.trim()
  ) {
    return 'YAML 必须包含 provisioner';
  }
  return undefined;
};

export {
  buildCreateStorageClassManifest,
  createKeyValueItem,
  createStringItem,
  DEFAULT_CLASS_ANNOTATION,
  getInitialStorageClassValues,
  getStorageClassStepFields,
  NAME_PATTERN,
  STORAGE_CLASS_API_VERSION,
  STORAGE_CLASS_KIND,
  validateStorageClassManifest,
  validateStorageClassParameters,
};
