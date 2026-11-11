/**
 * notify API 类型定义
 * 来源：backend/core/api/notify/v1/*.proto（channel/template/route/silence/
 * subscription/producer/event/dispatch/delivery_log/dead_letter；
 * proto 生成，出参 camelCase，int64 为 string）
 * 分页契约 PageQuery/PagedResult 复用 services/system/typings。
 */

/** 渠道类型（proto 枚举字符串值），决定配置结构与管道侧适配器；创建后不可改 */
export type NotifyChannelType =
  | 'NOTIFY_CHANNEL_TYPE_EMAIL'
  | 'NOTIFY_CHANNEL_TYPE_WEBHOOK'
  | 'NOTIFY_CHANNEL_TYPE_DINGTALK'
  | 'NOTIFY_CHANNEL_TYPE_WECOM'
  | 'NOTIFY_CHANNEL_TYPE_FEISHU';

/** EmailChannelConfig 邮件渠道配置（type=EMAIL）；secret 为 SMTP 密码（必传） */
export interface EmailChannelConfig {
  /** SMTP 服务器地址，1-253 位 */
  host: string;
  /** SMTP 端口，1-65535 */
  port: number;
  /** SMTP 认证用户名，≤64 位 */
  username: string;
  /** 发件人地址，邮箱格式 */
  fromAddr: string;
  /** 是否使用 STARTTLS */
  starttls: boolean;
}

/** WebhookChannelConfig Webhook 渠道配置（type=WEBHOOK，仅 HTTPS）；secret 为 HMAC-SHA256 签名密钥（可选） */
export interface WebhookChannelConfig {
  /** 目标地址，必须以 https:// 开头 */
  url: string;
  /** 请求方法，v1 仅支持 POST */
  method: string;
  /** 附加请求头（如鉴权头），最多 16 对 */
  headers?: Record<string, string>;
  /** 出站超时秒数，1-10 */
  timeoutS?: number;
}

/** RobotChannelConfig 群机器人渠道配置（type=DINGTALK/WECOM/FEISHU）；secret 为机器人凭据（必传） */
export interface RobotChannelConfig {
  /** 需要 @ 提醒的手机号列表，最多 20 项、每项 5-32 位 */
  atMobiles?: string[];
}

/** NotifyRateLimit 令牌桶限流参数；qps=0/burst=0 表示不限（适配器层仍受通道默认配额约束） */
export interface NotifyRateLimit {
  /** 每秒补充令牌速率，int64 字符串 */
  qps: string;
  /** 令牌桶容量（突发上限），int64 字符串 */
  burst: string;
}

/** NotifyChannel 渠道实体（出参；secret 只写不读，任何响应恒不返回） */
export interface NotifyChannel {
  /** 渠道唯一标识（UUIDv7） */
  id: string;
  /** 业务租户标识；路由与配额按 biz 隔离 */
  bizId: string;
  type: NotifyChannelType;
  /** 渠道展示名，同 biz 未删除行内唯一，1-128 位 */
  name: string;
  /** 邮件配置（type=EMAIL 时返回） */
  email?: EmailChannelConfig;
  /** Webhook 配置（type=WEBHOOK 时返回） */
  webhook?: WebhookChannelConfig;
  /** 群机器人配置（type=DINGTALK/WECOM/FEISHU 时返回） */
  robot?: RobotChannelConfig;
  rateLimit?: NotifyRateLimit;
  /** 启用状态；停用后管道路由匹配跳过（≤10s 生效） */
  enabled: boolean;
  createTime?: string;
  updateTime?: string;
}

/** 通知严重级：1 info / 2 warning / 3 critical / 4 fatal（事件、路由下限、静默上限共用） */
export type NotifySeverity = 1 | 2 | 3 | 4;

/** 事件匹配模式：精确 / 前缀通配（'monitor.alert.*'）/ 全匹配（'*'），路由/静默/订阅/生产者白名单同式 */
export type NotifyEventPattern = string;

