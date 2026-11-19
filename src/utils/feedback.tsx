/**
 * React 之外（请求层）用的全局提示。实例取自 antd 的 <App>，跟随主题与 ConfigProvider——
 * 静态的 `message.error` 读不到这些上下文。
 */
import { App } from 'antd';
import type React from 'react';
import { useEffect } from 'react';

type MessageApi = ReturnType<typeof App.useApp>['message'];

let api: MessageApi | undefined;
/** <App> 挂载前（首屏的初始化请求）发出的提示：先记下，挂载后补发 */
const pending: string[] = [];

export const message = {
  error(content: string) {
    if (api) api.error(content);
    else pending.push(content);
  },
};

/** 挂在 <App> 之内（见 src/app.tsx 的 innerProvider），把提示实例交给上面的 message */
export const MessageHolder: React.FC = () => {
  const { message: instance } = App.useApp();
  useEffect(() => {
    api = instance;
    for (const content of pending.splice(0)) instance.error(content);
  }, [instance]);
  return null;
};
