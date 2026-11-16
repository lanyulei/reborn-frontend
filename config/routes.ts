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
    // CMDB：资源模型（元数据）与资源管理；详情页隐藏于菜单
    path: '/cmdb',
    name: 'cmdb',
    icon: 'database',
    access: 'canCmdb',
    routes: [
      {
        // 按权限落到第一个可访问的子页（见 src/pages/cmdb/index.tsx）
        path: '/cmdb',
        component: './cmdb',
        hideInMenu: true,
      },
      {
        // 全局搜索：默认落地；独立页面，跨模型检索资源（关键字进 URL ?q=）
        path: '/cmdb/search',
        name: 'search',
        component: './cmdb/search',
        access: 'canCmdbCI',
      },
      {
        path: '/cmdb/ci',
        name: 'ci',
        component: './cmdb/ci',
        access: 'canCmdbCI',
      },
      {
        path: '/cmdb/ci/:id',
        name: 'ci-detail',
        hideInMenu: true,
        component: './cmdb/ci/detail',
        access: 'canCmdbCI',
      },
      {
        path: '/cmdb/model',
        name: 'model',
        component: './cmdb/model',
        access: 'canCmdbModel',
      },
      {
        path: '/cmdb/model/:code',
        name: 'model-detail',
        hideInMenu: true,
        component: './cmdb/model/detail',
        access: 'canCmdbModel',
      },
      {
        path: '/cmdb/topology',
        name: 'topology',
        component: './cmdb/topology',
        access: 'canCmdbModel',
      },
      {
        path: '/cmdb/sync',
        name: 'sync',
        component: './cmdb/sync',
        access: 'canCmdbSync',
      },
      {
        path: '/cmdb/audit',
        name: 'audit',
        component: './cmdb/audit',
        access: 'canCmdbAudit',
      },
      {
        // 运营统计：概览接口按数据范围统计，读权限即可见
        path: '/cmdb/stats',
        name: 'stats',
        component: './cmdb/stats',
        access: 'canCmdbStats',
      },
    ],
  },
  {
    // 流程中心（管理端）：流程设计、流程监控、流程配置；设计器与流程详情页隐藏于菜单。
    // 个人待办在工单系统的工单列表里处理
    path: '/workflow',
    name: 'workflow',
    icon: 'apartment',
    access: 'canWorkflow',
    routes: [
      {
        // 按权限落到第一个可访问的子页（见 src/pages/workflow/index.tsx）
        path: '/workflow',
        component: './workflow',
        hideInMenu: true,
      },
      {
        path: '/workflow/definition',
        name: 'definition',
        component: './workflow/definition',
        access: 'canWorkflowDefinition',
      },
      {
        path: '/workflow/definition/:id',
        name: 'definition-design',
        hideInMenu: true,
        component: './workflow/definition/design',
        access: 'canWorkflowDefinition',
      },
      {
        path: '/workflow/instance',
        name: 'instance',
        component: './workflow/instance',
        access: 'canWorkflowInstance',
      },
      {
        // 流程详情（查看 / 处理）；不进菜单，可直接用链接打开
        path: '/workflow/instance/:id',
        name: 'instance-detail',
        hideInMenu: true,
        component: './workflow/instance/detail',
        access: 'canWorkflow',
      },
      {
        // 流程配置：工作日历、自动任务可调用的 Webhook 端点
        path: '/workflow/config',
        name: 'config',
        component: './workflow/config',
        access: 'canWorkflowConfig',
      },
    ],
  },
  {
    // 工单：提交工单（模板卡片）、工单列表（待办 / 已办 / 我提交的）、全部工单（管理视图）、工单统计、工单模板（分类与模板）
    path: '/ticket',
    name: 'ticket',
    icon: 'solution',
    access: 'canTicket',
    routes: [
      {
        // 按权限落到第一个可访问的子页（见 src/pages/ticket/index.tsx）
        path: '/ticket',
        component: './ticket',
        hideInMenu: true,
      },
      {
        path: '/ticket/create',
        name: 'create',
        component: './ticket/create',
        access: 'canTicketCreate',
      },
      {
        // 填写并提交某张模板的工单；不进菜单
        path: '/ticket/create/:templateId',
        name: 'create-form',
        hideInMenu: true,
        component: './ticket/create/form',
        access: 'canTicketCreate',
      },
      {
        // 工单详情（查看 / 处理）；不进菜单，可直接用链接打开
        path: '/ticket/detail/:id',
        name: 'detail',
        hideInMenu: true,
        component: './ticket/detail',
        access: 'canTicket',
      },
      {
        path: '/ticket/mine',
        name: 'mine',
        component: './ticket/mine',
        access: 'canTicketMine',
      },
      {
        path: '/ticket/all',
        name: 'all',
        component: './ticket/all',
        access: 'canTicketAll',
      },
      {
        path: '/ticket/stats',
        name: 'stats',
        component: './ticket/stats',
        access: 'canTicketStats',
      },
      {
        path: '/ticket/catalog',
        name: 'catalog',
        component: './ticket/catalog',
        access: 'canTicketCatalog',
      },
    ],
  },
  {
    // 值班管理：值班日历 / 值班分组；分组详情与值班表配置隐藏于菜单
    path: '/oncall',
    name: 'oncall',
    icon: 'schedule',
    access: 'canOncall',
    routes: [
      {
        // 按权限落到第一个可访问的子页（见 src/pages/oncall/index.tsx）
        path: '/oncall',
        component: './oncall',
        hideInMenu: true,
      },
      {
        path: '/oncall/calendar',
        name: 'calendar',
        component: './oncall/calendar',
        access: 'canOncallCalendar',
      },
      {
        path: '/oncall/group',
        name: 'group',
        component: './oncall/group',
        access: 'canOncallGroup',
      },
      {
        path: '/oncall/group/:id',
        name: 'group-detail',
        hideInMenu: true,
        component: './oncall/group/detail',
        access: 'canOncallGroup',
      },
    ],
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
    // 智能助手整页：与右下角悬浮弹窗同一 ChatPanel；置于系统管理之上
    path: '/assistant',
    name: 'assistant',
    icon: 'robot',
    component: './assistant',
    access: 'canAssistant',
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
        // 部门管理：组织架构树（负责人可多人）；用户所属部门在用户管理中维护
        path: '/system/dept',
        name: 'dept',
        component: './system/dept',
        access: 'canSystemDept',
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
    // 公共值班日历：免登录只读（令牌即凭据），不走主布局与登录态
    path: '/public/oncall/:token',
    layout: false,
    component: './public/oncall',
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
