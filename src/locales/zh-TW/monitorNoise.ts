/** 监控告警 · 升级策略与抑制规则（由 monitor.ts 并入） */
export default {
  // 升級策略
  'pages.monitor.escalation.create.title': '新增升級策略',
  'pages.monitor.escalation.edit.title': '編輯升級策略 - {name}',
  'pages.monitor.escalation.search.placeholder': '名稱 / 說明',
  'pages.monitor.escalation.global': '全域',
  'pages.monitor.escalation.column.scope': '策略範圍',
  'pages.monitor.escalation.scope.global': '全域策略',
  'pages.monitor.escalation.scope.group': '分組策略',
  'pages.monitor.escalation.column.levels': '升級各級',
  'pages.monitor.escalation.column.estimate': '24 小時通知量',
  'pages.monitor.escalation.column.estimate.tooltip':
    '一條始終無人處理的告警 24 小時內最多通知的次數（不含規則自身的重複通知）',
  'pages.monitor.escalation.times': '{n} 次',
  'pages.monitor.escalation.column.ruleCount': '引用規則',
  'pages.monitor.escalation.delete.title': '刪除升級策略「{name}」？',
  'pages.monitor.escalation.delete.description':
    '仍被規則引用的策略不能刪除；刪除後不可恢復。',
  'pages.monitor.escalation.rules.title': '引用「{name}」的規則',
  'pages.monitor.escalation.form.group': '歸屬分組',
  'pages.monitor.escalation.form.group.tooltip':
    '該分組及下級分組的規則可引用；留空為全域策略（僅超級管理員可建）。新增後不可更改',
  'pages.monitor.escalation.form.group.global': '留空 = 全域策略',
  'pages.monitor.escalation.form.group.placeholder': '請選擇歸屬的規則分組',
  'pages.monitor.escalation.form.mode': '升級方式',
  'pages.monitor.escalation.form.mode.1.hint':
    '升級後，前面各級與規則通知對象的重複提醒照常繼續',
  'pages.monitor.escalation.form.mode.2.hint':
    '升級後只提醒當前這一級；恢復通知仍發給所有被通知過的人',
  'pages.monitor.escalation.form.minSeverity': '最低級別',
  'pages.monitor.escalation.form.minSeverity.tooltip':
    '事件級別低於它時不升級（如選「嚴重」= 僅嚴重及以上才升級）',
  'pages.monitor.escalation.form.enabled.tooltip': '停用後引用它的規則不再升級',
  'pages.monitor.escalation.section.levels': '升級各級',
  'pages.monitor.escalation.oncallGroups.failed':
    '值班分組候選載入失敗（可能沒有權限），已選項仍會保留；請稍後重試或聯絡管理員',
  'pages.monitor.escalation.level.title': '第 {n} 級',
  'pages.monitor.escalation.level.remove': '移除這一級',
  'pages.monitor.escalation.level.add': '新增一級',
  'pages.monitor.escalation.level.trigger': '觸發條件',
  'pages.monitor.escalation.level.afterM': '持續分鐘數',
  'pages.monitor.escalation.level.afterM.hint':
    '自首次觸發起算，各級須逐級遞增',
  'pages.monitor.escalation.level.backupOnly': '僅備班',
  'pages.monitor.escalation.level.schedule.add': '新增值班表',
  'pages.monitor.escalation.level.oncallGroups': '值班分組',
  'pages.monitor.escalation.level.oncallGroups.placeholder':
    '選擇值班分組（通知分組的管理員）',
  'pages.monitor.escalation.level.depts': '部門負責人',
  'pages.monitor.escalation.level.depts.placeholder': '選擇部門',
  'pages.monitor.escalation.level.dept.self': '本部門負責人',
  'pages.monitor.escalation.level.dept.up': '向上 {n} 級部門的負責人',
  'pages.monitor.escalation.level.dept.upLabel': '向上幾級',
  'pages.monitor.escalation.level.dept.add': '新增部門',
  'pages.monitor.escalation.level.repeat': '重複提醒間隔',
  'pages.monitor.escalation.level.repeat.hint': '0 = 不重複，否則 5–10080 分鐘',
  'pages.monitor.escalation.level.maxNotify': '通知次數上限',
  'pages.monitor.escalation.level.maxNotify.unit': '次',
  'pages.monitor.escalation.level.maxNotify.hint': '含升級時的那一次，0 = 不限',
  'pages.monitor.escalation.level.required': '至少設定一級',
  'pages.monitor.escalation.level.invalid': '第 {n} 級：{reason}',
  'pages.monitor.escalation.level.error.trigger': '請選擇觸發條件',
  'pages.monitor.escalation.level.error.afterM':
    '持續分鐘數須為 1–10080 的整數',
  'pages.monitor.escalation.level.error.increasing':
    '持續分鐘數須大於上一級（各級嚴格遞增）',
  'pages.monitor.escalation.level.error.schedule':
    '有值班表未選擇，請選擇或移除該列',
  'pages.monitor.escalation.level.error.scheduleDup':
    '同一張值班表只能出現一次',
  'pages.monitor.escalation.level.error.dept': '有部門未選擇，請選擇或移除該列',
  'pages.monitor.escalation.level.error.targets': '至少選擇一類通知對象',
  'pages.monitor.escalation.level.error.repeat':
    '重複提醒間隔須為 0 或 5–10080 分鐘',
  'pages.monitor.escalation.level.error.maxNotify':
    '通知次數上限須為 0–100 的整數',
  'pages.monitor.escalation.estimate.pending':
    '填寫名稱並設定好各級後，這裡顯示 24 小時通知量估算',
  'pages.monitor.escalation.estimate.total':
    '按當前設定，一條始終無人處理的告警 24 小時最多通知 {total} 次',
  'pages.monitor.escalation.estimate.rule': '規則自身 {n} 次',
  'pages.monitor.escalation.estimate.level': '第 {level} 級 {n} 次',
  'pages.monitor.escalation.estimate.warn':
    '通知過於頻繁，建議拉長重複提醒間隔或設定通知次數上限。',
  'pages.monitor.escalation.summary.trigger.1': '{n} 分鐘未認領',
  'pages.monitor.escalation.summary.trigger.2': '{n} 分鐘未恢復',
  'pages.monitor.escalation.summary.backupOnly': '{name}（僅備班）',
  'pages.monitor.escalation.summary.oncallGroup': '{name} 管理員',
  'pages.monitor.escalation.summary.dept': '{name} 負責人',
  'pages.monitor.escalation.summary.deptUp': '{name} 上 {n} 級負責人',
  'pages.monitor.escalation.summary.once': '只通知一次',
  'pages.monitor.escalation.summary.repeat': '每 {interval} 分鐘重複',
  'pages.monitor.escalation.summary.repeatMax':
    '每 {interval} 分鐘重複，最多 {max} 次',
  // 抑制規則
  'pages.monitor.inhibit.create.title': '新增抑制規則',
  'pages.monitor.inhibit.edit.title': '編輯抑制規則 - {name}',
  'pages.monitor.inhibit.search.placeholder': '名稱 / 說明',
  'pages.monitor.inhibit.column.inhibitedCount': '當前抑制數',
  'pages.monitor.inhibit.column.inhibitedCount.tooltip':
    '當前正被它抑制通知的活躍告警數',
  'pages.monitor.inhibit.delete.title': '刪除抑制規則「{name}」？',
  'pages.monitor.inhibit.delete.description':
    '正被它抑制的告警在下一輪評估時解除抑制；若仍在告警，按一次新通知處理。',
  'pages.monitor.inhibit.form.hint':
    '源告警活躍期間，相等標籤取值相同的目標告警不再通知與升級，仍照常留檔。',
  'pages.monitor.inhibit.form.hint.example':
    '例：源條件選規則「主機失聯」，相等標籤填 ident，則同一主機的其他告警被抑制。',
  'pages.monitor.inhibit.form.group.tooltip':
    '源告警與目標告警都須在該分組（含下級）內；留空為全部分組，僅超級管理員可設定',
  'pages.monitor.inhibit.section.source': '源條件',
  'pages.monitor.inhibit.section.target': '目標條件',
  'pages.monitor.inhibit.form.source.required':
    '源條件不能為空：指定規則、級別、標籤匹配至少填一項',
  'pages.monitor.inhibit.form.target.required':
    '目標條件與相等標籤不能同時為空',
  'pages.monitor.inhibit.form.equalLabels': '相等標籤',
  'pages.monitor.inhibit.form.equalLabels.tooltip':
    '源告警與目標告警在這些標籤上取值全部相同才抑制（沒有的標籤按空值比較），至多 10 個',
  'pages.monitor.inhibit.form.equalLabels.placeholder':
    '輸入標籤名後按 Enter，如 ident',
  'pages.monitor.inhibit.form.equalLabels.rule':
    '標籤名以字母或底線開頭、只含字母數字底線，至多 128 個字元',
  'pages.monitor.inhibit.preview.action': '預覽',
  'pages.monitor.inhibit.preview.title': '預覽抑制效果',
  'pages.monitor.inhibit.preview.sources':
    '當前滿足源條件的告警：共 {total} 條，下表列出 {shown} 條',
  'pages.monitor.inhibit.preview.targets':
    '會被抑制的告警：共 {total} 條，下表列出 {shown} 條',
};
