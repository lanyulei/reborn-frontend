import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import type { MenuProps } from 'antd';
import { App, Spin } from 'antd';
import React, { startTransition } from 'react';
import { logout } from '@/services/system/auth';
import { clearTokens } from '@/utils/auth';
import HeaderDropdown from '../HeaderDropdown';

type GlobalHeaderRightProps = {
  children?: React.ReactNode;
};

const menuItems: MenuProps['items'] = [
  {
    key: 'settings',
    icon: <UserOutlined />,
    label: '个人设置',
  },
  { type: 'divider' },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: '退出登录',
  },
];

const loginOut = async () => {
  try {
    // 吊销服务端刷新令牌；失败不阻塞本地登出
    await logout();
  } catch {
    // ignore
  }
  clearTokens();
  const { search, pathname } = window.location;
  const urlParams = new URL(window.location.href).searchParams;
  const searchParams = new URLSearchParams({
    redirect: pathname + search,
  });
  const redirect = urlParams.get('redirect');
  if (window.location.pathname !== '/user/login' && !redirect) {
    history.replace({
      pathname: '/user/login',
      search: searchParams.toString(),
    });
  }
};

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  children,
}) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { modal } = App.useApp();

  const onMenuClick: MenuProps['onClick'] = (event) => {
    const { key } = event;
    if (key === 'settings') {
      history.push('/account/settings');
      return;
    }
    if (key === 'logout') {
      // 二次确认后再退出，避免误触
      modal.confirm({
        title: '退出登录',
        content: '确定要退出当前登录吗？',
        onOk: async () => {
          startTransition(() => {
            setInitialState((s) => ({ ...s, currentUser: undefined }));
          });
          await loginOut();
        },
      });
    }
  };

  if (!initialState) {
    return <Spin size="small" />;
  }

  const { currentUser } = initialState;

  if (!currentUser) {
    return <Spin size="small" />;
  }

  return (
    <HeaderDropdown
      placement="bottomRight"
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
      arrow
    >
      {children}
    </HeaderDropdown>
  );
};
