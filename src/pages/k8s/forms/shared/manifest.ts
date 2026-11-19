/**
 * 资源表单与详情共用的纯函数（不依赖 React 与请求层，可单独测试）：
 * 从清单里安全取值、名称校验规则、键值对编辑项与清单字段（labels / annotations 等）的互转。
 * 各表单的 helpers.ts 原先各写一份，这里是唯一的实现——规则只改一处。
 */
import type { KeyValueEditorItem } from './KeyValueEditor';

/** 是普通对象（非数组、非 null）则原样返回，否则 undefined */
export const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

export const getArrayValue = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

/** 去首尾空白；空值返回空串 */
export const trimValue = (value?: string) => value?.trim() || '';

/** 资源名称（DNS 标签的字符集：小写字母、数字、中划线，字母数字开头结尾） */
export const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

/** 端口名称：字符集同资源名称 */
export const PORT_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

/** 表单列表行的本地标识（只用作 React key，不进清单） */
export const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createKeyValueItem = (
  keyName = '',
  value = '',
): KeyValueEditorItem => ({
  id: createId(),
  keyName,
  value,
});

/** 键值对列表里有没有填了键的行 */
export const hasKeyValueContent = (items?: { keyName?: string }[]) =>
  (items || []).some((item) => item.keyName?.trim());

/** 键值对列表 → 清单里的 map：键、值去首尾空白，键为空的行丢弃，重复键后者覆盖前者 */
export const toRecord = (items?: KeyValueEditorItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = (item.keyName || '').trim();
    if (keyName) {
      record[keyName] = (item.value || '').trim();
    }
    return record;
  }, {});
