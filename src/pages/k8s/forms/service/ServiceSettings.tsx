import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import KeyValueEditor from '../shared/KeyValueEditor';
import {
  createDefaultServicePortItem,
  createKeyValueItem,
  createServicePortsFromWorkload,
  getServicePortsError,
  PORT_NAME_MAX_LENGTH,
  PORT_NAME_PATTERN,
} from './helpers';
import type {
  CreateServiceFormValues,
  ServiceInternalAccessMode,
  ServicePortItem,
  ServicePortProtocol,
} from './types';
import WorkloadSelectorModal from './WorkloadSelectorModal';

const PROTOCOL_OPTIONS: { label: string; value: ServicePortProtocol }[] = [
  { label: 'GRPC', value: 'GRPC' },
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTP2', value: 'HTTP2' },
  { label: 'HTTPS', value: 'HTTPS' },
  { label: 'MONGO', value: 'MONGO' },
  { label: 'REDIS', value: 'REDIS' },
  { label: 'TCP', value: 'TCP' },
  { label: 'TLS', value: 'TLS' },
  { label: 'UDP', value: 'UDP' },
  { label: 'SCTP', value: 'SCTP' },
];

type AccessModeItem = {
  description: string;
  title: string;
  value: ServiceInternalAccessMode;
};

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  sectionTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionContent: {
    marginTop: 8,
  },
  accessMode: {
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  accessModeOptions: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    left: 0,
    zIndex: 10,
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgElevated,
    boxShadow: token.boxShadowSecondary,
  },
  accessModeItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 24px',
    alignItems: 'center',
    gap: token.marginSM,
    width: '100%',
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
  accessTitle: {
    display: 'block',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  accessDescription: {
    display: 'block',
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  accessArrow: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  selectorBlock: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  selectorAlert: {
    marginTop: token.marginSM,
  },
  portRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  portRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns:
      'minmax(180px, 0.9fr) minmax(136px, 1fr) minmax(136px, 0.8fr) minmax(136px, 0.8fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  formItem: {
    marginBottom: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  compactField: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    alignItems: 'center',
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  compactControl: {
    width: '100%',
    minWidth: 0,
  },
  addon: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: token.marginXXS,
    padding: `0 ${token.paddingSM}px`,
    borderRight: `1px solid ${token.colorBorder}`,
    background: token.colorFillQuaternary,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: '30px',
    whiteSpace: 'nowrap',
  },
  helpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 12,
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },

    '@media (max-width: 768px)': {
      gridColumn: 2,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

type AccessModeSelectorProps = {
  value?: ServiceInternalAccessMode;
  onChange?: (value: ServiceInternalAccessMode) => void;
};

const AccessModeSelector = ({ value, onChange }: AccessModeSelectorProps) => {
  const { styles } = useStyles();
  const t = useT();
  const [open, setOpen] = useState(false);
  const accessModes = useMemo<AccessModeItem[]>(
    () => [
      {
        description: t(
          'pages.k8s.forms.service.accessMode.clusterIP.description',
        ),
        title: t('pages.k8s.forms.service.accessMode.clusterIP'),
        value: 'ClusterIP',
      },
      {
        description: t(
          'pages.k8s.forms.service.accessMode.headless.description',
        ),
        title: t('pages.k8s.forms.service.accessMode.headless'),
        value: 'Headless',
      },
    ],
    [t],
  );
  const selectedMode =
    accessModes.find((item) => item.value === value) || accessModes[0];

  const renderMode = (item: AccessModeItem, showArrow: boolean) => (
    <button
      aria-expanded={showArrow ? open : undefined}
      className={styles.accessModeItem}
      key={item.value}
      type="button"
      onClick={() => {
        if (showArrow) {
          setOpen((current) => !current);
          return;
        }
        onChange?.(item.value);
        setOpen(false);
      }}
    >
      <span>
        <span className={styles.accessTitle}>{item.title}</span>
        <span className={styles.accessDescription}>{item.description}</span>
      </span>
      {showArrow && (
        <span className={styles.accessArrow}>
          {open ? <UpOutlined /> : <DownOutlined />}
        </span>
      )}
    </button>
  );

  return (
    <div className={styles.accessMode}>
      {renderMode(selectedMode, true)}
      {open && (
        <div className={styles.accessModeOptions}>
          {accessModes
            .filter((item) => item.value !== selectedMode.value)
            .map((item) => renderMode(item, false))}
        </div>
      )}
    </div>
  );
};

type ServiceFormSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  tooltip?: ReactNode;
  children: ReactNode;
};

