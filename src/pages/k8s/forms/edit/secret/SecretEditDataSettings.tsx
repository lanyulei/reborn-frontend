/**
 * 保密字典编辑的数据设置：与创建向导同款的按类型表单，但类型不可改，已有的值是隐藏的。
 * 专用表单项（证书、用户名等）留空表示保持原值；镜像服务信息要先查看明文才能编辑。
 */
import type { FormInstance } from 'antd';
import { Alert, Col, Form, Input, Row, Select, Space } from 'antd';
import { createStyles } from 'antd-style';
import {
  BINARY_VALUE_TEXT,
  DOCKER_CONFIG_JSON_KEY,
  registryProtocolOptions,
  secretTypeOptions,
} from '../../secret/helpers';
import type {
  DockerEditState,
  SecretEditFormValues,
  SecretPlaintext,
  TypedField,
} from './helpers';
import {
  getDockerConfigUpdate,
  getDockerEditState,
  getSecretDataKeys,
  getSecretEditType,
  SECRET_MASK,
} from './helpers';
import SecretEditDataEditor from './SecretEditDataEditor';

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

type SecretEditDataSettingsProps = {
  /** 当前账号能否查看明文 */
  canReveal: boolean;
  form: FormInstance<SecretEditFormValues>;
  /** 加载到的对象 */
  manifest: Record<string, unknown>;
  /** 已查看的明文；未查看为 undefined */
  reveal?: SecretPlaintext;
};

const HIDDEN_PLACEHOLDER = '已隐藏，输入新内容以替换';
const KEEP_HINT = '留空则保持原值。';

const TYPED_KEYS: Record<TypedField, string> = {
  basicAuthPassword: 'password',
  basicAuthUsername: 'username',
  tlsCertificate: 'tls.crt',
  tlsPrivateKey: 'tls.key',
};

const getDockerNotice = (state: DockerEditState, canReveal: boolean) => {
  if (state === 'hidden') {
    return canReveal
      ? '镜像服务信息已隐藏。点击「查看明文」后可编辑镜像服务地址、用户名和密码；也可以在下方整体替换 .dockerconfigjson 的内容。'
      : '镜像服务信息已隐藏，当前账号没有查看明文的权限，无法编辑镜像服务地址、用户名和密码。可以在下方整体替换 .dockerconfigjson 的内容，或只修改标签与注解。';
  }
  if (state === 'unparsed') {
    return '无法从 .dockerconfigjson 解析出镜像服务信息，只能在下方整体替换它的内容。';
  }
  if (state === 'replaced') {
    return '已整体替换 .dockerconfigjson，镜像服务信息以替换的内容为准；撤销替换后可恢复按表单编辑。';
  }

  return undefined;
};

const maskRule = {
  validator: (_: unknown, value?: string) =>
    value === SECRET_MASK
      ? Promise.reject(new Error(`不能是掩码 ${SECRET_MASK}`))
      : Promise.resolve(),
};

