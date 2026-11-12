/**
 * CMDB 页面共享样式（antd-style，全部走主题 token，暗色安全）：
 * 概要头 / 页面标题条 / 左右分栏 / 模型卡片网格 / 工具栏 /
 * 搜索命中行 / 统计卡行。
 */
import { createStyles } from 'antd-style';

export const useCmdbStyles = createStyles(({ token, css }) => ({
  /** 详情页概要头：图标 + 标题 + 元信息 + 右侧操作 */
  summaryHeader: css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
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
    align-items: center;
    gap: 8px;
    color: ${token.colorText};
    font-size: ${token.fontSizeLG}px;
    font-weight: 600;
  `,
  summaryMeta: css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 16px;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  summaryActions: css`
    display: flex;
    gap: 8px;
    margin-inline-start: auto;
  `,
  /** 模型卡片网格（模型管理） */
  cardGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  `,
  modelCard: css`
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 64px;
    padding: 12px 16px;
    text-align: start;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
    cursor: pointer;
    transition: all ${token.motionDurationMid};
    &:hover {
      border-color: ${token.colorPrimaryBorder};
      box-shadow: ${token.boxShadowTertiary};
      transform: translateY(-1px);
    }
  `,
  modelCardCode: css`
    overflow: hidden;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
    font-family: ${token.fontFamilyCode};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  /** 模型卡片右侧实例数 */
  modelCardCount: css`
    flex: none;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeLG}px;
    font-variant-numeric: tabular-nums;
  `,
  /** 空分组占位（虚线框 + 引导） */
  emptyGroup: css`
    padding: 18px;
    color: ${token.colorTextTertiary};
    text-align: center;
    border: 1px dashed ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
  /** 页面标题条：返回 + 标题 + 右侧操作 */
  pageBar: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    margin-bottom: 16px;
  `,
  pageBarTitle: css`
    color: ${token.colorText};
    font-size: ${token.fontSizeLG}px;
    font-weight: 600;
  `,
  /** 左右分栏：左侧固定宽度面板（吸顶）+ 右侧自适应内容 */
  split: css`
    display: flex;
    align-items: flex-start;
    gap: 16px;
  `,
  splitSide: css`
    position: sticky;
    top: 72px;
    flex: none;
    width: 240px;
    max-height: calc(100vh - 96px);
    overflow: auto;
    background: ${token.colorBgContainer};
    border: 1px solid color-mix(in srgb, ${token.colorBorder} 25%, ${token.colorBorderSecondary});
    border-radius: ${token.borderRadiusLG}px;
  `,
  splitSideTitle: css`
    padding: 12px 16px 4px;
    color: ${token.colorText};
    font-weight: 600;
  `,
  splitMain: css`
    flex: 1;
    min-width: 0;
  `,
  /** 列表行按钮（模型关系左侧分组列表） */
  modelRow: css`
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 20px;
    color: ${token.colorText};
    text-align: start;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background ${token.motionDurationMid};
    &:hover {
      color: ${token.colorPrimary};
      background: ${token.colorFillQuaternary};
    }
  `,
  /** 选中态（模型关系左侧分组列表） */
  modelRowOn: css`
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    &:hover {
      background: ${token.colorPrimaryBg};
    }
  `,
  modelRowName: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  modelRowCount: css`
    flex: none;
    color: ${token.colorTextTertiary};
    font-variant-numeric: tabular-nums;
  `,
  /** 键值栅格（实例详情属性）：三等分列，标签右对齐 */
  kvGrid: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px 32px;
    margin-bottom: 24px;
    &:last-child {
      margin-bottom: 4px;
    }
  `,
  kvItem: css`
    display: flex;
    gap: 10px;
    min-width: 0;
    line-height: 22px;
  `,
  kvLabel: css`
    flex: none;
    min-width: 88px;
    color: ${token.colorTextTertiary};
    text-align: end;
  `,
  kvValue: css`
    flex: 1;
    min-width: 0;
    color: ${token.colorText};
    word-break: break-all;
  `,
  /** 小节标题：左侧强调竖条 */
  sectionTitle: css`
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0 12px;
    color: ${token.colorText};
    font-weight: 600;
    &::before {
      width: 3px;
      height: 14px;
      background: ${token.colorPrimary};
      border-radius: 2px;
      content: '';
    }
  `,
  modelCardActive: css`
    border-color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
  `,
  starBtn: css`
    position: absolute;
    top: 6px;
    right: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: ${token.colorTextQuaternary};
    background: transparent;
    border: none;
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    transition: color ${token.motionDurationMid};
    &:hover {
      color: ${token.colorWarning};
    }
  `,
  starBtnOn: css`
    color: ${token.colorWarning};
  `,
  modelCardBody: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  modelCardName: css`
    overflow: hidden;
    color: ${token.colorText};
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  groupTitle: css`
    color: ${token.colorText};
    font-size: ${token.fontSize}px;
    font-weight: 600;
  `,
  groupCount: css`
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  /** 工具栏（左操作 + spacer + 右操作） */
  toolbar: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  `,
  /** 工具栏紧凑变体：与下方内容的间距减半 */
  toolbarTight: css`
    margin-bottom: 8px;
  `,
  spacer: css`
    flex: 1;
  `,
  /** 全局搜索命中行 */
  hitRow: css`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: ${token.borderRadius}px;
    &:hover {
      background: ${token.colorFillQuaternary};
    }
  `,
  /** 左侧模型菜单：选中底色左右留白与面板标题（16px）对齐 */
  modelMenu: css`
    .ant-menu-item {
      width: calc(100% - 32px);
      margin-inline: 16px;
    }
  `,
  /** 左侧模型菜单项：名称 + 实例数 */
  modelMenuItem: css`
    display: flex;
    align-items: center;
    gap: 8px;
    svg {
      flex: none;
    }
  `,
  modelMenuName: css`
    flex: 1;
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  modelMenuCount: css`
    flex-shrink: 0;
    color: ${token.colorTextTertiary};
    font-size: ${token.fontSizeSM}px;
  `,
  /** 运营统计统计卡行 */
  statGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  `,
}));
