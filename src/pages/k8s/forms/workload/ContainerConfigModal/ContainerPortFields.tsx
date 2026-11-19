import {
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Select, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { PORT_NAME_PATTERN } from '../../shared/manifest';
import type { ContainerPortItem } from '../types';

const PORT_NUMBER_RULES = [
  {
    type: 'number' as const,
    min: 1,
    max: 65535,
    message: '端口范围为 1-65535',
  },
];

const protocolOptions = [
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTPS', value: 'HTTPS' },
  { label: 'TCP', value: 'TCP' },
  { label: 'UDP', value: 'UDP' },
  { label: 'SCTP', value: 'SCTP' },
];

const useStyles = createStyles(({ token }) => ({
  ports: {
    display: 'flex',
    flexDirection: 'column',
    // gap: token.marginSM,
  },
  portRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns:
      'minmax(192px, 0.9fr) minmax(148px, 1fr) minmax(148px, 0.9fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    background: token.colorFillQuaternary,

    '& + &': {
      marginTop: 0,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  inputPrefix: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
  },
  helpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 12,
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
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  addon: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    padding: `0 ${token.paddingSM}px`,
    borderRight: `1px solid ${token.colorBorder}`,
    background: token.colorFillQuaternary,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: '30px',
    whiteSpace: 'nowrap',
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
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

const getDefaultPort = (index: number) => ({
  protocol: 'HTTP',
  name: `http-${index}`,
});

const isPortItemIncomplete = (item: ContainerPortItem | undefined) =>
  !item?.containerPort;

type CompactFieldProps = {
  addonClassName: string;
  compactFieldClassName: string;
  label: ReactNode;
  children: ReactNode;
};

const CompactField = ({
  addonClassName,
  compactFieldClassName,
  label,
  children,
}: CompactFieldProps) => {
  return (
    <div className={compactFieldClassName}>
      <span className={addonClassName}>{label}</span>
      {children}
    </div>
  );
};

const ContainerPortFields = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const containerPorts =
    (Form.useWatch('containerPorts', {
      form,
      preserve: true,
    }) as ContainerPortItem[]) || [];
  const addDisabled = containerPorts.some(isPortItemIncomplete);

  return (
    <div className={styles.ports}>
      <Form.List name="containerPorts">
        {(fields, { add, remove }) => (
          <>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: `12px` }}
            >
              {fields.map((field) => (
                <div className={styles.portRow} key={field.key}>
                  <div className={styles.formItem}>
                    <CompactField
                      addonClassName={styles.addon}
                      compactFieldClassName={styles.compactField}
                      label={
                        <span className={styles.inputPrefix}>
                          协议
                          <Tooltip title="HTTP/HTTPS 会在提交时按 TCP 容器端口协议生成。">
                            <QuestionCircleOutlined
                              className={styles.helpIcon}
                            />
                          </Tooltip>
                        </span>
                      }
                    >
                      <Form.Item name={[field.name, 'protocol']} noStyle>
                        <Select
                          options={protocolOptions}
                          placeholder="请选择协议"
                          style={{ width: '100%' }}
                          variant="borderless"
                        />
                      </Form.Item>
                    </CompactField>
                  </div>
                  <Form.Item className={styles.formItem}>
                    <CompactField
                      addonClassName={styles.addon}
                      compactFieldClassName={styles.compactField}
                      label="名称"
                    >
                      <Form.Item
                        name={[field.name, 'name']}
                        noStyle
                        rules={[
                          { max: 15, message: '端口名称最长 15 个字符' },
                          {
                            pattern: PORT_NAME_PATTERN,
                            message:
                              '端口名称只能包含小写字母、数字和连字符（-）',
                          },
                        ]}
                      >
                        <Input placeholder="例如 http-0" variant="borderless" />
                      </Form.Item>
                    </CompactField>
                  </Form.Item>
                  <Form.Item className={styles.formItem}>
                    <CompactField
                      addonClassName={styles.addon}
                      compactFieldClassName={styles.compactField}
                      label="容器端口"
                    >
                      <Form.Item
                        name={[field.name, 'containerPort']}
                        noStyle
                        rules={[
                          { required: true, message: '请输入容器端口' },
                          ...PORT_NUMBER_RULES,
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={65535}
                          placeholder="必填"
                          precision={0}
                          style={{ width: '100%' }}
                          variant="borderless"
                        />
                      </Form.Item>
                    </CompactField>
                  </Form.Item>
                  <Button
                    aria-label="删除端口"
                    className={styles.deleteButton}
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => remove(field.name)}
                  />
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <Button
                disabled={addDisabled}
                icon={<PlusOutlined />}
                onClick={async () => {
                  try {
                    await form.validateFields(
                      fields.map((field) => [
                        'containerPorts',
                        field.name,
                        'containerPort',
                      ]),
                    );
                    add(getDefaultPort(fields.length));
                  } catch {
                    // Validation errors are displayed by Form.Item.
                  }
                }}
              >
                添加端口
              </Button>
            </div>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default ContainerPortFields;
