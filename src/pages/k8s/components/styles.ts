/** 容器平台页面共享样式：等宽文本、代码块、日志与终端面板、左右分栏侧栏。 */
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
  /** 左右分栏（资源浏览器）：左侧吸顶卡片 + 右侧自适应，同 CMDB 实例页 / 告警规则页 */
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
  /** 标题旁的类型数量 */
  sideCount: css`
    margin-inline-start: 8px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  `,
  splitMain: css`
    flex: 1;
    min-width: 0;
  `,
  /** 侧栏菜单（inline）：贴住卡片左右各 16px */
  sideMenu: css`
    .ant-menu-item {
      width: calc(100% - 32px);
      margin-inline: 16px;
    }
  `,
  /** 侧栏菜单项：名称 +（搜索时的组 / 资源名提示）+ CRD 标记 */
  menuItem: css`
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  `,
  menuItemName: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  menuItemMeta: css`
    flex: none;
    overflow: hidden;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
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
