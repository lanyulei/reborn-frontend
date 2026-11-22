/**
 * 知识检索：POST /api/v1/knowledge/search（全文 + 向量混合）与检索反馈。
 */
import { authRequest } from '@/services/system/request';
import type { KnowledgeSearchResult } from './typings';

export interface SearchParams {
  query: string;
  spaceIds?: string[];
  tags?: string[];
  /** 1-20，缺省 5 */
  topK?: number;
}

/** Search 检索知识库 */
export async function searchKnowledge(
  body: SearchParams,
): Promise<KnowledgeSearchResult> {
  return authRequest('/api/v1/knowledge/search', { method: 'POST', data: body });
}

/** SubmitSearchFeedback 对检索结果反馈有用 / 没用 */
export async function submitSearchFeedback(
  logId: string,
  helpful: boolean,
): Promise<void> {
  await authRequest<void>(`/api/v1/knowledge/search-log/${logId}:feedback`, {
    method: 'POST',
    data: { helpful },
  });
}

/**
 * 片段解析：后端返回的 snippet 以 <mark>…</mark> 标注命中词，其余字符已 HTML 转义。
 * 拆成 { text, marked } 片段数组供 React 渲染（不用 dangerouslySetInnerHTML）。
 */
export const parseSnippet = (
  snippet?: string,
): { text: string; marked: boolean }[] => {
  if (!snippet) return [];
  return snippet
    .split(/(<mark>[\s\S]*?<\/mark>)/)
    .filter((part) => part !== '')
    .map((part) => {
      const m = /^<mark>([\s\S]*?)<\/mark>$/.exec(part);
      return m
        ? { text: unescapeHtml(m[1]), marked: true }
        : { text: unescapeHtml(part), marked: false };
    });
};

/** 还原 Go html.EscapeString 的五个实体 */
const unescapeHtml = (s: string): string =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#34;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
