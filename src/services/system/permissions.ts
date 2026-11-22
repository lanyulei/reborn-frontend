/**
 * 权限目录（前端镜像）：菜单/路由级 + 页面元素级
 * 与后端 backend/core/internal/biz/system/catalog.go 的目录保持同步，新增菜单或元素两处同改。
 * 用途：角色权限页授权树数据源；元素码经 /api/v1/me 的 elements 下发，
 * 页面元素显隐用 usePermissions() 判定。
 */
import { useModel } from '@umijs/max';
import { useCallback } from 'react';

/** 菜单权限码：与后端目录常量一一对应 */
export type MenuPermissionCode =
  | 'assistant'
  | 'knowledge'
  | 'knowledge.admin'
  | 'agent.task'
  | 'agent.profile'
  | 'agent.stats'
  | 'incident.list'
  | 'incident.review'
  | 'incident.stats'
  | 'incident.rule'
  | 'incident.playbook'
  | 'incident.business'
  | 'incident.source'
  | 'incident.setting'
  | 'cmdb.model'
  | 'cmdb.ci'
  | 'cmdb.sync'
  | 'cmdb.audit'
  | 'oncall.calendar'
  | 'oncall.group'
  | 'monitor.alert'
  | 'monitor.rule'
  | 'monitor.mute'
  | 'monitor.subscription'
  | 'monitor.escalation'
  | 'monitor.record'
  | 'monitor.datasource'
  | 'monitor.explore'
  | 'monitor.stats'
  | 'monitor.engine'
  | 'job.template'
  | 'job.execution'
  | 'job.project'
  | 'job.credential'
  | 'job.runner'
  | 'job.adhoc'
  | 'job.script'
  | 'job.schedule'
  | 'job.trigger'
  | 'job.policy'
  | 'job.stats'
  | 'k8s.cluster'
  | 'k8s.workload'
  | 'k8s.config'
  | 'k8s.resource'
  | 'k8s.app'
  | 'k8s.audit'
  | 'k8s.change'
  | 'k8s.overview'
  | 'k8s.event'
  | 'k8s.inspection'
  | 'k8s.kubeconfig'
  | 'workflow.definition'
  | 'workflow.instance'
  | 'workflow.config'
  | 'ticket.mine'
  | 'ticket.all'
  | 'ticket.stats'
  | 'ticket.catalog'
  | 'system.user'
  | 'system.dept'
  | 'system.role'
  | 'system.login_log'
  | 'system.config'
  | 'notify.channel'
  | 'notify.template'
  | 'notify.route'
  | 'notify.silence'
  | 'notify.subscription'
  | 'notify.producer'
  | 'notify.event'
  | 'notify.dispatch'
  | 'notify.delivery_log'
  | 'notify.dlq';

