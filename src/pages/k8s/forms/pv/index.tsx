import {
  AppstoreOutlined,
  CloudServerOutlined,
  HddOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { type Translate, useT } from '@/utils/i18n';
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
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasStorageContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && hasVolumeSourceContent(values)) {
    return getSourceDescription(values.volumeSourceType);
  }
  if (index === 3 && hasAdvancedContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const buildYaml = (values: CreatePersistentVolumeFormValues) =>
  toYaml(buildCreatePersistentVolumeManifest(values));

const CreatePersistentVolumeDrawer = ({
  clusterId,
  onClose,
  onDone,
}: CreateFormProps) => {
  const { styles } = useStyles();
  const t = useT();
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
        title: t('pages.k8s.form.section.basic'),
        icon: <AppstoreOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.storage'),
        icon: <HddOutlined />,
      },
      {
        title: t('pages.k8s.forms.pv.volumeSource'),
        icon: <CloudServerOutlined />,
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
      const errorMessage = t(error.messageId);
      form.setFields([{ name: error.field, errors: [errorMessage] }]);
      message.warning(errorMessage);
      throw new Error(errorMessage);
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

      const yamlError = validatePersistentVolumeManifest(resource, t);
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
      const errorMessage = t(error.messageId);
      form.setFields([{ name: error.field, errors: [errorMessage] }]);
      message.warning(errorMessage);
      return;
    }

    setSubmissionYaml(buildYaml(form.getFieldsValue(true)));
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
          getStepStatusText(current, index, values, t)
        }
        open
        steps={steps}
        title={t('pages.k8s.forms.pv.title')}
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
          title={t('pages.k8s.forms.pv.title')}
          onBack={() => setSubmissionYaml(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreatePersistentVolumeDrawer;
