/**
 * 手写 SVG 轻量图表（不引图表库，规避 utoopack 新增模块崩溃）：
 * - StatCard  统计卡（白底卡片 + value / label + 圆形图标）
 * - BarList   排序横条（单色幅度编码：条形长度即数量，值标在条端）
 * - TrendChart 逐日变更柱状（单系列；悬停显示按动作的明细）
 * 颜色全部来自 antd 主题 token（经 createStyles 注入 SVG 的 class）；
 * 不做多系列分类色。
 */
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CmdbHistory } from '@/services/cmdb/typings';
import { useEnumText, useT } from '@/utils/i18n';
import { CMDB_ACTION_META } from './meta';

const useStyles = createStyles(({ token, css }) => ({
  statCard: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  statLabel: css`
    display: block;
    margin-top: 2px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSize}px;
  `,
  statValue: css`
    display: block;
    color: ${token.colorText};
    font-size: 28px;
    font-weight: 600;
    line-height: 1.25;
  `,
  statIcon: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    border-radius: 50%;
  `,
  barList: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  barRow: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  barLabel: css`
    flex: none;
    width: 34%;
    overflow: hidden;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  barTrack: css`
    position: relative;
    flex: 1;
    height: 22px;
  `,
  bar: css`
    position: absolute;
    top: 50%;
    left: 0;
    height: 12px;
    transform: translateY(-50%);
    /* 基线端方角、数据端 4px 圆角 */
    border-radius: 2px 4px 4px 2px;
    background: ${token.colorPrimary};
  `,
  barValueOut: css`
    position: absolute;
    top: 50%;
    margin-left: 8px;
    color: ${token.colorText};
    font-size: ${token.fontSizeSM}px;
    line-height: 1;
    white-space: nowrap;
    transform: translateY(-50%);
  `,
  chartWrap: css`
    position: relative;
  `,
  gridLine: css`
    stroke: ${token.colorSplit};
    stroke-width: 1;
  `,
  axisText: css`
    fill: ${token.colorTextTertiary};
    font-size: 11px;
  `,
  directLabel: css`
    fill: ${token.colorTextSecondary};
    font-size: 11px;
  `,
  hoverBand: css`
    fill: ${token.colorFillQuaternary};
  `,
  trendBar: css`
    fill: ${token.colorPrimary};
  `,
  hitArea: css`
    fill: transparent;
  `,
  tooltip: css`
    position: absolute;
    z-index: 10;
    min-width: 140px;
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
    justify-content: space-between;
    gap: 16px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    line-height: 20px;
  `,
}));

/** 容器尺寸（ResizeObserver，无第三方依赖） */
export const useSize = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setSize({ width: rect.width, height: rect.height });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
};

/** 统计卡：value + label + 右侧圆形图标（白底卡片；大数用本地化千分位） */
export const StatCard: React.FC<{
  label: string;
  value?: number | string;
  loading?: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, loading, icon }) => {
  const { styles } = useStyles();
  const text =
    loading || value === undefined || value === null
      ? '—'
      : typeof value === 'number'
        ? value.toLocaleString()
        : value;
  return (
    <div className={styles.statCard}>
      <div>
        <span className={styles.statValue}>{text}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      {icon && <span className={styles.statIcon}>{icon}</span>}
    </div>
  );
};

export interface BarItem {
  key: string;
  label: string;
  count: number;
}

