/**
 * 分页响应归一化：后端按 protojson 输出，零值字段不出现在响应里——空列表没有 items、
 * 总数为 0 时没有 total。统一补齐，页面不必处处判空（否则 total 会算成 NaN）。
 */
import type { PagedResult } from '@/services/system/typings';

export const normalizePaged = <T>(
  result: Partial<PagedResult<T>>,
): PagedResult<T> => ({
  items: result.items ?? [],
  total: result.total ?? '0',
});