/** 元素权限码：页面内具体操作（按钮/接口级） */
export type ElementPermissionCode =
  | 'knowledge.write'
  | 'knowledge.review'
  | 'knowledge.archive'
  | 'knowledge.delete'
  | 'knowledge.space'
  | 'knowledge.admin.rebuild'
  | 'incident.list.create'
  | 'incident.list.handle'
  | 'incident.list.proposal'
  | 'incident.list.update'
  | 'incident.list.share'
  | 'incident.list.postmortem'
  | 'incident.list.agent'
  | 'incident.list.diagnose'
  | 'agent.task.run'
  | 'agent.task.rate'
  | 'agent.profile.create'
  | 'agent.profile.update'
  | 'agent.profile.delete'
  | 'agent.profile.test'
  | 'incident.rule.create'
  | 'incident.rule.update'
  | 'incident.rule.delete'
  | 'incident.rule.test'
  | 'incident.playbook.create'
  | 'incident.playbook.update'
  | 'incident.playbook.delete'
  | 'incident.business.create'
  | 'incident.business.update'
  | 'incident.business.delete'
  | 'incident.source.manage'
  | 'incident.source.reset'
  | 'incident.source.delete'
  | 'incident.source.webhook'
  | 'incident.setting.update'
  | 'system.user.create'
  | 'system.user.machine'
  | 'system.user.edit'
  | 'system.user.delete'
  | 'system.user.status'
  | 'system.user.reset_password'
  | 'system.user.bind_role'
  | 'workflow.definition.create'
  | 'workflow.definition.edit'
  | 'workflow.definition.publish'
  | 'workflow.definition.delete'
  | 'workflow.instance.terminate'
  | 'workflow.instance.reassign'
  | 'workflow.instance.wait'
  | 'workflow.instance.handover'
  | 'workflow.config.calendar'
  | 'workflow.config.webhook'
  | 'workflow.config.client'
  | 'ticket.mine.create'
  | 'ticket.catalog.category'
  | 'ticket.catalog.template'
  | 'system.dept.create'
  | 'system.dept.edit'
  | 'system.dept.member'
  | 'system.dept.delete'
  | 'system.role.create'
  | 'system.role.edit'
  | 'system.role.delete'
  | 'system.role.grant'
  | 'system.config.edit'
  | 'notify.channel.create'
  | 'notify.channel.edit'
  | 'notify.channel.delete'
  | 'notify.channel.test'
  | 'notify.template.create'
  | 'notify.template.edit'
  | 'notify.template.delete'
  | 'notify.route.create'
  | 'notify.route.edit'
  | 'notify.route.delete'
  | 'notify.silence.create'
  | 'notify.silence.edit'
  | 'notify.silence.delete'
  | 'notify.subscription.upsert'
  | 'notify.subscription.delete'
  | 'notify.producer.create'
  | 'notify.producer.edit'
  | 'notify.producer.rotate'
  | 'notify.producer.delete'
  | 'notify.dlq.replay'
  | 'cmdb.model.create'
  | 'cmdb.model.edit'
  | 'cmdb.model.delete'
  | 'cmdb.model.field'
  | 'cmdb.model.relation_type'
  | 'cmdb.model.view'
  | 'cmdb.model.scope'
  | 'cmdb.ci.create'
  | 'cmdb.ci.edit'
  | 'cmdb.ci.transition'
  | 'cmdb.ci.delete'
  | 'cmdb.ci.link'
  | 'cmdb.ci.import'
  | 'cmdb.ci.export'
  | 'cmdb.sync.create'
  | 'cmdb.sync.edit'
  | 'cmdb.sync.delete'
  | 'cmdb.sync.trigger'
  | 'cmdb.sync.webhook'
  | 'oncall.calendar.override'
  | 'oncall.calendar.share'
  | 'oncall.group.create'
  | 'oncall.group.edit'
  | 'oncall.group.delete'
  | 'oncall.group.member'
  | 'oncall.group.schedule'
  | 'oncall.group.share'
  | 'monitor.alert.ack'
  | 'monitor.alert.comment'
  | 'monitor.alert.close'
  | 'monitor.alert.ticket'
  | 'monitor.alert.view'
  | 'monitor.rule.create'
  | 'monitor.rule.edit'
  | 'monitor.rule.delete'
  | 'monitor.rule.toggle'
  | 'monitor.rule.import'
  | 'monitor.rule.export'
  | 'monitor.rule.group'
  | 'monitor.rule.scope'
  | 'monitor.rule.simulate'
  | 'monitor.mute.create'
  | 'monitor.mute.edit'
  | 'monitor.mute.delete'
  | 'monitor.mute.inhibit_create'
  | 'monitor.mute.inhibit_edit'
  | 'monitor.mute.inhibit_delete'
  | 'monitor.subscription.create'
  | 'monitor.subscription.edit'
  | 'monitor.subscription.delete'
  | 'monitor.escalation.create'
  | 'monitor.escalation.edit'
  | 'monitor.escalation.delete'
  | 'monitor.record.create'
  | 'monitor.record.edit'
  | 'monitor.record.delete'
  | 'monitor.datasource.create'
  | 'monitor.datasource.edit'
  | 'monitor.datasource.delete'
  | 'monitor.datasource.test'
  | 'job.template.create'
  | 'job.template.edit'
  | 'job.template.delete'
  | 'job.template.run'
  | 'job.execution.cancel'
  | 'job.project.create'
  | 'job.project.edit'
  | 'job.project.delete'
  | 'job.credential.create'
  | 'job.credential.edit'
  | 'job.credential.delete'
  | 'job.runner.create'
  | 'job.runner.edit'
  | 'job.runner.delete'
  | 'job.runner.token'
  | 'job.adhoc.run'
  | 'job.script.create'
  | 'job.script.edit'
  | 'job.script.delete'
  | 'job.schedule.create'
  | 'job.schedule.edit'
  | 'job.schedule.delete'
  | 'job.trigger.create'
  | 'job.trigger.edit'
  | 'job.trigger.delete'
  | 'job.trigger.token'
  | 'job.policy.rule'
  | 'job.policy.edit'
  | 'k8s.cluster.create'
  | 'k8s.cluster.edit'
  | 'k8s.cluster.delete'
  | 'k8s.cluster.agent'
  | 'k8s.cluster.node_schedule'
  | 'k8s.cluster.node_drain'
  | 'k8s.cluster.node_edit'
  | 'k8s.cluster.namespace_create'
  | 'k8s.cluster.namespace_edit'
  | 'k8s.cluster.namespace_delete'
  | 'k8s.workload.create'
  | 'k8s.workload.edit'
  | 'k8s.workload.delete'
  | 'k8s.workload.scale'
  | 'k8s.workload.restart'
  | 'k8s.workload.rollback'
  | 'k8s.workload.log'
  | 'k8s.workload.exec'
  | 'k8s.workload.debug'
  | 'k8s.workload.file'
  | 'k8s.audit.replay'
  | 'k8s.change.cancel'
  | 'k8s.change.bypass'
  | 'k8s.inspection.run'
  | 'k8s.kubeconfig.issue'
  | 'k8s.config.create'
  | 'k8s.config.edit'
  | 'k8s.config.delete'
  | 'k8s.config.secret_reveal'
  | 'k8s.resource.create'
  | 'k8s.resource.edit'
  | 'k8s.resource.delete'
  | 'k8s.app.repo'
  | 'k8s.app.install'
  | 'k8s.app.upgrade'
  | 'k8s.app.uninstall';

/** 菜单权限定义 */
export interface MenuPermissionDef {
  /** 权限码（后端目录） */
  code: MenuPermissionCode;
  /** 菜单标题 i18n 键（复用侧边栏 menu.* 词条） */
  labelKey: string;
  /** 父级菜单标题 i18n 键（授权树分组展示用） */
  parentKey: string;
}

/** 元素权限定义 */
export interface ElementPermissionDef {
  /** 权限码（后端目录） */
  code: ElementPermissionCode;
  /** 元素标题 i18n 键 */
  labelKey: string;
  /** 所属菜单权限码（授权树父子关系） */
  parentCode: MenuPermissionCode;
}

