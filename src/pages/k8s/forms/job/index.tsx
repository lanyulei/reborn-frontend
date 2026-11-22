import {
  AppstoreOutlined,
  DockerOutlined,
  HddOutlined,
  SettingOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Col, Form, Input, Row } from 'antd';
import { useMemo, useState } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
import { hasKeyValueContent } from '../shared/manifest';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import type { CreateFormProps } from '../types';
import { WizardScopeContext } from '../workload/context';
import NamespaceField from '../workload/NamespaceField';
import StorageSettings from '../workload/StorageSettings';
import type { CreateWorkloadFormValues } from '../workload/types';
import useCreateWizard from '../workload/useCreateWizard';
import WorkloadAdvancedSettings from '../workload/WorkloadAdvancedSettings';
import {
  buildCreateJobManifest,
  getInitialCreateJobValues,
  JOB_API_VERSION,
  JOB_KIND,
  NAME_PATTERN,
  WORKLOAD_FORM_TYPE,
} from './helpers';
import JobPodSettings from './JobPodSettings';
import JobStrategySettings from './JobStrategySettings';
import type { CreateJobFormValues } from './types';

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

const hasPolicySettingsContent = (values: CreateJobFormValues) =>
  [
    values.backoffLimit,
    values.completions,
    values.parallelism,
    values.activeDeadlineSeconds,
  ].some((value) => typeof value === 'number' && Number.isFinite(value));

const hasAdvancedSettingsContent = (values: CreateJobFormValues) =>
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
  values: CreateJobFormValues,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && values.name && values.namespace) {
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

const CreateJobForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const [form] = Form.useForm<CreateJobFormValues>();
  const t = useT();
  const title = t('pages.k8s.forms.job.title');
  const [initialValues] = useState(() => getInitialCreateJobValues(namespace));
  const { values, manifestModal, drawerProps, formProps } = useCreateWizard({
    apiVersion: JOB_API_VERSION,
    buildDocuments: (formValues) => [buildCreateJobManifest(formValues)],
    clusterId,
    containerStep: 2,
    form,
    initialValues,
    kind: JOB_KIND,
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

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          tooltip={t('pages.k8s.forms.common.name.dnsLabel')}
          label={t('pages.k8s.forms.common.name')}
          name="name"
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.common.name.required'),
            },
            { max: 63, message: t('pages.k8s.forms.common.name.maxLength') },
            {
              pattern: NAME_PATTERN,
              message: t('pages.k8s.forms.common.name.pattern'),
            },
          ]}
        >
          <Input
            placeholder={t('pages.k8s.forms.common.name.required')}
            autoFocus
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <NamespaceField
          tooltip={t('pages.k8s.forms.common.namespace.placeholder')}
        />
      </Col>
    </Row>
  );

  const renderStepContent = () => {
    switch (drawerProps.current) {
      case 0:
        return renderBasicInfo();
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

export default CreateJobForm;
