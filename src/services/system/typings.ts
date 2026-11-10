/**
 * monitor core API 类型定义
 * 来源：backend/core/api/openapi.swagger.json（proto 生成，出参 camelCase，int64 为 string）
 */

/** 角色状态：1=启用 0=禁用 */
export type RoleStatus = 0 | 1;

/** 用户状态：1=可用 2=停用 3=暂停 4=离职 */
export type UserStatus = 1 | 2 | 3 | 4;

export type Gender = 'male' | 'female' | 'unknown';

/** Role 角色实体（出参）；权限授权另见 GET /role/{id}/permission */
export interface SystemRole {
  id: string;
  name: string;
  code: string;
  status: RoleStatus;
  /** 可管理的通知 biz 列表；空 = 不限。用户可管范围 = 启用角色 scope 并集，任一角色不限即不限 */
  bizScope?: string[];
  createTime?: string;
  updateTime?: string;
}

/** RoleGrant 角色三类直接授权（GET/PUT /role/{id}/permission 的出入参） */
export interface RoleGrant {
  /** 菜单（页面）码，如 system.user；仅控前端页面可见性，不产生接口授权 */
  menus: string[];
  /** 页面元素码，如 system.user.create；仅控前端元素可见性，不产生接口授权 */
  elements: string[];
  /** 接口操作 code（32 位 md5 hex，取自 /system/operations）直接授权——后端接口校验只认此项 */
  apis: string[];
}

/** Operation 可授权接口操作条目（权限目录内联） */
export interface Operation {
  /** proto full method，如 /system.v1.UserService/CreateUser；仅供展示与排查 */
  name: string;
  /** 操作稳定标识 = md5(name) 的 32 位小写 hex；授权存储与回传统一用此值 */
  code: string;
  /** 中文显示名（取自 rpc 的 system.v1.title 注解），恒中文 */
  title: string;
  /** HTTP 接口地址（rpc 的 google.api.http 主绑定，如 /api/v1/system/user；未标注为空串） */
  path: string;
  /** HTTP 接口方法 GET/POST/PUT/DELETE/PATCH（custom 绑定为自定义方法名；未标注为空串） */
  method: string;
}

/** CatalogElement 目录页面元素及其绑定的接口 */
export interface CatalogElement {
  code: string;
  name: string;
  operations: Operation[];
}

/** CatalogMenu 目录菜单：页面默认接口 + 页面元素清单 */
export interface CatalogMenu {
  code: string;
  name: string;
  defaultOperations: Operation[];
  elements: CatalogElement[];
}

/** SystemConfig 系统全局配置（GET/PUT /system/config 的出入参） */
export interface SystemConfig {
  /** 系统标题（顶栏/标签页/登录页），空串表示未配置（前端回退默认） */
  title: string;
  /** 系统子标题，空串表示未配置 */
  subTitle: string;
  /** 系统 logo 图片 URL，空串表示未配置 */
  logo: string;
  /** 页脚文案，空串表示未配置 */
  footer: string;
}

/** User 用户实体（出参，不含密码） */
export interface SystemUser {
  id: string;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  gender: Gender;
  isAdmin: boolean;
  status: UserStatus;
  createTime?: string;
  updateTime?: string;
}

/** 登录结果：1=成功 2=用户不存在 3=密码错误 4=账号禁用 5=签发令牌失败（对外登录接口 2/3 统一口径防枚举，细分值仅供审计检索） */
export type LoginLogResult = 1 | 2 | 3 | 4 | 5;

/** LoginLog 登录日志实体（append-only 审计，由登录链路自动落库，无写接口） */
export interface LoginLog {
  /** 日志唯一标识（UUIDv7） */
  id: string;
  /** 用户 ID；用户不存在的失败尝试为空串 */
  userId: string;
  /** 尝试的登录名原文 */
  username: string;
  result: LoginLogResult;
  /** 客户端 IP，未取到为空串 */
  ip: string;
  /** 客户端 User-Agent，未取到为空串 */
  userAgent: string;
  /** 登录尝试时间 */
  createTime?: string;
}

/** 通用分页查询参数 */
export interface PageQuery {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页数量，1-100 */
  pageSize?: number;
  /** 关键字，模糊匹配 */
  keyword?: string;
}

/** 分页响应（total 为 int64 字符串） */
export interface PagedResult<T> {
  items: T[];
  total: string;
}
