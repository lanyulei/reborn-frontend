/** 作业中心域的展示格式化：时间、时长、参数值。 */
import dayjs from 'dayjs';
import type { JobTarget } from '@/services/job/typings';
import type { Translate } from '@/utils/i18n';

export { formatTime } from '@/utils/format';

/** 秒数 → 最多两段的可读时长（1 小时 5 分钟 / 3 分钟 20 秒） */
export const formatDuration = (seconds: number, t: Translate): string => {
  const total = Math.max(0, Math.floor(seconds) || 0);
  const parts: [number, string][] = [
    [Math.floor(total / 86400), 'pages.job.duration.day'],
    [Math.floor((total % 86400) / 3600), 'pages.job.duration.hour'],
    [Math.floor((total % 3600) / 60), 'pages.job.duration.minute'],
    [total % 60, 'pages.job.duration.second'],
  ];
  const first = parts.findIndex(([n]) => n > 0);
  if (first < 0) return t('pages.job.duration.second', { n: 0 });
  return parts
    .slice(first, first + 2)
    .filter(([n]) => n > 0)
    .map(([n, id]) => t(id, { n }))
    .join(' ');
};

/** 起止时间之间的秒数；end 为空取 now（进行中的时长）。start 为空返回 undefined */
export const secondsBetween = (
  start: string | undefined,
  end: string | undefined,
  now: number,
): number | undefined => {
  if (!start) return undefined;
  const from = dayjs(start).valueOf();
  const to = end ? dayjs(end).valueOf() : now;
  return Math.max(0, Math.round((to - from) / 1000));
};

/** 「多久之前」：不足 5 秒显示「刚刚」 */
export const formatAgo = (
  value: string | undefined,
  now: number,
  t: Translate,
): string => {
  const seconds = secondsBetween(value, undefined, now);
  if (seconds === undefined) return '';
  if (seconds < 5) return t('pages.job.ago.now');
  return t('pages.job.ago', { text: formatDuration(seconds, t) });
};

/** 参数取值 → 展示文本：字符串原样，其余按 JSON */
export const formatParamValue = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value : JSON.stringify(value);
};

/** Git 提交号的短形式 */
export const shortCommit = (commitId?: string): string =>
  (commitId ?? '').slice(0, 8);

/** 目标主机的一行概括：「主机 · 指定 12 台」/「主机 · 按条件 env=prod」 */
export const targetSummary = (
  target: JobTarget | undefined,
  modelName: string | undefined,
  t: Translate,
): string => {
  if (!target) return t('common.empty');
  const model = modelName || target.modelCode;
  if (target.mode === 1) {
    return t('pages.job.template.target.ids', {
      model,
      n: target.ciIds?.length ?? 0,
    });
  }
  const filters = [
    target.env && `env=${target.env}`,
    target.tag && `tag=${target.tag}`,
    target.keyword &&
      t('pages.job.template.target.keyword', { keyword: target.keyword }),
  ].filter(Boolean);
  return filters.length > 0
    ? t('pages.job.template.target.filter', {
        model,
        filters: filters.join(' '),
      })
    : t('pages.job.template.target.all', { model });
};

/** 内容的 UTF-8 字节数（后端按字节限长） */
export const byteLength = (text?: string): number =>
  new TextEncoder().encode(text ?? '').length;
