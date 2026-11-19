import {
  AppstoreOutlined,
  CloudServerOutlined,
  HddOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { GVRS, listNames, parseObject, toYaml } from '../shared/kube';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  buildCreatePersistentVolumeManifest,
  getInitialPersistentVolumeValues,
  getPersistentVolumeAdvancedValidationError,
  getPersistentVolumeSourceValidationError,
  getPersistentVolumeStepFields,
  getSourceDescription,
  hasKeyValueContent,
  hasStringListContent,
  NAME_PATTERN,
  validatePersistentVolumeManifest,
} from './helpers';
import PersistentVolumeAdvancedSettings from './PersistentVolumeAdvancedSettings';
import PersistentVolumeSourceSettings from './PersistentVolumeSourceSettings';
import PersistentVolumeStorageSettings from './PersistentVolumeStorageSettings';
import type { CreatePersistentVolumeFormValues } from './types';

const useStyles = createStyles(() => ({
  basicFields: {
    width: '100%',
  },
}));

const hasBasicInfoContent = (values: CreatePersistentVolumeFormValues) =>
  Boolean(values.name);

const hasStorageContent = (values: CreatePersistentVolumeFormValues) =>
  Boolean(
    values.capacitySize &&
      values.accessModes?.length &&
      values.persistentVolumeReclaimPolicy &&
      values.volumeMode,
  );

const hasVolumeSourceContent = (values: CreatePersistentVolumeFormValues) => {
  if (values.volumeSourceType === 'nfs') {
    return Boolean(values.nfsServer && values.nfsPath);
  }

  if (values.volumeSourceType === 'csi') {
    return Boolean(values.csiDriver && values.csiVolumeHandle);
  }

  if (values.volumeSourceType === 'local') {
    return Boolean(
      values.localPath && values.nodeAffinityKey && values.nodeAffinityOperator,
    );
  }

  return Boolean(values.hostPath);
};

const hasAdvancedContent = (values: CreatePersistentVolumeFormValues) =>
  hasKeyValueContent(values.labels) ||
  hasKeyValueContent(values.annotations) ||
  hasStringListContent(values.mountOptions) ||
  Boolean(values.claimName || values.claimNamespace);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreatePersistentVolumeFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return '已设置';
  }
  if (index === 1 && hasStorageContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasVolumeSourceContent(values)) {
    return getSourceDescription(values.volumeSourceType);
  }
  if (index === 3 && hasAdvancedContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const buildYaml = (values: CreatePersistentVolumeFormValues) =>
  toYaml(buildCreatePersistentVolumeManifest(values));

const CreatePersistentVolumeDrawer = ({
  clusterId,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreatePersistentVolumeFormValues>();
  const [initialValues] = useState(getInitialPersistentVolumeValues);
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  const [storageClassNames, setStorageClassNames] = useState<string[]>([]);
  const [nodeNames, setNodeNames] = useState<string[]>([]);
  const [submissionYaml, setSubmissionYaml] = useState<string>();
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
        title: '卷来源',
        icon: <CloudServerOutlined />,
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
    Promise.all([
      listNames(clusterId, GVRS.storageClass),
      listNames(clusterId, GVRS.node),
    ]).then(([nextStorageClassNames, nextNodeNames]) => {
      if (active) {
        setStorageClassNames(nextStorageClassNames);
        setNodeNames(nextNodeNames);
      }
    });
    return () => {
      active = false;
    };
  }, [clusterId]);

  const syncYamlFromForm = () => {
    setYamlValue(buildYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    const formValues = form.getFieldsValue(true);
    await form.validateFields(
      getPersistentVolumeStepFields(current, formValues),
    );

    const sourceError =
      current === 2
        ? getPersistentVolumeSourceValidationError(form.getFieldsValue(true))
        : undefined;
    const advancedError =
      current === 3
        ? getPersistentVolumeAdvancedValidationError(form.getFieldsValue(true))
        : undefined;
    const error = sourceError || advancedError;

    if (error) {
      form.setFields([{ name: error.field, errors: [error.message] }]);
      message.warning(error.message);
      throw new Error(error.message);
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
        message.error('YAML 格式不正确，内容必须是有效的资源对象');
        return;
      }

      const yamlError = validatePersistentVolumeManifest(resource);
      if (yamlError) {
        message.error(yamlError);
        return;
      }

      setSubmissionYaml(yamlValue);
      return;
    }

    await form.validateFields([
      ...getPersistentVolumeStepFields(0),
      ...getPersistentVolumeStepFields(1),
      ...getPersistentVolumeStepFields(2, form.getFieldsValue(true)),
      ...getPersistentVolumeStepFields(3),
    ]);

    const sourceError = getPersistentVolumeSourceValidationError(
      form.getFieldsValue(true),
    );
    const advancedError = getPersistentVolumeAdvancedValidationError(
      form.getFieldsValue(true),
    );
    const error = sourceError || advancedError;

    if (error) {
      form.setFields([{ name: error.field, errors: [error.message] }]);
      message.warning(error.message);
      return;
    }

    setSubmissionYaml(buildYaml(form.getFieldsValue(true)));
  };

  const renderBasicInfo = () => (
    <div className={styles.basicFields}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
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
      </Row>
    </div>
  );

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return renderBasicInfo();
      case 1:
        return (
          <PersistentVolumeStorageSettings
            form={form}
            storageClassNames={storageClassNames}
          />
        );
      case 2:
        return (
          <PersistentVolumeSourceSettings form={form} nodeNames={nodeNames} />
        );
      case 3:
        return <PersistentVolumeAdvancedSettings />;
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
        title="创建持久卷"
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
      {submissionYaml !== undefined && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={submissionYaml}
          title="创建持久卷"
          onBack={() => setSubmissionYaml(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreatePersistentVolumeDrawer;
