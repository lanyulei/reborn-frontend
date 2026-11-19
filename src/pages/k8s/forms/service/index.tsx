import {
  AppstoreOutlined,
  DeploymentUnitOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, AutoComplete, Col, Form, Input, Row } from 'antd';
import { useMemo, useState } from 'react';
import { parseObject, toYaml, useNamespaceOptions } from '../shared/kube';
import { getRecordValue, hasKeyValueContent } from '../shared/manifest';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  buildCreateServiceManifest,
  getInitialCreateServiceValues,
  getServiceFormError,
  NAME_PATTERN,
  SERVICE_API_VERSION,
  SERVICE_KIND,
} from './helpers';
import ServiceAdvancedSettings from './ServiceAdvancedSettings';
import ServiceSettings from './ServiceSettings';
import type { CreateServiceFormValues } from './types';

const STEP_FIELDS = [
  ['name', 'namespace'],
  ['internalAccessMode', 'selectors', 'ports'],
  [
    'enableExternalAccess',
    'externalAccessMode',
    'ports',
    'enableSessionAffinity',
    'sessionAffinityTimeoutSeconds',
    'loadBalancerClass',
    'allocateLoadBalancerNodePorts',
    'externalTrafficPolicy',
    'internalTrafficPolicy',
    'ipFamilyPolicy',
    'ipFamilies',
    'trafficDistribution',
    'labels',
    'annotations',
  ],
];

const hasServiceSettingsContent = (values: CreateServiceFormValues) =>
  values.internalAccessMode === 'Headless' ||
  hasKeyValueContent(values.selectors) ||
  (values.ports || []).some((item) => item?.servicePort);

const hasAdvancedSettingsContent = (values: CreateServiceFormValues) =>
  values.enableExternalAccess ||
  values.enableSessionAffinity ||
  values.ipFamilyPolicy ||
  values.ipFamilies?.length ||
  values.internalTrafficPolicy ||
  values.trafficDistribution ||
  hasKeyValueContent(values.labels) ||
  hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateServiceFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasServiceSettingsContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasAdvancedSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const buildYaml = (values: CreateServiceFormValues) =>
  toYaml(buildCreateServiceManifest(values));

const CreateServiceForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateServiceFormValues>();
  const [initialValues] = useState(() =>
    getInitialCreateServiceValues(namespace),
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  const [submission, setSubmission] = useState<{
    namespace?: string;
    yaml: string;
  }>();
  const { namespaces } = useNamespaceOptions(clusterId);
  const values: CreateServiceFormValues =
    Form.useWatch([], { form, preserve: true }) || initialValues;
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '服务设置',
        icon: <DeploymentUnitOutlined />,
      },
      {
        title: '高级设置',
        icon: <SlidersOutlined />,
      },
    ],
    [],
  );

  // 只挂载当前步骤的字段：取值一律读完整的表单存储，而不是 validateFields 的返回值
  const getFormValues = (): CreateServiceFormValues => ({
    ...initialValues,
    ...form.getFieldsValue(true),
  });

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildYaml(getFormValues()));
    }
    setYamlMode(checked);
  };

  const validateHeadlessExternalAccess = (
    formValues: CreateServiceFormValues,
  ) => {
    if (
      formValues.internalAccessMode === 'Headless' &&
      formValues.enableExternalAccess
    ) {
      message.warning('内部域名模式不支持同时开启外部访问');
      return false;
    }
    return true;
  };

  const validateStep = async (step: number) => {
    try {
      await form.validateFields(STEP_FIELDS[step], { recursive: true });
      return true;
    } catch {
      // 校验错误已由表单项展示
      return false;
    }
  };

  const handleNext = async () => {
    if (!(await validateStep(current))) {
      return;
    }
    if (current === 2 && !validateHeadlessExternalAccess(getFormValues())) {
      return;
    }
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
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
      if (resource.kind !== SERVICE_KIND) {
        message.error(`YAML kind 必须为 ${SERVICE_KIND}`);
        return;
      }
      if (resource.apiVersion !== SERVICE_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${SERVICE_API_VERSION}`);
        return;
      }

      setSubmission({ namespace: namespaceValue, yaml: yamlValue });
      return;
    }

    if (!(await validateStep(current))) {
      return;
    }
    const formValues = getFormValues();
    if (!validateHeadlessExternalAccess(formValues)) {
      return;
    }
    const error = getServiceFormError(formValues);
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
    () => <ServiceSettings clusterId={clusterId} form={form} />,
    () => <ServiceAdvancedSettings form={form} />,
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
        title="创建服务"
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
          title="创建服务"
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateServiceForm;
