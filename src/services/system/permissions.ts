/**
 * 权限目录（前端镜像）：菜单/路由级 + 页面元素级
 * 与后端 backend/core/internal/biz/catalog.go 的目录保持同步，新增菜单或元素两处同改。
 * 用途：角色权限页授权树数据源；元素码经 /api/v1/me 的 elements 下发，
 * 页面元素显隐用 usePermissions() 判定。
 */
import { useModel } from '@umijs/max';
import { useCallback } from 'react';

/** 菜单权限码：与后端目录常量一一对应 */
export type MenuPermissionCode =
  | 'assistant'
  | 'system.user'
  | 'system.role'
  | 'system.login_log'
  | 'system.config'
  | 'notify.channel'
  | 'notify.template'
  | 'notify.route'
  | 'notify.silence'
  | 'notify.subscription'
  | 'notify.producer'
  | 'notify.event'
  | 'notify.dispatch'
  | 'notify.delivery_log'
  | 'notify.dlq';

/** 元素权限码：页面内具体操作（按钮/接口级） */
export type ElementPermissionCode =
  | 'system.user.create'
  | 'system.user.edit'
  | 'system.user.delete'
  | 'system.user.status'
  | 'system.user.reset_password'
  | 'system.user.bind_role'
  | 'system.role.create'
  | 'system.role.edit'
  | 'system.role.delete'
  | 'system.role.grant'
  | 'system.config.edit'
  | 'notify.channel.create'
  | 'notify.channel.edit'
  | 'notify.channel.delete'
  | 'notify.channel.test'
  | 'notify.template.create'
  | 'notify.template.edit'
  | 'notify.template.delete'
  | 'notify.route.create'
  | 'notify.route.edit'
  | 'notify.route.delete'
  | 'notify.silence.create'
  | 'notify.silence.edit'
  | 'notify.silence.delete'
  | 'notify.subscription.upsert'
  | 'notify.subscription.delete'
  | 'notify.producer.create'
  | 'notify.producer.edit'
  | 'notify.producer.rotate'
  | 'notify.producer.delete'
  | 'notify.dlq.replay';

/** 菜单权限定义 */
export interface MenuPermissionDef {
  /** 权限码（后端目录） */
  code: MenuPermissionCode;
  /** 菜单标题 i18n 键（复用侧边栏 menu.* 词条） */
  labelKey: string;
  /** 父级菜单标题 i18n 键（授权树分组展示用） */
  parentKey: string;
}

/** 元素权限定义 */
export interface ElementPermissionDef {
  /** 权限码（后端目录） */
  code: ElementPermissionCode;
  /** 元素标题 i18n 键 */
  labelKey: string;
  /** 所属菜单权限码（授权树父子关系） */
  parentCode: MenuPermissionCode;
}

/** 全量菜单权限目录 */
export const MENU_PERMISSIONS: MenuPermissionDef[] = [
  { code: 'assistant', labelKey: 'menu.assistant', parentKey: 'menu.assistant' },
  { code: 'system.user', labelKey: 'menu.system.user', parentKey: 'menu.system' },
  { code: 'system.role', labelKey: 'menu.system.role', parentKey: 'menu.system' },
  { code: 'system.login_log', labelKey: 'menu.system.login-log', parentKey: 'menu.system' },
  { code: 'system.config', labelKey: 'menu.system.config', parentKey: 'menu.system' },
  { code: 'notify.channel', labelKey: 'menu.notify.channel', parentKey: 'menu.notify' },
  { code: 'notify.template', labelKey: 'menu.notify.template', parentKey: 'menu.notify' },
  { code: 'notify.route', labelKey: 'menu.notify.route', parentKey: 'menu.notify' },
  { code: 'notify.silence', labelKey: 'menu.notify.silence', parentKey: 'menu.notify' },
  { code: 'notify.subscription', labelKey: 'menu.notify.subscription', parentKey: 'menu.notify' },
  { code: 'notify.producer', labelKey: 'menu.notify.producer', parentKey: 'menu.notify' },
  { code: 'notify.event', labelKey: 'menu.notify.event', parentKey: 'menu.notify' },
  { code: 'notify.dispatch', labelKey: 'menu.notify.dispatch', parentKey: 'menu.notify' },
  { code: 'notify.delivery_log', labelKey: 'menu.notify.delivery-log', parentKey: 'menu.notify' },
  { code: 'notify.dlq', labelKey: 'menu.notify.dlq', parentKey: 'menu.notify' },
];

