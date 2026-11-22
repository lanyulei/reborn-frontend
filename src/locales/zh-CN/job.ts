/** 作业中心：菜单 / 元素权限 / 枚举 / 凭据 / 项目 / 执行节点 / 作业模板 / 执行记录 / 日志 */
export default {
  // 菜单 / 元素权限
  'menu.job': '作业中心',
  'menu.job.library': '作业管理',
  'menu.job.history': '执行记录',
  'menu.job.automation': '定时触发',
  'menu.job.resource': '资源配置',
  'menu.job.template': '作业模板',
  'menu.job.execution': '执行记录',
  'menu.job.execution-detail': '执行详情',
  'menu.job.project': '项目',
  'menu.job.credential': '凭据',
  'menu.job.runner': '执行节点',
  'permission.job.template.create': '新建作业模板',
  'permission.job.template.edit': '编辑 / 启停作业模板',
  'permission.job.template.delete': '删除作业模板',
  'permission.job.template.run': '执行作业',
  'permission.job.execution.cancel': '取消执行',
  'permission.job.project.create': '新建项目',
  'permission.job.project.edit': '编辑项目',
  'permission.job.project.delete': '删除项目',
  'permission.job.credential.create': '新建凭据',
  'permission.job.credential.edit': '编辑凭据',
  'permission.job.credential.delete': '删除凭据',
  'permission.job.runner.create': '登记执行节点',
  'permission.job.runner.edit': '编辑 / 启停执行节点',
  'permission.job.runner.delete': '删除执行节点',
  'permission.job.runner.token': '重置执行节点令牌',

  // 枚举
  'enum.job.credentialType.1': 'SSH 私钥',
  'enum.job.credentialType.2': 'SSH 密码',
  'enum.job.becomeMethod.none': '不提权',
  'enum.job.becomeMethod.sudo': 'sudo',
  'enum.job.becomeMethod.su': 'su',
  'enum.job.projectAuth.1': '无',
  'enum.job.projectAuth.2': '用户名 + 令牌',
  'enum.job.projectAuth.3': 'SSH 私钥',
  'enum.job.targetMode.1': '指定资源',
  'enum.job.targetMode.2': '按条件筛选',
  'enum.job.paramType.string': '单行文本',
  'enum.job.paramType.text': '多行文本',
  'enum.job.paramType.int': '整数',
  'enum.job.paramType.float': '小数',
  'enum.job.paramType.bool': '开关',
  'enum.job.paramType.enum': '单选',
  'enum.job.executionStatus.1': '排队中',
  'enum.job.executionStatus.2': '执行中',
  'enum.job.executionStatus.3': '成功',
  'enum.job.executionStatus.4': '失败',
  'enum.job.executionStatus.5': '部分失败',
  'enum.job.executionStatus.6': '已取消',
  'enum.job.executionStatus.7': '超时',
  'enum.job.executionStatus.8': '结果未知',
  'enum.job.hostStatus.0': '未执行',
  'enum.job.hostStatus.1': '成功',
  'enum.job.hostStatus.2': '有变更',
  'enum.job.hostStatus.3': '失败',
  'enum.job.hostStatus.4': '不可达',
  'enum.job.hostStatus.5': '已跳过',
  'enum.job.hostProblem.address_empty': '地址为空',
  'enum.job.hostProblem.address_invalid': '地址不合法',
  'enum.job.hostProblem.address_duplicate': '地址重复',

  // 通用
  'pages.job.common.name': '名称',
  'pages.job.common.description': '说明',
  'pages.job.common.templateCount': '使用模板数',
  'pages.job.common.updated': '更新人 / 时间',
  'pages.job.common.yes': '是',
  'pages.job.common.no': '否',
  'pages.job.checkMode': '预检',
  'pages.job.zone.rule':
    '只能包含字母、数字、点、下划线、连字符，以字母或数字开头，最多 64 个字符',
  'pages.job.duration.day': '{n} 天',
  'pages.job.duration.hour': '{n} 小时',
  'pages.job.duration.minute': '{n} 分钟',
  'pages.job.duration.second': '{n} 秒',
  'pages.job.unit.second': '秒',
  'pages.job.unit.minute': '分钟',
  'pages.job.unit.hour': '小时',
  'pages.job.ago': '{text}前',
  'pages.job.ago.now': '刚刚',

  // 错误提示
  'pages.job.error.conflict': '数据已被他人修改，请刷新后重试',
  'pages.job.error.secretUnavailable':
    '平台尚未配置加密主密钥，无法保存凭据，请联系管理员',
  'pages.job.error.credentialInUse': '凭据仍被作业模板使用，不可删除',
  'pages.job.error.projectInUse': '项目仍被作业模板使用，不可删除',
  'pages.job.error.templateDisabled': '作业模板已停用，不可执行',
  'pages.job.error.targetForbidden': '目标主机超出了你的 CMDB 数据范围',
  'pages.job.error.runForbidden':
    '你没有执行作业的权限：保存人即负责人，作业将以你的身份执行（停用不受此限）',
  'pages.job.error.executionConflict':
    '该模板禁止并发，且已有未结束的执行，请等待其结束后再试',
  'pages.job.error.executionFinished': '执行已结束，不能取消',

  // 目标主机清单
  'pages.job.host.column.name': '资源名称',
  'pages.job.host.column.env': '环境',
  'pages.job.host.column.address': '连接地址',
  'pages.job.host.column.problem': '检查结果',
  'pages.job.host.runnable': '可执行',
  'pages.job.hosts.truncated':
    '匹配的主机超过 {max} 台，超出部分未列出；这样的目标不能提交执行，请缩小范围',

  // 凭据
  'pages.job.credential.create.title': '新建凭据',
  'pages.job.credential.edit.title': '编辑凭据：{name}',
  'pages.job.credential.search.placeholder': '名称 / 用户名 / 说明',
  'pages.job.credential.writeOnly':
    '私钥、密码与提权密码只写不读：保存后无法再查看，仅在执行时使用。',
  'pages.job.credential.column.type': '类型',
  'pages.job.credential.column.username': '登录用户名',
  'pages.job.credential.column.become': '提权方式',
  'pages.job.credential.column.fingerprint': '指纹',
  'pages.job.credential.column.fingerprint.tooltip':
    '私钥对应公钥的 SHA256 指纹，用于核对是哪一把钥匙；密码类型没有指纹',
  'pages.job.credential.username.rule':
    '只能包含字母、数字、下划线、点、连字符，不以连字符开头，最多 64 个字符',
  'pages.job.credential.form.privateKey': '私钥',
  'pages.job.credential.form.privateKey.extra':
    'OpenSSH / PEM 格式，不支持带口令的私钥',
  'pages.job.credential.form.password': '密码',
  'pages.job.credential.form.secret.kept': '留空则保留原凭据',
  'pages.job.credential.form.secret.requiredOnTypeChange':
    '更换类型后必须重新填写{label}',
  'pages.job.credential.section.become': '提权',
  'pages.job.credential.form.become.extra':
    '模板开启「提权执行」时按此方式切换用户',
  'pages.job.credential.form.becomeUser': '提权用户',
  'pages.job.credential.form.becomeSecret': '提权密码',
  'pages.job.credential.form.becomeSecret.placeholder': '免密提权时不填',
  'pages.job.credential.form.becomeSecret.kept': '留空则保留已保存的提权密码',
  'pages.job.credential.form.becomeSecret.saved': '已保存提权密码',
  'pages.job.credential.form.becomeSecret.none': '未保存提权密码',
  'pages.job.credential.form.becomeSecret.clear': '清除已保存的提权密码',
  'pages.job.credential.delete.title': '确定删除凭据「{name}」？',
  'pages.job.credential.delete.description':
    '删除后无法恢复，私钥 / 密码将一并销毁。',
  'pages.job.credential.delete.inUse': '仍被 {n} 个作业模板使用，不可删除',

  // 项目
  'pages.job.project.create.title': '新建项目',
  'pages.job.project.edit.title': '编辑项目：{name}',
  'pages.job.project.search.placeholder': '名称 / 仓库地址 / 说明',
  'pages.job.project.column.repoUrl': '仓库地址',
  'pages.job.project.column.ref': '分支 / 标签',
  'pages.job.project.column.authType': '认证方式',
  'pages.job.project.form.ref.extra': '每次执行时拉取该分支或标签的最新提交',
  'pages.job.project.form.repoUrl.extra':
    '支持 http(s):// 与 ssh 地址（ssh://… 或 user@host:path），勿内嵌账号密码',
  'pages.job.project.form.repoUrl.rule': '请输入 http(s) 或 ssh 仓库地址',
  'pages.job.project.form.auth.tokenNeedsHttp':
    '「用户名 + 令牌」只适用于 http(s) 仓库地址',
  'pages.job.project.form.auth.keyNeedsSsh':
    '「SSH 私钥」只适用于 ssh 仓库地址（ssh://… 或 user@host:path）',
  'pages.job.project.form.username': '用户名',
  'pages.job.project.form.username.extra':
    'GitLab 访问令牌可填任意值，如 oauth2',
  'pages.job.project.form.token': '访问令牌',
  'pages.job.project.form.privateKey': 'SSH 私钥',
  'pages.job.project.form.privateKey.extra':
    'OpenSSH / PEM 格式，不支持带口令的私钥',
  'pages.job.project.form.secret.kept': '留空则保留原凭据',
  'pages.job.project.form.secret.requiredOnAuthChange':
    '更换认证方式后必须重新填写{label}',
  'pages.job.project.delete.title': '确定删除项目「{name}」？',
  'pages.job.project.delete.description':
    '删除后无法恢复，仓库凭据将一并销毁。已有的执行记录不受影响。',
  'pages.job.project.delete.inUse': '仍被 {n} 个作业模板使用，不可删除',

  // 执行节点
  'pages.job.runner.create.title': '登记执行节点',
  'pages.job.runner.create.hint':
    '登记后生成接入令牌，仅显示一次，请及时写入节点配置。',
  'pages.job.runner.edit.title': '编辑执行节点：{name}',
  'pages.job.runner.search.placeholder': '名称 / 区域 / 主机名',
  'pages.job.runner.column.zone': '区域',
  'pages.job.runner.column.online': '在线状态',
  'pages.job.runner.column.lastSeen': '最近心跳',
  'pages.job.runner.column.hostname': '主机名',
  'pages.job.runner.column.agentVersion': '程序版本',
  'pages.job.runner.column.load': '负载',
  'pages.job.runner.column.load.tooltip':
    '正在执行的作业数 / 可同时执行的作业数',
  'pages.job.runner.online': '在线',
  'pages.job.runner.offline': '离线',
  'pages.job.runner.neverSeen': '从未接入',
  'pages.job.runner.form.zone.tooltip':
    '指定了区域的作业只派发给同区域的节点；未指定区域的作业可派发给任意节点',
  'pages.job.runner.form.zone.placeholder': '选择或输入区域，可留空',
  'pages.job.runner.form.enabled.tooltip':
    '停用后不再领取新任务，正在执行的作业不受影响',
  'pages.job.runner.disable.title': '确定停用执行节点「{name}」？',
  'pages.job.runner.disable.description':
    '停用后该节点不再领取新任务，正在执行的作业不受影响。若所在区域没有其他可用节点，指定该区域的作业将一直排队。',
  'pages.job.runner.resetToken': '重置令牌',
  'pages.job.runner.resetToken.title': '确定重置执行节点「{name}」的接入令牌？',
  'pages.job.runner.resetToken.description':
    '旧令牌会立即失效：该节点将无法再领取任务与上报结果，直到你把新令牌写入它的配置并重启。新令牌只显示一次。',
  'pages.job.runner.delete.title': '确定删除执行节点「{name}」？',
  'pages.job.runner.delete.description':
    '删除后其令牌立即失效；正在该节点上执行的作业将在租约到期后标记为「结果未知」，平台不会自动重跑。',
  'pages.job.runner.token.title.create': '执行节点「{name}」已登记',
  'pages.job.runner.token.title.reset': '执行节点「{name}」的新令牌',
  'pages.job.runner.token.warning':
    '令牌只显示这一次，关闭后无法再查看。请现在复制并妥善保存。',
  'pages.job.runner.token.warning.reset':
    '旧令牌已失效，请尽快更新节点的配置并重启。',
  'pages.job.runner.token.label': '接入令牌',
  'pages.job.runner.token.snippet': '写入节点的环境变量 {env}：',
  'pages.job.runner.token.ok': '我已保存，关闭',

  // 作业模板
  'pages.job.template.create.title': '新建作业模板',
  'pages.job.template.edit.title': '编辑作业模板：{name}',
  'pages.job.template.search.placeholder': '名称 / Playbook / 说明',
  'pages.job.template.column.project': '项目',
  'pages.job.template.column.playbook': 'Playbook',
  'pages.job.template.column.target': '目标主机',
  'pages.job.template.column.credential': '凭据',
  'pages.job.template.column.version': '版本',
  'pages.job.template.exclusive': '禁止并发',
  'pages.job.template.project.missing': '项目已删除',
  'pages.job.template.credential.missing': '凭据已删除',
  'pages.job.template.target.ids': '{model} · 指定 {n} 台',
  'pages.job.template.target.filter': '{model} · 按条件 {filters}',
  'pages.job.template.target.all': '{model} · 全部',
  'pages.job.template.target.keyword': '名称含「{keyword}」',
  'pages.job.template.run': '执行',
  'pages.job.template.executions': '执行记录',
  'pages.job.template.disable.title': '确定停用作业模板「{name}」？',
  'pages.job.template.disable.description':
    '停用后不可再执行；已提交的执行不受影响。',
  'pages.job.template.delete.title': '确定删除作业模板「{name}」？',
  'pages.job.template.delete.description':
    '删除后无法恢复；已有的执行记录保留，但不能再「重新执行」。',
  'pages.job.template.section.basic': '基本信息',
  'pages.job.template.section.content': '执行内容',
  'pages.job.template.section.target': '目标主机',
  'pages.job.template.section.params': '执行参数',
  'pages.job.template.section.options': '执行选项',
  'pages.job.template.form.enabled.tooltip': '停用后不可执行',
  'pages.job.template.form.project.missing': '（项目已删除，请重新选择）',
  'pages.job.template.form.credential.missing': '（凭据已删除，请重新选择）',
  'pages.job.template.form.playbook.extra':
    '相对仓库根目录的路径；Playbook 的 hosts 须写 all',
  'pages.job.template.form.playbook.rule':
    '请输入仓库内的相对路径，以 .yml 或 .yaml 结尾，不能含 ..',
  'pages.job.template.form.credential.extra':
    '登录目标主机的 SSH 账号，提权方式与密码也取自这里',
  'pages.job.template.form.model': '资源类型',
  'pages.job.template.form.model.extra':
    '从 CMDB 的这类资源中选主机，按执行人的数据范围过滤',
  'pages.job.template.form.addressField': '连接地址取自',
  'pages.job.template.form.addressField.name': '资源名称',
  'pages.job.template.form.addressField.extra':
    '存放 IP 或主机名的属性；敏感属性不可选',
  'pages.job.template.form.mode': '选择方式',
  'pages.job.template.form.ciIds': '指定资源',
  'pages.job.template.form.ciIds.placeholder': '输入关键字搜索并选择资源',
  'pages.job.template.form.ciIds.needModel': '请先选择资源类型',
  'pages.job.template.form.ciIds.empty': '没有匹配的资源',
  'pages.job.template.form.ciIds.count': '已选 {n} / {max}',
  'pages.job.template.form.ciIds.clear': '清空',
  'pages.job.template.form.ciIds.invisible': '不可见 {id}',
  'pages.job.template.form.ciIds.required': '请至少选择一个资源',
  'pages.job.template.form.env': '环境',
  'pages.job.template.form.tag': '标签',
  'pages.job.template.form.keyword': '名称关键字',
  'pages.job.template.form.filter.hint':
    '每次执行时重新筛选；全部留空表示该类型下的全部资源（至多 500 台）',
  'pages.job.template.preview': '预览主机',
  'pages.job.template.preview.summary':
    '共匹配 {total} 台，其中 {runnable} 台可执行',
  'pages.job.template.preview.problems': '{n} 台有问题，执行前须修正',
  'pages.job.template.form.params.hint':
    '执行时填写，作为同名变量（extra vars）传给 Playbook',
  'pages.job.template.form.params.rule': '执行参数有误，请按各行下方的提示修正',
  'pages.job.param.empty': '尚未定义执行参数',
  'pages.job.param.add': '添加参数',
  'pages.job.param.remove': '移除参数',
  'pages.job.param.count': '{n} / {max}',
  'pages.job.param.required': '必填',
  'pages.job.param.code.placeholder': '变量名，如 app_version',
  'pages.job.param.name.placeholder': '显示名',
  'pages.job.param.default.placeholder': '缺省值（可选）',
  'pages.job.param.options.placeholder': '可选值：输入后回车，可用逗号分隔多个',
  'pages.job.param.description.placeholder': '填写说明（可选）',
  'pages.job.param.error.code':
    '变量名须以小写字母开头，只含小写字母、数字、下划线，最多 64 个字符',
  'pages.job.param.error.codePrefix': '变量名不能以 ansible_ 或 cmdb_ 开头',
  'pages.job.param.error.codeReserved':
    '{code} 是 Ansible 的保留名，请换一个变量名（如加上业务前缀 app_{code}）',
  'pages.job.param.error.codeDuplicate': '变量名 {code} 重复',
  'pages.job.param.error.name': '请填写显示名（最多 {max} 个字符）',
  'pages.job.param.error.options':
    '单选类型需要 1-{max} 个可选值，每个最多 {len} 个字符',
  'pages.job.param.error.default': '缺省值与类型不符',
  'pages.job.param.error.defaultTooLong': '缺省值最多 {max} 个字符',
  'pages.job.param.error.descriptionTooLong': '填写说明最多 {max} 个字符',

  // 执行选项
  'pages.job.options.forks': '并发主机数',
  'pages.job.options.forks.tooltip': '同时在多少台主机上执行，1-100',
  'pages.job.options.timeout': '执行超时',
  'pages.job.options.timeout.tooltip': '超时后作业被终止并标记为「超时」',
  'pages.job.options.timeout.rule': '执行超时须在 1 分钟到 24 小时之间',
  'pages.job.options.port': 'SSH 端口',
  'pages.job.options.verbosity': '输出详细程度',
  'pages.job.options.verbosity.0': '普通',
  'pages.job.options.verbosity.1': '详细（-v）',
  'pages.job.options.verbosity.2': '更详细（-vv）',
  'pages.job.options.verbosity.3': '调试（-vvv）',
  'pages.job.options.runnerZone': '执行节点区域',
  'pages.job.options.runnerZone.tooltip':
    '只派发给这个区域的执行节点；留空表示任意区域的节点都可执行',
  'pages.job.options.runnerZone.placeholder': '留空表示任意区域',
  'pages.job.options.runnerZone.any': '任意区域',
  'pages.job.options.become': '提权执行',
  'pages.job.options.become.tooltip':
    '提权方式与密码取自凭据；凭据未配置提权方式时按 sudo',
  'pages.job.options.check': '预检模式',
  'pages.job.options.check.tooltip':
    '默认以预检模式执行：只报告将发生的变更，不修改目标主机；执行时可改',
  'pages.job.options.diff': '输出变更差异',
  'pages.job.options.diff.tooltip': '在日志里输出文件变更的差异',
  'pages.job.options.exclusive': '禁止并发',
  'pages.job.options.exclusive.extra': '开启后，有未结束的执行时不能再次提交',

  // 执行作业弹窗
  'pages.job.run.title': '执行作业',
  'pages.job.run.template': '作业模板',
  'pages.job.run.loadFailed': '无法加载作业模板',
  'pages.job.run.hostCount': '将在 {n} 台主机上执行',
  'pages.job.run.hostList': '查看主机清单（{n} 台）',
  'pages.job.run.retryOnly': '仅在上次失败 / 不可达的主机上执行',
  'pages.job.run.problems': '有 {n} 台主机的连接地址有问题，修正前不能执行',
  'pages.job.run.noHosts': '没有可执行的主机',
  'pages.job.run.outOfScope': '有 {n} 台主机不在你的数据范围内，不会执行',
  'pages.job.run.dropped':
    '上次的主机中有 {n} 台已不在模板的目标内或不在你的数据范围内，不会执行',
  'pages.job.run.check': '预检模式（不做实际变更）',
  'pages.job.run.check.hint': '只报告将发生的变更，不实际修改目标主机。',
  'pages.job.run.realWarning':
    '将对 {n} 台主机做实际变更，请确认主机清单与参数无误。',
  'pages.job.run.submitFailed': '提交失败',
  'pages.job.params.notReady':
    '参数定义还没有加载完成，请稍候再保存（加载失败请重新打开）',
  'pages.job.run.templateChanged':
    '作业模板在你确认期间被修改了，请关闭后重新打开确认',
  'pages.job.adhoc.script.loadFailed': '无法加载所选脚本的最新内容，请重新选择',
  'pages.job.run.ok': '执行',
  'pages.job.run.ok.check': '预检',

  // 执行记录
  'pages.job.execution.search.placeholder': '模板名称',
  'pages.job.execution.search.template': '搜索并选择作业模板',
  'pages.job.execution.mine': '只看我的',
  'pages.job.execution.column.template': '作业模板',
  'pages.job.execution.column.hosts': '主机',
  'pages.job.execution.column.creator': '执行人',
  'pages.job.execution.column.runner': '执行节点',
  'pages.job.execution.column.createTime': '提交时间',
  'pages.job.execution.column.startTime': '开始时间',
  'pages.job.execution.column.finishTime': '结束时间',
  'pages.job.execution.column.duration': '耗时',
  'pages.job.execution.column.commit': '提交号',
  'pages.job.execution.column.cancelUser': '取消人',
  'pages.job.execution.hosts.unreachable': '{n} 不可达',
  'pages.job.execution.hosts.total': '共 {n}',
  'pages.job.execution.hosts.tooltip':
    '成功 {ok} / 失败 {failed} / 不可达 {unreachable}（共 {total} 台）',
  'pages.job.execution.detail': '详情',
  'pages.job.execution.cancel': '取消',
  'pages.job.execution.cancelling': '正在取消…',
  'pages.job.execution.cancelling.hint':
    '{name} 已请求取消，正在等待执行节点终止作业…',
  'pages.job.execution.cancel.title': '确定取消「{name}」的这次执行？',
  'pages.job.execution.cancel.description.queued':
    '作业尚未开始，取消后不会执行。',
  'pages.job.execution.cancel.description.running':
    '作业正在执行：执行节点会先发终止信号，宽限期后强制结束。已经完成的变更不会回滚，部分主机可能停在中间状态。',
  'pages.job.execution.cancel.requested': '已请求取消',
  'pages.job.execution.cancel.unknown': '恢复连接后终止',
  'pages.job.execution.cancel.description.unknown':
    '节点失联期间无法确认作业是否仍在运行。登记终止请求后，执行节点一旦恢复连接就会终止这次作业；如果作业已经结束，则不会有任何影响。',
  'pages.job.execution.unknown.cancelRequested':
    '已登记终止请求：执行节点恢复连接后会立即终止这次作业。',
  'pages.job.execution.backToList': '返回执行记录',
  'pages.job.execution.loadFailed': '无法加载执行详情',
  'pages.job.execution.refreshFailed': '刷新状态失败，正在重试',
  'pages.job.execution.rerun': '重新执行',
  'pages.job.execution.retryFailed': '仅重试失败主机（{n}）',
  'pages.job.execution.retryFailed.none': '没有失败或不可达的主机',
  'pages.job.execution.unknown.title': '结果未知：执行节点失联',
  'pages.job.execution.unknown.description':
    '作业可能仍在目标主机上运行，也可能已经中断。平台不会自动重跑——请先到主机上确认实际情况，再决定是否重新执行。',
  'pages.job.execution.queued': '等待执行节点领取…',
  'pages.job.execution.queued.slow': '已排队 {text}，仍未被执行节点领取',
  'pages.job.execution.queued.slow.zone':
    '请检查区域「{zone}」内是否有已启用且在线的执行节点，以及它们是否已满载。',
  'pages.job.execution.queued.slow.any':
    '请检查是否有已启用且在线的执行节点，以及它们是否已满载。',
  'pages.job.execution.error': '失败原因',
  'pages.job.execution.tab.log': '日志',
  'pages.job.execution.tab.hosts': '主机（{n}）',
  'pages.job.execution.tab.content': '执行内容',
  'pages.job.execution.hostFilter.all': '全部',
  'pages.job.execution.hostFilter.ok': '成功',
  'pages.job.execution.hostFilter.failed': '失败',
  'pages.job.execution.hostFilter.unreachable': '不可达',
  'pages.job.execution.hostFilter.other': '未执行 / 已跳过',
  'pages.job.execution.hostSearch.placeholder': '名称 / 地址',
  'pages.job.execution.section.params': '参数取值',
  'pages.job.execution.params.code': '变量名',
  'pages.job.execution.params.value': '取值',
  'pages.job.execution.params.empty': '本次执行没有参数',

  // 日志
  'pages.job.log.follow': '跟随输出',
  'pages.job.log.streaming': '实时输出中',
  'pages.job.log.paused': '页面不可见，已暂停',
  'pages.job.log.done': '日志已全部加载',
  'pages.job.log.toBottom': '到底部',
  'pages.job.log.download': '下载',
  'pages.job.log.downloadFull': '下载完整日志',
  'pages.job.log.dropped': '已省略前面 {n} 行，',
  'pages.job.log.empty': '没有日志输出',
  'pages.job.log.waiting': '等待日志输出…',
  'pages.job.log.pendingApproval': '等待审批',
  'pages.job.log.lost': '执行节点失联，节点恢复后会补传日志',
  'pages.job.log.queued': '等待排队',
  'pages.job.log.pendingApproval.hint':
    '审批通过后才会开始执行，届时日志会显示在这里。',
  'pages.job.log.queued.hint': '等待执行节点领取，开始执行后日志会显示在这里。',
  'pages.job.log.truncated': '日志超出 32MB 上限，超出部分未保存',
  'pages.job.log.error': '无法读取日志',
  'pages.job.log.error.retrying': '读取日志失败，正在重试',
  'pages.job.log.copyFailed': '复制失败，请改用下载',

  // 二期：菜单 / 元素权限
  'menu.job.adhoc': '快速执行',
  'menu.job.schedule': '定时作业',
  'menu.job.trigger': '触发器',
  'menu.job.script': '脚本库',
  'menu.job.policy': '安全策略',
  'menu.job.stats': '执行统计',
  'permission.job.adhoc.run': '快速执行（命令 / 脚本 / 分发文件）',
  'permission.job.script.create': '新建脚本',
  'permission.job.script.edit': '编辑脚本',
  'permission.job.script.delete': '删除脚本',
  'permission.job.schedule.create': '新建定时作业',
  'permission.job.schedule.edit': '编辑 / 启停定时作业',
  'permission.job.schedule.delete': '删除定时作业',
  'permission.job.trigger.create': '新建触发器',
  'permission.job.trigger.edit': '编辑 / 启停触发器',
  'permission.job.trigger.delete': '删除触发器',
  'permission.job.trigger.token': '重置触发器令牌',
  'permission.job.policy.rule': '维护高危命令规则',
  'permission.job.policy.edit': '修改全局策略',

  // 二期：枚举
  'enum.job.executionStatus.9': '待审批',
  'enum.job.executionStatus.10': '审批未通过',
  'enum.job.kind.1': '作业模板',
  'enum.job.kind.2': '执行命令',
  'enum.job.kind.3': '执行脚本',
  'enum.job.kind.4': '分发文件',
  'enum.job.triggerSource.1': '手动',
  'enum.job.triggerSource.2': '定时作业',
  'enum.job.triggerSource.3': '开放接口',
  'enum.job.triggerSource.4': '告警',
  'enum.job.riskAction.1': '拦截',
  'enum.job.riskAction.2': '须审批',
  'enum.job.riskAction.3': '仅提醒',
  'enum.job.misfire.1': '跳过',
  'enum.job.misfire.2': '补跑一次',
  'enum.job.triggerType.1': '开放接口',
  'enum.job.triggerType.2': '告警',
  'enum.job.fireResult.1': '已提交执行',
  'enum.job.fireResult.2': '已跳过',
  'enum.job.fireResult.3': '失败',
  'enum.job.signalState.0': '无需发送',
  'enum.job.signalState.1': '待发送',
  'enum.job.signalState.2': '已发送',
  'enum.job.signalState.3': '已放弃',

  // 二期：通用 / 错误 / 审批
  'pages.job.common.owner': '负责人',
  'pages.job.common.owner.tooltip':
    '以负责人的身份提交执行，目标主机按其 CMDB 数据范围解析；编辑或启停后负责人变为操作人',
  'pages.job.error.riskBlocked':
    '命令或脚本命中了「拦截」类高危规则，不允许提交',
  'pages.job.error.approvalUnavailable':
    '本次执行须审批，但尚未配置可用的审批流程，请联系管理员在安全策略中配置',
  'pages.job.approval.notice':
    '本次执行需要审批：{reasons}；提交后进入待审批，审批通过才会执行',
  'pages.job.approval.unavailable':
    '需要审批但尚未配置可用的审批流程，请联系管理员在安全策略中配置',
  'pages.job.params.needTemplate': '请先选择作业模板',
  'pages.job.params.none': '该模板没有执行参数',
  'pages.job.params.loadFailed':
    '无法加载作业模板的参数定义（模板已删除或无权查看）',

  // 二期：执行选项 / 作业模板 / 执行弹窗
  'pages.job.options.batchSize': '滚动执行每批主机数',
  'pages.job.options.batchSize.tooltip':
    '按主机顺序分批依次执行，每批各跑一遍；与 Playbook 自身的 serial 无关',
  'pages.job.options.batchSize.extra': '0 表示不分批',
  'pages.job.options.maxFailPercent': '失败阈值',
  'pages.job.options.maxFailPercent.tooltip':
    '一批结束后，失败与不可达主机的占比超过该值即中止，剩余主机不再执行',
  'pages.job.options.maxFailPercent.extra': '0 表示出现任何失败即中止',
  'pages.job.options.maxFailPercent.disabled': '仅滚动执行（分批）时生效',
  'pages.job.options.sliceSize': '作业切片每片主机数',
  'pages.job.options.sliceSize.tooltip':
    '一次提交拆成多条执行（至多 10 片），可由多个执行节点并行执行',
  'pages.job.options.sliceSize.extra': '0 表示不切片',
  'pages.job.options.sliceSize.disabled': '已开启「禁止并发」，不能切片',
  'pages.job.options.exclusive.disabled': '已设置作业切片，不能开启禁止并发',
  'pages.job.template.form.requireApproval': '须审批',
  'pages.job.template.form.requireApproval.extra':
    '每次实际执行须先审批（预检除外）；目标含受保护环境时始终须审批',
  'pages.job.template.requireApproval': '须审批',
  'pages.job.template.slice': '切片',
  'pages.job.template.slice.tooltip': '作业切片：每片 {size} 台主机',
  'pages.job.run.slices':
    '该模板开启了作业切片（每片 {size} 台）：本次提交将拆成 {n} 条执行',
  'pages.job.run.submittedForApproval': '已提交，等待审批',

  // 二期：执行记录 / 执行详情
  'pages.job.execution.column.kind': '类型',
  'pages.job.execution.column.trigger': '触发来源',
  'pages.job.execution.column.approval': '审批',
  'pages.job.execution.slice': '切片 {no}/{total}',
  'pages.job.execution.slice.tooltip': '作业切片：点击查看同一次提交的全部切片',
  'pages.job.execution.filter.group': '当前只显示同一次提交的各个切片',
  'pages.job.execution.filter.triggerRef':
    '当前只显示由指定的定时作业 / 触发器提交的执行',
  'pages.job.execution.filter.clear': '查看全部',
  'pages.job.execution.withdraw': '撤回',
  'pages.job.execution.cancel.description.approval':
    '作业正在等待审批：撤回后审批流程同时撤回，作业不会执行。',
  'pages.job.execution.approval.pending': '等待审批',
  'pages.job.execution.approval.pending.hint':
    '审批通过后进入排队并执行；被驳回、撤回或终止则不会执行。',
  'pages.job.execution.approval.reason': '需要审批的原因：{reason}',
  'pages.job.execution.approval.rejected': '审批未通过，作业没有执行',
  'pages.job.execution.approval.view': '查看审批流程',
  'pages.job.execution.riskHits': '提交时命中的高危命令规则',
  'pages.job.execution.content.scriptFrom': '脚本库：{name}（v{version}）',
  'pages.job.execution.content.fileSize': '文件大小',
  'pages.job.execution.content.batch': '每批 {size} 台，失败阈值 {percent}%',
  'pages.job.execution.content.batch.off': '不分批',

  // 二期：快速执行
  'pages.job.adhoc.command': '命令',
  'pages.job.adhoc.command.extra':
    '在目标主机上以 Shell 执行，提交前按高危命令规则检查',
  'pages.job.adhoc.command.tooLarge':
    '命令最多 4096 字节，较长的内容请改用执行脚本',
  'pages.job.adhoc.scriptSource': '脚本来源',
  'pages.job.adhoc.scriptSource.inline': '临时输入',
  'pages.job.adhoc.scriptSource.library': '脚本库',
  'pages.job.adhoc.scriptId': '脚本',
  'pages.job.adhoc.scriptId.placeholder': '搜索并选择脚本',
  'pages.job.adhoc.scriptId.extra': '执行该脚本的当前版本，内容会存入执行记录',
  'pages.job.adhoc.scriptId.version': 'v{version}',
  'pages.job.adhoc.scriptId.loadFailed': '无法加载脚本（已删除或无权查看）',
  'pages.job.adhoc.interpreter': '解释器',
  'pages.job.adhoc.script': '脚本内容',
  'pages.job.adhoc.scriptArgs': '脚本参数',
  'pages.job.adhoc.scriptArgs.extra': '单行，按 Shell 规则分词',
  'pages.job.adhoc.scriptArgs.tooLarge': '脚本参数最多 1024 字节',
  'pages.job.adhoc.file': '文件',
  'pages.job.adhoc.file.upload': '选择文件',
  'pages.job.adhoc.file.extra': '单个文件，至多 4MB；内容会存入执行记录',
  'pages.job.adhoc.file.required': '请先上传要分发的文件',
  'pages.job.adhoc.file.tooLarge': '文件不能超过 {max}',
  'pages.job.adhoc.fileName': '目标文件名',
  'pages.job.adhoc.fileName.extra': '不填取上传时的文件名',
  'pages.job.adhoc.fileName.rule':
    '只能包含字母、数字与 . _ + -，不以点或连字符开头，最多 128 个字符',
  'pages.job.adhoc.dest': '存放目录',
  'pages.job.adhoc.dest.extra': '目标主机上的绝对路径；不存在时自动创建',
  'pages.job.adhoc.dest.rule':
    '请输入绝对路径，只含字母、数字与 . _ / + -，不能含 ..',
  'pages.job.adhoc.mode': '文件权限',
  'pages.job.adhoc.mode.rule': '0 开头的三位八进制，如 0644',
  'pages.job.adhoc.check': '预检查',
  'pages.job.adhoc.check.title': '检查结果',
  'pages.job.adhoc.check.ok': '检查通过，可以提交',
  'pages.job.adhoc.check.blocked': '命中了「拦截」类高危命令规则，不允许提交',
  'pages.job.adhoc.check.riskHits': '命中了高危命令规则，请确认',
  'pages.job.adhoc.check.notSubmittable':
    '检查未通过，请按检查结果修正后再提交',
  'pages.job.adhoc.submit.hint': '提交前会再检查一次，并要求确认',
  'pages.job.adhoc.submit.noPermission': '你没有快速执行的权限，只能检查',
  'pages.job.adhoc.submit.approval': '提交审批',
  'pages.job.adhoc.confirm.title': '确定{kind}？将在 {n} 台主机上执行',
  'pages.job.adhoc.confirm.credential': '凭据：{name}',
  'pages.job.adhoc.confirm.file': '文件：{name} → {dest}（{mode}）',
  'pages.job.adhoc.confirm.more': '…… 其余 {n} 行未显示',
  'pages.job.adhoc.confirm.warning':
    '提交后立即在目标主机上执行，已发生的变更无法撤销。',
  'pages.job.adhoc.confirm.approval': '提交后进入待审批，审批通过才会执行。',
  'pages.job.adhoc.rerun.loaded':
    '已带入「{name}」上次执行的内容，请核对后再提交',
  'pages.job.adhoc.rerun.file':
    '已带入「{name}」上次执行的目标与选项；文件无法带入，请重新上传',
  'pages.job.adhoc.rerun.notAdhoc': '该执行不是快速执行，无法带入内容',
  'pages.job.adhoc.rerun.failed': '无法带入上次执行的内容：{reason}',

  // 二期：脚本库
  'pages.job.script.create.title': '新建脚本',
  'pages.job.script.edit.title': '编辑脚本：{name}',
  'pages.job.script.search.placeholder': '名称 / 说明',
  'pages.job.script.column.size': '大小',
  'pages.job.script.form.content': '脚本内容',
  'pages.job.script.form.content.stat': '{lines} 行 · {size}（至多 256KB）',
  'pages.job.script.form.content.tooLarge': '脚本内容不能超过 256KB',
  'pages.job.script.delete.title': '确定删除脚本「{name}」？',
  'pages.job.script.delete.description':
    '删除后无法恢复；已有的执行记录不受影响。',

  // 二期：定时作业
  'pages.job.schedule.create.title': '新建定时作业',
  'pages.job.schedule.edit.title': '编辑定时作业：{name}',
  'pages.job.schedule.search.placeholder': '名称 / 说明',
  'pages.job.schedule.notice.owner':
    '以你（负责人）的身份执行；需审批时每次触发都会生成一条待审批的执行。',
  'pages.job.schedule.column.cron': 'Cron 表达式',
  'pages.job.schedule.column.timezone': '时区',
  'pages.job.schedule.column.lastTime': '最近触发',
  'pages.job.schedule.next': '下次 {time}',
  'pages.job.schedule.next.none': '已停用，不会触发',
  'pages.job.schedule.template.missing': '模板已删除',
  'pages.job.schedule.form.cron.extra':
    '标准 5 段：分 时 日 月 周；最短间隔 1 分钟',
  'pages.job.schedule.preset': '常用',
  'pages.job.schedule.preset.every5m': '每 5 分钟',
  'pages.job.schedule.preset.hourly': '每小时',
  'pages.job.schedule.preset.daily': '每天 3:00',
  'pages.job.schedule.preset.weekly': '每周一 3:00',
  'pages.job.schedule.preset.monthly': '每月 1 日 3:00',
  'pages.job.schedule.nextTimes': '接下来 5 次触发（按你的本地时间显示）',
  'pages.job.schedule.section.params': '固定的参数取值',
  'pages.job.schedule.form.misfire': '错过触发后',
  'pages.job.schedule.form.misfire.extra':
    '因服务停机等错过触发时间后的处理方式',
  'pages.job.schedule.enable.title': '确定启用定时作业「{name}」？',
  'pages.job.schedule.enable.description':
    '启用后将按 Cron 表达式自动执行，并以你的身份提交（负责人变为你）。',
  'pages.job.schedule.disable.title': '确定停用定时作业「{name}」？',
  'pages.job.schedule.disable.description':
    '停用后不再触发；已提交的执行不受影响。',
  'pages.job.schedule.delete.title': '确定删除定时作业「{name}」？',
  'pages.job.schedule.delete.description':
    '删除后不再触发且无法恢复；已提交的执行不受影响。',

  // 二期：触发器
  'pages.job.trigger.create.title': '新建触发器',
  'pages.job.trigger.edit.title': '编辑触发器：{name}',
  'pages.job.trigger.search.placeholder': '名称 / 说明',
  'pages.job.trigger.notice.owner':
    '以你（负责人）的身份提交执行，校验与审批规则同手动执行。',
  'pages.job.trigger.column.type': '类型',
  'pages.job.trigger.column.cooldown': '冷却时间',
  'pages.job.trigger.column.lastFire': '最近触发',
  'pages.job.trigger.cooldown.none': '不限',
  'pages.job.trigger.form.type.1.extra':
    '供流程服务节点或外部系统调用，创建后生成调用令牌；类型创建后不可改',
  'pages.job.trigger.form.type.2.extra':
    '告警触发时执行（告警自愈），每个未屏蔽的事件只触发一次；类型创建后不可改',
  'pages.job.trigger.section.api': '开放接口',
  'pages.job.trigger.section.alert': '告警匹配条件',
  'pages.job.trigger.form.passParams': '允许调用方传参',
  'pages.job.trigger.form.passParams.extra':
    '调用方可传参覆盖固定值，并补齐必填项',
  'pages.job.trigger.form.signal': '流程信号名',
  'pages.job.trigger.form.signal.extra':
    '选填；作业结束后向调用方的流程实例发此信号',
  'pages.job.trigger.form.signal.tooltip':
    '请求须带流程实例 ID；流程在服务节点后放一个「等待信号」节点，即可等作业结束再继续',
  'pages.job.trigger.form.signal.rule':
    '字母开头，只含字母、数字与 _ . -，最多 64 个字符',
  'pages.job.trigger.form.rules': '告警规则',
  'pages.job.trigger.form.rules.placeholder': '搜索并选择告警规则',
  'pages.job.trigger.form.rules.extra':
    '至多 50 条；留空表示任意规则，此时须填写标签条件',
  'pages.job.trigger.form.rules.rule': '不限告警规则时必须至少填写一项标签条件',
  'pages.job.trigger.form.severities': '告警级别',
  'pages.job.trigger.form.severities.extra': '不勾选表示任意级别',
  'pages.job.trigger.form.labels': '标签条件',
  'pages.job.trigger.form.labels.extra': '告警标签须全部相等才匹配，至多 10 项',
  'pages.job.trigger.form.labels.key': '标签名',
  'pages.job.trigger.form.labels.value': '标签值',
  'pages.job.trigger.form.labels.add': '添加条件',
  'pages.job.trigger.form.labels.rule':
    '标签名须以字母或下划线开头、只含字母数字下划线且不重复；标签值最多 256 个字符',
  'pages.job.trigger.form.hostLabel': '主机标签',
  'pages.job.trigger.form.hostLabel.extra':
    '存放主机地址的告警标签，如 instance；留空则在模板的全部目标主机上执行',
  'pages.job.trigger.form.hostLabel.tooltip':
    '填写后只在连接地址等于该标签值（去掉 :端口）的那台目标主机上执行，找不到则跳过',
  'pages.job.trigger.form.hostLabel.rule':
    '以字母或下划线开头，只含字母、数字、下划线',
  'pages.job.trigger.form.cooldown.extra':
    '触发后这段时间内的事件被跳过；0 表示不限',
  'pages.job.trigger.form.cooldown.rule': '冷却时间不能超过 24 小时',
  'pages.job.trigger.enable.title': '确定启用触发器「{name}」？',
  'pages.job.trigger.enable.description':
    '启用后外部调用 / 匹配的告警会自动执行作业，并以你的身份提交（负责人变为你）。',
  'pages.job.trigger.disable.title': '确定停用触发器「{name}」？',
  'pages.job.trigger.disable.description':
    '停用后外部调用会被拒绝、匹配的告警不再触发；已提交的执行不受影响。',
  'pages.job.trigger.resetToken.title': '确定重置触发器「{name}」的调用令牌？',
  'pages.job.trigger.resetToken.description':
    '旧令牌会立即失效：仍在使用旧令牌的流程 Webhook 与外部系统将调用失败，直到换成新令牌。新令牌只显示一次。',
  'pages.job.trigger.delete.title': '确定删除触发器「{name}」？',
  'pages.job.trigger.delete.description':
    '删除后其调用令牌立即失效且无法恢复；已提交的执行不受影响。',
  'pages.job.trigger.token.title.create': '触发器「{name}」已创建',
  'pages.job.trigger.token.title.reset': '触发器「{name}」的新令牌',
  'pages.job.trigger.token.warning.reset':
    '旧令牌已失效，请尽快更新调用方的配置。',
  'pages.job.trigger.token.label': '调用令牌',
  'pages.job.trigger.usage.url': '调用地址（POST）',
  'pages.job.trigger.usage.curl': '调用示例（requestId 为幂等键，可选）',
  'pages.job.trigger.usage.workflow': '在流程里使用',
  'pages.job.trigger.usage.workflow.webhook':
    '流程中心 → 流程配置 → Webhook：地址填上面的调用地址，签名密钥填调用令牌。',
  'pages.job.trigger.usage.workflow.signal':
    '流程里在服务节点后加一个「等待信号」节点，信号名填 {signal}，作业结束后流程继续。',
  'pages.job.trigger.usage.workflow.noSignal':
    '本触发器未配置信号名：流程不会等待作业结束。需要等待时，编辑触发器填写「流程信号名」。',
  'pages.job.trigger.usage.workflow.vars':
    '信号变量：jobExecutionId（执行 ID）、jobStatus（执行状态 3-10）、jobSuccess（是否成功）。',
  'pages.job.trigger.fires': '触发记录',
  'pages.job.trigger.fires.title': '触发记录：{name}',
  'pages.job.trigger.fires.column.time': '触发时间',
  'pages.job.trigger.fires.column.result': '结果',
  'pages.job.trigger.fires.column.summary': '来源摘要',
  'pages.job.trigger.fires.column.reason': '跳过 / 失败原因',
  'pages.job.trigger.fires.column.execution': '执行',
  'pages.job.trigger.fires.column.signal': '流程信号',

  // 二期：安全策略
  'pages.job.policy.tab.rules': '高危命令规则',
  'pages.job.policy.tab.global': '全局策略',
  'pages.job.policy.rule.intro':
    '规则按正则（RE2 语法）匹配快速执行的命令与脚本内容；作业模板的 Playbook 不在匹配范围内。',
  'pages.job.policy.rule.create.title': '新建规则',
  'pages.job.policy.rule.edit.title': '编辑规则：{name}',
  'pages.job.policy.rule.draftName': '未命名规则',
  'pages.job.policy.rule.column.pattern': '正则表达式',
  'pages.job.policy.rule.column.action': '命中后',
  'pages.job.policy.rule.form.pattern.extra':
    'RE2 语法，在命令 / 脚本内容中查找；不支持反向引用与环视',
  'pages.job.policy.rule.form.action.1': '拦截：不允许提交',
  'pages.job.policy.rule.form.action.2': '须审批：提交后待审批，通过才执行',
  'pages.job.policy.rule.form.action.3': '仅提醒：提示执行人，不影响提交',
  'pages.job.policy.rule.form.description.extra': '命中时展示给执行人与审批人',
  'pages.job.policy.rule.form.test': '测试这条规则',
  'pages.job.policy.rule.disable.title': '确定停用规则「{name}」？',
  'pages.job.policy.rule.disable.description':
    '停用后这条规则不再参与匹配，原先被它拦截或须审批的命令将可以直接执行。',
  'pages.job.policy.rule.delete.title': '确定删除规则「{name}」？',
  'pages.job.policy.rule.delete.description':
    '删除后无法恢复，原先被它拦截或须审批的命令将可以直接执行。',
  'pages.job.policy.testAll': '测试全部规则',
  'pages.job.policy.test': '测试',
  'pages.job.policy.test.placeholder': '输入一段命令或脚本内容',
  'pages.job.policy.test.hit': '命中 {n} 条',
  'pages.job.policy.test.miss': '未命中',
  'pages.job.policy.global.workflow': '审批流程',
  'pages.job.policy.global.workflow.placeholder':
    '选择流程定义，留空表示未配置',
  'pages.job.policy.global.workflow.extra':
    '需审批的执行按此流程发起，须已启用并发布；未配置时这类提交被拒绝',
  'pages.job.policy.global.workflow.vars':
    '流程可用变量：kind（类型 1-4）、name、host_count、envs、reason、check、trigger（来源 1-4）',
  'pages.job.policy.global.workflow.notReady':
    '{name}（{key}）· 未启用或未发布',
  'pages.job.policy.global.workflow.unset': '未配置审批流程',
  'pages.job.policy.global.workflow.unsaved': '已改选，保存后生效',
  'pages.job.policy.global.workflow.ready': '「{name}」可发起',
  'pages.job.policy.global.workflow.unready':
    '流程当前不可发起（已停用、未发布或已不存在）',
  'pages.job.policy.global.workflow.warning':
    '审批流程不可用：须审批的模板、受保护环境及命中须审批规则的快速执行均无法提交。',
  'pages.job.policy.global.protectedEnvs': '受保护环境',
  'pages.job.policy.global.protectedEnvs.extra':
    'CMDB 环境取值（如 prod），回车添加；目标含这些环境时须审批（预检除外）',
  'pages.job.policy.global.protectedEnvs.rule':
    '至多 {max} 个，每个最多 {len} 个字符',
  'pages.job.policy.global.adhocApproval': '快速执行一律须审批',
  'pages.job.policy.global.adhocApproval.extra':
    '开启后，每次快速执行都须先审批',
  'pages.job.policy.global.maxHosts': '单条执行的主机数上限',
  'pages.job.policy.global.maxHosts.extra':
    '超过上限的目标不能提交；0 表示用系统上限 {max}',
  'pages.job.policy.global.updated': '{name} 更新于 {time}',

  // 二期：执行统计
  'pages.job.stats.days': '统计最近（天）',
  'pages.job.stats.total': '总执行数',
  'pages.job.stats.successRate': '成功率',
  'pages.job.stats.avgDuration': '平均耗时',
  'pages.job.stats.hostRuns': '主机执行次数',
  'pages.job.stats.active': '进行中',
  'pages.job.stats.runners': '在线节点',
  'pages.job.stats.trend': '每日趋势',
  'pages.job.stats.trend.total': '提交',
  'pages.job.stats.trend.success': '成功',
  'pages.job.stats.trend.failed': '失败',
  'pages.job.stats.byStatus': '按状态',
  'pages.job.stats.byKind': '按类型',
  'pages.job.stats.byTrigger': '按触发来源',
  'pages.job.stats.topTemplates': '执行最多的作业模板',
  'pages.job.stats.count': '执行次数',
  'pages.job.stats.failed': '失败次数',

  // 通用拼接与执行主机列
  'pages.job.common.separator': '；',
  'pages.job.common.withCode': '{name}（{code}）',
  'pages.job.execution.hostCol.ok': '成功',
  'pages.job.execution.hostCol.changed': '有变更',
  'pages.job.execution.hostCol.failed': '失败',
  'pages.job.execution.hostCol.unreachable': '不可达',
  'pages.job.execution.hostCol.skipped': '已跳过',
  'pages.job.error.scheduleInvalid': '定时作业配置无效',
  'pages.job.error.triggerInvalid': '触发器配置无效',
};
