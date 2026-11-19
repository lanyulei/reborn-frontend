import {
  ApiOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  GVRS,
  listNames,
  parseObject,
  toYaml,
  useNamespaceOptions,
} from '../shared/kube';
import type { ResourceCreateWizardStep } from '../shared/ResourceCreateWizardDrawer';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import CreatableSelect from './CreatableSelect';
import EndpointSliceAdvancedSettings from './EndpointSliceAdvancedSettings';
import EndpointSliceEndpointSettings from './EndpointSliceEndpointSettings';
import EndpointSlicePortSettings from './EndpointSlicePortSettings';
import {
  buildCreateEndpointSliceManifest,
  getEndpointContentCount,
  getEndpointSliceStepFields,
  getEndpointSliceYamlValidationError,
  getInitialCreateEndpointSliceValues,
  getManifestNamespace,
  getMetadataContentCount,
  getPortContentCount,
  NAME_PATTERN,
  validateEndpointSliceFormValues,
  validateEndpointSliceStep,
} from './helpers';
import type {
  CreateEndpointSliceFormValues,
  EndpointSliceAddressType,
} from './types';

const TITLE = '创建端点切片';

const STEPS: ResourceCreateWizardStep[] = [
  {
    title: '基本信息',
    icon: <AppstoreOutlined />,
  },
  {
    title: '端点设置',
    icon: <ClusterOutlined />,
  },
  {
    title: '端口设置',
    icon: <ApiOutlined />,
  },
  {
    title: '高级设置',
    icon: <SlidersOutlined />,
  },
];

const ADDRESS_TYPE_OPTIONS: {
  label: string;
  value: EndpointSliceAddressType;
}[] = [
  { label: 'IPv4', value: 'IPv4' },
  { label: 'IPv6', value: 'IPv6' },
  { label: 'FQDN', value: 'FQDN' },
];

const buildYaml = (values: CreateEndpointSliceFormValues) =>
  toYaml(buildCreateEndpointSliceManifest(values));

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateEndpointSliceFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (
    index === 0 &&
    values.name &&
    values.namespace &&
    values.serviceName &&
    values.addressType
  ) {
    return values.addressType;
  }
  const endpointCount = getEndpointContentCount(values);
  if (index === 1 && endpointCount > 0) {
    return `${endpointCount} 个端点`;
  }
  const portCount = getPortContentCount(values);
  if (index === 2 && portCount > 0) {
    return `${portCount} 个端口`;
  }
  const metadataCount = getMetadataContentCount(values);
  if (index === 3 && metadataCount > 0) {
    return `${metadataCount} 项元数据`;
  }
  return '未设置';
};

