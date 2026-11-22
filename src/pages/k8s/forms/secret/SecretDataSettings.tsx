import type { FormInstance } from 'antd';
import { Alert, Col, Form, Input, Row, Select, Space } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
import {
  createSecretDataItem,
  DOCKER_CONFIG_JSON_KEY,
  getDockerConfigJson,
  registryProtocolOptions,
  secretTypeOptions,
} from './helpers';
import SecretDataEditor from './SecretDataEditor';
import type {
  CreateSecretFormValues,
  SecretDataItem,
  SecretType,
} from './types';

const { Password, TextArea } = Input;

const useStyles = createStyles(({ token }) => ({
  compactField: {
    maxWidth: 456,

    '.ant-form-item': {
      marginBottom: token.marginMD,
    },

    '.ant-form-item:last-child': {
      marginBottom: 0,
    },
  },
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '& > .ant-form-item': {
      marginBottom: 0,
    },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  dataField: {
    width: '100%',
  },
  registryProtocol: {
    flex: '0 0 112px',
  },
  compactInput: {
    width: '100%',

    '.ant-form-item': {
      flex: 1,
      minWidth: 0,
    },
  },
  compactInputValue: {
    width: '100%',
    flex: 1,
  },
}));

type SecretDataSettingsProps = {
  form: FormInstance<CreateSecretFormValues>;
};

const hasDataItems = (items?: SecretDataItem[]) =>
  (items || []).some((item) => item.keyName.trim());

const validateDefaultData = (
  items: SecretDataItem[] | undefined,
  t: Translate,
) => {
  const normalizedKeys = (items || [])
    .map((item) => item.keyName.trim())
    .filter(Boolean);

  if (!hasDataItems(items)) {
    return Promise.reject(
      new Error(t('pages.k8s.forms.secret.data.atLeastOne')),
    );
  }
  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return Promise.reject(
      new Error(t('pages.k8s.forms.common.dataKeyDuplicate')),
    );
  }

  return Promise.resolve();
};

const dataSettingFields: (keyof CreateSecretFormValues)[] = [
  'dataItems',
  'tlsCertificate',
  'tlsPrivateKey',
  'registryProtocol',
  'registryAddress',
  'registryUsername',
  'registryPassword',
  'registryEmail',
  'basicAuthUsername',
  'basicAuthPassword',
];

const hasText = (value?: string) => Boolean(value?.trim());

