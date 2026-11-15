/**
 * 值班域类型：与后端 api/oncall/v1 的 proto（protojson：camelCase、时间为 RFC3339
 * 字符串、int64 为字符串）一一对应。
 */

/** 分组内身份：0=非成员 1=管理员 2=成员 */
export type OncallMemberRole = 1 | 2;
/** 值班表状态：1=启用 2=停用 */
export type OncallScheduleStatus = 1 | 2;
/** 轮转周期单位：1=天 2=周 */
export type OncallRotationUnit = 1 | 2;
/** 班次角色：1=主值班 2=备值班 */
export type OncallShiftRole = 1 | 2;
/** 班次来源：1=自动排班 2=替班 */
export type OncallShiftSource = 1 | 2;
/** 排班异常：1=无人值班 2=值班人不可用 3=主备同人 4=跨表撞班 5=连续值班过长 */
export type OncallIssueType = 1 | 2 | 3 | 4 | 5;
/** 公共地址范围：1=分组 2=值班表 3=个人 */
export type OncallScopeType = 1 | 2 | 3;

export interface OncallGroup {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  scheduleCount?: number;
  /** 当前用户在组内的身份：0=非成员 1=管理员 2=成员 */
  myRole?: 0 | OncallMemberRole;
  /** 当前用户能否管理本分组（分组管理员或超级管理员） */
  canManage?: boolean;
  createTime?: string;
  updateTime?: string;
}

export interface OncallGroupMember {
  userId: string;
  username: string;
  nickname?: string;
  role: OncallMemberRole;
  /** 用户是否可用（未删除且状态为可用） */
  available?: boolean;
  /** 是否在本分组某张值班表的轮转名单内 */
  inRotation?: boolean;
  createTime?: string;
}

export interface OncallUserCandidate {
  id: string;
  username: string;
  nickname?: string;
}

export interface OncallChangeLog {
  id: string;
  groupId: string;
  scheduleId?: string;
  action: string;
  summary?: string;
  detail?: Record<string, unknown>;
  operatorId?: string;
  operatorName?: string;
  createTime?: string;
}

/** 值班表配置（新建、编辑、预览共用） */
export interface OncallScheduleConfig {
  name: string;
  description?: string;
  /** IANA 时区名 */
  timezone: string;
  rotationUnit: OncallRotationUnit;
  rotationInterval: number;
  /** 轮转起点（首次交接时间），RFC3339 */
  anchorTime: string;
  /** 轮转名单（有序） */
  memberIds?: string[];
  /** 起始人；缺省为名单第一位 */
  startUserId?: string;
  backupEnabled?: boolean;
  horizonDays: number;
  /** 上班提醒提前量（分钟），最多两个 */
  remindMinutes?: number[];
  /** 每日播报时刻 HH:MM；不传则不播报 */
  digestTime?: string;
}

export interface OncallScheduleMember {
  userId: string;
  username: string;
  nickname?: string;
  available?: boolean;
}

export interface OncallSchedule {
  id: string;
  groupId: string;
  groupName?: string;
  config: OncallScheduleConfig;
  members?: OncallScheduleMember[];
  status: OncallScheduleStatus;
  generatedUntil?: string;
  canManage?: boolean;
  createTime?: string;
  updateTime?: string;
}

export interface OncallShift {
  /** 预览结果为空 */
  id?: string;
  scheduleId?: string;
  scheduleName?: string;
  groupId?: string;
  role: OncallShiftRole;
  userId: string;
  userName?: string;
  userAvailable?: boolean;
  startTime: string;
  endTime: string;
  source?: OncallShiftSource;
  originUserId?: string;
  originUserName?: string;
  remark?: string;
}

export interface OncallShiftIssue {
  type: OncallIssueType;
  scheduleId?: string;
  scheduleName?: string;
  groupId?: string;
  userId?: string;
  userName?: string;
  startTime: string;
  endTime: string;
  /** 跨表撞班时的对方值班表（多张时为其中一张） */
  otherScheduleName?: string;
  /** 跨表撞班时对方值班表的数量 */
  otherScheduleCount?: number;
}

export interface OncallCurrentDuty {
  scheduleId: string;
  scheduleName?: string;
  groupId?: string;
  groupName?: string;
  primary?: OncallShift;
  backup?: OncallShift;
  nextHandoverTime?: string;
}

export interface OncallShareLink {
  id: string;
  scopeType: OncallScopeType;
  scopeId: string;
  name: string;
  showPhone?: boolean;
  expireTime?: string;
  lastAccessTime?: string;
  creatorName?: string;
  createTime?: string;
}

export interface OncallPublicShift {
  scheduleName?: string;
  role: OncallShiftRole;
  userName?: string;
  phone?: string;
  startTime: string;
  endTime: string;
  source?: OncallShiftSource;
}

export interface OncallPublicCalendar {
  title?: string;
  /** 分组说明（仅分组范围的地址返回） */
  description?: string;
  scopeType?: OncallScopeType;
  items?: OncallPublicShift[];
}

/** 手动发送的通知类型：1 上班提醒 / 2 每日播报 */
export type OncallNotifyKind = 1 | 2;
/** 上班提醒针对的班次：1 当前班次 / 2 下一个班次 */
export type OncallNotifyTarget = 1 | 2;

/** 手动发送上班提醒的收件人（所选班次的值班人） */
export interface OncallNotifyRecipient {
  role: OncallShiftRole;
  userId: string;
  userName?: string;
  startTime: string;
  endTime: string;
}

/** 一次投递（渠道 → 收件地址）；status：1 待发送 2 发送中 3 已发送 4 失败重试中 5 已放弃 */
export interface OncallNotifyDelivery {
  channelName?: string;
  channelType?: string;
  recipient?: string;
  status: number;
  error?: string;
}

/** 一个通知事件的投递结果；status：1 待路由 2 已路由 3 被静默 4 无匹配路由或渠道 */
export interface OncallNotifyResult {
  eventId: string;
  eventType: string;
  status: number;
  deliveries?: OncallNotifyDelivery[];
}

/** 一类值班通知的配置状态；kind：1 个人通知（上班提醒 / 替班变更 / 排班异常）2 每日播报 */
export interface OncallNotificationStatus {
  kind: 1 | 2;
  eventType: string;
  /** 命中的通知规则；没有命中为空 */
  routeName?: string;
  /** 规则上已启用的渠道数；0（或缺省）表示发不出去 */
  channelCount?: number;
}
