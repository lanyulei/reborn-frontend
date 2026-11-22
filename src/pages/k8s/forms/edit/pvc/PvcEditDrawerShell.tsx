/** 持久卷声明「扩容」「克隆」共用的抽屉外壳：加载态、加载失败重试、底部按钮 */
import { CloseOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Spin } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useT } from '@/utils/i18n';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: token.paddingLG,
      background: token.colorBgContainer,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
  notice: {
    marginBottom: token.marginMD,
  },
}));

/** 表单区的样式（两个抽屉共用） */
export const usePvcFormStyles = createStyles(({ token }) => ({
  form: {
    maxWidth: 520,
  },
  field: {
    width: '100%',
  },
  notice: {
    maxWidth: 520,
    marginBottom: token.marginMD,
  },
  helpText: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type PvcEditDrawerShellProps = {
  children: ReactNode;
  error?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  submitText?: string;
  title: string;
  onCancel: () => void;
  onReload: () => void;
  onSubmit: () => void;
};

const PvcEditDrawerShell = ({
  children,
  error,
  loading = false,
  submitDisabled = false,
  submitText,
  title,
  onCancel,
  onReload,
  onSubmit,
}: PvcEditDrawerShellProps) => {
  const { styles } = useStyles();
  const t = useT();

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>{t('common.action.cancel')}</Button>
          <Button
            disabled={loading || submitDisabled}
            type="primary"
            onClick={onSubmit}
          >
            {submitText ?? t('common.action.save')}
          </Button>
        </div>
      }
      keyboard={false}
      mask={{ closable: false }}
      open
      size="64vw"
      title={title}
      onClose={onCancel}
    >
      <Spin spinning={loading}>
        {error && (
          <Alert
            action={
              <Button size="small" onClick={onReload}>
                {t('pages.k8s.table.retry')}
              </Button>
            }
            className={styles.notice}
            showIcon
            title={error}
            type="error"
          />
        )}
        {children}
      </Spin>
    </Drawer>
  );
};

export default PvcEditDrawerShell;
