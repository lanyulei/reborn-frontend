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
