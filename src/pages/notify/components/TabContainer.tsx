/**
 * 通知模块 Tab 容器：父路由组件，子路由（hideInMenu）作为页头 Tab 切换，
 * Tab 即路由——URL 可深链、可刷新；按 useAccess 过滤无权限 Tab；
 * 直达基路径时跳转到首个有权限的 Tab。子页面不再自带 PageContainer，
 * 内容区内边距由本容器提供。
 */
import { PageContainer } from '@ant-design/pro-components';
import { history, Outlet, useAccess, useIntl, useLocation } from '@umijs/max';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import type access from '@/access';

type AccessKey = keyof ReturnType<typeof access>;

export interface TabItem {
  key: string;
  /** 子路由完整路径 */
  path: string;
  /** Tab 标题 i18n 键（复用菜单词条） */
  labelKey: string;
  /** 子页面对应的路由级权限键 */
  accessKey: AccessKey;
}

export const TabContainer: React.FC<{
  /** 父路由路径；直达该路径时跳首个可见 Tab */
  basePath: string;
  tabs: TabItem[];
}> = ({ basePath, tabs }) => {
  const access = useAccess();
  const intl = useIntl();
  const { pathname } = useLocation();

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => access[tab.accessKey]),
    [tabs, access],
  );
  const activeTab = visibleTabs.find(
    (tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`),
  );

  // 仅在基路径落地时重定向；直达无权限子路由交由路由级 access 渲染 403
  useEffect(() => {
    const atBase = pathname === basePath || pathname === `${basePath}/`;
    if (atBase && visibleTabs.length) history.replace(visibleTabs[0].path);
  }, [pathname, basePath, visibleTabs]);

  return (
    <PageContainer
      title={false}
      tabList={visibleTabs.map((tab) => ({
        key: tab.key,
        tab: intl.formatMessage({ id: tab.labelKey }),
      }))}
      tabActiveKey={activeTab?.key}
      onTabChange={(key) => {
        const target = visibleTabs.find((tab) => tab.key === key);
        if (target) history.push(target.path);
      }}
    >
      <Outlet />
    </PageContainer>
  );
};
