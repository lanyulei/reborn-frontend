import {
  AppstoreOutlined,
  KeyOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo, useState } from 'react';
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
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasSecretDataSettingsContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasMetadataContent(values)) {
    return '已设置';
  }

  return '未设置';
};

const CreateSecretDrawer = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { styles } = useStyles();
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
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '数据设置',
        icon: <KeyOutlined />,
      },
      {
        title: '高级设置',
        icon: <SlidersOutlined />,
      },
    ],
    [],
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
        validateSecretMetadataItems(form.getFieldValue('labels'), '标签') ||
        validateSecretMetadataItems(form.getFieldValue('annotations'), '注解');

      if (error) {
        message.warning(error);
        return false;
      }
    }
    if (current === 1 && secretType === 'Opaque') {
      const error = validateSecretDataItems(form.getFieldValue('dataItems'));

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
        message.error('YAML 格式不正确或不是有效的资源对象，请检查后重试');
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
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }
      if (kind !== SECRET_KIND) {
        message.error(`YAML kind 必须为 ${SECRET_KIND}`);
        return;
      }
      if (apiVersion !== SECRET_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${SECRET_API_VERSION}`);
        return;
      }

      setPending({ yaml: yamlValue, namespace });
      return;
    }

    // 只有当前步骤的表单项处于挂载状态：先校验它们，再对全量值整体检查一遍
    await form.validateFields();
    const formValues: CreateSecretFormValues = form.getFieldsValue(true);
    const error = getSecretFormError(formValues);

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
            tooltip="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
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
            <Input placeholder="请输入名称" autoFocus />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            tooltip="选择将要创建资源的命名空间"
            label="命名空间"
            name="namespace"
            rules={[{ required: true, message: '请选择命名空间' }]}
          >
            <Select
              loading={namespacesLoading}
              options={namespaceOptions}
              showSearch={{
                optionFilterProp: 'label',
                onSearch: setNamespaceSearch,
              }}
              placeholder="请选择命名空间"
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
          getStepStatusText(current, index, values)
        }
        open
        steps={steps}
        title="创建保密字典"
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
          title="创建保密字典"
          onBack={() => setPending(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateSecretDrawer;
