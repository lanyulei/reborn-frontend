import type { Translate } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import {
  createId,
  createKeyValueItem,
  getRecordValue,
  NAME_PATTERN,
  trimValue as normalizeText,
} from '../shared/manifest';
import type { StringListEditorItem } from '../shared/StringListEditor';
import type {
  CreatePersistentVolumeFormValues,
  PersistentVolumeNodeSelectorOperator,
  PersistentVolumeSourceType,
  PersistentVolumeValidationError,
  StorageUnit,
} from './types';

const PV_API_VERSION = 'v1';
const PV_KIND = 'PersistentVolume';

const STORAGE_UNITS: StorageUnit[] = ['Mi', 'Gi', 'Ti'];

/** 数值 + 单位 → Kubernetes 数量（如 10Gi、1.5Ti） */
const formatQuantity = (size?: number | null, unit?: StorageUnit) =>
  `${typeof size === 'number' && size > 0 ? size : 10}${unit || 'Gi'}`;

const SOURCE_LABELS: Record<PersistentVolumeSourceType, string> = {
  csi: 'CSI',
  hostPath: 'HostPath',
  local: 'Local',
  nfs: 'NFS',
};

const NODE_AFFINITY_OPERATORS_WITH_VALUES: PersistentVolumeNodeSelectorOperator[] =
  ['Gt', 'In', 'Lt', 'NotIn'];

const NODE_AFFINITY_SINGLE_VALUE_OPERATORS: PersistentVolumeNodeSelectorOperator[] =
  ['Gt', 'Lt'];

const createStringItem = (value = ''): StringListEditorItem => ({
  id: createId(),
  value,
});

const normalizeOptionalText = (value?: string) => {
  const nextValue = normalizeText(value);
  return nextValue || undefined;
};

const keyValueItemsToRecord = (items?: KeyValueEditorItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value] as const)
    .filter(([key]) => key);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const stringItemsToList = (items?: StringListEditorItem[]) =>
  (items || []).map((item) => item.value.trim()).filter(Boolean);

const getInitialPersistentVolumeValues =
  (): CreatePersistentVolumeFormValues => ({
    accessModes: ['ReadWriteOnce'],
    annotations: [createKeyValueItem()],
    capacitySize: 10,
    capacityUnit: 'Gi',
    claimName: undefined,
    claimNamespace: undefined,
    csiDriver: undefined,
    csiFsType: undefined,
    csiReadOnly: 'false',
    csiVolumeAttributes: [createKeyValueItem()],
    csiVolumeHandle: undefined,
    hostPath: '/tmp/example-pv',
    hostPathType: 'DirectoryOrCreate',
    labels: [createKeyValueItem()],
    localFsType: undefined,
    localPath: undefined,
    mountOptions: [createStringItem()],
    name: undefined,
    nfsPath: undefined,
    nfsReadOnly: 'false',
    nfsServer: undefined,
    nodeAffinityKey: 'kubernetes.io/hostname',
    nodeAffinityOperator: 'In',
    nodeAffinityValues: [createStringItem()],
    persistentVolumeReclaimPolicy: 'Retain',
    storageClassName: undefined,
    volumeMode: 'Filesystem',
    volumeSourceType: 'hostPath',
  });

const buildNodeAffinity = (values: CreatePersistentVolumeFormValues) => {
  const key = normalizeOptionalText(values.nodeAffinityKey);
  const operator = values.nodeAffinityOperator || 'In';

  if (!key) {
    return undefined;
  }

  const expression: Record<string, unknown> = {
    key,
    operator,
  };

  if (NODE_AFFINITY_OPERATORS_WITH_VALUES.includes(operator)) {
    expression.values = stringItemsToList(values.nodeAffinityValues);
  }

  return {
    required: {
      nodeSelectorTerms: [
        {
          matchExpressions: [expression],
        },
      ],
    },
  };
};

