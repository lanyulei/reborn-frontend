/**
 * @see https://umijs.org/docs/max/access#access
 * 菜单/路由级权限：菜单码由 /api/v1/me 的 menus 下发（启用角色并集），
 * isAdmin 用户直接放行全部菜单；权限码目录见 services/system/permissions.ts。
 * */
import type { MenuPermissionCode } from '@/services/system/permissions';
import type { SystemUser } from '@/services/system/typings';

export default function access(
  initialState:
    | {
        currentUser?: SystemUser;
        menus?: string[];
      }
    | undefined,
) {
  const { currentUser, menus } = initialState ?? {};
  const isAdmin = currentUser?.isAdmin === true;
  const has = (code: MenuPermissionCode) =>
    isAdmin || (menus ?? []).includes(code);
  return {
    canAdmin: isAdmin,
    canSystemUser: has('system.user'),
    canSystemRole: has('system.role'),
    canSystemConfig: has('system.config'),
  };
}
