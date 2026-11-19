/**
 * 存储类「设为默认 / 取消默认」「允许卷扩容」的纯逻辑（不依赖 React / antd，可单独用 Node 运行）。
 * 都在加载对象的深拷贝上只改对应的字段。
 */

import { getRecordValue } from '../../shared/manifest';
import { DEFAULT_CLASS_ANNOTATION } from '../../storageclass/helpers';

type Manifest = Record<string, unknown>;

/** 旧版（beta）的默认存储类注解：集群仍然认它，取消默认时要一并去掉 */
const LEGACY_DEFAULT_CLASS_ANNOTATION =
  'storageclass.beta.kubernetes.io/is-default-class';

const cloneManifest = (manifest: Manifest): Manifest =>
  JSON.parse(JSON.stringify(manifest));

const getAnnotations = (manifest?: Manifest) =>
  getRecordValue(getRecordValue(manifest?.metadata)?.annotations);

/** 是否默认存储类（新旧注解任一为 "true"） */
const isDefaultStorageClass = (manifest?: Manifest) => {
  const annotations = getAnnotations(manifest);

  return [DEFAULT_CLASS_ANNOTATION, LEGACY_DEFAULT_CLASS_ANNOTATION].some(
    (key) => annotations?.[key] === 'true',
  );
};

/** 设为默认：写上默认注解；取消默认：去掉新旧两个注解 */
const applyStorageClassDefault = (
  manifest: Manifest,
  isDefault: boolean,
): Manifest => {
  const next = cloneManifest(manifest);
  const metadata = getRecordValue(next.metadata) || {};
  const annotations = { ...(getRecordValue(metadata.annotations) || {}) };

  if (isDefault) {
    annotations[DEFAULT_CLASS_ANNOTATION] = 'true';
  } else {
    delete annotations[DEFAULT_CLASS_ANNOTATION];
    delete annotations[LEGACY_DEFAULT_CLASS_ANNOTATION];
  }

  if (Object.keys(annotations).length > 0) {
    metadata.annotations = annotations;
  } else if (!isDefault) {
    delete metadata.annotations;
  }
  next.metadata = metadata;

  return next;
};

const isVolumeExpansionAllowed = (manifest?: Manifest) =>
  manifest?.allowVolumeExpansion === true;

/** 允许 / 不允许卷扩容：只改 allowVolumeExpansion；与当前一致时对象不变 */
const applyStorageClassVolumeExpansion = (
  manifest: Manifest,
  allow: boolean,
): Manifest => {
  const next = cloneManifest(manifest);

  if (isVolumeExpansionAllowed(manifest) !== allow) {
    next.allowVolumeExpansion = allow;
  }

  return next;
};

export {
  applyStorageClassDefault,
  applyStorageClassVolumeExpansion,
  isDefaultStorageClass,
  isVolumeExpansionAllowed,
  LEGACY_DEFAULT_CLASS_ANNOTATION,
};
