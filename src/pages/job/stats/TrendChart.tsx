/**
 * 执行每日趋势：每天三根柱——提交、成功、失败，悬停显示当天的数值（图表见 @/components/Charts/DailyBars）。
 */
import type React from 'react';
import { type DailyBarSeries, DailyBars } from '@/components/Charts/DailyBars';

export interface JobTrendPoint {
  /** YYYY-MM-DD */
  day: string;
  total: number;
  success: number;
  failed: number;
}

const SERIES: DailyBarSeries<'total' | 'success' | 'failed'>[] = [
  {
    key: 'total',
    labelKey: 'pages.job.stats.trend.total',
    color: 'colorPrimary',
  },
  {
    key: 'success',
    labelKey: 'pages.job.stats.trend.success',
    color: 'colorSuccess',
  },
  {
    key: 'failed',
    labelKey: 'pages.job.stats.trend.failed',
    color: 'colorError',
  },
];

export const TrendChart: React.FC<{
  points: readonly JobTrendPoint[];
  height?: number;
}> = ({ points, height }) => (
  <DailyBars
    points={points}
    series={SERIES}
    titleKey="pages.job.stats.trend"
    // 纵轴上限与「无数据」只看提交数
    scaleKeys={['total']}
    barWidth={{ ratio: 0.22, max: 10 }}
    barGap={1}
    height={height}
  />
);

export default TrendChart;
