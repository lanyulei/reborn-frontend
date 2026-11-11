/**
 * 语言包一致性：三套语言的键集必须完全相同且无空文案，
 * 保证切换语言时不会出现裸键名（useT 的 zh-CN 兜底只是最后防线）。
 */
import { describe, expect, it } from 'vitest';
import enUS from './en-US';
import zhCN from './zh-CN';
import zhTW from './zh-TW';

const keysOf = (messages: Record<string, string>) =>
  Object.keys(messages).sort();

describe('locales', () => {
  const base = keysOf(zhCN);

  it.each([
    ['en-US', enUS],
    ['zh-TW', zhTW],
  ])('%s has the same key set as zh-CN', (_name, messages) => {
    expect(keysOf(messages)).toEqual(base);
  });

  it('has no empty message', () => {
    for (const messages of [zhCN, enUS, zhTW]) {
      for (const [key, value] of Object.entries(messages)) {
        expect(value, key).not.toBe('');
      }
    }
  });
});
