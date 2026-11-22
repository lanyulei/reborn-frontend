import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import { useT } from '@/utils/i18n';
import type { ContainerSeccompProfileType } from '../types';

const seccompProfileOptions: {
  label: string;
  value: ContainerSeccompProfileType;
}[] = [
  { label: 'RuntimeDefault', value: 'RuntimeDefault' },
  { label: 'Unconfined', value: 'Unconfined' },
  { label: 'Localhost', value: 'Localhost' },
];

const useStyles = createStyles(({ token }) => ({
  securityStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  groupTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  group: {
    marginTop: token.marginXS,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  switchStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  switchItem: {
    display: 'grid',
    gridTemplateColumns: '32px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
    padding: `${token.paddingXXS}px 0`,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  switchTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  fieldHelp: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  formItem: {
    marginBottom: 0,
  },
  seLinuxField: {
    marginBottom: token.marginMD,
  },
  capabilityBlock: {
    '& + &': {
      marginTop: token.marginMD,
    },
  },
  capabilityLabel: {
    marginBottom: token.marginSM,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  capabilityRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  capabilityRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns: 'minmax(0, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    background: token.colorFillQuaternary,
  },
  capabilityInput: {
    width: '100%',
    minWidth: 0,
  },
  capabilityDelete: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  capabilityActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

type SecuritySwitchFieldProps = {
  description: string;
  disabled?: boolean;
  name: string;
  title: string;
};

type CapabilityFieldName =
  | 'containerCapabilitiesAdd'
  | 'containerCapabilitiesDrop';

type CapabilityListProps = {
  label: string;
  name: CapabilityFieldName;
  placeholder: string;
};

const SecuritySwitchField = ({
  description,
  disabled,
  name,
  title,
}: SecuritySwitchFieldProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.switchItem}>
      <Form.Item name={name} valuePropName="checked">
        <Switch disabled={disabled} size="small" />
      </Form.Item>
      <span>
        <div className={styles.switchTitle}>{title}</div>
        <div className={styles.fieldHelp}>{description}</div>
      </span>
    </div>
  );
};

const CapabilityList = ({ label, name, placeholder }: CapabilityListProps) => {
  const { styles } = useStyles();
  const t = useT();
  const form = Form.useFormInstance();
  const values = (Form.useWatch(name, form) as string[] | undefined) || [];
  const addDisabled = values.some((value) => !value?.trim());

  return (
    <div className={styles.capabilityBlock}>
      <div className={styles.capabilityLabel}>{label}</div>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            <div className={styles.capabilityRows}>
              {fields.map((field) => (
                <div className={styles.capabilityRow} key={field.key}>
                  <Form.Item className={styles.formItem} name={field.name}>
                    <Input
                      className={styles.capabilityInput}
                      placeholder={placeholder}
                    />
                  </Form.Item>
                  <Button
                    aria-label={t(
                      'pages.k8s.forms.workload.container.security.capability.delete',
                      { label },
                    )}
                    className={styles.capabilityDelete}
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => remove(field.name)}
                  />
                </div>
              ))}
            </div>
            <div className={styles.capabilityActions}>
              <Button disabled={addDisabled} onClick={() => add('')}>
                <PlusOutlined />
                {t('pages.k8s.form.add')}
              </Button>
            </div>
          </>
        )}
      </Form.List>
    </div>
  );
};

