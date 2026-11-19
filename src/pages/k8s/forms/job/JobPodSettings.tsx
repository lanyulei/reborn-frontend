import type { FormInstance } from 'antd';
import { Form, Select } from 'antd';
import { createStyles } from 'antd-style';
import { WorkloadContainerEditor } from '../workload/ContainerSettings';
import type { CreateWorkloadFormValues } from '../workload/types';
import { WORKLOAD_FORM_TYPE } from './helpers';
import type { CreateJobFormValues } from './types';

const useStyles = createStyles(({ token }) => ({
  restartPolicy: {
    maxWidth: 452,
    marginBottom: token.marginLG,
  },
}));

const restartPolicyOptions = [
  {
    label: '重新创建容器组',
    value: 'Never',
  },
  {
    label: '重启容器',
    value: 'OnFailure',
  },
];

type JobPodSettingsProps = {
  form: FormInstance<CreateJobFormValues>;
};

const JobPodSettings = ({ form }: JobPodSettingsProps) => {
  const { styles } = useStyles();
  const workloadForm =
    form as unknown as FormInstance<CreateWorkloadFormValues>;

  return (
    <>
      <Form.Item
        className={styles.restartPolicy}
        label="重启策略"
        name="restartPolicy"
        rules={[{ required: true, message: '请选择重启策略' }]}
      >
        <Select options={restartPolicyOptions} placeholder="请选择重启策略" />
      </Form.Item>
      <WorkloadContainerEditor
        form={workloadForm}
        showReplicaPanel={false}
        showTitle={false}
        type={WORKLOAD_FORM_TYPE}
      />
    </>
  );
};

export default JobPodSettings;
