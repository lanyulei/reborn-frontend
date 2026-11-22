import {
  AppstoreOutlined,
  GlobalOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, AutoComplete, Col, Form, Input, Row } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Translate, useT } from '@/utils/i18n';
import {
  fetchObject,
  GVRS,
  listNames,
  parseObject,
  toYaml,
  useNamespaceOptions,
} from '../shared/kube';
import { getRecordValue, hasKeyValueContent } from '../shared/manifest';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  buildCreateIngressManifest,
  getIngressFormError,
  getInitialCreateIngressValues,
  getServicePortOptions,
  INGRESS_API_VERSION,
  INGRESS_KIND,
  isValidIngressRule,
  NAME_PATTERN,
} from './helpers';
import IngressAdvancedSettings from './IngressAdvancedSettings';
import IngressRuleSettings from './IngressRuleSettings';
import type { CreateIngressFormValues, IngressServiceOption } from './types';

const STEP_FIELDS = [
  ['name', 'namespace'],
  [
    'rules',
    'ingressClassName',
    'tlsSecretName',
    'enablePathRewrite',
    'rewriteTarget',
  ],
  ['annotations', 'labels'],
];

const hasRouteRuleContent = (values: CreateIngressFormValues) =>
  (values.rules || []).some(isValidIngressRule) || values.enablePathRewrite;

const hasAdvancedSettingsContent = (values: CreateIngressFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateIngressFormValues,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && values.name && values.namespace) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasRouteRuleContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && hasAdvancedSettingsContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const buildYaml = (values: CreateIngressFormValues) =>
  toYaml(buildCreateIngressManifest(values));

const CreateIngressForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateIngressFormValues>();
  const [initialValues] = useState(() =>
    getInitialCreateIngressValues(namespace),
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  const [submission, setSubmission] = useState<{
    namespace?: string;
    yaml: string;
  }>();
  const [serviceOptions, setServiceOptions] = useState<IngressServiceOption[]>(
    [],
  );
  const [ingressClassNames, setIngressClassNames] = useState<string[]>([]);
  const [tlsSecretNames, setTlsSecretNames] = useState<string[]>([]);
  const { namespaces } = useNamespaceOptions(clusterId);
  const values: CreateIngressFormValues =
    Form.useWatch([], { form, preserve: true }) || initialValues;
  // 候选项在离开「基本信息」后才读取：命名空间可以手输，避免逐字符请求
  const selectedNamespace =
    current > 0 ? values.namespace?.trim() || undefined : undefined;
  const namespaceRef = useRef(selectedNamespace);
  const loadedServicePorts = useRef(new Set<string>());
  const steps = useMemo(
    () => [
      {
        title: t('pages.k8s.form.section.basic'),
        icon: <AppstoreOutlined />,
      },
      {
        title: t('pages.k8s.forms.ingress.rules'),
        icon: <GlobalOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.advanced'),
        icon: <SlidersOutlined />,
      },
    ],
    [t],
  );

  useEffect(() => {
    let active = true;
    listNames(clusterId, GVRS.ingressClass).then((names) => {
      if (active) {
        setIngressClassNames(names);
      }
    });
    return () => {
      active = false;
    };
  }, [clusterId]);

  // 服务与 TLS Secret 的候选随命名空间变化
  useEffect(() => {
    let active = true;
    namespaceRef.current = selectedNamespace;
    loadedServicePorts.current = new Set();
    setServiceOptions([]);
    setTlsSecretNames([]);
    if (!selectedNamespace) {
      return;
    }

    Promise.all([
      listNames(clusterId, GVRS.service, selectedNamespace),
      listNames(clusterId, GVRS.secret, selectedNamespace),
    ]).then(([services, secrets]) => {
      if (!active) {
        return;
      }
      // 端口可能已先一步读到（手输服务名）：合并而不是覆盖
      setServiceOptions((previous) => {
        const known = new Map(previous.map((item) => [item.value, item]));
        const names = Array.from(new Set([...services, ...known.keys()]));
        return names.map(
          (name) => known.get(name) || { label: name, value: name },
        );
      });
      setTlsSecretNames(secrets);
    });
    return () => {
      active = false;
    };
  }, [clusterId, selectedNamespace]);

  // 列表行不含对象内容：选中服务后再读取它的端口
  const loadServicePorts = useCallback(
    (serviceName: string) => {
      const targetNamespace = namespaceRef.current;
      if (!targetNamespace || loadedServicePorts.current.has(serviceName)) {
        return;
      }

      loadedServicePorts.current.add(serviceName);
      fetchObject(clusterId, GVRS.service, serviceName, targetNamespace).then(
        (service) => {
          if (namespaceRef.current !== targetNamespace) {
            return;
          }
          if (!service) {
            loadedServicePorts.current.delete(serviceName);
            return;
          }
          const ports = getServicePortOptions(service);
          setServiceOptions((previous) =>
            previous.some((item) => item.value === serviceName)
              ? previous.map((item) =>
                  item.value === serviceName ? { ...item, ports } : item,
                )
              : [
                  ...previous,
                  { label: serviceName, ports, value: serviceName },
                ],
          );
        },
      );
    },
    [clusterId],
  );

  // 只挂载当前步骤的字段：取值一律读完整的表单存储，而不是 validateFields 的返回值
  const getFormValues = (): CreateIngressFormValues => ({
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
      await form.validateFields(STEP_FIELDS[step], { recursive: true });
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
      if (resource.kind !== INGRESS_KIND) {
        message.error(
          t('pages.k8s.forms.common.yaml.kindMismatch', { kind: INGRESS_KIND }),
        );
        return;
      }
      if (resource.apiVersion !== INGRESS_API_VERSION) {
        message.error(
          t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
            apiVersion: INGRESS_API_VERSION,
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
    const error = getIngressFormError(formValues, t);
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
              message: t('pages.k8s.roleScope.rule.namespace'),
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
    () => (
      <IngressRuleSettings
        form={form}
        ingressClassNames={ingressClassNames}
        serviceOptions={serviceOptions}
        tlsSecretNames={tlsSecretNames}
        onServiceSelect={loadServicePorts}
      />
    ),
    () => <IngressAdvancedSettings />,
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
        title={t('pages.k8s.forms.ingress.title')}
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
          title={t('pages.k8s.forms.ingress.title')}
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateIngressForm;
