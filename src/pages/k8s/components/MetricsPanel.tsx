/**
 * 指标面板：固定面板（服务端模板查询集群关联的监控数据源），手写 SVG 折线图（不引图表库）。
 * 每个面板一张小图、同一时间轴；系列颜色按系列在面板里的固定次序分配（使用量 / 请求量 / 上限），
 * 悬停显示十字线与各系列取值。集群未关联数据源时显示占位说明。
 */
import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Flex, Segmented, Spin } from 'antd';
import { createStyles, useThemeMode } from 'antd-style';
import dayjs from 'dayjs';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type MetricPanel,
  type MetricsResult,
  type MetricsTarget,
  type MetricUnit,
  queryMetrics,
} from '@/services/k8s/insight';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { useT } from '@/utils/i18n';

/** 分类色：固定次序，浅色 / 深色各一组（已用 dataviz 校验脚本验证色觉障碍下的区分度与对比度） */
const SERIES_LIGHT = ['#1677ff', '#d46b08', '#08979c'];
const SERIES_DARK = ['#3c89e8', '#d87a16', '#13a8a8'];

const useStyles = createStyles(({ token, css }) => ({
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
  `,
  card: css`
    position: relative;
    padding: 12px 16px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  title: css`
    color: ${token.colorText};
    font-weight: 600;
  `,
  legend: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 4px 0 8px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    font-variant-numeric: tabular-nums;
  `,
  swatch: css`
    display: inline-block;
    width: 10px;
    height: 2px;
    margin-inline-end: 6px;
    vertical-align: middle;
    border-radius: 1px;
  `,
  svg: css`
    display: block;
    width: 100%;
    height: 120px;
    overflow: visible;
    .grid {
      stroke: ${token.colorBorderSecondary};
      stroke-width: 1;
    }
    .cross {
      stroke: ${token.colorTextQuaternary};
      stroke-width: 1;
    }
    .dot {
      stroke: ${token.colorBgContainer};
      stroke-width: 2;
    }
  `,
  plot: css`
    position: relative;
  `,
  axisMax: css`
    position: absolute;
    top: 0;
    left: 2px;
    color: ${token.colorTextTertiary};
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  `,
  axisX: css`
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    color: ${token.colorTextTertiary};
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  `,
  tip: css`
    position: absolute;
    z-index: 2;
    padding: 6px 10px;
    color: ${token.colorText};
    font-size: ${token.fontSizeSM}px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    background: ${token.colorBgElevated};
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowSecondary};
    pointer-events: none;
  `,
  tipTime: css`
    margin-bottom: 2px;
    color: ${token.colorTextSecondary};
  `,
}));

const BYTE_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
const BIT_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps'];

const scaled = (value: number, base: number, units: string[]) => {
  let v = value;
  let i = 0;
  while (Math.abs(v) >= base && i < units.length - 1) {
    v /= base;
    i += 1;
  }
  return `${v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
};

/** 按单位格式化取值 */
export const formatMetric = (value: number, unit: MetricUnit): string => {
  switch (unit) {
    case 'cores':
      return Math.abs(value) < 1
        ? `${Math.round(value * 1000)}m`
        : value.toFixed(2);
    case 'bytes':
      return scaled(value, 1024, BYTE_UNITS);
    case 'bps':
      return scaled(value, 1000, BIT_UNITS);
    case 'percent':
      return `${value.toFixed(1)}%`;
    default:
      return String(Math.round(value));
  }
};

const W = 340;
const H = 120;
const PAD = { top: 6, right: 0, bottom: 2, left: 0 };

const Chart: React.FC<{
  panel: MetricPanel;
  start: number;
  end: number;
}> = ({ panel, start, end }) => {
  const t = useT();
  const { styles } = useStyles();
  const colors = useThemeMode().isDarkMode ? SERIES_DARK : SERIES_LIGHT;
  const [hover, setHover] = useState<{ x: number; ts: number }>();
  const ref = useRef<SVGSVGElement>(null);
  const series = useMemo(
    () => (panel.series ?? []).map((s) => ({ ...s, points: s.points ?? [] })),
    [panel.series],
  );
  const hasData = series.some((s) => s.points.length > 0);

  const max = useMemo(() => {
    let m = 0;
    for (const s of series) for (const p of s.points) m = Math.max(m, p[1]);
    if (panel.unit === 'percent') return Math.max(100, m);
    return m > 0 ? m * 1.1 : 1;
  }, [series, panel.unit]);

  const sx = (ts: number) =>
    PAD.left +
    ((ts - start) / Math.max(end - start, 1)) * (W - PAD.left - PAD.right);
  const sy = (v: number) =>
    H - PAD.bottom - (v / max) * (H - PAD.top - PAD.bottom);

  /** 悬停时刻各系列最近的点 */
  const nearest = useMemo(() => {
    if (!hover) return [];
    return series.map((s) => {
      let best: [number, number] | undefined;
      for (const p of s.points) {
        if (!best || Math.abs(p[0] - hover.ts) < Math.abs(best[0] - hover.ts))
          best = p;
      }
      return best;
    });
  }, [hover, series]);

  const seriesName = (name: string) => t(`pages.k8s.metrics.series.${name}`);

  return (
    <div className={styles.card}>
      <div className={styles.title}>
        {t(`pages.k8s.metrics.panel.${panel.id}`)}
      </div>
      <div className={styles.legend}>
        {series.map((s, i) => {
          const last = s.points[s.points.length - 1];
          return (
            <span key={s.name}>
              <i
                className={styles.swatch}
                style={{ background: colors[i % colors.length] }}
              />
              {seriesName(s.name)}
              {last ? ` ${formatMetric(last[1], panel.unit)}` : ''}
            </span>
          );
        })}
      </div>
      {panel.error ? (
        <Alert type="warning" showIcon title={panel.error} />
      ) : !hasData ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('pages.k8s.metrics.noData')}
        />
      ) : (
        <div className={styles.plot}>
          <span className={styles.axisMax}>
            {formatMetric(max, panel.unit)}
          </span>
          <svg
            ref={ref}
            className={styles.svg}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={t(`pages.k8s.metrics.panel.${panel.id}`)}
            onMouseMove={(e) => {
              const box = ref.current?.getBoundingClientRect();
              if (!box) return;
              const ratio = (e.clientX - box.left) / box.width;
              setHover({
                x: e.clientX - box.left,
                ts: start + ratio * (end - start),
              });
            }}
            onMouseLeave={() => setHover(undefined)}
          >
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                className="grid"
                x1={PAD.left}
                x2={W - PAD.right}
                y1={sy(max * f)}
                y2={sy(max * f)}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {series.map((s, i) => (
              <polyline
                key={s.name}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={s.points
                  .map((p) => `${sx(p[0])},${sy(p[1])}`)
                  .join(' ')}
              />
            ))}
            {hover && (
              <line
                className="cross"
                x1={sx(hover.ts)}
                x2={sx(hover.ts)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          <div className={styles.axisX}>
            <span>{dayjs.unix(start).format('MM-DD HH:mm')}</span>
            <span>{dayjs.unix(end).format('MM-DD HH:mm')}</span>
          </div>
        </div>
      )}
      {hover && hasData && !panel.error && (
        <div
          className={styles.tip}
          style={{
            top: 56,
            ...(hover.x > 200
              ? { right: `calc(100% - ${hover.x}px + 4px)` }
              : { left: hover.x + 28 }),
          }}
        >
          <div className={styles.tipTime}>
            {dayjs.unix(hover.ts).format('MM-DD HH:mm:ss')}
          </div>
          {series.map((s, i) => (
            <div key={s.name}>
              <i
                className={styles.swatch}
                style={{ background: colors[i % colors.length] }}
              />
              {seriesName(s.name)}：
              {nearest[i] ? formatMetric(nearest[i][1], panel.unit) : '-'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RANGES = [
  { value: 3600, label: '1h' },
  { value: 6 * 3600, label: '6h' },
  { value: 24 * 3600, label: '24h' },
  { value: 7 * 24 * 3600, label: '7d' },
];

export const MetricsPanel: React.FC<{
  clusterId: string;
  target: MetricsTarget;
  /** 只展示这些面板（缺省全部） */
  panels?: string[];
  /** 紧凑：不显示时间范围选择（总览里的概览条） */
  compact?: boolean;
}> = ({ clusterId, target, panels, compact }) => {
  const t = useT();
  const { styles } = useStyles();
  const [range, setRange] = useState(3600);
  const [data, setData] = useState<MetricsResult>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const targetKey = JSON.stringify(target);
  const panelKey = (panels ?? []).join(',');

  const load = useCallback(async () => {
    setLoading(true);
    const end = dayjs();
    try {
      const res = await queryMetrics(
        clusterId,
        JSON.parse(targetKey) as MetricsTarget,
        {
          start: end.subtract(range, 'second').toISOString(),
          end: end.toISOString(),
        },
        panelKey ? panelKey.split(',') : undefined,
      );
      setData(res);
      setError(undefined);
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId, targetKey, panelKey, range]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <Alert type="error" showIcon title={error} />;
  if (!data) return <Spin style={{ display: 'block', margin: '48px auto' }} />;
  if (!data.configured) {
    return compact ? null : (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('pages.k8s.metrics.unconfigured')}
      />
    );
  }
  const start = dayjs(data.start).unix();
  const end = dayjs(data.end).unix();
  return (
    <Spin spinning={loading}>
      {!compact && (
        <Flex justify="flex-end" gap={8} style={{ marginBottom: 12 }}>
          <Segmented
            options={RANGES}
            value={range}
            onChange={(v) => setRange(Number(v))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void load()} />
        </Flex>
      )}
      <div className={styles.grid}>
        {(data.panels ?? []).map((panel) => (
          <Chart key={panel.id} panel={panel} start={start} end={end} />
        ))}
      </div>
    </Spin>
  );
};
