/**
 * 命中片段：后端以 <mark> 标注命中词、其余已转义；拆成 React 节点渲染（不用 dangerouslySetInnerHTML）。
 */
import type React from 'react';
import { parseSnippet } from '@/services/knowledge/search';

export const Snippet: React.FC<{ text?: string; className?: string }> = ({
  text,
  className,
}) => {
  const parts = parseSnippet(text);
  if (parts.length === 0) return null;
  return (
    <div className={className}>
      {parts.map((part, i) =>
        part.marked ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: 片段只读、顺序固定
          <mark key={i}>{part.text}</mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: 片段只读、顺序固定
          <span key={i}>{part.text}</span>
        ),
      )}
    </div>
  );
};