/** 全量元素权限目录 */
export const ELEMENT_PERMISSIONS: ElementPermissionDef[] = [
  { code: 'system.user.create', labelKey: 'permission.system.user.create', parentCode: 'system.user' },
  { code: 'system.user.edit', labelKey: 'permission.system.user.edit', parentCode: 'system.user' },
  { code: 'system.user.status', labelKey: 'permission.system.user.status', parentCode: 'system.user' },
  { code: 'system.user.reset_password', labelKey: 'permission.system.user.reset_password', parentCode: 'system.user' },
  { code: 'system.user.bind_role', labelKey: 'permission.system.user.bind_role', parentCode: 'system.user' },
  { code: 'system.user.delete', labelKey: 'permission.system.user.delete', parentCode: 'system.user' },
  { code: 'system.role.create', labelKey: 'permission.system.role.create', parentCode: 'system.role' },
  { code: 'system.role.edit', labelKey: 'permission.system.role.edit', parentCode: 'system.role' },
  { code: 'system.role.grant', labelKey: 'permission.system.role.grant', parentCode: 'system.role' },
  { code: 'system.role.delete', labelKey: 'permission.system.role.delete', parentCode: 'system.role' },
  { code: 'system.config.edit', labelKey: 'permission.system.config.edit', parentCode: 'system.config' },
  { code: 'notify.channel.create', labelKey: 'permission.notify.channel.create', parentCode: 'notify.channel' },
  { code: 'notify.channel.edit', labelKey: 'permission.notify.channel.edit', parentCode: 'notify.channel' },
  { code: 'notify.channel.delete', labelKey: 'permission.notify.channel.delete', parentCode: 'notify.channel' },
  { code: 'notify.channel.test', labelKey: 'permission.notify.channel.test', parentCode: 'notify.channel' },
  { code: 'notify.template.create', labelKey: 'permission.notify.template.create', parentCode: 'notify.template' },
  { code: 'notify.template.edit', labelKey: 'permission.notify.template.edit', parentCode: 'notify.template' },
  { code: 'notify.template.delete', labelKey: 'permission.notify.template.delete', parentCode: 'notify.template' },
  { code: 'notify.route.create', labelKey: 'permission.notify.route.create', parentCode: 'notify.route' },
  { code: 'notify.route.edit', labelKey: 'permission.notify.route.edit', parentCode: 'notify.route' },
  { code: 'notify.route.delete', labelKey: 'permission.notify.route.delete', parentCode: 'notify.route' },
  { code: 'notify.silence.create', labelKey: 'permission.notify.silence.create', parentCode: 'notify.silence' },
  { code: 'notify.silence.edit', labelKey: 'permission.notify.silence.edit', parentCode: 'notify.silence' },
  { code: 'notify.silence.delete', labelKey: 'permission.notify.silence.delete', parentCode: 'notify.silence' },
  { code: 'notify.subscription.upsert', labelKey: 'permission.notify.subscription.upsert', parentCode: 'notify.subscription' },
  { code: 'notify.subscription.delete', labelKey: 'permission.notify.subscription.delete', parentCode: 'notify.subscription' },
  { code: 'notify.producer.create', labelKey: 'permission.notify.producer.create', parentCode: 'notify.producer' },
  { code: 'notify.producer.edit', labelKey: 'permission.notify.producer.edit', parentCode: 'notify.producer' },
  { code: 'notify.producer.rotate', labelKey: 'permission.notify.producer.rotate', parentCode: 'notify.producer' },
  { code: 'notify.producer.delete', labelKey: 'permission.notify.producer.delete', parentCode: 'notify.producer' },
  { code: 'notify.dlq.replay', labelKey: 'permission.notify.dlq.replay', parentCode: 'notify.dlq' },
];

/** 全量合法权限码集合（菜单码 + 元素码，保存授权时过滤勾选值） */
export const PERMISSION_CODES = new Set<string>(
  [...MENU_PERMISSIONS, ...ELEMENT_PERMISSIONS].map((item) => item.code),
);

/** 菜单权限码集合（授权树菜单勾选 / 选中态过滤） */
export const MENU_PERMISSION_CODES = new Set<string>(
  MENU_PERMISSIONS.map((item) => item.code),
);

/** 元素权限码集合（回显勾选时仅取叶子，父级勾选态由 Tree 级联推导） */
export const ELEMENT_PERMISSION_CODES = new Set<string>(
  ELEMENT_PERMISSIONS.map((item) => item.code),
);

/**
 * 页面元素权限判定：管理员短路放行，普通用户按有效元素码并集判定。
 * 元素码随登录态初始化（/api/v1/me 的 elements），刷新/重登后更新。
 */
export const usePermissions = () => {
  const { initialState } = useModel('@@initialState');
  const isAdmin = initialState?.currentUser?.isAdmin === true;
  const elements = initialState?.elements ?? [];

  return useCallback(
    (code: ElementPermissionCode) => isAdmin || elements.includes(code),
    [isAdmin, elements],
  );
};