const CreateEndpointSliceForm = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateEndpointSliceFormValues>();
  const [initialValues] = useState(() =>
    getInitialCreateEndpointSliceValues(defaultNamespace || undefined),
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  // 待预检 / 提交的清单；有值时打开清单弹窗
  const [manifest, setManifest] = useState<{
    namespace?: string;
    yaml: string;
  }>();
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [nodeNames, setNodeNames] = useState<string[]>([]);
  const values: CreateEndpointSliceFormValues =
    Form.useWatch([], { form, preserve: true }) || {};
  const selectedNamespace = values.namespace;
  const { namespaces, loading: namespacesLoading } =
    useNamespaceOptions(clusterId);
  const namespaceOptions = useMemo(
    () => namespaces.map((item) => ({ label: item, value: item })),
    [namespaces],
  );

  // 关联服务的候选项：所选命名空间里的 Service
  useEffect(() => {
    let cancelled = false;
    setServiceNames([]);
    if (!selectedNamespace) {
      return;
    }
    listNames(clusterId, GVRS.service, selectedNamespace).then((names) => {
      if (!cancelled) setServiceNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [clusterId, selectedNamespace]);

  useEffect(() => {
    let cancelled = false;
    listNames(clusterId, GVRS.node).then((names) => {
      if (!cancelled) setNodeNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildYaml(form.getFieldsValue(true)));
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async (step: number) => {
    try {
      await form.validateFields(getEndpointSliceStepFields(step), {
        recursive: true,
      });
    } catch {
      // 表单项就地显示校验错误
      return false;
    }
    const warning = validateEndpointSliceStep(form.getFieldsValue(true), step);

    if (warning) {
      message.warning(warning);
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!(await validateCurrentStep(current))) {
      return;
    }
    setCurrent((step) => Math.min(step + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      let resource: Record<string, unknown>;
      try {
        resource = parseObject(yamlValue);
      } catch {
        message.error('YAML 格式不正确或不是有效的资源对象，请检查后重试');
        return;
      }

      // 本地预检只拦明显的错误；最终以服务端预检为准
      const validationError = getEndpointSliceYamlValidationError(resource);
      if (validationError) {
        message.error(validationError);
        return;
      }

      setManifest({
        namespace: getManifestNamespace(resource),
        yaml: yamlValue,
      });
      return;
    }

    if (!(await validateCurrentStep(current))) {
      return;
    }
    // 只挂载了当前步骤的表单项：取全量值，而不是 validateFields 的返回值
    const formValues: CreateEndpointSliceFormValues = form.getFieldsValue(true);
    const warning = validateEndpointSliceFormValues(formValues);
    if (warning) {
      message.warning(warning);
      return;
    }

    setManifest({
      namespace: formValues.namespace,
      yaml: buildYaml(formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col md={12} xs={24}>
        <Form.Item
          tooltip="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符。"
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
      <Col md={12} xs={24}>
        <Form.Item
          tooltip="端点切片是命名空间级资源。"
          label="命名空间"
          name="namespace"
          rules={[{ required: true, message: '请选择命名空间' }]}
        >
          <Select
            loading={namespacesLoading}
            options={namespaceOptions}
            placeholder="请选择命名空间"
            showSearch={{ optionFilterProp: 'label' }}
          />
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <Form.Item
          tooltip="将自动输出 metadata.labels.kubernetes.io/service-name。可从所选命名空间的服务中选择，也可直接输入。"
          label="关联服务"
          name="serviceName"
          rules={[
            {
              required: true,
              whitespace: true,
              message: '请选择或输入关联服务',
            },
            { max: 63, message: '服务名称最长 63 个字符' },
            {
              pattern: NAME_PATTERN,
              message:
                '服务名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
            },
          ]}
        >
          <CreatableSelect
            names={serviceNames}
            placeholder="请选择或输入服务名称"
          />
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <Form.Item
          tooltip="必须与端点地址格式一致。"
          label="地址类型"
          name="addressType"
          rules={[{ required: true, message: '请选择地址类型' }]}
        >
          <Select options={ADDRESS_TYPE_OPTIONS} placeholder="请选择地址类型" />
        </Form.Item>
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <EndpointSliceEndpointSettings form={form} nodeNames={nodeNames} />,
    () => <EndpointSlicePortSettings form={form} />,
    () => <EndpointSliceAdvancedSettings />,
  ][current];

  return (
    <>
      <ResourceCreateWizardDrawer
        current={current}
        getStepDescription={(_, index) =>
          getStepStatusText(current, index, values)
        }
        open
        steps={STEPS}
        title={TITLE}
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
          if (!(await validateCurrentStep(current))) {
            return;
          }
          setCurrent(nextStep);
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
          onValuesChange={() => {
            if (!yamlMode) {
              setYamlValue(buildYaml(form.getFieldsValue(true)));
            }
          }}
        >
          {stepContent()}
        </Form>
      </ResourceCreateWizardDrawer>
      {manifest && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={manifest.yaml}
          namespace={manifest.namespace}
          title={TITLE}
          onBack={() => setManifest(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateEndpointSliceForm;
