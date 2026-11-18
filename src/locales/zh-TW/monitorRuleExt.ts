export default {
  'pages.monitor.rule.section.ci': '關聯資源（CMDB）',
  'pages.monitor.rule.section.ci.summary':
    '關聯方式、富化標籤、僅對指定資源生效、拓撲抑制、通知資源負責人',
  'pages.monitor.rule.section.process': '事件處理',
  'pages.monitor.rule.section.process.summary': '標籤改寫、條件丟棄',
  'pages.monitor.rule.section.actions': '事件動作',
  'pages.monitor.rule.section.actions.summary': '自動建單、觸發流程、AI 摘要',
  'pages.monitor.rule.fold.configured': '已設定',
  'pages.monitor.rule.fold.default': '預設',
  'pages.monitor.rule.options.failed':
    '工單範本、流程與 CMDB 候選載入失敗（可能沒有權限），已選項仍會保留；請稍後重試或聯絡管理員',
  'pages.monitor.rule.form.simulate': '模擬觸發',
  'pages.monitor.rule.form.effectiveMode': '生效方式',
  'pages.monitor.rule.form.effectiveMode.windows': '按時間窗',
  'pages.monitor.rule.form.effectiveMode.work_time': '僅工作時間',
  'pages.monitor.rule.form.effectiveMode.off_time': '僅非工作時間',
  'pages.monitor.rule.form.effectiveMode.calendarHint':
    '按流程中心的工作日曆判定；工作日曆未設定時視為一直生效',
  'pages.monitor.rule.form.escalation': '升級策略',
  'pages.monitor.rule.form.escalation.tooltip':
    '告警持續未認領或未恢復時逐級通知更多人，留空不升級；可選全域策略及所在分組（含上級）的策略',
  'pages.monitor.rule.form.escalation.placeholder': '不升級',
  'pages.monitor.rule.form.escalation.needGroup': '請先選擇規則分組',
  'pages.monitor.rule.form.escalation.global': '全域',
  'pages.monitor.rule.form.escalation.option': '{levels} 級 · {mode}',
  'pages.monitor.rule.form.escalation.failed':
    '升級策略候選載入失敗（可能沒有權限），已選項仍會保留；請稍後重試或聯絡管理員',
  'pages.monitor.rule.form.escalation.cleared':
    '所選規則分組不能引用原來的升級策略，已清空，請重新選擇',
  'pages.monitor.rule.ci.mode': '關聯方式',
  'pages.monitor.rule.ci.mode.default': '全域預設',
  'pages.monitor.rule.ci.mode.custom': '自訂',
  'pages.monitor.rule.ci.mode.off': '不關聯',
  'pages.monitor.rule.ci.mode.default.hint':
    '先按 ident 標籤匹配資源名稱，再按 instance 標籤匹配資源 IP；匹配到多個資源時不關聯',
  'pages.monitor.rule.ci.mode.custom.hint':
    '按指定的事件標籤查找資源；匹配到多個資源時不關聯',
  'pages.monitor.rule.ci.mode.tooltip':
    '標籤值形如 host:port 時去掉連接埠再匹配，不區分大小寫',
  'pages.monitor.rule.ci.mode.off.hint':
    '不關聯資源時，標籤富化、維護態自動屏蔽、拓撲抑制、通知資源負責人均不生效',
  'pages.monitor.rule.ci.mode.off.scope':
    '已啟用「僅對指定資源生效」，不關聯資源時這條規則不會產生事件',
  'pages.monitor.rule.ci.label': '事件標籤',
  'pages.monitor.rule.ci.label.tooltip': '用哪個事件標籤的值去找資源',
  'pages.monitor.rule.ci.label.rule':
    '須以字母或底線開頭，只含字母、數字、底線',
  'pages.monitor.rule.ci.by': '對應資源的',
  'pages.monitor.rule.ci.by.name': '資源名稱',
  'pages.monitor.rule.ci.by.attr': '屬性',
  'pages.monitor.rule.ci.attr': '屬性名',
  'pages.monitor.rule.ci.attr.tooltip':
    '只能選部署時登記的可關聯屬性；留空為 ip',
  'pages.monitor.rule.ci.attr.placeholder': 'ip（預設）',
  'pages.monitor.rule.ci.models': '限定模型',
  'pages.monitor.rule.ci.models.hint':
    '只在這些模型的資源裡找，至多 20 個；留空不限',
  'pages.monitor.rule.ci.enrichTags': '富化標籤',
  'pages.monitor.rule.ci.enrichTags.hint':
    '資源帶有所列標籤時，事件增加 ci_tag_<標籤>="true"，至多 10 個',
  'pages.monitor.rule.ci.enrichTags.tooltip':
    '資源的環境、負責人、模型恆以 ci_env / ci_owner / ci_model 寫入事件標籤，無需在此填寫',
  'pages.monitor.rule.ci.tags.placeholder': '輸入資源標籤後按 Enter',
  'pages.monitor.rule.ci.items.rule':
    '至多 {max} 項，每項不能為空且不超過 {bytes} 位元組',
  'pages.monitor.rule.ci.scope': '僅對指定資源生效',
  'pages.monitor.rule.ci.scope.hint':
    '啟用後只保留關聯到符合條件資源的事件，其餘事件丟棄',
  'pages.monitor.rule.ci.scope.models': '資源模型',
  'pages.monitor.rule.ci.scope.envs': '資源環境',
  'pages.monitor.rule.ci.scope.tags': '資源標籤',
  'pages.monitor.rule.ci.scope.tags.tooltip': '資源帶有其中任意一個標籤即可',
  'pages.monitor.rule.ci.topology': '拓撲抑制',
  'pages.monitor.rule.ci.topology.hint':
    '關聯資源的上游（宿主機、上聯交換器等）正在告警時不通知',
  'pages.monitor.rule.ci.owner': '通知資源負責人',
  'pages.monitor.rule.ci.owner.hint':
    '把關聯資源的負責人加入通知對象（須為可用使用者）',
  'pages.monitor.rule.relabel': '標籤改寫',
  'pages.monitor.rule.relabel.tooltip':
    '動作語意同 Prometheus relabel_config；正規表示式按 RE2 語法整體匹配',
  'pages.monitor.rule.relabel.hint':
    '至多 10 步，按順序執行；此時還沒有 ci_ 開頭的標籤',
  'pages.monitor.rule.relabel.refire':
    '修改改寫步驟後，這條規則的活躍告警會先恢復，再按新標籤重新觸發',
  'pages.monitor.rule.relabel.add': '新增改寫步驟',
  'pages.monitor.rule.relabel.moveUp': '上移',
  'pages.monitor.rule.relabel.moveDown': '下移',
  'pages.monitor.rule.relabel.action': '動作',
  'pages.monitor.rule.relabel.action.replace':
    '來源標籤的值串接後匹配正規表示式，把替換內容寫入目標標籤（結果為空則刪除該標籤）',
  'pages.monitor.rule.relabel.action.labelmap':
    '把名稱匹配正規表示式的標籤按替換內容產生新名稱後複製一份',
  'pages.monitor.rule.relabel.action.labeldrop': '刪除名稱匹配正規表示式的標籤',
  'pages.monitor.rule.relabel.action.labelkeep':
    '只保留名稱匹配正規表示式的標籤',
  'pages.monitor.rule.relabel.field.sourceLabels':
    '來源標籤（至多 5 個，留空即寫入常數）',
  'pages.monitor.rule.relabel.field.sourceLabels.placeholder':
    '輸入標籤名後按 Enter',
  'pages.monitor.rule.relabel.field.separator': '分隔符（留空為 ;）',
  'pages.monitor.rule.relabel.field.regex': '正規表示式',
  'pages.monitor.rule.relabel.field.targetLabel': '目標標籤',
  'pages.monitor.rule.relabel.field.replacement': '替換內容（留空為 $1）',
  'pages.monitor.rule.relabel.error.action': '第 {n} 步：請選擇動作',
  'pages.monitor.rule.relabel.error.source':
    '第 {n} 步：來源標籤至多 5 個，每個須是合法的標籤名',
  'pages.monitor.rule.relabel.error.targetRequired':
    '第 {n} 步：請輸入目標標籤',
  'pages.monitor.rule.relabel.error.targetInvalid':
    '第 {n} 步：目標標籤須是合法的標籤名，且不得以 __ 開頭',
  'pages.monitor.rule.relabel.error.regexRequired':
    '第 {n} 步：請輸入正規表示式',
  'pages.monitor.rule.relabel.error.regexInvalid':
    '第 {n} 步：正規表示式不合法',
  'pages.monitor.rule.relabel.error.tooLong':
    '第 {n} 步：正規表示式、分隔符、替換內容各不得超過 256 位元組',
  'pages.monitor.rule.dropExpr': '條件丟棄',
  'pages.monitor.rule.dropExpr.hint':
    '範本渲染結果為 true 時丟棄該事件，可用 $labels、$value',
  'pages.monitor.rule.dropExpr.tooltip':
    '語法同附加資訊；在資源關聯之後執行，可讀取 ci_ 開頭的標籤；渲染出錯時不丟棄',
  'pages.monitor.rule.dropExpr.rule': '不得超過 {max} 位元組',
  'pages.monitor.rule.action.ticket': '自動建單',
  'pages.monitor.rule.action.ticket.hint':
    '觸發時自動建單，每個事件一張；告警恢復時在工單上追加記錄',
  'pages.monitor.rule.action.ticket.template': '工單範本',
  'pages.monitor.rule.action.ticket.agent': '代理提單人',
  'pages.monitor.rule.action.ticket.agent.tooltip':
    '工單以他的名義建立，能否提單、能否關聯資源按他的權限判定；須是可用使用者',
  'pages.monitor.rule.action.workflow': '觸發流程',
  'pages.monitor.rule.action.workflow.hint':
    '觸發時為每個事件發起一個流程，事件內容作為流程變數',
  'pages.monitor.rule.action.workflow.tooltip': '流程變數：{variables}',
  'pages.monitor.rule.action.workflow.definition': '流程',
  'pages.monitor.rule.action.workflow.definition.tooltip': '須有已發佈的版本',
  'pages.monitor.rule.action.workflow.agent': '發起人',
  'pages.monitor.rule.action.ai': 'AI 摘要',
  'pages.monitor.rule.action.ai.hint':
    '觸發後由智慧助理產生事件摘要與排查建議，顯示在事件詳情裡',
  'pages.monitor.rule.action.ai.unavailable':
    '智慧助理尚未設定模型金鑰，開啟後也不會產生摘要',
  'pages.monitor.rule.batch.escalation.set': '改為指定策略',
  'pages.monitor.rule.batch.escalation.clear': '取消升級策略',
  'pages.monitor.rule.batch.escalation.clear.hint': '所選規則將不再升級通知',
  'pages.monitor.rule.batch.escalation.hint':
    '只列出所選規則都能引用的已啟用策略',
  'pages.monitor.rule.batch.escalation.globalOnly':
    '所選規則分屬 {max} 個以上的分組，只提供全域策略',
  'pages.monitor.rule.eval.viewInhibitor': '檢視來源告警',
  'pages.monitor.rule.version.ciMatch.custom': '標籤 {label} → {target}',
  'pages.monitor.rule.version.ciMatch.attr': '屬性 {attr}',
  'pages.monitor.rule.version.models': '模型：{items}',
  'pages.monitor.rule.version.envs': '環境：{items}',
  'pages.monitor.rule.version.tags': '標籤：{items}',
  'pages.monitor.rule.version.ticket.template': '工單範本：{name}',
  'pages.monitor.rule.version.ticket.agent': '代理提單人：{name}',
  'pages.monitor.rule.version.workflow.definition': '流程：{name}',
  'pages.monitor.rule.version.workflow.agent': '發起人：{name}',
};
