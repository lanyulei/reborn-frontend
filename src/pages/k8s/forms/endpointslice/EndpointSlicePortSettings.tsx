import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Input, InputNumber, Select } from 'antd';
import { createStyles } from 'antd-style';
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

const PORT_NUMBER_RULES = [
  { type: 'number' as const, min: 1, message: '端口号不能小于 1' },
  { type: 'number' as const, max: 65535, message: '端口号不能大于 65535' },
];

type EndpointSlicePortSettingsProps = {
  form: FormInstance<CreateEndpointSliceFormValues>;
};

const EndpointSlicePortSettings = ({
  form,
}: EndpointSlicePortSettingsProps) => {
  const { styles } = useStyles();
  const ports = (Form.useWatch('ports', form) as EndpointSlicePortItem[]) || [];
  const addDisabled = ports.some(
    (item) => !item.name && !item.port && !item.appProtocol,
  );

  return (
    <ResourceFormSection
      bordered={false}
      description="端口可选；填写后会输出 ports 数组，端口名称应在当前端点切片内保持唯一。"
      title="端口"
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
                      label="名称"
                      name={[field.name, 'name']}
                      rules={[
                        { max: 15, message: '端口名称最长 15 个字符' },
                        {
                          pattern: PORT_NAME_PATTERN,
                          message:
                            '端口名称只能包含小写字母、数字和连字符（-）',
                        },
                      ]}
                    >
                      <Input className={styles.input} placeholder="例如 http" />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      label="端口"
                      name={[field.name, 'port']}
                      rules={PORT_NUMBER_RULES}
                    >
                      <InputNumber
                        className={styles.input}
                        max={65535}
                        min={1}
                        placeholder="例如 80"
                        precision={0}
                      />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      label="协议"
                      name={[field.name, 'protocol']}
                    >
                      <Select
                        className={styles.input}
                        options={PROTOCOL_OPTIONS}
                        placeholder="请选择协议"
                      />
                    </Form.Item>
                    <Form.Item
                      className={styles.formItem}
                      tooltip="例如 http、kubernetes.io/h2c 或自定义前缀协议。"
                      label="应用协议"
                      name={[field.name, 'appProtocol']}
                      rules={[{ max: 250, message: '应用协议最长 250 个字符' }]}
                    >
                      <Input className={styles.input} placeholder="例如 http" />
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
                  添加端口
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
