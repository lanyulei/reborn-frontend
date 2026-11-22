/**
 * 知识库引用标记 [kb:<文档ID>#<分块序号>]：助手回答与运维 Agent 的发现 / 证据里都会出现。
 * - linkCitations：替换成 Markdown 链接（Markdown 正文用）
 * - CitedText：把纯文本里的标记渲染成指向文档分块的链接（发现 / 时间线等纯文本处用）
 */
import { Link } from '@umijs/max';
import type React from 'react';
import { useT } from '@/utils/i18n';

export const CITATION_PATTERN = /\[kb:([0-9a-fA-F-]{36})#(\d+)\]/g;

export const citationHref = (id: string, n: string) =>
  `/knowledge/doc/${id}#chunk-${n}`;

export const linkCitations = (content: string, label: (n: string) => string) =>
  content.replace(
    CITATION_PATTERN,
    (_, id: string, n: string) => `[📎 ${label(n)}](${citationHref(id, n)})`,
  );

export const CitedText: React.FC<{ text: string }> = ({ text }) => {
  const t = useT();
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(CITATION_PATTERN)) {
    const [raw, id, n] = m;
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(
      <Link key={`${id}-${n}-${at}`} to={citationHref(id, n)}>
        📎 {t('component.chat.citation', { n })}
      </Link>,
    );
    last = at + raw.length;
  }
  if (parts.length === 0) return <>{text}</>;
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};
