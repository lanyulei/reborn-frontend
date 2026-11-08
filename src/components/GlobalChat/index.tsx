import { RobotOutlined } from '@ant-design/icons';
import { FloatButton, Modal } from 'antd';
import React, { useState } from 'react';
import ChatPanel from '@/components/ChatPanel';

/**
 * 全局智能助手：右下角悬浮按钮 + 弹窗。
 * 点遮罩 / ESC 不关闭（maskClosable、keyboard 均为 false），仅右上角 X 关闭；
 * 关闭再打开保留会话（不销毁内容）。
 */
const GlobalChat: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FloatButton
        type="primary"
        icon={<RobotOutlined />}
        tooltip="智能助手"
        onClick={() => {
          setOpen(true);
        }}
      />

      <Modal
        title="智能助手"
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        width={960}
        centered
        footer={null}
        mask={{ closable: false }}
        keyboard={false}
        styles={{
          body: {
            height: '70vh',
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
