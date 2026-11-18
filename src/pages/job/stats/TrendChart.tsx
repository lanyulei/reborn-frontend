/**
 * 执行每日趋势（手写 SVG，与工单统计同一做法，不引图表库）：每天三根柱——提交、成功、失败，
 * 悬停显示当天的数值。颜色全部来自主题 token。
 */
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useState } from 'react';
import { useSize } from '@/pages/cmdb/components/charts';
import { useT } from '@/utils/i18n';

export interface JobTrendPoint {
  /** YYYY-MM-DD */
  day: string;
  total: number;
  success: number;
  failed: number;
}

type SeriesKey = 'total' | 'success' | 'failed';
const SERIES: readonly SeriesKey[] = ['total', 'success', 'failed'];

const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    position: relative;
  `,
  gridLine: css`
    stroke: ${token.colorSplit};
    stroke-width: 1;
  `,
  axisText: css`
    fill: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  total: css`
    fill: ${token.colorPrimary};
    background: ${token.colorPrimary};
  `,
  success: css`
    fill: ${token.colorSuccess};
    background: ${token.colorSuccess};
  `,
  failed: css`
    fill: ${token.colorError};
    background: ${token.colorError};
  `,
  hoverBand: css`
    fill: ${token.colorFillQuaternary};
  `,
  hitArea: css`
    fill: transparent;
  `,
  legend: css`
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    margin-bottom: 8px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  swatch: css`
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-inline-end: 6px;
    border-radius: 2px;
  `,
  tooltip: css`
    position: absolute;
    z-index: 10;
    min-width: 132px;
    padding: 8px 12px;
    pointer-events: none;
    background: ${token.colorBgElevated};
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowSecondary};
    transform: translate(-50%, 0);
  `,
  tooltipTitle: css`
    margin-bottom: 4px;
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeSM}px;
  `,
  tooltipRow: css`
    display: flex;
    gap: 16px;
    justify-content: space-between;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    line-height: 20px;
  `,
}));

const niceStep = (x: number) => {
  const pow = 10 ** Math.floor(Math.log10(Math.max(x, 1e-9)));
  const f = x / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
};

export const TrendChart: React.FC<{
  points: readonly JobTrendPoint[];
  height?: number;
}> = ({ points, height = 260 }) => {
  const { styles, cx } = useStyles();
  const t = useT();
  const [wrapRef, { width }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const M = { top: 12, right: 8, bottom: 26, left: 40 };
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = Math.max(0, height - M.top - M.bottom);
  const rawMax = Math.max(1, ...points.map((p) => p.total));
  const step = Math.max(1, niceStep(rawMax / 3));
  const yMax = Math.max(step, Math.ceil(rawMax / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-9; v += step) ticks.push(v);

  const n = points.length;
  const band = n ? plotW / n : 0;
  const barW = Math.max(2, Math.min(10, band * 0.22));
  const yAt = (v: number) => M.top + plotH - (v / yMax) * plotH;
  const stride = Math.max(1, Math.ceil(n / 8));
  const empty = points.every((p) => p.total === 0);
  const hovered = hover !== null ? points[hover] : undefined;

  return (
    <div>
      <div className={styles.legend}>
        {SERIES.map((key) => (
          <span key={key}>
            <span className={cx(styles.swatch, styles[key])} />
            {t(`pages.job.stats.trend.${key}`)}
          </span>
        ))}
      </div>
      <div
        ref={wrapRef}
        className={styles.wrap}
        onPointerLeave={() => setHover(null)}
      >
        {empty || width === 0 ? (
          <div style={{ height }}>
            {empty && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ paddingTop: height / 2 - 48 }}
              />
            )}
          </div>
        ) : (
          <>
            <svg width={width} height={height}>
              <title>{t('pages.job.stats.trend')}</title>
              {ticks.map((v) => (
                <g key={v}>
                  <line
                    className={styles.gridLine}
                    x1={M.left}
                    x2={M.left + plotW}
                    y1={yAt(v)}
                    y2={yAt(v)}
                  />
                  <text
                    className={styles.axisText}
                    x={M.left - 8}
                    y={yAt(v)}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {v}
                  </text>
                </g>
              ))}
              {points.map((p, i) => {
                const x = M.left + i * band;
                // 三根柱以 band 中心对称排开
                const left = x + band / 2 - (barW * 3 + 2) / 2;
                return (
                  <g key={p.day}>
                    {hover === i && (
                      <rect
                        className={styles.hoverBand}
                        x={x}
                        y={M.top}
                        width={band}
                        height={plotH}
                      />
                    )}
                    {SERIES.map((key, k) => (
                      <rect
                        key={key}
                        className={styles[key]}
                        x={left + k * (barW + 1)}
                        y={yAt(p[key])}
                        width={barW}
                        height={M.top + plotH - yAt(p[key])}
                        rx={2}
                      />
                    ))}
                    {i % stride === 0 && (
                      <text
                        className={styles.axisText}
                        x={x + band / 2}
                        y={height - 8}
                        textAnchor="middle"
                      >
                        {p.day.slice(5)}
                      </text>
                    )}
                    <rect
                      className={styles.hitArea}
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
            {hovered && hover !== null && (
              <div
                className={styles.tooltip}
                style={{
                  left: Math.min(
                    Math.max(M.left + hover * band + band / 2, 72),
                    width - 72,
                  ),
                  top: M.top,
                }}
              >
                <div className={styles.tooltipTitle}>{hovered.day}</div>
                {SERIES.map((key) => (
                  <div key={key} className={styles.tooltipRow}>
                    <span>{t(`pages.job.stats.trend.${key}`)}</span>
                    <span>{hovered[key]}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrendChart;
