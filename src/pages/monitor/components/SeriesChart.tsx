/**
 * 时间序列折线图（手写 SVG，与工单 / CMDB 统计同一做法，不引图表库）：即时查询的区间结果与
 * 规则表单的数据预览共用。最多画 MAX_LINES 条序列（其余只在表格里），悬停显示该时刻各序列的值。
 * 颜色取主题预设色板。
 *
 * 结果可能很大（至多 MAX_LINES × 11000 个点）：极值用循环求（不把数组展开成实参），绘制按像素列
 * 降采样，悬停用二分查找；坐标系与折线只在数据或尺寸变化时重算，指针移动不触发。
 */
import { Empty, theme } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { useMemo, useState } from 'react';
// useSize 目前定义在 CMDB 的图表文件里（工单统计也从那里引用）：挪到公共位置要改 CMDB 的文件，暂保持现状
import { useSize } from '@/pages/cmdb/components/charts';
import type { QuerySeries } from '@/services/monitor/typings';
import { DATE_TIME_SECONDS_FORMAT } from '@/utils/format';
import { useT } from '@/utils/i18n';
import { valueAxis } from './chartAxis';
import { formatValue, seriesName } from './format';
import { useMonitorStyles } from './styles';

/** 折线上限：再多既分不清颜色也看不清走势 */
export const MAX_LINES = 10;
const M = { top: 12, right: 12, bottom: 26, left: 56 };
/** 相邻两点的间隔超过典型步长的这个倍数即视为数据缺口：折线在此断开，悬停也不取这么远的点 */
const GAP_FACTOR = 1.5;

interface Point {
  ts: number;
  value: number;
}

interface Line {
  name: string;
  color: string;
  /** 按时间升序 */
  points: Point[];
  /** 典型步长（相邻点时间间隔的中位数，毫秒）；不足两个点或无法判断时为 undefined */
  step?: number;
  /** 按数据缺口切开的连续段（绘制用） */
  segments: Point[][];
}

/** 主题预设色板里取 MAX_LINES 个彼此区分度高的颜色 */
export const useSeriesColors = (): string[] => {
  const { token } = theme.useToken();
  return useMemo(
    () => [
      token.blue,
      token.green,
      token.gold,
      token.purple,
      token.cyan,
      token.magenta,
      token.volcano,
      token.geekblue,
      token.lime,
      token.orange,
    ],
    [token],
  );
};

const typicalStep = (points: Point[]): number | undefined => {
  if (points.length < 2) return undefined;
  const deltas = new Float64Array(points.length - 1);
  for (let i = 1; i < points.length; i++) {
    deltas[i - 1] = points[i].ts - points[i - 1].ts;
  }
  deltas.sort();
  const median = deltas[deltas.length >> 1];
  return median > 0 ? median : undefined;
};

/** 在数据缺口处把点列切成连续段 */
const toSegments = (points: Point[], step?: number): Point[][] => {
  if (!step || points.length === 0) return points.length ? [points] : [];
  const segments: Point[][] = [];
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].ts - points[i - 1].ts > step * GAP_FACTOR) {
      segments.push(points.slice(start, i));
      start = i;
    }
  }
  segments.push(start === 0 ? points : points.slice(start));
  return segments;
};

const toLines = (series: readonly QuerySeries[], colors: string[]): Line[] =>
  series.slice(0, MAX_LINES).map((s, i) => {
    const points: Point[] = [];
    let sorted = true;
    for (const p of s.points ?? []) {
      const ts = Number(p.timestampMs);
      const value = Number(p.value);
      // NaN / 无穷无法落在坐标系里：跳过该点
      if (!Number.isFinite(ts) || !Number.isFinite(value)) continue;
      if (points.length > 0 && ts < points[points.length - 1].ts) {
        sorted = false;
      }
      points.push({ ts, value });
    }
    // 数据源按时间升序返回；万一不是，排一次以保证二分查找成立
    if (!sorted) points.sort((a, b) => a.ts - b.ts);
    const step = typicalStep(points);
    return {
      name: seriesName(s.labels),
      color: colors[i % colors.length],
      points,
      step,
      segments: toSegments(points, step),
    };
  });

