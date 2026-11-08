import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { getIntl } from '@umijs/max';
import { message } from 'antd';
import { getAccessToken } from './utils/auth';

/** 后端错误体：Kratos Status{code, message, details} */
interface BackendStatus {
  code?: number;
  message?: string;
}

/**
 * 错误处理
 * 后端为 REST 风格：2xx 直出业务 JSON，非 2xx 返回 Status{code,message}。
 * 401 的刷新重试由 src/services/system/request.ts 的 authRequest 处理。
 */
export const errorConfig: RequestConfig = {
  errorConfig: {
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      if (error.response) {
        const status: number = error.response.status;
        const body = (error.data ?? error.response.data) as
          | BackendStatus
          | undefined;
        if (status === 401) {
          // 未携带/失效的令牌：交给 authRequest 或登录流程处理，这里静默
          return;
        }
        message.error(body?.message || `请求失败（HTTP ${status}）`);
        return;
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        message.error(
          getIntl().formatMessage({
            id: 'app.request.offline',
            defaultMessage:
              'Network unavailable. Please check your connection and try again.',
          }),
        );
      } else if (error.request) {
        message.error('None response! Please retry.');
      } else {
        message.error('Request error, please retry.');
      }
    },
  },

  // 请求拦截器：统一附加 Bearer access token
  requestInterceptors: [
    (config: RequestOptions) => {
      const token = getAccessToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
  ],

  responseInterceptors: [],
};
