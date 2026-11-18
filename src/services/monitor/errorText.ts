/**
 * 引擎 / 数据源错误原文 → 当前语言的说明。
 *
 * 判定记录的 error、规则的 lastError、数据源的 healthError 没有 reason 码，是引擎写入的英文原文
 * （backend/monitor/internal/biz 的 evaluator.go / planner.go / cache.go 与 kit/promclient 的
 * Error.Error()）。这里按原文的固定格式识别：引擎自己的说明整句本地化；数据源返回的原始错误保持
 * 原文，只在前面加一句本地化的说明。识别不了的原文一律按「数据源返回」处理，不丢内容。
 *
 * 对原文格式的依赖只在本文件：后端改了措辞，最坏情况是退回「本地化前缀 + 原文」。
 */
import { t } from '@/utils/i18n';

/**
 * 「结果不完整」的契约字面量（backend/docs/monitor-foundation-notes.md「结果不完整（K5）」；
 * core biz.IncompletePrefix / biz.QueryPartialNote）：接口没有专门的字段，经已有的错误字段返回。
 */
const INCOMPLETE_PREFIX = 'incomplete result: ';
const QUERY_PARTIAL_NOTE =
  'incomplete result: partial response from the datasource';
/** 评估结果「查询错误」：此时的错误文字是真的出错，不是结果不完整 */
const EVAL_STATUS_ERROR = 4;

/**
 * 该轮评估的结果不完整（某条查询的序列被截断，或数据源只返回了部分结果）：查询是成功的，状态
 * 仍是评估结果，只是没返回的序列保持原状态。规则 / 任务的 lastError 与判定记录的 error 共用：
 * 错误文字以固定前缀开头，且状态不是「查询错误」。
 */
export const isIncompleteResult = (
  error?: string | null,
  status?: number | null,
): boolean =>
  status !== EVAL_STATUS_ERROR && !!error?.startsWith(INCOMPLETE_PREFIX);

/** 判定记录里某条查询是部分结果（数据源声明只返回了一部分；序列数照常有值） */
export const isPartialQuery = (error?: string | null): boolean =>
  error === QUERY_PARTIAL_NOTE;

/** promclient 的错误类别（Error.ErrorType）里由客户端自己判定的那些；其余是数据源返回的类别 */
const CLIENT_ERROR_TYPES = new Set([
  'bad_data',
  'timeout',
  'canceled',
  'network',
  'blocked',
  'redirect',
  'body_too_large',
  'bad_response',
  'http',
]);
/** 这些类别的说明是客户端的固定英文句子，本地化文案已说清，不再附原文 */
const NO_DETAIL_TYPES = new Set([
  'timeout',
  'canceled',
  'redirect',
  'body_too_large',
]);

/** 引擎的固定说明 → 文案键 */
const FIXED_TEXT: Record<string, string> = {
  'datasource busy: query was not started before the timeout':
    'pages.monitor.upstream.busy',
  'probe did not start before the timeout: datasource busy':
    'pages.monitor.upstream.busy',
  'datasource is disabled': 'pages.monitor.upstream.disabled',
  'datasource credential unavailable: master key missing or mismatched':
    'pages.monitor.upstream.credential',
  'rule has no valid queries': 'pages.monitor.upstream.noQueries',
};

const withDetail = (text: string, detail: string) =>
  detail ? t('pages.monitor.error.withDetail', { text, detail }) : text;

/** 引擎 / 数据源错误原文 → 当前语言的说明；空值返回空串 */
export const upstreamErrorText = (raw?: string | null): string => {
  const text = (raw ?? '').trim();
  if (!text) return '';
  // 前缀之后是引擎写的英文说明，只供展示、不解析：附在本地化说明之后
  if (text.startsWith(INCOMPLETE_PREFIX)) {
    return withDetail(
      t('pages.monitor.upstream.incomplete'),
      text.slice(INCOMPLETE_PREFIX.length),
    );
  }
  if (FIXED_TEXT[text]) return t(FIXED_TEXT[text]);

  // 「query 0: …」：第几条查询出的错（下标从 0 起，界面上从 1 起）
  const query = /^query (\d+): ([\s\S]+)$/.exec(text);
  if (query) {
    return withDetail(
      t('pages.monitor.upstream.query', { n: Number(query[1]) + 1 }),
      upstreamErrorText(query[2]),
    );
  }
  const severity = /^rule query (\d+) has an invalid severity$/.exec(text);
  if (severity) {
    return t('pages.monitor.upstream.invalidSeverity', {
      n: Number(severity[1]) + 1,
    });
  }
  const vector = /^query must return an instant vector, got a (.+)$/.exec(text);
  if (vector) {
    return t('pages.monitor.upstream.notVector', { type: vector[1] });
  }
  const config = /^datasource config invalid: ([\s\S]+)$/.exec(text);
  if (config) {
    return withDetail(t('pages.monitor.upstream.configInvalid'), config[1]);
  }

  // 引擎写的是「promclient: <类别> (http <状态码>): <说明>」；core 的测试连接是「<类别>: <说明>」
  const client =
    /^(?:promclient: )?([^:()\s]+)(?: \(http (\d+)\))?: ([\s\S]*)$/.exec(text);
  if (client) {
    const [, type, status, message] = client;
    if (!CLIENT_ERROR_TYPES.has(type)) {
      // 数据源自己返回的错误类别（如 execution），或别的带冒号的原文：原样保留
      return t('pages.monitor.upstream.raw', {
        detail: text.replace(/^promclient: /, ''),
      });
    }
    const label = t(`pages.monitor.upstream.type.${type}`);
    return withDetail(
      status ? t('pages.monitor.upstream.http', { text: label, status }) : label,
      NO_DETAIL_TYPES.has(type) ? '' : message,
    );
  }
  return t('pages.monitor.upstream.raw', { detail: text });
};
