/** 知识库页面共享样式：卡片、片段高亮、目录侧栏、正文排版。颜色全部来自主题 token。 */
import { createStyles } from 'antd-style';

export const useKnowledgeStyles = createStyles(({ token, css }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
    padding: 16px 20px;
  `,
  hitTitle: css`
    font-size: 16px;
    font-weight: 600;
    color: ${token.colorText};
    &:hover {
      color: ${token.colorPrimary};
    }
  `,
  snippet: css`
    margin-top: 6px;
    color: ${token.colorTextSecondary};
    line-height: 1.7;
    word-break: break-word;
    mark {
      padding: 0 2px;
      background: ${token.colorWarningBg};
      color: ${token.colorWarningText};
      border-radius: 2px;
    }
  `,
  section: css`
    margin-top: 8px;
    padding: 8px 12px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
    color: ${token.colorTextSecondary};
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 160px;
    overflow: auto;
    font-size: 13px;
  `,
  meta: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-top: 8px;
    color: ${token.colorTextTertiary};
    font-size: 12px;
  `,
  /** 阅读页：左侧目录吸顶 */
  outline: css`
    position: sticky;
    top: 72px;
    max-height: calc(100vh - 96px);
    overflow: auto;
    padding: 12px 16px;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
    font-size: 13px;
    a {
      display: block;
      padding: 3px 0;
      color: ${token.colorTextSecondary};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      &:hover {
        color: ${token.colorPrimary};
      }
    }
  `,
  markdown: css`
    line-height: 1.8;
    color: ${token.colorText};
    word-break: break-word;
    h1, h2, h3, h4 {
      margin: 20px 0 10px;
      font-weight: 600;
      line-height: 1.4;
    }
    h1 { font-size: 24px; }
    h2 { font-size: 20px; padding-bottom: 6px; border-bottom: 1px solid ${token.colorBorderSecondary}; }
    h3 { font-size: 17px; }
    pre {
      padding: 12px 14px;
      background: ${token.colorFillQuaternary};
      border-radius: ${token.borderRadius}px;
      overflow: auto;
    }
    code {
      font-family: ${token.fontFamilyCode};
      font-size: 13px;
    }
    blockquote {
      margin: 12px 0;
      padding: 4px 12px;
      border-left: 3px solid ${token.colorPrimaryBorder};
      color: ${token.colorTextSecondary};
      background: ${token.colorFillQuaternary};
    }
    table {
      border-collapse: collapse;
      margin: 12px 0;
      th, td {
        padding: 6px 10px;
        border: 1px solid ${token.colorBorderSecondary};
      }
      th { background: ${token.colorFillQuaternary}; }
    }
    img { max-width: 100%; }
  `,
  listRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    &:last-child {
      border-bottom: none;
    }
  `,
  listMeta: css`
    margin-top: 2px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  /** 次要说明文字（与各模块 hint 同口径） */
  hint: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
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
  /** 文档摘要：安静的灰底块，不用 Alert */
  summary: css`
    margin-top: 12px;
    padding: 10px 14px;
    color: ${token.colorTextSecondary};
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadius}px;
    white-space: pre-wrap;
    word-break: break-word;
  `,
  /** 指标卡栅格（与告警统计同口径） */
  tileGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  `,
  /** 统计工具条：时间范围等筛选与说明同一行（与告警 / 故障统计页同口径） */
  toolbar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  `,
  /** 知识统计的十张瓦片：宽屏 5 列两行、窄屏 2 列五排——都排满，不剩孤张 */
  statGrid: css`
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    @media (max-width: 1500px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
}));
