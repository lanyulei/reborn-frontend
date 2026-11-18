/** 升级策略页面自己的样式：各级卡片里「标签 + 控件」的行、列表里的各级摘要。颜色来自主题 token。 */
import { createStyles } from 'antd-style';

export const useEscalationStyles = createStyles(({ token, css }) => ({
  levelCard: css`
    margin-bottom: 12px;
  `,
  field: css`
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 12px;
    &:last-child {
      margin-bottom: 0;
    }
  `,
  fieldLabel: css`
    flex: none;
    width: 104px;
    color: ${token.colorTextSecondary};
    line-height: ${token.controlHeight}px;
  `,
  fieldBody: css`
    flex: 1;
    min-width: 0;
  `,
  /** 一行里并排的几个控件（触发条件 + 时间、重复间隔 + 次数上限） */
  inline: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  `,
  /** 列表「各级」列的一级 */
  summaryLevel: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: center;
    margin-bottom: 4px;
    &:last-child {
      margin-bottom: 0;
    }
  `,
  warn: css`
    color: ${token.colorWarning};
    font-weight: 600;
  `,
}));
