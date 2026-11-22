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
  /**
   * 确认后执行；返回的 Promise 未完成前确定按钮保持加载。
   * 失败（reject）不会再抛给弹窗：错误提示由请求层统一给出，这里只记日志并关闭弹窗。
   */
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  children?: React.ReactNode;
}

/** 操作列的二次确认链接：点击弹出确认弹窗；danger 时链接与确定按钮为危险色 */
export const ConfirmLink: React.FC<ConfirmLinkProps & { danger?: boolean }> = ({
  title,
  description,
  onConfirm,
  danger,
  disabled,
  children,
}) => {
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const style: React.CSSProperties | undefined = disabled
    ? { color: token.colorTextDisabled, cursor: 'not-allowed' }
    : danger
      ? { color: token.colorError }
      : undefined;
  return (
    <a
      aria-disabled={disabled || undefined}
      style={style}
      onClick={() => {
        if (disabled) return;
        modal.confirm({
          title,
          content: description,
          okButtonProps: danger ? { danger: true } : undefined,
          onOk: async () => {
            try {
              await onConfirm();
            } catch (err) {
              console.error(err);
            }
          },
        });
      }}
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