/** 时间与数值范围、纵轴刻度；没有任何可画的点时为 null */
const toScale = (lines: Line[]) => {
  let tMin = Number.POSITIVE_INFINITY;
  let tMax = Number.NEGATIVE_INFINITY;
  let vLo = Number.POSITIVE_INFINITY;
  let vHi = Number.NEGATIVE_INFINITY;
  for (const line of lines) {
    for (const p of line.points) {
      if (p.ts < tMin) tMin = p.ts;
      if (p.ts > tMax) tMax = p.ts;
      if (p.value < vLo) vLo = p.value;
      if (p.value > vHi) vHi = p.value;
    }
  }
  if (tMin > tMax) return null;
  return { tMin, tMax, ...valueAxis(vLo, vHi) };
};

/**
 * 绘制用的降采样：点数超过像素列数的两倍时，每个像素列只保留首、最小、最大、末四个点
 * （按时间顺序），尖峰不丢，折线外观与全量绘制一致。
 */
const downsample = (
  points: Point[],
  columns: number,
  columnOf: (ts: number) => number,
): Point[] => {
  if (columns <= 0 || points.length <= columns * 2) return points;
  const out: Point[] = [];
  let i = 0;
  while (i < points.length) {
    const column = columnOf(points[i].ts);
    const first = i;
    let min = i;
    let max = i;
    let j = i + 1;
    while (j < points.length && columnOf(points[j].ts) === column) {
      if (points[j].value < points[min].value) min = j;
      if (points[j].value > points[max].value) max = j;
      j++;
    }
    const last = j - 1;
    for (const index of [...new Set([first, min, max, last])].sort(
      (a, b) => a - b,
    )) {
      out.push(points[index]);
    }
    i = j;
  }
  return out;
};

/** 升序点列里离 ts 最近的点（二分查找） */
const nearest = (points: Point[], ts: number): Point | undefined => {
  if (points.length === 0) return undefined;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].ts < ts) lo = mid + 1;
    else hi = mid;
  }
  // lo 是第一个不早于 ts 的点：与它前一个点比较谁更近（等距取较早的）
  const prev = points[lo - 1];
  return prev && Math.abs(prev.ts - ts) <= Math.abs(points[lo].ts - ts)
    ? prev
    : points[lo];
};

