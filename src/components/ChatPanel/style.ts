import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => ({
  layout: css`
    display: flex;
    flex: 1;
    overflow: hidden;
  `,

  sidebar: css`
    width: 260px;
    background: ${token.colorBgContainer};
    border-right: 1px solid ${token.colorBorderSecondary};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,

  main: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
    background: ${token.colorBgContainer};
  `,

  messages: css`
    flex: 1;
    overflow-y: auto;
    padding: ${token.paddingMD}px;
    display: flex;
    flex-direction: column;
    align-items: center;

    > * {
      width: 100%;
    }
  `,

  footer: css`
    padding: ${token.paddingMD}px;
    border-top: 1px solid ${token.colorBorderSecondary};
    display: flex;
    justify-content: center;
  `,

  footerCenter: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${token.paddingLG}px;
    gap: 32px;
    margin-top: -10%;
  `,

  welcomeTitle: css`
    font-size: 32px;
    font-weight: 600;
    color: ${token.colorText};
    text-align: center;
  `,

  /* 助手消息正文：覆盖 x-markdown 缺省样式，按主题 token 分层（标题/段落/列表/表格/代码/引用） */
  markdown: css`
    font-size: ${token.fontSize}px;
    line-height: 1.75;
    color: ${token.colorText};

    .x-markdown {
      --margin-block: 0 0 0.75em 0;
    }

    h1, h2, h3, h4, h5, h6 {
      margin: 1.1em 0 0.5em;
      font-weight: 600;
      line-height: 1.4;
      color: ${token.colorTextHeading};
    }
    h1 { font-size: 1.45em; }
    h2 {
      font-size: 1.25em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid ${token.colorBorderSecondary};
    }
    h3 { font-size: 1.1em; }
    h4, h5, h6 { font-size: 1em; }
    > .x-markdown > :first-child,
    h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }

    p { margin: 0 0 0.75em; }
    p:last-child { margin-bottom: 0; }
    strong { font-weight: 600; color: ${token.colorTextHeading}; }

    ul, ol {
      margin: 0 0 0.75em;
      padding-left: 1.5em;
    }
    li { margin: 0.3em 0; }
    li > p { margin-bottom: 0.25em; }
    ul ul, ol ol, ul ol, ol ul { margin-bottom: 0; }

    a {
      color: ${token.colorLink};
      text-decoration: none;
      &:hover { color: ${token.colorLinkHover}; text-decoration: underline; }
    }

    blockquote {
      margin: 0.75em 0;
      padding: 6px 14px;
      color: ${token.colorTextSecondary};
      background: ${token.colorFillQuaternary};
      border-left: 3px solid ${token.colorPrimary};
      border-radius: 0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px 0;
      > p:last-child { margin-bottom: 0; }
    }

    hr {
      height: 0;
      margin: 1.2em 0;
      border: 0;
      border-top: 1px solid ${token.colorBorderSecondary};
    }

    code {
      padding: 0.15em 0.45em;
      margin: 0 0.15em;
      font-family: ${token.fontFamilyCode};
      font-size: 0.88em;
      color: ${token.colorText};
      background: ${token.colorFillTertiary};
      border-radius: ${token.borderRadiusSM}px;
    }

    pre {
      margin: 0.75em 0;
      padding: 12px 14px;
      overflow: auto;
      font-family: ${token.fontFamilyCode};
      font-size: ${token.fontSizeSM}px;
      line-height: 1.6;
      background: ${token.colorFillQuaternary};
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: ${token.borderRadiusLG}px;
      code {
        padding: 0;
        margin: 0;
        font-size: inherit;
        background: transparent;
        border-radius: 0;
      }
    }

    table {
      display: block;
      max-width: 100%;
      margin: 0.75em 0;
      overflow-x: auto;
      font-size: ${token.fontSizeSM}px;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid ${token.colorBorder};
      border-radius: ${token.borderRadiusLG}px;
      th, td {
        padding: 8px 12px;
        border-right: 1px solid ${token.colorBorder};
        border-bottom: 1px solid ${token.colorBorder};
      }
      th:last-child, td:last-child { border-right: 0; }
      thead th {
        font-weight: 600;
        text-align: left;
        color: ${token.colorTextHeading};
        background: ${token.colorFillTertiary};
        white-space: nowrap;
      }
      td { vertical-align: top; }
      tbody tr:last-child td { border-bottom: 0; }
      tbody tr:hover td { background: ${token.colorFillTertiary}; }
    }

    img {
      max-width: 100%;
      border-radius: ${token.borderRadius}px;
    }
  `,

  /* 助手消息里的操作步骤（ThoughtChain）：仅在聊天面板内生效的节点高度覆盖 */
  steps: css`
    .ant-thought-chain .ant-thought-chain-node {
      min-height: 50px;
    }
    /* 描述与下方内容的间距：收起时为 0；展开（内容区在 DOM 中）时 12px */
    .ant-thought-chain .ant-thought-chain-node .ant-thought-chain-node-description {
      margin-block-end: 0;
    }
    .ant-thought-chain
      .ant-thought-chain-node:has(.ant-thought-chain-node-content)
      .ant-thought-chain-node-description {
      margin-block-end: 12px;
    }
  `,

  /* 写操作确认卡：警示色系（与输入框上方的待确认提示一致），在白色面板与灰色气泡上都有清晰轮廓；
     宽度至少为消息列表宽度的 30%（列表根节点为容器查询上下文） */
  confirmCard: css`
    min-width: 40cqw;
    max-width: 100%;
    background: ${token.colorWarningBg};
    border: 1px solid ${token.colorWarningBorder};
    /* 全局样式加深了卡片边框色（global.less），提高优先级保住警示色 */
    &&& {
      border-color: ${token.colorWarningBorder};
    }
    border-radius: ${token.borderRadiusLG}px;
    box-shadow: ${token.boxShadowTertiary};

    .ant-card-body {
      padding: ${token.paddingSM}px ${token.padding}px;
    }

    /* 卡内参数代码块：在警示底色上加深一档并用更明显的边框，拉开对比 */
    pre {
      background: ${token.colorFillSecondary};
      border-color: ${token.colorBorder};
    }
  `,

  confirmTitle: css`
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    font-weight: 600;
    color: ${token.colorTextHeading};

    .anticon {
      color: ${token.colorWarning};
      font-size: ${token.fontSizeLG}px;
    }
  `,

  cursor: css`
    animation: chatbot-blink 0.8s step-end infinite;

    @keyframes chatbot-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `,
}));
