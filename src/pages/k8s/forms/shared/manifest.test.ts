import { describe, expect, it } from 'vitest';
import {
  createId,
  createKeyValueItem,
  getArrayValue,
  getRecordValue,
  getStringValue,
  hasKeyValueContent,
  NAME_PATTERN,
  PORT_NAME_PATTERN,
  toRecord,
  trimValue,
} from './manifest';

describe('k8s forms shared manifest helpers', () => {
  it('getRecordValue returns plain objects only', () => {
    const object = { a: 1 };
    expect(getRecordValue(object)).toBe(object);
    expect(getRecordValue([1])).toBeUndefined();
    expect(getRecordValue('text')).toBeUndefined();
    // 假值按原实现原样短路返回（调用方只做真值判断）
    expect(getRecordValue(null)).toBeFalsy();
    expect(getRecordValue(undefined)).toBeFalsy();
  });

  it('getStringValue / getArrayValue narrow unknown values', () => {
    expect(getStringValue('a')).toBe('a');
    expect(getStringValue('')).toBe('');
    expect(getStringValue(1)).toBeUndefined();
    expect(getArrayValue([1, 2])).toEqual([1, 2]);
    expect(getArrayValue({ length: 1 })).toEqual([]);
    expect(getArrayValue(undefined)).toEqual([]);
  });

  it('trimValue trims and maps empty to empty string', () => {
    expect(trimValue('  a b  ')).toBe('a b');
    expect(trimValue('   ')).toBe('');
    expect(trimValue(undefined)).toBe('');
  });

  it.each([
    ['web', true],
    ['web-1', true],
    ['0a', true],
    ['a', true],
    ['', false],
    ['Web', false],
    ['-web', false],
    ['web-', false],
    ['web_1', false],
    ['web.1', false],
  ])('NAME_PATTERN / PORT_NAME_PATTERN accept %j → %s', (name, valid) => {
    expect(NAME_PATTERN.test(name)).toBe(valid);
    expect(PORT_NAME_PATTERN.test(name)).toBe(valid);
  });

  it('createId is unique enough for list keys', () => {
    expect(createId()).not.toBe(createId());
  });

  it('createKeyValueItem fills defaults and keeps given values untouched', () => {
    expect(createKeyValueItem()).toMatchObject({ keyName: '', value: '' });
    const item = createKeyValueItem(' app ', ' web ');
    expect(item).toMatchObject({ keyName: ' app ', value: ' web ' });
    expect(item.id).toBeTruthy();
  });

  it('hasKeyValueContent ignores rows without a key', () => {
    expect(hasKeyValueContent(undefined)).toBe(false);
    expect(hasKeyValueContent([])).toBe(false);
    expect(hasKeyValueContent([{ keyName: '  ' }, {}])).toBe(false);
    expect(hasKeyValueContent([{ keyName: '' }, { keyName: ' app ' }])).toBe(
      true,
    );
  });

  it('toRecord trims keys and values, drops empty keys, last duplicate wins', () => {
    expect(toRecord(undefined)).toEqual({});
    expect(
      toRecord([
        { id: '1', keyName: ' app ', value: ' web ' },
        { id: '2', keyName: '   ', value: 'dropped' },
        { id: '3', keyName: 'tier', value: '' },
        { id: '4', keyName: 'app', value: 'api' },
      ]),
    ).toEqual({ app: 'api', tier: '' });
  });
});
