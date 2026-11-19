import type { FormInstance } from 'antd';
import { Form, Input, Modal, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
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
            label="域名"
            name="host"
            rules={[
              { max: 253, message: '域名最长 253 个字符' },
              {
                pattern: HOST_PATTERN,
                message:
                  '域名只能包含小写字母、数字、连字符（-）和点（.），可以 *. 开头',
              },
              ({ getFieldValue }) => ({
                validator: async (_, value?: string) => {
                  if (value?.trim() || getFieldValue('protocol') !== 'HTTPS') {
                    return;
                  }
                  throw new Error('HTTPS 路由需要填写域名');
                },
              }),
            ]}
            tooltip="留空表示匹配所有域名。"
          >
            <Input placeholder="example.com" />
          </Form.Item>
          <Form.Item
            className={styles.field}
            label="协议"
            name="protocol"
            rules={[{ required: true, message: '请选择协议' }]}
          >
            <Select options={INGRESS_PROTOCOL_OPTIONS} />
          </Form.Item>
          <div className={styles.pathLabel}>
            路径
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
