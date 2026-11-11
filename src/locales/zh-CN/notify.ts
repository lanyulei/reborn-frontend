/** 通知管理模块页面文案（渠道 / 路由 / 静默 / 模板 / 订阅 / 来源 / 投递追踪） */
export default {
  // 跨页共用
  'pages.notify.common.channelOption': '{name}（{type}）',
  'pages.notify.common.biz': '业务',
  'pages.notify.common.biz.tooltip':
    '业务租户标识，按 biz 隔离路由/配额/模板解析；留空 = default',
  'pages.notify.common.biz.tooltip.restricted':
    '仅可在角色授予的通知业务范围内创建',
  'pages.notify.common.biz.tooltip.readonly': '业务租户标识，创建后不可修改',
  'pages.notify.common.biz.placeholder': '留空 = default',
  'pages.notify.common.biz.filterPlaceholder': '业务标识（精确）',
  'pages.notify.common.bizIdRule': '1-64 位小写字母/数字/下划线/连字符',
  'pages.notify.common.eventPattern': '事件匹配模式',
  'pages.notify.common.eventPattern.rule':
    '精确 / 前缀通配（monitor.alert.*）/ 全匹配（*）',
  'pages.notify.common.channel': '渠道',
  'pages.notify.common.deliveryChannel': '投递渠道',
  'pages.notify.common.eventId': '事件 ID',
  'pages.notify.common.eventId.placeholder': '按事件下钻（精确）',
  'pages.notify.common.dispatchId': '任务 ID',
  'pages.notify.common.dispatchId.placeholder': '按任务下钻（精确）',
  'pages.notify.common.recipient': '收件目标',
  'pages.notify.common.attempts': '尝试次数',
  'pages.notify.common.failReason': '失败原因',
  'pages.notify.common.viewDispatch': '查看任务',
  'pages.notify.common.viewDeliveryLog': '查看明细',
  'pages.notify.common.unlimited': '不限',
  'pages.notify.common.zeroUnlimited': '0 = 不限',
  'pages.notify.common.noDuplicate': '条目不可重复',
  'pages.notify.common.recipientLength': '每个收件人 1-255 位',

  // 通知渠道
  'pages.notify.channel.create.title': '新建渠道',
  'pages.notify.channel.edit.title': '编辑渠道：{name}',
  'pages.notify.channel.column.name': '渠道名称',
  'pages.notify.channel.column.type': '类型',
  'pages.notify.channel.column.config': '配置摘要',
  'pages.notify.channel.config.atMobiles': '@ {count} 个手机号',
  'pages.notify.channel.action.test': '测试',
  'pages.notify.channel.delete.title': '删除渠道',
  'pages.notify.channel.delete.description':
    '仍被路由引用的渠道需先从路由解绑；删除后名称可复用，历史投递记录不受影响，确定删除？',
  'pages.notify.channel.form.name.placeholder': '1-128 位，同业务内唯一',
  'pages.notify.channel.form.type': '渠道类型',
  'pages.notify.channel.form.type.tooltip':
    '决定配置结构与发送适配器，创建后不可修改',
  'pages.notify.channel.form.type.readonlyTooltip':
    '创建后不可修改，更换类型请新建渠道',
  'pages.notify.channel.form.host': 'SMTP 服务器',
  'pages.notify.channel.form.host.placeholder': '如 smtp.example.com',
  'pages.notify.channel.form.port': '端口',
  'pages.notify.channel.form.username': '认证用户名',
  'pages.notify.channel.form.fromAddr': '发件人地址',
  'pages.notify.channel.form.url': '目标地址',
  'pages.notify.channel.form.url.https': '必须以 https:// 开头',
  'pages.notify.channel.form.headers': '附加请求头',
  'pages.notify.channel.form.headers.tooltip':
    '随出站请求携带的鉴权头等，最多 16 对',
  'pages.notify.channel.form.headers.add': '添加请求头',
  'pages.notify.channel.form.headers.key': '名称',
  'pages.notify.channel.form.headers.value': '值',
  'pages.notify.channel.form.timeout': '出站超时（秒）',
  'pages.notify.channel.form.timeout.tooltip': '1-10 秒；后端缺省 5',
  'pages.notify.channel.form.timeout.required': '请输入出站超时（1-10 秒）',
  'pages.notify.channel.form.atMobiles': '@ 提醒手机号',
  'pages.notify.channel.form.atMobiles.tooltip':
    '可选，最多 20 个、每个 5-32 位',
  'pages.notify.channel.form.atMobiles.placeholder': '输入手机号后回车，可多个',
  'pages.notify.channel.form.atMobiles.max': '最多 20 个',
  'pages.notify.channel.form.atMobiles.length': '每个手机号 5-32 位',
  'pages.notify.channel.form.secret.editPlaceholder':
    '留空保留原凭据，填写即轮换',
  'pages.notify.channel.form.signSecret': '签名密钥',
  'pages.notify.channel.form.signSecret.tooltip':
    '钉钉「加签」/ 飞书「签名校验」密钥，可选；只写不读',
  'pages.notify.channel.form.signSecret.editPlaceholder':
    '留空保留原密钥，填写即轮换',
  'pages.notify.channel.form.signSecret.placeholder': '可选，1-512 位',
  'pages.notify.channel.form.clearSignSecret': '清除签名密钥',
  'pages.notify.channel.form.clearSignSecret.tooltip':
    '开启后保存将停用加签（忽略上方输入）',
  'pages.notify.channel.form.qps': '限流 QPS',
  'pages.notify.channel.form.burst': '突发上限',
  'pages.notify.channel.test.title': '发送测试事件：{name}',
  'pages.notify.channel.test.defaultTitle': '通知渠道连通性测试',
  'pages.notify.channel.test.submit': '发送',
  'pages.notify.channel.test.created': '测试事件已创建',
  'pages.notify.channel.test.eventType': '事件类型',
  'pages.notify.channel.test.eventType.tooltip':
    '需有路由 event_pattern 覆盖该类型且渠道集合含本实例，才会实际投递',
  'pages.notify.channel.test.eventType.rule':
    '小写字母/数字开头的点分串，最长 128 位',
  'pages.notify.channel.test.eventTitle': '事件标题',
  'pages.notify.channel.test.recipients': '指定收件人',
  'pages.notify.channel.test.recipients.tooltip':
    '留空 = 交路由按收件策略解析（与生产事件同链路）',
  'pages.notify.channel.test.recipients.placeholder':
    '邮箱/群标识，回车确认，最多 20 个',
  'pages.notify.channel.test.recipients.max': '最多 20 个',
  'pages.notify.channel.test.payload': '附加载荷（JSON）',
  'pages.notify.channel.test.payload.tooltip':
    '可选，合并进事件 payload 的 test 上下文',
  'pages.notify.channel.test.payload.object': '须为 JSON 对象',
  'pages.notify.channel.test.payload.invalid': 'JSON 格式不正确',
  'pages.notify.channel.test.result.desc':
    '事件已进入异步投递链路（路由 → 模板 → 发送），可在「投递追踪」按事件 ID 查看发送任务与投递明细：',

  // 通知路由
  'pages.notify.route.create.title': '新建路由',
  'pages.notify.route.edit.title': '编辑路由：{name}',
  'pages.notify.route.column.severityMin': '严重级下限',
  'pages.notify.route.column.priority': '优先级',
  'pages.notify.route.column.recipient': '收件策略',
  'pages.notify.route.recipient.fixed': '固定 {count}',
  'pages.notify.route.recipient.subscription': '订阅者',
  'pages.notify.route.delete.title': '删除路由',
  'pages.notify.route.delete.description':
    '删除后在途发送任务照常完成，确定删除？',
  'pages.notify.route.form.severityMin.tooltip':
    '事件严重级 ≥ 下限才命中；缺省 1（提示）',
  'pages.notify.route.form.severityMin.placeholder': '缺省 1（提示）',
  'pages.notify.route.form.priority.tooltip':
    '1-9，1 最高；多条路由命中时取最高优先级，缺省 5',
  'pages.notify.route.form.priority.placeholder': '缺省 5',
  'pages.notify.route.form.tags': '标签匹配',
  'pages.notify.route.form.tags.tooltip':
    'payload 标签全部相等才命中（AND），最多 16 对；不填 = 无条件',
  'pages.notify.route.form.tags.add': '添加标签条件',
  'pages.notify.route.form.tags.key': '键',
  'pages.notify.route.form.tags.value': '值',
  'pages.notify.route.form.channels': '目标渠道',
  'pages.notify.route.form.channels.tooltip':
    '命中的渠道实例集合（须与路由同业务），每个启用渠道并发生成任务',
  'pages.notify.route.form.channels.placeholder': '选择渠道，1-50 个',
  'pages.notify.route.form.recipientFixed': '固定收件人',
  'pages.notify.route.form.recipientFixed.tooltip':
    '邮件地址/群标识；邮件渠道必须由固定收件人或订阅者提供地址，Webhook 与群机器人以实例自身为收件可留空',
  'pages.notify.route.form.recipientFixed.placeholder.email':
    '邮件渠道需要收件地址：输入后回车确认，最多 100 个',
  'pages.notify.route.form.recipientFixed.placeholder':
    '可选：输入后回车确认，最多 100 个',
  'pages.notify.route.form.recipientFixed.required':
    '含邮件渠道：请配置固定收件人，或开启「追加订阅者」',
  'pages.notify.route.form.recipientFixed.max': '最多 100 个',
  'pages.notify.route.form.recipientSubscription': '追加订阅者',
  'pages.notify.route.form.recipientSubscription.tooltip':
    '按用户订阅偏好与路由渠道类型的交集解析订阅者，与固定收件人去重',
  'pages.notify.route.form.aggregateWindow': '聚合窗口（秒）',
  'pages.notify.route.form.aggregateWindow.tooltip':
    '0 = 不聚合（缺省）；>0 须 30-300，事件带分组键时聚合微批',
  'pages.notify.route.form.aggregateWindow.placeholder': '缺省 0',
  'pages.notify.route.form.aggregateWindow.rule': '0 或 30-300',
  'pages.notify.route.form.suppressThreshold': '聚合抑制阈值',
  'pages.notify.route.form.suppressThreshold.tooltip':
    '分组计数超过后汇总转摘要模式，缺省 500',
  'pages.notify.route.form.suppressThreshold.placeholder': '缺省 500',
  'pages.notify.route.form.suppressDuration': '抑制时长（分钟）',
  'pages.notify.route.form.suppressDuration.tooltip':
    '超阈值后同分组键的静默窗口，缺省 30',
  'pages.notify.route.form.suppressDuration.placeholder': '缺省 30',

  // 通知静默
  'pages.notify.silence.create.title': '新建静默规则',
  'pages.notify.silence.edit.title': '编辑静默规则：{name}',
  'pages.notify.silence.column.severityMax': '严重级上限',
  'pages.notify.silence.column.timeWindow': '时间窗',
  'pages.notify.silence.window.summary': '{start}-{end}（{tz}）',
  'pages.notify.silence.window.always': '全程',
  'pages.notify.silence.delete.title': '删除静默规则',
  'pages.notify.silence.delete.description':
    '删除后该规则不再参与匹配，确定删除？',
  'pages.notify.silence.form.severityMax.tooltip':
    '该级及以下的事件才可被静默；缺省 2（警告）',
  'pages.notify.silence.form.severityMax.placeholder': '缺省 2（警告）',
  'pages.notify.silence.form.windowEnabled': '限制时间窗',
  'pages.notify.silence.form.windowEnabled.tooltip':
    '关闭 = 全程静默；更新保存时关闭即清除时间窗',
  'pages.notify.silence.form.windowStart': '窗口起点',
  'pages.notify.silence.form.windowStart.tooltip':
    '24 小时制 HH:MM，支持跨午夜（如 22:00→08:00 覆盖夜间）',
  'pages.notify.silence.form.windowEnd': '窗口终点',
  'pages.notify.silence.form.windowEnd.sameAsStart': '终点不能与起点相同',
  'pages.notify.silence.form.tz': '时区',
  'pages.notify.silence.form.tz.tooltip': 'IANA 时区名，缺省 UTC',
  'pages.notify.silence.form.tz.rule': 'IANA 时区名，如 Asia/Shanghai',

  // 通知模板
  'pages.notify.template.create.title': '新建模板',
  'pages.notify.template.edit.title': '编辑模板：{name}',
  'pages.notify.template.search.placeholder': '事件类型 / 渠道 / 标题',
  'pages.notify.template.column.eventType': '事件类型',
  'pages.notify.template.column.channelType': '渠道类型',
  'pages.notify.template.column.subject': '标题模板',
  'pages.notify.template.column.version': '版本',
  'pages.notify.template.delete.title': '删除模板',
  'pages.notify.template.delete.description':
    '删除后三维组合可复用，历史投递记录不受影响，确定删除？',
  'pages.notify.template.form.eventType.tooltip':
    "精确匹配或 '*' 通配；'*' 之外的值为小写字母/数字开头的点分串",
  'pages.notify.template.form.eventType.placeholder':
    'monitor.alert.firing 或 *',
  'pages.notify.template.form.eventType.rule':
    "'*' 或小写字母/数字开头的点分串，最长 128 位",
  'pages.notify.template.form.channelType.tooltip':
    "三维覆盖的渠道维度，可选 '*' 通配",
  'pages.notify.template.form.subject.tooltip':
    '邮件主题/机器人标题，Go template 语法',
  'pages.notify.template.form.subject.placeholder': '告警：{title}',
  'pages.notify.template.form.body': '正文模板',
  'pages.notify.template.form.body.tooltip.title': 'Go template 语法',
  'pages.notify.template.form.body.tooltip.content':
    '可用变量：Title / Payload / Severity / Count / Samples / BizID / EventTime',
  'pages.notify.template.form.body.placeholder': '事件：{title}\n业务：{biz}',

  // 订阅管理
  'pages.notify.subscription.create.title': '新建订阅',
  'pages.notify.subscription.edit.title': '编辑订阅：{name}',
  'pages.notify.subscription.column.userId': '订阅人',
  'pages.notify.subscription.column.userId.tooltip':
    '用户 ID（本人或管理员代管）',
  'pages.notify.subscription.column.userId.placeholder':
    '用户 ID（缺省查本人）',
  'pages.notify.subscription.column.channelPrefs': '渠道偏好',
  'pages.notify.subscription.prefWithTarget': '{channel}：{target}',
  'pages.notify.subscription.delete.title': '删除订阅',
  'pages.notify.subscription.delete.description':
    '删除后同键可重建，确定删除？',
  'pages.notify.subscription.form.userId.tooltip':
    '留空 = 本人；指定他人须管理员（代管）',
  'pages.notify.subscription.form.userId.placeholder': '留空 = 本人',
  'pages.notify.subscription.form.userId.rule': '用户 ID 为 UUID 格式',
  'pages.notify.subscription.form.biz.tooltip':
    '订阅按业务隔离匹配；留空 = default',
  'pages.notify.subscription.form.eventPattern.tooltip':
    '精确 / 前缀通配（monitor.alert.*）/ 全匹配（*），与路由同式',
  'pages.notify.subscription.form.prefs.title': '渠道偏好（至少一项）',
  'pages.notify.subscription.form.email.tooltip':
    '订阅后收件地址取用户资料邮箱',
  'pages.notify.subscription.form.pref.none': '不订阅',
  'pages.notify.subscription.form.pref.subscribed': '订阅',
  'pages.notify.subscription.form.pref.subscribedDefault': '订阅（默认绑定）',
  'pages.notify.subscription.form.pref.target': '指定目标群',
  'pages.notify.subscription.form.target.label': '{channel}目标群',
  'pages.notify.subscription.form.target.tooltip':
    '机器人目标群标识，如 $group:ops',
  'pages.notify.subscription.form.target.placeholder':
    '选择「指定目标群」后填写',
  'pages.notify.subscription.msg.atLeastOne': '请至少为一个渠道配置订阅偏好',

  // 事件来源
  'pages.notify.producer.create.title': '新建来源',
  'pages.notify.producer.edit.title': '编辑来源：{name}',
  'pages.notify.producer.column.name': '名称',
  'pages.notify.producer.column.whitelist': '事件白名单',
  'pages.notify.producer.column.limit': '接入限速',
  'pages.notify.producer.column.limit.tooltip':
    '每秒 / 每日（UTC）接入事件上限，超限 429',
  'pages.notify.producer.column.expireTime': '过期时间',
  'pages.notify.producer.neverExpire': '永不过期',
  'pages.notify.producer.limit.perSecond': '{n}/秒',
  'pages.notify.producer.limit.perDay': '{n}/日',
  'pages.notify.producer.limit.summary': '{qps} · {daily}',
  'pages.notify.producer.rotate.title': '轮换令牌',
  'pages.notify.producer.rotate.description':
    '旧令牌立即失效（≤10s 生效），新令牌仅展示一次，确定轮换？',
  'pages.notify.producer.rotate.success': '轮换成功',
  'pages.notify.producer.delete.title': '删除来源',
  'pages.notify.producer.delete.description':
    '删除后令牌随之作废（名称可复用），确定删除？',
  'pages.notify.producer.form.name.tooltip': '同业务内未删除行唯一',
  'pages.notify.producer.form.name.placeholder': '1-64 位',
  'pages.notify.producer.form.whitelist': '事件类型白名单',
  'pages.notify.producer.form.whitelist.tooltip':
    '空 = 不限事件类型（令牌范围仍限定业务）；条目为事件模式',
  'pages.notify.producer.form.whitelist.placeholder':
    'monitor.alert.*（回车确认，最多 32 项）',
  'pages.notify.producer.form.whitelist.max': '最多 32 项',
  'pages.notify.producer.form.qpsLimit': '每秒接入上限',
  'pages.notify.producer.form.qpsLimit.tooltip':
    '管道 ingress 按来源计数，超限 429；0 = 不限',
  'pages.notify.producer.form.dailyLimit': '每日接入上限',
  'pages.notify.producer.form.dailyLimit.tooltip': '按 UTC 日计数；0 = 不限',
  'pages.notify.producer.form.expireTime.tooltip':
    '留空 = 永不过期；更新保存时留空即清除过期时间',
  'pages.notify.producer.token.title': '接入令牌：{name}',
  'pages.notify.producer.token.ok': '我已保存',
  'pages.notify.producer.token.warning':
    '令牌仅此一次展示：落库只存哈希，任何接口不可再取，丢失只能轮换重发，请立即妥善保存。',
  'pages.notify.producer.token.hint':
    '数据面接入：Authorization: HMAC {id}:{sig}:{ts}（±5 分钟防重放）',

  // 通知事件
  'pages.notify.event.column.eventType': '事件类型',
  'pages.notify.event.column.eventType.placeholder': '事件类型（精确）',
  'pages.notify.event.column.title': '标题',
  'pages.notify.event.column.severity': '严重级',
  'pages.notify.event.column.status': '路由状态',
  'pages.notify.event.column.publishState': '发布状态',
  'pages.notify.event.column.source': '来源',
  'pages.notify.event.column.publishAttempts': '发布尝试',
  'pages.notify.event.column.createTime': '落库时间',
  'pages.notify.event.detail.nextPublishTime': '下次发布时间',
  'pages.notify.event.detail.dedupKey': '去重指纹',
  'pages.notify.event.detail.groupKey': '聚合分组键',
  'pages.notify.event.detail.recipients': '显式收件',
  'pages.notify.event.detail.recipients.empty': '—（走路由收件策略解析）',
  'pages.notify.event.detail.payload': '载荷',
  'pages.notify.event.detail.payload.empty': '—（无载荷）',

  // 发送任务
  'pages.notify.dispatch.column.channel.placeholder': '目标渠道',
  'pages.notify.dispatch.column.nextRetry': '下次重试',
  'pages.notify.dispatch.column.lastError': '最近失败原因',
  'pages.notify.dispatch.column.createTime': '生成时间',
  'pages.notify.dispatch.detail.pending': '—（发送时渲染）',
  'pages.notify.dispatch.detail.sendKey': '幂等键',
  'pages.notify.dispatch.detail.template': '渲染模板',
  'pages.notify.dispatch.detail.template.default': '内置默认模板',
  'pages.notify.dispatch.detail.agg': '聚合汇总',
  'pages.notify.dispatch.detail.agg.count': '{count} 条事件',
  'pages.notify.dispatch.detail.agg.digest': '摘要模式（超阈值，不列明细）',
  'pages.notify.dispatch.detail.agg.samples': '样本 {count} 条',
  'pages.notify.dispatch.detail.agg.single': '—（单事件）',
  'pages.notify.dispatch.detail.subject': '渲染标题',
  'pages.notify.dispatch.detail.body': '渲染正文',
  'pages.notify.dispatch.detail.raw': '原始快照',
  'pages.notify.dispatch.detail.raw.empty': '—（无快照）',

  // 死信队列
  'pages.notify.dlq.column.replayState': '重放状态',
  'pages.notify.dlq.column.createTime': '转入时间',
  'pages.notify.dlq.replay.action': '标记重放',
  'pages.notify.dlq.replay.description':
    '死信 worker 将重新生成发送任务，确定标记？',
  'pages.notify.dlq.replay.success': '已标记待重放',

  // 投递明细
  'pages.notify.deliveryLog.column.ok': '结果',
  'pages.notify.deliveryLog.column.attempt': '第几次尝试',
  'pages.notify.deliveryLog.column.latency': '耗时',
  'pages.notify.deliveryLog.latency.ms': '{ms} ms',
  'pages.notify.deliveryLog.column.providerMsgId': '渠道消息标识',
  'pages.notify.deliveryLog.column.createTime': '落库时间',
};
