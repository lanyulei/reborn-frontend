import {
  AppstoreOutlined,
  DeploymentUnitOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, AutoComplete, Col, Form, Input, Row } from 'antd';
import { useMemo, useState } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
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
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && values.name && values.namespace) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasServiceSettingsContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && hasAdvancedSettingsContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const buildYaml = (values: CreateServiceFormValues) =>
  toYaml(buildCreateServiceManifest(values));

const CreateServiceForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateServiceFormValues>();
  const title = t('pages.k8s.forms.service.title');
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
        title: t('pages.k8s.form.section.basic'),
        icon: <AppstoreOutlined />,
      },
      {
        title: t('pages.k8s.forms.service.step.settings'),
        icon: <DeploymentUnitOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.advanced'),
        icon: <SlidersOutlined />,
      },
    ],
    [t],
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
      message.warning(
        t('pages.k8s.forms.service.validation.headlessExternalAccess'),
      );
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
        message.error(t('pages.k8s.forms.common.yaml.invalidObject'));
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
        message.error(t('pages.k8s.forms.common.yaml.nameNamespaceRequired'));
        return;
      }
      if (resource.kind !== SERVICE_KIND) {
        message.error(
          t('pages.k8s.forms.common.yaml.kindMismatch', { kind: SERVICE_KIND }),
        );
        return;
      }
      if (resource.apiVersion !== SERVICE_API_VERSION) {
        message.error(
          t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
            apiVersion: SERVICE_API_VERSION,
          }),
        );
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
    const error = getServiceFormError(formValues, t);
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
            {
              pattern: NAME_PATTERN,
              message: t('pages.k8s.forms.service.namespace.invalid'),
            },
          ]}
        >
          <AutoComplete
            options={namespaces.map((item) => ({ label: item, value: item }))}
            placeholder={t('pages.k8s.forms.common.namespace.required')}
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
          title={title}
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateServiceForm;
