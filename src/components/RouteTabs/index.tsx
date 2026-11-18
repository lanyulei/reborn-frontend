/**
 * 路由页签：把一个菜单分组下的几个平级页面在页头用 Tab 串起来。各页面的路由与 URL 不变
 * （hideInMenu + parentKeys 指回分组入口），页面用 RouteTabsPage 作外壳（自带 PageContainer 的
 * 外壳用 useRouteTabs）；分组入口路由用 RouteTabsLanding 落到第一个有权限的页签。
 * 按 useAccess 过滤无权限的页签；只剩一个可见页签时不显示页签栏。
 */
import { PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useLocation } from '@umijs/max';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import type access from '@/access';
import { useT } from '@/utils/i18n';

type AccessKey = keyof ReturnType<typeof access>;

export interface RouteTab {
  key: string;
  /** 页面路由路径 */
  path: string;
  /** 同一路由内再按 ?tab= 区分的页签 */
  tab?: string;
  /** 页签标题 i18n 键 */
  labelKey: string;
  /** 页面对应的路由级权限键 */
  accessKey: AccessKey;
}

const tabUrl = (tab: RouteTab, search = '') => {
  const params = new URLSearchParams(search);
  if (tab.tab) params.set('tab', tab.tab);
  const query = params.toString();
  return query ? `${tab.path}?${query}` : tab.path;
};

const useVisibleTabs = (tabs: RouteTab[]) => {
  const access = useAccess();
  return useMemo(
    () => tabs.filter((tab) => access[tab.accessKey]),
    [tabs, access],
  );
};

/**
 * 页头页签的三个属性，展开到 PageContainer 上。
 * @param keep 切换页签时带到目标页的查询参数（如容器平台的 cluster）
 */
export const useRouteTabs = (tabs: RouteTab[], keep: string[] = []) => {
  const t = useT();
  const { pathname, search } = useLocation();
  const visible = useVisibleTabs(tabs);
  const params = new URLSearchParams(search);
  const here = visible.filter((tab) => tab.path === pathname);
  const active =
    here.find((tab) => (tab.tab ?? null) === params.get('tab')) ?? here[0];

  return {
    tabList:
      visible.length > 1
        ? visible.map((tab) => ({ key: tab.key, tab: t(tab.labelKey) }))
        : undefined,
    tabActiveKey: active?.key,
    onTabChange: (key: string) => {
      const target = visible.find((tab) => tab.key === key);
      if (!target || target === active) return;
      const kept = new URLSearchParams();
      for (const name of keep) {
        const value = params.get(name);
        if (value) kept.set(name, value);
      }
      history.push(tabUrl(target, kept.toString()));
    },
  };
};

/** 分组内页面的外壳：无标题的 PageContainer + 路由页签 */
export const RouteTabsPage: React.FC<{
  tabs: RouteTab[];
  children: React.ReactNode;
}> = ({ tabs, children }) => (
  <PageContainer title={false} {...useRouteTabs(tabs)}>
    {children}
  </PageContainer>
);

/** 分组入口：跳到第一个有权限的页签 */
export const RouteTabsLanding: React.FC<{ tabs: RouteTab[] }> = ({ tabs }) => {
  const visible = useVisibleTabs(tabs);
  useEffect(() => {
    history.replace(visible.length ? tabUrl(visible[0]) : '/');
  }, [visible]);
  return null;
};
