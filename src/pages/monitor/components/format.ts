/** 监控告警域的展示格式化：时间、持续时长、指标值、标签过滤串。 */
import dayjs from 'dayjs';
import { DATE_TIME_SECONDS_FORMAT } from '@/utils/format';
import type { Translate } from '@/utils/i18n';

/** RFC3339 → 本地「年-月-日 时:分:秒」；空值返回空串 */
export const formatTime = (value?: string): string =>
  value ? dayjs(value).format(DATE_TIME_SECONDS_FORMAT) : '';

/** 秒数 → 最多两段的可读时长（3 天 4 小时 / 5 分钟 20 秒）；后端 int64 以字符串给出 */
export const formatDuration = (
  seconds: string | number | undefined,
  t: Translate,
): string => {
  const total = Math.max(0, Math.floor(Number(seconds ?? 0)) || 0);
  const parts: [number, string][] = [
    [Math.floor(total / 86400), 'pages.monitor.duration.day'],
    [Math.floor((total % 86400) / 3600), 'pages.monitor.duration.hour'],
    [Math.floor((total % 3600) / 60), 'pages.monitor.duration.minute'],
    [total % 60, 'pages.monitor.duration.second'],
  ];
  const first = parts.findIndex(([n]) => n > 0);
  if (first < 0) return t('pages.monitor.duration.second', { n: 0 });
  return parts
    .slice(first, first + 2)
    .filter(([n]) => n > 0)
    .map(([n, id]) => t(id, { n }))
    .join(' ');
};

/** 指标值：有限数保留至多 4 位小数；NaN / 正负无穷（后端以字符串给出）原样显示 */
export const formatValue = (value?: number | string): string => {
  if (value === undefined || value === null || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return String(Number(n.toFixed(4)));
};

/** 「name=value」多行 / 逗号分隔的输入 → 过滤项列表（忽略空白项） */
export const parseLabelFilters = (input?: string | string[]): string[] =>
  (Array.isArray(input) ? input : (input ?? '').split(/[\n,]/))
    .map((item) => item.trim())
    .filter(Boolean);

/** 标签集 → 排序后的 [name, value] 列表 */
export const labelEntries = (
  labels?: Record<string, string>,
): [string, string][] =>
  Object.entries(labels ?? {}).sort(([a], [b]) => a.localeCompare(b));

/** 序列标签 → PromQL 风格的一行文本：name{a="1", b="2"} */
export const seriesName = (labels?: Record<string, string>): string => {
  const { __name__: metric, ...rest } = labels ?? {};
  const body = labelEntries(rest)
    .map(([key, value]) => `${key}="${value}"`)
    .join(', ');
  return body ? `${metric ?? ''}{${body}}` : (metric ?? '{}');
};

/** 带数据源与表达式的即时查询地址（告警详情、判定记录跳转用） */
export const explorePath = (datasourceId?: string, expr?: string): string => {
  const search = new URLSearchParams();
  if (datasourceId) search.set('datasourceId', datasourceId);
  if (expr) search.set('expr', expr);
  const query = search.toString();
  return query ? `/monitor/explore?${query}` : '/monitor/explore';
};
