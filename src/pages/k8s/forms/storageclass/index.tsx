import { AppstoreOutlined, DatabaseOutlined } from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { type Translate, useT } from '@/utils/i18n';
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

const hasBasicInfoContent = (values: CreateStorageClassFormValues) =>
  Boolean(values.name);

const hasStorageClassSettingsContent = (values: CreateStorageClassFormValues) =>
  Boolean(values.provisioner?.trim());

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateStorageClassFormValues,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasStorageClassSettingsContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const buildYaml = (values: CreateStorageClassFormValues) =>
  toYaml(buildCreateStorageClassManifest(values));

const CreateStorageClassDrawer = ({
  clusterId,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();
  const defaultClassOptions = useMemo(
    () => [
      { label: t('pages.k8s.forms.common.yes'), value: 'true' },
      { label: t('pages.k8s.forms.common.no'), value: 'false' },
    ],
    [t],
  );
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
        title: t('pages.k8s.form.section.basic'),
        icon: <AppstoreOutlined />,
      },
      {
        title: t('pages.k8s.forms.storageclass.step.settings'),
        icon: <DatabaseOutlined />,
      },
    ],
    [t],
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
        t,
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
        message.error(t('pages.k8s.forms.common.yaml.invalidObject'));
        return;
      }

      const yamlError = validateStorageClassManifest(resource, t);
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
    const error = validateStorageClassParameters(formValues.parameters, t);

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
            extra={t('pages.k8s.forms.common.name.dnsLabel')}
            label={t('pages.k8s.forms.common.name')}
            name="name"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.common.name.required'),
              },
              {
                max: 63,
                message: t('pages.k8s.forms.common.name.maxLength'),
              },
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
            extra={
              values.isDefault === 'true' && defaultClassNames.length > 0
                ? t('pages.k8s.forms.storageclass.isDefault.existing', {
                    names: defaultClassNames.join(
                      t('pages.k8s.forms.storageclass.listSeparator'),
                    ),
                  })
                : t('pages.k8s.forms.storageclass.isDefault.extra')
            }
            label={t('pages.k8s.forms.storageclass.isDefault')}
            name="isDefault"
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.storageclass.isDefault.required'),
              },
            ]}
          >
            <Select
              options={defaultClassOptions}
              placeholder={t('pages.k8s.forms.common.select')}
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
          getStepStatusText(current, index, values, t)
        }
        open
        steps={steps}
        title={t('pages.k8s.forms.storageclass.title')}
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
          title={t('pages.k8s.forms.storageclass.title')}
          onBack={() => setSubmissionYaml(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateStorageClassDrawer;
