import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type {
  RequestConfig,
  RunTimeLayoutConfig,
  RuntimeAntdConfig,
  RuntimeReactQueryType,
} from '@umijs/max';
import { history, Link } from '@umijs/max';
import { Button, Result, theme } from 'antd';
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
import { getSystemConfig } from '@/services/system/config';
import { authRequest } from '@/services/system/request';
import type {
  SystemConfig,
  SystemRole,
  SystemUser,
} from '@/services/system/typings';
import { clearTokens } from '@/utils/auth';
import { MessageHolder } from '@/utils/feedback';
import { t } from '@/utils/i18n';
import defaultSettings from '../config/defaultSettings';
import Exception403 from './pages/exception/403';
import { errorConfig } from './requestErrorConfig';

const loginPath = '/user/login';
/** 免登录的公共页面前缀（如公共值班日历）：不拉取登录态、不跳转登录页 */
const publicPathPrefix = '/public/';
const isAnonymousPath = (pathname: string) =>
  pathname === loginPath || pathname.startsWith(publicPathPrefix);

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
  /** 登录态拉取遇到暂时性故障（网络 / 5xx）：不是未登录，展示可重试的错误页 */
  profileError?: boolean;
  fetchUserInfo?: () => Promise<LoginProfile | undefined>;
  settingDrawerOpen?: boolean;
}> {
  let profileError = false;
  const fetchUserInfo = async () => {
    try {
      // 失败由这里自行处理（下方 history.replace 跳登录 / 重试页）：不弹提示，
      // 也不让 authRequest 再整页跳转一次
      return await authRequest<LoginProfile>('/api/v1/me', {
        method: 'GET',
        silent: true,
        redirectOnInvalid: false,
      });
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      // 仅 4xx（未登录 / 令牌失效 / 账号停用）回登录页；网络错误与 5xx 是暂时性
      // 故障，令牌仍可能有效——留在当前页给出重试，而不是把用户踢去登录
      if (status !== undefined && status >= 400 && status < 500) {
        clearTokens();
        const { pathname, search, hash } = history.location;
        history.replace(
          `${loginPath}?redirect=${encodeURIComponent(pathname + search + hash)}`,
        );
      } else {
        profileError = true;
      }
    }
    return undefined;
  };
  // 全局展示配置（标题/logo/页脚）：登录与否都拉取（登录页登录前
  // 也要显示标题/logo）；接口匿名可读，失败时静默回退构建期默认值。
  // 子标题仅登录页展示：不注入 settings（ProLayout 会向各页面页头
  // 下发 subTitle），登录页直接读 systemConfig.subTitle
  // 登录态（非登录页 / 公共页才拉）与展示配置互不依赖，并行请求缩短首屏等待
  const anonymous = isAnonymousPath(history.location.pathname);
  const [systemConfig, profile] = await Promise.all([
    getSystemConfig()
      .then((res) => res.config)
      .catch(() => null),
    anonymous ? undefined : fetchUserInfo(),
  ]);
  const settings = {
    ...defaultSettings,
    ...(systemConfig?.title ? { title: systemConfig.title } : {}),
    ...(systemConfig?.logo ? { logo: systemConfig.logo } : {}),
  } as Partial<LayoutSettings>;
  // 浏览器标签页标题：登录页由 Helmet 设置，主布局由 ProLayout 的
  // useDocumentTitle 设为「页面名 - 系统标题」，无需在此直接赋值
  if (!anonymous) {
    return {
      fetchUserInfo,
      currentUser: profile?.user,
      roles: profile?.roles,
      menus: profile?.menus ?? [],
      elements: profile?.elements ?? [],
      bizScope: profile?.bizScope ?? [],
      bizUnrestricted: profile?.bizUnrestricted,
      profileError,
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

/** 登录信息加载失败（暂时性故障）：保留令牌，给出重新加载入口 */
const ProfileLoadFailed: React.FC = () => (
  <Result
    status="warning"
    title={t('app.profile.loadFailed')}
    extra={
      <Button type="primary" onClick={() => window.location.reload()}>
        {t('app.profile.retry')}
      </Button>
    }
  />
);

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
      src: initialState?.currentUser?.avatar || undefined,
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
      // 如果没有登录，重定向到 login（暂时性故障除外：见 profileError）
      if (
        !initialState?.currentUser &&
        !initialState?.profileError &&
        !isAnonymousPath(location.pathname)
      ) {
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
    // 登录信息加载失败时没有权限数据，带 access 的路由会被判为无权限：
    // 此时展示可重试的错误页，而不是误导性的 403
    unAccessible: initialState?.profileError ? (
      <ProfileLoadFailed />
    ) : (
      <Exception403 />
    ),
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      if (initialState?.profileError) return <ProfileLoadFailed />;
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

/**
 * @name antd 运行时配置
 * 浅色主题的边框比 antd 默认略深一档（#d9d9d9 → #d0d0d0、#f0f0f0 → #e8e8e8）。
 * 写成算法而非固定 token：暗色主题下 ProLayout 会在其后追加 darkAlgorithm
 * 重新推导边框色，固定 token 则会把浅色边框带进暗色主题。
 */
export const antd: RuntimeAntdConfig = (memo) => {
  memo.theme ??= {};
  memo.theme.algorithm = (seed) => ({
    ...theme.defaultAlgorithm(seed),
    colorBorder: '#d0d0d0',
    colorBorderDisabled: '#d0d0d0',
    colorBorderSecondary: '#e8e8e8',
  });
  return memo;
};

/**
 * @name react-query 的全局默认值
 * 框架用它创建 QueryClient。关闭失败自动重试：请求失败时请求层已经提示过用户，
 * 重试只会把同一个提示重复弹几次；确实需要重试的查询在各自的 useQuery 里单独打开。
 */
export const reactQuery: RuntimeReactQueryType = {
  queryClient: {
    defaultOptions: { queries: { retry: false } },
  },
};

/** 在 antd 插件的 <App> 之内（本文件的运行时先于插件套用，故在其内层）：挂上请求层用的提示实例 */
export function innerProvider(container: React.ReactNode) {
  return (
    <>
      <MessageHolder />
      {container}
    </>
  );
}

export function rootContainer(container: React.ReactNode) {
  return (
    <>
      <OfflineBanner />
      <ErrorBoundary>{container}</ErrorBoundary>
    </>
  );
}
