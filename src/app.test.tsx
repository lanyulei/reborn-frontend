import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all heavy dependencies before importing app
const mockReplace = vi.fn();
const mockHistory = {
  location: {
    pathname: '/home',
    search: '',
    hash: '',
  },
  replace: mockReplace,
};

const mockGetLoginProfile = vi.fn();

vi.mock('@umijs/max', () => ({
  history: mockHistory,
  Link: ({ children }: any) => children,
}));

vi.mock('@/services/system/auth', () => ({
  getLoginProfile: mockGetLoginProfile,
}));

vi.mock('@/components', () => ({
  AvatarDropdown: () => null,
  ErrorBoundary: ({ children }: any) => children,
  Footer: () => null,
  GlobalChat: () => null,
  LangDropdown: () => null,
  OfflineBanner: () => null,
}));

vi.mock('@ant-design/pro-components', () => ({
  SettingDrawer: () => null,
}));

vi.mock('./requestErrorConfig', () => ({
  errorConfig: {},
}));

vi.mock('../config/defaultSettings', () => ({
  default: { navTheme: 'light' },
}));

const testUser = {
  id: '1',
  username: 'admin',
  nickname: 'Test User',
  isAdmin: true,
  gender: 'unknown' as const,
  status: 1 as const,
};

describe('app getInitialState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistory.location = {
      pathname: '/home',
      search: '',
      hash: '',
    };
  });

  it('should fetch login profile when not on login page', async () => {
    const { getInitialState } = await import('./app');
    mockGetLoginProfile.mockResolvedValue({
      user: testUser,
      roles: [],
    });

    const state = await getInitialState();

    expect(mockGetLoginProfile).toHaveBeenCalled();
    expect(state.currentUser).toEqual(testUser);
    expect(state.roles).toEqual([]);
    expect(state.settingDrawerOpen).toBe(false);
    expect(state.fetchUserInfo).toBeDefined();
  });

  it('should redirect to login when profile fetch fails (401)', async () => {
    const { getInitialState } = await import('./app');
    mockGetLoginProfile.mockRejectedValue(new Error('401 Unauthorized'));

    const state = await getInitialState();

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('/user/login?redirect='),
    );
    expect(state.currentUser).toBeUndefined();
  });

  it('should not fetch profile on login page', async () => {
    const { getInitialState } = await import('./app');
    mockHistory.location = {
      pathname: '/user/login',
      search: '',
      hash: '',
    };

    const state = await getInitialState();

    expect(mockGetLoginProfile).not.toHaveBeenCalled();
    expect(state.currentUser).toBeUndefined();
    expect(state.fetchUserInfo).toBeDefined();
  });

  it('should encode redirect path correctly on 401', async () => {
    const { getInitialState } = await import('./app');
    mockHistory.location = {
      pathname: '/system/user',
      search: '?page=2',
      hash: '#section',
    };
    mockGetLoginProfile.mockRejectedValue(new Error('401'));

    await getInitialState();

    expect(mockReplace).toHaveBeenCalledWith(
      `/user/login?redirect=${encodeURIComponent('/system/user?page=2#section')}`,
    );
  });

  it('should include default settings in initial state', async () => {
    const { getInitialState } = await import('./app');
    mockGetLoginProfile.mockResolvedValue({ user: testUser, roles: [] });

    const state = await getInitialState();

    expect(state.settings).toEqual({ navTheme: 'light' });
  });

  it('fetchUserInfo should return profile on success', async () => {
    const { getInitialState } = await import('./app');
    const profile = { user: testUser, roles: [] };
    mockGetLoginProfile.mockResolvedValue(profile);

    const state = await getInitialState();

    const result = await state.fetchUserInfo?.();
    expect(result).toEqual(profile);
  });
});
