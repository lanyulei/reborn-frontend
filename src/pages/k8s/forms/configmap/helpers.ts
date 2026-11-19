/**
 * 配置字典表单 ⇄ 清单的纯逻辑（不依赖 React / antd，可单独用 Node 运行）。
 * 表单只维护 data、标签与注解；binaryData 等其余字段在写回已有对象时原样保留。
 */
import { validLabelKey } from '../../components/workloadForm';
import {
  createId,
  getRecordValue,
  getStringValue,
  trimValue as normalizeText,
} from '../shared/manifest';
import type {
  ConfigMapDataItem,
  ConfigMapMetadataItem,
  CreateConfigMapFormValues,
} from './types';

type Manifest = Record<string, unknown>;

const CONFIG_MAP_API_VERSION = 'v1';
const CONFIG_MAP_KIND = 'ConfigMap';
const CONFIG_MAP_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;
const CONFIG_MAP_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const createConfigMapDataItem = (
  keyName = '',
  value = '',
): ConfigMapDataItem => ({
  id: createId(),
  keyName,
  value,
});

const createConfigMapMetadataItem = (
  keyName = '',
  value = '',
): ConfigMapMetadataItem => ({
  id: createId(),
  keyName,
  value,
});

const getInitialCreateConfigMapValues = (
  namespace?: string,
): CreateConfigMapFormValues => ({
  annotations: [],
  dataItems: [],
  labels: [],
  name: undefined,
  namespace,
});

const normalizeDataItems = (items?: ConfigMapDataItem[]) =>
  (items || [])
    .map((item) => ({
      keyName: normalizeText(item.keyName),
      value: item.value ?? '',
    }))
    .filter((item) => item.keyName);

const hasConfigMapDataContent = (values: CreateConfigMapFormValues) =>
  normalizeDataItems(values.dataItems).length > 0;

/** binaryData 里已有的键不能再出现在 data 里（集群会拒绝） */
const validateConfigMapDataItems = (
  items?: ConfigMapDataItem[],
  binaryKeys: string[] = [],
) => {
  const keys = new Set<string>();

  for (const item of items || []) {
    const keyName = normalizeText(item.keyName);
    const value = item.value ?? '';

    if (!keyName && value.trim()) {
      return '请填写数据键';
    }
    if (!keyName) {
      continue;
    }
    if (keyName.length > 253) {
      return '键最长 253 个字符';
    }
    if (!CONFIG_MAP_KEY_PATTERN.test(keyName)) {
      return '键只能包含字母、数字、点（.）、下划线（_）和连字符（-）';
    }
    if (keys.has(keyName)) {
      return '数据键不能重复';
    }
    if (binaryKeys.includes(keyName)) {
      return `键 ${keyName} 已被二进制数据占用`;
    }

    keys.add(keyName);
  }

  return undefined;
};

const validateConfigMapMetadataItems = (
  items: ConfigMapMetadataItem[] | undefined,
  title: string,
) => {
  const keys = new Set<string>();

  for (const item of items || []) {
    const keyName = normalizeText(item.keyName);

    if (!keyName && normalizeText(item.value)) {
      return `请填写${title}的键`;
    }
    if (keyName && !validLabelKey(keyName)) {
      return `${title}的键「${keyName}」不合法`;
    }
    if (keys.has(keyName)) {
      return `${title}的键不能重复`;
    }
    if (keyName) {
      keys.add(keyName);
    }
  }

  return undefined;
};

/**
 * 整份表单值的校验（返回第一条错误）。向导每次只挂载当前步骤，form.validateFields 只覆盖
 * 已挂载的表单项，提交前用它对全量值（form.getFieldsValue(true)）再检查一遍。
 */
const getConfigMapFormError = (values: CreateConfigMapFormValues) => {
  const name = normalizeText(values.name);

  if (!name) {
    return '请输入名称';
  }
  if (name.length > 63) {
    return '名称最长 63 个字符';
  }
  if (!CONFIG_MAP_NAME_PATTERN.test(name)) {
    return '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾';
  }
  if (!normalizeText(values.namespace)) {
    return '请选择命名空间';
  }

  return (
    validateConfigMapMetadataItems(values.labels, '标签') ||
    validateConfigMapMetadataItems(values.annotations, '注解') ||
    validateConfigMapDataItems(values.dataItems)
  );
};

