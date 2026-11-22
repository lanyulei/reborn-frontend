/**
 * 保密字典编辑的数据设置：与创建向导同款的按类型表单，但类型不可改，已有的值是隐藏的。
 * 专用表单项（证书、用户名等）留空表示保持原值；镜像服务信息要先查看明文才能编辑。
 */
import type { FormInstance } from 'antd';
import { Alert, Col, Form, Input, Row, Select, Space } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
import {
  BINARY_VALUE_TEXT_ID,
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

const TYPED_KEYS: Record<TypedField, string> = {
  basicAuthPassword: 'password',
  basicAuthUsername: 'username',
  tlsCertificate: 'tls.crt',
  tlsPrivateKey: 'tls.key',
};

const getDockerNotice = (
  state: DockerEditState,
  canReveal: boolean,
  t: Translate,
) => {
  if (state === 'hidden') {
    return canReveal
      ? t('pages.k8s.forms.edit.secret.docker.hiddenCanReveal')
      : t('pages.k8s.forms.edit.secret.docker.hiddenNoPermission');
  }
  if (state === 'unparsed') {
    return t('pages.k8s.forms.edit.secret.docker.unparsed');
  }
  if (state === 'replaced') {
    return t('pages.k8s.forms.edit.secret.docker.replaced');
  }

  return undefined;
};

const SecretEditDataSettings = ({
  canReveal,
  form,
  manifest,
  reveal,
}: SecretEditDataSettingsProps) => {
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
  const maskRule = {
    validator: (_: unknown, value?: string) =>
      value === SECRET_MASK
        ? Promise.reject(
            new Error(
              t('pages.k8s.forms.edit.secret.mask.notAllowed', {
                mask: SECRET_MASK,
              }),
            ),
          )
        : Promise.resolve(),
  };
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
  const dockerNotice =
    dockerState && getDockerNotice(dockerState, canReveal, t);
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
        extra:
          loaded && !binary
            ? t('pages.k8s.forms.edit.secret.keepHint')
            : undefined,
        name: field,
        required: !loaded,
        rules: [{ required: !loaded, message: emptyMessage }, maskRule],
      },
      input: {
        disabled: binary,
        placeholder: binary
          ? t(BINARY_VALUE_TEXT_ID)
          : loaded
            ? t('pages.k8s.forms.edit.secret.hiddenPlaceholder')
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
    const certificate = getTypedFieldProps(
      'tlsCertificate',
      t('pages.k8s.forms.secret.certificate.required'),
    );
    const privateKey = getTypedFieldProps(
      'tlsPrivateKey',
      t('pages.k8s.forms.secret.privateKey.required'),
    );

    return (
      <div className={styles.compactField}>
        <Form.Item
          label={t('pages.k8s.forms.secret.certificate')}
          {...certificate.item}
        >
          <TextArea
            {...certificate.input}
            autoSize={{ minRows: 6, maxRows: 10 }}
          />
        </Form.Item>
        <Form.Item
          label={t('pages.k8s.forms.secret.privateKey')}
          {...privateKey.item}
        >
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
            extra={t('pages.k8s.forms.secret.registryAddress.extra')}
            label={t('pages.k8s.forms.secret.registryAddress')}
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
                    message: t(
                      'pages.k8s.forms.secret.registryAddress.required',
                    ),
                  },
                ]}
              >
                <Input
                  className={styles.compactInputValue}
                  disabled={registryDisabled}
                  placeholder={
                    registryDisabled
                      ? t('pages.k8s.forms.common.hidden')
                      : t('pages.k8s.forms.secret.registryAddress.placeholder')
                  }
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
                required: !registryDisabled,
                message: t('pages.k8s.forms.common.username.required'),
              },
            ]}
          >
            <Input
              disabled={registryDisabled}
              placeholder={
                registryDisabled
                  ? t('pages.k8s.forms.common.hidden')
                  : t('pages.k8s.forms.common.username.required')
              }
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
              disabled={registryDisabled}
              placeholder={
                registryDisabled
                  ? t('pages.k8s.forms.common.hidden')
                  : t('pages.k8s.forms.secret.email.placeholder')
              }
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('pages.k8s.forms.common.password')}
            name="registryPassword"
            rules={[
              {
                required: !registryDisabled,
                message: t('pages.k8s.forms.common.password.required'),
              },
            ]}
          >
            <Password
              disabled={registryDisabled}
              placeholder={
                registryDisabled
                  ? t('pages.k8s.forms.common.hidden')
                  : t('pages.k8s.forms.common.password.required')
              }
            />
          </Form.Item>
        </Col>
      </Row>
      {renderData(t('pages.k8s.forms.common.data'), [DOCKER_CONFIG_JSON_KEY])}
    </div>
  );

  const renderBasicAuthFields = () => {
    const username = getTypedFieldProps(
      'basicAuthUsername',
      t('pages.k8s.forms.common.username.required'),
    );
    const password = getTypedFieldProps(
      'basicAuthPassword',
      t('pages.k8s.forms.common.password.required'),
    );

    return (
      <div className={styles.compactField}>
        <Form.Item
          label={t('pages.k8s.forms.common.username')}
          {...username.item}
        >
          <Input {...username.input} />
        </Form.Item>
        <Form.Item
          label={t('pages.k8s.forms.common.password')}
          {...password.item}
        >
          <Password {...password.input} />
        </Form.Item>
      </div>
    );
  };

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.compactField}
        extra={t('pages.k8s.forms.edit.secret.typeImmutable')}
        label={t('pages.k8s.forms.common.type')}
      >
        <Select
          disabled
          options={typeOptions}
          // 表单不支持的类型按「默认」的方式编辑，这里如实显示它的类型
          value={rawType}
        />
      </Form.Item>
      {type === 'kubernetes.io/tls' && renderTlsFields()}
      {type === 'kubernetes.io/dockerconfigjson' && renderRegistryFields()}
      {type === 'kubernetes.io/basic-auth' && renderBasicAuthFields()}
      {type === 'Opaque' && renderData(t('pages.k8s.forms.common.data'))}
      {(type === 'kubernetes.io/tls' || type === 'kubernetes.io/basic-auth') &&
        renderData(t('pages.k8s.forms.edit.secret.otherData'))}
    </div>
  );
};

export default SecretEditDataSettings;