const buildVolumeSource = (values: CreatePersistentVolumeFormValues) => {
  const sourceType = values.volumeSourceType || 'hostPath';

  if (sourceType === 'nfs') {
    return {
      nfs: {
        server: normalizeText(values.nfsServer),
        path: normalizeText(values.nfsPath),
        readOnly: values.nfsReadOnly === 'true',
      },
    };
  }

  if (sourceType === 'csi') {
    const volumeAttributes = keyValueItemsToRecord(values.csiVolumeAttributes);

    return {
      csi: {
        driver: normalizeText(values.csiDriver),
        volumeHandle: normalizeText(values.csiVolumeHandle),
        ...(normalizeOptionalText(values.csiFsType)
          ? { fsType: normalizeOptionalText(values.csiFsType) }
          : {}),
        readOnly: values.csiReadOnly === 'true',
        ...(volumeAttributes ? { volumeAttributes } : {}),
      },
    };
  }

  if (sourceType === 'local') {
    const nodeAffinity = buildNodeAffinity(values);

    return {
      local: {
        path: normalizeText(values.localPath),
        ...(normalizeOptionalText(values.localFsType)
          ? { fsType: normalizeOptionalText(values.localFsType) }
          : {}),
      },
      ...(nodeAffinity ? { nodeAffinity } : {}),
    };
  }

  return {
    hostPath: {
      path: normalizeText(values.hostPath),
      ...(values.hostPathType ? { type: values.hostPathType } : {}),
    },
  };
};

const buildCreatePersistentVolumeManifest = (
  values: CreatePersistentVolumeFormValues,
): Record<string, unknown> => {
  const labels = keyValueItemsToRecord(values.labels);
  const annotations = keyValueItemsToRecord(values.annotations);
  const mountOptions = stringItemsToList(values.mountOptions);
  const claimName = normalizeOptionalText(values.claimName);
  const claimNamespace = normalizeOptionalText(values.claimNamespace);
  const storageClassName = normalizeOptionalText(values.storageClassName);

  return {
    apiVersion: PV_API_VERSION,
    kind: PV_KIND,
    metadata: {
      name: normalizeText(values.name),
      ...(labels ? { labels } : {}),
      ...(annotations ? { annotations } : {}),
    },
    spec: {
      capacity: {
        storage: formatQuantity(values.capacitySize, values.capacityUnit),
      },
      accessModes:
        values.accessModes && values.accessModes.length > 0
          ? values.accessModes
          : ['ReadWriteOnce'],
      persistentVolumeReclaimPolicy:
        values.persistentVolumeReclaimPolicy || 'Retain',
      volumeMode: values.volumeMode || 'Filesystem',
      ...(storageClassName ? { storageClassName } : {}),
      ...(mountOptions.length > 0 ? { mountOptions } : {}),
      ...(claimName && claimNamespace
        ? {
            claimRef: {
              namespace: claimNamespace,
              name: claimName,
            },
          }
        : {}),
      ...buildVolumeSource(values),
    },
  };
};

const getPersistentVolumeStepFields = (
  step: number,
  values?: CreatePersistentVolumeFormValues,
): (keyof CreatePersistentVolumeFormValues)[] => {
  if (step === 0) {
    return ['name'];
  }

  if (step === 1) {
    return [
      'accessModes',
      'capacitySize',
      'capacityUnit',
      'persistentVolumeReclaimPolicy',
      'volumeMode',
    ];
  }

  if (step === 2) {
    const sourceType = values?.volumeSourceType || 'hostPath';

    if (sourceType === 'nfs') {
      return ['volumeSourceType', 'nfsServer', 'nfsPath', 'nfsReadOnly'];
    }
    if (sourceType === 'csi') {
      return [
        'volumeSourceType',
        'csiDriver',
        'csiVolumeHandle',
        'csiReadOnly',
        'csiVolumeAttributes',
      ];
    }
    if (sourceType === 'local') {
      return [
        'volumeSourceType',
        'localPath',
        'nodeAffinityKey',
        'nodeAffinityOperator',
        'nodeAffinityValues',
      ];
    }

    return ['volumeSourceType', 'hostPath', 'hostPathType'];
  }

  return [
    'annotations',
    'claimName',
    'claimNamespace',
    'labels',
    'mountOptions',
  ];
};

