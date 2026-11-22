import {
  AimOutlined,
  AppstoreOutlined,
  LoginOutlined,
  LogoutOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { useMemo, useState } from 'react';
import { type Translate, useT } from '@/utils/i18n';
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

const buildYaml = (values: CreateNetworkPolicyFormValues) =>
  toYaml(buildCreateNetworkPolicyManifest(values));

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateNetworkPolicyFormValues,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && values.name && values.namespace) {
    return t('pages.k8s.forms.common.set');
  }
  if (
    index === 1 &&
    (hasSelectorContent(values.podSelector) || values.policyTypes?.length)
  ) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && values.policyTypes?.includes('Ingress')) {
    // 选了方向却没有规则 = 拒绝该方向的全部流量
    return hasRulesContent(values.ingress)
      ? t('pages.k8s.forms.common.set')
      : t('pages.k8s.forms.networkpolicy.denyAll');
  }
  if (index === 3 && values.policyTypes?.includes('Egress')) {
    return hasRulesContent(values.egress)
      ? t('pages.k8s.forms.common.set')
      : t('pages.k8s.forms.networkpolicy.denyAll');
  }
  if (index === 4 && hasMetadataContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const CreateNetworkPolicyForm = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateNetworkPolicyFormValues>();
  const title = t('pages.k8s.forms.networkpolicy.title');
  const steps = useMemo<ResourceCreateWizardStep[]>(
    () => [
      {
        title: t('pages.k8s.form.section.basic'),
        icon: <AppstoreOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.podSelector'),
        icon: <AimOutlined />,
      },
      {
        title: t('pages.k8s.forms.networkpolicy.ingress'),
        icon: <LoginOutlined />,
      },
      {
        title: t('pages.k8s.forms.networkpolicy.egress'),
        icon: <LogoutOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.advanced'),
        icon: <SlidersOutlined />,
      },
    ],
    [t],
  );
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
    const warning = validateNetworkPolicyStep(
      form.getFieldsValue(true),
      step,
      t,
    );

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
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      let resource: Record<string, unknown>;
      try {
        resource = parseObject(yamlValue);
      } catch {
        message.error(t('pages.k8s.forms.common.yaml.invalid'));
        return;
      }

      // 本地预检只拦明显的错误；最终以服务端预检为准
      const validationError = getNetworkPolicyYamlValidationError(resource, t);
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
    const warning = validateNetworkPolicyFormValues(formValues, t);
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
            autoFocus
            placeholder={t('pages.k8s.forms.common.name.required')}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label={t('pages.k8s.forms.common.namespace')}
          name="namespace"
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.common.namespace.required'),
            },
          ]}
        >
          <Select
            loading={namespacesLoading}
            options={namespaceOptions}
            placeholder={t('pages.k8s.forms.common.namespace.required')}
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
          getStepStatusText(current, index, values, t)
        }
        open
        steps={steps}
        title={title}
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
          title={title}
          onBack={() => setManifest(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateNetworkPolicyForm;
