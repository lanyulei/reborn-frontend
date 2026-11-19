import { AppstoreOutlined, DatabaseOutlined } from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { GVRS, listRows, parseObject, toYaml } from '../shared/kube';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  buildCreateStorageClassManifest,
  getInitialStorageClassValues,
  getStorageClassStepFields,
  NAME_PATTERN,
  validateStorageClassManifest,
  validateStorageClassParameters,
} from './helpers';
import StorageClassSettings from './StorageClassSettings';
import type { CreateStorageClassFormValues } from './types';

const useStyles = createStyles(() => ({
  basicFields: {
    width: '100%',
  },
}));

const defaultClassOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
];

const hasBasicInfoContent = (values: CreateStorageClassFormValues) =>
  Boolean(values.name);

const hasStorageClassSettingsContent = (values: CreateStorageClassFormValues) =>
  Boolean(values.provisioner?.trim());

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateStorageClassFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return '已设置';
  }
  if (index === 1 && hasStorageClassSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const buildYaml = (values: CreateStorageClassFormValues) =>
  toYaml(buildCreateStorageClassManifest(values));

const CreateStorageClassDrawer = ({
  clusterId,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateStorageClassFormValues>();
  const [initialValues] = useState(getInitialStorageClassValues);
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  const [provisioners, setProvisioners] = useState<string[]>([]);
  const [defaultClassNames, setDefaultClassNames] = useState<string[]>([]);
  const [submissionYaml, setSubmissionYaml] = useState<string>();
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '存储类设置',
        icon: <DatabaseOutlined />,
      },
    ],
    [],
  );

  useEffect(() => {
    let active = true;
    listRows(clusterId, GVRS.storageClass).then((rows) => {
      if (!active) {
        return;
      }
      setProvisioners(
        Array.from(
          new Set(
            rows
              .map((row) => row.cells?.provisioner)
              .filter(
                (item): item is string => typeof item === 'string' && !!item,
              ),
          ),
        ),
      );
      setDefaultClassNames(
        rows
          .filter((row) => row.cells?.default === '是')
          .map((row) => row.name),
      );
    });
    return () => {
      active = false;
    };
  }, [clusterId]);

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildYaml(form.getFieldsValue(true)));
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getStorageClassStepFields(current));
    if (current === 1) {
      const error = validateStorageClassParameters(
        form.getFieldValue('parameters'),
      );

      if (error) {
        form.setFields([{ name: 'parameters', errors: [error] }]);
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
        message.error('YAML 格式不正确，内容必须是有效的资源对象');
        return;
      }

      const yamlError = validateStorageClassManifest(resource);
      if (yamlError) {
        message.error(yamlError);
        return;
      }

      setSubmissionYaml(yamlValue);
      return;
    }

    // 向导只挂载当前步骤：先校验，再取完整表单值
    await form.validateFields();
    const formValues: CreateStorageClassFormValues = form.getFieldsValue(true);
    const error = validateStorageClassParameters(formValues.parameters);

    if (error) {
      form.setFields([{ name: 'parameters', errors: [error] }]);
      message.warning(error);
      return;
    }

    setSubmissionYaml(buildYaml(formValues));
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
        <Col span={12}>
          <Form.Item
            extra={
              values.isDefault === 'true' && defaultClassNames.length > 0
                ? `集群已有默认存储类 ${defaultClassNames.join('、')}；同时存在多个默认存储类时，未指定存储类的声明会使用最新创建的那个。`
                : '未指定存储类的持久卷声明会使用默认存储类。'
            }
            label="设为默认存储类"
            name="isDefault"
            rules={[{ required: true, message: '请选择是否设为默认存储类' }]}
          >
            <Select options={defaultClassOptions} placeholder="请选择" />
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
        return <StorageClassSettings provisioners={provisioners} />;
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
        title="创建存储类"
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
          title="创建存储类"
          onBack={() => setSubmissionYaml(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateStorageClassDrawer;
