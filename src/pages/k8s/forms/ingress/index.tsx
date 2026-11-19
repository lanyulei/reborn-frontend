import {
  AppstoreOutlined,
  GlobalOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, AutoComplete, Col, Form, Input, Row } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasRouteRuleContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasAdvancedSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const buildYaml = (values: CreateIngressFormValues) =>
  toYaml(buildCreateIngressManifest(values));

const CreateIngressForm = ({
  clusterId,
  namespace,
  onClose,
  onDone,
}: CreateFormProps) => {
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
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '路由规则',
        icon: <GlobalOutlined />,
      },
      {
        title: '高级设置',
        icon: <SlidersOutlined />,
      },
    ],
    [],
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
      if (resource.kind !== INGRESS_KIND) {
        message.error(`YAML kind 必须为 ${INGRESS_KIND}`);
        return;
      }
      if (resource.apiVersion !== INGRESS_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${INGRESS_API_VERSION}`);
        return;
      }

      setSubmission({ namespace: namespaceValue, yaml: yamlValue });
      return;
    }

    if (!(await validateStep(current))) {
      return;
    }
    const formValues = getFormValues();
    const error = getIngressFormError(formValues);
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
          getStepStatusText(current, index, values)
        }
        open
        steps={steps}
        title="创建应用路由"
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
          title="创建应用路由"
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateIngressForm;
