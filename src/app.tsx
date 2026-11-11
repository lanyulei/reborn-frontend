import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';

// Initialize dayjs plugins globally
dayjs.extend(relativeTime);

import {
  AvatarDropdown,
  ErrorBoundary,
  Footer,
  GlobalChat,
  LangDropdown,
  OfflineBanner,
} from '@/components';
import type { LoginProfile } from '@/services/system/auth';
import { getLoginProfile } from '@/services/system/auth';
import { getSystemConfig } from '@/services/system/config';
import type {
  SystemConfig,
  SystemRole,
  SystemUser,
} from '@/services/system/typings';
import defaultSettings from '../config/defaultSettings';
import Exception403 from './pages/exception/403';
import { errorConfig } from './requestErrorConfig';

const loginPath = '/user/login';

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  systemConfig?: SystemConfig | null;
  currentUser?: SystemUser;
  roles?: SystemRole[];
  menus?: string[];
  elements?: string[];
  /** 可管理的通知 biz 并集；bizUnrestricted=true 时为空 */
  bizScope?: string[];
  /** 通知 biz 不受限（超管或任一启用角色 scope 为空） */
  bizUnrestricted?: boolean;
  loading?: boolean;
  fetchUserInfo?: () => Promise<LoginProfile | undefined>;
  settingDrawerOpen?: boolean;
}> {
  const fetchUserInfo = async () => {
    try {
      return await getLoginProfile();
    } catch (_error) {
      const { pathname, search, hash } = history.location;
      history.replace(
        `${loginPath}?redirect=${encodeURIComponent(pathname + search + hash)}`,
      );
    }
    return undefined;
  };
  // 全局展示配置（标题/logo/页脚）：登录与否都拉取（登录页登录前
  // 也要显示标题/logo）；接口匿名可读，失败时静默回退构建期默认值。
  // 子标题仅登录页展示：不注入 settings（ProLayout 会向各页面页头
  // 下发 subTitle），登录页直接读 systemConfig.subTitle
  const systemConfig = await getSystemConfig()
    .then((res) => res.config)
    .catch(() => null);
  const settings = {
    ...defaultSettings,
    ...(systemConfig?.title ? { title: systemConfig.title } : {}),
    ...(systemConfig?.logo ? { logo: systemConfig.logo } : {}),
  } as Partial<LayoutSettings>;
  // 浏览器标签页标题：登录页由 Helmet 设置，主布局由 ProLayout 的
  // useDocumentTitle 设为「页面名 - 系统标题」，无需在此直接赋值
  // 如果不是登录页面，执行
  const { location } = history;
  if (location.pathname !== loginPath) {
    const profile = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser: profile?.user,
      roles: profile?.roles,
      menus: profile?.menus ?? [],
      elements: profile?.elements ?? [],
      bizScope: profile?.bizScope ?? [],
      bizUnrestricted: profile?.bizUnrestricted,
      settings,
      systemConfig,
      settingDrawerOpen: false,
    };
  }
  return {
    fetchUserInfo,
    settings,
    systemConfig,
    settingDrawerOpen: false,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    // 侧边菜单宽度：默认 256，调小 20% 后约 205
    siderWidth: 205,
    menuItemRender: (item, dom) => {
      if (item.path) {
        return (
          <Link to={item.path} prefetch>
            {dom}
          </Link>
        );
      }
      return dom;
    },
    actionsRender: () => {
      // `locale: false` opts out of the language switcher. ProLayout's own
      // `locale` prop is a locale string, so narrow to the boolean toggle here.
      const localeEnabled =
        (initialState?.settings as { locale?: boolean })?.locale !== false;
      return [
        <GlobalChat key="chat" />,
        localeEnabled && <LangDropdown key="lang" />,
      ].filter(Boolean);
    },
    avatarProps: {
      title:
        initialState?.currentUser?.nickname ||
        initialState?.currentUser?.username,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    // waterMarkProps: {
    //   content: initialState?.currentUser?.nickname,
    // },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.replace(
          `${loginPath}?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`,
        );
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    // Replace ProLayout's default ErrorBoundary with our offline-aware version,
    // so chunk load errors show friendly messages instead of "Something went wrong."
    ErrorBoundary,
    menuHeaderRender: undefined,
    // 路由 access 拒绝时的 403 兜底页
    unAccessible: <Exception403 />,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          <SettingDrawer
            disableUrlParams
            enableDarkTheme
            collapse={initialState?.settingDrawerOpen}
            onCollapseChange={(open) => {
              setInitialState((s) => ({
                ...s,
                settingDrawerOpen: open,
              }));
            }}
            settings={initialState?.settings}
            onSettingChange={(settings) => {
              setInitialState((s) => ({
                ...s,
                settings: {
                  ...settings,
                  // SettingDrawer 初始化时会从 settings 中删除 title（其
                  // 视为不可配置项），回填防止系统配置的标题在每次加载时丢失
                  ...(s?.settings?.title ? { title: s.settings.title } : {}),
                },
              }));
            }}
          />
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  // 同源部署：开发环境走 config/proxy.ts 代理到本地 Go 后端
  baseURL: '',
  ...errorConfig,
};

export function rootContainer(container: React.ReactNode) {
  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>{container}</ErrorBoundary>
    </>
  );
}
