/** 作业中心页面共享样式：等宽文本、行内编辑器、主机清单、终端式日志。 */
import { createStyles } from 'antd-style';

/**
 * 终端配色：日志区固定为深色（与明暗主题无关——终端输出在深色底上最易读），
 * 因此这一组颜色不取主题 token。
 */
const TERMINAL = {
  bg: '#0d1117',
  border: '#30363d',
  text: '#c9d1d9',
  dim: '#8b949e',
  red: '#ff7b72',
  yellow: '#e3b341',
  green: '#56d364',
  cyan: '#56b6c2',
} as const;

export const useJobStyles = createStyles(({ token, css }) => ({
  /** 路径 / 指纹 / 提交号等代码类文本 */
  code: css`
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    word-break: break-all;
  `,
  codeBlock: css`
    margin: 0;
    padding: 8px 12px;
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    white-space: pre-wrap;
    word-break: break-all;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  codeInput: css`
    font-family: ${token.fontFamilyCode};
  `,
  hint: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  secondary: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  danger: css`
    color: ${token.colorError};
  `,
  success: css`
    color: ${token.colorSuccess};
  `,
  warning: css`
    color: ${token.colorWarning};
  `,
  /** 行内编辑器（执行参数）的一行卡片 */
  editorCard: css`
    margin-bottom: 8px;
    padding: 12px 12px 4px;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  editorCardError: css`
    border-color: ${token.colorError};
  `,
  /** 已选资源的标签区 */
  pickedBox: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px 0;
    max-height: 168px;
    margin-top: 8px;
    padding: 8px;
    overflow: auto;
    border: 1px dashed ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
  `,
  /** 命中的高危命令规则的一条 */
  riskHit: css`
    margin-bottom: 8px;
    &:last-child {
      margin-bottom: 0;
    }
  `,
  /** 只读的命令 / 脚本内容 */
  scriptBlock: css`
    max-height: 420px;
    margin: 0;
    padding: 8px 12px;
    overflow: auto;
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    white-space: pre;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  /** 主机清单里不能执行的行 */
  problemRow: css`
    > td {
      background: ${token.colorErrorBg} !important;
    }
  `,
  /** 执行表单顶部的「将在 N 台主机上执行」 */
  hostCount: css`
    color: ${token.colorText};
    font-weight: 600;
    font-size: ${token.fontSizeHeading4}px;
    font-variant-numeric: tabular-nums;
  `,
  /** 列表里随时间跳动的数字（时长、主机数）等宽对齐 */
  tabular: css`
    font-variant-numeric: tabular-nums;
  `,
  /** 终端式日志 */
  terminal: css`
    height: calc(100vh - 420px);
    min-height: 360px;
    padding: 12px 16px;
    overflow: auto;
    color: ${TERMINAL.text};
    font-family: ${token.fontFamilyCode};
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    background: ${TERMINAL.bg};
    border: 1px solid ${TERMINAL.border};
    border-radius: ${token.borderRadiusLG}px;
  `,
  terminalNotice: css`
    margin-bottom: 8px;
    color: ${TERMINAL.dim};
    font-style: italic;
  `,
  terminalNoticeLink: css`
    color: ${TERMINAL.cyan};
    text-decoration: underline;
    cursor: pointer;
  `,
  logLine: css`
    min-height: 1.6em;
  `,
  logRed: css`
    color: ${TERMINAL.red};
  `,
  logYellow: css`
    color: ${TERMINAL.yellow};
  `,
  logGreen: css`
    color: ${TERMINAL.green};
  `,
  logCyan: css`
    color: ${TERMINAL.cyan};
    opacity: 0.75;
  `,
}));