const ServiceFormSection = ({
  title,
  description,
  extra,
  tooltip,
  children,
}: ServiceFormSectionProps) => {
  const { styles } = useStyles();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>
            {title}
            {tooltip && (
              <Tooltip title={tooltip}>
                <QuestionCircleOutlined className={styles.helpIcon} />
              </Tooltip>
            )}
          </div>
          {description && (
            <div className={styles.sectionDescription}>{description}</div>
          )}
        </div>
        {extra}
      </div>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
};

type CompactFieldProps = {
  label: ReactNode;
  children: ReactNode;
};

const CompactField = ({ label, children }: CompactFieldProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.compactField}>
      <span className={styles.addon}>{label}</span>
      {children}
    </div>
  );
};

type ServicePortEditorProps = {
  form: FormInstance<CreateServiceFormValues>;
};

const ServicePortEditor = ({ form }: ServicePortEditorProps) => {
  const { styles } = useStyles();
  const t = useT();
  const portNumberRules = useMemo(
    () => [
      {
        type: 'number' as const,
        min: 1,
        max: 65535,
        message: t('pages.k8s.forms.common.port.range'),
      },
    ],
    [t],
  );
  const ports = (Form.useWatch('ports', form) as ServicePortItem[]) || [];
  const addDisabled = ports.some((item) => !item?.servicePort);

  return (
    <Form.List
      name="ports"
      rules={[
        {
          validator: async (_, value?: ServicePortItem[]) => {
            const error = getServicePortsError(value, t);
            if (error) {
              throw new Error(error);
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          <div className={styles.portRows}>
            {fields.map((field) => (
              <div className={styles.portRow} key={field.key}>
                <Form.Item className={styles.formItem}>
                  <CompactField
                    label={
                      <>
                        {t('pages.k8s.forms.service.port.protocol')}
                        <Tooltip
                          title={t(
                            'pages.k8s.forms.service.port.protocol.tooltip',
                          )}
                        >
                          <QuestionCircleOutlined className={styles.helpIcon} />
                        </Tooltip>
                      </>
                    }
                  >
                    <Form.Item name={[field.name, 'protocol']} noStyle>
                      <Select<ServicePortProtocol>
                        className={styles.compactControl}
                        options={PROTOCOL_OPTIONS}
                        placeholder={t(
                          'pages.k8s.forms.common.protocol.required',
                        )}
                        variant="borderless"
                      />
                    </Form.Item>
                  </CompactField>
                </Form.Item>
                <Form.Item className={styles.formItem}>
                  <CompactField label={t('pages.k8s.forms.common.name')}>
                    <Form.Item
                      name={[field.name, 'name']}
                      noStyle
                      rules={[
                        {
                          max: PORT_NAME_MAX_LENGTH,
                          message: t(
                            'pages.k8s.forms.service.port.name.maxLength',
                            {
                              max: PORT_NAME_MAX_LENGTH,
                            },
                          ),
                        },
                        {
                          pattern: PORT_NAME_PATTERN,
                          message: t(
                            'pages.k8s.forms.service.port.name.pattern',
                          ),
                        },
                      ]}
                    >
                      <Input
                        className={styles.compactControl}
                        placeholder={t('pages.k8s.forms.service.example', {
                          value: 'http-0',
                        })}
                        variant="borderless"
                      />
                    </Form.Item>
                  </CompactField>
                </Form.Item>
                <Form.Item className={styles.formItem}>
                  <CompactField
                    label={t('pages.k8s.forms.service.port.containerPort')}
                  >
                    <Form.Item
                      name={[field.name, 'containerPort']}
                      noStyle
                      rules={portNumberRules}
                    >
                      <InputNumber
                        className={styles.compactControl}
                        min={1}
                        max={65535}
                        placeholder={
                          ports[field.name]?.targetPort
                            ? String(ports[field.name]?.targetPort)
                            : t('common.optional')
                        }
                        precision={0}
                        variant="borderless"
                      />
                    </Form.Item>
                  </CompactField>
                </Form.Item>
                <Form.Item className={styles.formItem}>
                  <CompactField
                    label={t('pages.k8s.forms.service.port.servicePort')}
                  >
                    <Form.Item
                      name={[field.name, 'servicePort']}
                      noStyle
                      rules={[
                        {
                          required: true,
                          message: t(
                            'pages.k8s.forms.service.port.servicePort.required',
                          ),
                        },
                        ...portNumberRules,
                      ]}
                    >
                      <InputNumber
                        className={styles.compactControl}
                        min={1}
                        max={65535}
                        placeholder={t('pages.k8s.forms.service.required')}
                        precision={0}
                        variant="borderless"
                      />
                    </Form.Item>
                  </CompactField>
                </Form.Item>
                <Button
                  aria-label={t('pages.k8s.forms.common.deletePort')}
                  className={styles.deleteButton}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => remove(field.name)}
                />
              </div>
            ))}
          </div>
          <Form.ErrorList errors={errors} />
          <div className={styles.footer}>
            <Button
              disabled={addDisabled}
              icon={<PlusOutlined />}
              onClick={async () => {
                try {
                  await form.validateFields(
                    fields.flatMap((field) => [
                      ['ports', field.name, 'servicePort'],
                    ]),
                  );
                  add(createDefaultServicePortItem(ports));
                } catch {
                  // Validation errors are displayed by Form.Item.
                }
              }}
            >
              {t('pages.k8s.forms.service.port.add')}
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
};

type ServiceSettingsProps = {
  clusterId: string;
  form: FormInstance<CreateServiceFormValues>;
  showInternalAccess?: boolean;
};

const ServiceSettings = ({
  clusterId,
  form,
  showInternalAccess = true,
}: ServiceSettingsProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();
  const [workloadModalOpen, setWorkloadModalOpen] = useState(false);
  const namespace = Form.useWatch('namespace', { form, preserve: true });
  const selectors =
    (Form.useWatch('selectors', form) as KeyValueEditorItem[]) || [];
  const ports = (Form.useWatch('ports', form) as ServicePortItem[]) || [];

  useEffect(() => {
    if (selectors.length === 0) {
      form.setFieldValue('selectors', [createKeyValueItem()]);
    }
    if (ports.length === 0) {
      form.setFieldValue('ports', [createDefaultServicePortItem()]);
    }
  }, [form, ports.length, selectors.length]);

  return (
    <div className={styles.stack}>
      {showInternalAccess && (
        <ServiceFormSection
          tooltip={t('pages.k8s.forms.service.internalAccess.tooltip')}
          title={t('pages.k8s.forms.service.internalAccess')}
        >
          <Form.Item name="internalAccessMode" noStyle>
            <AccessModeSelector />
          </Form.Item>
        </ServiceFormSection>
      )}

      <ServiceFormSection
        tooltip={t('pages.k8s.forms.service.workloadSelector.tooltip')}
        title={t('pages.k8s.forms.service.workloadSelector')}
      >
        <div className={styles.selectorBlock}>
          <Form.Item
            name="selectors"
            required
            rules={[
              {
                validator: async (_, value?: KeyValueEditorItem[]) => {
                  if ((value || []).some((item) => item.keyName?.trim())) {
                    return;
                  }
                  throw new Error(
                    t('pages.k8s.forms.service.validation.selectorRequired'),
                  );
                },
              },
            ]}
          >
            <KeyValueEditor
              addIcon
              addText={t('pages.k8s.forms.service.workloadSelector.add')}
              deleteAriaLabel={t(
                'pages.k8s.forms.service.workloadSelector.delete',
              )}
              footerExtra={
                <Button onClick={() => setWorkloadModalOpen(true)}>
                  {t('pages.k8s.forms.service.workloadSelector.pick')}
                </Button>
              }
              footerJustify="space-between"
              onAddBlocked={() =>
                message.warning(
                  t('pages.k8s.forms.service.workloadSelector.keyFirst'),
                )
              }
              onCreateItem={() => createKeyValueItem()}
            />
          </Form.Item>
          {!selectors.some((item) => item.keyName?.trim()) && (
            <Alert
              banner
              className={styles.selectorAlert}
              showIcon={false}
              title={t('pages.k8s.forms.service.workloadSelector.noMatch')}
              type="warning"
            />
          )}
        </div>
      </ServiceFormSection>

      <ServiceFormSection
        tooltip={t('pages.k8s.forms.service.ports.tooltip')}
        title={t('pages.k8s.form.port')}
      >
        <ServicePortEditor form={form} />
      </ServiceFormSection>

      <WorkloadSelectorModal
        clusterId={clusterId}
        namespace={namespace}
        open={workloadModalOpen}
        onCancel={() => setWorkloadModalOpen(false)}
        onOk={(workload) => {
          const nextSelector = workload.selector || workload.labels || {};
          if (Object.keys(nextSelector).length === 0) {
            message.warning(
              t('pages.k8s.forms.service.workloadSelector.noLabels'),
            );
            setWorkloadModalOpen(false);
            return;
          }
          form.setFieldValue(
            'selectors',
            Object.entries(nextSelector).map(([keyName, value]) =>
              createKeyValueItem(keyName, value),
            ),
          );
          // 端口还没填写时，顺带用工作负载的容器端口预填
          const workloadPorts = createServicePortsFromWorkload(workload.ports);
          const currentPorts =
            (form.getFieldValue('ports') as ServicePortItem[]) || [];
          if (
            workloadPorts.length > 0 &&
            !currentPorts.some((item) => item?.servicePort)
          ) {
            form.setFieldValue('ports', workloadPorts);
          }
          setWorkloadModalOpen(false);
        }}
      />
    </div>
  );
};

export default ServiceSettings;
