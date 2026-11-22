import type { FormInstance } from 'antd';
import { Form, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useT } from '@/utils/i18n';
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
    labelId: 'pages.k8s.forms.job.restartPolicy.never',
    value: 'Never',
  },
  {
    labelId: 'pages.k8s.forms.job.restartPolicy.onFailure',
    value: 'OnFailure',
  },
];

type JobPodSettingsProps = {
  form: FormInstance<CreateJobFormValues>;
};

const JobPodSettings = ({ form }: JobPodSettingsProps) => {
  const { styles } = useStyles();
  const t = useT();
  const workloadForm =
    form as unknown as FormInstance<CreateWorkloadFormValues>;

  return (
    <>
      <Form.Item
        className={styles.restartPolicy}
        label={t('pages.k8s.forms.job.restartPolicy')}
        name="restartPolicy"
        rules={[
          {
            required: true,
            message: t('pages.k8s.forms.job.restartPolicy.required'),
          },
        ]}
      >
        <Select
          options={restartPolicyOptions.map((option) => ({
            label: t(option.labelId),
            value: option.value,
          }))}
          placeholder={t('pages.k8s.forms.job.restartPolicy.required')}
        />
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
