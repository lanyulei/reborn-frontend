import {
  ClockCircleOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Checkbox, Form, Input, Select } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import ArgListEditor from '../ArgListEditor';
import ContainerEnvFields from './ContainerEnvFields';
import ContainerHealthCheckFields from './ContainerHealthCheckFields';
import ContainerLifecycleFields from './ContainerLifecycleFields';
import ContainerSecurityContextFields from './ContainerSecurityContextFields';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  option: {
    position: 'relative',
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginSM,
  },
  checkbox: {
    marginTop: 2,
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorTextTertiary,
    fontSize: 22,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  policyOptions: {
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  policyOptionList: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    left: 0,
    zIndex: 10,
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowSecondary,
  },
  policyOption: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: '32px minmax(0, 1fr) 24px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `12px 16px`,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',

    '& + &': {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },

    '&:hover': {
      background: token.colorFillQuaternary,
    },
  },
  policyOptionIcon: {
    color: token.colorTextTertiary,
    fontSize: 22,
    lineHeight: 1,
  },
  policyArrow: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  body: {
    marginTop: `14px`,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  plainBody: {
    marginTop: token.marginMD,
  },
  fieldStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  fieldBlock: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  fieldHelp: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type ToggleOptionCardProps = {
  bodyClassName?: string;
  name: NamePath;
  title: string;
  description: string;
  enabled?: boolean;
  children?: ReactNode;
};

type ImagePullPolicyType = 'IfNotPresent' | 'Always' | 'Never';

type ImagePullPolicyOption = {
  title: string;
  value: ImagePullPolicyType;
  description: string;
};

const ToggleOptionCard = ({
  bodyClassName,
  name,
  title,
  description,
  enabled,
  children,
}: ToggleOptionCardProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.option}>
      <div className={styles.optionHeader}>
        <Form.Item
          className={styles.checkbox}
          name={name}
          valuePropName="checked"
        >
          <Checkbox aria-label={title} />
        </Form.Item>
        <span>
          <div className={styles.title}>{title}</div>
          <div className={styles.description}>{description}</div>
        </span>
      </div>
      {enabled && children && (
        <div className={bodyClassName || styles.body}>{children}</div>
      )}
    </div>
  );
};

