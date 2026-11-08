import { message } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorConfig } from './requestErrorConfig';
import { clearTokens, setTokens } from './utils/auth';

vi.mock('antd', () => ({
  message: {
    error: vi.fn(),
  },
}));

vi.mock('@umijs/max', () => ({
  getIntl: vi.fn(() => ({
    formatMessage: vi.fn(({ defaultMessage }) => defaultMessage),
  })),
}));

const errorHandler = errorConfig.errorConfig?.errorHandler as unknown as (
  error: any,
  opts: any,
) => void;
const requestInterceptor = errorConfig.requestInterceptors?.[0] as any;

describe('requestErrorConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTokens();
  });

  describe('errorHandler', () => {
    it('should rethrow error when skipErrorHandler is true', () => {
      const error = new Error('Test error');
      const opts = { skipErrorHandler: true };

      expect(() => {
        errorHandler(error, opts);
      }).toThrow('Test error');
    });

    it('should stay silent on 401 (refresh handled by authRequest)', () => {
      const error: any = new Error('Unauthorized');
      error.response = { status: 401 };
      error.data = { code: 16, message: 'token expired' };

      expect(() => {
        errorHandler(error, {});
      }).not.toThrow();
      expect(message.error).not.toHaveBeenCalled();
    });

    it('should show backend Status message on non-401 HTTP error', () => {
      const error: any = new Error('Bad Request');
      error.response = { status: 400 };
      error.data = { code: 3, message: '参数不合法' };

      errorHandler(error, {});

      expect(message.error).toHaveBeenCalledWith('参数不合法');
    });

    it('should fall back to HTTP status text when body has no message', () => {
      const error: any = new Error('Server Error');
      error.response = { status: 500 };

      errorHandler(error, {});

      expect(message.error).toHaveBeenCalledWith('请求失败（HTTP 500）');
    });

    it('should handle offline error', () => {
      const error: any = new Error('Network error');
      error.request = {};

      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      try {
        errorHandler(error, {});

        expect(message.error).toHaveBeenCalledWith(
          'Network unavailable. Please check your connection and try again.',
        );
      } finally {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: originalOnLine,
        });
      }
    });

    it('should handle request error with no response', () => {
      const error: any = new Error('Request error');
      error.request = {};

      errorHandler(error, {});

      expect(message.error).toHaveBeenCalledWith(
        'None response! Please retry.',
      );
    });

    it('should handle generic error', () => {
      errorHandler(new Error('Generic error'), {});

      expect(message.error).toHaveBeenCalledWith(
        'Request error, please retry.',
      );
    });
  });

  describe('requestInterceptors', () => {
    it('should attach Bearer token when available', () => {
      setTokens('access-token', 'refresh-token', '3600');

      const result = requestInterceptor({
        url: '/api/v1/me',
        method: 'GET',
      });

      expect(result.headers.Authorization).toBe('Bearer access-token');
    });

    it('should not attach Authorization header without token', () => {
      const result = requestInterceptor({
        url: '/api/v1/login',
        method: 'POST',
      });

      expect(result.headers?.Authorization).toBeUndefined();
    });
  });
});
