/**
 * 持久卷声明「扩容」「克隆」的纯逻辑（不依赖 React / antd，可单独用 Node 运行）。
 */
import { formatQuantity, parseQuantity } from '../../pvc/helpers';
import type { StorageUnit } from '../../pvc/types';
import { getRecordValue, getStringValue } from '../../shared/manifest';

type Manifest = Record<string, unknown>;

type StorageSize = { size: number; unit: StorageUnit };

const UNIT_BYTES: Record<string, number> = {
  '': 1,
  E: 1000 ** 6,
  Ei: 1024 ** 6,
  G: 1000 ** 3,
  Gi: 1024 ** 3,
  k: 1000,
  Ki: 1024,
  M: 1000 ** 2,
  m: 1e-3,
  Mi: 1024 ** 2,
  P: 1000 ** 5,
  Pi: 1024 ** 5,
  T: 1000 ** 4,
  Ti: 1024 ** 4,
};

/** 克隆时不带到新对象上的注解：绑定 / 供给过程中由控制器写入的状态 */
const BIND_ANNOTATION_PATTERN =
  /^(pv\.kubernetes\.io|volume\.([a-z0-9-]+\.)?kubernetes\.io)\//;
const LAST_APPLIED_ANNOTATION =
  'kubectl.kubernetes.io/last-applied-configuration';

const cloneManifest = (manifest: Manifest): Manifest =>
  JSON.parse(JSON.stringify(manifest));

/** Kubernetes 数量 → 字节数；认不出的写法返回 undefined */
const parseStorageBytes = (quantity?: string): number | undefined => {
  const match = /^(\d+(?:\.\d+)?)(?:[eE]([+-]?\d+)|([A-Za-z]{0,2}))$/.exec(
    quantity?.trim() || '',
  );
  if (!match) {
    return undefined;
  }

  const factor =
    match[2] !== undefined
      ? 10 ** Number(match[2])
      : UNIT_BYTES[match[3] || ''];
  const bytes = Number(match[1]) * factor;

  return Number.isFinite(bytes) ? bytes : undefined;
};

/** 声明的容量（spec.resources.requests.storage） */
const getPvcStorageRequest = (manifest?: Manifest) =>
  getStringValue(
    getRecordValue(
      getRecordValue(getRecordValue(manifest?.spec)?.resources)?.requests,
    )?.storage,
  );

const getPvcStorageClassName = (manifest?: Manifest) =>
  getStringValue(getRecordValue(manifest?.spec)?.storageClassName);

/** 当前容量 → 表单的数值 + 单位；Mi / Gi / Ti 以外的写法向上取整到 Gi */
const getPvcStorageSize = (manifest?: Manifest): StorageSize => {
  const request = getPvcStorageRequest(manifest);
  const parsed = parseQuantity(request);
  if (parsed) {
    return parsed;
  }

  const bytes = parseStorageBytes(request);

  return {
    size: bytes ? Math.max(Math.ceil(bytes / UNIT_BYTES.Gi), 1) : 1,
    unit: 'Gi',
  };
};

/** 新容量不能小于当前容量；通过返回 undefined，否则返回提示语 */
const getPvcSizeError = (
  manifest: Manifest | undefined,
  quantity: string,
): string | undefined => {
  const next = parseStorageBytes(quantity);
  if (next === undefined || next <= 0) {
    return '请输入容量';
  }

  const request = getPvcStorageRequest(manifest);
  const current = parseStorageBytes(request);

  return current !== undefined && next < current
    ? `容量不能小于当前容量 ${request}`
    : undefined;
};

const formatPvcQuantity = (size: number, unit: StorageUnit) =>
  formatQuantity(size, unit);

/**
 * 扩容：在加载对象的深拷贝上只改 spec.resources.requests.storage。
 * 新容量小于当前容量时抛错；与当前容量相等时保持原写法（对象不变）。
 */
const applyPvcExpand = (manifest: Manifest, quantity: string): Manifest => {
  const error = getPvcSizeError(manifest, quantity);
  if (error) {
    throw new Error(error);
  }

  const next = cloneManifest(manifest);
  const request = getPvcStorageRequest(manifest);

  if (
    request !== undefined &&
    parseStorageBytes(request) === parseStorageBytes(quantity)
  ) {
    return next;
  }

  const spec = getRecordValue(next.spec) || {};
  const resources = getRecordValue(spec.resources) || {};
  const requests = getRecordValue(resources.requests) || {};

  requests.storage = quantity;
  resources.requests = requests;
  spec.resources = resources;
  next.spec = spec;

  return next;
};

/**
 * 克隆：以当前声明为数据源生成一个新的声明（同命名空间）。存储类、访问模式、卷模式等规格保持一致；
 * 不带绑定关系（volumeName、选择器）、运行状态、对象身份（uid 等）以及绑定 / 供给过程写入的注解。
 */
const buildPvcCloneManifest = (
  manifest: Manifest,
  name: string,
  quantity: string,
): Manifest => {
  const error = getPvcSizeError(manifest, quantity);
  if (error) {
    throw new Error(error);
  }

  const source = cloneManifest(manifest);
  const sourceMetadata = getRecordValue(source.metadata) || {};
  const labels = getRecordValue(sourceMetadata.labels);
  const annotations = Object.fromEntries(
    Object.entries(getRecordValue(sourceMetadata.annotations) || {}).filter(
      ([key]) =>
        !BIND_ANNOTATION_PATTERN.test(key) && key !== LAST_APPLIED_ANNOTATION,
    ),
  );
  const spec = { ...(getRecordValue(source.spec) || {}) };
  const resources = { ...(getRecordValue(spec.resources) || {}) };

  delete spec.volumeName;
  delete spec.selector;
  delete spec.dataSourceRef;
  spec.resources = {
    ...resources,
    requests: {
      ...(getRecordValue(resources.requests) || {}),
      storage: quantity,
    },
  };
  spec.dataSource = {
    kind: 'PersistentVolumeClaim',
    name: getStringValue(sourceMetadata.name),
  };

  return {
    apiVersion: getStringValue(source.apiVersion) || 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name,
      ...(getStringValue(sourceMetadata.namespace)
        ? { namespace: sourceMetadata.namespace }
        : {}),
      ...(labels && Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    spec,
  };
};

export type { StorageSize };
export {
  applyPvcExpand,
  buildPvcCloneManifest,
  formatPvcQuantity,
  getPvcSizeError,
  getPvcStorageClassName,
  getPvcStorageRequest,
  getPvcStorageSize,
  parseStorageBytes,
};
