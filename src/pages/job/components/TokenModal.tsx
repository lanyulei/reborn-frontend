/**
 * 一次性令牌弹窗（执行节点的接入令牌、触发器的调用令牌共用）：令牌明文仅此一次展示，
 * 关闭后任何接口都不可再取。children 放用法说明（环境变量片段、调用示例等）。
 */
import { Alert, Modal, Typography } from 'antd';
import type React from 'react';
import { useT } from '@/utils/i18n';
import { useJobStyles } from './styles';

export const TokenModal: React.FC<{
  title: React.ReactNode;
  token: string;
  /** 令牌的称呼（接入令牌 / 调用令牌） */
  label: React.ReactNode;
  /** 警告下的补充说明（如「旧令牌已失效」） */
  description?: React.ReactNode;
  width?: number;
  onClose: () => void;
  children?: React.ReactNode;
}> = ({ title, token, label, description, width = 640, onClose, children }) => {
  const t = useT();
  const { styles } = useJobStyles();
  return (
    <Modal
      open
      width={width}
      title={title}
      okText={t('pages.job.runner.token.ok')}
      onOk={onClose}
      onCancel={onClose}
      cancelButtonProps={{ style: { display: 'none' } }}
      closable={false}
      keyboard={false}
      mask={{ closable: false }}
    >
      <Alert
        type="warning"
        showIcon
        title={t('pages.job.runner.token.warning')}
        description={description}
        style={{ marginBottom: 16 }}
      />
      <div className={styles.secondary}>{label}</div>
      <Typography.Paragraph
        className={styles.codeBlock}
        copyable={{ text: token }}
      >
        {token}
      </Typography.Paragraph>
      {children}
    </Modal>
  );
};
