/** 告警统计 / 引擎状态页的样式：指标卡、图例、排行横条、对比横条。颜色全部来自主题 token。 */
import { createStyles } from 'antd-style';

export const useStatsStyles = createStyles(({ token, css }) => ({
  toolbar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
  `,
  hint: css`
    color: ${token.colorTextTertiary};
    font-weight: normal;
    font-size: ${token.fontSizeSM}px;
  `,
  /** 指标卡：每行排满，窄屏自动换行 */
  tileGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  `,
  /** 概览的七张卡（第一张占两列）：宽屏一行排满，窄一些时四列两行，不留孤零零的一张 */
  overviewGrid: css`
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 12px;
    @media (max-width: 1500px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  tile: css`
    position: relative;
    min-width: 0;
    padding: 12px 16px;
    overflow: hidden;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  /** 带状态的指标卡左缘色条（数值本身保持正文色，状态只由色条与图标表达） */
  tileBar: css`
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 4px;
  `,
  toneError: css`
    background: ${token.colorError};
  `,
  toneWarning: css`
    background: ${token.colorWarning};
  `,
  toneSuccess: css`
    background: ${token.colorSuccess};
  `,
  tileWide: css`
    grid-column: span 2;
  `,
  tileLabel: css`
    overflow: hidden;
    color: ${token.colorTextSecondary};
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  tileValue: css`
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeHeading3}px;
    line-height: ${token.lineHeightHeading3};
    font-variant-numeric: tabular-nums;
  `,
  tileExtra: css`
    margin-top: 4px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
    font-variant-numeric: tabular-nums;
  `,
  severityBreakdown: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
  `,
  severityItem: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
  `,
  strong: css`
    color: ${token.colorText};
    font-weight: 600;
  `,
  /** 图例：色块 + 名称 + 合计 */
  legend: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-bottom: 8px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  legendItem: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;
    max-width: 240px;
  `,
  legendName: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  swatch: css`
    display: inline-block;
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: ${token.borderRadiusXS}px;
  `,
  hoverBand: css`
    fill: ${token.colorFillQuaternary};
  `,
  hitArea: css`
    fill: transparent;
  `,
  /** 排行：一行 = 名称与数量 + 一根长度即数量的横条 */
  rankList: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  rankHead: css`
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  `,
  rankIndex: css`
    flex: none;
    width: 20px;
    color: ${token.colorTextTertiary};
    font-variant-numeric: tabular-nums;
  `,
  rankName: css`
    min-width: 0;
    overflow: hidden;
    color: ${token.colorText};
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  rankGone: css`
    color: ${token.colorTextTertiary};
  `,
  rankCount: css`
    flex: none;
    margin-inline-start: auto;
    color: ${token.colorText};
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  `,
  rankSub: css`
    margin-inline-start: 28px;
    overflow: hidden;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  track: css`
    height: 8px;
    overflow: hidden;
    background: ${token.colorFillTertiary};
    border-radius: ${token.borderRadiusSM}px;
  `,
  rankTrack: css`
    margin-top: 4px;
    margin-inline-start: 28px;
  `,
  bar: css`
    height: 100%;
    background: ${token.colorPrimary};
    /* 基线端方角、数据端圆角 */
    border-radius: 0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px 0;
  `,
  barMuted: css`
    background: ${token.colorTextQuaternary};
  `,
  /** 降噪对比：标签 | 横条 | 数量与占比 */
  compareRow: css`
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr) 120px;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
    color: ${token.colorTextSecondary};
  `,
  compareSub: css`
    padding-inline-start: 12px;
  `,
  compareValue: css`
    color: ${token.colorText};
    font-variant-numeric: tabular-nums;
    text-align: end;
    white-space: nowrap;
  `,
  /** 通知构成：一根按来源分段的横条 */
  split: css`
    display: flex;
    gap: 2px;
    height: 12px;
    margin-block: 8px;
    overflow: hidden;
    border-radius: ${token.borderRadiusSM}px;
  `,
  totalRow: css`
    font-weight: 600;
    background: ${token.colorFillQuaternary};
  `,
  /** 已失联的引擎实例整行置灰 */
  staleRow: css`
    color: ${token.colorTextTertiary};
  `,
  okIcon: css`
    color: ${token.colorSuccess};
    font-size: ${token.fontSizeHeading2}px;
  `,
}));
