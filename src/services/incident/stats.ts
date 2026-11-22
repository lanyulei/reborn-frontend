/**
 * IncidentStatsService：概览（当前状态）、趋势、效率（MTTD / MTTA / MTTM / MTTR）、分布。
 * 四个接口各自加载，失败由调用方处理（不弹提示）。
 */
import { incidentRequest } from './request';
import type {
  IncidentDistribution,
  IncidentEfficiency,
  IncidentOverview,
  StatsRangeParams,
  TrendPoint,
} from './typings';

const STATS = '/api/v1/incident-stats';

export async function getOverview(
  businessId?: string,
): Promise<IncidentOverview> {
  return incidentRequest<IncidentOverview>(`${STATS}/overview`, {
    method: 'GET',
    params: { businessId },
    silent: true,
  });
}

export async function getTrend(
  params: StatsRangeParams,
): Promise<{ points?: TrendPoint[] }> {
  return incidentRequest<{ points?: TrendPoint[] }>(`${STATS}/trend`, {
    method: 'GET',
    params,
    silent: true,
  });
}

export async function getEfficiency(
  params: StatsRangeParams,
): Promise<IncidentEfficiency> {
  return incidentRequest<IncidentEfficiency>(`${STATS}/efficiency`, {
    method: 'GET',
    params,
    silent: true,
  });
}

export async function getDistribution(
  params: StatsRangeParams,
): Promise<IncidentDistribution> {
  return incidentRequest<IncidentDistribution>(`${STATS}/distribution`, {
    method: 'GET',
    params,
    silent: true,
  });
}
