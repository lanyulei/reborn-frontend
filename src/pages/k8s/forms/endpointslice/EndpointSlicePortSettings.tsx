import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Input, InputNumber, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo } from 'react';
import { useT } from '@/utils/i18n';
import ResourceFormSection from '../shared/ResourceFormSection';
import { createEndpointSlicePortItem, PORT_NAME_PATTERN } from './helpers';
import type {
  CreateEndpointSliceFormValues,
  EndpointSlicePortItem,
  EndpointSliceProtocol,
} from './types';

const useStyles = createStyles(({ token }) => ({
  unframedContent: {
    marginTop: token.marginSM,
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(120px, 1fr) 120px 140px minmax(140px, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingSM}px 16px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
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
  input: {
    width: '100%',
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: token.marginMD,
  },
}));

const PROTOCOL_OPTIONS: { label: string; value: EndpointSliceProtocol }[] = [
  { label: 'TCP', value: 'TCP' },
  { label: 'UDP', value: 'UDP' },
  { label: 'SCTP', value: 'SCTP' },
];

type EndpointSlicePortSettingsProps = {
  form: FormInstance<CreateEndpointSliceFormValues>;
};

const EndpointSlicePortSettings = ({
  form,
}: EndpointSlicePortSettingsProps) => {
  const { styles } = useStyles();
  const t = useT();
  const portNumberRules = useMemo(
    () => [
      {
        type: 'number' as const,
        min: 1,
        message: t('pages.k8s.forms.endpointslice.port.min'),
      },
      {
        type: 'number' as const,
        max: 65535,
        message: t('pages.k8s.forms.endpointslice.port.max'),
      },
    ],
    [t],
  );
  const ports = (Form.useWatch('ports', form) as EndpointSlicePortItem[]) || [];
  const addDisabled = ports.some(
    (item) => !item.name && !item.port && !item.appProtocol,
  );

  return (
    <ResourceFormSection
      bordered={false}
      description={t('pages.k8s.forms.endpointslice.ports.description')}
      title={t('pages.k8s.form.port')}
    >
      <div className={styles.unframedContent}>
        <Form.List name="ports">
          {(fields, { add, remove }) => (
            <>
              <div className={styles.rows}>
                {fields.map((field) => (
                  <div className={styles.row} key={field.key}>
                    <Form.Item
                      className={styles.formItem}
                      label={t('pages.k8s.forms.common.name')}
                      name={[field.name, 'name']}
                      rules={[
                        {
                          max: 15,
                          message: t(
                            'pages.k8s.forms.endpointslice.port.name.maxLength',
                          ),
                        },
                        {
                          pattern: PORT_NAME_PATTERN,
                          message: t(
                            'pages.k8s.forms.endpointslice.port.name.pattern',
                          ),
                        },
                      ]}
                    >
                      <Input
                        className={styles.input}
                        placeholder={t(
                          'pages.k8s.forms.endpointslice.example',
                          { value: 'http' },
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      label={t('pages.k8s.form.port')}
                      name={[field.name, 'port']}
                      rules={portNumberRules}
                    >
                      <InputNumber
                        className={styles.input}
                        max={65535}
                        min={1}
                        placeholder={t(
                          'pages.k8s.forms.endpointslice.example',
                          { value: '80' },
                        )}
                        precision={0}
                      />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      label={t('pages.k8s.forms.endpointslice.port.protocol')}
                      name={[field.name, 'protocol']}
                    >
                      <Select
                        className={styles.input}
                        options={PROTOCOL_OPTIONS}
                        placeholder={t(
                          'pages.k8s.forms.common.protocol.required',
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      tooltip={t(
                        'pages.k8s.forms.endpointslice.port.appProtocol.tooltip',
                      )}
                      label={t(
                        'pages.k8s.forms.endpointslice.port.appProtocol',
                      )}
                      name={[field.name, 'appProtocol']}
                      rules={[
                        {
                          max: 250,
                          message: t(
                            'pages.k8s.forms.endpointslice.port.appProtocol.maxLength',
                          ),
                        },
                      ]}
                    >
                      <Input
                        className={styles.input}
                        placeholder={t(
                          'pages.k8s.forms.endpointslice.example',
                          { value: 'http' },
                        )}
                      />
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
              <div className={styles.footer}>
                <Button
                  disabled={addDisabled}
                  icon={<PlusOutlined />}
                  onClick={async () => {
                    try {
                      await form.validateFields(['ports'], { recursive: true });
                      add(createEndpointSlicePortItem());
                    } catch {
                      // Form.Item displays validation errors in place.
                    }
                  }}
                >
                  {t('pages.k8s.forms.endpointslice.port.add')}
                </Button>
              </div>
            </>
          )}
        </Form.List>
      </div>
    </ResourceFormSection>
  );
};

export default EndpointSlicePortSettings;
