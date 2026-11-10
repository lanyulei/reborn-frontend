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
    // 通知管理：按工作流聚合为 5 个入口——渠道 / 规则（路由|静默|模板）/ 订阅 /
    // 生产者 / 投递追踪（事件|任务|明细|死信）。Tab 容器为父路由组件，子路由
    // hideInMenu 且各自保留页面级 access；后端 10 个菜单权限码不变
    path: '/notify',
    name: 'notify',
    icon: 'bell',
    routes: [
      {
        path: '/notify/channel',
        name: 'channel',
        component: './notify/channel',
        access: 'canNotifyChannel',
      },
      {
        path: '/notify/rule',
        name: 'rule',
        component: './notify/rule',
        access: 'canNotifyRule',
        routes: [
          {
            path: '/notify/rule/route',
            name: 'route',
            hideInMenu: true,
            component: './notify/route',
            access: 'canNotifyRoute',
          },
          {
            path: '/notify/rule/silence',
            name: 'silence',
            hideInMenu: true,
            component: './notify/silence',
            access: 'canNotifySilence',
          },
          {
            path: '/notify/rule/template',
            name: 'template',
            hideInMenu: true,
            component: './notify/template',
            access: 'canNotifyTemplate',
          },
        ],
      },
      {
        path: '/notify/subscription',
        name: 'subscription',
        component: './notify/subscription',
        access: 'canNotifySubscription',
      },
      {
        path: '/notify/producer',
        name: 'producer',
        component: './notify/producer',
        access: 'canNotifyProducer',
      },
      {
        // 运行面排障检索（只读 + 死信重放），置于配置面之后
        path: '/notify/trace',
        name: 'trace',
        component: './notify/trace',
        access: 'canNotifyTrace',
        routes: [
          {
            path: '/notify/trace/event',
            name: 'event',
            hideInMenu: true,
            component: './notify/event',
            access: 'canNotifyEvent',
          },
          {
            path: '/notify/trace/dispatch',
            name: 'dispatch',
            hideInMenu: true,
            component: './notify/dispatch',
            access: 'canNotifyDispatch',
          },
          {
            path: '/notify/trace/delivery-log',
            name: 'delivery-log',
            hideInMenu: true,
            component: './notify/delivery-log',
            access: 'canNotifyDeliveryLog',
          },
          {
            path: '/notify/trace/dlq',
            name: 'dlq',
            hideInMenu: true,
            component: './notify/dlq',
            access: 'canNotifyDlq',
          },
        ],
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
        // 登录日志：审计查询（append-only 只读），置于角色管理之后
        path: '/system/login-log',
        name: 'login-log',
        component: './system/login-log',
        access: 'canSystemLoginLog',
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
