import { Form } from 'antd';
import type { ReactNode } from 'react';
import { useNamespaceOptions } from '../shared/kube';
import CreatableSelect from './CreatableSelect';
import { useWizardScope } from './context';

type NamespaceFieldProps = {
  label?: string;
  tooltip?: ReactNode;
};

/** 基本信息里的命名空间字段：候选项取自集群，取不到时可直接输入 */
const NamespaceField = ({
  label = '命名空间',
  tooltip,
}: NamespaceFieldProps) => {
  const { clusterId } = useWizardScope();
  const { namespaces, loading } = useNamespaceOptions(clusterId);

  return (
    <Form.Item
      label={label}
      name="namespace"
      rules={[{ required: true, message: `请选择${label}` }]}
      tooltip={tooltip}
    >
      <CreatableSelect
        items={namespaces}
        loading={loading}
        placeholder={`请选择${label}`}
      />
    </Form.Item>
  );
};

export default NamespaceField;
