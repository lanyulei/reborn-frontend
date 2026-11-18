/** 容器平台：变更审批（变更单、紧急变更、自助申请） */
export default {
  'menu.k8s.change': 'Change Orders',
  'permission.k8s.change.cancel': 'Withdraw change order',
  'permission.k8s.change.bypass': 'Emergency change (bypass approval)',
  'pages.k8s.approval.notice':
    'Changes on this cluster require approval: submitting creates a ticket, and once approved the system executes the change as you.',
  'pages.k8s.approval.emergencyOn':
    'Emergency mode is on: operations run immediately without approval and are flagged as emergency changes in the audit log.',
  'pages.k8s.approval.emergency': 'Emergency change (bypass approval)',
  'pages.k8s.approval.emergency.title':
    'Turn on emergency changes (bypass approval)?',
  'pages.k8s.approval.emergency.content':
    'While on, your changes on this cluster skip approval and run immediately; every operation is flagged as an emergency change in the audit log. It turns off when you leave the page or switch clusters.',
  'pages.k8s.approval.emergency.type':
    'Type the cluster name {name} to confirm',
  'pages.k8s.approval.emergency.ok': 'Turn on',
  'pages.k8s.approval.submitted': 'Submitted for approval',
  'pages.k8s.approval.submitted.desc':
    'The cluster is unchanged. The system runs the change once approved and notifies you of the result.',
  'pages.k8s.approval.viewTicket': 'View ticket {number}',
  'pages.k8s.approval.viewChange': 'View change order',
  'pages.k8s.approval.template': 'Approval ticket template',
  'pages.k8s.approval.template.tooltip':
    'Writes on this cluster first raise a ticket and run as the requester once approved. Required template fields must be text: summary / cluster / namespace / target / detail / link / reason.',
  'pages.k8s.approval.template.placeholder': 'None = changes need no approval',
  'pages.k8s.approval.setting': 'Self-service settings',
  'pages.k8s.approval.setting.desc':
    'A request entry appears only once its ticket template is set; approved requests are executed by the system.',
  'pages.k8s.approval.setting.namespaceRequestTemplateId':
    'Ticket template for namespace requests',
  'pages.k8s.approval.setting.permissionRequestTemplateId':
    'Ticket template for permission requests',
  'pages.k8s.approval.setting.placeholder': 'None = disabled',
  'pages.k8s.approval.setting.extra':
    'Required template fields must be text: summary / cluster / namespace / target / detail / link / reason',
  'pages.k8s.approval.saved': 'Saved',
  'pages.k8s.approval.reason': 'Reason',
  'pages.k8s.approval.request.submit': 'Submit request',
  'pages.k8s.approval.request.submitted':
    'Ticket {number} has been created; the system executes the request once it is approved.',
  'pages.k8s.approval.ns.request': 'Request namespace',
  'pages.k8s.approval.ns.desc':
    'Created by the system once approved, with the quota and defaults below; blanks are not set.',
  'pages.k8s.approval.ns.requestsCpu': 'Quota: CPU requests',
  'pages.k8s.approval.ns.requestsMemory': 'Quota: memory requests',
  'pages.k8s.approval.ns.limitsCpu': 'Quota: CPU limits',
  'pages.k8s.approval.ns.limitsMemory': 'Quota: memory limits',
  'pages.k8s.approval.ns.pods': 'Quota: pods',
  'pages.k8s.approval.ns.defaultRequestCpu': 'Default container CPU request',
  'pages.k8s.approval.ns.defaultRequestMemory':
    'Default container memory request',
  'pages.k8s.approval.ns.defaultCpu': 'Default container CPU limit',
  'pages.k8s.approval.ns.defaultMemory': 'Default container memory limit',
  'pages.k8s.approval.perm.request': 'Request permission',
  'pages.k8s.approval.perm.desc':
    'Granted to you about 10 seconds after approval; cluster-admin cannot be requested.',
  'pages.k8s.approval.perm.namespace.extra':
    'A namespace name; * means all namespaces',
  'pages.k8s.changeOrder.detail': 'Change order',
  'pages.k8s.changeOrder.search':
    'Object / summary / requester / ticket number',
  'pages.k8s.changeOrder.scope.mine': 'Mine',
  'pages.k8s.changeOrder.scope.all': 'All',
  'pages.k8s.changeOrder.summary': 'Change',
  'pages.k8s.changeOrder.status': 'Status',
  'pages.k8s.changeOrder.status.1': 'Pending approval',
  'pages.k8s.changeOrder.status.2': 'Approved, waiting to run',
  'pages.k8s.changeOrder.status.3': 'Running',
  'pages.k8s.changeOrder.status.4': 'Succeeded',
  'pages.k8s.changeOrder.status.5': 'Failed',
  'pages.k8s.changeOrder.status.6': 'Not approved',
  'pages.k8s.changeOrder.status.7': 'Withdrawn',
  'pages.k8s.changeOrder.status.8': 'Expired',
  'pages.k8s.changeOrder.ticket': 'Ticket',
  'pages.k8s.changeOrder.requester': 'Requester',
  'pages.k8s.changeOrder.createTime': 'Submitted',
  'pages.k8s.changeOrder.approveTime': 'Approved',
  'pages.k8s.changeOrder.finishTime': 'Finished',
  'pages.k8s.changeOrder.message': 'Note',
  'pages.k8s.changeOrder.approvedHint':
    'Approved and waiting for the system to run it; it is voided if still not executed after {time}.',
  'pages.k8s.changeOrder.applied':
    'Execution failed part-way; these objects were already changed',
  'pages.k8s.changeOrder.params': 'Request',
  'pages.k8s.changeOrder.items': 'Objects',
  'pages.k8s.changeOrder.items.hint':
    'Before running, the fields below are compared with the live object; if any changed during approval, nothing runs and the field is named.',
  'pages.k8s.changeOrder.field': 'Field',
  'pages.k8s.changeOrder.field.before': 'When submitted',
  'pages.k8s.changeOrder.field.after': 'After',
  'pages.k8s.changeOrder.cancel': 'Withdraw',
  'pages.k8s.changeOrder.cancel.title': 'Withdraw this change order?',
  'pages.k8s.changeOrder.cancel.desc':
    'The approval ticket is withdrawn too and the change will not run.',
  'pages.k8s.changeOrder.cancel.done': 'Withdrawn',
};