const CreateSecretDataSettings = ({ form }: SecretDataSettingsProps) => {
  const { styles } = useStyles();
  const t = useT();
  const typeOptions = useMemo(
    () =>
      secretTypeOptions.map((option) => ({
        label: t(option.labelId),
        value: option.value,
      })),
    [t],
  );
  const type = Form.useWatch('type', { form, preserve: true }) || 'Opaque';
  const registryProtocol = Form.useWatch('registryProtocol', {
    form,
    preserve: true,
  });
  const registryAddress = Form.useWatch('registryAddress', {
    form,
    preserve: true,
  });
  const registryUsername = Form.useWatch('registryUsername', {
    form,
    preserve: true,
  });
  const registryPassword = Form.useWatch('registryPassword', {
    form,
    preserve: true,
  });
  const registryEmail = Form.useWatch('registryEmail', {
    form,
    preserve: true,
  });
  const showRegistryAlert =
    type === 'kubernetes.io/dockerconfigjson' &&
    (!registryAddress || !registryUsername || !registryPassword);

  // 镜像服务信息填齐后，在数据列表里以只读条目展示将要生成的 .dockerconfigjson
  useEffect(() => {
    if (type !== 'kubernetes.io/dockerconfigjson') {
      return;
    }

    const dataItems: SecretDataItem[] = form.getFieldValue('dataItems') || [];
    const visibleDataItems = dataItems.filter(
      (item) => item.keyName !== DOCKER_CONFIG_JSON_KEY || item.binary,
    );
    const shouldCreateDockerConfig =
      hasText(registryAddress) &&
      hasText(registryUsername) &&
      Boolean(registryPassword);

    if (!shouldCreateDockerConfig) {
      if (visibleDataItems.length !== dataItems.length) {
        form.setFieldsValue({ dataItems: visibleDataItems });
      }
      return;
    }

    const value = getDockerConfigJson(form.getFieldsValue(true));
    const dockerConfigItem = dataItems.find(
      (item) => item.keyName === DOCKER_CONFIG_JSON_KEY && !item.binary,
    );

    if (dockerConfigItem?.value === value) {
      return;
    }

    form.setFieldsValue({
      dataItems: [
        ...visibleDataItems.filter(
          (item) => item.keyName !== DOCKER_CONFIG_JSON_KEY,
        ),
        dockerConfigItem
          ? { ...dockerConfigItem, value }
          : createSecretDataItem(DOCKER_CONFIG_JSON_KEY, value),
      ],
    });
  }, [
    form,
    registryAddress,
    registryEmail,
    registryPassword,
    registryProtocol,
    registryUsername,
    type,
  ]);

  const handleTypeChange = (nextType: SecretType) => {
    form.setFieldsValue({
      type: nextType,
      dataItems: [],
      tlsCertificate: undefined,
      tlsPrivateKey: undefined,
      registryProtocol: 'https://',
      registryAddress: undefined,
      registryUsername: undefined,
      registryPassword: undefined,
      registryEmail: undefined,
      registryConfigSource: undefined,
      basicAuthUsername: undefined,
      basicAuthPassword: undefined,
    });
    form.setFields(
      dataSettingFields.map((name) => ({
        name,
        errors: [],
      })),
    );
  };

  const renderDefaultData = () => (
    <Form.Item
      className={styles.dataField}
      label={t('pages.k8s.forms.common.data')}
      name="dataItems"
      rules={[
        {
          validator: (_: unknown, items?: SecretDataItem[]) =>
            validateDefaultData(items, t),
        },
      ]}
      required
    >
      <SecretDataEditor />
    </Form.Item>
  );

  const renderTlsFields = () => (
    <div className={styles.compactField}>
      <Form.Item
        label={t('pages.k8s.forms.secret.certificate')}
        name="tlsCertificate"
        rules={[
          {
            required: true,
            message: t('pages.k8s.forms.secret.certificate.required'),
          },
        ]}
      >
        <TextArea
          placeholder={t('pages.k8s.forms.secret.certificate.required')}
          autoSize={{ minRows: 6, maxRows: 10 }}
        />
      </Form.Item>
      <Form.Item
        label={t('pages.k8s.forms.secret.privateKey')}
        name="tlsPrivateKey"
        rules={[
          {
            required: true,
            message: t('pages.k8s.forms.secret.privateKey.required'),
          },
        ]}
      >
        <TextArea
          placeholder={t('pages.k8s.forms.secret.privateKey.required')}
          autoSize={{ minRows: 6, maxRows: 10 }}
        />
      </Form.Item>
    </div>
  );

  const renderRegistryFields = () => (
    <div className={styles.fieldGroup}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra={t('pages.k8s.forms.secret.registryAddress.extra')}
            label={t('pages.k8s.forms.secret.registryAddress')}
            required
          >
            <Space.Compact block className={styles.compactInput}>
              <Form.Item name="registryProtocol" noStyle>
                <Select
                  className={styles.registryProtocol}
                  options={registryProtocolOptions}
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
              <Form.Item
                name="registryAddress"
                noStyle
                rules={[
                  {
                    required: true,
                    message: t(
                      'pages.k8s.forms.secret.registryAddress.required',
                    ),
                  },
                ]}
              >
                <Input
                  className={styles.compactInputValue}
                  placeholder={t(
                    'pages.k8s.forms.secret.registryAddress.placeholder',
                  )}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('pages.k8s.forms.common.username')}
            name="registryUsername"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.username.required'),
              },
            ]}
          >
            <Input
              placeholder={t('pages.k8s.forms.common.username.required')}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={t('pages.k8s.forms.secret.email')}
            name="registryEmail"
          >
            <Input
              placeholder={t('pages.k8s.forms.secret.email.placeholder')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('pages.k8s.forms.common.password')}
            name="registryPassword"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.password.required'),
              },
            ]}
          >
            <Password
              placeholder={t('pages.k8s.forms.common.password.required')}
            />
          </Form.Item>
        </Col>
      </Row>
      {showRegistryAlert && (
        <Alert
          showIcon={false}
          title={t('pages.k8s.forms.secret.registry.incomplete')}
          type="error"
        />
      )}
      <Form.Item
        className={styles.dataField}
        label={t('pages.k8s.forms.common.data')}
        name="dataItems"
        required
      >
        <SecretDataEditor reservedKeys={[DOCKER_CONFIG_JSON_KEY]} />
      </Form.Item>
    </div>
  );

  const renderBasicAuthFields = () => (
    <div className={styles.compactField}>
      <Form.Item
        label={t('pages.k8s.forms.common.username')}
        name="basicAuthUsername"
        rules={[
          {
            required: true,
            message: t('pages.k8s.forms.common.username.required'),
          },
        ]}
      >
        <Input placeholder={t('pages.k8s.forms.common.username.required')} />
      </Form.Item>
      <Form.Item
        label={t('pages.k8s.forms.common.password')}
        name="basicAuthPassword"
        rules={[
          {
            required: true,
            message: t('pages.k8s.forms.common.password.required'),
          },
        ]}
      >
        <Password placeholder={t('pages.k8s.forms.common.password.required')} />
      </Form.Item>
    </div>
  );

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.compactField}
        label={t('pages.k8s.forms.common.type')}
        name="type"
        rules={[
          {
            required: true,
            message: t('pages.k8s.forms.common.type.required'),
          },
        ]}
      >
        <Select options={typeOptions} onChange={handleTypeChange} />
      </Form.Item>
      {type === 'kubernetes.io/tls' && renderTlsFields()}
      {type === 'kubernetes.io/dockerconfigjson' && renderRegistryFields()}
      {type === 'kubernetes.io/basic-auth' && renderBasicAuthFields()}
      {type === 'Opaque' && renderDefaultData()}
    </div>
  );
};

export default CreateSecretDataSettings;