/** 全量菜单权限目录 */
export const MENU_PERMISSIONS: MenuPermissionDef[] = [
  { code: 'assistant', labelKey: 'menu.assistant', parentKey: 'menu.assistant' },
  { code: 'knowledge', labelKey: 'menu.knowledge.home', parentKey: 'menu.knowledge' },
  { code: 'knowledge.admin', labelKey: 'menu.knowledge.admin', parentKey: 'menu.knowledge' },
  { code: 'agent.task', labelKey: 'menu.agent.task', parentKey: 'menu.agent' },
  { code: 'agent.profile', labelKey: 'menu.agent.profile', parentKey: 'menu.agent' },
  { code: 'agent.stats', labelKey: 'menu.agent.stats', parentKey: 'menu.agent' },
  { code: 'incident.list', labelKey: 'menu.incident.list', parentKey: 'menu.incident' },
  { code: 'incident.review', labelKey: 'menu.incident.review', parentKey: 'menu.incident' },
  { code: 'incident.stats', labelKey: 'menu.incident.stats', parentKey: 'menu.incident' },
  { code: 'incident.rule', labelKey: 'menu.incident.rule', parentKey: 'menu.incident.config' },
  { code: 'incident.playbook', labelKey: 'menu.incident.playbook', parentKey: 'menu.incident.config' },
  { code: 'incident.business', labelKey: 'menu.incident.business', parentKey: 'menu.incident.config' },
  { code: 'incident.source', labelKey: 'menu.incident.source', parentKey: 'menu.incident.config' },
  { code: 'incident.setting', labelKey: 'menu.incident.setting', parentKey: 'menu.incident.config' },
  { code: 'workflow.definition', labelKey: 'menu.workflow.definition', parentKey: 'menu.workflow' },
  { code: 'workflow.instance', labelKey: 'menu.workflow.instance', parentKey: 'menu.workflow' },
  { code: 'workflow.config', labelKey: 'menu.workflow.config', parentKey: 'menu.workflow' },
  { code: 'ticket.mine', labelKey: 'menu.ticket.mine', parentKey: 'menu.ticket' },
  { code: 'ticket.all', labelKey: 'menu.ticket.all', parentKey: 'menu.ticket' },
  { code: 'ticket.stats', labelKey: 'menu.ticket.stats', parentKey: 'menu.ticket' },
  { code: 'ticket.catalog', labelKey: 'menu.ticket.catalog', parentKey: 'menu.ticket' },
  { code: 'system.user', labelKey: 'menu.system.user', parentKey: 'menu.system' },
  { code: 'system.dept', labelKey: 'menu.system.dept', parentKey: 'menu.system' },
  { code: 'system.role', labelKey: 'menu.system.role', parentKey: 'menu.system' },
  { code: 'system.login_log', labelKey: 'menu.system.login-log', parentKey: 'menu.system' },
  { code: 'system.config', labelKey: 'menu.system.config', parentKey: 'menu.system' },
  { code: 'notify.channel', labelKey: 'menu.notify.channel', parentKey: 'menu.notify' },
  { code: 'notify.template', labelKey: 'menu.notify.template', parentKey: 'menu.notify' },
  { code: 'notify.route', labelKey: 'menu.notify.route', parentKey: 'menu.notify' },
  { code: 'notify.silence', labelKey: 'menu.notify.silence', parentKey: 'menu.notify' },
  { code: 'notify.subscription', labelKey: 'menu.notify.subscription', parentKey: 'menu.notify' },
  { code: 'notify.producer', labelKey: 'menu.notify.producer', parentKey: 'menu.notify' },
  { code: 'notify.event', labelKey: 'menu.notify.event', parentKey: 'menu.notify' },
  { code: 'notify.dispatch', labelKey: 'menu.notify.dispatch', parentKey: 'menu.notify' },
  { code: 'notify.delivery_log', labelKey: 'menu.notify.delivery-log', parentKey: 'menu.notify' },
  { code: 'notify.dlq', labelKey: 'menu.notify.dlq', parentKey: 'menu.notify' },
  { code: 'cmdb.model', labelKey: 'menu.cmdb.model', parentKey: 'menu.cmdb' },
  { code: 'cmdb.ci', labelKey: 'menu.cmdb.ci', parentKey: 'menu.cmdb' },
  { code: 'cmdb.sync', labelKey: 'menu.cmdb.sync', parentKey: 'menu.cmdb' },
  { code: 'cmdb.audit', labelKey: 'menu.cmdb.audit', parentKey: 'menu.cmdb' },
  { code: 'oncall.calendar', labelKey: 'menu.oncall.calendar', parentKey: 'menu.oncall' },
  { code: 'oncall.group', labelKey: 'menu.oncall.group', parentKey: 'menu.oncall' },
  { code: 'monitor.alert', labelKey: 'menu.monitor.alert', parentKey: 'menu.monitor' },
  { code: 'monitor.rule', labelKey: 'menu.monitor.rule', parentKey: 'menu.monitor' },
  { code: 'monitor.mute', labelKey: 'menu.monitor.mute', parentKey: 'menu.monitor' },
  { code: 'monitor.subscription', labelKey: 'menu.monitor.subscription', parentKey: 'menu.monitor' },
  { code: 'monitor.escalation', labelKey: 'menu.monitor.escalation', parentKey: 'menu.monitor' },
  { code: 'monitor.record', labelKey: 'menu.monitor.record', parentKey: 'menu.monitor' },
  { code: 'monitor.datasource', labelKey: 'menu.monitor.datasource', parentKey: 'menu.monitor' },
  { code: 'monitor.explore', labelKey: 'menu.monitor.explore', parentKey: 'menu.monitor' },
  { code: 'monitor.stats', labelKey: 'menu.monitor.stats', parentKey: 'menu.monitor' },
  { code: 'monitor.engine', labelKey: 'menu.monitor.engine', parentKey: 'menu.monitor' },
  { code: 'job.template', labelKey: 'menu.job.template', parentKey: 'menu.job' },
  { code: 'job.execution', labelKey: 'menu.job.execution', parentKey: 'menu.job' },
  { code: 'job.project', labelKey: 'menu.job.project', parentKey: 'menu.job' },
  { code: 'job.credential', labelKey: 'menu.job.credential', parentKey: 'menu.job' },
  { code: 'job.runner', labelKey: 'menu.job.runner', parentKey: 'menu.job' },
  { code: 'job.adhoc', labelKey: 'menu.job.adhoc', parentKey: 'menu.job' },
  { code: 'job.script', labelKey: 'menu.job.script', parentKey: 'menu.job' },
  { code: 'job.schedule', labelKey: 'menu.job.schedule', parentKey: 'menu.job' },
  { code: 'job.trigger', labelKey: 'menu.job.trigger', parentKey: 'menu.job' },
  { code: 'job.policy', labelKey: 'menu.job.policy', parentKey: 'menu.job' },
  { code: 'job.stats', labelKey: 'menu.job.stats', parentKey: 'menu.job' },
  { code: 'k8s.overview', labelKey: 'menu.k8s.overview', parentKey: 'menu.k8s' },
  { code: 'k8s.cluster', labelKey: 'menu.k8s.cluster', parentKey: 'menu.k8s' },
  { code: 'k8s.workload', labelKey: 'menu.k8s.workloads', parentKey: 'menu.k8s' },
  { code: 'k8s.config', labelKey: 'menu.k8s.config', parentKey: 'menu.k8s' },
  { code: 'k8s.resource', labelKey: 'menu.k8s.resource', parentKey: 'menu.k8s' },
  { code: 'k8s.app', labelKey: 'menu.k8s.app', parentKey: 'menu.k8s' },
  { code: 'k8s.event', labelKey: 'menu.k8s.event', parentKey: 'menu.k8s' },
  { code: 'k8s.inspection', labelKey: 'menu.k8s.inspection', parentKey: 'menu.k8s' },
  { code: 'k8s.kubeconfig', labelKey: 'menu.k8s.kubeconfig', parentKey: 'menu.k8s' },
  { code: 'k8s.change', labelKey: 'menu.k8s.change', parentKey: 'menu.k8s' },
  { code: 'k8s.audit', labelKey: 'menu.k8s.audit', parentKey: 'menu.k8s' },
];

