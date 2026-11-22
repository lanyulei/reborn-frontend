import {
  AppstoreOutlined,
  DockerOutlined,
  HddOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, Row } from 'antd';
import { useMemo, useState } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
import { useKindName } from '../../components/meta';
import { hasKeyValueContent } from '../shared/manifest';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import type { CreateFormProps } from '../types';
import ContainerSettings from './ContainerSettings';
import { WizardScopeContext } from './context';
import {
  buildCreateWorkloadDocuments,
  getInitialCreateWorkloadValues,
  NAME_PATTERN,
  WORKLOAD_API_VERSION,
} from './helpers';
import NamespaceField from './NamespaceField';
import StorageSettings from './StorageSettings';
import type { CreateWorkloadFormValues, WorkloadKind } from './types';
import useCreateWizard from './useCreateWizard';
import WorkloadAdvancedSettings from './WorkloadAdvancedSettings';

type CreateWorkloadFormProps = CreateFormProps & {
  kind: WorkloadKind;
};

const STEP_ICONS = [
  <AppstoreOutlined key="basic" />,
  <DockerOutlined key="pod" />,
  <HddOutlined key="storage" />,
  <SlidersOutlined key="advanced" />,
];
const STEP_TITLE_IDS = [
  'pages.k8s.form.section.basic',
  'pages.k8s.forms.workload.step.pod',
  'pages.k8s.forms.common.storage',
  'pages.k8s.forms.common.advanced',
];

const hasAdvancedSettingsContent = (
  values: CreateWorkloadFormValues,
  kind: WorkloadKind,
) =>
  Boolean(
    (kind !== 'DaemonSet' &&
      (values.enableNodeSelector ||
        hasKeyValueContent(values.nodeSelectors) ||
        (values.selectedNodeNames && values.selectedNodeNames.length > 0))) ||
      hasKeyValueContent(values.labels) ||
      hasKeyValueContent(values.annotations),
  );

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateWorkloadFormValues,
  kind: WorkloadKind,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && values.name && values.namespace) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && values.containers && values.containers.length > 0) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && values.storageItems && values.storageItems.length > 0) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 3 && hasAdvancedSettingsContent(values, kind)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const CreateWorkloadForm = ({
  clusterId,
  kind,
  namespace,
  onClose,
  onDone,
}: CreateWorkloadFormProps) => {
  const [form] = Form.useForm<CreateWorkloadFormValues>();
  const t = useT();
  const kindName = useKindName();
  const title = t('pages.k8s.form.create', { kind: kindName(kind) });
  const [initialValues] = useState(() =>
    getInitialCreateWorkloadValues(kind, namespace),
  );
  const { values, manifestModal, drawerProps, formProps } = useCreateWizard({
    apiVersion: WORKLOAD_API_VERSION,
    buildDocuments: (formValues) =>
      buildCreateWorkloadDocuments(kind, formValues),
    clusterId,
    containerStep: 1,
    form,
    initialValues,
    kind,
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

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
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
        <NamespaceField />
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <ContainerSettings form={form} type={kind} />,
    () => <StorageSettings form={form} type={kind} />,
    () => <WorkloadAdvancedSettings form={form} type={kind} />,
  ][drawerProps.current];

  return (
    <WizardScopeContext.Provider value={scope}>
      <ResourceCreateWizardDrawer
        {...drawerProps}
        getStepDescription={(_, index) =>
          getStepStatusText(drawerProps.current, index, values, kind, t)
        }
        steps={steps}
        title={title}
      >
        <Form {...formProps}>{stepContent()}</Form>
      </ResourceCreateWizardDrawer>
      {manifestModal}
    </WizardScopeContext.Provider>
  );
};

export type { CreateWorkloadFormProps };
export default CreateWorkloadForm;