const buildConfigMapData = (items?: ConfigMapDataItem[]) =>
  normalizeDataItems(items).reduce<Record<string, string>>((data, item) => {
    data[item.keyName] = item.value;
    return data;
  }, {});

/** 标签 / 注解行 → 对象（空键丢弃） */
const buildMetadataRecord = (items?: ConfigMapMetadataItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = normalizeText(item.keyName);
    if (keyName) {
      record[keyName] = item.value ?? '';
    }
    return record;
  }, {});

const toMetadataItems = (value: unknown) =>
  Object.entries(getRecordValue(value) || {}).flatMap(([keyName, item]) =>
    typeof item === 'string'
      ? [createConfigMapMetadataItem(keyName, item)]
      : [],
  );

const buildCreateConfigMapManifest = (
  values: CreateConfigMapFormValues,
): Manifest => {
  const labels = buildMetadataRecord(values.labels);
  const annotations = buildMetadataRecord(values.annotations);

  return {
    apiVersion: CONFIG_MAP_API_VERSION,
    kind: CONFIG_MAP_KIND,
    metadata: {
      name: normalizeText(values.name),
      namespace: normalizeText(values.namespace),
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    data: buildConfigMapData(values.dataItems),
  };
};

/** 已有 ConfigMap 的 binaryData 键（表单不展示其内容，只用于提示与查重） */
const getConfigMapBinaryKeys = (manifest?: Manifest) =>
  Object.keys(getRecordValue(manifest?.binaryData) || {});

const getConfigMapFormValuesFromManifest = (
  manifest?: Manifest,
  fallbackNamespace?: string,
): CreateConfigMapFormValues => {
  const metadata = getRecordValue(manifest?.metadata);
  const data = getRecordValue(manifest?.data) || {};
  const namespace = getStringValue(metadata?.namespace) || fallbackNamespace;

  return {
    ...getInitialCreateConfigMapValues(namespace),
    name: getStringValue(metadata?.name),
    namespace,
    labels: toMetadataItems(metadata?.labels),
    annotations: toMetadataItems(metadata?.annotations),
    dataItems: Object.entries(data).flatMap(([keyName, value]) =>
      typeof value === 'string'
        ? [createConfigMapDataItem(keyName, value)]
        : [],
    ),
  };
};

const setRecordField = (
  target: Record<string, unknown>,
  key: string,
  record: Record<string, string>,
) => {
  if (Object.keys(record).length > 0) {
    target[key] = record;
  } else {
    delete target[key];
  }
};

/**
 * 把表单值写回已有 ConfigMap：只改 data、标签、注解，binaryData 与其余字段原样保留。
 * values.labels / values.annotations 为 undefined 时不动原有标签 / 注解。
 */
const buildUpdatedConfigMapSettingsManifest = (
  manifest: Manifest,
  values: CreateConfigMapFormValues,
): Manifest => {
  const metadata: Record<string, unknown> = {
    ...(getRecordValue(manifest.metadata) || {}),
  };

  if (values.labels !== undefined) {
    setRecordField(metadata, 'labels', buildMetadataRecord(values.labels));
  }
  if (values.annotations !== undefined) {
    setRecordField(
      metadata,
      'annotations',
      buildMetadataRecord(values.annotations),
    );
  }

  const nextManifest: Manifest = {
    ...manifest,
    metadata,
  };

  setRecordField(nextManifest, 'data', buildConfigMapData(values.dataItems));

  return nextManifest;
};

const getConfigMapStepFields = (
  step: number,
): (keyof CreateConfigMapFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 2) {
    return ['labels', 'annotations'];
  }

  return ['dataItems'];
};

export {
  buildConfigMapData,
  buildCreateConfigMapManifest,
  buildMetadataRecord,
  buildUpdatedConfigMapSettingsManifest,
  CONFIG_MAP_API_VERSION,
  CONFIG_MAP_KEY_PATTERN,
  CONFIG_MAP_KIND,
  CONFIG_MAP_NAME_PATTERN,
  createConfigMapDataItem,
  createConfigMapMetadataItem,
  getConfigMapBinaryKeys,
  getConfigMapFormError,
  getConfigMapFormValuesFromManifest,
  getConfigMapStepFields,
  getInitialCreateConfigMapValues,
  hasConfigMapDataContent,
  validateConfigMapDataItems,
  validateConfigMapMetadataItems,
};
