/** 指标卡（告警统计的概览与引擎状态页共用）：名称 + 大号数值 + 可选的补充行；tone 只画左缘色条。 */
import { Tooltip } from 'antd';
import type React from 'react';
import { useStatsStyles } from './styles';

export type StatTone = 'error' | 'warning' | 'success';

export const StatTile: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  /** 状态色条；不传即普通指标 */
  tone?: StatTone;
  /** 名称的悬停说明 */
  tooltip?: string;
  /** 占两列（内容较多的卡） */
  wide?: boolean;
  children?: React.ReactNode;
}> = ({ label, value, tone, tooltip, wide, children }) => {
  const { styles, cx } = useStatsStyles();
  const toneClass =
    tone === 'error'
      ? styles.toneError
      : tone === 'warning'
        ? styles.toneWarning
        : tone === 'success'
          ? styles.toneSuccess
          : undefined;
  return (
    <div className={cx(styles.tile, wide && styles.tileWide)}>
      {toneClass && <span className={cx(styles.tileBar, toneClass)} />}
      <Tooltip title={tooltip}>
        <div className={styles.tileLabel}>{label}</div>
      </Tooltip>
      <div className={styles.tileValue}>{value}</div>
      {children && <div className={styles.tileExtra}>{children}</div>}
    </div>
  );
};

export default StatTile;
