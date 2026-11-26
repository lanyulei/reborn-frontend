/**
 * 文档编辑器实时预览的 Markdown 插件。
 * 预览链路（@uiw/react-markdown-preview）默认启用 rehype-raw：正文里的原始 HTML 会被解析成真实节点，
 * 其中的 <script> 在浏览器里会执行，<iframe> / <style> 也会原样渲染，而这条链路上没有净化插件。
 * 这里在语法树阶段把 HTML 节点换成普通文本：预览按原样显示这行标签。
 * 阅读页用的是带 DOMPurify 的 XMarkdown，文档里的 HTML 照常经过净化再渲染，不受这里影响。
 */
import type MDEditor from '@uiw/react-md-editor';
import type { ComponentProps } from 'react';

type PreviewOptions = NonNullable<
  ComponentProps<typeof MDEditor>['previewOptions']
>;

/** Markdown 语法树节点的最小结构（只用到这几个字段） */
type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
};

/** 这些容器里只能放块级节点：独占一行的 HTML 包成一个段落；其余位置（段落、标题、表格单元…）直接当行内文本 */
const BLOCK_PARENTS = new Set([
  'root',
  'blockquote',
  'listItem',
  'footnoteDefinition',
]);

const toTextNodes = (parent: MarkdownNode, html: MarkdownNode) => {
  const text: MarkdownNode = { type: 'text', value: html.value ?? '' };
  return BLOCK_PARENTS.has(parent.type)
    ? [{ type: 'paragraph', children: [text] }]
    : [text];
};

/** 把正文里的原始 HTML 变成普通文本（见文件头） */
export const showHtmlAsText = () => (tree: MarkdownNode) => {
  const walk = (node: MarkdownNode) => {
    if (!node.children) {
      return;
    }
    node.children = node.children.flatMap((child) =>
      child.type === 'html' ? toTextNodes(node, child) : [child],
    );
    node.children.forEach(walk);
  };
  walk(tree);
};

/** 传给编辑器的 previewOptions：模块级常量，引用稳定，父组件重渲染时编辑器不会因此重建预览 */
export const EDITOR_PREVIEW_OPTIONS: PreviewOptions = {
  remarkPlugins: [showHtmlAsText],
};
