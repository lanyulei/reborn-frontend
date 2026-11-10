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
  // 通知模块 Tab 容器页：任一子页可见即可进入容器（Tab 级再按子页权限过滤）
  const canNotifyRule =
    has('notify.route') || has('notify.silence') || has('notify.template');
  const canNotifyTrace =
    has('notify.event') ||
    has('notify.dispatch') ||
    has('notify.delivery_log') ||
    has('notify.dlq');
  return {
    canAdmin: isAdmin,
    canSystemUser: has('system.user'),
    canSystemRole: has('system.role'),
    canSystemLoginLog: has('system.login_log'),
    canSystemConfig: has('system.config'),
    canNotifyChannel: has('notify.channel'),
    canNotifyTemplate: has('notify.template'),
    canNotifyRoute: has('notify.route'),
    canNotifySilence: has('notify.silence'),
    canNotifySubscription: has('notify.subscription'),
    canNotifyProducer: has('notify.producer'),
    canNotifyEvent: has('notify.event'),
    canNotifyDispatch: has('notify.dispatch'),
    canNotifyDeliveryLog: has('notify.delivery_log'),
    canNotifyDlq: has('notify.dlq'),
    canNotifyRule,
    canNotifyTrace,
  };
}