/** 全量元素权限目录 */
export const ELEMENT_PERMISSIONS: ElementPermissionDef[] = [
  { code: 'knowledge.write', labelKey: 'permission.knowledge.write', parentCode: 'knowledge' },
  { code: 'knowledge.review', labelKey: 'permission.knowledge.review', parentCode: 'knowledge' },
  { code: 'knowledge.archive', labelKey: 'permission.knowledge.archive', parentCode: 'knowledge' },
  { code: 'knowledge.delete', labelKey: 'permission.knowledge.delete', parentCode: 'knowledge' },
  { code: 'knowledge.space', labelKey: 'permission.knowledge.space', parentCode: 'knowledge' },
  { code: 'knowledge.admin.rebuild', labelKey: 'permission.knowledge.admin.rebuild', parentCode: 'knowledge.admin' },
  { code: 'agent.task.run', labelKey: 'permission.agent.task.run', parentCode: 'agent.task' },
  { code: 'agent.task.rate', labelKey: 'permission.agent.task.rate', parentCode: 'agent.task' },
  { code: 'agent.profile.create', labelKey: 'permission.agent.profile.create', parentCode: 'agent.profile' },
  { code: 'agent.profile.update', labelKey: 'permission.agent.profile.update', parentCode: 'agent.profile' },
  { code: 'agent.profile.delete', labelKey: 'permission.agent.profile.delete', parentCode: 'agent.profile' },
  { code: 'agent.profile.test', labelKey: 'permission.agent.profile.test', parentCode: 'agent.profile' },
  { code: 'incident.list.diagnose', labelKey: 'permission.incident.list.diagnose', parentCode: 'incident.list' },
  { code: 'incident.list.create', labelKey: 'permission.incident.list.create', parentCode: 'incident.list' },
  { code: 'incident.list.handle', labelKey: 'permission.incident.list.handle', parentCode: 'incident.list' },
  { code: 'incident.list.proposal', labelKey: 'permission.incident.list.proposal', parentCode: 'incident.list' },
  { code: 'incident.list.update', labelKey: 'permission.incident.list.update', parentCode: 'incident.list' },
  { code: 'incident.list.share', labelKey: 'permission.incident.list.share', parentCode: 'incident.list' },
  { code: 'incident.list.postmortem', labelKey: 'permission.incident.list.postmortem', parentCode: 'incident.list' },
  { code: 'incident.list.agent', labelKey: 'permission.incident.list.agent', parentCode: 'incident.list' },
  { code: 'incident.rule.create', labelKey: 'permission.incident.rule.create', parentCode: 'incident.rule' },
  { code: 'incident.rule.update', labelKey: 'permission.incident.rule.update', parentCode: 'incident.rule' },
  { code: 'incident.rule.delete', labelKey: 'permission.incident.rule.delete', parentCode: 'incident.rule' },
  { code: 'incident.rule.test', labelKey: 'permission.incident.rule.test', parentCode: 'incident.rule' },
  { code: 'incident.playbook.create', labelKey: 'permission.incident.playbook.create', parentCode: 'incident.playbook' },
  { code: 'incident.playbook.update', labelKey: 'permission.incident.playbook.update', parentCode: 'incident.playbook' },
  { code: 'incident.playbook.delete', labelKey: 'permission.incident.playbook.delete', parentCode: 'incident.playbook' },
  { code: 'incident.business.create', labelKey: 'permission.incident.business.create', parentCode: 'incident.business' },
  { code: 'incident.business.update', labelKey: 'permission.incident.business.update', parentCode: 'incident.business' },
  { code: 'incident.business.delete', labelKey: 'permission.incident.business.delete', parentCode: 'incident.business' },
  { code: 'incident.source.manage', labelKey: 'permission.incident.source.manage', parentCode: 'incident.source' },
  { code: 'incident.source.reset', labelKey: 'permission.incident.source.reset', parentCode: 'incident.source' },
  { code: 'incident.source.delete', labelKey: 'permission.incident.source.delete', parentCode: 'incident.source' },
  { code: 'incident.source.webhook', labelKey: 'permission.incident.source.webhook', parentCode: 'incident.source' },
  { code: 'incident.setting.update', labelKey: 'permission.incident.setting.update', parentCode: 'incident.setting' },
  { code: 'workflow.definition.create', labelKey: 'permission.workflow.definition.create', parentCode: 'workflow.definition' },
  { code: 'workflow.definition.edit', labelKey: 'permission.workflow.definition.edit', parentCode: 'workflow.definition' },
  { code: 'workflow.definition.publish', labelKey: 'permission.workflow.definition.publish', parentCode: 'workflow.definition' },
  { code: 'workflow.definition.delete', labelKey: 'permission.workflow.definition.delete', parentCode: 'workflow.definition' },
  { code: 'workflow.instance.terminate', labelKey: 'permission.workflow.instance.terminate', parentCode: 'workflow.instance' },
  { code: 'workflow.instance.reassign', labelKey: 'permission.workflow.instance.reassign', parentCode: 'workflow.instance' },
  { code: 'workflow.instance.wait', labelKey: 'permission.workflow.instance.wait', parentCode: 'workflow.instance' },
  { code: 'workflow.instance.handover', labelKey: 'permission.workflow.instance.handover', parentCode: 'workflow.instance' },
  { code: 'workflow.config.calendar', labelKey: 'permission.workflow.config.calendar', parentCode: 'workflow.config' },
  { code: 'workflow.config.webhook', labelKey: 'permission.workflow.config.webhook', parentCode: 'workflow.config' },
  { code: 'workflow.config.client', labelKey: 'permission.workflow.config.client', parentCode: 'workflow.config' },
  { code: 'ticket.mine.create', labelKey: 'permission.ticket.mine.create', parentCode: 'ticket.mine' },
  { code: 'ticket.catalog.category', labelKey: 'permission.ticket.catalog.category', parentCode: 'ticket.catalog' },
  { code: 'ticket.catalog.template', labelKey: 'permission.ticket.catalog.template', parentCode: 'ticket.catalog' },
  { code: 'system.user.create', labelKey: 'permission.system.user.create', parentCode: 'system.user' },
  { code: 'system.user.machine', labelKey: 'permission.system.user.machine', parentCode: 'system.user' },
  { code: 'system.user.edit', labelKey: 'permission.system.user.edit', parentCode: 'system.user' },
  { code: 'system.user.status', labelKey: 'permission.system.user.status', parentCode: 'system.user' },
  { code: 'system.user.reset_password', labelKey: 'permission.system.user.reset_password', parentCode: 'system.user' },
  { code: 'system.user.bind_role', labelKey: 'permission.system.user.bind_role', parentCode: 'system.user' },
  { code: 'system.user.delete', labelKey: 'permission.system.user.delete', parentCode: 'system.user' },
  { code: 'system.dept.create', labelKey: 'permission.system.dept.create', parentCode: 'system.dept' },
  { code: 'system.dept.edit', labelKey: 'permission.system.dept.edit', parentCode: 'system.dept' },
  { code: 'system.dept.member', labelKey: 'permission.system.dept.member', parentCode: 'system.dept' },
  { code: 'system.dept.delete', labelKey: 'permission.system.dept.delete', parentCode: 'system.dept' },
  { code: 'system.role.create', labelKey: 'permission.system.role.create', parentCode: 'system.role' },
  { code: 'system.role.edit', labelKey: 'permission.system.role.edit', parentCode: 'system.role' },
  { code: 'system.role.grant', labelKey: 'permission.system.role.grant', parentCode: 'system.role' },
  { code: 'system.role.delete', labelKey: 'permission.system.role.delete', parentCode: 'system.role' },
  { code: 'system.config.edit', labelKey: 'permission.system.config.edit', parentCode: 'system.config' },
  { code: 'notify.channel.create', labelKey: 'permission.notify.channel.create', parentCode: 'notify.channel' },
  { code: 'notify.channel.edit', labelKey: 'permission.notify.channel.edit', parentCode: 'notify.channel' },
  { code: 'notify.channel.delete', labelKey: 'permission.notify.channel.delete', parentCode: 'notify.channel' },
  { code: 'notify.channel.test', labelKey: 'permission.notify.channel.test', parentCode: 'notify.channel' },
  { code: 'notify.template.create', labelKey: 'permission.notify.template.create', parentCode: 'notify.template' },
  { code: 'notify.template.edit', labelKey: 'permission.notify.template.edit', parentCode: 'notify.template' },
  { code: 'notify.template.delete', labelKey: 'permission.notify.template.delete', parentCode: 'notify.template' },
  { code: 'notify.route.create', labelKey: 'permission.notify.route.create', parentCode: 'notify.route' },
  { code: 'notify.route.edit', labelKey: 'permission.notify.route.edit', parentCode: 'notify.route' },
  { code: 'notify.route.delete', labelKey: 'permission.notify.route.delete', parentCode: 'notify.route' },
  { code: 'notify.silence.create', labelKey: 'permission.notify.silence.create', parentCode: 'notify.silence' },
  { code: 'notify.silence.edit', labelKey: 'permission.notify.silence.edit', parentCode: 'notify.silence' },
  { code: 'notify.silence.delete', labelKey: 'permission.notify.silence.delete', parentCode: 'notify.silence' },
  { code: 'notify.subscription.upsert', labelKey: 'permission.notify.subscription.upsert', parentCode: 'notify.subscription' },
  { code: 'notify.subscription.delete', labelKey: 'permission.notify.subscription.delete', parentCode: 'notify.subscription' },
  { code: 'notify.producer.create', labelKey: 'permission.notify.producer.create', parentCode: 'notify.producer' },
  { code: 'notify.producer.edit', labelKey: 'permission.notify.producer.edit', parentCode: 'notify.producer' },
  { code: 'notify.producer.rotate', labelKey: 'permission.notify.producer.rotate', parentCode: 'notify.producer' },
  { code: 'notify.producer.delete', labelKey: 'permission.notify.producer.delete', parentCode: 'notify.producer' },
  { code: 'notify.dlq.replay', labelKey: 'permission.notify.dlq.replay', parentCode: 'notify.dlq' },
  { code: 'cmdb.model.create', labelKey: 'permission.cmdb.model.create', parentCode: 'cmdb.model' },
  { code: 'cmdb.model.edit', labelKey: 'permission.cmdb.model.edit', parentCode: 'cmdb.model' },
  { code: 'cmdb.model.delete', labelKey: 'permission.cmdb.model.delete', parentCode: 'cmdb.model' },
  { code: 'cmdb.model.field', labelKey: 'permission.cmdb.model.field', parentCode: 'cmdb.model' },
  { code: 'cmdb.model.relation_type', labelKey: 'permission.cmdb.model.relation_type', parentCode: 'cmdb.model' },
  { code: 'cmdb.model.view', labelKey: 'permission.cmdb.model.view', parentCode: 'cmdb.model' },
  { code: 'cmdb.model.scope', labelKey: 'permission.cmdb.model.scope', parentCode: 'cmdb.model' },
  { code: 'cmdb.ci.create', labelKey: 'permission.cmdb.ci.create', parentCode: 'cmdb.ci' },
  { code: 'cmdb.ci.edit', labelKey: 'permission.cmdb.ci.edit', parentCode: 'cmdb.ci' },
  { code: 'cmdb.ci.transition', labelKey: 'permission.cmdb.ci.transition', parentCode: 'cmdb.ci' },
  { code: 'cmdb.ci.delete', labelKey: 'permission.cmdb.ci.delete', parentCode: 'cmdb.ci' },
  { code: 'cmdb.ci.link', labelKey: 'permission.cmdb.ci.link', parentCode: 'cmdb.ci' },
  { code: 'cmdb.ci.import', labelKey: 'permission.cmdb.ci.import', parentCode: 'cmdb.ci' },
  { code: 'cmdb.ci.export', labelKey: 'permission.cmdb.ci.export', parentCode: 'cmdb.ci' },
  { code: 'cmdb.sync.create', labelKey: 'permission.cmdb.sync.create', parentCode: 'cmdb.sync' },
  { code: 'cmdb.sync.edit', labelKey: 'permission.cmdb.sync.edit', parentCode: 'cmdb.sync' },
  { code: 'cmdb.sync.delete', labelKey: 'permission.cmdb.sync.delete', parentCode: 'cmdb.sync' },
  { code: 'cmdb.sync.trigger', labelKey: 'permission.cmdb.sync.trigger', parentCode: 'cmdb.sync' },
  { code: 'cmdb.sync.webhook', labelKey: 'permission.cmdb.sync.webhook', parentCode: 'cmdb.sync' },
  { code: 'oncall.calendar.override', labelKey: 'permission.oncall.calendar.override', parentCode: 'oncall.calendar' },
  { code: 'oncall.calendar.share', labelKey: 'permission.oncall.calendar.share', parentCode: 'oncall.calendar' },
  { code: 'oncall.group.create', labelKey: 'permission.oncall.group.create', parentCode: 'oncall.group' },
  { code: 'oncall.group.edit', labelKey: 'permission.oncall.group.edit', parentCode: 'oncall.group' },
  { code: 'oncall.group.delete', labelKey: 'permission.oncall.group.delete', parentCode: 'oncall.group' },
  { code: 'oncall.group.member', labelKey: 'permission.oncall.group.member', parentCode: 'oncall.group' },
  { code: 'oncall.group.schedule', labelKey: 'permission.oncall.group.schedule', parentCode: 'oncall.group' },
  { code: 'oncall.group.share', labelKey: 'permission.oncall.group.share', parentCode: 'oncall.group' },
  { code: 'monitor.alert.ack', labelKey: 'permission.monitor.alert.ack', parentCode: 'monitor.alert' },
  { code: 'monitor.alert.comment', labelKey: 'permission.monitor.alert.comment', parentCode: 'monitor.alert' },
  { code: 'monitor.alert.close', labelKey: 'permission.monitor.alert.close', parentCode: 'monitor.alert' },
  { code: 'monitor.alert.ticket', labelKey: 'permission.monitor.alert.ticket', parentCode: 'monitor.alert' },
  { code: 'monitor.alert.view', labelKey: 'permission.monitor.alert.view', parentCode: 'monitor.alert' },
  { code: 'monitor.rule.create', labelKey: 'permission.monitor.rule.create', parentCode: 'monitor.rule' },
  { code: 'monitor.rule.edit', labelKey: 'permission.monitor.rule.edit', parentCode: 'monitor.rule' },
  { code: 'monitor.rule.delete', labelKey: 'permission.monitor.rule.delete', parentCode: 'monitor.rule' },
  { code: 'monitor.rule.toggle', labelKey: 'permission.monitor.rule.toggle', parentCode: 'monitor.rule' },
  { code: 'monitor.rule.import', labelKey: 'permission.monitor.rule.import', parentCode: 'monitor.rule' },
  { code: 'monitor.rule.export', labelKey: 'permission.monitor.rule.export', parentCode: 'monitor.rule' },
  { code: 'monitor.rule.group', labelKey: 'permission.monitor.rule.group', parentCode: 'monitor.rule' },
  { code: 'monitor.rule.scope', labelKey: 'permission.monitor.rule.scope', parentCode: 'monitor.rule' },
  { code: 'monitor.rule.simulate', labelKey: 'permission.monitor.rule.simulate', parentCode: 'monitor.rule' },
  { code: 'monitor.mute.create', labelKey: 'permission.monitor.mute.create', parentCode: 'monitor.mute' },
  { code: 'monitor.mute.edit', labelKey: 'permission.monitor.mute.edit', parentCode: 'monitor.mute' },
  { code: 'monitor.mute.delete', labelKey: 'permission.monitor.mute.delete', parentCode: 'monitor.mute' },
  { code: 'monitor.mute.inhibit_create', labelKey: 'permission.monitor.mute.inhibit_create', parentCode: 'monitor.mute' },
  { code: 'monitor.mute.inhibit_edit', labelKey: 'permission.monitor.mute.inhibit_edit', parentCode: 'monitor.mute' },
  { code: 'monitor.mute.inhibit_delete', labelKey: 'permission.monitor.mute.inhibit_delete', parentCode: 'monitor.mute' },
  { code: 'monitor.subscription.create', labelKey: 'permission.monitor.subscription.create', parentCode: 'monitor.subscription' },
  { code: 'monitor.subscription.edit', labelKey: 'permission.monitor.subscription.edit', parentCode: 'monitor.subscription' },
  { code: 'monitor.subscription.delete', labelKey: 'permission.monitor.subscription.delete', parentCode: 'monitor.subscription' },
  { code: 'monitor.escalation.create', labelKey: 'permission.monitor.escalation.create', parentCode: 'monitor.escalation' },
  { code: 'monitor.escalation.edit', labelKey: 'permission.monitor.escalation.edit', parentCode: 'monitor.escalation' },
  { code: 'monitor.escalation.delete', labelKey: 'permission.monitor.escalation.delete', parentCode: 'monitor.escalation' },
  { code: 'monitor.record.create', labelKey: 'permission.monitor.record.create', parentCode: 'monitor.record' },
  { code: 'monitor.record.edit', labelKey: 'permission.monitor.record.edit', parentCode: 'monitor.record' },
  { code: 'monitor.record.delete', labelKey: 'permission.monitor.record.delete', parentCode: 'monitor.record' },
  { code: 'monitor.datasource.create', labelKey: 'permission.monitor.datasource.create', parentCode: 'monitor.datasource' },
  { code: 'monitor.datasource.edit', labelKey: 'permission.monitor.datasource.edit', parentCode: 'monitor.datasource' },
  { code: 'monitor.datasource.delete', labelKey: 'permission.monitor.datasource.delete', parentCode: 'monitor.datasource' },
  { code: 'monitor.datasource.test', labelKey: 'permission.monitor.datasource.test', parentCode: 'monitor.datasource' },
  { code: 'job.template.create', labelKey: 'permission.job.template.create', parentCode: 'job.template' },
  { code: 'job.template.edit', labelKey: 'permission.job.template.edit', parentCode: 'job.template' },
  { code: 'job.template.delete', labelKey: 'permission.job.template.delete', parentCode: 'job.template' },
  { code: 'job.template.run', labelKey: 'permission.job.template.run', parentCode: 'job.template' },
  { code: 'job.execution.cancel', labelKey: 'permission.job.execution.cancel', parentCode: 'job.execution' },
  { code: 'job.project.create', labelKey: 'permission.job.project.create', parentCode: 'job.project' },
  { code: 'job.project.edit', labelKey: 'permission.job.project.edit', parentCode: 'job.project' },
  { code: 'job.project.delete', labelKey: 'permission.job.project.delete', parentCode: 'job.project' },
  { code: 'job.credential.create', labelKey: 'permission.job.credential.create', parentCode: 'job.credential' },
  { code: 'job.credential.edit', labelKey: 'permission.job.credential.edit', parentCode: 'job.credential' },
  { code: 'job.credential.delete', labelKey: 'permission.job.credential.delete', parentCode: 'job.credential' },
  { code: 'job.runner.create', labelKey: 'permission.job.runner.create', parentCode: 'job.runner' },
  { code: 'job.runner.edit', labelKey: 'permission.job.runner.edit', parentCode: 'job.runner' },
  { code: 'job.runner.delete', labelKey: 'permission.job.runner.delete', parentCode: 'job.runner' },
  { code: 'job.runner.token', labelKey: 'permission.job.runner.token', parentCode: 'job.runner' },
  { code: 'job.adhoc.run', labelKey: 'permission.job.adhoc.run', parentCode: 'job.adhoc' },
  { code: 'job.script.create', labelKey: 'permission.job.script.create', parentCode: 'job.script' },
  { code: 'job.script.edit', labelKey: 'permission.job.script.edit', parentCode: 'job.script' },
  { code: 'job.script.delete', labelKey: 'permission.job.script.delete', parentCode: 'job.script' },
  { code: 'job.schedule.create', labelKey: 'permission.job.schedule.create', parentCode: 'job.schedule' },
  { code: 'job.schedule.edit', labelKey: 'permission.job.schedule.edit', parentCode: 'job.schedule' },
  { code: 'job.schedule.delete', labelKey: 'permission.job.schedule.delete', parentCode: 'job.schedule' },
  { code: 'job.trigger.create', labelKey: 'permission.job.trigger.create', parentCode: 'job.trigger' },
  { code: 'job.trigger.edit', labelKey: 'permission.job.trigger.edit', parentCode: 'job.trigger' },
  { code: 'job.trigger.delete', labelKey: 'permission.job.trigger.delete', parentCode: 'job.trigger' },
  { code: 'job.trigger.token', labelKey: 'permission.job.trigger.token', parentCode: 'job.trigger' },
  { code: 'job.policy.rule', labelKey: 'permission.job.policy.rule', parentCode: 'job.policy' },
  { code: 'job.policy.edit', labelKey: 'permission.job.policy.edit', parentCode: 'job.policy' },
  { code: 'k8s.cluster.create', labelKey: 'permission.k8s.cluster.create', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.edit', labelKey: 'permission.k8s.cluster.edit', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.delete', labelKey: 'permission.k8s.cluster.delete', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.agent', labelKey: 'permission.k8s.cluster.agent', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.node_schedule', labelKey: 'permission.k8s.cluster.node_schedule', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.node_drain', labelKey: 'permission.k8s.cluster.node_drain', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.node_edit', labelKey: 'permission.k8s.cluster.node_edit', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.namespace_create', labelKey: 'permission.k8s.cluster.namespace_create', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.namespace_edit', labelKey: 'permission.k8s.cluster.namespace_edit', parentCode: 'k8s.cluster' },
  { code: 'k8s.cluster.namespace_delete', labelKey: 'permission.k8s.cluster.namespace_delete', parentCode: 'k8s.cluster' },
  { code: 'k8s.workload.create', labelKey: 'permission.k8s.workload.create', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.edit', labelKey: 'permission.k8s.workload.edit', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.delete', labelKey: 'permission.k8s.workload.delete', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.scale', labelKey: 'permission.k8s.workload.scale', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.restart', labelKey: 'permission.k8s.workload.restart', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.rollback', labelKey: 'permission.k8s.workload.rollback', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.log', labelKey: 'permission.k8s.workload.log', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.exec', labelKey: 'permission.k8s.workload.exec', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.debug', labelKey: 'permission.k8s.workload.debug', parentCode: 'k8s.workload' },
  { code: 'k8s.workload.file', labelKey: 'permission.k8s.workload.file', parentCode: 'k8s.workload' },
  { code: 'k8s.change.cancel', labelKey: 'permission.k8s.change.cancel', parentCode: 'k8s.change' },
  { code: 'k8s.change.bypass', labelKey: 'permission.k8s.change.bypass', parentCode: 'k8s.change' },
  { code: 'k8s.audit.replay', labelKey: 'permission.k8s.audit.replay', parentCode: 'k8s.audit' },
  { code: 'k8s.inspection.run', labelKey: 'permission.k8s.inspection.run', parentCode: 'k8s.inspection' },
  { code: 'k8s.kubeconfig.issue', labelKey: 'permission.k8s.kubeconfig.issue', parentCode: 'k8s.kubeconfig' },
  { code: 'k8s.config.create', labelKey: 'permission.k8s.config.create', parentCode: 'k8s.config' },
  { code: 'k8s.config.edit', labelKey: 'permission.k8s.config.edit', parentCode: 'k8s.config' },
  { code: 'k8s.config.delete', labelKey: 'permission.k8s.config.delete', parentCode: 'k8s.config' },
  { code: 'k8s.config.secret_reveal', labelKey: 'permission.k8s.config.secret_reveal', parentCode: 'k8s.config' },
  { code: 'k8s.resource.create', labelKey: 'permission.k8s.resource.create', parentCode: 'k8s.resource' },
  { code: 'k8s.resource.edit', labelKey: 'permission.k8s.resource.edit', parentCode: 'k8s.resource' },
  { code: 'k8s.resource.delete', labelKey: 'permission.k8s.resource.delete', parentCode: 'k8s.resource' },
  { code: 'k8s.app.repo', labelKey: 'permission.k8s.app.repo', parentCode: 'k8s.app' },
  { code: 'k8s.app.install', labelKey: 'permission.k8s.app.install', parentCode: 'k8s.app' },
  { code: 'k8s.app.upgrade', labelKey: 'permission.k8s.app.upgrade', parentCode: 'k8s.app' },
  { code: 'k8s.app.uninstall', labelKey: 'permission.k8s.app.uninstall', parentCode: 'k8s.app' },
];

/** 全量合法权限码集合（菜单码 + 元素码，保存授权时过滤勾选值） */
export const PERMISSION_CODES = new Set<string>(
  [...MENU_PERMISSIONS, ...ELEMENT_PERMISSIONS].map((item) => item.code),
);

/** 菜单权限码集合（授权树菜单勾选 / 选中态过滤） */
export const MENU_PERMISSION_CODES = new Set<string>(
  MENU_PERMISSIONS.map((item) => item.code),
);

/** 元素权限码集合（回显勾选时仅取叶子，父级勾选态由 Tree 级联推导） */
export const ELEMENT_PERMISSION_CODES = new Set<string>(
  ELEMENT_PERMISSIONS.map((item) => item.code),
);

/**
 * 页面元素权限判定：管理员短路放行，普通用户按有效元素码并集判定。
 * 元素码随登录态初始化（/api/v1/me 的 elements），刷新/重登后更新。
 */
export const usePermissions = () => {
  const { initialState } = useModel('@@initialState');
  const isAdmin = initialState?.currentUser?.isAdmin === true;
  const elements = initialState?.elements ?? [];

  return useCallback(
    (code: ElementPermissionCode) => isAdmin || elements.includes(code),
    [isAdmin, elements],
  );
};
