import {
  AppstoreOutlined,
  DockerOutlined,
  HddOutlined,
  SettingOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Form } from 'antd';
import { useMemo, useState } from 'react';
import JobPodSettings from '../job/JobPodSettings';
import JobStrategySettings from '../job/JobStrategySettings';
import { hasKeyValueContent } from '../shared/manifest';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import type { CreateFormProps } from '../types';
import { WizardScopeContext } from '../workload/context';
import StorageSettings from '../workload/StorageSettings';
import type { CreateWorkloadFormValues } from '../workload/types';
import useCreateWizard from '../workload/useCreateWizard';
import WorkloadAdvancedSettings from '../workload/WorkloadAdvancedSettings';
import CronJobBasicSettings from './CronJobBasicSettings';
import {
  buildCreateCronJobManifest,
  CRON_JOB_API_VERSION,
  CRON_JOB_KIND,
  getInitialCreateCronJobValues,
  WORKLOAD_FORM_TYPE,
} from './helpers';
import type { CreateCronJobFormValues } from './types';

const STEPS = [
  { title: '基本信息', icon: <AppstoreOutlined /> },
  { title: '策略设置', icon: <SettingOutlined /> },
  { title: '容器组设置', icon: <DockerOutlined /> },
  { title: '存储设置', icon: <HddOutlined /> },
  { title: '高级设置', icon: <SlidersOutlined /> },
];

const hasPolicySettingsContent = (values: CreateCronJobFormValues) =>
  [
    values.backoffLimit,
    values.completions,
    values.parallelism,
    values.activeDeadlineSeconds,
  ].some((value) => typeof value === 'number' && Number.isFinite(value));

const hasAdvancedSettingsContent = (values: CreateCronJobFormValues) =>
  Boolean(
    values.enableNodeSelector ||
      hasKeyValueContent(values.nodeSelectors) ||
      (values.selectedNodeNames && values.selectedNodeNames.length > 0) ||
      hasKeyValueContent(values.labels) ||
      hasKeyValueContent(values.annotations),
  );

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateCronJobFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace && values.schedule) {
    return '已设置';
  }
  if (index === 1 && hasPolicySettingsContent(values)) {
    return '已设置';
  }
  if (index === 2 && values.containers && values.containers.length > 0) {
    return '已设置';
  }
  if (index === 3 && values.storageItems && values.storageItems.length > 0) {
    return '已设置';
  }
  if (index === 4 && hasAdvancedSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const CreateCronJobForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const [form] = Form.useForm<CreateCronJobFormValues>();
  const [initialValues] = useState(() =>
    getInitialCreateCronJobValues(namespace),
  );
  const { values, manifestModal, drawerProps, formProps } = useCreateWizard({
    apiVersion: CRON_JOB_API_VERSION,
    buildDocuments: (formValues) => [buildCreateCronJobManifest(formValues)],
    clusterId,
    containerStep: 2,
    form,
    initialValues,
    kind: CRON_JOB_KIND,
    namespace,
    stepCount: STEPS.length,
    title: '创建定时任务',
    onClose,
    onDone,
  });
  const scope = useMemo(
    () => ({ clusterId, namespace: values.namespace }),
    [clusterId, values.namespace],
  );
  const workloadForm =
    form as unknown as FormInstance<CreateWorkloadFormValues>;

  const renderStepContent = () => {
    switch (drawerProps.current) {
      case 0:
        return <CronJobBasicSettings />;
      case 1:
        return <JobStrategySettings />;
      case 2:
        return <JobPodSettings form={form} />;
      case 3:
        return (
          <StorageSettings form={workloadForm} type={WORKLOAD_FORM_TYPE} />
        );
      case 4:
        return (
          <WorkloadAdvancedSettings
            form={workloadForm}
            type={WORKLOAD_FORM_TYPE}
          />
        );
      default:
        return null;
    }
  };

  return (
    <WizardScopeContext.Provider value={scope}>
      <ResourceCreateWizardDrawer
        {...drawerProps}
        getStepDescription={(_, index) =>
          getStepStatusText(drawerProps.current, index, values)
        }
        steps={STEPS}
        title="创建定时任务"
      >
        <Form {...formProps}>{renderStepContent()}</Form>
      </ResourceCreateWizardDrawer>
      {manifestModal}
    </WizardScopeContext.Provider>
  );
};

export default CreateCronJobForm;
