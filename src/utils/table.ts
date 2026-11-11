/**
 * ProTable 公共适配：分页结果 → 表格数据源、筛选参数归一化、通用筛选列工厂。
 * 页面只保留与自身接口相关的参数拼装。
 */
import type { ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import type { PagedResult } from '@/services/system/typings';
import type { Translate } from './i18n';

/** 后端分页结果 → ProTable request 返回值（total 为 int64 字符串） */
export const toTableResult = <T>(result: PagedResult<T>) => ({
  data: result.items,
  total: Number(result.total),
  success: true,
});

/**
 * valueEnum 布尔筛选经表单序列化为 'true' / 'false' 字符串，此处归一化回布尔；
 * 未选择（空/其他）= 不过滤。
 */
export const parseBoolParam = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};

/**
 * 「时间范围」筛选列（仅搜索表单，不入表格）：本地时间 → UTC ISO（RFC3339），
 * 映射为后端的起止查询参数名（如 createTimeStart/createTimeEnd、startTime/endTime）。
 */
export const timeRangeColumn = <T>(
  t: Translate,
  keys: { start: string; end: string },
): ProColumns<T> => ({
  title: t('common.column.timeRange'),
  dataIndex: 'timeRange',
  valueType: 'dateTimeRange',
  hideInTable: true,
  search: {
    transform: (value: [string, string]) => ({
      [keys.start]: value?.[0] ? dayjs(value[0]).toISOString() : undefined,
      [keys.end]: value?.[1] ? dayjs(value[1]).toISOString() : undefined,
    }),
  },
});
