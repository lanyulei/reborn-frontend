/** 监控告警页面共享样式：左右分栏、PromQL 等宽文本、级别色条、聚合卡片、图表。颜色全部来自主题 token。 */
import { createStyles } from 'antd-style';

export const useMonitorStyles = createStyles(({ token, css }) => ({
  /** 左右分栏：左侧固定宽度面板（吸顶）+ 右侧自适应内容（同 CMDB 资源实例页） */
  split: css`
    display: flex;
    align-items: flex-start;
    gap: 16px;
  `,
  splitSide: css`
    position: sticky;
    top: 72px;
    flex: none;
    width: 260px;
    max-height: calc(100vh - 96px);
    overflow: auto;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  splitSideTitle: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px 4px;
    color: ${token.colorText};
    font-weight: 600;
  `,
  splitMain: css`
    flex: 1;
    min-width: 0;
  `,
  /** 分组树的一行：上下留白把行撑高一点；右键菜单挂在它上面，所以要占满整行 */
  treeNode: css`
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
    padding-block: 3px;
  `,
  treeNodeName: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  /** 分组树上方的「全部」（button 元素）：外观同树节点（名称 + 右侧数量） */
  treeAll: css`
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    padding: 4px 8px;
    margin-bottom: 4px;
    overflow: hidden;
    color: ${token.colorText};
    font: inherit;
    white-space: nowrap;
    text-align: start;
    background: none;
    border: 0;
    border-radius: ${token.borderRadiusSM}px;
    cursor: pointer;
    &:hover {
      background: ${token.controlItemBgHover};
    }
    &:focus-visible {
      outline: ${token.lineWidthFocus}px solid ${token.colorPrimaryBorder};
    }
  `,
  treeAllActive: css`
    color: ${token.colorPrimary};
  `,
  treeNodeMuted: css`
    color: ${token.colorTextTertiary};
  `,
  treeNodeCount: css`
    flex: none;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    font-variant-numeric: tabular-nums;
  `,
  /** PromQL / 代码类文本 */
  code: css`
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    white-space: pre-wrap;
    word-break: break-all;
  `,
  codeBlock: css`
    padding: 8px 12px;
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    white-space: pre-wrap;
    word-break: break-all;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
  `,
  codeInput: css`
    font-family: ${token.fontFamilyCode};
  `,
  /** 级别色条：表格首列 / 卡片左缘 */
  severityBar: css`
    display: inline-block;
    flex: none;
    width: 4px;
    height: 16px;
    border-radius: ${token.borderRadiusXS}px;
    vertical-align: middle;
  `,
  /** 色条颜色按级别元数据的徽标状态取（与通知域的级别徽标同色） */
  severityDefault: css`
    background: ${token.colorTextQuaternary};
  `,
  severityWarning: css`
    background: ${token.colorWarning};
  `,
  severityError: css`
    background: ${token.colorError};
  `,
  /** 聚合卡片 */
  aggGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  `,
  aggCard: css`
    position: relative;
    padding: 12px 16px 12px 20px;
    overflow: hidden;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  /** 可点击的卡片（button 元素）：去掉按钮默认外观，补悬停与键盘焦点样式 */
  aggCardButton: css`
    display: block;
    width: 100%;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
    transition: border-color ${token.motionDurationMid};
    &:hover {
      border-color: ${token.colorPrimaryBorderHover};
    }
    &:focus-visible {
      outline: ${token.lineWidthFocus}px solid ${token.colorPrimaryBorder};
      outline-offset: 1px;
    }
  `,
  aggCardActive: css`
    border-color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
  aggCardBar: css`
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 4px;
  `,
  aggCardName: css`
    overflow: hidden;
    color: ${token.colorTextSecondary};
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  aggCardCount: css`
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeHeading3}px;
    line-height: ${token.lineHeightHeading3};
    font-variant-numeric: tabular-nums;
  `,
  /** 行内编辑器（匹配条件 / 键值 / 时间窗）的一行 */
  editorRow: css`
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-bottom: 8px;
  `,
  /** 一组 Tag 的容器（标签集 / 引用对象 / 匹配条件），可换行 */
  tagList: css`
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px 0;
  `,
  /** 「+N」悬停展开的全部 Tag */
  tagListPopover: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 0;
    max-width: 480px;
  `,
  hint: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  expired: css`
    color: ${token.colorTextTertiary};
  `,
  /** 折线图 */
  chartWrap: css`
    position: relative;
  `,
  chartGrid: css`
    stroke: ${token.colorSplit};
    stroke-width: 1;
  `,
  chartAxis: css`
    fill: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  chartCursor: css`
    stroke: ${token.colorBorder};
    stroke-width: 1;
  `,
  chartTooltip: css`
    position: absolute;
    z-index: 10;
    max-width: 420px;
    padding: 8px 12px;
    pointer-events: none;
    background: ${token.colorBgElevated};
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  chartTooltipTitle: css`
    margin-bottom: 4px;
    color: ${token.colorText};
    font-weight: 600;
  `,
  chartTooltipRow: css`
    display: flex;
    gap: 8px;
    align-items: center;
    color: ${token.colorTextSecondary};
    line-height: 20px;
  `,
  chartTooltipName: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  chartSwatch: css`
    display: inline-block;
    flex: none;
    width: 10px;
    height: 2px;
  `,
}));
