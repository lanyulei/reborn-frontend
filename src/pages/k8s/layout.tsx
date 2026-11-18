/**
 * /k8s 路由的布局：只承载终端面板的宿主。放在路由层而不是各菜单页里，终端会话才能在
 * 切换集群 / 命名空间、在容器平台各菜单间跳转时保持连接。
 */
import { Outlet } from '@umijs/max';
import type React from 'react';
import { TerminalProvider } from './components/Terminal';

const K8sLayout: React.FC = () => (
  <TerminalProvider>
    <Outlet />
  </TerminalProvider>
);

export default K8sLayout;
