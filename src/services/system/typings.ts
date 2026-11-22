/**
 * monitor core API 类型定义
 * 来源：backend/core/api/openapi.swagger.json（proto 生成，出参 camelCase，int64 为 string）
 */

/** 角色状态：1=启用 0=禁用 */
export type RoleStatus = 0 | 1;

/** 用户状态：1=可用 2=停用 3=暂停 4=离职 */
export type UserStatus = 1 | 2 | 3 | 4;
/** 账号类型 1=人 2=机器（不能登录，只能被签发短期访问令牌） */
export type UserKind = 1 | 2;

export type Gender = 'male' | 'female' | 'unknown';

/** Role 角色实体（出参）；权限授权另见 GET /role/{id}/permission */
export interface SystemRole {
  id: string;
  name: string;
  code: string;
  status: RoleStatus;
  /** 可管理的通知 biz 列表；空 = 不限。用户可管范围 = 启用角色 scope 并集，任一角色不限即不限 */
  bizScope?: string[];
  /** 内置角色（迁移预置）：不可删除，编辑/授权仅超管；新建用户自动绑定且不可解绑 */
  builtin?: boolean;
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

/** 部门状态：1=启用 0=停用 */
export type DeptStatus = 0 | 1;

/** DeptLeader 部门负责人（用户展示信息的只读视图） */
export interface DeptLeader {
  userId: string;
  username: string;
  nickname: string;
  /** 头像地址；空 = 未设置 */
  avatar?: string;
  /** 用户状态；非可用的负责人在流程中会被跳过 */
  status: UserStatus;
}

/** Dept 部门实体（出参） */
export interface SystemDept {
  id: string;
  /** 上级部门 ID；空 = 根部门 */
  parentId?: string;
  name: string;
  /** 部门编码；空 = 未设置 */
  code?: string;
  /** 同级排序值，升序 */
  sort?: number;
  status: DeptStatus;
  description?: string;
  /** 部门负责人，按配置顺序 */
  leaders?: DeptLeader[];
  /** 直属成员数（不含下级部门） */
  memberCount?: number;
  createTime?: string;
  updateTime?: string;
}

/** UserDept 用户所属部门（主部门在前） */
export interface UserDept {
  id: string;
  name: string;
  isPrimary?: boolean;
}

/** DeptMember 部门成员（最小披露的用户视图） */
export interface DeptMember {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  status: UserStatus;
  /** 该用户的全部所属部门（主部门在前） */
  depts?: UserDept[];
}

/** UserDeptAssignment 用户所属部门整组替换载荷（空列表 = 不属于任何部门） */
export interface UserDeptAssignment {
  /** 所属部门 ID 全集，去重、最多 20 个 */
  deptIds: string[];
  /** 主部门 ID，须在 deptIds 内；不传时取第一个 */
  primaryDeptId?: string;
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
  /** 账号类型：1=人 2=机器（不能登录，只能被签发短期访问令牌） */
  kind?: UserKind;
  /** 头像地址；空 = 未设置 */
  avatar?: string;
  /** 所属部门（主部门在前）；仅用户详情与用户列表填充 */
  depts?: UserDept[];
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

/** CreateMachineUser 新建机器账号入参 */
export interface CreateMachineUserParams {
  /** 3-64 位字母/数字/下划线/中划线 */
  username: string;
  /** 1-64 位 */
  nickname: string;
  /** 绑定的角色，至少一个 */
  roleIds: string[];
}
