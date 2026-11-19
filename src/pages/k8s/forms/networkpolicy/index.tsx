import {
  AimOutlined,
  AppstoreOutlined,
  LoginOutlined,
  LogoutOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { useMemo, useState } from 'react';
import { parseObject, toYaml, useNamespaceOptions } from '../shared/kube';
import type { ResourceCreateWizardStep } from '../shared/ResourceCreateWizardDrawer';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  buildCreateNetworkPolicyManifest,
  getInitialCreateNetworkPolicyValues,
  getManifestNamespace,
  getNetworkPolicyStepFields,
  getNetworkPolicyYamlValidationError,
  hasMetadataContent,
  hasRulesContent,
  hasSelectorContent,
  NAME_PATTERN,
  validateNetworkPolicyFormValues,
  validateNetworkPolicyStep,
} from './helpers';
import NetworkPolicyAdvancedSettings from './NetworkPolicyAdvancedSettings';
import NetworkPolicyRuleSettings from './NetworkPolicyRuleSettings';
import NetworkPolicySelectorSettings from './NetworkPolicySelectorSettings';
import type { CreateNetworkPolicyFormValues } from './types';

const TITLE = '创建网络策略';

const STEPS: ResourceCreateWizardStep[] = [
  {
    title: '基本信息',
    icon: <AppstoreOutlined />,
  },
  {
    title: 'Pod 选择器',
    icon: <AimOutlined />,
  },
  {
    title: '入站规则',
    icon: <LoginOutlined />,
  },
  {
    title: '出站规则',
    icon: <LogoutOutlined />,
  },
  {
    title: '高级设置',
    icon: <SlidersOutlined />,
  },
];

const buildYaml = (values: CreateNetworkPolicyFormValues) =>
  toYaml(buildCreateNetworkPolicyManifest(values));

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateNetworkPolicyFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (
    index === 1 &&
    (hasSelectorContent(values.podSelector) || values.policyTypes?.length)
  ) {
    return '已设置';
  }
  if (index === 2 && values.policyTypes?.includes('Ingress')) {
    // 选了方向却没有规则 = 拒绝该方向的全部流量
    return hasRulesContent(values.ingress) ? '已设置' : '全部拒绝';
  }
  if (index === 3 && values.policyTypes?.includes('Egress')) {
    return hasRulesContent(values.egress) ? '已设置' : '全部拒绝';
  }
  if (index === 4 && hasMetadataContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const CreateNetworkPolicyForm = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateNetworkPolicyFormValues>();
  const [initialValues] = useState(() =>
    getInitialCreateNetworkPolicyValues(defaultNamespace || undefined),
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  // 待预检 / 提交的清单；有值时打开清单弹窗
  const [manifest, setManifest] = useState<{
    namespace?: string;
    yaml: string;
  }>();
  const values: CreateNetworkPolicyFormValues =
    Form.useWatch([], { form, preserve: true }) || {};
  const { namespaces, loading: namespacesLoading } =
    useNamespaceOptions(clusterId);
  const namespaceOptions = useMemo(
    () => namespaces.map((item) => ({ label: item, value: item })),
    [namespaces],
  );

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildYaml(form.getFieldsValue(true)));
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async (step: number) => {
    try {
      await form.validateFields(getNetworkPolicyStepFields(step));
    } catch {
      // 表单项就地显示校验错误
      return false;
    }
    const warning = validateNetworkPolicyStep(form.getFieldsValue(true), step);

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
      const validationError = getNetworkPolicyYamlValidationError(resource);
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
    const formValues: CreateNetworkPolicyFormValues = form.getFieldsValue(true);
    const warning = validateNetworkPolicyFormValues(formValues);
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
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <NetworkPolicySelectorSettings />,
    () => <NetworkPolicyRuleSettings direction="ingress" form={form} />,
    () => <NetworkPolicyRuleSettings direction="egress" form={form} />,
    () => <NetworkPolicyAdvancedSettings />,
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

export default CreateNetworkPolicyForm;