/** 模板渠道维度：渠道类型（小写）或 '*' 通配（与渠道类型枚举不同体系） */
export type NotifyTemplateChannelType =
  | '*'
  | 'email'
  | 'webhook'
  | 'dingtalk'
  | 'wecom'
  | 'feishu';

/** NotifyTemplate 通知模板实体：按 biz × event_type × channel_type 三维覆盖（'*' 通配） */
export interface NotifyTemplate {
  /** 模板唯一标识（UUIDv7） */
  id: string;
  /** 业务租户标识；渲染解析链按 biz 隔离 */
  bizId: string;
  /** 事件类型精确匹配或 '*' 通配 */
  eventType: string;
  /** 渠道类型（email/webhook/dingtalk/wecom/feishu）或 '*' 通配 */
  channelType: NotifyTemplateChannelType;
  /** 标题模板（Go template，1-255 位） */
  subject: string;
  /** 正文模板（Go template，1-32768 位） */
  body: string;
  /** 模板版本号，创建为 1，每次更新 +1 */
  version: number;
  /** 启用状态；停用后解析链跳过 */
  enabled: boolean;
  createTime?: string;
  updateTime?: string;
}

/** RouteRecipient 收件策略：fixed 先生成、订阅者按渠道偏好追加，至少启用其一 */
export interface RouteRecipient {
  /** 固定收件人列表（email 地址/群标识；机器人与 webhook 实例自身隐含收件），≤100 项 */
  fixed?: string[];
  /** 是否追加订阅者（按用户 channel_prefs 与路由实例类型交集解析） */
  subscription?: boolean;
}

/** NotifyRoute 通知路由实体（spec 字段平铺；更新时 spec 整组替换） */
export interface NotifyRoute {
  /** 路由唯一标识（UUIDv7） */
  id: string;
  /** 业务租户标识；路由匹配与渠道绑定按 biz 隔离 */
  bizId: string;
  /** 事件匹配模式：精确 / 前缀通配（'monitor.alert.*'）/ 全匹配（'*'） */
  eventPattern: NotifyEventPattern;
  /** 严重级下限（1-4） */
  severityMin: number;
  /** payload 标签匹配条件（扁平键值全部相等才命中）；未设置表示无条件 */
  tagMatch?: Record<string, string>;
  /** 优先级 1-9，1 最高；多条路由命中时取最高优先级 */
  priority: number;
  /** 命中的渠道实例集合（同 biz），并发分发互不影响 */
  channelIds: string[];
  /** 收件策略 */
  recipient: RouteRecipient;
  /** 聚合窗口秒数；0=不聚合，>0 且事件带 groupKey 时聚合微批 */
  aggregateWindowS: number;
  /** 聚合抑制阈值：分组计数超过后汇总转摘要模式 */
  suppressThreshold: number;
  /** 抑制时长（分钟）：超阈值后同 groupKey 静默窗口 */
  suppressDurationM: number;
  /** 启用状态；停用后不参与匹配 */
  enabled: boolean;
  createTime?: string;
  updateTime?: string;
}

/** SilenceWindow 免打扰时间窗：支持跨午夜（如 22:00→08:00），时区缺省 UTC */
export interface SilenceWindow {
  /** 窗口起点，24 小时制 HH:MM */
  start: string;
  /** 窗口终点，24 小时制 HH:MM（与 start 相同表示零长窗口，非法） */
  end: string;
  /** IANA 时区名（如 Asia/Shanghai），缺省 UTC */
  tz?: string;
}

/** NotifySilence 静默规则实体（更新时 spec 整组替换，enabled 独立启停） */
export interface NotifySilence {
  /** 静默规则唯一标识（UUIDv7） */
  id: string;
  /** 业务租户标识；静默匹配按 biz 隔离 */
  bizId: string;
  /** 事件匹配模式 */
  eventPattern: NotifyEventPattern;
  /** 严重级上限（1-4），该级及以下的事件才可被静默 */
  severityMax: number;
  /** 免打扰时间窗；未设置表示全程静默 */
  timeWindow?: SilenceWindow;
  /** 启用状态；停用后不参与匹配 */
  enabled: boolean;
  createTime?: string;
  updateTime?: string;
}

