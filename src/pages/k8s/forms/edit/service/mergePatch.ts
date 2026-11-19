/**
 * 编辑表单把改动写回对象原文时用的纯函数（不依赖 React / antd）。
 *
 * 思路：表单值 → 清单片段的构造函数对「打开时的表单值」和「保存时的表单值」各算一次，
 * 两者的差异（diffPatch）才是用户真正改动的部分，再按合并补丁语义（applyMergePatch）写到对象副本上。
 * 这样没改过的字段——包括表单不建模的字段和表单会规整的值（默认值、首尾空白）——保持原样。
 */

export type PlainObject = Record<string, unknown>;

export const isRecord = (value: unknown): value is PlainObject =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const deepClone = <T>(value: T): T => structuredClone(value);

/** 深比较；值为 undefined 的键视同不存在 */
export const deepEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => deepEqual(item, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) {
    return false;
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (!deepEqual(left[key], right[key])) {
      return false;
    }
  }
  return true;
};

/**
 * 按合并补丁（RFC 7386）语义把 patch 就地写入 target：null 删除键，对象递归合并，数组和标量整体替换。
 * 与 RFC 的一点差别：只含删除的子补丁不会凭空创建空对象。
 */
export const applyMergePatch = (
  target: PlainObject,
  patch: PlainObject,
): PlainObject => {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue;
    }
    if (value === null) {
      delete target[key];
      continue;
    }
    if (!isRecord(value)) {
      target[key] = deepClone(value);
      continue;
    }
    const current = target[key];
    if (isRecord(current)) {
      applyMergePatch(current, value);
      continue;
    }
    const created = applyMergePatch({}, value);
    if (Object.keys(created).length > 0 || Object.keys(value).length === 0) {
      target[key] = created;
    }
  }
  return target;
};

/**
 * 把「base → next」的差异表示成合并补丁：只在 base 里的键 → null（删除），
 * 两边都是对象 → 递归，其余不相等的值取 next。两边相等的键不出现在结果里。
 */
export const diffPatch = (
  base: PlainObject,
  next: PlainObject,
): PlainObject => {
  const patch: PlainObject = {};

  for (const [key, value] of Object.entries(base)) {
    if (value !== undefined && value !== null && next[key] === undefined) {
      patch[key] = null;
    }
  }
  for (const [key, value] of Object.entries(next)) {
    const previous = base[key];
    if (value === undefined || deepEqual(previous, value)) {
      continue;
    }
    patch[key] =
      isRecord(previous) && isRecord(value)
        ? diffPatch(previous, value)
        : value;
  }

  return patch;
};

export type KeyValueRow = { id: string; keyName: string; value: string };

/**
 * 键值行（注解等）的改动 → 合并补丁。没动过的行保留原值（不裁剪首尾空白，
 * 例如以换行结尾的 last-applied-configuration）；改过或新增的行裁剪键和值；消失的键 → null。
 * 重复的键以后出现的为准。
 */
export const diffKeyValueRows = (
  initial: KeyValueRow[] = [],
  current: KeyValueRow[] = [],
): Record<string, string | null> => {
  const initialById = new Map(initial.map((row) => [row.id, row]));
  const previous: Record<string, string> = {};
  for (const row of initial) {
    if (row.keyName) {
      previous[row.keyName] = row.value;
    }
  }

  const next: Record<string, string> = {};
  for (const row of current) {
    if (!row) {
      continue;
    }
    const origin = initialById.get(row.id);
    if (
      origin?.keyName &&
      origin.keyName === row.keyName &&
      origin.value === row.value
    ) {
      next[row.keyName] = row.value;
      continue;
    }
    const keyName = (row.keyName || '').trim();
    if (keyName) {
      next[keyName] = (row.value || '').trim();
    }
  }

  const patch: Record<string, string | null> = {};
  for (const keyName of Object.keys(previous)) {
    if (!(keyName in next)) {
      patch[keyName] = null;
    }
  }
  for (const [keyName, value] of Object.entries(next)) {
    if (previous[keyName] !== value) {
      patch[keyName] = value;
    }
  }
  return patch;
};

/** 把注解补丁写到对象的 metadata.annotations；写完为空则去掉这个键 */
export const patchAnnotations = (
  object: PlainObject,
  patch: PlainObject,
): void => {
  if (Object.keys(patch).length === 0) {
    return;
  }
  const metadata = isRecord(object.metadata) ? object.metadata : {};
  applyMergePatch(metadata, { annotations: patch });
  if (
    isRecord(metadata.annotations) &&
    Object.keys(metadata.annotations).length === 0
  ) {
    delete metadata.annotations;
  }
  object.metadata = metadata;
};