const ContainerSecurityContextFields = () => {
  const { styles } = useStyles();
  const t = useT();
  const form = Form.useFormInstance();
  const privileged = Form.useWatch('containerPrivileged', form);
  const seccompProfileType = Form.useWatch('containerSeccompProfileType', form);

  // useWatch 首次渲染拿不到值：下面的联动都以表单里实际保存的值为准，避免编辑容器时覆盖已填内容
  useEffect(() => {
    if (!form.getFieldValue('containerCapabilitiesAdd')) {
      form.setFieldValue('containerCapabilitiesAdd', ['']);
    }
    if (!form.getFieldValue('containerCapabilitiesDrop')) {
      form.setFieldValue('containerCapabilitiesDrop', ['']);
    }
  }, [form]);

  useEffect(() => {
    if (privileged) {
      form.setFieldValue('allowPrivilegeEscalation', true);
    }
  }, [form, privileged]);

  // 依赖 seccompProfileType：类型改变后才需要重新检查
  useEffect(() => {
    if (form.getFieldValue('containerSeccompProfileType') !== 'Localhost') {
      form.setFieldValue('containerSeccompProfileLocalhost', undefined);
    }
  }, [form, seccompProfileType]);

  return (
    <div className={styles.securityStack}>
      <section>
        <div className={styles.groupTitle}>
          {t('pages.k8s.forms.workload.container.security.access')}
        </div>
        <div className={styles.group}>
          <div className={styles.switchStack}>
            <SecuritySwitchField
              description={t(
                'pages.k8s.forms.workload.container.security.privileged.description',
              )}
              name="containerPrivileged"
              title={t('pages.k8s.form.security.privileged')}
            />
            <SecuritySwitchField
              description={t(
                'pages.k8s.forms.workload.container.security.allowPrivilegeEscalation.description',
              )}
              disabled={privileged}
              name="allowPrivilegeEscalation"
              title={t(
                'pages.k8s.forms.workload.container.security.allowPrivilegeEscalation',
              )}
            />
            <SecuritySwitchField
              description={t(
                'pages.k8s.forms.workload.container.security.readOnlyRootFilesystem.description',
              )}
              name="containerReadOnlyRootFilesystem"
              title={t(
                'pages.k8s.forms.workload.container.security.readOnlyRootFilesystem',
              )}
            />
          </div>
        </div>
      </section>

      <section>
        <div className={styles.groupTitle}>
          {t('pages.k8s.forms.workload.container.security.userGroup')}
        </div>
        <div className={styles.group}>
          <SecuritySwitchField
            description={t(
              'pages.k8s.forms.workload.container.security.runAsNonRoot.description',
            )}
            name="containerRunAsNonRoot"
            title={t(
              'pages.k8s.forms.workload.container.security.runAsNonRoot',
            )}
          />
          <Row gutter={18}>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label={t('pages.k8s.forms.common.user')}
                name="containerRunAsUser"
              >
                <InputNumber
                  min={0}
                  placeholder={t(
                    'pages.k8s.forms.workload.container.security.runAsUser.placeholder',
                  )}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <div className={styles.fieldHelp}>
                {t(
                  'pages.k8s.forms.workload.container.security.runAsUser.help',
                )}
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label={t('pages.k8s.forms.workload.container.security.group')}
                name="containerRunAsGroup"
              >
                <InputNumber
                  min={0}
                  placeholder={t(
                    'pages.k8s.forms.workload.container.security.runAsGroup.placeholder',
                  )}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <div className={styles.fieldHelp}>
                {t(
                  'pages.k8s.forms.workload.container.security.runAsGroup.help',
                )}
              </div>
            </Col>
          </Row>
        </div>
      </section>

      <section>
        <div className={styles.groupTitle}>
          {t('pages.k8s.forms.workload.container.security.seLinux')}
        </div>
        <div className={styles.group}>
          <Row gutter={18}>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.seLinuxField}
                label={t(
                  'pages.k8s.forms.workload.container.security.seLinux.level',
                )}
                name="containerSeLinuxLevel"
                style={{ marginBottom: `16px` }}
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.workload.container.security.seLinux.level.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.seLinuxField}
                label={t('pages.k8s.kind.Role')}
                name="containerSeLinuxRole"
                style={{ marginBottom: `16px` }}
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.workload.container.security.seLinux.role.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label={t('pages.k8s.forms.common.type')}
                name="containerSeLinuxType"
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.workload.container.security.seLinux.type.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label={t('pages.k8s.forms.common.user')}
                name="containerSeLinuxUser"
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.workload.container.security.seLinux.user.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </section>

      <section>
        <div className={styles.groupTitle}>
          {t('pages.k8s.forms.workload.container.security.capabilities')}
        </div>
        <div className={styles.group}>
          <CapabilityList
            label={t('pages.k8s.form.add')}
            name="containerCapabilitiesAdd"
            placeholder={t(
              'pages.k8s.forms.workload.container.security.capabilities.add.placeholder',
            )}
          />
          <CapabilityList
            label={t('common.action.remove')}
            name="containerCapabilitiesDrop"
            placeholder={t(
              'pages.k8s.forms.workload.container.security.capabilities.drop.placeholder',
            )}
          />
        </div>
      </section>

      <section>
        <div className={styles.groupTitle}>
          {t('pages.k8s.forms.workload.container.security.seccomp')}
        </div>
        <div className={styles.group}>
          <Row gutter={18}>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label={t(
                  'pages.k8s.forms.workload.container.security.seccomp.type',
                )}
                name="containerSeccompProfileType"
              >
                <Select
                  allowClear
                  options={seccompProfileOptions}
                  placeholder={t(
                    'pages.k8s.forms.workload.container.security.seccomp.type.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
            {seccompProfileType === 'Localhost' && (
              <Col xs={24} md={12}>
                <Form.Item
                  className={styles.formItem}
                  label={t(
                    'pages.k8s.forms.workload.container.security.seccomp.localhost',
                  )}
                  name="containerSeccompProfileLocalhost"
                  rules={[
                    {
                      required: true,
                      message: t(
                        'pages.k8s.forms.workload.container.security.seccomp.localhost.required',
                      ),
                    },
                  ]}
                >
                  <Input
                    placeholder={t(
                      'pages.k8s.forms.workload.container.security.seccomp.localhost.placeholder',
                    )}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
          <div className={styles.fieldHelp}>
            {t('pages.k8s.forms.workload.container.security.seccomp.help')}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContainerSecurityContextFields;