const ContainerAdvancedOptions = () => {
  const { styles } = useStyles();
  const t = useT();
  const form = Form.useFormInstance();
  const [policyOpen, setPolicyOpen] = useState(false);
  const imagePullPolicyOptions = useMemo<ImagePullPolicyOption[]>(
    () => [
      {
        title: t('pages.k8s.forms.workload.container.pullPolicy.ifNotPresent'),
        value: 'IfNotPresent',
        description: t(
          'pages.k8s.forms.workload.container.pullPolicy.ifNotPresent.description',
        ),
      },
      {
        title: t('pages.k8s.forms.workload.container.pullPolicy.always'),
        value: 'Always',
        description: t(
          'pages.k8s.forms.workload.container.pullPolicy.always.description',
        ),
      },
      {
        title: t('pages.k8s.forms.workload.container.pullPolicy.never'),
        value: 'Never',
        description: t(
          'pages.k8s.forms.workload.container.pullPolicy.never.description',
        ),
      },
    ],
    [t],
  );
  const enableHealthCheck = Form.useWatch('enableHealthCheck', form);
  const enableLifecycle = Form.useWatch('enableLifecycle', form);
  const enableStartupCommand = Form.useWatch('enableStartupCommand', form);
  const enableContainerEnv = Form.useWatch('enableContainerEnv', form);
  const enableContainerSecurityContext = Form.useWatch(
    'enableContainerSecurityContext',
    form,
  );
  const enableResizePolicy = Form.useWatch('enableResizePolicy', form);
  const syncHostTimezone = Form.useWatch('syncHostTimezone', form);
  const imagePullPolicy =
    (Form.useWatch('imagePullPolicy', form) as ImagePullPolicyType) ||
    'IfNotPresent';

  const selectImagePullPolicy = (value: ImagePullPolicyType) => {
    form.setFieldValue('imagePullPolicy', value);
    setPolicyOpen(false);
  };

  const renderImagePullPolicyOption = (
    option: ImagePullPolicyOption,
    showArrow: boolean,
  ) => (
    <button
      className={styles.policyOption}
      key={option.value}
      type="button"
      onClick={() =>
        showArrow
          ? setPolicyOpen((open) => !open)
          : selectImagePullPolicy(option.value)
      }
    >
      <ClockCircleOutlined className={styles.policyOptionIcon} />
      <span>
        <div className={styles.title}>{option.title}</div>
        <div className={styles.description}>{option.description}</div>
      </span>
      {showArrow && (
        <span className={styles.policyArrow}>
          {policyOpen ? <UpOutlined /> : <DownOutlined />}
        </span>
      )}
    </button>
  );

  const resizePolicyOptions = [
    {
      label: t('pages.k8s.forms.workload.container.resizePolicy.notRequired'),
      value: 'NotRequired',
    },
    {
      label: t(
        'pages.k8s.forms.workload.container.resizePolicy.restartContainer',
      ),
      value: 'RestartContainer',
    },
  ];

  const selectedImagePullPolicy =
    imagePullPolicyOptions.find((option) => option.value === imagePullPolicy) ||
    imagePullPolicyOptions[0];

  return (
    <div className={styles.stack}>
      <Form.Item name="imagePullPolicy" hidden>
        <Input />
      </Form.Item>
      <div className={styles.policyOptions}>
        {renderImagePullPolicyOption(selectedImagePullPolicy, true)}
        {policyOpen && (
          <div className={styles.policyOptionList}>
            {imagePullPolicyOptions
              .filter((option) => option.value !== imagePullPolicy)
              .map((option) => renderImagePullPolicyOption(option, false))}
          </div>
        )}
      </div>

      <ToggleOptionCard
        description={t(
          'pages.k8s.forms.workload.container.healthCheck.description',
        )}
        enabled={enableHealthCheck}
        name="enableHealthCheck"
        title={t('pages.k8s.forms.workload.container.healthCheck')}
      >
        <ContainerHealthCheckFields />
      </ToggleOptionCard>

      <ToggleOptionCard
        description={t(
          'pages.k8s.forms.workload.container.lifecycle.description',
        )}
        enabled={enableLifecycle}
        name="enableLifecycle"
        title={t('pages.k8s.forms.workload.container.lifecycle')}
      >
        <ContainerLifecycleFields />
      </ToggleOptionCard>

      <ToggleOptionCard
        description={t(
          'pages.k8s.forms.workload.container.startupCommand.description',
        )}
        enabled={enableStartupCommand}
        name="enableStartupCommand"
        title={t('pages.k8s.form.command')}
      >
        <div className={styles.fieldStack}>
          <div className={styles.fieldBlock}>
            <Form.Item
              label={t('pages.k8s.forms.common.command')}
              name="startupCommand"
            >
              <ArgListEditor
                addText={t(
                  'pages.k8s.forms.workload.container.startupCommand.add',
                )}
                placeholder={t(
                  'pages.k8s.forms.workload.container.command.placeholder',
                )}
              />
            </Form.Item>
            <div className={styles.fieldHelp}>
              {t('pages.k8s.forms.workload.container.startupCommand.help')}
            </div>
          </div>
          <div className={styles.fieldBlock}>
            <Form.Item
              label={t('pages.k8s.forms.workload.container.args')}
              name="startupArgs"
            >
              <ArgListEditor
                addText={t('pages.k8s.forms.workload.container.args.add')}
                placeholder={t(
                  'pages.k8s.forms.workload.container.args.placeholder',
                )}
              />
            </Form.Item>
            <div className={styles.fieldHelp}>
              {t('pages.k8s.forms.workload.container.args.help')}
            </div>
          </div>
        </div>
      </ToggleOptionCard>

      <ToggleOptionCard
        bodyClassName={styles.plainBody}
        description={t('pages.k8s.forms.workload.container.env.description')}
        enabled={enableContainerEnv}
        name="enableContainerEnv"
        title={t('pages.k8s.form.env')}
      >
        <ContainerEnvFields />
      </ToggleOptionCard>

      <ToggleOptionCard
        description={t(
          'pages.k8s.forms.workload.container.securityContext.description',
        )}
        enabled={enableContainerSecurityContext}
        name="enableContainerSecurityContext"
        title={t('pages.k8s.forms.workload.container.securityContext')}
      >
        <ContainerSecurityContextFields />
      </ToggleOptionCard>

      <ToggleOptionCard
        description={t(
          'pages.k8s.forms.workload.container.resizePolicy.description',
        )}
        enabled={enableResizePolicy}
        name="enableResizePolicy"
        title={t('pages.k8s.forms.workload.container.resizePolicy')}
      >
        <div className={styles.fieldStack}>
          <div className={styles.fieldBlock}>
            <Form.Item
              label={t('pages.k8s.forms.workload.container.resizePolicy.cpu')}
              name="cpuResizeRestartPolicy"
            >
              <Select
                allowClear
                options={resizePolicyOptions}
                placeholder={t(
                  'pages.k8s.forms.workload.container.resizePolicy.placeholder',
                )}
              />
            </Form.Item>
          </div>
          <div className={styles.fieldBlock}>
            <Form.Item
              label={t(
                'pages.k8s.forms.workload.container.resizePolicy.memory',
              )}
              name="memoryResizeRestartPolicy"
            >
              <Select
                allowClear
                options={resizePolicyOptions}
                placeholder={t(
                  'pages.k8s.forms.workload.container.resizePolicy.placeholder',
                )}
              />
            </Form.Item>
            <div className={styles.fieldHelp}>
              {t('pages.k8s.forms.workload.container.resizePolicy.help')}
            </div>
          </div>
        </div>
      </ToggleOptionCard>

      <ToggleOptionCard
        description={t(
          'pages.k8s.forms.workload.container.syncTimezone.description',
        )}
        enabled={syncHostTimezone}
        name="syncHostTimezone"
        title={t('pages.k8s.forms.workload.container.syncTimezone')}
      />
    </div>
  );
};

export default ContainerAdvancedOptions;