export const SeriesChart: React.FC<{
  series: readonly QuerySeries[];
  height?: number;
}> = ({ series, height = 240 }) => {
  const { styles } = useMonitorStyles();
  const t = useT();
  const colors = useSeriesColors();
  const [wrapRef, { width }] = useSize<HTMLDivElement>();
  const [hoverTs, setHoverTs] = useState<number | null>(null);

  const lines = useMemo(() => toLines(series, colors), [series, colors]);
  const scale = useMemo(() => toScale(lines), [lines]);

  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = Math.max(0, height - M.top - M.bottom);

  // 坐标系与折线：只随数据、尺寸变化重算（指针移动时复用同一个元素，React 不再比对）
  const plot = useMemo(() => {
    if (!scale) return null;
    const { tMin, tMax, yMin, yMax, ticks } = scale;
    const xAt = (ts: number) =>
      M.left +
      (tMax === tMin ? plotW / 2 : ((ts - tMin) / (tMax - tMin)) * plotW);
    // 范围为 0（退回数据范围且只有一个值）时画在中间；跨度溢出时折半再算
    const yRange = yMax - yMin;
    const yRatio = (v: number) =>
      yRange === 0
        ? 0.5
        : Number.isFinite(yRange)
          ? (v - yMin) / yRange
          : (v / 2 - yMin / 2) / (yMax / 2 - yMin / 2);
    const yAt = (v: number) => M.top + plotH - yRatio(v) * plotH;
    const columns = Math.floor(plotW);
    const columnOf = (ts: number) =>
      tMax === tMin
        ? 0
        : Math.min(
            columns - 1,
            Math.floor(((ts - tMin) / (tMax - tMin)) * columns),
          );
    const sameDay = dayjs(tMin).isSame(tMax, 'day');
    const timeText = (ts: number) =>
      dayjs(ts).format(sameDay ? 'HH:mm' : 'MM-DD HH:mm');
    // 只有一个时刻（单点）时只标一个刻度
    const xTicks =
      tMax === tMin
        ? [tMin]
        : Array.from({ length: 5 }, (_, i) => tMin + ((tMax - tMin) * i) / 4);
    return (
      <>
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
              {formatValue(v)}
            </text>
          </g>
        ))}
        {xTicks.map((ts, i) => (
          <text
            // biome-ignore lint/suspicious/noArrayIndexKey: 刻度按位置固定
            key={i}
            className={styles.chartAxis}
            x={xAt(ts)}
            y={height - 8}
            textAnchor={
              xTicks.length === 1
                ? 'middle'
                : i === 0
                  ? 'start'
                  : i === 4
                    ? 'end'
                    : 'middle'
            }
          >
            {timeText(ts)}
          </text>
        ))}
        {lines.flatMap((line, i) =>
          // 每个连续段一条折线；孤立的点（前后都是缺口，或整条序列只有一个点）画成圆点
          line.segments.map((segment, j) =>
            segment.length === 1 ? (
              <circle
                // biome-ignore lint/suspicious/noArrayIndexKey: 序列与段都按位置对应，名称可能重复
                key={`${i}-${j}`}
                cx={xAt(segment[0].ts)}
                cy={yAt(segment[0].value)}
                r={3}
                fill={line.color}
              />
            ) : (
              <polyline
                // biome-ignore lint/suspicious/noArrayIndexKey: 序列与段都按位置对应，名称可能重复
                key={`${i}-${j}`}
                fill="none"
                stroke={line.color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                points={downsample(segment, columns, columnOf)
                  .map((p) => `${xAt(p.ts)},${yAt(p.value)}`)
                  .join(' ')}
              />
            ),
          ),
        )}
      </>
    );
  }, [scale, lines, plotW, plotH, height, styles]);

  // 悬停：各序列离指针时刻最近的点；隔着数据缺口的点（比典型步长远得多）不算，免得显示过期的值。
  // 只有一个点的序列没有自己的步长：借用其他序列里最小的（都没有则不限）
  const hovered = useMemo(() => {
    if (hoverTs === null) return [];
    const chartStep = Math.min(
      ...lines.map((line) => line.step ?? Number.POSITIVE_INFINITY),
    );
    const items: { line: Line; index: number; point: Point }[] = [];
    lines.forEach((line, index) => {
      const point = nearest(line.points, hoverTs);
      const reach = (line.step ?? chartStep) * GAP_FACTOR;
      if (point && Math.abs(point.ts - hoverTs) <= reach) {
        items.push({ line, index, point });
      }
    });
    return items;
  }, [lines, hoverTs]);

  // 没有可画的点时也渲染同一个容器：尺寸监听只在挂载时绑定一次，容器若不在，之后有数据了宽度也一直是 0
  const tMin = scale?.tMin ?? 0;
  const tMax = scale?.tMax ?? 0;
  const hoverX =
    hoverTs === null
      ? 0
      : M.left +
        (tMax === tMin
          ? plotW / 2
          : ((hoverTs - tMin) / (tMax - tMin)) * plotW);

  return (
    <div
      ref={wrapRef}
      className={styles.chartWrap}
      onPointerLeave={() => setHoverTs(null)}
      onPointerMove={(e) => {
        if (!scale || plotW <= 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left - M.left) / plotW;
        setHoverTs(tMin + Math.min(1, Math.max(0, ratio)) * (tMax - tMin));
      }}
    >
      {!scale ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.monitor.chart.empty')}
        />
      ) : width === 0 ? (
        <div style={{ height }} />
      ) : (
        <>
          <svg width={width} height={height}>
            <title>{t('pages.monitor.chart.title')}</title>
            {plot}
            {hoverTs !== null && (
              <line
                className={styles.chartCursor}
                x1={hoverX}
                x2={hoverX}
                y1={M.top}
                y2={M.top + plotH}
              />
            )}
          </svg>
          {hoverTs !== null && hovered.length > 0 && (
            <div
              className={styles.chartTooltip}
              style={{
                top: M.top,
                ...(hoverX > width / 2
                  ? { right: width - hoverX + 12 }
                  : { left: hoverX + 12 }),
              }}
            >
              <div className={styles.chartTooltipTitle}>
                {dayjs(hoverTs).format(DATE_TIME_SECONDS_FORMAT)}
              </div>
              {hovered.map(({ line, index, point }) => (
                <div key={index} className={styles.chartTooltipRow}>
                  <span
                    className={styles.chartSwatch}
                    style={{ background: line.color }}
                  />
                  <span className={styles.chartTooltipName}>{line.name}</span>
                  <span>{formatValue(point.value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeriesChart;
