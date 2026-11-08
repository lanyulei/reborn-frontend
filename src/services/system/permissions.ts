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
  | 'system.user'
  | 'system.role'
  | 'system.config';

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
  | 'system.config.edit';

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
  { code: 'system.user', labelKey: 'menu.system.user', parentKey: 'menu.system' },
  { code: 'system.role', labelKey: 'menu.system.role', parentKey: 'menu.system' },
  { code: 'system.config', labelKey: 'menu.system.config', parentKey: 'menu.system' },
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
