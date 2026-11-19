import {
  AppstoreOutlined,
  DatabaseOutlined,
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
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasConfigMapDataContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasMetadataContent(values)) {
    return '已设置';
  }
  return '未设置';
};

/** YAML 模式下 data 的形态检查；返回错误文案 */
const getYamlDataError = (data: unknown) => {
  if (data === undefined || data === null) {
    return undefined;
  }

  const dataRecord = getRecordValue(data);
  if (!dataRecord) {
    return 'YAML data 必须为键值对象';
  }
  if (Object.values(dataRecord).some((value) => typeof value !== 'string')) {
    return 'YAML data 的值必须为字符串';
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
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '数据设置',
        icon: <DatabaseOutlined />,
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
            '标签',
          ) ||
          validateConfigMapMetadataItems(
            form.getFieldValue('annotations'),
            '注解',
          )
        : current === 1
          ? validateConfigMapDataItems(form.getFieldValue('dataItems'))
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
        message.error('YAML 格式不正确或不是有效的资源对象，请检查后重试');
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
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }
      if (kind !== CONFIG_MAP_KIND) {
        message.error(`YAML kind 必须为 ${CONFIG_MAP_KIND}`);
        return;
      }
      if (apiVersion !== CONFIG_MAP_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${CONFIG_MAP_API_VERSION}`);
        return;
      }

      const dataError = getYamlDataError(resource.data);
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
    const error = getConfigMapFormError(formValues);

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
            tooltip="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
            label="名称"
            name="name"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 63, message: '名称最长 63 个字符' },
              {
                pattern: CONFIG_MAP_NAME_PATTERN,
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
          getStepStatusText(current, index, values)
        }
        open
        steps={steps}
        title="创建配置字典"
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
          title="创建配置字典"
          onBack={() => setPending(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateConfigMapDrawer;
