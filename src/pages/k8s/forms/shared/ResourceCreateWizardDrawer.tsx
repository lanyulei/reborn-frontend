import { CloseOutlined } from '@ant-design/icons';
import type { StepsProps } from 'antd';
import { Button, Drawer, Space, Steps, Switch } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { YamlEditor } from '../../components/YamlEditor';

export type ResourceCreateWizardStep = NonNullable<StepsProps['items']>[number];

type ResourceCreateWizardDrawerProps = {
  children: ReactNode;
  current: number;
  getStepDescription?: (
    step: ResourceCreateWizardStep,
    index: number,
  ) => ReactNode;
  loading?: boolean;
  open: boolean;
  steps: ResourceCreateWizardStep[];
  submitText?: string;
  title: ReactNode;
  width?: number | string;
  yamlMode: boolean;
  yamlValue: string;
  onCancel: () => void;
  onNext: () => void | Promise<void>;
  onPrev: () => void;
  onStepChange: (nextStep: number) => void | Promise<void>;
  onSubmit: () => void | Promise<void>;
  onYamlChange: (value: string) => void;
  onYamlModeChange: (checked: boolean) => void;
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
  headerExtra: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
  },
  yamlSwitch: {
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: 999,
    background: token.colorFillSecondary,
  },
  steps: {
    padding: '15px 20px',
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,

    // 图标与「标题 + 描述」整块垂直居中（antd 默认只与标题行对齐，整块看图标偏上），
    // 并抵消 antd 按标题行高度算出的图标偏移，交给 wrapper 的 alignItems 居中
    '.ant-steps-item-wrapper': {
      alignItems: 'center',
    },
    '.ant-steps-item-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBlockStart: 0,
    },
    // 有描述的步骤连接线同步下移半行（描述行高 20px），保持穿过圆心；
    // 各向导每步描述恒有值（当前 / 已设置 / 未设置），同一状态栏内一致
    '.ant-steps-item-section:has(> .ant-steps-item-content) .ant-steps-item-rail':
      {
        marginBlockStart: 10,
      },

    '.ant-steps-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  body: {
    height: 'calc(100vh - 205px)',
    overflow: 'auto',
    padding: token.paddingLG,
    background: token.colorBgContainer,

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  yamlBody: {
    height: 'calc(100vh - 131px)',
    padding: token.paddingLG,
    background: token.colorBgContainer,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  footerActions: {
    display: 'flex',
    gap: token.marginSM,
  },
  section: {
    marginBottom: token.marginLG,
  },
}));

const ResourceCreateWizardDrawer = ({
  children,
  current,
  getStepDescription,
  loading = false,
  open,
  steps,
  submitText = '创建',
  title,
  // 78vw 且 1000px 封顶：窄屏随视口，其余封顶 1000px，不随宽屏拉伸
  width = 'min(1000px, 78vw)',
  yamlMode,
  yamlValue,
  onCancel,
  onNext,
  onPrev,
  onStepChange,
  onSubmit,
  onYamlChange,
  onYamlModeChange,
}: ResourceCreateWizardDrawerProps) => {
  const { styles } = useStyles();

  /**
   * 包一层调用方的处理函数：表单校验失败（antd 以 { errorFields } 拒绝）时字段已就地标红，
   * 这里吞掉该拒绝，避免成为未捕获的 Promise 错误；其它错误照常抛出。
   */
  const guard =
    <A extends unknown[]>(fn: (...args: A) => void | Promise<void>) =>
    (...args: A) => {
      void Promise.resolve()
        .then(() => fn(...args))
        .catch((error: unknown) => {
          if (error && typeof error === 'object' && 'errorFields' in error)
            return;
          throw error;
        });
    };

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      extra={
        <div className={styles.headerExtra}>
          <Space className={styles.yamlSwitch}>
            <span>编辑 YAML</span>
            <Switch
              aria-label="切换 YAML 编辑模式"
              checked={yamlMode}
              onChange={guard(onYamlModeChange)}
            />
          </Space>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <span />
          <div className={styles.footerActions}>
            <Button onClick={onCancel}>取消</Button>
            {!yamlMode && current > 0 && (
              <Button onClick={onPrev}>上一步</Button>
            )}
            {!yamlMode && current < steps.length - 1 ? (
              <Button type="primary" onClick={guard(onNext)}>
                下一步
              </Button>
            ) : (
              <Button
                loading={loading}
                type="primary"
                onClick={guard(onSubmit)}
              >
                {submitText}
              </Button>
            )}
          </div>
        </div>
      }
      keyboard={false}
      mask={{ closable: false }}
      open={open}
      title={title}
      size={width}
      onClose={onCancel}
    >
      {yamlMode ? (
        <div className={styles.yamlBody}>
          <YamlEditor
            height="calc(100vh - 179px)"
            value={yamlValue}
            onChange={onYamlChange}
          />
        </div>
      ) : (
        <>
          <Steps
            className={styles.steps}
            current={current}
            items={steps.map((step, index) => ({
              ...step,
              disabled: step.disabled ?? index > current + 1,
              content: getStepDescription
                ? getStepDescription(step, index)
                : step.content,
            }))}
            onChange={guard(onStepChange)}
          />
          <div className={styles.body}>
            <div className={styles.section}>{children}</div>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default ResourceCreateWizardDrawer;
