/** 容器平台：变更审批（变更单、紧急变更、自助申请） */
export default {
  'menu.k8s.change': '变更单',
  'permission.k8s.change.cancel': '撤回变更单',
  'permission.k8s.change.bypass': '紧急变更（免审批）',
  'pages.k8s.approval.notice':
    '此集群的变更需审批：提交后生成工单，审批通过后由系统以你的身份执行。',
  'pages.k8s.approval.emergencyOn':
    '紧急变更模式已开启：操作将立即执行（不经审批），并在审计中标记为紧急变更。',
  'pages.k8s.approval.emergency': '紧急变更（免审批）',
  'pages.k8s.approval.emergency.title': '开启紧急变更（免审批）？',
  'pages.k8s.approval.emergency.content':
    '开启后，你在此集群上的变更将跳过审批立即执行，每一次操作都会在审计中标记为紧急变更。离开页面或切换集群后自动关闭。',
  'pages.k8s.approval.emergency.type': '请输入集群名称 {name} 以确认',
  'pages.k8s.approval.emergency.ok': '开启',
  'pages.k8s.approval.submitted': '已提交审批',
  'pages.k8s.approval.submitted.desc':
    '集群尚未改动，审批通过后由系统执行并通知你结果。',
  'pages.k8s.approval.viewTicket': '查看工单 {number}',
  'pages.k8s.approval.viewChange': '查看变更单',
  'pages.k8s.approval.template': '审批工单模板',
  'pages.k8s.approval.template.tooltip':
    '设置后，此集群的写操作先提交工单，审批通过后由系统以发起人身份执行。模板必填字段仅限文本类型的 summary / cluster / namespace / target / detail / link / reason。',
  'pages.k8s.approval.template.placeholder': '不选择 = 变更不需审批',
  'pages.k8s.approval.setting': '自助申请设置',
  'pages.k8s.approval.setting.desc':
    '指定工单模板后才开放对应的申请入口；申请经审批后由系统执行。',
  'pages.k8s.approval.setting.namespaceRequestTemplateId':
    '申请命名空间所用的工单模板',
  'pages.k8s.approval.setting.permissionRequestTemplateId':
    '申请集群权限所用的工单模板',
  'pages.k8s.approval.setting.placeholder': '不选择 = 不开放',
  'pages.k8s.approval.setting.extra':
    '模板必填字段仅限文本类型的 summary / cluster / namespace / target / detail / link / reason',
  'pages.k8s.approval.saved': '已保存',
  'pages.k8s.approval.reason': '申请理由',
  'pages.k8s.approval.request.submit': '提交申请',
  'pages.k8s.approval.request.submitted':
    '已生成工单 {number}，审批通过后由系统执行。',
  'pages.k8s.approval.ns.request': '申请命名空间',
  'pages.k8s.approval.ns.desc':
    '审批通过后由系统创建命名空间，并按填写内容设置配额与容器缺省资源；留空的项不设置。',
  'pages.k8s.approval.ns.requestsCpu': '配额：CPU requests',
  'pages.k8s.approval.ns.requestsMemory': '配额：内存 requests',
  'pages.k8s.approval.ns.limitsCpu': '配额：CPU limits',
  'pages.k8s.approval.ns.limitsMemory': '配额：内存 limits',
  'pages.k8s.approval.ns.pods': '配额：Pod 数',
  'pages.k8s.approval.ns.defaultRequestCpu': '容器缺省 CPU requests',
  'pages.k8s.approval.ns.defaultRequestMemory': '容器缺省内存 requests',
  'pages.k8s.approval.ns.defaultCpu': '容器缺省 CPU limits',
  'pages.k8s.approval.ns.defaultMemory': '容器缺省内存 limits',
  'pages.k8s.approval.perm.request': '申请权限',
  'pages.k8s.approval.perm.desc':
    '审批通过后权限授予你本人，约 10 秒生效；不能申请集群管理员。',
  'pages.k8s.approval.perm.namespace.extra':
    '填写命名空间名称；* 表示全部命名空间',
  'pages.k8s.changeOrder.detail': '变更单详情',
  'pages.k8s.changeOrder.search': '对象名称 / 说明 / 发起人 / 工单编号',
  'pages.k8s.changeOrder.scope.mine': '我提交的',
  'pages.k8s.changeOrder.scope.all': '全部',
  'pages.k8s.changeOrder.summary': '变更内容',
  'pages.k8s.changeOrder.status': '状态',
  'pages.k8s.changeOrder.status.1': '待审批',
  'pages.k8s.changeOrder.status.2': '已批准，待执行',
  'pages.k8s.changeOrder.status.3': '执行中',
  'pages.k8s.changeOrder.status.4': '执行成功',
  'pages.k8s.changeOrder.status.5': '执行失败',
  'pages.k8s.changeOrder.status.6': '审批未通过',
  'pages.k8s.changeOrder.status.7': '已撤回',
  'pages.k8s.changeOrder.status.8': '已过期',
  'pages.k8s.changeOrder.ticket': '审批工单',
  'pages.k8s.changeOrder.requester': '发起人',
  'pages.k8s.changeOrder.createTime': '提交时间',
  'pages.k8s.changeOrder.approveTime': '批准时间',
  'pages.k8s.changeOrder.finishTime': '结束时间',
  'pages.k8s.changeOrder.message': '说明',
  'pages.k8s.changeOrder.approvedHint':
    '已批准，等待系统执行；{time} 之后仍未执行将作废。',
  'pages.k8s.changeOrder.applied': '执行中途失败，以下对象已经变更',
  'pages.k8s.changeOrder.params': '申请内容',
  'pages.k8s.changeOrder.items': '涉及的对象',
  'pages.k8s.changeOrder.items.hint':
    '执行前逐项比对下列字段：与提交时一致才执行；审批期间被改动则不执行，并指出是哪个字段。',
  'pages.k8s.changeOrder.field': '涉及的字段',
  'pages.k8s.changeOrder.field.before': '提交时',
  'pages.k8s.changeOrder.field.after': '变更后',
  'pages.k8s.changeOrder.cancel': '撤回',
  'pages.k8s.changeOrder.cancel.title': '撤回这张变更单？',
  'pages.k8s.changeOrder.cancel.desc': '审批工单将一并撤回，变更不会执行。',
  'pages.k8s.changeOrder.cancel.done': '已撤回',
};
