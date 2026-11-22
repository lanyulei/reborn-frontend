/**
 * Kubernetes 数量的格式化与解析（纯函数，不依赖 React / antd）。
 * 从 helpers.ts 切出：通用工具，创建向导与编辑表单都可复用。
 */

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** CPU（核）→ 数量：整数核写成 "2"，小数写成毫核 "500m" */
export const formatCpuQuantity = (value?: number) => {
  if (!isFiniteNumber(value) || value < 0) {
    return undefined;
  }

  return Number.isInteger(value) ? `${value}` : `${Math.round(value * 1000)}m`;
};

/** 内存（Mi）→ 数量：整数写 Mi，带小数时降到 Ki / 字节表示，不四舍五入 */
export const formatMemoryQuantity = (value?: number) => {
  if (!isFiniteNumber(value) || value < 0) {
    return undefined;
  }
  if (Number.isInteger(value)) {
    return `${value}Mi`;
  }
  const kibibytes = value * 1024;
  return Number.isInteger(kibibytes)
    ? `${kibibytes}Ki`
    : `${Math.round(kibibytes * 1024)}`;
};

/** 数量后缀 → 倍数：十进制 SI（k/M/G/T/P/E = 1000^n）、二进制（Ki/Mi/… = 1024^n）、m/u/n */
const QUANTITY_SUFFIX_MULTIPLIERS: Record<string, number> = {
  n: 1e-9,
  u: 1e-6,
  m: 1e-3,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  Pi: 1024 ** 5,
  Ei: 1024 ** 6,
};

const QUANTITY_PATTERN =
  /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:([eE][+-]?\d+)|([numkKMGTPE]i?))?$/;

/**
 * Kubernetes 数量 → 基本单位的数值（字节 / 核）。支持纯数字、指数形式（1e9、1E3）、
 * 十进制 SI 与二进制后缀、毫核等小数后缀；无法识别返回 undefined。
 */
export const parseQuantity = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const matched = value.trim().match(QUANTITY_PATTERN);
  if (!matched) {
    return undefined;
  }
  const [, mantissa, exponent, suffix] = matched;
  const multiplier = suffix ? QUANTITY_SUFFIX_MULTIPLIERS[suffix] : 1;
  if (multiplier === undefined) {
    return undefined;
  }
  const result = Number(`${mantissa}${exponent ?? ''}`) * multiplier;
  return Number.isFinite(result) ? result : undefined;
};
