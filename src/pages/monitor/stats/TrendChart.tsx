/**
 * 告警量按天趋势（手写 SVG，与工单 / CMDB 统计同一做法，不引图表库）：每天一根堆叠柱，
 * 一段对应一条拆分（级别或分组），悬停显示当天各段的数量与合计。坐标轴、提示框沿用
 * 监控域折线图的样式；颜色由调用方按拆分键给出（级别色与级别标签同一口径）。
 */
import { Empty } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { useSize } from '@/components/Charts';
import { useT } from '@/utils/i18n';
import { valueAxis } from '../components/chartAxis';
import { useMonitorStyles } from '../components/styles';
import { useStatsStyles } from './styles';

export interface TrendSeries {
  key: string;
  name: string;
  color: string;
  /** 各天的数量，下标与 days 对应 */
  counts: number[];
  total: number;
}

const M = { top: 12, right: 8, bottom: 26, left: 44 };
/** 横轴至多标这么多个日期 */
const MAX_X_LABELS = 10;

export const TrendChart: React.FC<{
  /** yyyy-mm-dd，升序 */
  days: readonly string[];
  /** 自下而上的堆叠顺序 */
  series: readonly TrendSeries[];
  /** 各天合计 */
  totals: readonly number[];
  title: string;
  height?: number;
}> = ({ days, series, totals, title, height = 260 }) => {
  const { styles } = useMonitorStyles();
  const { styles: own } = useStatsStyles();
  const t = useT();
  const [wrapRef, { width }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const n = days.length;
  const empty = n === 0 || totals.every((v) => !v);
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = Math.max(0, height - M.top - M.bottom);
  // 数量是整数：纵轴上限至少取 4，刻度步长就不会小于 1
  const { yMax, ticks } = valueAxis(0, Math.max(4, ...totals));
  const band = n ? plotW / n : 0;
  const barW = Math.max(2, Math.min(28, band * 0.64));
  const yAt = (v: number) => M.top + plotH - (v / yMax) * plotH;
  const stride = Math.max(1, Math.ceil(n / MAX_X_LABELS));

  return (
    <div>
      <div className={own.legend}>
        {series.map((s) => (
          <span key={s.key} className={own.legendItem} title={s.name}>
            <span className={own.swatch} style={{ background: s.color }} />
            <span className={own.legendName}>{s.name}</span>
            <span>{s.total.toLocaleString()}</span>
          </span>
        ))}
      </div>
      {/* 没有数据时也渲染同一个容器：尺寸监听只在挂载时绑定一次 */}
      <div
        ref={wrapRef}
        className={styles.chartWrap}
        onPointerLeave={() => setHover(null)}
      >
        {empty ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.monitor.stats.empty')}
          />
        ) : width === 0 ? (
          <div style={{ height }} />
        ) : (
          <>
            <svg width={width} height={height}>
              <title>{title}</title>
              {ticks.map((v) => (
                <g key={v}>
                  <line
                    className={styles.chartGrid}
                    x1={M.left}
                    x2={M.left + plotW}
                    y1={yAt(v)}
                    y2={yAt(v)}
                  />
                  <text
                    className={styles.chartAxis}
                    x={M.left - 8}
                    y={yAt(v)}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {v.toLocaleString()}
                  </text>
                </g>
              ))}
              {days.map((day, i) => {
                const x = M.left + i * band;
                let acc = 0;
                return (
                  <g key={day}>
                    {hover === i && (
                      <rect
                        className={own.hoverBand}
                        x={x}
                        y={M.top}
                        width={band}
                        height={plotH}
                      />
                    )}
                    {series.map((s) => {
                      const v = s.counts[i] ?? 0;
                      if (v <= 0) return null;
                      const top = yAt(acc + v);
                      const h = yAt(acc) - top;
                      acc += v;
                      return (
                        <rect
                          key={s.key}
                          x={x + (band - barW) / 2}
                          y={top}
                          width={barW}
                          // 相邻两段之间留 1px 底色，段太矮时不留（否则看不见）
                          height={h > 3 ? h - 1 : h}
                          fill={s.color}
                        />
                      );
                    })}
                    {i % stride === 0 && (
                      <text
                        className={styles.chartAxis}
                        x={x + band / 2}
                        y={height - 8}
                        textAnchor="middle"
                      >
                        {day.slice(5)}
                      </text>
                    )}
                    <rect
                      className={own.hitArea}
                      x={x}
                      y={M.top}
                      width={band}
                      height={plotH}
                      onPointerEnter={() => setHover(i)}
                    />
                  </g>
                );
              })}
            </svg>
            {hover !== null && hover < n && (
              <div
                className={styles.chartTooltip}
                style={{
                  top: M.top,
                  minWidth: 160,
                  ...(M.left + hover * band > width / 2
                    ? { right: width - (M.left + hover * band) + 8 }
                    : { left: M.left + (hover + 1) * band + 8 }),
                }}
              >
                <div className={styles.chartTooltipTitle}>{days[hover]}</div>
                {/* 与柱子的堆叠方向一致：上面的段排在前 */}
                {[...series].reverse().map((s) => (
                  <div key={s.key} className={styles.chartTooltipRow}>
                    <span
                      className={own.swatch}
                      style={{ background: s.color }}
                    />
                    <span className={styles.chartTooltipName}>{s.name}</span>
                    <span>{(s.counts[hover] ?? 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className={styles.chartTooltipRow}>
                  <span className={styles.chartTooltipName}>
                    {t('pages.monitor.stats.total')}
                  </span>
                  <span className={own.strong}>
                    {(totals[hover] ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrendChart;
