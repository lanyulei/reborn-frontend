/** 故障管理页面共享样式：卡片、提示文字、等宽文本、时间线正文、指标卡。颜色全部来自主题 token。 */
import { createStyles } from 'antd-style';

export const useIncidentStyles = createStyles(({ token, css }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
    padding: 16px 20px;
  `,
  hint: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  pre: css`
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.7;
  `,
  mono: css`
    font-family: ${token.fontFamilyCode};
    font-size: 12px;
    word-break: break-all;
  `,
  summaryBox: css`
    padding: 12px 16px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.7;
  `,
  timelineBody: css`
    color: ${token.colorTextSecondary};
    white-space: pre-wrap;
    word-break: break-word;
  `,
  timelineHead: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    color: ${token.colorText};
  `,
  pinned: css`
    border-inline-start: 3px solid ${token.colorWarning};
    padding-inline-start: 8px;
    margin-inline-start: -11px;
  `,
  /** 详情页头部标题（与流程 / 工单详情同口径） */
  headTitle: css`
    margin: 0 !important;
    font-size: ${token.fontSizeHeading4}px !important;
    word-break: break-word;
  `,
  headMeta: css`
    margin-top: 16px;
  `,
  /** 匿名状态页标题行 */
  headerTitle: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: ${token.fontSizeHeading4}px;
    font-weight: 600;
  `,
  publicPage: css`
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 16px 64px;
  `,
  /** 预案步骤编辑器：一步一块 */
  step: css`
    margin-bottom: 12px;
    padding: 12px 16px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  stepHead: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-weight: 600;
  `,
  stepGrid: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px 12px;
    margin-bottom: 8px;
  `,
  fieldLabel: css`
    margin-bottom: 4px;
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  /** 统计概览的八张卡（第一张占两列 = 九格）：宽屏一行排满，中等宽度三列三行，窄屏两列 */
  overviewGrid: css`
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
    @media (max-width: 1600px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
}));
