import {
  AppstoreOutlined,
  HddOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, AutoComplete, Col, Form, Input, Row } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import {
  GVRS,
  listRows,
  parseObject,
  toYaml,
  useNamespaceOptions,
} from '../shared/kube';
import { hasKeyValueContent } from '../shared/manifest';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  buildCreatePersistentVolumeClaimManifest,
  getInitialPersistentVolumeClaimValues,
  getModeDescription,
  getPersistentVolumeClaimStepFields,
  getRecordValue,
  NAME_PATTERN,
  validatePersistentVolumeClaimManifest,
} from './helpers';
import PersistentVolumeClaimAdvancedSettings from './PersistentVolumeClaimAdvancedSettings';
import type {
  PersistentVolumeOption,
  StorageClassOption,
} from './PersistentVolumeClaimStorageSettings';
import PersistentVolumeClaimStorageSettings from './PersistentVolumeClaimStorageSettings';
import type { CreatePersistentVolumeClaimFormValues } from './types';

const useStyles = createStyles(() => ({
  basicFields: {
    width: '100%',
  },
}));

const hasBasicInfoContent = (values: CreatePersistentVolumeClaimFormValues) =>
  Boolean(values.name && values.namespace);

const hasStorageContent = (values: CreatePersistentVolumeClaimFormValues) =>
  Boolean(
    values.createMode &&
      values.accessModes?.length &&
      values.storageSize &&
      (values.createMode === 'storageClass'
        ? values.storageClassName
        : values.volumeName),
  );

const hasAdvancedContent = (values: CreatePersistentVolumeClaimFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreatePersistentVolumeClaimFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return '已设置';
  }
  if (index === 1 && hasStorageContent(values)) {
    return getModeDescription(values.createMode);
  }
  if (index === 2 && hasAdvancedContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const buildYaml = (values: CreatePersistentVolumeClaimFormValues) =>
  toYaml(buildCreatePersistentVolumeClaimManifest(values));

const cellText = (value: unknown) => (typeof value === 'string' ? value : '');

const CreatePersistentVolumeClaimDrawer = ({
  clusterId,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreatePersistentVolumeClaimFormValues>();
  const [initialValues] = useState(() =>
    getInitialPersistentVolumeClaimValues(defaultNamespace),
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  const [storageClasses, setStorageClasses] = useState<StorageClassOption[]>(
    [],
  );
  const [persistentVolumes, setPersistentVolumes] = useState<
    PersistentVolumeOption[]
  >([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submission, setSubmission] = useState<{
    namespace?: string;
    yaml: string;
  }>();
  const { namespaces } = useNamespaceOptions(clusterId);
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '存储设置',
        icon: <HddOutlined />,
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
    setOptionsLoading(true);
    Promise.all([
      listRows(clusterId, GVRS.storageClass),
      listRows(clusterId, GVRS.pv),
    ]).then(([storageClassRows, persistentVolumeRows]) => {
      if (!active) {
        return;
      }
      const nextStorageClasses = storageClassRows.map((row) => ({
        isDefault: row.cells?.default === '是',
        name: row.name,
        provisioner: cellText(row.cells?.provisioner) || undefined,
      }));
      setStorageClasses(nextStorageClasses);
      setPersistentVolumes(
        persistentVolumeRows.map((row) => ({
          accessModes: Array.isArray(row.cells?.accessModes)
            ? row.cells.accessModes.filter(
                (mode): mode is string => typeof mode === 'string',
              )
            : undefined,
          capacity: cellText(row.cells?.capacity) || undefined,
          claim: cellText(row.cells?.claim) || undefined,
          name: row.name,
          storageClass: cellText(row.cells?.storageClass),
        })),
      );
      setOptionsLoading(false);

      // 预选默认存储类（没有默认存储类时取第一个）
      const preferred =
        nextStorageClasses.find((item) => item.isDefault) ||
        nextStorageClasses[0];
      if (
        preferred &&
        form.getFieldValue('createMode') !== 'persistentVolume' &&
        !form.getFieldValue('storageClassName')
      ) {
        form.setFieldValue('storageClassName', preferred.name);
        setYamlValue(buildYaml(form.getFieldsValue(true)));
      }
    });
    return () => {
      active = false;
    };
  }, [clusterId, form]);

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildYaml(form.getFieldsValue(true)));
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(
      getPersistentVolumeClaimStepFields(current, form.getFieldsValue(true)),
    );
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
        message.error('YAML 格式不正确，内容必须是有效的资源对象');
        return;
      }

      const error = validatePersistentVolumeClaimManifest(resource);
      if (error) {
        message.error(error);
        return;
      }

      const namespace = getRecordValue(resource.metadata)?.namespace;
      setSubmission({
        namespace: typeof namespace === 'string' ? namespace.trim() : undefined,
        yaml: yamlValue,
      });
      return;
    }

    // 向导只挂载当前步骤：先校验（未挂载的字段在前面的步骤已校验过），再取完整表单值
    await form.validateFields();
    const formValues: CreatePersistentVolumeClaimFormValues =
      form.getFieldsValue(true);
    setSubmission({
      namespace: formValues.namespace?.trim(),
      yaml: buildYaml(formValues),
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
            <AutoComplete
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.value ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase()),
              }}
              options={namespaces.map((item) => ({ label: item, value: item }))}
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
        return (
          <PersistentVolumeClaimStorageSettings
            form={form}
            loading={optionsLoading}
            persistentVolumes={persistentVolumes}
            storageClasses={storageClasses}
          />
        );
      case 2:
        return <PersistentVolumeClaimAdvancedSettings />;
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
        title="创建持久卷声明"
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
              setYamlValue(buildYaml(form.getFieldsValue(true)));
            }
          }}
        >
          {renderStepContent()}
        </Form>
      </ResourceCreateWizardDrawer>
      {submission && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={submission.yaml}
          namespace={submission.namespace}
          title="创建持久卷声明"
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreatePersistentVolumeClaimDrawer;
