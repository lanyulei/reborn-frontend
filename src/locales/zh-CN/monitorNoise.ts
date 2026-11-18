/** 监控告警 · 升级策略与抑制规则（由 monitor.ts 并入） */
export default {
  // 升级策略
  'pages.monitor.escalation.create.title': '新建升级策略',
  'pages.monitor.escalation.edit.title': '编辑升级策略 - {name}',
  'pages.monitor.escalation.search.placeholder': '名称 / 说明',
  'pages.monitor.escalation.global': '全局',
  'pages.monitor.escalation.column.scope': '策略范围',
  'pages.monitor.escalation.scope.global': '全局策略',
  'pages.monitor.escalation.scope.group': '分组策略',
  'pages.monitor.escalation.column.levels': '升级各级',
  'pages.monitor.escalation.column.estimate': '24 小时通知量',
  'pages.monitor.escalation.column.estimate.tooltip':
    '一条始终无人处理的告警 24 小时内最多通知的次数（不含规则自身的重复通知）',
  'pages.monitor.escalation.times': '{n} 次',
  'pages.monitor.escalation.column.ruleCount': '引用规则',
  'pages.monitor.escalation.delete.title': '删除升级策略「{name}」？',
  'pages.monitor.escalation.delete.description':
    '仍被规则引用的策略不能删除；删除后不可恢复。',
  'pages.monitor.escalation.rules.title': '引用「{name}」的规则',
  'pages.monitor.escalation.form.group': '归属分组',
  'pages.monitor.escalation.form.group.tooltip':
    '该分组及下级分组的规则可引用；留空为全局策略（仅超级管理员可建）。新建后不可更改',
  'pages.monitor.escalation.form.group.global': '留空 = 全局策略',
  'pages.monitor.escalation.form.group.placeholder': '请选择归属的规则分组',
  'pages.monitor.escalation.form.mode': '升级方式',
  'pages.monitor.escalation.form.mode.1.hint':
    '升级后，前面各级与规则通知对象的重复提醒照常继续',
  'pages.monitor.escalation.form.mode.2.hint':
    '升级后只提醒当前这一级；恢复通知仍发给所有被通知过的人',
  'pages.monitor.escalation.form.minSeverity': '最低级别',
  'pages.monitor.escalation.form.minSeverity.tooltip':
    '事件级别低于它时不升级（如选「严重」= 仅严重及以上才升级）',
  'pages.monitor.escalation.form.enabled.tooltip': '停用后引用它的规则不再升级',
  'pages.monitor.escalation.section.levels': '升级各级',
  'pages.monitor.escalation.oncallGroups.failed':
    '值班分组候选加载失败（可能没有权限），已选项仍会保留；请稍后重试或联系管理员',
  'pages.monitor.escalation.level.title': '第 {n} 级',
  'pages.monitor.escalation.level.remove': '移除这一级',
  'pages.monitor.escalation.level.add': '添加一级',
  'pages.monitor.escalation.level.trigger': '触发条件',
  'pages.monitor.escalation.level.afterM': '持续分钟数',
  'pages.monitor.escalation.level.afterM.hint':
    '自首次触发起算，各级须逐级递增',
  'pages.monitor.escalation.level.backupOnly': '仅备班',
  'pages.monitor.escalation.level.schedule.add': '添加值班表',
  'pages.monitor.escalation.level.oncallGroups': '值班分组',
  'pages.monitor.escalation.level.oncallGroups.placeholder':
    '选择值班分组（通知分组的管理员）',
  'pages.monitor.escalation.level.depts': '部门负责人',
  'pages.monitor.escalation.level.depts.placeholder': '选择部门',
  'pages.monitor.escalation.level.dept.self': '本部门负责人',
  'pages.monitor.escalation.level.dept.up': '向上 {n} 级部门的负责人',
  'pages.monitor.escalation.level.dept.upLabel': '向上几级',
  'pages.monitor.escalation.level.dept.add': '添加部门',
  'pages.monitor.escalation.level.repeat': '重复提醒间隔',
  'pages.monitor.escalation.level.repeat.hint': '0 = 不重复，否则 5–10080 分钟',
  'pages.monitor.escalation.level.maxNotify': '通知次数上限',
  'pages.monitor.escalation.level.maxNotify.unit': '次',
  'pages.monitor.escalation.level.maxNotify.hint': '含升级时的那一次，0 = 不限',
  'pages.monitor.escalation.level.required': '至少配置一级',
  'pages.monitor.escalation.level.invalid': '第 {n} 级：{reason}',
  'pages.monitor.escalation.level.error.trigger': '请选择触发条件',
  'pages.monitor.escalation.level.error.afterM':
    '持续分钟数须为 1–10080 的整数',
  'pages.monitor.escalation.level.error.increasing':
    '持续分钟数须大于上一级（各级严格递增）',
  'pages.monitor.escalation.level.error.schedule':
    '有值班表未选择，请选择或移除该行',
  'pages.monitor.escalation.level.error.scheduleDup':
    '同一张值班表只能出现一次',
  'pages.monitor.escalation.level.error.dept': '有部门未选择，请选择或移除该行',
  'pages.monitor.escalation.level.error.targets': '至少选择一类通知对象',
  'pages.monitor.escalation.level.error.repeat':
    '重复提醒间隔须为 0 或 5–10080 分钟',
  'pages.monitor.escalation.level.error.maxNotify':
    '通知次数上限须为 0–100 的整数',
  'pages.monitor.escalation.estimate.pending':
    '填写名称并配置好各级后，这里显示 24 小时通知量估算',
  'pages.monitor.escalation.estimate.total':
    '按当前配置，一条始终无人处理的告警 24 小时最多通知 {total} 次',
  'pages.monitor.escalation.estimate.rule': '规则自身 {n} 次',
  'pages.monitor.escalation.estimate.level': '第 {level} 级 {n} 次',
  'pages.monitor.escalation.estimate.warn':
    '通知过于频繁，建议拉长重复提醒间隔或设置通知次数上限。',
  'pages.monitor.escalation.summary.trigger.1': '{n} 分钟未认领',
  'pages.monitor.escalation.summary.trigger.2': '{n} 分钟未恢复',
  'pages.monitor.escalation.summary.backupOnly': '{name}（仅备班）',
  'pages.monitor.escalation.summary.oncallGroup': '{name} 管理员',
  'pages.monitor.escalation.summary.dept': '{name} 负责人',
  'pages.monitor.escalation.summary.deptUp': '{name} 上 {n} 级负责人',
  'pages.monitor.escalation.summary.once': '只通知一次',
  'pages.monitor.escalation.summary.repeat': '每 {interval} 分钟重复',
  'pages.monitor.escalation.summary.repeatMax':
    '每 {interval} 分钟重复，最多 {max} 次',
  // 抑制规则
  'pages.monitor.inhibit.create.title': '新建抑制规则',
  'pages.monitor.inhibit.edit.title': '编辑抑制规则 - {name}',
  'pages.monitor.inhibit.search.placeholder': '名称 / 说明',
  'pages.monitor.inhibit.column.inhibitedCount': '当前抑制数',
  'pages.monitor.inhibit.column.inhibitedCount.tooltip':
    '当前正被它抑制通知的活跃告警数',
  'pages.monitor.inhibit.delete.title': '删除抑制规则「{name}」？',
  'pages.monitor.inhibit.delete.description':
    '正被它抑制的告警在下一轮评估时解除抑制；若仍在告警，按一次新通知处理。',
  'pages.monitor.inhibit.form.hint':
    '源告警活跃期间，相等标签取值相同的目标告警不再通知与升级，仍照常留档。',
  'pages.monitor.inhibit.form.hint.example':
    '例：源条件选规则「主机失联」，相等标签填 ident，则同一主机的其他告警被抑制。',
  'pages.monitor.inhibit.form.group.tooltip':
    '源告警与目标告警都须在该分组（含下级）内；留空为全部分组，仅超级管理员可设置',
  'pages.monitor.inhibit.section.source': '源条件',
  'pages.monitor.inhibit.section.target': '目标条件',
  'pages.monitor.inhibit.form.source.required':
    '源条件不能为空：指定规则、级别、标签匹配至少填一项',
  'pages.monitor.inhibit.form.target.required':
    '目标条件与相等标签不能同时为空',
  'pages.monitor.inhibit.form.equalLabels': '相等标签',
  'pages.monitor.inhibit.form.equalLabels.tooltip':
    '源告警与目标告警在这些标签上取值全部相同才抑制（没有的标签按空值比较），至多 10 个',
  'pages.monitor.inhibit.form.equalLabels.placeholder':
    '输入标签名后回车，如 ident',
  'pages.monitor.inhibit.form.equalLabels.rule':
    '标签名以字母或下划线开头、只含字母数字下划线，至多 128 个字符',
  'pages.monitor.inhibit.preview.action': '预览',
  'pages.monitor.inhibit.preview.title': '预览抑制效果',
  'pages.monitor.inhibit.preview.sources':
    '当前满足源条件的告警：共 {total} 条，下表列出 {shown} 条',
  'pages.monitor.inhibit.preview.targets':
    '会被抑制的告警：共 {total} 条，下表列出 {shown} 条',
};
