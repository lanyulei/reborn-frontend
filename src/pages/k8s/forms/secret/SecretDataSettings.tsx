import type { FormInstance } from 'antd';
import { Alert, Col, Form, Input, Row, Select, Space } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
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

const validateDefaultData = (_: unknown, items?: SecretDataItem[]) => {
  const normalizedKeys = (items || [])
    .map((item) => item.keyName.trim())
    .filter(Boolean);

  if (!hasDataItems(items)) {
    return Promise.reject(new Error('请添加至少一条数据'));
  }
  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return Promise.reject(new Error('数据键不能重复'));
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
      label="数据"
      name="dataItems"
      rules={[{ validator: validateDefaultData }]}
      required
    >
      <SecretDataEditor />
    </Form.Item>
  );

  const renderTlsFields = () => (
    <div className={styles.compactField}>
      <Form.Item
        label="证书"
        name="tlsCertificate"
        rules={[{ required: true, message: '请输入证书' }]}
      >
        <TextArea
          placeholder="请输入证书"
          autoSize={{ minRows: 6, maxRows: 10 }}
        />
      </Form.Item>
      <Form.Item
        label="私钥"
        name="tlsPrivateKey"
        rules={[{ required: true, message: '请输入私钥' }]}
      >
        <TextArea
          placeholder="请输入私钥"
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
            extra="设置镜像服务地址，例如 docker.io。"
            label="镜像服务地址"
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
                rules={[{ required: true, message: '请输入镜像服务地址' }]}
              >
                <Input
                  className={styles.compactInputValue}
                  placeholder="例如 docker.io"
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="用户名"
            name="registryUsername"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="邮箱" name="registryEmail">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="密码"
            name="registryPassword"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Password placeholder="请输入密码" />
          </Form.Item>
        </Col>
      </Row>
      {showRegistryAlert && (
        <Alert
          showIcon={false}
          title="请设置镜像服务地址、用户名和密码。"
          type="error"
        />
      )}
      <Form.Item
        className={styles.dataField}
        label="数据"
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
        label="用户名"
        name="basicAuthUsername"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder="请输入用户名" />
      </Form.Item>
      <Form.Item
        label="密码"
        name="basicAuthPassword"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Password placeholder="请输入密码" />
      </Form.Item>
    </div>
  );

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.compactField}
        label="类型"
        name="type"
        rules={[{ required: true, message: '请选择类型' }]}
      >
        <Select options={secretTypeOptions} onChange={handleTypeChange} />
      </Form.Item>
      {type === 'kubernetes.io/tls' && renderTlsFields()}
      {type === 'kubernetes.io/dockerconfigjson' && renderRegistryFields()}
      {type === 'kubernetes.io/basic-auth' && renderBasicAuthFields()}
      {type === 'Opaque' && renderDefaultData()}
    </div>
  );
};

export default CreateSecretDataSettings;
