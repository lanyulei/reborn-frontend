import { Form, Input, InputNumber, Select } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';

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
  const t = useT();

  return (
    <Form.Item label={t('pages.k8s.forms.workload.container.path')} required>
      <div className={styles.httpTarget}>
        <div className={styles.compactField}>
          <span className={styles.addon}>
            {t('pages.k8s.forms.workload.container.protocol')}
          </span>
          <Form.Item name={schemeName} noStyle>
            <Select
              aria-label={t(
                'pages.k8s.forms.workload.container.http.scheme.aria',
              )}
              options={SCHEME_OPTIONS}
              placeholder={t('pages.k8s.forms.common.protocol.required')}
              style={{ width: '100%' }}
              variant="borderless"
            />
          </Form.Item>
        </div>
        <div className={styles.compactField}>
          <span className={styles.addon}>
            {t('pages.k8s.forms.workload.container.path')}
          </span>
          <Form.Item
            name={pathName}
            noStyle
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.workload.container.path.required'),
              },
            ]}
          >
            <Input
              aria-label={t(
                'pages.k8s.forms.workload.container.http.path.aria',
              )}
              placeholder="/"
              variant="borderless"
            />
          </Form.Item>
        </div>
        <div className={styles.compactField}>
          <span className={styles.addon}>{t('pages.k8s.form.port')}</span>
          <Form.Item
            name={portName}
            noStyle
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.port.required'),
              },
              {
                type: 'number',
                min: 1,
                max: 65535,
                message: t('pages.k8s.forms.common.port.range'),
              },
            ]}
          >
            <InputNumber
              aria-label={t(
                'pages.k8s.forms.workload.container.http.port.aria',
              )}
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
