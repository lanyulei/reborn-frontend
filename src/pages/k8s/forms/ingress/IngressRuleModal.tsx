import type { FormInstance } from 'antd';
import { Form, Input, Modal, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import { useT } from '@/utils/i18n';
import { HOST_PATTERN, INGRESS_PROTOCOL_OPTIONS } from './helpers';
import RoutePathEditor from './RoutePathEditor';
import type { IngressRouteRuleItem, IngressServiceOption } from './types';

const useStyles = createStyles(({ token }) => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    paddingTop: token.paddingXS,
  },
  field: {
    width: 'min(456px, 100%)',
    marginBottom: token.marginMD,
  },
  pathLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  requiredMark: {
    marginInlineStart: token.marginXXS,
    color: token.colorError,
  },
}));

type IngressRuleModalProps = {
  form: FormInstance<IngressRouteRuleItem>;
  open: boolean;
  serviceOptions: IngressServiceOption[];
  title: string;
  onCancel: () => void;
  onOk: () => void;
  onServiceSelect: (serviceName: string) => void;
};

const IngressRuleModal = ({
  form,
  open,
  serviceOptions,
  title,
  onCancel,
  onOk,
  onServiceSelect,
}: IngressRuleModalProps) => {
  const t = useT();
  const { styles } = useStyles();

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => {
      form.getFieldInstance('host')?.focus?.();
    });
    return () => window.clearTimeout(timer);
  }, [form, open]);

  return (
    <Modal
      destroyOnHidden
      mask={{ closable: false }}
      open={open}
      title={title}
      width={960}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form className={styles.form} form={form} layout="vertical" requiredMark>
        <div>
          <Form.Item
            className={styles.field}
            dependencies={['protocol']}
            label={t('pages.k8s.forms.ingress.host')}
            name="host"
            rules={[
              {
                max: 253,
                message: t('pages.k8s.forms.ingress.host.maxLength'),
              },
              {
                pattern: HOST_PATTERN,
                message: t('pages.k8s.forms.ingress.host.pattern'),
              },
              ({ getFieldValue }) => ({
                validator: async (_, value?: string) => {
                  if (value?.trim() || getFieldValue('protocol') !== 'HTTPS') {
                    return;
                  }
                  throw new Error(
                    t('pages.k8s.forms.ingress.host.requiredForHttps'),
                  );
                },
              }),
            ]}
            tooltip={t('pages.k8s.forms.ingress.host.tooltip')}
          >
            <Input placeholder="example.com" />
          </Form.Item>
          <Form.Item
            className={styles.field}
            label={t('pages.k8s.forms.ingress.protocol')}
            name="protocol"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.protocol.required'),
              },
            ]}
          >
            <Select options={INGRESS_PROTOCOL_OPTIONS} />
          </Form.Item>
          <div className={styles.pathLabel}>
            {t('pages.k8s.forms.ingress.path')}
            <span className={styles.requiredMark}>*</span>
          </div>
          <RoutePathEditor
            form={form}
            serviceOptions={serviceOptions}
            onServiceSelect={onServiceSelect}
          />
        </div>
      </Form>
    </Modal>
  );
};

export default IngressRuleModal;
