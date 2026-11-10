import { describe, expect, it } from 'vitest';
import type { SystemUser } from '@/services/system/typings';
import access from './access';

const adminUser: SystemUser = {
  id: '1',
  username: 'admin',
  nickname: 'Admin User',
  isAdmin: true,
  gender: 'unknown',
  status: 1,
};

const normalUser: SystemUser = {
  id: '2',
  username: 'user',
  nickname: 'Regular User',
  isAdmin: false,
  gender: 'unknown',
  status: 1,
};

describe('access', () => {
  it('should return canAdmin true when user is admin', () => {
    const result = access({ currentUser: adminUser, menus: [] });

    expect(result.canAdmin).toBe(true);
  });

  it('should return canAdmin false when user is not admin', () => {
    const result = access({ currentUser: normalUser, menus: [] });

    expect(result.canAdmin).toBe(false);
  });

  it('should return canAdmin false when isAdmin is undefined', () => {
    // 后端缺省 isAdmin 字段时的防御场景
    const result = access({
      currentUser: {
        id: '3',
        username: 'guest',
        nickname: 'Guest User',
        gender: 'unknown',
        status: 1,
      } as SystemUser,
    });

    expect(result.canAdmin).toBeFalsy();
  });

  it('should return canAdmin false when currentUser is undefined', () => {
    const result = access({ currentUser: undefined });

    expect(result.canAdmin).toBeFalsy();
  });

  it('should return canAdmin false when initialState is undefined', () => {
    const result = access(undefined);

    expect(result.canAdmin).toBeFalsy();
  });

  it('should grant menu access by granted permission codes', () => {
    // 仅授予用户管理：可见用户管理、不可见角色管理
    const result = access({
      currentUser: normalUser,
      menus: ['system.user'],
    });

    expect(result.canSystemUser).toBe(true);
    expect(result.canSystemRole).toBe(false);
  });

  it('should deny all menus when non-admin has empty menus', () => {
    const result = access({ currentUser: normalUser, menus: [] });

    expect(result.canSystemUser).toBe(false);
    expect(result.canSystemRole).toBe(false);
  });

  it('should grant login log access by granted menu code', () => {
    // 仅授予登录日志：可见登录日志、不可见用户管理
    const result = access({
      currentUser: normalUser,
      menus: ['system.login_log'],
    });

    expect(result.canSystemLoginLog).toBe(true);
    expect(result.canSystemUser).toBe(false);
  });

  it('should grant notify channel access by granted menu code', () => {
    // 仅授予通知渠道：可见通知渠道、不可见系统菜单
    const result = access({
      currentUser: normalUser,
      menus: ['notify.channel'],
    });

    expect(result.canNotifyChannel).toBe(true);
    expect(result.canSystemUser).toBe(false);
  });

  it('should grant each notify menu independently by granted code', () => {
    // 通知模块各菜单独立授权：授予配置面 + 运行面各一，未授予的不可见
    const result = access({
      currentUser: normalUser,
      menus: ['notify.route', 'notify.dlq'],
    });

    expect(result.canNotifyRoute).toBe(true);
    expect(result.canNotifyDlq).toBe(true);
    // 其余通知菜单（渠道/模板/静默/订阅/生产者/事件/任务/明细）均未授予
    expect(result.canNotifyChannel).toBe(false);
    expect(result.canNotifyTemplate).toBe(false);
    expect(result.canNotifySilence).toBe(false);
    expect(result.canNotifySubscription).toBe(false);
    expect(result.canNotifyProducer).toBe(false);
    expect(result.canNotifyEvent).toBe(false);
    expect(result.canNotifyDispatch).toBe(false);
    expect(result.canNotifyDeliveryLog).toBe(false);
  });

  it('should open notify tab containers when any child menu is granted', () => {
    // 仅授予发送任务：投递追踪容器可见，通知规则容器不可见
    const result = access({
      currentUser: normalUser,
      menus: ['notify.dispatch'],
    });

    expect(result.canNotifyTrace).toBe(true);
    expect(result.canNotifyDispatch).toBe(true);
    expect(result.canNotifyEvent).toBe(false);
    expect(result.canNotifyRule).toBe(false);
  });

  it('should close notify tab containers when no child menu is granted', () => {
    const result = access({
      currentUser: normalUser,
      menus: ['notify.channel'],
    });

    expect(result.canNotifyRule).toBe(false);
    expect(result.canNotifyTrace).toBe(false);
  });

  it('should grant all menus for admin regardless of permissions', () => {
    const result = access({ currentUser: adminUser, menus: [] });

    expect(result.canSystemUser).toBe(true);
    expect(result.canSystemRole).toBe(true);
  });

  it('should deny menus when permissions is undefined', () => {
    const result = access({ currentUser: normalUser });

    expect(result.canSystemUser).toBeFalsy();
    expect(result.canSystemRole).toBeFalsy();
  });
});
