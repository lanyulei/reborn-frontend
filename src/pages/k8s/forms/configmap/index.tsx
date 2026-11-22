import {
  AppstoreOutlined,
  DatabaseOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo, useState } from 'react';
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
import { parseObject, toYaml, useNamespaceOptions } from '../shared/kube';
import { getRecordValue } from '../shared/manifest';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import ConfigMapAdvancedSettings from './ConfigMapAdvancedSettings';
import ConfigMapDataSettings from './ConfigMapDataSettings';
import {
  buildCreateConfigMapManifest,
  CONFIG_MAP_API_VERSION,
  CONFIG_MAP_KIND,
  CONFIG_MAP_NAME_PATTERN,
  getConfigMapFormError,
  getConfigMapStepFields,
  getInitialCreateConfigMapValues,
  hasConfigMapDataContent,
  validateConfigMapDataItems,
  validateConfigMapMetadataItems,
} from './helpers';
import type { CreateConfigMapFormValues } from './types';

const useStyles = createStyles(() => ({
  basicFields: {
    width: '100%',
  },
}));

const buildCreateConfigMapYaml = (values: CreateConfigMapFormValues) =>
  toYaml(buildCreateConfigMapManifest(values));

const hasMetadataContent = (values: {
  labels?: { keyName?: string }[];
  annotations?: { keyName?: string }[];
}) =>
  [...(values.labels || []), ...(values.annotations || [])].some((item) =>
    item?.keyName?.trim(),
  );

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateConfigMapFormValues,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && values.name && values.namespace) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasConfigMapDataContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && hasMetadataContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

/** YAML 模式下 data 的形态检查；返回错误文案 */
const getYamlDataError = (data: unknown, t: Translate) => {
  if (data === undefined || data === null) {
    return undefined;
  }

  const dataRecord = getRecordValue(data);
  if (!dataRecord) {
    return t('pages.k8s.forms.configmap.yaml.dataNotObject');
  }
  if (Object.values(dataRecord).some((value) => typeof value !== 'string')) {
    return t('pages.k8s.forms.configmap.yaml.dataValueNotString');
  }

  return undefined;
};

const CreateConfigMapDrawer = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateConfigMapFormValues>();
  const initialValues = useMemo(
    () => getInitialCreateConfigMapValues(defaultNamespace || undefined),
    [defaultNamespace],
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() =>
    buildCreateConfigMapYaml(initialValues),
  );
  // 待提交的清单：有值时在向导之上打开清单弹窗（预检 → 提交）
  const [pending, setPending] = useState<{ yaml: string; namespace: string }>();
  const [namespaceSearch, setNamespaceSearch] = useState('');
  const { namespaces, loading: namespacesLoading } =
    useNamespaceOptions(clusterId);
  const values: CreateConfigMapFormValues =
    Form.useWatch([], { form, preserve: true }) || {};
  const namespaceOptions = useMemo(() => {
    // 候选项取不到（无权限列出命名空间等）时允许手输；预选的命名空间始终可选
    const names = new Set(namespaces);
    if (defaultNamespace) {
      names.add(defaultNamespace);
    }
    if (namespaces.length === 0 && namespaceSearch.trim()) {
      names.add(namespaceSearch.trim());
    }
    return [...names].map((name) => ({ label: name, value: name }));
  }, [defaultNamespace, namespaceSearch, namespaces]);
  const steps = useMemo(
    () => [
      {
        title: t('pages.k8s.form.section.basic'),
        icon: <AppstoreOutlined />,
      },
      {
        title: t('pages.k8s.forms.secret.dataSettings'),
        icon: <DatabaseOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.advanced'),
        icon: <SlidersOutlined />,
      },
    ],
    [t],
  );

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildCreateConfigMapYaml(form.getFieldsValue(true)));
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getConfigMapStepFields(current));

    const error =
      current === 2
        ? validateConfigMapMetadataItems(
            form.getFieldValue('labels'),
            t('pages.k8s.forms.common.labels'),
            t,
          ) ||
          validateConfigMapMetadataItems(
            form.getFieldValue('annotations'),
            t('pages.k8s.forms.common.annotations'),
            t,
          )
        : current === 1
          ? validateConfigMapDataItems(form.getFieldValue('dataItems'), t)
          : undefined;
    if (error) {
      message.warning(error);
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();

    if (!valid) {
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

      const metadataRecord = getRecordValue(resource.metadata);
      const name =
        typeof metadataRecord?.name === 'string'
          ? metadataRecord.name.trim()
          : '';
      const namespace =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace.trim()
          : '';
      const kind = typeof resource.kind === 'string' ? resource.kind : '';
      const apiVersion =
        typeof resource.apiVersion === 'string' ? resource.apiVersion : '';

      if (!name || !namespace) {
        message.error(t('pages.k8s.forms.common.yaml.nameNamespaceRequired'));
        return;
      }
      if (kind !== CONFIG_MAP_KIND) {
        message.error(
          t('pages.k8s.forms.common.yaml.kindMismatch', {
            kind: CONFIG_MAP_KIND,
          }),
        );
        return;
      }
      if (apiVersion !== CONFIG_MAP_API_VERSION) {
        message.error(
          t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
            apiVersion: CONFIG_MAP_API_VERSION,
          }),
        );
        return;
      }

      const dataError = getYamlDataError(resource.data, t);
      if (dataError) {
        message.error(dataError);
        return;
      }

      setPending({ yaml: yamlValue, namespace });
      return;
    }

    // 只有当前步骤的表单项处于挂载状态：先校验它们，再对全量值整体检查一遍
    await form.validateFields();
    const formValues: CreateConfigMapFormValues = form.getFieldsValue(true);
    const error = getConfigMapFormError(formValues, t);

    if (error) {
      message.warning(error);
      return;
    }

    setPending({
      yaml: buildCreateConfigMapYaml(formValues),
      namespace: formValues.namespace?.trim() || '',
    });
  };

  const renderBasicInfo = () => (
    <div className={styles.basicFields}>
      <Row gutter={16}>
        <Col span={12}>
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
                pattern: CONFIG_MAP_NAME_PATTERN,
                message: t('pages.k8s.forms.common.name.pattern'),
              },
            ]}
          >
            <Input
              placeholder={t('pages.k8s.forms.common.name.required')}
              autoFocus
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            tooltip={t('pages.k8s.forms.common.namespace.placeholder')}
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
              showSearch={{
                optionFilterProp: 'label',
                onSearch: setNamespaceSearch,
              }}
              placeholder={t('pages.k8s.forms.common.namespace.required')}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return renderBasicInfo();
      case 1:
        return <ConfigMapDataSettings />;
      case 2:
        return <ConfigMapAdvancedSettings />;
      default:
        return null;
    }
  };

  return (
    <>
      <ResourceCreateWizardDrawer
        current={current}
        getStepDescription={(_, index) =>
          getStepStatusText(current, index, values, t)
        }
        open
        steps={steps}
        title={t('pages.k8s.forms.configmap.createTitle')}
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

          const valid = await validateCurrentStep();
          if (valid) {
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
          onValuesChange={() => {
            if (!yamlMode) {
              setYamlValue(buildCreateConfigMapYaml(form.getFieldsValue(true)));
            }
          }}
        >
          {renderStepContent()}
        </Form>
      </ResourceCreateWizardDrawer>
      {pending && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={pending.yaml}
          namespace={pending.namespace}
          title={t('pages.k8s.forms.configmap.createTitle')}
          onBack={() => setPending(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateConfigMapDrawer;
