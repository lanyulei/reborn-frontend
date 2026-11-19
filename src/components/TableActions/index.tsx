/**
 * 列表页通用动作件：工具栏「新建」按钮、操作列带二次确认的链接。
 * 文案走语言包；删除链接用主题 colorError（随明暗主题），不再各页硬编码色值。
 *
 * 约定：删除、移除、撤销、作废、重置凭据、停用等操作一律用二次弹窗（modal.confirm）确认，
 * 不用气泡确认（Popconfirm）。操作列里的链接用 DeleteConfirmLink / ConfirmLink；
 * 按钮、菜单项等其它入口直接调 App.useApp() 的 modal.confirm，破坏性操作加 okButtonProps: { danger: true }。
 */
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, theme } from 'antd';
import type React from 'react';
import { useT } from '@/utils/i18n';

/** ProTable headerTitle 位置的主操作按钮 */
export const CreateButton: React.FC<{
  onClick: () => void;
  /** 悬停 / 聚焦钩子：懒加载创建表单的场景用来预取代码 */
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}> = ({ onClick, onMouseEnter, onFocus, children }) => (
  <Button
    type="primary"
    icon={<PlusOutlined />}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onFocus={onFocus}
  >
    {children}
  </Button>
);

interface ConfirmLinkProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 确认后执行；返回的 Promise 未完成前确定按钮保持加载，失败（reject）时弹窗不关闭 */
  onConfirm: () => void | Promise<void>;
  children?: React.ReactNode;
}

/** 操作列的二次确认链接：点击弹出确认弹窗；danger 时链接与确定按钮为危险色 */
export const ConfirmLink: React.FC<ConfirmLinkProps & { danger?: boolean }> = ({
  title,
  description,
  onConfirm,
  danger,
  children,
}) => {
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  return (
    <a
      style={danger ? { color: token.colorError } : undefined}
      onClick={() =>
        modal.confirm({
          title,
          content: description,
          okButtonProps: danger ? { danger: true } : undefined,
          onOk: onConfirm,
        })
      }
    >
      {children}
    </a>
  );
};

/** 操作列的删除确认：二次弹窗 + 危险色链接；成功提示与刷新由调用方在 onConfirm 内处理 */
export const DeleteConfirmLink: React.FC<ConfirmLinkProps> = ({
  children,
  ...props
}) => {
  const t = useT();
  return (
    <ConfirmLink danger {...props}>
      {children ?? t('common.action.delete')}
    </ConfirmLink>
  );
};
