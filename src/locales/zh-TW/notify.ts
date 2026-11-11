/** 通知管理模組頁面文案（頻道 / 路由 / 靜默 / 範本 / 訂閱 / 來源 / 投遞追蹤） */
export default {
  // 跨頁共用
  'pages.notify.common.channelOption': '{name}（{type}）',
  'pages.notify.common.biz': '業務',
  'pages.notify.common.biz.tooltip':
    '業務租戶標識，按 biz 隔離路由/配額/範本解析；留空 = default',
  'pages.notify.common.biz.tooltip.restricted':
    '僅可在角色授予的通知業務範圍內建立',
  'pages.notify.common.biz.tooltip.readonly': '業務租戶標識，建立後不可修改',
  'pages.notify.common.biz.placeholder': '留空 = default',
  'pages.notify.common.biz.filterPlaceholder': '業務標識（精確）',
  'pages.notify.common.bizIdRule': '1-64 位小寫字母/數字/底線/連字號',
  'pages.notify.common.eventPattern': '事件匹配模式',
  'pages.notify.common.eventPattern.rule':
    '精確 / 前綴萬用（monitor.alert.*）/ 全匹配（*）',
  'pages.notify.common.channel': '頻道',
  'pages.notify.common.deliveryChannel': '投遞頻道',
  'pages.notify.common.eventId': '事件 ID',
  'pages.notify.common.eventId.placeholder': '按事件下鑽（精確）',
  'pages.notify.common.dispatchId': '任務 ID',
  'pages.notify.common.dispatchId.placeholder': '按任務下鑽（精確）',
  'pages.notify.common.recipient': '收件目標',
  'pages.notify.common.attempts': '嘗試次數',
  'pages.notify.common.failReason': '失敗原因',
  'pages.notify.common.viewDispatch': '查看任務',
  'pages.notify.common.viewDeliveryLog': '查看明細',
  'pages.notify.common.unlimited': '不限',
  'pages.notify.common.zeroUnlimited': '0 = 不限',
  'pages.notify.common.noDuplicate': '條目不可重複',
  'pages.notify.common.recipientLength': '每個收件人 1-255 位',

  // 通知頻道
  'pages.notify.channel.create.title': '新建頻道',
  'pages.notify.channel.edit.title': '編輯頻道：{name}',
  'pages.notify.channel.column.name': '頻道名稱',
  'pages.notify.channel.column.type': '類型',
  'pages.notify.channel.column.config': '設定摘要',
  'pages.notify.channel.config.atMobiles': '@ {count} 個手機號',
  'pages.notify.channel.action.test': '測試',
  'pages.notify.channel.delete.title': '刪除頻道',
  'pages.notify.channel.delete.description':
    '仍被路由引用的頻道需先從路由解除綁定；刪除後名稱可重用，歷史投遞記錄不受影響，確定刪除？',
  'pages.notify.channel.form.name.placeholder': '1-128 位，同業務內唯一',
  'pages.notify.channel.form.type': '頻道類型',
  'pages.notify.channel.form.type.tooltip':
    '決定設定結構與發送適配器，建立後不可修改',
  'pages.notify.channel.form.type.readonlyTooltip':
    '建立後不可修改，更換類型請新建頻道',
  'pages.notify.channel.form.host': 'SMTP 伺服器',
  'pages.notify.channel.form.host.placeholder': '如 smtp.example.com',
  'pages.notify.channel.form.port': '連接埠',
  'pages.notify.channel.form.username': '認證使用者名稱',
  'pages.notify.channel.form.fromAddr': '寄件人地址',
  'pages.notify.channel.form.url': '目標地址',
  'pages.notify.channel.form.url.https': '必須以 https:// 開頭',
  'pages.notify.channel.form.headers': '附加請求標頭',
  'pages.notify.channel.form.headers.tooltip':
    '隨出站請求攜帶的鑑權標頭等，最多 16 對',
  'pages.notify.channel.form.headers.add': '新增請求標頭',
  'pages.notify.channel.form.headers.key': '名稱',
  'pages.notify.channel.form.headers.value': '值',
  'pages.notify.channel.form.timeout': '出站逾時（秒）',
  'pages.notify.channel.form.timeout.tooltip': '1-10 秒；後端預設 5',
  'pages.notify.channel.form.timeout.required': '請輸入出站逾時（1-10 秒）',
  'pages.notify.channel.form.atMobiles': '@ 提醒手機號',
  'pages.notify.channel.form.atMobiles.tooltip':
    '可選，最多 20 個、每個 5-32 位',
  'pages.notify.channel.form.atMobiles.placeholder':
    '輸入手機號後按 Enter，可多個',
  'pages.notify.channel.form.atMobiles.max': '最多 20 個',
  'pages.notify.channel.form.atMobiles.length': '每個手機號 5-32 位',
  'pages.notify.channel.form.secret.editPlaceholder':
    '留空保留原憑證，填寫即輪換',
  'pages.notify.channel.form.signSecret': '簽章金鑰',
  'pages.notify.channel.form.signSecret.tooltip':
    '釘釘「加簽」/ 飛書「簽章校驗」金鑰，可選；只寫不讀',
  'pages.notify.channel.form.signSecret.editPlaceholder':
    '留空保留原金鑰，填寫即輪換',
  'pages.notify.channel.form.signSecret.placeholder': '可選，1-512 位',
  'pages.notify.channel.form.clearSignSecret': '清除簽章金鑰',
  'pages.notify.channel.form.clearSignSecret.tooltip':
    '開啟後儲存將停用加簽（忽略上方輸入）',
  'pages.notify.channel.form.qps': '限流 QPS',
  'pages.notify.channel.form.burst': '突發上限',
  'pages.notify.channel.test.title': '發送測試事件：{name}',
  'pages.notify.channel.test.defaultTitle': '通知頻道連通性測試',
  'pages.notify.channel.test.submit': '發送',
  'pages.notify.channel.test.created': '測試事件已建立',
  'pages.notify.channel.test.eventType': '事件類型',
  'pages.notify.channel.test.eventType.tooltip':
    '需有路由 event_pattern 覆蓋該類型且頻道集合含本實例，才會實際投遞',
  'pages.notify.channel.test.eventType.rule':
    '小寫字母/數字開頭的點分串，最長 128 位',
  'pages.notify.channel.test.eventTitle': '事件標題',
  'pages.notify.channel.test.recipients': '指定收件人',
  'pages.notify.channel.test.recipients.tooltip':
    '留空 = 交路由按收件策略解析（與生產事件同鏈路）',
  'pages.notify.channel.test.recipients.placeholder':
    '電子郵件/群標識，按 Enter 確認，最多 20 個',
  'pages.notify.channel.test.recipients.max': '最多 20 個',
  'pages.notify.channel.test.payload': '附加載荷（JSON）',
  'pages.notify.channel.test.payload.tooltip':
    '可選，合併進事件 payload 的 test 上下文',
  'pages.notify.channel.test.payload.object': '須為 JSON 物件',
  'pages.notify.channel.test.payload.invalid': 'JSON 格式不正確',
  'pages.notify.channel.test.result.desc':
    '事件已進入非同步投遞鏈路（路由 → 範本 → 發送），可在「投遞追蹤」按事件 ID 查看發送任務與投遞明細：',

  // 通知路由
  'pages.notify.route.create.title': '新建路由',
  'pages.notify.route.edit.title': '編輯路由：{name}',
  'pages.notify.route.column.severityMin': '嚴重級下限',
  'pages.notify.route.column.priority': '優先級',
  'pages.notify.route.column.recipient': '收件策略',
  'pages.notify.route.recipient.fixed': '固定 {count}',
  'pages.notify.route.recipient.subscription': '訂閱者',
  'pages.notify.route.delete.title': '刪除路由',
  'pages.notify.route.delete.description':
    '刪除後在途發送任務照常完成，確定刪除？',
  'pages.notify.route.form.severityMin.tooltip':
    '事件嚴重級 ≥ 下限才命中；預設 1（提示）',
  'pages.notify.route.form.severityMin.placeholder': '預設 1（提示）',
  'pages.notify.route.form.priority.tooltip':
    '1-9，1 最高；多條路由命中時取最高優先級，預設 5',
  'pages.notify.route.form.priority.placeholder': '預設 5',
  'pages.notify.route.form.tags': '標籤匹配',
  'pages.notify.route.form.tags.tooltip':
    'payload 標籤全部相等才命中（AND），最多 16 對；不填 = 無條件',
  'pages.notify.route.form.tags.add': '新增標籤條件',
  'pages.notify.route.form.tags.key': '鍵',
  'pages.notify.route.form.tags.value': '值',
  'pages.notify.route.form.channels': '目標頻道',
  'pages.notify.route.form.channels.tooltip':
    '命中的頻道實例集合（須與路由同業務），每個啟用頻道並行產生任務',
  'pages.notify.route.form.channels.placeholder': '選擇頻道，1-50 個',
  'pages.notify.route.form.recipientFixed': '固定收件人',
  'pages.notify.route.form.recipientFixed.tooltip':
    '電子郵件地址/群標識；郵件頻道必須由固定收件人或訂閱者提供地址，Webhook 與群機器人以實例自身為收件可留空',
  'pages.notify.route.form.recipientFixed.placeholder.email':
    '郵件頻道需要收件地址：輸入後按 Enter 確認，最多 100 個',
  'pages.notify.route.form.recipientFixed.placeholder':
    '可選：輸入後按 Enter 確認，最多 100 個',
  'pages.notify.route.form.recipientFixed.required':
    '含郵件頻道：請設定固定收件人，或開啟「追加訂閱者」',
  'pages.notify.route.form.recipientFixed.max': '最多 100 個',
  'pages.notify.route.form.recipientSubscription': '追加訂閱者',
  'pages.notify.route.form.recipientSubscription.tooltip':
    '按使用者訂閱偏好與路由頻道類型的交集解析訂閱者，與固定收件人去重',
  'pages.notify.route.form.aggregateWindow': '聚合視窗（秒）',
  'pages.notify.route.form.aggregateWindow.tooltip':
    '0 = 不聚合（預設）；>0 須 30-300，事件帶分組鍵時聚合微批',
  'pages.notify.route.form.aggregateWindow.placeholder': '預設 0',
  'pages.notify.route.form.aggregateWindow.rule': '0 或 30-300',
  'pages.notify.route.form.suppressThreshold': '聚合抑制閾值',
  'pages.notify.route.form.suppressThreshold.tooltip':
    '分組計數超過後匯總轉摘要模式，預設 500',
  'pages.notify.route.form.suppressThreshold.placeholder': '預設 500',
  'pages.notify.route.form.suppressDuration': '抑制時長（分鐘）',
  'pages.notify.route.form.suppressDuration.tooltip':
    '超閾值後同分組鍵的靜默視窗，預設 30',
  'pages.notify.route.form.suppressDuration.placeholder': '預設 30',

  // 通知靜默
  'pages.notify.silence.create.title': '新建靜默規則',
  'pages.notify.silence.edit.title': '編輯靜默規則：{name}',
  'pages.notify.silence.column.severityMax': '嚴重級上限',
  'pages.notify.silence.column.timeWindow': '時間視窗',
  'pages.notify.silence.window.summary': '{start}-{end}（{tz}）',
  'pages.notify.silence.window.always': '全程',
  'pages.notify.silence.delete.title': '刪除靜默規則',
  'pages.notify.silence.delete.description':
    '刪除後該規則不再參與匹配，確定刪除？',
  'pages.notify.silence.form.severityMax.tooltip':
    '該級及以下的事件才可被靜默；預設 2（警告）',
  'pages.notify.silence.form.severityMax.placeholder': '預設 2（警告）',
  'pages.notify.silence.form.windowEnabled': '限制時間視窗',
  'pages.notify.silence.form.windowEnabled.tooltip':
    '關閉 = 全程靜默；更新儲存時關閉即清除時間視窗',
  'pages.notify.silence.form.windowStart': '視窗起點',
  'pages.notify.silence.form.windowStart.tooltip':
    '24 小時制 HH:MM，支援跨午夜（如 22:00→08:00 覆蓋夜間）',
  'pages.notify.silence.form.windowEnd': '視窗終點',
  'pages.notify.silence.form.windowEnd.sameAsStart': '終點不能與起點相同',
  'pages.notify.silence.form.tz': '時區',
  'pages.notify.silence.form.tz.tooltip': 'IANA 時區名，預設 UTC',
  'pages.notify.silence.form.tz.rule': 'IANA 時區名，如 Asia/Shanghai',

  // 通知範本
  'pages.notify.template.create.title': '新建範本',
  'pages.notify.template.edit.title': '編輯範本：{name}',
  'pages.notify.template.search.placeholder': '事件類型 / 頻道 / 標題',
  'pages.notify.template.column.eventType': '事件類型',
  'pages.notify.template.column.channelType': '頻道類型',
  'pages.notify.template.column.subject': '標題範本',
  'pages.notify.template.column.version': '版本',
  'pages.notify.template.delete.title': '刪除範本',
  'pages.notify.template.delete.description':
    '刪除後三維組合可重用，歷史投遞記錄不受影響，確定刪除？',
  'pages.notify.template.form.eventType.tooltip':
    "精確匹配或 '*' 萬用；'*' 之外的值為小寫字母/數字開頭的點分串",
  'pages.notify.template.form.eventType.placeholder':
    'monitor.alert.firing 或 *',
  'pages.notify.template.form.eventType.rule':
    "'*' 或小寫字母/數字開頭的點分串，最長 128 位",
  'pages.notify.template.form.channelType.tooltip':
    "三維覆蓋的頻道維度，可選 '*' 萬用",
  'pages.notify.template.form.subject.tooltip':
    '郵件主旨/機器人標題，Go template 語法',
  'pages.notify.template.form.subject.placeholder': '告警：{title}',
  'pages.notify.template.form.body': '內文範本',
  'pages.notify.template.form.body.tooltip.title': 'Go template 語法',
  'pages.notify.template.form.body.tooltip.content':
    '可用變數：Title / Payload / Severity / Count / Samples / BizID / EventTime',
  'pages.notify.template.form.body.placeholder': '事件：{title}\n業務：{biz}',

  // 訂閱管理
  'pages.notify.subscription.create.title': '新建訂閱',
  'pages.notify.subscription.edit.title': '編輯訂閱：{name}',
  'pages.notify.subscription.column.userId': '訂閱人',
  'pages.notify.subscription.column.userId.tooltip':
    '使用者 ID（本人或管理員代管）',
  'pages.notify.subscription.column.userId.placeholder':
    '使用者 ID（預設查本人）',
  'pages.notify.subscription.column.channelPrefs': '頻道偏好',
  'pages.notify.subscription.prefWithTarget': '{channel}：{target}',
  'pages.notify.subscription.delete.title': '刪除訂閱',
  'pages.notify.subscription.delete.description':
    '刪除後同鍵可重建，確定刪除？',
  'pages.notify.subscription.form.userId.tooltip':
    '留空 = 本人；指定他人須管理員（代管）',
  'pages.notify.subscription.form.userId.placeholder': '留空 = 本人',
  'pages.notify.subscription.form.userId.rule': '使用者 ID 為 UUID 格式',
  'pages.notify.subscription.form.biz.tooltip':
    '訂閱按業務隔離匹配；留空 = default',
  'pages.notify.subscription.form.eventPattern.tooltip':
    '精確 / 前綴萬用（monitor.alert.*）/ 全匹配（*），與路由同式',
  'pages.notify.subscription.form.prefs.title': '頻道偏好（至少一項）',
  'pages.notify.subscription.form.email.tooltip':
    '訂閱後收件地址取使用者資料的電子郵件',
  'pages.notify.subscription.form.pref.none': '不訂閱',
  'pages.notify.subscription.form.pref.subscribed': '訂閱',
  'pages.notify.subscription.form.pref.subscribedDefault': '訂閱（預設綁定）',
  'pages.notify.subscription.form.pref.target': '指定目標群',
  'pages.notify.subscription.form.target.label': '{channel}目標群',
  'pages.notify.subscription.form.target.tooltip':
    '機器人目標群標識，如 $group:ops',
  'pages.notify.subscription.form.target.placeholder':
    '選擇「指定目標群」後填寫',
  'pages.notify.subscription.msg.atLeastOne': '請至少為一個頻道設定訂閱偏好',

  // 事件來源
  'pages.notify.producer.create.title': '新建來源',
  'pages.notify.producer.edit.title': '編輯來源：{name}',
  'pages.notify.producer.column.name': '名稱',
  'pages.notify.producer.column.whitelist': '事件白名單',
  'pages.notify.producer.column.limit': '接入限速',
  'pages.notify.producer.column.limit.tooltip':
    '每秒 / 每日（UTC）接入事件上限，超限 429',
  'pages.notify.producer.column.expireTime': '過期時間',
  'pages.notify.producer.neverExpire': '永不過期',
  'pages.notify.producer.limit.perSecond': '{n}/秒',
  'pages.notify.producer.limit.perDay': '{n}/日',
  'pages.notify.producer.limit.summary': '{qps} · {daily}',
  'pages.notify.producer.rotate.title': '輪換權杖',
  'pages.notify.producer.rotate.description':
    '舊權杖立即失效（≤10s 生效），新權杖僅顯示一次，確定輪換？',
  'pages.notify.producer.rotate.success': '輪換成功',
  'pages.notify.producer.delete.title': '刪除來源',
  'pages.notify.producer.delete.description':
    '刪除後權杖隨之作廢（名稱可重用），確定刪除？',
  'pages.notify.producer.form.name.tooltip': '同業務內未刪除行唯一',
  'pages.notify.producer.form.name.placeholder': '1-64 位',
  'pages.notify.producer.form.whitelist': '事件類型白名單',
  'pages.notify.producer.form.whitelist.tooltip':
    '空 = 不限事件類型（權杖範圍仍限定業務）；條目為事件模式',
  'pages.notify.producer.form.whitelist.placeholder':
    'monitor.alert.*（按 Enter 確認，最多 32 項）',
  'pages.notify.producer.form.whitelist.max': '最多 32 項',
  'pages.notify.producer.form.qpsLimit': '每秒接入上限',
  'pages.notify.producer.form.qpsLimit.tooltip':
    '管道 ingress 按來源計數，超限 429；0 = 不限',
  'pages.notify.producer.form.dailyLimit': '每日接入上限',
  'pages.notify.producer.form.dailyLimit.tooltip': '按 UTC 日計數；0 = 不限',
  'pages.notify.producer.form.expireTime.tooltip':
    '留空 = 永不過期；更新儲存時留空即清除過期時間',
  'pages.notify.producer.token.title': '接入權杖：{name}',
  'pages.notify.producer.token.ok': '我已儲存',
  'pages.notify.producer.token.warning':
    '權杖僅此一次顯示：落庫只存雜湊，任何介面不可再取，遺失只能輪換重發，請立即妥善儲存。',
  'pages.notify.producer.token.hint':
    '資料面接入：Authorization: HMAC {id}:{sig}:{ts}（±5 分鐘防重放）',

  // 通知事件
  'pages.notify.event.column.eventType': '事件類型',
  'pages.notify.event.column.eventType.placeholder': '事件類型（精確）',
  'pages.notify.event.column.title': '標題',
  'pages.notify.event.column.severity': '嚴重級',
  'pages.notify.event.column.status': '路由狀態',
  'pages.notify.event.column.publishState': '發布狀態',
  'pages.notify.event.column.source': '來源',
  'pages.notify.event.column.publishAttempts': '發布嘗試',
  'pages.notify.event.column.createTime': '落庫時間',
  'pages.notify.event.detail.nextPublishTime': '下次發布時間',
  'pages.notify.event.detail.dedupKey': '去重指紋',
  'pages.notify.event.detail.groupKey': '聚合分組鍵',
  'pages.notify.event.detail.recipients': '顯式收件',
  'pages.notify.event.detail.recipients.empty': '—（走路由收件策略解析）',
  'pages.notify.event.detail.payload': '載荷',
  'pages.notify.event.detail.payload.empty': '—（無載荷）',

  // 發送任務
  'pages.notify.dispatch.column.channel.placeholder': '目標頻道',
  'pages.notify.dispatch.column.nextRetry': '下次重試',
  'pages.notify.dispatch.column.lastError': '最近失敗原因',
  'pages.notify.dispatch.column.createTime': '產生時間',
  'pages.notify.dispatch.detail.pending': '—（發送時渲染）',
  'pages.notify.dispatch.detail.sendKey': '冪等鍵',
  'pages.notify.dispatch.detail.template': '渲染範本',
  'pages.notify.dispatch.detail.template.default': '內建預設範本',
  'pages.notify.dispatch.detail.agg': '聚合匯總',
  'pages.notify.dispatch.detail.agg.count': '{count} 條事件',
  'pages.notify.dispatch.detail.agg.digest': '摘要模式（超閾值，不列明細）',
  'pages.notify.dispatch.detail.agg.samples': '樣本 {count} 條',
  'pages.notify.dispatch.detail.agg.single': '—（單事件）',
  'pages.notify.dispatch.detail.subject': '渲染標題',
  'pages.notify.dispatch.detail.body': '渲染內文',
  'pages.notify.dispatch.detail.raw': '原始快照',
  'pages.notify.dispatch.detail.raw.empty': '—（無快照）',

  // 死信佇列
  'pages.notify.dlq.column.replayState': '重放狀態',
  'pages.notify.dlq.column.createTime': '轉入時間',
  'pages.notify.dlq.replay.action': '標記重放',
  'pages.notify.dlq.replay.description':
    '死信 worker 將重新產生發送任務，確定標記？',
  'pages.notify.dlq.replay.success': '已標記待重放',

  // 投遞明細
  'pages.notify.deliveryLog.column.ok': '結果',
  'pages.notify.deliveryLog.column.attempt': '第幾次嘗試',
  'pages.notify.deliveryLog.column.latency': '耗時',
  'pages.notify.deliveryLog.latency.ms': '{ms} ms',
  'pages.notify.deliveryLog.column.providerMsgId': '頻道訊息標識',
  'pages.notify.deliveryLog.column.createTime': '落庫時間',
};
