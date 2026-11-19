import { Form, Input, InputNumber, Select } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';

const SCHEME_OPTIONS = [
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTPS', value: 'HTTPS' },
];

const useStyles = createStyles(
  ({ token }, props: { compactRow?: boolean }) => ({
    httpTarget: {
      display: 'grid',
      minHeight: 46,
      gridTemplateColumns: props.compactRow
        ? 'minmax(132px, 0.8fr) minmax(0, 1fr) minmax(132px, 1fr)'
        : 'minmax(132px, 0.8fr) minmax(180px, 1fr) minmax(132px, 1fr)',
      alignItems: 'center',
      gap: token.marginSM,
      padding: `${token.paddingXS}px ${token.paddingMD}px`,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: 24,
      background: token.colorFillQuaternary,

      '@media (max-width: 768px)': {
        gridTemplateColumns: 'minmax(0, 1fr)',
      },
    },
    compactField: {
      display: 'grid',
      minWidth: 0,
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      overflow: 'hidden',
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadiusSM,
      background: token.colorBgContainer,
    },
    addon: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: `0 ${token.paddingSM}px`,
      borderRight: `1px solid ${token.colorBorder}`,
      background: token.colorFillQuaternary,
      color: token.colorText,
      fontSize: token.fontSizeSM,
      lineHeight: '30px',
      whiteSpace: 'nowrap',
    },
    errors: {
      marginTop: token.marginXXS,
    },
  }),
);

type ContainerHttpTargetFieldsProps = {
  compactRow?: boolean;
  pathName: NamePath;
  portName: NamePath;
  schemeName: NamePath;
};

const FieldErrors = ({ names }: { names: NamePath[] }) => {
  const form = Form.useFormInstance();

  return (
    <Form.Item noStyle shouldUpdate>
      {() => {
        const errors = names.flatMap((name) => form.getFieldError(name));

        return errors.length > 0 ? <Form.ErrorList errors={errors} /> : null;
      }}
    </Form.Item>
  );
};

const ContainerHttpTargetFields = ({
  compactRow,
  pathName,
  portName,
  schemeName,
}: ContainerHttpTargetFieldsProps) => {
  const { styles } = useStyles({ compactRow });

  return (
    <Form.Item label="路径" required>
      <div className={styles.httpTarget}>
        <div className={styles.compactField}>
          <span className={styles.addon}>协议</span>
          <Form.Item name={schemeName} noStyle>
            <Select
              aria-label="请求协议"
              options={SCHEME_OPTIONS}
              placeholder="请选择协议"
              style={{ width: '100%' }}
              variant="borderless"
            />
          </Form.Item>
        </div>
        <div className={styles.compactField}>
          <span className={styles.addon}>路径</span>
          <Form.Item
            name={pathName}
            noStyle
            rules={[{ required: true, message: '请输入路径' }]}
          >
            <Input aria-label="请求路径" placeholder="/" variant="borderless" />
          </Form.Item>
        </div>
        <div className={styles.compactField}>
          <span className={styles.addon}>端口</span>
          <Form.Item
            name={portName}
            noStyle
            rules={[
              { required: true, message: '请输入端口' },
              {
                type: 'number',
                min: 1,
                max: 65535,
                message: '端口范围为 1-65535',
              },
            ]}
          >
            <InputNumber
              aria-label="请求端口"
              min={1}
              max={65535}
              placeholder="80"
              precision={0}
              style={{ width: '100%' }}
              variant="borderless"
            />
          </Form.Item>
        </div>
      </div>
      <div className={styles.errors}>
        <FieldErrors names={[pathName, portName]} />
      </div>
    </Form.Item>
  );
};

export default ContainerHttpTargetFields;
