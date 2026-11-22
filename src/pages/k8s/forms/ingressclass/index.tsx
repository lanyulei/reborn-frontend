import {
  AppstoreOutlined,
  LinkOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { useMemo, useState } from 'react';
import { type Translate, useT } from '@/utils/i18n';
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
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasParameterContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && hasMetadataContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

/** Ingress 类是集群级资源：忽略作用域里的命名空间 */
const CreateIngressClassForm = ({
  clusterId,
  onClose,
  onDone,
}: CreateFormProps) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateIngressClassFormValues>();
  const title = t('pages.k8s.forms.ingressclass.title');
  const steps = useMemo<ResourceCreateWizardStep[]>(
    () => [
      {
        title: t('pages.k8s.form.section.basic'),
        icon: <AppstoreOutlined />,
      },
      {
        title: t('pages.k8s.forms.ingressclass.parameters'),
        icon: <LinkOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.advanced'),
        icon: <SlidersOutlined />,
      },
    ],
    [t],
  );
  const defaultClassOptions = [
    { label: t('pages.k8s.forms.common.yes'), value: 'true' },
    { label: t('pages.k8s.forms.common.no'), value: 'false' },
  ];
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
    const warning = validateIngressClassStep(
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

      const validationError = getIngressClassYamlValidationError(resource, t);
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
    const warning = validateIngressClassFormValues(formValues, t);
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
          extra={t('pages.k8s.forms.common.name.dnsLabel')}
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
          extra={t('pages.k8s.forms.ingressclass.controller.extra')}
          label={t('pages.k8s.forms.ingressclass.controller')}
          name="controller"
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('pages.k8s.forms.ingressclass.controller.required'),
            },
            {
              max: 250,
              message: t('pages.k8s.forms.ingressclass.controller.maxLength'),
            },
          ]}
        >
          <Input
            placeholder={t('pages.k8s.forms.ingressclass.controller.required')}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra={t('pages.k8s.forms.ingressclass.isDefault.extra')}
          label={t('pages.k8s.forms.ingressclass.isDefault')}
          name="isDefaultClass"
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.ingressclass.isDefault.required'),
            },
          ]}
        >
          <Select
            options={defaultClassOptions}
            placeholder={t('pages.k8s.forms.common.select')}
          />
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
      {manifestYaml !== undefined && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={manifestYaml}
          title={title}
          onBack={() => setManifestYaml(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateIngressClassForm;
