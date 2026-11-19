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
                    aria-label={`删除${label}权能`}
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
                添加
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
        <div className={styles.groupTitle}>访问控制</div>
        <div className={styles.group}>
          <div className={styles.switchStack}>
            <SecuritySwitchField
              description="以主机上的 root 用户运行容器进程。"
              name="containerPrivileged"
              title="特权模式"
            />
            <SecuritySwitchField
              description="允许容器进程获取比父进程更多的特权。当特权模式启用时，此选项默认启用。"
              disabled={privileged}
              name="allowPrivilegeEscalation"
              title="允许特权提升"
            />
            <SecuritySwitchField
              description="将容器文件系统的根目录设置为只读。"
              name="containerReadOnlyRootFilesystem"
              title="根目录只读"
            />
          </div>
        </div>
      </section>

      <section>
        <div className={styles.groupTitle}>用户和用户组</div>
        <div className={styles.group}>
          <SecuritySwitchField
            description="启动容器之前检查容器是否将以 root 用户运行。如果容器将以 root 用户运行则不启动容器。"
            name="containerRunAsNonRoot"
            title="仅允许非 root 用户运行"
          />
          <Row gutter={18}>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label="用户"
                name="containerRunAsUser"
              >
                <InputNumber
                  min={0}
                  placeholder="请输入用户 ID"
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <div className={styles.fieldHelp}>
                执行容器进程入口点的 UID。默认为镜像元数据中指定的 UID。
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label="用户组"
                name="containerRunAsGroup"
              >
                <InputNumber
                  min={0}
                  placeholder="请输入用户组 ID"
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <div className={styles.fieldHelp}>
                执行容器进程入口点的 GID。默认为容器运行时的默认 GID。
              </div>
            </Col>
          </Row>
        </div>
      </section>

      <section>
        <div className={styles.groupTitle}>SELinux 上下文</div>
        <div className={styles.group}>
          <Row gutter={18}>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.seLinuxField}
                label="等级"
                name="containerSeLinuxLevel"
                style={{ marginBottom: `16px` }}
              >
                <Input placeholder="请输入 SELinux 等级" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.seLinuxField}
                label="角色"
                name="containerSeLinuxRole"
                style={{ marginBottom: `16px` }}
              >
                <Input placeholder="请输入 SELinux 角色" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label="类型"
                name="containerSeLinuxType"
              >
                <Input placeholder="请输入 SELinux 类型" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label="用户"
                name="containerSeLinuxUser"
              >
                <Input placeholder="请输入 SELinux 用户" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </section>

      <section>
        <div className={styles.groupTitle}>权能</div>
        <div className={styles.group}>
          <CapabilityList
            label="添加"
            name="containerCapabilitiesAdd"
            placeholder="例如 NET_ADMIN"
          />
          <CapabilityList
            label="移除"
            name="containerCapabilitiesDrop"
            placeholder="例如 ALL"
          />
        </div>
      </section>

      <section>
        <div className={styles.groupTitle}>Seccomp 配置</div>
        <div className={styles.group}>
          <Row gutter={18}>
            <Col xs={24} md={12}>
              <Form.Item
                className={styles.formItem}
                label="配置类型"
                name="containerSeccompProfileType"
              >
                <Select
                  allowClear
                  options={seccompProfileOptions}
                  placeholder="请选择 Seccomp 类型"
                />
              </Form.Item>
            </Col>
            {seccompProfileType === 'Localhost' && (
              <Col xs={24} md={12}>
                <Form.Item
                  className={styles.formItem}
                  label="本地配置路径"
                  name="containerSeccompProfileLocalhost"
                  rules={[{ required: true, message: '请输入本地配置路径' }]}
                >
                  <Input placeholder="例如 profiles/audit.json" />
                </Form.Item>
              </Col>
            )}
          </Row>
          <div className={styles.fieldHelp}>
            RuntimeDefault 使用容器运行时默认配置；Localhost
            需要填写节点上的配置文件路径。
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContainerSecurityContextFields;
