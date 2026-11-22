import {
  AppstoreOutlined,
  KeyOutlined,
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
import {
  buildCreateSecretManifest,
  getInitialCreateSecretValues,
  getSecretFormError,
  getSecretStepFields,
  hasSecretDataSettingsContent,
  NAME_PATTERN,
  SECRET_API_VERSION,
  SECRET_KIND,
  validateSecretDataItems,
  validateSecretMetadataItems,
} from './helpers';
import SecretAdvancedSettings from './SecretAdvancedSettings';
import SecretDataSettings from './SecretDataSettings';
import type { CreateSecretFormValues } from './types';

const useStyles = createStyles(() => ({
  basicFields: {
    width: '100%',
  },
}));

const buildCreateSecretYaml = (values: CreateSecretFormValues) =>
  toYaml(buildCreateSecretManifest(values));

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
  values: Partial<CreateSecretFormValues>,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && values.name && values.namespace) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasSecretDataSettingsContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && hasMetadataContent(values)) {
    return t('pages.k8s.forms.common.set');
  }

  return t('pages.k8s.forms.common.unset');
};

const CreateSecretDrawer = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateSecretFormValues>();
  const initialValues = useMemo(
    () => getInitialCreateSecretValues(defaultNamespace || undefined),
    [defaultNamespace],
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() =>
    buildCreateSecretYaml(initialValues),
  );
  // 待提交的清单：有值时在向导之上打开清单弹窗（预检 → 提交）
  const [pending, setPending] = useState<{ yaml: string; namespace: string }>();
  const [namespaceSearch, setNamespaceSearch] = useState('');
  const { namespaces, loading: namespacesLoading } =
    useNamespaceOptions(clusterId);
  const values: Partial<CreateSecretFormValues> =
    Form.useWatch([], { form, preserve: true }) || {};
  const secretType = values.type || 'Opaque';
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
        icon: <KeyOutlined />,
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
      setYamlValue(buildCreateSecretYaml(form.getFieldsValue(true)));
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getSecretStepFields(current, secretType));
    if (current === 2) {
      const error =
        validateSecretMetadataItems(
          form.getFieldValue('labels'),
          t('pages.k8s.forms.common.labels'),
          t,
        ) ||
        validateSecretMetadataItems(
          form.getFieldValue('annotations'),
          t('pages.k8s.forms.common.annotations'),
          t,
        );

      if (error) {
        message.warning(error);
        return false;
      }
    }
    if (current === 1 && secretType === 'Opaque') {
      const error = validateSecretDataItems(form.getFieldValue('dataItems'), t);

      if (error) {
        form.setFields([{ name: 'dataItems', errors: [error] }]);
        throw new Error(error);
      }
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
        typeof metadataRecord?.name === 'string' ? metadataRecord.name : '';
      const namespace =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace
          : '';
      const kind = typeof resource.kind === 'string' ? resource.kind : '';
      const apiVersion =
        typeof resource.apiVersion === 'string' ? resource.apiVersion : '';

      if (!name || !namespace) {
        message.error(t('pages.k8s.forms.common.yaml.nameNamespaceRequired'));
        return;
      }
      if (kind !== SECRET_KIND) {
        message.error(
          t('pages.k8s.forms.common.yaml.kindMismatch', { kind: SECRET_KIND }),
        );
        return;
      }
      if (apiVersion !== SECRET_API_VERSION) {
        message.error(
          t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
            apiVersion: SECRET_API_VERSION,
          }),
        );
        return;
      }

      setPending({ yaml: yamlValue, namespace });
      return;
    }

    // 只有当前步骤的表单项处于挂载状态：先校验它们，再对全量值整体检查一遍
    await form.validateFields();
    const formValues: CreateSecretFormValues = form.getFieldsValue(true);
    const error = getSecretFormError(formValues, t);

    if (error) {
      message.warning(error);
      return;
    }

    setPending({
      yaml: buildCreateSecretYaml(formValues),
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
                pattern: NAME_PATTERN,
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
    if (current === 0) {
      return renderBasicInfo();
    }
    if (current === 1) {
      return <SecretDataSettings form={form} />;
    }

    return <SecretAdvancedSettings />;
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
        title={t('pages.k8s.forms.secret.createTitle')}
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
              setYamlValue(buildCreateSecretYaml(form.getFieldsValue(true)));
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
          title={t('pages.k8s.forms.secret.createTitle')}
          onBack={() => setPending(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateSecretDrawer;
