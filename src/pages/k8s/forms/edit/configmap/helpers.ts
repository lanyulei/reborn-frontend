/**
 * 配置字典「编辑设置」的纯逻辑（不依赖 React / antd，可单独用 Node 运行）。
 * 只把表单建模的部分（data、标签、注解）写到已加载对象的深拷贝上；
 * 没有改动的部分保持原样，原样打开再保存得到的对象与加载的对象完全一致。
 */
import {
  buildConfigMapData,
  buildMetadataRecord,
  getConfigMapBinaryKeys,
  getConfigMapFormValuesFromManifest,
  validateConfigMapDataItems,
  validateConfigMapMetadataItems,
} from '../../configmap/helpers';
import type {
  ConfigMapMetadataItem,
  CreateConfigMapFormValues,
} from '../../configmap/types';
import { getRecordValue } from '../../shared/manifest';

type Manifest = Record<string, unknown>;

type ConfigMapEditFormValues = Pick<
  CreateConfigMapFormValues,
  'annotations' | 'dataItems' | 'labels'
>;

const cloneManifest = (manifest: Manifest): Manifest =>
  JSON.parse(JSON.stringify(manifest));

const isSameRecord = (
  current: Record<string, unknown>,
  next: Record<string, string>,
) => {
  const keys = Object.keys(current);

  return (
    keys.length === Object.keys(next).length &&
    keys.every((key) => key in next && current[key] === next[key])
  );
};

/** 把键值写到 target[key]：与现有内容相同则不动；写空则删掉该字段 */
const setRecordIfChanged = (
  target: Record<string, unknown>,
  key: string,
  next: Record<string, string>,
) => {
  if (isSameRecord(getRecordValue(target[key]) || {}, next)) {
    return;
  }
  if (Object.keys(next).length > 0) {
    target[key] = next;
  } else {
    delete target[key];
  }
};

/**
 * 把标签 / 注解行写到对象（就地修改传入的对象，调用方须先深拷贝）。
 * 传 undefined 的一项不动。
 */
const applyMetadataEdit = (
  manifest: Manifest,
  values: {
    annotations?: ConfigMapMetadataItem[];
    labels?: ConfigMapMetadataItem[];
  },
) => {
  if (values.labels === undefined && values.annotations === undefined) {
    return;
  }

  const metadata = getRecordValue(manifest.metadata) || {};

  if (values.labels !== undefined) {
    setRecordIfChanged(metadata, 'labels', buildMetadataRecord(values.labels));
  }
  if (values.annotations !== undefined) {
    setRecordIfChanged(
      metadata,
      'annotations',
      buildMetadataRecord(values.annotations),
    );
  }
  manifest.metadata = metadata;
};

const isConfigMapImmutable = (manifest?: Manifest) =>
  manifest?.immutable === true;

const getConfigMapEditValues = (
  manifest?: Manifest,
): ConfigMapEditFormValues => {
  const values = getConfigMapFormValuesFromManifest(manifest);

  return {
    annotations: values.annotations,
    dataItems: values.dataItems,
    labels: values.labels,
  };
};

/** 表单值的整体校验（返回第一条错误） */
const getConfigMapEditError = (
  manifest: Manifest,
  values: ConfigMapEditFormValues,
) =>
  validateConfigMapMetadataItems(values.labels, '标签') ||
  validateConfigMapMetadataItems(values.annotations, '注解') ||
  (isConfigMapImmutable(manifest)
    ? undefined
    : validateConfigMapDataItems(
        values.dataItems,
        getConfigMapBinaryKeys(manifest),
      ));

/**
 * 表单值 → 修改后的对象（加载对象的深拷贝）。只改 data、标签、注解；
 * binaryData、immutable 与其余字段原样保留。不可变（immutable）的配置字典不改 data。
 */
const applyConfigMapEdit = (
  manifest: Manifest,
  values: ConfigMapEditFormValues,
): Manifest => {
  const next = cloneManifest(manifest);

  applyMetadataEdit(next, values);
  if (!isConfigMapImmutable(manifest) && values.dataItems !== undefined) {
    setRecordIfChanged(next, 'data', buildConfigMapData(values.dataItems));
  }

  return next;
};

export type { ConfigMapEditFormValues };
export {
  applyConfigMapEdit,
  applyMetadataEdit,
  cloneManifest,
  getConfigMapEditError,
  getConfigMapEditValues,
  isConfigMapImmutable,
};
