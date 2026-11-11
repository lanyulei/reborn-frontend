/**
 * 列表页通用动作件：工具栏「新建」按钮、操作列「删除」确认链接。
 * 文案走语言包；删除链接用主题 colorError（随明暗主题），不再各页硬编码色值。
 */
import { PlusOutlined } from '@ant-design/icons';
import { Button, Popconfirm, theme } from 'antd';
import type React from 'react';
import { useT } from '@/utils/i18n';

/** ProTable headerTitle 位置的主操作按钮 */
export const CreateButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <Button type="primary" icon={<PlusOutlined />} onClick={onClick}>
    {children}
  </Button>
);

/** 操作列的删除确认：Popconfirm + 危险色链接；成功提示与刷新由调用方在 onConfirm 内处理 */
export const DeleteConfirmLink: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  /** 链接文案，缺省「删除」 */
  children?: React.ReactNode;
}> = ({ title, description, onConfirm, children }) => {
  const t = useT();
  const { token } = theme.useToken();
  return (
    <Popconfirm title={title} description={description} onConfirm={onConfirm}>
      <a style={{ color: token.colorError }}>
        {children ?? t('common.action.delete')}
      </a>
    </Popconfirm>
  );
};
