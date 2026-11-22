import { Form } from 'antd';
import type { ReactNode } from 'react';
import { useT } from '@/utils/i18n';
import { useNamespaceOptions } from '../shared/kube';
import CreatableSelect from './CreatableSelect';
import { useWizardScope } from './context';

type NamespaceFieldProps = {
  label?: string;
  tooltip?: ReactNode;
};

/** 基本信息里的命名空间字段：候选项取自集群，取不到时可直接输入 */
const NamespaceField = ({ label, tooltip }: NamespaceFieldProps) => {
  const t = useT();
  const fieldLabel = label ?? t('pages.k8s.forms.common.namespace');
  const placeholder = t('pages.k8s.forms.workload.selectField', {
    label: fieldLabel,
  });
  const { clusterId } = useWizardScope();
  const { namespaces, loading } = useNamespaceOptions(clusterId);

  return (
    <Form.Item
      label={fieldLabel}
      name="namespace"
      rules={[{ required: true, message: placeholder }]}
      tooltip={tooltip}
    >
      <CreatableSelect
        items={namespaces}
        loading={loading}
        placeholder={placeholder}
      />
    </Form.Item>
  );
};

export default NamespaceField;
