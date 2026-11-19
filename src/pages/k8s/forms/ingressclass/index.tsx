import {
  AppstoreOutlined,
  LinkOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { useState } from 'react';
import { parseObject, toYaml } from '../shared/kube';
import type { ResourceCreateWizardStep } from '../shared/ResourceCreateWizardDrawer';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  buildCreateIngressClassManifest,
  getIngressClassStepFields,
  getIngressClassYamlValidationError,
  getInitialCreateIngressClassValues,
  hasKeyValueContent,
  NAME_PATTERN,
  validateIngressClassFormValues,
  validateIngressClassStep,
} from './helpers';
import IngressClassAdvancedSettings from './IngressClassAdvancedSettings';
import IngressClassParameterSettings from './IngressClassParameterSettings';
import type { CreateIngressClassFormValues } from './types';

const TITLE = '创建 Ingress 类';

const STEPS: ResourceCreateWizardStep[] = [
  {
    title: '基本信息',
    icon: <AppstoreOutlined />,
  },
  {
    title: '参数引用',
    icon: <LinkOutlined />,
  },
  {
    title: '高级设置',
    icon: <SlidersOutlined />,
  },
];

const buildYaml = (values: CreateIngressClassFormValues) =>
  toYaml(buildCreateIngressClassManifest(values));

const hasBasicInfoContent = (values: CreateIngressClassFormValues) =>
  Boolean(values.name && values.controller);

const hasParameterContent = (values: CreateIngressClassFormValues) =>
  Boolean(
    values.enableParameters === 'true' &&
      (values.parameterApiGroup ||
        values.parameterKind ||
        values.parameterName ||
        values.parameterNamespace ||
        values.parameterScope),
  );

const hasMetadataContent = (values: CreateIngressClassFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateIngressClassFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return '已设置';
  }
  if (index === 1 && hasParameterContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasMetadataContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const defaultClassOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
];

/** Ingress 类是集群级资源：忽略作用域里的命名空间 */
const CreateIngressClassForm = ({
  clusterId,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateIngressClassFormValues>();
  const [initialValues] = useState(getInitialCreateIngressClassValues);
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  // 待预检 / 提交的清单；有值时打开清单弹窗
  const [manifestYaml, setManifestYaml] = useState<string>();
  const values: CreateIngressClassFormValues =
    Form.useWatch([], { form, preserve: true }) || {};

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildYaml(form.getFieldsValue(true)));
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async (step: number) => {
    try {
      await form.validateFields(getIngressClassStepFields(step));
    } catch {
      // 表单项就地显示校验错误
      return false;
    }
    const warning = validateIngressClassStep(form.getFieldsValue(true), step);

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

      const validationError = getIngressClassYamlValidationError(resource);
      if (validationError) {
        message.error(validationError);
        return;
      }

      setManifestYaml(yamlValue);
      return;
    }

    if (!(await validateCurrentStep(current))) {
      return;
    }
    // 只挂载了当前步骤的表单项：取全量值，而不是 validateFields 的返回值
    const formValues: CreateIngressClassFormValues = form.getFieldsValue(true);
    const warning = validateIngressClassFormValues(formValues);
    if (warning) {
      message.warning(warning);
      return;
    }

    setManifestYaml(buildYaml(formValues));
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          extra="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
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
          extra="通常为域名路径格式，例如 k8s.io/ingress-nginx。"
          label="控制器"
          name="controller"
          rules={[
            { required: true, whitespace: true, message: '请输入控制器' },
            { max: 250, message: '控制器最长 250 个字符' },
          ]}
        >
          <Input placeholder="请输入控制器" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra="设置后会输出 ingressclass.kubernetes.io/is-default-class 注解。"
          label="默认 Ingress 类"
          name="isDefaultClass"
          rules={[{ required: true, message: '请选择是否作为默认类' }]}
        >
          <Select options={defaultClassOptions} placeholder="请选择" />
        </Form.Item>
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <IngressClassParameterSettings />,
    () => <IngressClassAdvancedSettings />,
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
      {manifestYaml !== undefined && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={manifestYaml}
          title={TITLE}
          onBack={() => setManifestYaml(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateIngressClassForm;