const SecretEditDataSettings = ({
  canReveal,
  form,
  manifest,
  reveal,
}: SecretEditDataSettingsProps) => {
  const { styles } = useStyles();
  const values: Partial<SecretEditFormValues> =
    Form.useWatch([], { form, preserve: true }) || {};
  const type = getSecretEditType(manifest);
  const rawType = typeof manifest.type === 'string' ? manifest.type : 'Opaque';
  const loadedKeys = getSecretDataKeys(manifest);
  const fullValues: SecretEditFormValues = {
    registryProtocol: 'https://',
    ...values,
    dataItems: values.dataItems || [],
  };
  const dockerState = getDockerEditState(manifest, fullValues, reveal);
  const registryDisabled = dockerState !== 'editable';
  const dockerNotice = dockerState && getDockerNotice(dockerState, canReveal);
  // 可按表单编辑时，.dockerconfigjson 在列表里只读，展示将要写出的内容
  const reserved =
    dockerState === 'editable' &&
    fullValues.dataItems.some((item) => item.keyName === DOCKER_CONFIG_JSON_KEY)
      ? {
          [DOCKER_CONFIG_JSON_KEY]:
            getDockerConfigUpdate(manifest, fullValues, reveal) ??
            reveal?.data[DOCKER_CONFIG_JSON_KEY],
        }
      : undefined;

  /** 专用表单项的公共属性：已有的键留空 = 保持原值；二进制内容只读 */
  const getTypedFieldProps = (field: TypedField, emptyMessage: string) => {
    const key = TYPED_KEYS[field];
    const loaded = loadedKeys.includes(key);
    const binary = Boolean(reveal?.binary.includes(key));

    return {
      item: {
        extra: loaded && !binary ? KEEP_HINT : undefined,
        name: field,
        required: !loaded,
        rules: [{ required: !loaded, message: emptyMessage }, maskRule],
      },
      input: {
        disabled: binary,
        placeholder: binary
          ? BINARY_VALUE_TEXT
          : loaded
            ? HIDDEN_PLACEHOLDER
            : emptyMessage,
      },
    };
  };

  const renderData = (label: string, lockedKeys?: string[]) => (
    <Form.Item className={styles.dataField} label={label} name="dataItems">
      <SecretEditDataEditor
        forbiddenKeys={
          type === 'kubernetes.io/tls'
            ? ['tls.crt', 'tls.key']
            : type === 'kubernetes.io/basic-auth'
              ? ['username', 'password']
              : undefined
        }
        lockedKeys={lockedKeys}
        reserved={reserved}
      />
    </Form.Item>
  );

  const renderTlsFields = () => {
    const certificate = getTypedFieldProps('tlsCertificate', '请输入证书');
    const privateKey = getTypedFieldProps('tlsPrivateKey', '请输入私钥');

    return (
      <div className={styles.compactField}>
        <Form.Item label="证书" {...certificate.item}>
          <TextArea
            {...certificate.input}
            autoSize={{ minRows: 6, maxRows: 10 }}
          />
        </Form.Item>
        <Form.Item label="私钥" {...privateKey.item}>
          <TextArea
            {...privateKey.input}
            autoSize={{ minRows: 6, maxRows: 10 }}
          />
        </Form.Item>
      </div>
    );
  };

  const renderRegistryFields = () => (
    <div className={styles.fieldGroup}>
      {dockerNotice && <Alert showIcon title={dockerNotice} type="info" />}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra="设置镜像服务地址，例如 docker.io。"
            label="镜像服务地址"
            required={!registryDisabled}
          >
            <Space.Compact block className={styles.compactInput}>
              <Form.Item name="registryProtocol" noStyle>
                <Select
                  className={styles.registryProtocol}
                  disabled={registryDisabled}
                  options={registryProtocolOptions}
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
              <Form.Item
                name="registryAddress"
                noStyle
                rules={[
                  {
                    required: !registryDisabled,
                    message: '请输入镜像服务地址',
                  },
                ]}
              >
                <Input
                  className={styles.compactInputValue}
                  disabled={registryDisabled}
                  placeholder={registryDisabled ? '已隐藏' : '例如 docker.io'}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="用户名"
            name="registryUsername"
            rules={[{ required: !registryDisabled, message: '请输入用户名' }]}
          >
            <Input
              disabled={registryDisabled}
              placeholder={registryDisabled ? '已隐藏' : '请输入用户名'}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="邮箱" name="registryEmail">
            <Input
              disabled={registryDisabled}
              placeholder={registryDisabled ? '已隐藏' : '请输入邮箱'}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="密码"
            name="registryPassword"
            rules={[{ required: !registryDisabled, message: '请输入密码' }]}
          >
            <Password
              disabled={registryDisabled}
              placeholder={registryDisabled ? '已隐藏' : '请输入密码'}
            />
          </Form.Item>
        </Col>
      </Row>
      {renderData('数据', [DOCKER_CONFIG_JSON_KEY])}
    </div>
  );

  const renderBasicAuthFields = () => {
    const username = getTypedFieldProps('basicAuthUsername', '请输入用户名');
    const password = getTypedFieldProps('basicAuthPassword', '请输入密码');

    return (
      <div className={styles.compactField}>
        <Form.Item label="用户名" {...username.item}>
          <Input {...username.input} />
        </Form.Item>
        <Form.Item label="密码" {...password.item}>
          <Password {...password.input} />
        </Form.Item>
      </div>
    );
  };

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.compactField}
        extra="类型创建后不可修改。"
        label="类型"
      >
        <Select
          disabled
          options={secretTypeOptions}
          // 表单不支持的类型按「默认」的方式编辑，这里如实显示它的类型
          value={rawType}
        />
      </Form.Item>
      {type === 'kubernetes.io/tls' && renderTlsFields()}
      {type === 'kubernetes.io/dockerconfigjson' && renderRegistryFields()}
      {type === 'kubernetes.io/basic-auth' && renderBasicAuthFields()}
      {type === 'Opaque' && renderData('数据')}
      {(type === 'kubernetes.io/tls' || type === 'kubernetes.io/basic-auth') &&
        renderData('其他数据')}
    </div>
  );
};

export default SecretEditDataSettings;
