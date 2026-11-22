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
    // 容器平台：总览 / 集群列表 / 节点 / 命名空间 / 工作负载 / 网络 / 配置 / 存储 / 访问控制 / CRD /
    // 资源浏览器 / 应用 / 事件巡检 / 安全审计。每类资源一个菜单页，集群与命名空间的选择写在 URL 查询参数里。
    // 「事件巡检」「安全审计」是菜单分组：入口路由落到第一个有权限的页面，分组内的页面仍是平级路由
    // （URL 不变，hideInMenu + parentKeys 指回入口），页头用路由页签切换（见 src/components/RouteTabs）
    path: '/k8s',
    name: 'k8s',
    icon: 'cluster',
    access: 'canK8s',
    // 布局只承载终端面板的宿主：终端会话在各子页之间跳转时保持连接
    component: './k8s/layout',
    routes: [
      {
        // 按权限落到第一个可访问的子页（见 src/pages/k8s/index.tsx）
        path: '/k8s',
        hideInMenu: true,
        component: './k8s',
      },
      {
        // 总览：各集群健康、资源水位、异常工作负载、最近事件（数据来自落库的摘要）
        path: '/k8s/overview',
        name: 'overview',
        component: './k8s/overview',
        access: 'canK8sOverview',
      },
      {
        // 集群列表：接入 / 连通性 / Agent
        path: '/k8s/cluster',
        name: 'cluster',
        component: './k8s/cluster',
        access: 'canK8sCluster',
      },
      {
        path: '/k8s/node',
        name: 'node',
        component: './k8s/node',
        access: 'canK8sCluster',
      },
      {
        path: '/k8s/namespaces',
        name: 'namespaces',
        component: './k8s/namespaces',
        access: 'canK8sCluster',
      },
      {
        // 工作负载：Deployment·StatefulSet·DaemonSet / Job / CronJob / Pod / Service / Ingress / HPA
        path: '/k8s/workloads',
        name: 'workloads',
        access: 'canK8sWorkloads',
        routes: [
          {
            path: '/k8s/workloads',
            redirect: '/k8s/workloads/list',
          },
          {
            path: '/k8s/workloads/list',
            name: 'list',
            component: './k8s/workloads/list',
            access: 'canK8sWorkload',
          },
          {
            path: '/k8s/workloads/jobs',
            name: 'jobs',
            component: './k8s/workloads/jobs',
            access: 'canK8sWorkload',
          },
          {
            path: '/k8s/workloads/cron-jobs',
            name: 'cronJobs',
            component: './k8s/workloads/cron-jobs',
            access: 'canK8sWorkload',
          },
          {
            path: '/k8s/workloads/pods',
            name: 'pods',
            component: './k8s/workloads/pods',
            access: 'canK8sWorkload',
          },
          {
            path: '/k8s/workloads/services',
            name: 'services',
            component: './k8s/workloads/services',
            access: 'canK8sConfig',
          },
          {
            path: '/k8s/workloads/ingresses',
            name: 'ingresses',
            component: './k8s/workloads/ingresses',
            access: 'canK8sConfig',
          },
          {
            path: '/k8s/workloads/horizontal-pod-autoscalers',
            name: 'hpa',
            component: './k8s/workloads/horizontal-pod-autoscalers',
            access: 'canK8sResource',
          },
        ],
      },
      {
        // 网络：NetworkPolicy / IngressClass / EndpointSlice（增删改归资源浏览器的元素权限）
        path: '/k8s/network',
        name: 'network',
        access: 'canK8sResource',
        routes: [
          {
            path: '/k8s/network',
            redirect: '/k8s/network/network-policies',
          },
          {
            path: '/k8s/network/network-policies',
            name: 'networkPolicies',
            component: './k8s/network/network-policies',
            access: 'canK8sResource',
          },
          {
            path: '/k8s/network/ingress-classes',
            name: 'ingressClasses',
            component: './k8s/network/ingress-classes',
            access: 'canK8sResource',
          },
          {
            path: '/k8s/network/endpoint-slices',
            name: 'endpointSlices',
            component: './k8s/network/endpoint-slices',
            access: 'canK8sResource',
          },
        ],
      },
      {
        // 配置：Secret / ConfigMap / ServiceAccount
        path: '/k8s/config',
        name: 'config',
        access: 'canK8sConfigGroup',
        routes: [
          {
            // 入口：落到保密字典；旧链接 /k8s/config?tab=… 按页签跳到对应的新页面
            path: '/k8s/config',
            hideInMenu: true,
            component: './k8s/legacy',
          },
          {
            path: '/k8s/config/secrets',
            name: 'secrets',
            component: './k8s/config/secrets',
            access: 'canK8sConfig',
          },
          {
            path: '/k8s/config/config-maps',
            name: 'configMaps',
            component: './k8s/config/config-maps',
            access: 'canK8sConfig',
          },
          {
            path: '/k8s/config/service-accounts',
            name: 'serviceAccounts',
            component: './k8s/config/service-accounts',
            access: 'canK8sResource',
          },
        ],
      },
      {
        // 存储：PVC / PV / StorageClass
        path: '/k8s/storage',
        name: 'storage',
        access: 'canK8sConfig',
        routes: [
          {
            path: '/k8s/storage',
            redirect: '/k8s/storage/persistent-volume-claims',
          },
          {
            path: '/k8s/storage/persistent-volume-claims',
            name: 'pvc',
            component: './k8s/storage/persistent-volume-claims',
            access: 'canK8sConfig',
          },
          {
            path: '/k8s/storage/persistent-volumes',
            name: 'pv',
            component: './k8s/storage/persistent-volumes',
            access: 'canK8sConfig',
          },
          {
            path: '/k8s/storage/storage-classes',
            name: 'storageClasses',
            component: './k8s/storage/storage-classes',
            access: 'canK8sConfig',
          },
        ],
      },
      {
        // 访问控制：集群内的 Role / ClusterRole 与其绑定（平台自身的授权在「系统管理 / 角色」）
        path: '/k8s/access-control',
        name: 'accessControl',
        access: 'canK8sResource',
        routes: [
          {
            path: '/k8s/access-control',
            redirect: '/k8s/access-control/roles',
          },
          {
            path: '/k8s/access-control/roles',
            name: 'roles',
            component: './k8s/access-control/roles',
            access: 'canK8sResource',
          },
          {
            path: '/k8s/access-control/bindings',
            name: 'bindings',
            component: './k8s/access-control/bindings',
            access: 'canK8sResource',
          },
        ],
      },
      {
        path: '/k8s/custom-resource-definitions',
        name: 'crd',
        component: './k8s/custom-resource-definitions',
        access: 'canK8sResource',
      },
      {
        // 资源浏览器：集群的全部资源类型（含 CRD 的实例）
        path: '/k8s/resource',
        name: 'resource',
        component: './k8s/resource',
        access: 'canK8sResource',
      },
      {
        // 应用：Helm Release 与 Helm 仓库
        path: '/k8s/app',
        name: 'app',
        component: './k8s/app',
        access: 'canK8sApp',
      },
      {
        // 资源详情（整页）：任意资源类型共用；能否看到具体对象由集群按数据范围判定
        path: '/k8s/detail/:group/:version/:resource/:namespace/:name',
        name: 'detail',
        hideInMenu: true,
        component: './k8s/detail',
      },
      {
        // 旧地址兼容：原「工作负载」「网络与配置」页签容器，按 ?tab= 跳到对应的新页面
        path: '/k8s/workload',
        hideInMenu: true,
        component: './k8s/legacy',
      },
      {
        // 事件巡检：事件 / 巡检
        path: '/k8s/ops',
        name: 'ops',
        component: './k8s/group',
        access: 'canK8sOps',
      },
      {
        // 事件：跨集群的 Warning 事件检索
        path: '/k8s/event',
        name: 'event',
        hideInMenu: true,
        parentKeys: ['/k8s/ops'],
        component: './k8s/event',
        access: 'canK8sEvent',
      },
      {
        // 巡检：每个集群的定时 / 手动巡检记录与发现项
        path: '/k8s/inspection',
        name: 'inspection',
        hideInMenu: true,
        parentKeys: ['/k8s/ops'],
        component: './k8s/inspection',
        access: 'canK8sInspection',
      },
      {
        // 安全审计：变更单 / 访问凭证 / 操作审计（含终端会话页签）
        path: '/k8s/security',
        name: 'security',
        component: './k8s/group',
        access: 'canK8sSecurity',
      },
      {
        // 变更单：需审批的集群上的写操作与自助申请（命名空间 / 权限），经工单审批后由系统执行
        path: '/k8s/change',
        name: 'change',
        hideInMenu: true,
        parentKeys: ['/k8s/security'],
        component: './k8s/change',
        access: 'canK8sChange',
      },
      {
        // 访问凭证：限时 kubeconfig 的签发与吊销
        path: '/k8s/kubeconfig',
        name: 'kubeconfig',
        hideInMenu: true,
        parentKeys: ['/k8s/security'],
        component: './k8s/kubeconfig',
        access: 'canK8sKubeconfig',
      },
      {
        path: '/k8s/audit',
        name: 'audit',
        hideInMenu: true,
        parentKeys: ['/k8s/security'],
        component: './k8s/audit',
        access: 'canK8sAudit',
      },
    ],
  },
  {
    // 告警事件详情：通知里的「查看详情」指向这里。放在 /monitor 之外，不受 canMonitor 约束——事件的
    // 通知对象即使没有任何监控告警菜单也能打开（仍走主布局、仍需登录）；能否看到这一条由接口判定
    // （数据范围内，或是该事件的通知对象）。parentKeys 让有菜单的用户仍高亮「监控告警 / 告警事件」
    path: '/monitor/alert/:id',
    name: 'monitor.alert-detail',
    hideInMenu: true,
    parentKeys: ['/monitor', '/monitor/alert'],
    component: './monitor/alert/detail',
  },
  {
    // 监控告警：告警事件 / 告警规则 / 降噪规则 / 通知策略 / 指标数据 / 运行分析（后三个是菜单分组，
    // 做法同容器平台）；数据源管理是独立页面，放在菜单最下面
    path: '/monitor',
    name: 'monitor',
    icon: 'alert',
    access: 'canMonitor',
    routes: [
      {
        // 按权限落到第一个可访问的子页（见 src/pages/monitor/index.tsx）
        path: '/monitor',
        hideInMenu: true,
        component: './monitor',
      },
      {
        path: '/monitor/alert',
        name: 'alert',
        component: './monitor/alert',
        access: 'canMonitorAlert',
      },
      {
        path: '/monitor/rule',
        name: 'rule',
        component: './monitor/rule',
        access: 'canMonitorRule',
      },
      {
        // 降噪规则：屏蔽规则 / 抑制规则两个页签（Tab 容器，直达 /monitor/mute 落到第一个页签）
        path: '/monitor/mute',
        name: 'mute',
        component: './monitor/mute',
        access: 'canMonitorMute',
        routes: [
          {
            path: '/monitor/mute/silence',
            name: 'silence',
            hideInMenu: true,
            component: './monitor/mute/list',
            access: 'canMonitorMute',
          },
          {
            path: '/monitor/mute/inhibit',
            name: 'inhibit',
            hideInMenu: true,
            component: './monitor/inhibit',
            access: 'canMonitorMute',
          },
        ],
      },
      {
        // 通知策略：告警订阅 / 升级策略
        path: '/monitor/notice',
        name: 'notice',
        component: './monitor/group',
        access: 'canMonitorNotice',
      },
      {
        path: '/monitor/subscription',
        name: 'subscription',
        hideInMenu: true,
        parentKeys: ['/monitor/notice'],
        component: './monitor/subscription',
        access: 'canMonitorSubscription',
      },
      {
        path: '/monitor/escalation',
        name: 'escalation',
        hideInMenu: true,
        parentKeys: ['/monitor/notice'],
        component: './monitor/escalation',
        access: 'canMonitorEscalation',
      },
      {
        // 指标数据：即时查询 / 记录规则
        path: '/monitor/metric',
        name: 'metric',
        component: './monitor/group',
        access: 'canMonitorMetric',
      },
      {
        path: '/monitor/explore',
        name: 'explore',
        hideInMenu: true,
        parentKeys: ['/monitor/metric'],
        component: './monitor/explore',
        access: 'canMonitorExplore',
      },
      {
        path: '/monitor/record',
        name: 'record',
        hideInMenu: true,
        parentKeys: ['/monitor/metric'],
        component: './monitor/record',
        access: 'canMonitorRecord',
      },
      {
        // 运行分析：告警统计 / 引擎状态
        path: '/monitor/insight',
        name: 'insight',
        component: './monitor/group',
        access: 'canMonitorInsight',
      },
      {
        path: '/monitor/stats',
        name: 'stats',
        hideInMenu: true,
        parentKeys: ['/monitor/insight'],
        component: './monitor/stats',
        access: 'canMonitorStats',
      },
      {
        path: '/monitor/engine',
        name: 'engine',
        hideInMenu: true,
        parentKeys: ['/monitor/insight'],
        component: './monitor/engine',
        access: 'canMonitorEngine',
      },
      {
        // 数据源管理：从「指标数据」分组拆出来的独立页面，固定放监控菜单最下面
        path: '/monitor/datasource',
        name: 'datasource',
        component: './monitor/datasource',
        access: 'canMonitorDatasource',
      },
    ],
  },
  {
    // 作业中心：快速执行 / 作业管理 / 定时触发 / 资源配置 / 安全策略 / 执行记录 / 执行统计
    // （作业管理 / 定时触发 / 资源配置是菜单分组，做法同容器平台）；执行详情隐藏于菜单
    path: '/job',
    name: 'job',
    icon: 'code',
    access: 'canJob',
    routes: [
      {
        // 按权限落到第一个可访问的子页（见 src/pages/job/index.tsx）
        path: '/job',
        hideInMenu: true,
        component: './job',
      },
      {
        path: '/job/adhoc',
        name: 'adhoc',
        component: './job/adhoc',
        access: 'canJobAdhoc',
      },
      {
        // 作业管理：作业模板 / 脚本库
        path: '/job/library',
        name: 'library',
        component: './job/group',
        access: 'canJobLibrary',
      },
      {
        path: '/job/template',
        name: 'template',
        hideInMenu: true,
        parentKeys: ['/job/library'],
        component: './job/template',
        access: 'canJobTemplate',
      },
      {
        path: '/job/script',
        name: 'script',
        hideInMenu: true,
        parentKeys: ['/job/library'],
        component: './job/script',
        access: 'canJobScript',
      },
      {
        // 定时触发：定时作业 / 触发器
        path: '/job/automation',
        name: 'automation',
        component: './job/group',
        access: 'canJobAutomation',
      },
      {
        path: '/job/schedule',
        name: 'schedule',
        hideInMenu: true,
        parentKeys: ['/job/automation'],
        component: './job/schedule',
        access: 'canJobSchedule',
      },
      {
        path: '/job/trigger',
        name: 'trigger',
        hideInMenu: true,
        parentKeys: ['/job/automation'],
        component: './job/trigger',
        access: 'canJobTrigger',
      },
      {
        // 资源配置：项目 / 凭据 / 执行节点
        path: '/job/resource',
        name: 'resource',
        component: './job/group',
        access: 'canJobResource',
      },
      {
        path: '/job/project',
        name: 'project',
        hideInMenu: true,
        parentKeys: ['/job/resource'],
        component: './job/project',
        access: 'canJobProject',
      },
      {
        path: '/job/credential',
        name: 'credential',
        hideInMenu: true,
        parentKeys: ['/job/resource'],
        component: './job/credential',
        access: 'canJobCredential',
      },
      {
        path: '/job/runner',
        name: 'runner',
        hideInMenu: true,
        parentKeys: ['/job/resource'],
        component: './job/runner',
        access: 'canJobRunner',
      },
      {
        path: '/job/policy',
        name: 'policy',
        component: './job/policy',
        access: 'canJobPolicy',
      },
      {
        // 执行记录：作业执行列表（原与执行统计同属「执行记录」分组的页签，现拆为独立页面）
        path: '/job/history',
        name: 'history',
        component: './job/execution',
        access: 'canJobExecution',
      },
      {
        // 旧地址兼容：原「执行记录」页签的路径，跳到拆分后的页面
        path: '/job/execution',
        redirect: '/job/history',
        // 旧链接带着筛选条件（?groupId= / ?triggerRef= / ?templateId=），跳转时原样带上
        keepQuery: true,
      },
      {
        // 提交执行后跳到这里。不单设 access：有任一作业中心菜单即可打开（沿用上级的 canJob），
        // 能看到什么由接口权限判定（「执行作业」按钮权限带有查看执行详情 / 主机 / 日志的接口）
        path: '/job/execution/:id',
        name: 'execution-detail',
        hideInMenu: true,
        parentKeys: ['/job/history'],
        component: './job/execution/detail',
      },
      {
        // 执行统计：从「执行记录」分组拆出的独立页面
        path: '/job/stats',
        name: 'stats',
        component: './job/stats',
        access: 'canJobStats',
      },
    ],
  },
  {
    // 故障管理：故障列表（活跃 / 我参与 / 全部 / 候选）、复盘看板、故障统计、故障配置（触发规则 / 预案 /
    // 业务字典 / 接入与 Webhook / 设置，页头页签切换）；详情页隐藏于菜单
    path: '/incident',
    name: 'incident',
    icon: 'fire',
    access: 'canIncident',
    routes: [
      {
        // 按权限落到第一个可访问的子页（见 src/pages/incident/index.tsx）
        path: '/incident',
        hideInMenu: true,
        component: './incident',
      },
      {
        path: '/incident/list',
        name: 'list',
        component: './incident/list',
        access: 'canIncidentList',
      },
      {
        // 故障详情：通知里的「查看详情」指向这里
        path: '/incident/detail/:id',
        name: 'detail',
        hideInMenu: true,
        parentKeys: ['/incident/list'],
        component: './incident/detail',
        access: 'canIncidentList',
      },
      {
        path: '/incident/review',
        name: 'review',
        component: './incident/review',
        access: 'canIncidentReview',
      },
      {
        path: '/incident/stats',
        name: 'stats',
        component: './incident/stats',
        access: 'canIncidentStats',
      },
      {
        // 故障配置分组入口：落到第一个有权限的页签
        path: '/incident/config',
        name: 'config',
        component: './incident/config',
        access: 'canIncidentConfig',
      },
      {
        path: '/incident/rule',
        name: 'rule',
        hideInMenu: true,
        parentKeys: ['/incident/config'],
        component: './incident/rule',
        access: 'canIncidentRule',
      },
      {
        path: '/incident/playbook',
        name: 'playbook',
        hideInMenu: true,
        parentKeys: ['/incident/config'],
        component: './incident/playbook',
        access: 'canIncidentPlaybook',
      },
      {
        path: '/incident/business',
        name: 'business',
        hideInMenu: true,
        parentKeys: ['/incident/config'],
        component: './incident/business',
        access: 'canIncidentBusiness',
      },
      {
        path: '/incident/source',
        name: 'source',
        hideInMenu: true,
        parentKeys: ['/incident/config'],
        component: './incident/source',
        access: 'canIncidentSource',
      },
      {
        path: '/incident/setting',
        name: 'setting',
        hideInMenu: true,
        parentKeys: ['/incident/config'],
        component: './incident/setting',
        access: 'canIncidentSetting',
      },
    ],
  },
  {
    // 运维 Agent：运行记录（任务 / 运行详情）、Profile 配置、统计；故障详情的「AI 诊断」页签复用这些接口
    path: '/agent',
    name: 'agent',
    icon: 'robot',
    access: 'canAgent',
    routes: [
      {
        path: '/agent',
        hideInMenu: true,
        component: './agent',
      },
      {
        path: '/agent/task',
        name: 'task',
        component: './agent/task',
        access: 'canAgentTask',
      },
      {
        path: '/agent/profile',
        name: 'profile',
        component: './agent/profile',
        access: 'canAgentProfile',
      },
      {
        path: '/agent/stats',
        name: 'stats',
        component: './agent/stats',
        access: 'canAgentStats',
      },
    ],
  },
  {
    // 知识库：首页（检索入口 + 概览）、检索结果、知识空间与文档、导入任务、管理；文档详情 / 编辑隐藏于菜单
    path: '/knowledge',
    name: 'knowledge',
    icon: 'book',
    access: 'canKnowledge',
    routes: [
      {
        path: '/knowledge',
        redirect: '/knowledge/home',
      },
      {
        path: '/knowledge/home',
        name: 'home',
        component: './knowledge',
        access: 'canKnowledge',
      },
      {
        path: '/knowledge/search',
        name: 'search',
        component: './knowledge/search',
        access: 'canKnowledge',
      },
      {
        path: '/knowledge/space',
        name: 'space',
        component: './knowledge/space',
        access: 'canKnowledge',
      },
      {
        path: '/knowledge/space/:id',
        name: 'space-detail',
        hideInMenu: true,
        component: './knowledge/space/detail',
        access: 'canKnowledge',
      },
      {
        path: '/knowledge/doc/new',
        name: 'doc-new',
        hideInMenu: true,
        component: './knowledge/doc/edit',
        access: 'canKnowledge',
      },
      {
        path: '/knowledge/doc/:id',
        name: 'doc',
        hideInMenu: true,
        component: './knowledge/doc/detail',
        access: 'canKnowledge',
      },
      {
        path: '/knowledge/doc/:id/edit',
        name: 'doc-edit',
        hideInMenu: true,
        component: './knowledge/doc/edit',
        access: 'canKnowledge',
      },
      {
        path: '/knowledge/ingest',
        name: 'ingest',
        component: './knowledge/ingest',
        access: 'canKnowledge',
      },
      {
        path: '/knowledge/admin',
        name: 'admin',
        component: './knowledge/admin',
        access: 'canKnowledgeAdmin',
      },
      {
        // 知识统计：全量计数 + 时间范围内的检索 / 反馈与知识缺口（数据来自 admin 接口）
        path: '/knowledge/stats',
        name: 'stats',
        component: './knowledge/stats',
        access: 'canKnowledgeAdmin',
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
    // 故障匿名状态页：凭分享令牌只读公告与状态（免登录、无主布局）
    path: '/public/incident/:token',
    layout: false,
    component: './public/incident',
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
