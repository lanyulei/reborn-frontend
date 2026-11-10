/**
 * LoginLogService 登录日志：审计查询（append-only 无写接口），
 * 日志由登录链路自动落库，本服务仅供管理端检索。
 */
import type { LoginLog, LoginLogResult, PagedResult } from './typings';
import { authRequest } from './request';

export interface ListLoginLogsParams {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页数量，1-100 */
  pageSize?: number;
  /** 登录名，模糊匹配 */
  username?: string;
  /** 登录结果过滤 */
  result?: LoginLogResult;
  /** 起始时间（含），RFC3339 格式 */
  startTime?: string;
  /** 截止时间（含），RFC3339 格式 */
  endTime?: string;
}

/** ListLoginLogs 分页查询登录日志，page_size 上限 100 */
export async function listLoginLogs(
  params: ListLoginLogsParams,
): Promise<PagedResult<LoginLog>> {
  return authRequest<PagedResult<LoginLog>>('/api/v1/system/login-log', {
    method: 'GET',
    params,
  });
}
