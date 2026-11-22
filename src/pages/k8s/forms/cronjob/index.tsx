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
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
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

const STEP_ICONS = [
  <AppstoreOutlined key="basic" />,
  <SettingOutlined key="strategy" />,
  <DockerOutlined key="pod" />,
  <HddOutlined key="storage" />,
  <SlidersOutlined key="advanced" />,
];
const STEP_TITLE_IDS = [
  'pages.k8s.form.section.basic',
  'pages.k8s.forms.job.step.strategy',
  'pages.k8s.forms.workload.step.pod',
  'pages.k8s.forms.common.storage',
  'pages.k8s.forms.common.advanced',
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
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && values.name && values.namespace && values.schedule) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasPolicySettingsContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && values.containers && values.containers.length > 0) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 3 && values.storageItems && values.storageItems.length > 0) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 4 && hasAdvancedSettingsContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const CreateCronJobForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const [form] = Form.useForm<CreateCronJobFormValues>();
  const t = useT();
  const title = t('pages.k8s.forms.cronjob.title');
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
    stepCount: STEP_TITLE_IDS.length,
    title,
    onClose,
    onDone,
  });
  const scope = useMemo(
    () => ({ clusterId, namespace: values.namespace }),
    [clusterId, values.namespace],
  );
  const steps = useMemo(
    () =>
      STEP_TITLE_IDS.map((id, index) => ({
        title: t(id),
        icon: STEP_ICONS[index],
      })),
    [t],
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
          getStepStatusText(drawerProps.current, index, values, t)
        }
        steps={steps}
        title={title}
      >
        <Form {...formProps}>{renderStepContent()}</Form>
      </ResourceCreateWizardDrawer>
      {manifestModal}
    </WizardScopeContext.Provider>
  );
};

export default CreateCronJobForm;
