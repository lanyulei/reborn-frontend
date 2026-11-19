/**
 * 工单每日趋势：每天两根柱——提交与结束，同一色相一深一浅（主色与其浅色），悬停显示当天的数值
 * （图表见 @/components/Charts/DailyBars）。
 */
import type React from 'react';
import { type DailyBarSeries, DailyBars } from '@/components/Charts/DailyBars';
import type { TicketTrendPoint } from '@/services/ticket/typings';

const SERIES: DailyBarSeries<'created' | 'closed'>[] = [
  {
    key: 'created',
    labelKey: 'pages.ticket.stats.created',
    color: 'colorPrimary',
  },
  {
    key: 'closed',
    labelKey: 'pages.ticket.stats.closed',
    color: 'colorPrimaryBorder',
  },
];

export const TrendChart: React.FC<{
  points: readonly TicketTrendPoint[];
  height?: number;
}> = ({ points, height }) => (
  <DailyBars
    points={points}
    series={SERIES}
    titleKey="pages.ticket.stats.trend"
    barWidth={{ ratio: 0.32, max: 14 }}
    barGap={2}
    height={height}
  />
);

export default TrendChart;