/** 排序横条：单色，值标在条端 */
export const BarList: React.FC<{
  items: BarItem[];
  /** 计数上限（多图对齐时用），缺省取最大值 */
  max?: number;
}> = ({ items, max }) => {
  const { styles } = useStyles();
  const sorted = useMemo(
    () => [...items].sort((a, b) => b.count - a.count),
    [items],
  );
  const maxValue = Math.max(1, max ?? sorted[0]?.count ?? 1);
  if (!sorted.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '24px 0' }}
      />
    );
  }
  return (
    <div className={styles.barList}>
      {sorted.map((it) => {
        // 条最长占轨道 90%，给条端的数值留位
        const pct = Math.max(0, Math.min(90, (it.count / maxValue) * 90));
        return (
          <div
            key={it.key}
            className={styles.barRow}
            title={`${it.label}: ${it.count}`}
          >
            <span className={styles.barLabel}>{it.label}</span>
            <div className={styles.barTrack}>
              {pct > 0 && (
                <div className={styles.bar} style={{ width: `${pct}%` }} />
              )}
              <span className={styles.barValueOut} style={{ left: `${pct}%` }}>
                {it.count.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export interface TrendPoint {
  /** YYYY-MM-DD */
  date: string;
  byAction: Record<string, number>;
}

const niceStep = (x: number) => {
  const pow = 10 ** Math.floor(Math.log10(Math.max(x, 1e-9)));
  const f = x / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
};

/** 逐日变更柱状：单系列柱 + 悬停列带与按动作明细，直接标注峰值与最新值 */
export const TrendChart: React.FC<{
  points: TrendPoint[];
  height?: number;
  /** 无障碍标题（svg title） */
  title?: string;
}> = ({ points, height = 240, title }) => {
  const t = useT();
  const actionText = useEnumText(CMDB_ACTION_META);
  const { styles } = useStyles();
  const [wrapRef, { width }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const M = { top: 16, right: 8, bottom: 26, left: 40 };
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = Math.max(0, height - M.top - M.bottom);
  const totals = points.map((p) =>
    Object.values(p.byAction).reduce((a, b) => a + b, 0),
  );
  const rawMax = Math.max(1, ...totals);
  const step = niceStep(rawMax / 3);
  const yMax = Math.max(step, Math.ceil(rawMax / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-9; v += step) ticks.push(v);

  const n = points.length;
  const band = n ? plotW / n : 0;
  const barW = Math.max(4, Math.min(24, band * 0.6));
  const xAt = (i: number) => M.left + i * band + (band - barW) / 2;
  const yAt = (v: number) => M.top + plotH - (v / yMax) * plotH;

  const maxIdx = totals.length ? totals.indexOf(Math.max(...totals)) : -1;
  const lastIdx = n - 1;

  const xLabels = useMemo(() => {
    if (n < 2)
      return points.map((_, i) => ({ i, text: points[i].date.slice(5) }));
    const count = Math.min(6, n);
    const stride = Math.max(1, Math.ceil((n - 1) / (count - 1)));
    const out: { i: number; text: string }[] = [];
    for (let i = 0; i < n; i += stride)
      out.push({ i, text: points[i].date.slice(5) });
    return out;
  }, [n, points]);

  const hoverPoint = hover !== null ? points[hover] : null;
  const hoverTotal = hover !== null ? totals[hover] : 0;
  const hoverActions = hoverPoint
    ? Object.entries(hoverPoint.byAction)
        .filter(([, c]) => c > 0)
        .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div
      ref={wrapRef}
      className={styles.chartWrap}
      onPointerLeave={() => setHover(null)}
    >
      {n === 0 || width === 0 ? (
        <div style={{ height }}>
          {n === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ lineHeight: `${height}px` }}
            />
          )}
        </div>
      ) : (
        <>
          <svg width={width} height={height}>
            <title>{title ?? ''}</title>
            {/* 网格与 y 轴刻度：实线 hairline，弱化 */}
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
                  dy="0.32em"
                  textAnchor="end"
                >
                  {v.toLocaleString()}
                </text>
              </g>
            ))}
            {/* 悬停列带 */}
            {hover !== null && (
              <rect
                className={styles.hoverBand}
                x={M.left + hover * band}
                y={M.top}
                width={band}
                height={plotH}
              />
            )}
            {/* 柱：数据端 4px 圆角、基线方角 */}
            {points.map((p, i) => {
              const h = (totals[i] / yMax) * plotH;
              if (h <= 0) return null;
              const x = xAt(i);
              const y = M.top + plotH - h;
              const r = Math.min(4, h / 2, barW / 2);
              return (
                <path
                  key={p.date}
                  className={styles.trendBar}
                  d={`M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + barW - r},${y} Q${x + barW},${y} ${x + barW},${y + r} L${x + barW},${y + h} Z`}
                />
              );
            })}
            {/* 直接标注：峰值与最新值 */}
            {maxIdx >= 0 && totals[maxIdx] > 0 && (
              <text
                className={styles.directLabel}
                x={xAt(maxIdx) + barW / 2}
                y={Math.max(10, yAt(totals[maxIdx]) - 6)}
                textAnchor="middle"
              >
                {totals[maxIdx].toLocaleString()}
              </text>
            )}
            {lastIdx >= 0 && lastIdx !== maxIdx && totals[lastIdx] > 0 && (
              <text
                className={styles.directLabel}
                x={xAt(lastIdx) + barW / 2}
                y={Math.max(10, yAt(totals[lastIdx]) - 6)}
                textAnchor="middle"
              >
                {totals[lastIdx].toLocaleString()}
              </text>
            )}
            {/* x 轴日期 */}
            {xLabels.map(({ i, text }) => (
              <text
                className={styles.axisText}
                key={i}
                x={M.left + i * band + band / 2}
                y={height - 8}
                textAnchor="middle"
              >
                {text}
              </text>
            ))}
            {/* 悬停命中区：整列全高 */}
            {points.map((p, i) => (
              <rect
                key={p.date}
                className={styles.hitArea}
                x={M.left + i * band}
                y={M.top}
                width={band}
                height={plotH}
                onPointerEnter={() => setHover(i)}
              />
            ))}
          </svg>
          {hover !== null && hoverPoint && (
            <div
              className={styles.tooltip}
              style={{
                left: Math.max(
                  90,
                  Math.min(width - 90, M.left + hover * band + band / 2),
                ),
                top: 0,
              }}
            >
              <div className={styles.tooltipTitle}>{hoverPoint.date}</div>
              <div className={styles.tooltipRow}>
                <span>{t('pages.cmdb.stats.trend.total')}</span>
                <span>{hoverTotal.toLocaleString()}</span>
              </div>
              {hoverActions.map(([action, count]) => (
                <div key={action} className={styles.tooltipRow}>
                  <span>{actionText(action as CmdbHistory['action'])}</span>
                  <span>{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
