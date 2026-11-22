import dayjs from 'dayjs';

const numberFormatter = new Intl.NumberFormat('en-US');

/**
 * Format a number with thousand separators.
 * Replaces numeral(val).format('0,0')
 */
export const formatNumber = (val: number | string): string => {
  const parsed = Number(val);
  return Number.isFinite(parsed) ? numberFormatter.format(parsed) : '';
};

/**
 * Format a number as yuan currency string.
 * Replaces `¥ ${numeral(val).format('0,0')}`
 */
export const formatYuan = (val: number | string) => `¥ ${formatNumber(val)}`;

const BYTE_UNITS = ['KB', 'MB', 'GB', 'TB'] as const;

/** 字节数 → 可读大小（B / KB / MB / GB / TB）；后端的 int64 以字符串给出。不是正数返回空串 */
export const formatBytes = (size?: string | number): string => {
  const n = Number(size ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  let value = n / 1024;
  let unit: (typeof BYTE_UNITS)[number] = BYTE_UNITS[0];
  for (const next of BYTE_UNITS.slice(1)) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  return `${value.toFixed(1)} ${unit}`;
};

/** 精确到秒的日期时间展示格式（dayjs） */
export const DATE_TIME_SECONDS_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** RFC3339 → 本地「年-月-日 时:分:秒」；空值或无法解析的值返回空串 */
export const formatTime = (value?: string): string => {
  if (!value) return '';
  const time = dayjs(value);
  return time.isValid() ? time.format(DATE_TIME_SECONDS_FORMAT) : '';
};
