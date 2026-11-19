/**
 * @see https://umijs.org/docs/max/access#access
 * 菜单/路由级权限：菜单码由 /api/v1/me 的 menus 下发（启用角色并集），
 * isAdmin 用户直接放行全部菜单；权限码目录见 services/system/permissions.ts。
 * */
import type { MenuPermissionCode } from '@/services/system/permissions';
import type { SystemUser } from '@/services/system/typings';

export default function access(
  initialState:
    | {
        currentUser?: SystemUser;
        menus?: string[];
        elements?: string[];
      }
    | undefined,
) {
  const { currentUser, menus, elements } = initialState ?? {};
  const isAdmin = currentUser?.isAdmin === true;
  const has = (code: MenuPermissionCode) =>
    isAdmin || (menus ?? []).includes(code);
  // cmdb 运营统计：实例或审计任一权限即可见（复用现有权限码，不新增）
  const canCmdbStats = has('cmdb.ci') || has('cmdb.audit');
  // 通知模块 Tab 容器页：任一子页可见即可进入容器（Tab 级再按子页权限过滤）
  const canNotifyRule =
    has('notify.route') || has('notify.silence') || has('notify.template');
  const canNotifyTrace =
    has('notify.event') ||
    has('notify.dispatch') ||
    has('notify.delivery_log') ||
    has('notify.dlq');
  return {
    canAdmin: isAdmin,
    canAssistant: has('assistant'),
    canCmdbModel: has('cmdb.model'),
    canCmdbCI: has('cmdb.ci'),
    canCmdbSync: has('cmdb.sync'),
    canCmdbAudit: has('cmdb.audit'),
    canCmdbStats,
    canCmdb:
      has('cmdb.model') ||
      has('cmdb.ci') ||
      has('cmdb.sync') ||
      has('cmdb.audit'),
    canWorkflowDefinition: has('workflow.definition'),
    canWorkflowInstance: has('workflow.instance'),
    canWorkflowConfig: has('workflow.config'),
    canWorkflow:
      has('workflow.definition') ||
      has('workflow.instance') ||
      has('workflow.config'),
    canTicketMine: has('ticket.mine'),
    // 提交工单页与工单列表里的「提交工单」按钮同一权限（元素码，不新增菜单码）
    canTicketCreate: isAdmin || (elements ?? []).includes('ticket.mine.create'),
    canTicketAll: has('ticket.all'),
    canTicketCatalog: has('ticket.catalog'),
    canTicketStats: has('ticket.stats'),
    canTicket:
      has('ticket.mine') ||
      has('ticket.all') ||
      has('ticket.stats') ||
      has('ticket.catalog'),
    canSystemUser: has('system.user'),
    canSystemDept: has('system.dept'),
    canSystemRole: has('system.role'),
    canSystemLoginLog: has('system.login_log'),
    canSystemConfig: has('system.config'),
    canNotifyChannel: has('notify.channel'),
    canNotifyTemplate: has('notify.template'),
    canNotifyRoute: has('notify.route'),
    canNotifySilence: has('notify.silence'),
    canNotifySubscription: has('notify.subscription'),
    canNotifyProducer: has('notify.producer'),
    canNotifyEvent: has('notify.event'),
    canNotifyDispatch: has('notify.dispatch'),
    canNotifyDeliveryLog: has('notify.delivery_log'),
    canNotifyDlq: has('notify.dlq'),
    canNotifyRule,
    canNotifyTrace,
    canOncallCalendar: has('oncall.calendar'),
    canOncallGroup: has('oncall.group'),
    canOncall: has('oncall.calendar') || has('oncall.group'),
    canMonitorAlert: has('monitor.alert'),
    canMonitorRule: has('monitor.rule'),
    canMonitorMute: has('monitor.mute'),
    canMonitorSubscription: has('monitor.subscription'),
    canMonitorEscalation: has('monitor.escalation'),
    canMonitorRecord: has('monitor.record'),
    canMonitorDatasource: has('monitor.datasource'),
    canMonitorExplore: has('monitor.explore'),
    canMonitorStats: has('monitor.stats'),
    canMonitorEngine: has('monitor.engine'),
    // 菜单分组入口：分组内任一页面可见即可进入（页签再按各页权限过滤）
    canMonitorNotice: has('monitor.subscription') || has('monitor.escalation'),
    canMonitorMetric: has('monitor.explore') || has('monitor.record'),
    canMonitorInsight: has('monitor.stats') || has('monitor.engine'),
    canMonitor:
      has('monitor.alert') ||
      has('monitor.rule') ||
      has('monitor.mute') ||
      has('monitor.subscription') ||
      has('monitor.escalation') ||
      has('monitor.record') ||
      has('monitor.datasource') ||
      has('monitor.explore') ||
      has('monitor.stats') ||
      has('monitor.engine'),
    canJobTemplate: has('job.template'),
    canJobExecution: has('job.execution'),
    canJobProject: has('job.project'),
    canJobCredential: has('job.credential'),
    canJobRunner: has('job.runner'),
    canJobAdhoc: has('job.adhoc'),
    canJobScript: has('job.script'),
    canJobSchedule: has('job.schedule'),
    canJobTrigger: has('job.trigger'),
    canJobPolicy: has('job.policy'),
    canJobStats: has('job.stats'),
    canJobLibrary: has('job.template') || has('job.script'),
    canJobAutomation: has('job.schedule') || has('job.trigger'),
    canJobResource:
      has('job.project') || has('job.credential') || has('job.runner'),
    canJob:
      has('job.template') ||
      has('job.execution') ||
      has('job.project') ||
      has('job.credential') ||
      has('job.runner') ||
      has('job.adhoc') ||
      has('job.script') ||
      has('job.schedule') ||
      has('job.trigger') ||
      has('job.policy') ||
      has('job.stats'),
    canK8sCluster: has('k8s.cluster'),
    canK8sWorkload: has('k8s.workload'),
    canK8sConfig: has('k8s.config'),
    canK8sResource: has('k8s.resource'),
    canK8sApp: has('k8s.app'),
    canK8sAudit: has('k8s.audit'),
    canK8sChange: has('k8s.change'),
    canK8sOverview: has('k8s.overview'),
    canK8sEvent: has('k8s.event'),
    canK8sInspection: has('k8s.inspection'),
    canK8sKubeconfig: has('k8s.kubeconfig'),
    // 菜单分组的可见性：组内任一页面可见即显示
    canK8sWorkloads:
      has('k8s.workload') || has('k8s.config') || has('k8s.resource'),
    canK8sConfigGroup: has('k8s.config') || has('k8s.resource'),
    canK8sOps: has('k8s.event') || has('k8s.inspection'),
    canK8sSecurity:
      has('k8s.change') || has('k8s.kubeconfig') || has('k8s.audit'),
    canK8s:
      has('k8s.cluster') ||
      has('k8s.workload') ||
      has('k8s.config') ||
      has('k8s.resource') ||
      has('k8s.app') ||
      has('k8s.overview') ||
      has('k8s.event') ||
      has('k8s.inspection') ||
      has('k8s.kubeconfig') ||
      has('k8s.change') ||
      has('k8s.audit'),
  };
}
