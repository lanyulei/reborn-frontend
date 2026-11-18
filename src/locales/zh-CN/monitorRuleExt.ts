export default {
  'pages.monitor.rule.section.ci': '关联资源（CMDB）',
  'pages.monitor.rule.section.ci.summary':
    '关联方式、富化标签、仅对指定资源生效、拓扑抑制、通知资源负责人',
  'pages.monitor.rule.section.process': '事件处理',
  'pages.monitor.rule.section.process.summary': '标签改写、条件丢弃',
  'pages.monitor.rule.section.actions': '事件动作',
  'pages.monitor.rule.section.actions.summary': '自动建单、触发流程、AI 摘要',
  'pages.monitor.rule.fold.configured': '已配置',
  'pages.monitor.rule.fold.default': '默认',
  'pages.monitor.rule.options.failed':
    '工单模板、流程与 CMDB 候选加载失败（可能没有权限），已选项仍会保留；请稍后重试或联系管理员',
  'pages.monitor.rule.form.simulate': '模拟触发',
  'pages.monitor.rule.form.effectiveMode': '生效方式',
  'pages.monitor.rule.form.effectiveMode.windows': '按时间窗',
  'pages.monitor.rule.form.effectiveMode.work_time': '仅工作时间',
  'pages.monitor.rule.form.effectiveMode.off_time': '仅非工作时间',
  'pages.monitor.rule.form.effectiveMode.calendarHint':
    '按流程中心的工作日历判定；工作日历未配置时视为一直生效',
  'pages.monitor.rule.form.escalation': '升级策略',
  'pages.monitor.rule.form.escalation.tooltip':
    '告警持续未认领或未恢复时逐级通知更多人，留空不升级；可选全局策略及所在分组（含上级）的策略',
  'pages.monitor.rule.form.escalation.placeholder': '不升级',
  'pages.monitor.rule.form.escalation.needGroup': '请先选择规则分组',
  'pages.monitor.rule.form.escalation.global': '全局',
  'pages.monitor.rule.form.escalation.option': '{levels} 级 · {mode}',
  'pages.monitor.rule.form.escalation.failed':
    '升级策略候选加载失败（可能没有权限），已选项仍会保留；请稍后重试或联系管理员',
  'pages.monitor.rule.form.escalation.cleared':
    '所选规则分组不能引用原来的升级策略，已清空，请重新选择',
  'pages.monitor.rule.ci.mode': '关联方式',
  'pages.monitor.rule.ci.mode.default': '全局缺省',
  'pages.monitor.rule.ci.mode.custom': '自定义',
  'pages.monitor.rule.ci.mode.off': '不关联',
  'pages.monitor.rule.ci.mode.default.hint':
    '先按 ident 标签匹配资源名称，再按 instance 标签匹配资源 IP；匹配到多个资源时不关联',
  'pages.monitor.rule.ci.mode.custom.hint':
    '按指定的事件标签查找资源；匹配到多个资源时不关联',
  'pages.monitor.rule.ci.mode.tooltip':
    '标签值形如 host:port 时去掉端口再匹配，不区分大小写',
  'pages.monitor.rule.ci.mode.off.hint':
    '不关联资源时，标签富化、维护态自动屏蔽、拓扑抑制、通知资源负责人均不生效',
  'pages.monitor.rule.ci.mode.off.scope':
    '已启用「仅对指定资源生效」，不关联资源时这条规则不会产生事件',
  'pages.monitor.rule.ci.label': '事件标签',
  'pages.monitor.rule.ci.label.tooltip': '用哪个事件标签的值去找资源',
  'pages.monitor.rule.ci.label.rule':
    '须以字母或下划线开头，只含字母、数字、下划线',
  'pages.monitor.rule.ci.by': '对应资源的',
  'pages.monitor.rule.ci.by.name': '资源名称',
  'pages.monitor.rule.ci.by.attr': '属性',
  'pages.monitor.rule.ci.attr': '属性名',
  'pages.monitor.rule.ci.attr.tooltip':
    '只能选部署时登记的可关联属性；留空为 ip',
  'pages.monitor.rule.ci.attr.placeholder': 'ip（缺省）',
  'pages.monitor.rule.ci.models': '限定模型',
  'pages.monitor.rule.ci.models.hint':
    '只在这些模型的资源里找，至多 20 个；留空不限',
  'pages.monitor.rule.ci.enrichTags': '富化标签',
  'pages.monitor.rule.ci.enrichTags.hint':
    '资源带有所列标签时，事件增加 ci_tag_<标签>="true"，至多 10 个',
  'pages.monitor.rule.ci.enrichTags.tooltip':
    '资源的环境、负责人、模型恒以 ci_env / ci_owner / ci_model 写入事件标签，无需在此填写',
  'pages.monitor.rule.ci.tags.placeholder': '输入资源标签后回车',
  'pages.monitor.rule.ci.items.rule':
    '至多 {max} 项，每项不能为空且不超过 {bytes} 字节',
  'pages.monitor.rule.ci.scope': '仅对指定资源生效',
  'pages.monitor.rule.ci.scope.hint':
    '启用后只保留关联到符合条件资源的事件，其余事件丢弃',
  'pages.monitor.rule.ci.scope.models': '资源模型',
  'pages.monitor.rule.ci.scope.envs': '资源环境',
  'pages.monitor.rule.ci.scope.tags': '资源标签',
  'pages.monitor.rule.ci.scope.tags.tooltip': '资源带有其中任意一个标签即可',
  'pages.monitor.rule.ci.topology': '拓扑抑制',
  'pages.monitor.rule.ci.topology.hint':
    '关联资源的上游（宿主机、上联交换机等）正在告警时不通知',
  'pages.monitor.rule.ci.owner': '通知资源负责人',
  'pages.monitor.rule.ci.owner.hint':
    '把关联资源的负责人加入通知对象（须为可用用户）',
  'pages.monitor.rule.relabel': '标签改写',
  'pages.monitor.rule.relabel.tooltip':
    '动作语义同 Prometheus relabel_config；正则按 RE2 语法整体匹配',
  'pages.monitor.rule.relabel.hint':
    '至多 10 步，按顺序执行；此时还没有 ci_ 开头的标签',
  'pages.monitor.rule.relabel.refire':
    '修改改写步骤后，这条规则的活跃告警会先恢复，再按新标签重新触发',
  'pages.monitor.rule.relabel.add': '添加改写步骤',
  'pages.monitor.rule.relabel.moveUp': '上移',
  'pages.monitor.rule.relabel.moveDown': '下移',
  'pages.monitor.rule.relabel.action': '动作',
  'pages.monitor.rule.relabel.action.replace':
    '源标签的值拼接后匹配正则，把替换内容写入目标标签（结果为空则删除该标签）',
  'pages.monitor.rule.relabel.action.labelmap':
    '把名称匹配正则的标签按替换内容生成新名称后复制一份',
  'pages.monitor.rule.relabel.action.labeldrop': '删除名称匹配正则的标签',
  'pages.monitor.rule.relabel.action.labelkeep': '只保留名称匹配正则的标签',
  'pages.monitor.rule.relabel.field.sourceLabels':
    '源标签（至多 5 个，留空即写入常量）',
  'pages.monitor.rule.relabel.field.sourceLabels.placeholder':
    '输入标签名后回车',
  'pages.monitor.rule.relabel.field.separator': '分隔符（留空为 ;）',
  'pages.monitor.rule.relabel.field.regex': '正则',
  'pages.monitor.rule.relabel.field.targetLabel': '目标标签',
  'pages.monitor.rule.relabel.field.replacement': '替换内容（留空为 $1）',
  'pages.monitor.rule.relabel.error.action': '第 {n} 步：请选择动作',
  'pages.monitor.rule.relabel.error.source':
    '第 {n} 步：源标签至多 5 个，每个须是合法的标签名',
  'pages.monitor.rule.relabel.error.targetRequired':
    '第 {n} 步：请输入目标标签',
  'pages.monitor.rule.relabel.error.targetInvalid':
    '第 {n} 步：目标标签须是合法的标签名，且不得以 __ 开头',
  'pages.monitor.rule.relabel.error.regexRequired': '第 {n} 步：请输入正则',
  'pages.monitor.rule.relabel.error.regexInvalid': '第 {n} 步：正则不合法',
  'pages.monitor.rule.relabel.error.tooLong':
    '第 {n} 步：正则、分隔符、替换内容各不得超过 256 字节',
  'pages.monitor.rule.dropExpr': '条件丢弃',
  'pages.monitor.rule.dropExpr.hint':
    '模板渲染结果为 true 时丢弃该事件，可用 $labels、$value',
  'pages.monitor.rule.dropExpr.tooltip':
    '语法同附加信息；在资源关联之后执行，可读取 ci_ 开头的标签；渲染出错时不丢弃',
  'pages.monitor.rule.dropExpr.rule': '不得超过 {max} 字节',
  'pages.monitor.rule.action.ticket': '自动建单',
  'pages.monitor.rule.action.ticket.hint':
    '触发时自动建单，每个事件一张；告警恢复时在工单上追加记录',
  'pages.monitor.rule.action.ticket.template': '工单模板',
  'pages.monitor.rule.action.ticket.agent': '代理提单人',
  'pages.monitor.rule.action.ticket.agent.tooltip':
    '工单以他的名义创建，能否提单、能否关联资源按他的权限判定；须是可用用户',
  'pages.monitor.rule.action.workflow': '触发流程',
  'pages.monitor.rule.action.workflow.hint':
    '触发时为每个事件发起一个流程，事件内容作为流程变量',
  'pages.monitor.rule.action.workflow.tooltip': '流程变量：{variables}',
  'pages.monitor.rule.action.workflow.definition': '流程',
  'pages.monitor.rule.action.workflow.definition.tooltip': '须有已发布的版本',
  'pages.monitor.rule.action.workflow.agent': '发起人',
  'pages.monitor.rule.action.ai': 'AI 摘要',
  'pages.monitor.rule.action.ai.hint':
    '触发后由智能助手生成事件摘要与排查建议，显示在事件详情里',
  'pages.monitor.rule.action.ai.unavailable':
    '智能助手尚未配置模型密钥，开启后也不会生成摘要',
  'pages.monitor.rule.batch.escalation.set': '改为指定策略',
  'pages.monitor.rule.batch.escalation.clear': '取消升级策略',
  'pages.monitor.rule.batch.escalation.clear.hint': '所选规则将不再升级通知',
  'pages.monitor.rule.batch.escalation.hint':
    '只列出所选规则都能引用的已启用策略',
  'pages.monitor.rule.batch.escalation.globalOnly':
    '所选规则分属 {max} 个以上的分组，只提供全局策略',
  'pages.monitor.rule.eval.viewInhibitor': '查看源告警',
  'pages.monitor.rule.version.ciMatch.custom': '标签 {label} → {target}',
  'pages.monitor.rule.version.ciMatch.attr': '属性 {attr}',
  'pages.monitor.rule.version.models': '模型：{items}',
  'pages.monitor.rule.version.envs': '环境：{items}',
  'pages.monitor.rule.version.tags': '标签：{items}',
  'pages.monitor.rule.version.ticket.template': '工单模板：{name}',
  'pages.monitor.rule.version.ticket.agent': '代理提单人：{name}',
  'pages.monitor.rule.version.workflow.definition': '流程：{name}',
  'pages.monitor.rule.version.workflow.agent': '发起人：{name}',
};
