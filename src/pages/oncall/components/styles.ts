/**
 * 值班页面共享样式（antd-style，全部走主题 token，暗色安全）：
 * 当前值班条 / 月视图单元格 / 图例 / 配置页分栏 / 公共日历页。
 */
import { createStyles } from 'antd-style';

export const useOncallStyles = createStyles(({ token, css, prefixCls }) => ({
  /**
   * 当前值班：与下方卡片等宽的一行。只用一种字号（正文 14px）、两种颜色——
   * 标签用次要色，值用正文色；标题加粗。值班表与分组已在下方筛选里，这里不重复。
   */
  dutyBar: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    padding: 16px 24px;
    font-size: ${token.fontSize}px;
    line-height: 22px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  dutyLine: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 32px;
    align-items: center;
  `,
  dutyTitle: css`
    display: inline-flex;
    gap: 8px;
    align-items: center;
    color: ${token.colorText};
    font-weight: 600;
  `,
  /** 值班中状态点：无人值班时为错误色 */
  dutyDot: css`
    flex: none;
    width: 8px;
    height: 8px;
    background: ${token.colorSuccess};
    border-radius: 50%;
    box-shadow: 0 0 0 3px ${token.colorSuccessBg};
  `,
  dutyDotEmpty: css`
    background: ${token.colorError};
    box-shadow: 0 0 0 3px ${token.colorErrorBg};
  `,
  /** 一项：标签 + 值 */
  dutyItem: css`
    display: inline-flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  `,
  dutyLabel: css`
    color: ${token.colorTextSecondary};
  `,
  dutyValue: css`
    color: ${token.colorText};
    font-variant-numeric: tabular-nums;
  `,
  /** 无人值班：用次要文字色，不用大片红字；警示由前面的红色状态点承担 */
  dutyEmpty: css`
    color: ${token.colorTextTertiary};
  `,
  /** 下次交接：靠右 */
  dutyHandover: css`
    margin-inline-start: auto;
  `,
  dutyRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    align-items: center;
    color: ${token.colorText};
  `,
  dutyMeta: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  /** 筛选卡片：左右内边距与 ProTable 页面的搜索卡片一致（24px），上下 16px */
  toolbar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px 24px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  /** 内容卡片头部右侧操作组：换行后仍靠右 */
  toolbarActions: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-inline-start: auto;
  `,
  spacer: css`
    flex: 1;
  `,
  /** 通用卡片（公共日历页的页头） */
  card: css`
    padding: 20px 24px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  /**
   * 月视图容器：与 ProTable 表格卡片同规格——左右内边距 24px、头部 64px、底部 16px；
   * 月历网格内缩在卡片里，星期行与表头同底色同圆角（覆盖 antd Calendar 的表格样式）。
   */
  calendarWrap: css`
    padding: 0 24px 16px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;

    .${prefixCls}-picker-calendar,
    .${prefixCls}-picker-calendar .${prefixCls}-picker-panel {
      background: transparent;
      border-top: 0;
    }
    .${prefixCls}-picker-calendar .${prefixCls}-picker-body {
      padding: 0;
    }
    .${prefixCls}-picker-calendar .${prefixCls}-picker-content {
      width: 100%;
      table-layout: fixed;
      border-collapse: separate;
      border-spacing: 0;
    }
    .${prefixCls}-picker-calendar.${prefixCls}-picker-calendar-full .${prefixCls}-picker-content th {
      height: 47px;
      padding: 0 12px;
      color: ${token.colorText};
      font-weight: 600;
      line-height: 47px;
      text-align: start;
      background: ${token.colorFillAlter};
      border-bottom: 1px solid ${token.colorBorderSecondary};
    }
    .${prefixCls}-picker-calendar .${prefixCls}-picker-content th:first-child {
      border-start-start-radius: ${token.borderRadiusLG}px;
    }
    .${prefixCls}-picker-calendar .${prefixCls}-picker-content th:last-child {
      border-start-end-radius: ${token.borderRadiusLG}px;
    }
    .${prefixCls}-picker-calendar .${prefixCls}-picker-content td {
      padding: 0;
      vertical-align: top;
      border-bottom: 1px solid ${token.colorBorderSecondary};
      border-inline-end: 1px solid ${token.colorBorderSecondary};
    }
    .${prefixCls}-picker-calendar .${prefixCls}-picker-content td:first-child {
      border-inline-start: 1px solid ${token.colorBorderSecondary};
    }
  `,
  calendarHeader: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    padding: 16px 0;
  `,
  /** 手动发送值班通知弹窗 */
  notifyBody: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 8px;
  `,
  notifyField: css`
    display: flex;
    gap: 16px;
    align-items: flex-start;
    line-height: 22px;
  `,
  notifyLabel: css`
    flex: none;
    width: 72px;
    color: ${token.colorTextSecondary};
  `,
  notifyValue: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    color: ${token.colorText};
  `,
  notifyMuted: css`
    color: ${token.colorTextTertiary};
  `,
  notifyError: css`
    color: ${token.colorError};
    word-break: break-word;
  `,
  /** 一个事件的投递结果 */
  notifyResult: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 16px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
  `,
  notifyWho: css`
    color: ${token.colorText};
    font-weight: 500;
  `,
  notifyDelivery: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: center;
    .${prefixCls}-tag {
      margin-inline-end: 0;
    }
  `,
  /** 头部里的「标签：控件」，写法同 ProTable 搜索项 */
  fieldInline: css`
    display: inline-flex;
    align-items: center;
    color: ${token.colorText};
    white-space: nowrap;
  `,
  calendarTitle: css`
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeLG}px;
    font-variant-numeric: tabular-nums;
  `,
  /** 图例：月历下方 */
  legend: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    align-items: center;
    margin-top: 16px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  legendItem: css`
    display: inline-flex;
    gap: 4px;
    align-items: center;
  `,
  /** 日历单元格（fullCellRender）：左上日期 + 值班行 */
  cell: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 116px;
    padding: 6px 0 8px;
    overflow: hidden;
    text-align: start;
    cursor: default;
    transition: background ${token.motionDurationMid};
    &:hover {
      background: ${token.colorFillQuaternary};
    }
  `,
  /** 非本月的日期：内容淡出 */
  cellOutside: css`
    > * {
      opacity: 0.45;
    }
  `,
  cellToday: css`
    background: color-mix(in srgb, ${token.colorPrimaryBg} 55%, transparent);
    &:hover {
      background: color-mix(in srgb, ${token.colorPrimaryBg} 55%, transparent);
    }
  `,
  /** 已过去的日期：值班条淡出，视线落在今天及以后 */
  cellPast: css`
    > :last-child {
      opacity: 0.55;
    }
  `,
  cellIssue: css`
    background: ${token.colorErrorBg};
    &:hover {
      background: ${token.colorErrorBg};
    }
  `,
  /** 还缺主或备值班人的日期（今天及以后）：格子空白处可点击，临时安排值班人 */
  cellAssignable: css`
    cursor: pointer;
  `,
  cellHead: css`
    display: flex;
    flex: none;
    gap: 4px;
    align-items: center;
    justify-content: space-between;
    height: 24px;
    padding: 0 12px;
  `,
  /** 日期数字：今天为实心主色圆 */
  cellDate: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    color: ${token.colorText};
    font-variant-numeric: tabular-nums;
    border-radius: 12px;
  `,
  cellDateToday: css`
    min-width: 24px;
    margin-inline-start: -6px;
    padding: 0 6px;
    color: ${token.colorTextLightSolid};
    font-weight: 600;
    background: ${token.colorPrimary};
  `,
  cellIssueIcon: css`
    color: ${token.colorError};
    cursor: pointer;
  `,
  cellBody: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
  `,
  /** 值班条：一张值班表一个角色一条，底色取值班人的颜色（--oncall-color） */
  bar: css`
    flex: none;
    margin: 0 6px;
    padding: 0 6px;
    overflow: hidden;
    color: ${token.colorText};
    font-size: ${token.fontSizeSM}px;
    line-height: 20px;
    white-space: nowrap;
    text-overflow: ellipsis;
    background-color: color-mix(in srgb, var(--oncall-color) 16%, ${token.colorBgContainer});
    border-radius: ${token.borderRadiusSM}px;
    transition: background-color ${token.motionDurationMid};
  `,
  /** 备值班：底色更浅，主值班更醒目 */
  barBackup: css`
    color: ${token.colorTextSecondary};
    background-color: color-mix(in srgb, var(--oncall-color) 7%, ${token.colorBgContainer});
  `,
  /** 替班：斜纹 */
  barOverride: css`
    background-image: repeating-linear-gradient(
      -45deg,
      transparent 0 4px,
      color-mix(in srgb, var(--oncall-color) 20%, transparent) 4px 8px
    );
  `,
  barClickable: css`
    cursor: pointer;
    &:hover {
      background-color: color-mix(in srgb, var(--oncall-color) 28%, ${token.colorBgContainer});
    }
  `,
  /** 条内角色简称（主 / 备） */
  barRole: css`
    margin-inline-end: 4px;
    color: color-mix(in srgb, var(--oncall-color) 70%, ${token.colorText});
    font-weight: 600;
    font-size: 11px;
  `,
  /** 图例里的替班色块 */
  legendSwatch: css`
    margin: 0;
    --oncall-color: ${token.colorTextTertiary};
  `,
  /** 值班人颜色圆点（悬停卡片） */
  personDot: css`
    flex: none;
    width: 8px;
    height: 8px;
    background: var(--oncall-color);
    border-radius: 50%;
  `,
  /** 悬停卡片：当天完整接力情况 */
  detail: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 420px;
  `,
  detailRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: center;
    color: ${token.colorText};
  `,
  detailTime: css`
    color: ${token.colorTextSecondary};
    font-variant-numeric: tabular-nums;
  `,
  detailMeta: css`
    color: ${token.colorTextTertiary};
    font-variant-numeric: tabular-nums;
  `,
  lineSchedule: css`
    color: ${token.colorTextTertiary};
  `,
  /** 角色简称徽标（主 / 备） */
  roleBadge: css`
    flex: none;
    padding: 0 4px;
    color: ${token.colorPrimary};
    font-size: 11px;
    line-height: 16px;
    background: ${token.colorPrimaryBg};
    border-radius: ${token.borderRadiusSM}px;
  `,
  roleBadgeBackup: css`
    color: ${token.colorTextSecondary};
    background: ${token.colorFillSecondary};
  `,
  segment: css`
    border-radius: ${token.borderRadiusSM}px;
  `,
  /** 替班标签：警示色 */
  segmentOverride: css`
    padding: 0 2px;
    color: ${token.colorWarningText};
    background: ${token.colorWarningBg};
  `,
  segmentUnavailable: css`
    color: ${token.colorError};
    text-decoration: line-through;
  `,
  issueList: css`
    max-width: 420px;
    margin: 0;
    padding-inline-start: 18px;
  `,
  /** 轮转名单：有序行 */
  rotationList: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  `,
  rotationRow: css`
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 4px 8px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
  `,
  rotationIndex: css`
    flex: none;
    width: 20px;
    color: ${token.colorTextTertiary};
    font-variant-numeric: tabular-nums;
    text-align: end;
  `,
  rotationName: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  /** 分组详情概要头 */
  summaryHeader: css`
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    padding: 20px 24px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  summaryBody: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  `,
  summaryTitle: css`
    display: flex;
    gap: 8px;
    align-items: center;
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeLG}px;
  `,
  summaryMeta: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    align-items: center;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  /** 公共日历页（无主布局） */
  publicPage: css`
    min-height: 100vh;
    padding: 24px;
    background: ${token.colorBgLayout};
  `,
  publicInner: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1280px;
    margin: 0 auto;
  `,
  /** 页头：图标 + 标题 / 标签 + 说明 */
  publicHeader: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
  `,
  publicIcon: css`
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    color: ${token.colorPrimary};
    font-size: 24px;
    background: ${token.colorPrimaryBg};
    border-radius: ${token.borderRadiusLG}px;
  `,
  publicHeading: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
    min-width: 0;
  `,
  publicTitleRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    .${prefixCls}-tag {
      margin-inline-end: 0;
    }
  `,
  publicTitle: css`
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeLG}px;
    line-height: 24px;
  `,
  publicDesc: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    white-space: pre-wrap;
    word-break: break-word;
  `,
  /** 页头右侧的时区提示：置顶，与标题行对齐 */
  publicHint: css`
    flex: none;
    align-self: flex-start;
    line-height: 24px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  /** 查看地址弹窗：一段说明 + 一个代码块 */
  addressItem: css`
    margin-top: 20px;
  `,
  addressLabel: css`
    color: ${token.colorText};
    font-weight: 500;
  `,
  /** 代码块：等宽字体、浅底、右上角复制 */
  codeBlock: css`
    display: flex;
    margin-top: 8px;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  codeText: css`
    flex: 1;
    min-width: 0;
    color: ${token.colorText};
    font-size: ${token.fontSizeSM}px;
    font-family: ${token.fontFamilyCode};
    line-height: 20px;
    word-break: break-all;
  `,
}));
