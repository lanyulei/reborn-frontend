/**
 * 逐日分组柱状图（手写 SVG，不引图表库）：每天并排几根柱（一个系列一根），右上角图例，
 * 悬停显示当天各系列的数值。作业执行趋势、工单趋势等共用；颜色全部来自主题 token。
 */
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
import { useSize } from './index';

/** 系列颜色：主题 token 名 */
type SeriesColor =
  | 'colorPrimary'
  | 'colorPrimaryBorder'
  | 'colorSuccess'
  | 'colorError';

export interface DailyBarSeries<K extends string> {
  /** 数据点上的取值字段 */
  key: K;
  /** 图例与悬停提示里的名称（i18n 键） */
  labelKey: string;
  color: SeriesColor;
}

type Point<K extends string> = { /** YYYY-MM-DD */ day: string } & Record<
  K,
  number
>;

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

export const DailyBars = <K extends string>({
  points,
  series,
  titleKey,
  scaleKeys,
  barWidth,
  barGap,
  height = 260,
}: {
  points: readonly Point<K>[];
  series: readonly DailyBarSeries<K>[];
  /** 无障碍标题（svg title）的 i18n 键 */
  titleKey: string;
  /** 决定纵轴上限与「无数据」判定的系列；缺省为全部系列 */
  scaleKeys?: readonly K[];
  /** 柱宽：取 band × ratio，不超过 max（像素） */
  barWidth: { ratio: number; max: number };
  /** 同一天相邻两根柱的间距（像素） */
  barGap: number;
  height?: number;
}): React.ReactElement => {
  const { styles, theme } = useStyles();
  const t = useT();
  const [wrapRef, { width }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const scale = scaleKeys ?? series.map((s) => s.key);
  const M = { top: 12, right: 8, bottom: 26, left: 40 };
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = Math.max(0, height - M.top - M.bottom);
  const rawMax = Math.max(
    1,
    ...points.map((p) => Math.max(...scale.map((key) => p[key]))),
  );
  const step = Math.max(1, niceStep(rawMax / 3));
  const yMax = Math.max(step, Math.ceil(rawMax / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-9; v += step) ticks.push(v);

  const n = points.length;
  const band = n ? plotW / n : 0;
  const barW = Math.max(2, Math.min(barWidth.max, band * barWidth.ratio));
  const yAt = (v: number) => M.top + plotH - (v / yMax) * plotH;
  const stride = Math.max(1, Math.ceil(n / 8));
  const empty = points.every((p) => scale.every((key) => p[key] === 0));
  const hovered = hover !== null ? points[hover] : undefined;
  // 一天里的几根柱以 band 中心对称排开
  const groupW = barW * series.length + barGap * (series.length - 1);

  return (
    <div>
      <div className={styles.legend}>
        {series.map((s) => (
          <span key={s.key}>
            <span
              className={styles.swatch}
              style={{ background: theme[s.color] }}
            />
            {t(s.labelKey)}
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
              <title>{t(titleKey)}</title>
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
                const left = x + band / 2 - groupW / 2;
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
                    {series.map((s, k) => (
                      <rect
                        key={s.key}
                        fill={theme[s.color]}
                        x={left + k * (barW + barGap)}
                        y={yAt(p[s.key])}
                        width={barW}
                        height={M.top + plotH - yAt(p[s.key])}
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
                {series.map((s) => (
                  <div key={s.key} className={styles.tooltipRow}>
                    <span>{t(s.labelKey)}</span>
                    <span>{hovered[s.key]}</span>
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
