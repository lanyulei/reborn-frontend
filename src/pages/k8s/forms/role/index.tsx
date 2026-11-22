import {
  AppstoreOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import {
  App,
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
} from 'antd';
import { createStyles } from 'antd-style';
import { useMemo, useState } from 'react';
import { type Translate, useT } from '@/utils/i18n';
import CollapsibleField from '../shared/CollapsibleField';
import KeyValueEditor from '../shared/KeyValueEditor';
import { parseObject, toYaml, useNamespaceOptions } from '../shared/kube';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  buildCreateRoleManifest,
  createMetadataItem,
  getAggregationError,
  getCreateRoleStepFields,
  getInitialCreateRoleValues,
  getPolicyRulesError,
  getRoleManifestError,
  hasAdvancedContent,
  hasRulesContent,
  ROLE_NAME_PATTERN,
} from './helpers';
import PolicyRuleEditor from './PolicyRuleEditor';
import type { CreateRoleFormValues, CreateRoleType } from './types';

const useStyles = createStyles(({ token }) => ({
  ruleSectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  advancedStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  advancedSectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  advancedOption: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  advancedOptionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
  },
  advancedCheckbox: {
    marginTop: 2,
  },
  advancedTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  advancedDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  advancedMetadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    borderRadius: token.borderRadiusSM,
  },
  aggregationBody: {
    marginTop: 14,
  },
  advancedFieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  aggregationExpressions: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  expressionRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 150px minmax(0, 1.4fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,
  },
  expressionFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

type CreateRoleDrawerProps = CreateFormProps & {
  /** 给定时类型固定，不可切换 */
  kind?: CreateRoleType;
};

const ROLE_TYPE_OPTIONS: { label: string; value: CreateRoleType }[] = [
  { label: 'Role', value: 'Role' },
  { label: 'ClusterRole', value: 'ClusterRole' },
];

const SELECTOR_OPERATOR_OPTIONS = [
  { label: 'In', value: 'In' },
  { label: 'NotIn', value: 'NotIn' },
  { label: 'Exists', value: 'Exists' },
  { label: 'DoesNotExist', value: 'DoesNotExist' },
];

const STEP_COUNT = 3;

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateRoleFormValues,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (
    index === 0 &&
    values.name &&
    (values.type === 'ClusterRole' || values.namespace)
  ) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && hasRulesContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && hasAdvancedContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const buildYaml = (values: CreateRoleFormValues) =>
  toYaml(buildCreateRoleManifest(values));

const CreateRoleDrawer = ({
  clusterId,
  kind,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateRoleDrawerProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const t = useT();
  const [form] = Form.useForm<CreateRoleFormValues>();
  const [initialValues] = useState(() =>
    getInitialCreateRoleValues(kind || 'Role', defaultNamespace),
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  const [submission, setSubmission] = useState<{
    namespace?: string;
    yaml: string;
  }>();
  const { namespaces } = useNamespaceOptions(clusterId);
  const values: CreateRoleFormValues =
    Form.useWatch([], { form, preserve: true }) || {};
  const roleType: CreateRoleType =
    kind || values.type || initialValues.type || 'Role';
  const steps = useMemo(
    () => [
      { title: t('pages.k8s.form.section.basic'), icon: <AppstoreOutlined /> },
      {
        title: t('pages.k8s.forms.role.rules'),
        icon: <SafetyCertificateOutlined />,
      },
      {
        title: t('pages.k8s.forms.common.advanced'),
        icon: <SlidersOutlined />,
      },
    ],
    [t],
  );
  const namespaceOptions = useMemo(
    () => namespaces.map((item) => ({ label: item, value: item })),
    [namespaces],
  );

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      setYamlValue(buildYaml(form.getFieldsValue(true)));
    }
    setYamlMode(checked);
  };

  const warn = (error?: string) => {
    if (error) {
      message.warning(error);
    }
    return !error;
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getCreateRoleStepFields(current), {
      recursive: true,
    });
    const formValues: CreateRoleFormValues = form.getFieldsValue(true);

    if (current === 1) {
      return warn(getPolicyRulesError(formValues, t));
    }
    if (current === 2) {
      return warn(getAggregationError(formValues, t));
    }

    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();

    if (!valid) {
      return;
    }

    setCurrent((step) => Math.min(step + 1, STEP_COUNT - 1));
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

      const error = getRoleManifestError(resource, t, kind);
      if (error) {
        message.error(error);
        return;
      }

      const metadata = resource.metadata as { namespace?: unknown };
      setSubmission({
        namespace:
          resource.kind === 'Role' && typeof metadata.namespace === 'string'
            ? metadata.namespace.trim()
            : undefined,
        yaml: yamlValue,
      });
      return;
    }

    // 向导只挂载当前步骤：先校验，再取完整表单值
    await form.validateFields();
    const formValues: CreateRoleFormValues = form.getFieldsValue(true);

    if (
      !warn(getPolicyRulesError(formValues, t)) ||
      !warn(getAggregationError(formValues, t))
    ) {
      return;
    }

    setSubmission({
      namespace:
        formValues.type === 'Role' ? formValues.namespace?.trim() : undefined,
      yaml: buildYaml(formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          tooltip={t('pages.k8s.forms.role.name.tooltip')}
          label={t('pages.k8s.forms.common.name')}
          name="name"
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.common.name.required'),
            },
            {
              max: 253,
              message: t('pages.k8s.forms.common.name.maxLength253'),
            },
            {
              pattern: ROLE_NAME_PATTERN,
              message: t('pages.k8s.forms.role.name.pattern'),
            },
          ]}
        >
          <Input
            autoFocus
            placeholder={t('pages.k8s.forms.common.name.required')}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label={t('pages.k8s.forms.common.namespace')}
          name="namespace"
          rules={[
            {
              required: roleType === 'Role',
              message: t('pages.k8s.forms.common.namespace.required'),
            },
          ]}
        >
          <AutoComplete
            disabled={roleType === 'ClusterRole'}
            options={namespaceOptions}
            placeholder={
              roleType === 'ClusterRole'
                ? t('pages.k8s.forms.role.namespace.notNeeded')
                : t('pages.k8s.forms.common.namespace.required')
            }
            showSearch={{
              filterOption: (input, option) =>
                String(option?.value ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase()),
            }}
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item
          label={t('pages.k8s.forms.common.type')}
          name="type"
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.common.type.required'),
            },
          ]}
        >
          <Select
            disabled={Boolean(kind)}
            options={ROLE_TYPE_OPTIONS}
            onChange={(nextType) => {
              if (nextType === 'ClusterRole') {
                form.setFieldValue('namespace', undefined);
              }
            }}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderRuleSettings = () => (
    <>
      <div className={styles.ruleSectionTitle}>
        {t('pages.k8s.forms.role.rules')}
      </div>
      <PolicyRuleEditor clusterScoped={roleType === 'ClusterRole'} />
    </>
  );

  const renderAggregationExpressions = () => (
    <Form.List name="aggregationExpressions">
      {(fields, { add, remove }) => (
        <>
          <div className={styles.aggregationExpressions}>
            {fields.map((field) => (
              <div className={styles.expressionRow} key={field.key}>
                <Form.Item name={[field.name, 'key']} noStyle>
                  <Input placeholder={t('pages.k8s.forms.common.labelKey')} />
                </Form.Item>
                <Form.Item name={[field.name, 'operator']} noStyle>
                  <Select
                    options={SELECTOR_OPERATOR_OPTIONS}
                    placeholder={t('pages.k8s.forms.role.selector.operator')}
                  />
                </Form.Item>
                <Form.Item shouldUpdate noStyle>
                  {({ getFieldValue }) => {
                    const operator = getFieldValue([
                      'aggregationExpressions',
                      field.name,
                      'operator',
                    ]);
                    return (
                      <Form.Item name={[field.name, 'values']} noStyle>
                        <Select
                          disabled={
                            operator === 'Exists' || operator === 'DoesNotExist'
                          }
                          mode="tags"
                          placeholder={t('pages.k8s.forms.common.labelValue')}
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
                <Button
                  aria-label={t(
                    'pages.k8s.forms.role.selector.deleteExpression',
                  )}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => remove(field.name)}
                />
              </div>
            ))}
          </div>
          <div className={styles.expressionFooter}>
            <Button
              onClick={() =>
                add({
                  key: '',
                  operator: 'In',
                  values: [],
                })
              }
            >
              {t('pages.k8s.forms.role.selector.addExpression')}
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );

  const renderAdvancedSettings = () => (
    <div className={styles.advancedStack}>
      {roleType === 'ClusterRole' && (
        <div>
          <div className={styles.advancedSectionTitle}>
            {t('pages.k8s.forms.role.aggregation')}
          </div>
          <div className={styles.advancedOption}>
            <div className={styles.advancedOptionHeader}>
              <Form.Item
                className={styles.advancedCheckbox}
                name="aggregationEnabled"
                valuePropName="checked"
              >
                <Checkbox
                  aria-label={t('pages.k8s.forms.role.aggregation.enable')}
                />
              </Form.Item>
              <span>
                <div className={styles.advancedTitle}>
                  {t('pages.k8s.forms.role.aggregation.enable')}
                </div>
                <div className={styles.advancedDescription}>
                  {t('pages.k8s.forms.role.aggregation.description')}
                </div>
              </span>
            </div>
            {values.aggregationEnabled && (
              <div
                className={`${styles.advancedMetadataBody} ${styles.aggregationBody}`}
              >
                <div>
                  <div className={styles.advancedFieldLabel}>
                    {t('pages.k8s.forms.role.aggregation.labels')}
                  </div>
                  <Form.Item name="aggregationLabels">
                    <KeyValueEditor
                      addIcon={false}
                      addText={t('pages.k8s.form.add')}
                      deleteAriaLabel={t(
                        'pages.k8s.forms.role.aggregation.deleteLabel',
                      )}
                      keyPlaceholder={t('pages.k8s.forms.common.labelKey')}
                      minRows={1}
                      valuePlaceholder={t('pages.k8s.forms.common.labelValue')}
                      onAddBlocked={() =>
                        message.warning(
                          t('pages.k8s.forms.role.aggregation.labelKeyFirst'),
                        )
                      }
                      onCreateItem={createMetadataItem}
                    />
                  </Form.Item>
                </div>
                <div>
                  <div className={styles.advancedFieldLabel}>
                    {t('pages.k8s.forms.role.aggregation.expressions')}
                  </div>
                  <Form.Item>{renderAggregationExpressions()}</Form.Item>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className={styles.advancedSectionTitle}>
          {t('pages.k8s.forms.common.metadata')}
        </div>
        <div className={styles.advancedOption}>
          <CollapsibleField
            description={t('pages.k8s.forms.role.metadata.description')}
            title={t('pages.k8s.forms.common.addMetadata')}
          >
            <div className={styles.advancedMetadataBody}>
              <div>
                <div className={styles.advancedFieldLabel}>
                  {t('pages.k8s.forms.common.labels')}
                </div>
                <Form.Item name="labels">
                  <KeyValueEditor
                    addIcon={false}
                    addText={t('pages.k8s.form.add')}
                    deleteAriaLabel={t('pages.k8s.forms.common.deleteLabel')}
                    keyPlaceholder={t('pages.k8s.forms.common.labelKey')}
                    minRows={1}
                    valuePlaceholder={t('pages.k8s.forms.common.labelValue')}
                    onAddBlocked={() =>
                      message.warning(t('pages.k8s.forms.common.labelKeyFirst'))
                    }
                    onCreateItem={createMetadataItem}
                  />
                </Form.Item>
              </div>
              <div>
                <div className={styles.advancedFieldLabel}>
                  {t('pages.k8s.forms.common.annotations')}
                </div>
                <Form.Item name="annotations">
                  <KeyValueEditor
                    addIcon={false}
                    addText={t('pages.k8s.form.add')}
                    deleteAriaLabel={t(
                      'pages.k8s.forms.common.deleteAnnotation',
                    )}
                    keyPlaceholder={t('pages.k8s.forms.role.annotationKey')}
                    minRows={1}
                    valuePlaceholder={t('pages.k8s.forms.role.annotationValue')}
                    onAddBlocked={() =>
                      message.warning(
                        t('pages.k8s.forms.common.annotationKeyFirst'),
                      )
                    }
                    onCreateItem={createMetadataItem}
                  />
                </Form.Item>
              </div>
            </div>
          </CollapsibleField>
        </div>
      </div>
    </div>
  );

  const stepContent = [
    renderBasicInfo,
    renderRuleSettings,
    renderAdvancedSettings,
  ][current];

  return (
    <>
      <ResourceCreateWizardDrawer
        current={current}
        getStepDescription={(_, index) =>
          getStepStatusText(current, index, values, t)
        }
        open
        steps={steps}
        title={t('pages.k8s.forms.role.title', { kind: roleType })}
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
          {stepContent()}
        </Form>
      </ResourceCreateWizardDrawer>
      {submission && (
        <SubmitManifest
          clusterId={clusterId}
          yaml={submission.yaml}
          namespace={submission.namespace}
          title={t('pages.k8s.forms.role.title', { kind: roleType })}
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateRoleDrawer;