/** SubscriptionPref 单渠道订阅偏好：恰设其一——subscribed（订阅开关）或 target（机器人目标群标识） */
export interface SubscriptionPref {
  subscribed?: boolean;
  /** 机器人目标群标识（如 '$group:ops'）；地址类渠道不用 */
  target?: string;
}

/** NotifySubscription 用户订阅实体：自然键 (user_id, biz_id, event_pattern) 唯一，保存为 Upsert 语义 */
export interface NotifySubscription {
  /** 订阅唯一标识（UUIDv7） */
  id: string;
  /** 订阅人用户 ID */
  userId: string;
  /** 业务租户标识；订阅匹配按 biz 隔离 */
  bizId: string;
  /** 事件匹配模式，与路由同式 */
  eventPattern: NotifyEventPattern;
  /** 渠道偏好：key 为可订阅渠道类型（email/dingtalk/wecom/feishu，webhook 除外） */
  channelPrefs: Record<string, SubscriptionPref>;
  /** 启用状态；停用后订阅者解析跳过 */
  enabled: boolean;
  createTime?: string;
  updateTime?: string;
}

/** NotifyProducer 通知生产者实体（token 与哈希任何接口不回显） */
export interface NotifyProducer {
  /** 生产者唯一标识（UUIDv7） */
  id: string;
  /** 生产者名称；同 biz 未删除行内唯一 */
  name: string;
  /** 业务租户标识；token scope 限定 biz，创建后不可改 */
  bizId: string;
  /** 事件类型白名单；空 = 不限 */
  eventWhitelist?: string[];
  /** 过期时间；未设置 = 永不过期 */
  expireTime?: string;
  /** 启用状态；停用后 ingress 拒绝接入（≤10s 生效） */
  enabled: boolean;
  /** 每秒接入事件上限，0 = 不限；管道 ingress 按生产者计数，超限 429 */
  qpsLimit: number;
  /** 每日（UTC）接入事件上限，0 = 不限 */
  dailyLimit: number;
  createTime?: string;
  updateTime?: string;
}

/** 事件路由状态：1 received / 2 routed / 3 suppressed / 4 failed */
export type NotifyEventStatus = 1 | 2 | 3 | 4;

/** NATS 发布状态：0 pending / 1 published */
export type NotifyPublishState = 0 | 1;

/** NotifyEvent 通知事件实体（append-only 运行数据，仅排障检索） */
export interface NotifyEvent {
  /** 事件唯一标识（UUIDv7） */
  id: string;
  /** 业务租户标识 */
  bizId: string;
  /** 事件类型，如 monitor.alert.firing */
  eventType: string;
  /** 严重级：1 info / 2 warning / 3 critical / 4 fatal */
  severity: NotifySeverity;
  /** 事件标题 */
  title: string;
  /** JSON 载荷；未设置表示无载荷 */
  payload?: Record<string, unknown>;
  /** 重复指纹（幂等去重用）；未设置表示无 */
  dedupKey?: string;
  /** 聚合分组键；未设置表示不聚合 */
  groupKey?: string;
  /** 显式收件列表；空=走路由解析 */
  recipients?: string[];
  /** 事件来源：api（生产者经 ingress）/ internal（core 同事务直插） */
  source: string;
  /** 路由状态 */
  status: NotifyEventStatus;
  /** NATS 发布状态 */
  publishState: NotifyPublishState;
  /** NATS 发布尝试次数（失败退避累加） */
  publishAttempts: number;
  /** 下次发布时间（退避后）；未设置表示无待发布 */
  nextPublishTime?: string;
  /** 落库时间（分区键） */
  createTime?: string;
}

/** 发送任务状态：1 pending / 2 sending / 3 sent / 4 failed（重试中）/ 5 dead（死信） */
export type NotifyDispatchStatus = 1 | 2 | 3 | 4 | 5;

