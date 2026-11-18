/**
 * 从任意页面把一个问题交给智能助手：打开全局助手弹窗并把问题填进输入框（由用户确认后发送）。
 * 用浏览器事件解耦：页面不需要拿到助手组件的引用；没有助手权限时入口不存在，事件无人接收。
 */
const EVENT = 'reborn:assistant-ask';

export const askAssistant = (question: string): void => {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: question }));
};

export const onAskAssistant = (
  handler: (question: string) => void,
): (() => void) => {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
