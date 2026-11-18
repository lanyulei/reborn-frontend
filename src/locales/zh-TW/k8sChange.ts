/** 容器平台：变更审批（变更单、紧急变更、自助申请） */
export default {
  'menu.k8s.change': '變更單',
  'permission.k8s.change.cancel': '撤回變更單',
  'permission.k8s.change.bypass': '緊急變更（免審批）',
  'pages.k8s.approval.notice':
    '此集群的變更需審批：提交後產生工單，審批通過後由系統以你的身分執行。',
  'pages.k8s.approval.emergencyOn':
    '緊急變更模式已開啟：操作將立即執行（不經審批），並在稽核中標記為緊急變更。',
  'pages.k8s.approval.emergency': '緊急變更（免審批）',
  'pages.k8s.approval.emergency.title': '開啟緊急變更（免審批）？',
  'pages.k8s.approval.emergency.content':
    '開啟後，你在此集群上的變更將跳過審批立即執行，每一次操作都會在稽核中標記為緊急變更。離開頁面或切換集群後自動關閉。',
  'pages.k8s.approval.emergency.type': '請輸入集群名稱 {name} 以確認',
  'pages.k8s.approval.emergency.ok': '開啟',
  'pages.k8s.approval.submitted': '已提交審批',
  'pages.k8s.approval.submitted.desc':
    '集群尚未改動，審批通過後由系統執行並通知你結果。',
  'pages.k8s.approval.viewTicket': '查看工單 {number}',
  'pages.k8s.approval.viewChange': '查看變更單',
  'pages.k8s.approval.template': '審批工單範本',
  'pages.k8s.approval.template.tooltip':
    '設定後，此集群的寫入操作先提交工單，審批通過後由系統以發起人身分執行。範本必填欄位僅限文字類型的 summary / cluster / namespace / target / detail / link / reason。',
  'pages.k8s.approval.template.placeholder': '不選擇 = 變更不需審批',
  'pages.k8s.approval.setting': '自助申請設定',
  'pages.k8s.approval.setting.desc':
    '指定工單範本後才開放對應的申請入口；申請經審批後由系統執行。',
  'pages.k8s.approval.setting.namespaceRequestTemplateId':
    '申請命名空間所用的工單範本',
  'pages.k8s.approval.setting.permissionRequestTemplateId':
    '申請集群權限所用的工單範本',
  'pages.k8s.approval.setting.placeholder': '不選擇 = 不開放',
  'pages.k8s.approval.setting.extra':
    '範本必填欄位僅限文字類型的 summary / cluster / namespace / target / detail / link / reason',
  'pages.k8s.approval.saved': '已儲存',
  'pages.k8s.approval.reason': '申請理由',
  'pages.k8s.approval.request.submit': '提交申請',
  'pages.k8s.approval.request.submitted':
    '已產生工單 {number}，審批通過後由系統執行。',
  'pages.k8s.approval.ns.request': '申請命名空間',
  'pages.k8s.approval.ns.desc':
    '審批通過後由系統建立命名空間，並按填寫內容設定配額與容器預設資源；留空的項不設定。',
  'pages.k8s.approval.ns.requestsCpu': '配額：CPU requests',
  'pages.k8s.approval.ns.requestsMemory': '配額：記憶體 requests',
  'pages.k8s.approval.ns.limitsCpu': '配額：CPU limits',
  'pages.k8s.approval.ns.limitsMemory': '配額：記憶體 limits',
  'pages.k8s.approval.ns.pods': '配額：Pod 數',
  'pages.k8s.approval.ns.defaultRequestCpu': '容器預設 CPU requests',
  'pages.k8s.approval.ns.defaultRequestMemory': '容器預設記憶體 requests',
  'pages.k8s.approval.ns.defaultCpu': '容器預設 CPU limits',
  'pages.k8s.approval.ns.defaultMemory': '容器預設記憶體 limits',
  'pages.k8s.approval.perm.request': '申請權限',
  'pages.k8s.approval.perm.desc':
    '審批通過後權限授予你本人，約 10 秒生效；不能申請集群管理員。',
  'pages.k8s.approval.perm.namespace.extra':
    '填寫命名空間名稱；* 表示全部命名空間',
  'pages.k8s.changeOrder.detail': '變更單詳情',
  'pages.k8s.changeOrder.search': '物件名稱 / 說明 / 發起人 / 工單編號',
  'pages.k8s.changeOrder.scope.mine': '我提交的',
  'pages.k8s.changeOrder.scope.all': '全部',
  'pages.k8s.changeOrder.summary': '變更內容',
  'pages.k8s.changeOrder.status': '狀態',
  'pages.k8s.changeOrder.status.1': '待審批',
  'pages.k8s.changeOrder.status.2': '已批准，待執行',
  'pages.k8s.changeOrder.status.3': '執行中',
  'pages.k8s.changeOrder.status.4': '執行成功',
  'pages.k8s.changeOrder.status.5': '執行失敗',
  'pages.k8s.changeOrder.status.6': '審批未通過',
  'pages.k8s.changeOrder.status.7': '已撤回',
  'pages.k8s.changeOrder.status.8': '已過期',
  'pages.k8s.changeOrder.ticket': '審批工單',
  'pages.k8s.changeOrder.requester': '發起人',
  'pages.k8s.changeOrder.createTime': '提交時間',
  'pages.k8s.changeOrder.approveTime': '批准時間',
  'pages.k8s.changeOrder.finishTime': '結束時間',
  'pages.k8s.changeOrder.message': '說明',
  'pages.k8s.changeOrder.approvedHint':
    '已批准，等待系統執行；{time} 之後仍未執行將作廢。',
  'pages.k8s.changeOrder.applied': '執行中途失敗，以下物件已經變更',
  'pages.k8s.changeOrder.params': '申請內容',
  'pages.k8s.changeOrder.items': '涉及的物件',
  'pages.k8s.changeOrder.items.hint':
    '執行前逐項比對下列欄位：與提交時一致才執行；審批期間被改動則不執行，並指出是哪個欄位。',
  'pages.k8s.changeOrder.field': '涉及的欄位',
  'pages.k8s.changeOrder.field.before': '提交時',
  'pages.k8s.changeOrder.field.after': '變更後',
  'pages.k8s.changeOrder.cancel': '撤回',
  'pages.k8s.changeOrder.cancel.title': '撤回這張變更單？',
  'pages.k8s.changeOrder.cancel.desc': '審批工單將一併撤回，變更不會執行。',
  'pages.k8s.changeOrder.cancel.done': '已撤回',
};
