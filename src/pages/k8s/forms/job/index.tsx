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

const STEPS = [
  { title: '基本信息', icon: <AppstoreOutlined /> },
  { title: '策略设置', icon: <SettingOutlined /> },
  { title: '容器组设置', icon: <DockerOutlined /> },
  { title: '存储设置', icon: <HddOutlined /> },
  { title: '高级设置', icon: <SlidersOutlined /> },
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
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
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

const CreateJobForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const [form] = Form.useForm<CreateJobFormValues>();
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
    stepCount: STEPS.length,
    title: '创建任务',
    onClose,
    onDone,
  });
  const scope = useMemo(
    () => ({ clusterId, namespace: values.namespace }),
    [clusterId, values.namespace],
  );
  const workloadForm =
    form as unknown as FormInstance<CreateWorkloadFormValues>;

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          tooltip="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            { max: 63, message: '名称最长 63 个字符' },
            {
              pattern: NAME_PATTERN,
              message:
                '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
            },
          ]}
        >
          <Input placeholder="请输入名称" autoFocus />
        </Form.Item>
      </Col>
      <Col span={12}>
        <NamespaceField tooltip="选择将要创建资源的命名空间" />
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
          getStepStatusText(drawerProps.current, index, values)
        }
        steps={STEPS}
        title="创建任务"
      >
        <Form {...formProps}>{renderStepContent()}</Form>
      </ResourceCreateWizardDrawer>
      {manifestModal}
    </WizardScopeContext.Provider>
  );
};

export default CreateJobForm;
