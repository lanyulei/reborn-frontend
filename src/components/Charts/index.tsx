/**
 * 手写 SVG / CSS 轻量图表件（不引图表库，规避 utoopack 新增模块崩溃），各模块的统计页共用：
 * - useSize   容器尺寸（ResizeObserver）
 * - StatCard  统计卡（白底卡片 + value / label + 圆形图标）
 * - BarList   排序横条（单色幅度编码：条形长度即数量，值标在条端）
 * 颜色全部来自 antd 主题 token；不做多系列分类色。
 */
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    font-size: ${token.fontSizeHeading3}px;
    font-weight: 600;
    line-height: ${token.lineHeightHeading3};
    font-variant-numeric: tabular-nums;
  `,
  statIcon: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
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
    width: 30%;
    max-width: 160px;
    overflow: hidden;
    color: ${token.colorTextSecondary};
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
    font-variant-numeric: tabular-nums;
    line-height: 1;
    white-space: nowrap;
    transform: translateY(-50%);
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
