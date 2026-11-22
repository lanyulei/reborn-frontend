/** 左侧分节导航 + 右侧内容的设置抽屉：各分节始终挂载（切换不丢表单值），底部「取消 / 保存」。 */
import type { DrawerProps } from 'antd';
import { Button, Drawer, Spin } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useT } from '@/utils/i18n';

type SettingsNavDrawerSection<Value extends string> = {
  description: string;
  icon: ReactNode;
  key: Value;
  title: string;
  content: ReactNode;
};

type SettingsNavDrawerProps<Value extends string> = {
  activeKey: Value;
  /** 导航上方的提示（加载失败等） */
  banner?: ReactNode;
  cancelText?: string;
  footerExtra?: ReactNode;
  loading?: boolean;
  okButtonDisabled?: boolean;
  okButtonIcon?: ReactNode;
  okButtonLoading?: boolean;
  okText?: string;
  open: boolean;
  sections: SettingsNavDrawerSection<Value>[];
  title: ReactNode;
  size?: DrawerProps['size'];
  onActiveKeyChange: (key: Value) => void;
  onCancel: () => void;
  onOk: () => void;
};

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: 0,
      background: token.colorBgLayout,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  layout: {
    display: 'grid',
    minHeight: 'calc(100vh - 116px)',
    gridTemplateColumns: '260px minmax(0, 1fr)',
    background: token.colorBgLayout,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  nav: {
    padding: token.paddingLG,
    borderRight: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,

    '@media (max-width: 768px)': {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: token.marginXS,
      borderRight: 0,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      padding: token.paddingSM,
    },
  },
  navItem: {
    display: 'grid',
    width: '100%',
    minHeight: 48,
    gridTemplateColumns: '34px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: token.marginSM,
    padding: `0 ${token.padding}px`,
    border: 0,
    borderRadius: token.borderRadiusSM,
    background: 'transparent',
    color: token.colorTextSecondary,
    cursor: 'pointer',
    font: 'inherit',
    textAlign: 'left',
    transition: `background ${token.motionDurationMid}, color ${token.motionDurationMid}, box-shadow ${token.motionDurationMid}`,

    '&:hover': {
      background: token.colorFillQuaternary,
      color: token.colorText,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimary}`,
      outlineOffset: -2,
    },

    '@media (max-width: 768px)': {
      marginBottom: 0,
      borderRadius: token.borderRadiusSM,
    },
  },
  navItemActive: {
    '&&': {
      background: token.colorFillAlter,
      color: token.colorText,
      boxShadow: `inset 3px 0 0 ${token.colorPrimary}`,
    },
  },
  navIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: token.borderRadiusLG,
    color: token.colorTextSecondary,
    backgroundColor: token.colorFillSecondary,
    fontSize: 18,
  },
  navText: {
    display: 'flex',
    minWidth: 0,
  },
  navTitle: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 400,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  content: {
    minWidth: 0,
    padding: token.paddingLG,
    background: token.colorBgContainer,
  },
  section: {
    display: 'none',
  },
  sectionActive: {
    display: 'block',
  },
  sectionCard: {
    minHeight: 'calc(100vh - 164px)',
  },
  sectionBody: {
    minWidth: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
}));

const SettingsNavDrawer = <Value extends string>({
  activeKey,
  banner,
  cancelText: cancelTextProp,
  footerExtra,
  loading = false,
  okButtonDisabled = false,
  okButtonIcon,
  okButtonLoading = false,
  okText: okTextProp,
  open,
  sections,
  title,
  size = '78vw',
  onActiveKeyChange,
  onCancel,
  onOk,
}: SettingsNavDrawerProps<Value>) => {
  const t = useT();
  const cancelText = cancelTextProp ?? t('common.action.cancel');
  const okText = okTextProp ?? t('common.action.save');
  const { styles, cx } = useStyles();

  return (
    <Drawer
      className={styles.drawer}
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          {footerExtra}
          <Button onClick={onCancel}>{cancelText}</Button>
          <Button
            disabled={okButtonDisabled}
            icon={okButtonIcon}
            loading={okButtonLoading}
            type="primary"
            onClick={onOk}
          >
            {okText}
          </Button>
        </div>
      }
      keyboard={false}
      mask={{ closable: false }}
      open={open}
      title={title}
      size={size}
      onClose={onCancel}
    >
      <Spin spinning={loading}>
        {banner}
        <div className={styles.layout}>
          <nav className={styles.nav}>
            {sections.map((section) => (
              <button
                className={cx(
                  styles.navItem,
                  activeKey === section.key && styles.navItemActive,
                )}
                key={section.key}
                type="button"
                onClick={() => onActiveKeyChange(section.key)}
              >
                <span className={styles.navIcon}>{section.icon}</span>
                <span className={styles.navText}>
                  <span className={styles.navTitle}>{section.title}</span>
                </span>
              </button>
            ))}
          </nav>
          <div className={styles.content}>
            {sections.map((section) => (
              <section
                className={cx(
                  styles.section,
                  activeKey === section.key && styles.sectionActive,
                )}
                key={section.key}
              >
                <div className={styles.sectionCard}>
                  <div className={styles.sectionBody}>{section.content}</div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </Spin>
    </Drawer>
  );
};

export type { SettingsNavDrawerProps, SettingsNavDrawerSection };
export default SettingsNavDrawer;
