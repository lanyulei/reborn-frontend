export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/home',
    name: 'home',
    icon: 'home',
    component: './Home',
  },
  {
    path: '/account',
    name: 'account',
    hideInMenu: true,
    routes: [
      {
        path: '/account',
        redirect: '/account/settings',
      },
      {
        path: '/account/settings',
        name: 'settings',
        component: './account/settings',
      },
    ],
  },
  {
    path: '/system',
    name: 'system',
    icon: 'setting',
    routes: [
      {
        path: '/system/user',
        name: 'user',
        component: './system/user',
        access: 'canSystemUser',
      },
      {
        path: '/system/role',
        name: 'role',
        component: './system/role',
        access: 'canSystemRole',
      },
      {
        path: '/system/role/:id/permission',
        hideInMenu: true,
        component: './system/role/permission',
        access: 'canSystemRole',
      },
      {
        // 系统配置：全局配置（标题/子标题/logo/页脚），置于菜单最下
        path: '/system/config',
        name: 'config',
        component: './system/config',
        access: 'canSystemConfig',
      },
    ],
  },
  {
    path: '/',
    redirect: '/home',
  },
  {
    component: './exception/404',
    layout: false,
    path: './*',
  },
];
