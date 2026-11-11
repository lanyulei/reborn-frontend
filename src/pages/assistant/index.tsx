import { PageContainer } from '@ant-design/pro-components';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useLayoutEffect, useState } from 'react';
import ChatPanel from '@/components/ChatPanel';

/** ProLayout 顶栏高度 */
const HEADER_HEIGHT = 56;

const useStyles = createStyles(({ token }) => ({
  // 整页去留白：空页头不占高，内容区四边贴边，面板填满视口剩余高度
  page: {
    '.ant-page-header-no-children': {
      height: 0,
    },
    '.ant-pro-page-container-children-container': {
      paddingBlock: 0,
      paddingInline: 0,
      // 第一个子节点即下方 panel：贴边后不再需要圆角
      '> div:first-child': {
        borderRadius: 0,
      },
    },
  },
  // 定高 flex 列容器：ChatPanel 自身 flex 填满父级；高度由 inline style 按页脚实测动态给出
  panel: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: token.colorBgContainer,
    border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    // 整页会话列表内边距（弹窗内另有左侧贴边的覆盖，互不影响）
    '.ant-conversations': {
      padding: 16,
    },
  },
}));

/**
 * 布局页脚实测高度（无页脚 = 0）：页脚文案来自系统配置、可能换行，
 * 用 ResizeObserver 跟随变化，面板高度 = 视口 - 顶栏 - 页脚，不遮挡页脚。
 */
const useLayoutFooterHeight = () => {
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const footer = document.querySelector<HTMLElement>('[data-layout-footer]');
    if (!footer) return;
    const update = () => setHeight(footer.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  return height;
};

/** 智能助手整页：与顶栏弹窗复用同一 ChatPanel，内容一致 */
const AssistantPage: React.FC = () => {
  const { styles } = useStyles();
  const footerHeight = useLayoutFooterHeight();
  return (
    <PageContainer title={false} className={styles.page}>
      <div
        className={styles.panel}
        style={{ height: `calc(100vh - ${HEADER_HEIGHT + footerHeight}px)` }}
      >
        <ChatPanel />
      </div>
    </PageContainer>
  );
};

export default AssistantPage;
