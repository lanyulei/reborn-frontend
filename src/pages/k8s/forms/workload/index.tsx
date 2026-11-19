import {
  AppstoreOutlined,
  DockerOutlined,
  HddOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, Row } from 'antd';
import { useMemo, useState } from 'react';
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

const STEPS = [
  { title: '基本信息', icon: <AppstoreOutlined /> },
  { title: '容器组设置', icon: <DockerOutlined /> },
  { title: '存储设置', icon: <HddOutlined /> },
  { title: '高级设置', icon: <SlidersOutlined /> },
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
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && values.containers && values.containers.length > 0) {
    return '已设置';
  }
  if (index === 2 && values.storageItems && values.storageItems.length > 0) {
    return '已设置';
  }
  if (index === 3 && hasAdvancedSettingsContent(values, kind)) {
    return '已设置';
  }
  return '未设置';
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
    stepCount: STEPS.length,
    title,
    onClose,
    onDone,
  });
  const scope = useMemo(
    () => ({ clusterId, namespace: values.namespace }),
    [clusterId, values.namespace],
  );

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
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
          getStepStatusText(drawerProps.current, index, values, kind)
        }
        steps={STEPS}
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