/**
 * DispatchContentSnapshot 发送任务渲染快照（管道写入的 jsonb，键为 snake_case）：
 * 路由命中时写入模板引用与聚合上下文，渠道发送前回填 subject/body。
 */
export interface DispatchContentSnapshot {
  /** 渲染后的标题（发送前为空） */
  subject?: string;
  /** 渲染后的正文（发送前为空） */
  body?: string;
  /** 渲染所用模板标识；空 = 内置默认模板 */
  template_id?: string;
  template_version?: number;
  /** 聚合汇总上下文（仅聚合窗口关闭产出的汇总任务） */
  agg?: {
    count: number;
    samples?: { event_id: string; title: string; severity: number }[];
    /** 超阈值摘要模式（不列明细） */
    digest?: boolean;
  };
}

/** NotifyDispatch 发送任务实体（事件 × 渠道 × 收件人，状态机由管道 sender 推进） */
export interface NotifyDispatch {
  /** 任务唯一标识（UUIDv7） */
  id: string;
  /** 源事件标识（notify_event.id，下钻维度） */
  eventId: string;
  /** 目标渠道实例标识（notify_channel.id） */
  channelId: string;
  /** 收件目标：邮箱/群标识/webhook url/用户ID */
  recipient: string;
  /** 渲染用模板版本；未设置表示无模板（纯文本通知） */
  templateId?: string;
  /** 渲染快照（排障复现用）；未设置表示无快照 */
  content?: DispatchContentSnapshot;
  /** 任务状态 */
  status: NotifyDispatchStatus;
  /** 已尝试次数（失败重试累加） */
  attempts: number;
  /** 下次重试时间（指数退避后）；未设置表示无待重试 */
  nextRetryTime?: string;
  /** 最近一次失败原因；未设置表示未失败 */
  lastError?: string;
  /** 对外幂等键 sha256(event|channel|recipient) 截断；接收端去重用 */
  sendKey: string;
  /** 生成时间（分区键） */
  createTime?: string;
}

/** NotifyDeliveryLog 投递明细实体（一次投递尝试的结果，append-only） */
export interface NotifyDeliveryLog {
  /** 日志唯一标识（UUIDv7） */
  id: string;
  /** 所属发送任务标识（notify_dispatch.id，下钻维度） */
  dispatchId: string;
  /** 投递渠道实例标识 */
  channelId: string;
  /** 第几次尝试（从 1 起，与发送任务 attempts 对齐） */
  attempt: number;
  /** 本次尝试是否成功 */
  ok: boolean;
  /** 本次投递耗时（毫秒） */
  latencyMs: number;
  /** 渠道侧消息标识；未设置表示渠道未返回 */
  providerMsgId?: string;
  /** 本次失败原因；未设置表示成功 */
  error?: string;
  /** 落库时间（分区键） */
  createTime?: string;
}

/** 死信重放状态：1 none / 2 pending（已标记待重放）/ 3 replayed（已重放） */
export type NotifyReplayState = 1 | 2 | 3;

/** 运行表检索公共查询：时间范围下/上界（RFC3339，含端点，start ≤ end） */
export interface NotifyTimeRangeQuery {
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** NotifyDeadLetter 死信实体（sender 重试超限后写入；id = 转死信的 dispatch id） */
export interface NotifyDeadLetter {
  /** 死信行标识（= 转死信的 dispatch id） */
  id: string;
  /** 死信来源发送任务标识 */
  dispatchId: string;
  /** 源事件标识（重放时引用它生成新 dispatch） */
  eventId: string;
  /** 投递渠道实例标识 */
  channelId: string;
  /** 收件目标：邮箱/群标识/webhook url/用户ID */
  recipient: string;
  /** 转死信时的最近失败原因；未设置表示无 */
  lastError?: string;
  /** 累计尝试次数（重试上限 5 次后转入） */
  attempts: number;
  /** 重放状态 */
  replayState: NotifyReplayState;
  /** 转入死信时间 */
  createTime?: string;
  /** 最近状态变更时间 */
  updateTime?: string;
}
