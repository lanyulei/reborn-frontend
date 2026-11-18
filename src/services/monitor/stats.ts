/**
 * MonitorStatsService 告警统计（只读）：概览、按天趋势、排行、处理效率（MTTA / MTTR）与降噪效果。
 * 只统计数据范围内的告警；带时间范围的接口按事件的首次触发时间取数，范围至多 90 天
 * （400 MONITOR_TIME_RANGE_INVALID）。各接口恒静默：页面分块加载，失败在各自的块里展示。
 */
import { monitorRequest } from './request';
import type {
  AlertEfficiencyItem,
  AlertNoise,
  AlertOverview,
  AlertTopItem,
  AlertTrend,
} from './typings';

/** 统计的时间范围（startTime 含、endTime 不含）与分组过滤（含全部下级） */
export interface StatsRangeParams {
  startTime: string;
  endTime: string;
  groupId?: string;
}

const get = <T>(path: string, params: object) =>
  monitorRequest<T>(`/api/v1/monitor/stats/${path}`, {
    method: 'GET',
    params,
    silent: true,
  });

/** GetAlertOverview 当前各级别的活跃告警数、未认领数，以及今日新增 / 恢复 / 关闭数 */
export async function getAlertOverview(params: {
  groupId?: string;
  /** 「今日」按哪个时区的自然日计算；缺省 Asia/Shanghai */
  timezone?: string;
}): Promise<AlertOverview> {
  return get('overview', params);
}

/** GetAlertTrend 按天的告警量；by = severity（缺省）/ group（至多 10 个分组 + 其他） */
export async function getAlertTrend(
  params: StatsRangeParams & { by?: 'severity' | 'group'; timezone?: string },
): Promise<AlertTrend> {
  return get('trend', params);
}

/** GetAlertTop 告警最多的规则 / 资源 / 某个标签的取值；limit 1-50，缺省 10 */
export async function getAlertTop(
  params: StatsRangeParams & { by: string; limit?: number },
): Promise<{ items?: AlertTopItem[]; total?: number }> {
  return get('top', params);
}

/** GetAlertEfficiency MTTA / MTTR；by = group（缺省）/ severity */
export async function getAlertEfficiency(
  params: StatsRangeParams & { by?: 'group' | 'severity' },
): Promise<{ items?: AlertEfficiencyItem[]; total?: AlertEfficiencyItem | null }> {
  return get('efficiency', params);
}

/** GetAlertNoise 产生的事件数与其中被屏蔽、被抑制的数量，以及实际发出的通知数 */
export async function getAlertNoise(
  params: StatsRangeParams,
): Promise<AlertNoise> {
  return get('noise', params);
}
