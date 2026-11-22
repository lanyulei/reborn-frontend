import {
  ApiOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
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
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
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
    return t('pages.k8s.forms.endpointslice.status.endpointCount', {
      count: endpointCount,
    });
  }
  const portCount = getPortContentCount(values);
  if (index === 2 && portCount > 0) {
    return t('pages.k8s.forms.endpointslice.status.portCount', {
      count: portCount,
    });
  }
  const metadataCount = getMetadataContentCount(values);
  if (index === 3 && metadataCount > 0) {
    return t('pages.k8s.forms.endpointslice.status.metadataCount', {
      count: metadataCount,
    });
  }
  return t('pages.k8s.forms.common.unset');
};

const CreateEndpointSliceForm = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateEndpointSliceFormValues>();
  const title = t('pages.k8s.forms.endpointslice.title');
  const steps = useMemo<ResourceCreateWizardStep[]>(
    () => [
      {
        title: t('pages.k8s.form.section.basic'),
        icon: <AppstoreOutlined />,
      },
      {
        title: t('pages.k8s.forms.endpointslice.step.endpoints'),
        icon: <ClusterOutlined />,
      },
      {
        title: t('pages.k8s.forms.endpointslice.step.ports'),
        icon: <ApiOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.advanced'),
        icon: <SlidersOutlined />,
      },
    ],
    [t],
  );
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
    const warning = validateEndpointSliceStep(
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
      const validationError = getEndpointSliceYamlValidationError(resource, t);
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
    const warning = validateEndpointSliceFormValues(formValues, t);
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
          tooltip={t('pages.k8s.forms.common.name.dnsLabel')}
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
      <Col md={12} xs={24}>
        <Form.Item
          tooltip={t('pages.k8s.forms.endpointslice.namespace.tooltip')}
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
      <Col md={12} xs={24}>
        <Form.Item
          tooltip={t('pages.k8s.forms.endpointslice.serviceName.tooltip')}
          label={t('pages.k8s.forms.endpointslice.serviceName')}
          name="serviceName"
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('pages.k8s.forms.endpointslice.serviceName.required'),
            },
            {
              max: 63,
              message: t('pages.k8s.forms.endpointslice.serviceName.maxLength'),
            },
            {
              pattern: NAME_PATTERN,
              message: t('pages.k8s.forms.endpointslice.serviceName.pattern'),
            },
          ]}
        >
          <CreatableSelect
            names={serviceNames}
            placeholder={t(
              'pages.k8s.forms.endpointslice.serviceName.placeholder',
            )}
          />
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <Form.Item
          tooltip={t('pages.k8s.forms.endpointslice.addressType.tooltip')}
          label={t('pages.k8s.forms.endpointslice.addressType')}
          name="addressType"
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.endpointslice.addressType.required'),
            },
          ]}
        >
          <Select
            options={ADDRESS_TYPE_OPTIONS}
            placeholder={t(
              'pages.k8s.forms.endpointslice.addressType.required',
            )}
          />
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

export default CreateEndpointSliceForm;