const getSourceDescription = (sourceType?: PersistentVolumeSourceType) =>
  SOURCE_LABELS[sourceType || 'hostPath'];

const getPersistentVolumeSourceValidationError = (
  values: CreatePersistentVolumeFormValues,
): PersistentVolumeValidationError | undefined => {
  if (values.volumeSourceType !== 'local') {
    return undefined;
  }

  const operator = values.nodeAffinityOperator || 'In';
  const affinityValues = stringItemsToList(values.nodeAffinityValues);

  if (
    NODE_AFFINITY_OPERATORS_WITH_VALUES.includes(operator) &&
    affinityValues.length === 0
  ) {
    return {
      field: 'nodeAffinityValues',
      messageId: 'pages.k8s.forms.pv.nodeAffinity.values.required',
    };
  }

  if (
    NODE_AFFINITY_SINGLE_VALUE_OPERATORS.includes(operator) &&
    affinityValues.length !== 1
  ) {
    return {
      field: 'nodeAffinityValues',
      messageId: 'pages.k8s.forms.pv.nodeAffinity.values.single',
    };
  }

  if (
    NODE_AFFINITY_SINGLE_VALUE_OPERATORS.includes(operator) &&
    Number.isNaN(Number(affinityValues[0]))
  ) {
    return {
      field: 'nodeAffinityValues',
      messageId: 'pages.k8s.forms.pv.nodeAffinity.values.numeric',
    };
  }

  return undefined;
};

const getPersistentVolumeAdvancedValidationError = (
  values: CreatePersistentVolumeFormValues,
): PersistentVolumeValidationError | undefined => {
  const claimName = normalizeOptionalText(values.claimName);
  const claimNamespace = normalizeOptionalText(values.claimNamespace);

  if (claimName && !claimNamespace) {
    return {
      field: 'claimNamespace',
      messageId: 'pages.k8s.forms.pv.claimRef.namespace.required',
    };
  }

  if (claimNamespace && !claimName) {
    return {
      field: 'claimName',
      messageId: 'pages.k8s.forms.pv.claimRef.name.required',
    };
  }

  return undefined;
};

/** YAML 模式提交前的检查；通过返回 undefined，否则返回提示语 */
const validatePersistentVolumeManifest = (
  resource: Record<string, unknown>,
  t: Translate,
): string | undefined => {
  const metadata = getRecordValue(resource.metadata);
  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';

  if (!name) {
    return t('pages.k8s.forms.common.yaml.nameRequired');
  }
  if (resource.kind !== PV_KIND) {
    return t('pages.k8s.forms.common.yaml.kindMismatch', { kind: PV_KIND });
  }
  if (resource.apiVersion !== PV_API_VERSION) {
    return t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
      apiVersion: PV_API_VERSION,
    });
  }
  return undefined;
};

const hasKeyValueContent = (items?: KeyValueEditorItem[]) =>
  (items || []).some((item) => item.keyName.trim());

const hasStringListContent = (items?: StringListEditorItem[]) =>
  (items || []).some((item) => item.value.trim());

export {
  buildCreatePersistentVolumeManifest,
  createKeyValueItem,
  createStringItem,
  getInitialPersistentVolumeValues,
  getPersistentVolumeAdvancedValidationError,
  getPersistentVolumeSourceValidationError,
  getPersistentVolumeStepFields,
  getSourceDescription,
  hasKeyValueContent,
  hasStringListContent,
  NAME_PATTERN,
  PV_API_VERSION,
  PV_KIND,
  STORAGE_UNITS,
  validatePersistentVolumeManifest,
};
