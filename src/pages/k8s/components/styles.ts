/** 容器平台页面共享样式：等宽文本、代码块、作用域栏、日志与终端面板。 */
import { createStyles } from 'antd-style';

/** 日志 / 终端固定深色底（终端输出在深色底上最易读），不取主题 token */
export const TERMINAL = {
  bg: '#0d1117',
  border: '#30363d',
  text: '#c9d1d9',
  dim: '#8b949e',
  cyan: '#56b6c2',
  yellow: '#e3b341',
} as const;

export const useK8sStyles = createStyles(({ token, css }) => ({
  code: css`
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    word-break: break-all;
  `,
  codeBlock: css`
    margin: 0;
    padding: 8px 12px;
    max-height: 360px;
    overflow: auto;
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    white-space: pre-wrap;
    word-break: break-all;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadius}px;
  `,
  secondary: css`
    color: ${token.colorTextSecondary};
    font-size: ${token.fontSizeSM}px;
  `,
  scopeBar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    align-items: center;
    margin-bottom: 16px;
    padding: 16px 24px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  scopeLabel: css`
    margin-inline-end: 8px;
    color: ${token.colorTextSecondary};
  `,
  editor: css`
    overflow: hidden;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    .cm-editor {
      font-size: 12px;
    }
    .cm-editor.cm-focused {
      outline: none;
    }
    .cm-scroller {
      font-family: ${token.fontFamilyCode};
      line-height: 1.6;
    }
    .cm-mergeView .cm-editor {
      height: 100%;
    }
  `,
  logPanel: css`
    overflow: auto;
    padding: 8px 12px;
    color: ${TERMINAL.text};
    font-family: ${token.fontFamilyCode};
    font-size: 12px;
    line-height: 1.6;
    background: ${TERMINAL.bg};
    border: 1px solid ${TERMINAL.border};
    border-radius: ${token.borderRadiusLG}px;
  `,
  logWrap: css`
    white-space: pre-wrap;
    word-break: break-all;
  `,
  logNoWrap: css`
    white-space: pre;
  `,
  logLine: css`
    min-height: 1.6em;
  `,
  logSource: css`
    margin-inline-end: 8px;
    color: ${TERMINAL.cyan};
  `,
  logNotice: css`
    color: ${TERMINAL.dim};
    font-style: italic;
  `,
  logMark: css`
    color: ${TERMINAL.bg};
    background: ${TERMINAL.yellow};
  `,
  termBox: css`
    height: 100%;
    padding: 8px;
    background: ${TERMINAL.bg};
    border-radius: ${token.borderRadius}px;
  `,
  kv: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  `,
}));
