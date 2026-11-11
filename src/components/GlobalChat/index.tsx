import { RobotOutlined } from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import { Button, Modal, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import ChatPanel from '@/components/ChatPanel';
import { useT } from '@/utils/i18n';
import useHeaderActionStyles from '../RightContent/style';

const useStyles = createStyles(() => ({
  // 仅弹窗内：会话列表左侧贴边、右侧 16px（整页另有 16px 等距覆盖，互不影响）
  body: {
    '.ant-conversations': {
      padding: '12px 16px 12px 0',
    },
  },
}));

/**
 * 全局智能助手：顶栏操作区按钮（语言切换左侧）+ 全屏弹窗。
 * 点遮罩不关闭（mask.closable=false），按 ESC 或右上角 X 关闭；
 * 关闭再打开保留会话（不销毁内容）。
 */
const GlobalChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const t = useT();
  const { styles } = useStyles();
  const { styles: headerStyles } = useHeaderActionStyles();
  const access = useAccess();

  // 入口按菜单权限码 assistant 控制（超管直通）；接口侧另有授权中间件兜底。
  if (!access.canAssistant) return null;

  return (
    <>
      <Tooltip title={t('component.chat.title')}>
        <Button
          type="text"
          className={headerStyles.action}
          aria-label={t('component.chat.title')}
          onClick={() => {
            setOpen(true);
          }}
        >
          <RobotOutlined />
        </Button>
      </Tooltip>

      {/* 全屏弹窗：铺满视口、去圆角；内容区为定高 flex 列，ChatPanel 自身填满 */}
      <Modal
        title={t('component.chat.title')}
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        width="100vw"
        style={{ top: 0, maxWidth: '100vw', margin: 0, paddingBottom: 0 }}
        footer={null}
        mask={{ closable: false }}
        classNames={{ body: styles.body }}
        styles={{
          container: {
            height: '100vh',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
          },
          header: { flex: 'none' },
          body: {
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        <ChatPanel />
      </Modal>
    </>
  );
};

export default GlobalChat;
