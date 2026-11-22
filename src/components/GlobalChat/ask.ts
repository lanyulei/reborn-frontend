/**
 * 从任意页面把一个问题交给智能助手：打开全局助手弹窗并把问题填进输入框（由用户确认后发送）。
 * 可附带页内上下文（如正在查看的知识文档）：助手为其新开会话，发送时随消息带上 context。
 * 用浏览器事件解耦：页面不需要拿到助手组件的引用；没有助手权限时入口不存在，事件无人接收。
 */
import type { ChatContext } from '@/services/assistant/typings';

const EVENT = 'reborn:assistant-ask';

export interface AskDetail {
  text: string;
  context?: ChatContext;
}

export const askAssistant = (question: string, context?: ChatContext): void => {
  window.dispatchEvent(
    new CustomEvent<AskDetail>(EVENT, { detail: { text: question, context } }),
  );
};

export const onAskAssistant = (
  handler: (detail: AskDetail) => void,
): (() => void) => {
  const listener = (e: Event) => handler((e as CustomEvent<AskDetail>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
