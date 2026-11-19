import {
  AppstoreOutlined,
  DeploymentUnitOutlined,
  LineChartOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, AutoComplete, Col, Form, Input, Row } from 'antd';
import { useMemo, useState } from 'react';
import { parseObject, toYaml, useNamespaceOptions } from '../shared/kube';
import { getRecordValue, hasKeyValueContent } from '../shared/manifest';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import BehaviorSettings from './BehaviorSettings';
import {
  buildCreateHpaManifest,
  getHpaFormError,
  getHpaStepFields,
  getInitialCreateHpaValues,
  HPA_API_VERSION,
  HPA_KIND,
  NAME_PATTERN,
} from './helpers';
import MetricSettings from './MetricSettings';
import TargetSettings from './TargetSettings';
import type { CreateHorizontalPodAutoscalerFormValues } from './types';

const hasMetricsContent = (values: CreateHorizontalPodAutoscalerFormValues) =>
  typeof values.maxReplicas === 'number' &&
  (values.metrics || []).some((item) => item?.type);

const hasBehaviorContent = (values: CreateHorizontalPodAutoscalerFormValues) =>
  values.enableScaleUpBehavior ||
  values.enableScaleDownBehavior ||
  hasKeyValueContent(values.labels) ||
  hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateHorizontalPodAutoscalerFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && values.targetKind && values.targetName) {
    return '已设置';
  }
  if (index === 2 && hasMetricsContent(values)) {
    return '已设置';
  }
  if (index === 3 && hasBehaviorContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const buildYaml = (values: CreateHorizontalPodAutoscalerFormValues) =>
  toYaml(buildCreateHpaManifest(values));

const CreateHorizontalPodAutoscalerForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateHorizontalPodAutoscalerFormValues>();
  const [initialValues] = useState(() => getInitialCreateHpaValues(namespace));
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  const [submission, setSubmission] = useState<{
    namespace?: string;
    yaml: string;
  }>();
  const { namespaces } = useNamespaceOptions(clusterId);
  const values: CreateHorizontalPodAutoscalerFormValues =
    Form.useWatch([], { form, preserve: true }) || initialValues;
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '伸缩目标',
        icon: <DeploymentUnitOutlined />,
      },
      {
        title: '伸缩指标',
        icon: <LineChartOutlined />,
      },
      {
        title: '行为策略',
        icon: <SlidersOutlined />,
      },
    ],
    [],
  );

  // 只挂载当前步骤的字段：取值一律读完整的表单存储，而不是 validateFields 的返回值
  const getFormValues = (): CreateHorizontalPodAutoscalerFormValues => ({
    ...initialValues,
    ...form.getFieldsValue(true),
  });

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildYaml(getFormValues()));
    }
    setYamlMode(checked);
  };

  const validateStep = async (step: number) => {
    try {
      await form.validateFields(getHpaStepFields(step), { recursive: true });
      return true;
    } catch {
      // 校验错误已由表单项展示
      return false;
    }
  };

  const handleNext = async () => {
    if (await validateStep(current)) {
      setCurrent((step) => Math.min(step + 1, steps.length - 1));
    }
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      let resource: Record<string, unknown>;
      try {
        resource = parseObject(yamlValue);
      } catch {
        message.error('YAML 格式不正确，或内容不是有效的资源对象');
        return;
      }

      const metadataRecord = getRecordValue(resource.metadata);
      const name =
        typeof metadataRecord?.name === 'string' ? metadataRecord.name : '';
      const namespaceValue =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace
          : '';

      if (!name || !namespaceValue) {
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }
      if (resource.kind !== HPA_KIND) {
        message.error(`YAML kind 必须为 ${HPA_KIND}`);
        return;
      }
      if (resource.apiVersion !== HPA_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${HPA_API_VERSION}`);
        return;
      }

      setSubmission({ namespace: namespaceValue, yaml: yamlValue });
      return;
    }

    if (!(await validateStep(current))) {
      return;
    }
    const formValues = getFormValues();
    const error = getHpaFormError(formValues);
    if (error) {
      message.error(error);
      return;
    }
    setSubmission({
      namespace: formValues.namespace,
      yaml: buildYaml(formValues),
    });
  };

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
          <Input autoFocus placeholder="请输入名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="命名空间"
          name="namespace"
          rules={[
            { required: true, message: '请选择命名空间' },
            { pattern: NAME_PATTERN, message: '命名空间名称不合法' },
          ]}
        >
          <AutoComplete
            options={namespaces.map((item) => ({ label: item, value: item }))}
            placeholder="请选择命名空间"
            showSearch={{
              filterOption: (input, option) =>
                String(option?.value ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase()),
            }}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <TargetSettings clusterId={clusterId} form={form} />,
    () => <MetricSettings form={form} />,
    () => <BehaviorSettings form={form} />,
  ][current];

  return (
    <>
      <ResourceCreateWizardDrawer
        current={current}
        getStepDescription={(_, index) =>
          getStepStatusText(current, index, values)
        }
        open
        steps={steps}
        title="创建水平伸缩"
        yamlMode={yamlMode}
        yamlValue={yamlValue}
        onCancel={onClose}
        onNext={handleNext}
        onPrev={() => setCurrent((step) => step - 1)}
        onStepChange={async (nextStep) => {
          if (nextStep <= current) {
            setCurrent(nextStep);
            return;
          }
          if (nextStep > current + 1) {
            return;
          }
          if (await validateStep(current)) {
            setCurrent(nextStep);
          }
        }}
        onSubmit={handleSubmit}
        onYamlChange={setYamlValue}
        onYamlModeChange={handleYamlModeChange}
      >
        <Form
          form={form}
          initialValues={initialValues}
          layout="vertical"
          requiredMark
        >
          {stepContent()}
        </Form>
      </ResourceCreateWizardDrawer>
      {submission && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={submission.yaml}
          namespace={submission.namespace}
          title="创建水平伸缩"
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateHorizontalPodAutoscalerForm;
