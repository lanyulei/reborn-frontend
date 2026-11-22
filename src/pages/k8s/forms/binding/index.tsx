import {
  AppstoreOutlined,
  DeleteOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SlidersOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { App, AutoComplete, Button, Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { type Translate, useT } from '@/utils/i18n';
import CollapsibleField from '../shared/CollapsibleField';
import KeyValueEditor from '../shared/KeyValueEditor';
import {
  GVRS,
  listNames,
  parseObject,
  toYaml,
  useNamespaceOptions,
} from '../shared/kube';
import ResourceCreateWizardDrawer from '../shared/ResourceCreateWizardDrawer';
import { SubmitManifest } from '../shared/SubmitManifest';
import type { CreateFormProps } from '../types';
import {
  BINDING_NAME_PATTERN,
  buildCreateBindingManifest,
  createMetadataItem,
  createSubjectItem,
  getBindingManifestError,
  getCreateBindingStepFields,
  getInitialCreateBindingValues,
  getSubjectsError,
  hasAdvancedContent,
  hasSubjectsContent,
} from './helpers';
import type {
  BindingSubjectFormValue,
  BindingSubjectKind,
  CreateBindingFormValues,
  CreateBindingType,
} from './types';

const useStyles = createStyles(({ token }) => ({
  sectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  subjectHint: {
    marginBottom: token.marginSM,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  subjectStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  subjectRow: {
    display: 'grid',
    gridTemplateColumns: '150px minmax(0, 1.2fr) minmax(0, 1.4fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  subjectTypeField: {
    minWidth: 0,
  },
  subjectNameField: {
    minWidth: 0,
    width: '100%',

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      gridRow: 3,
    },
  },
  subjectNamespaceField: {
    minWidth: 0,
    width: '100%',

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      gridRow: 2,
    },
  },
  subjectDeleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  subjectFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
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
  advancedMetadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    borderRadius: token.borderRadiusSM,
  },
  advancedFieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type CreateBindingDrawerProps = CreateFormProps & {
  /** 给定时类型固定，不可切换 */
  kind?: CreateBindingType;
};

type SelectOption = {
  label: string;
  value: string;
};

const BINDING_TYPE_OPTIONS: { label: string; value: CreateBindingType }[] = [
  { label: 'RoleBinding', value: 'RoleBinding' },
  { label: 'ClusterRoleBinding', value: 'ClusterRoleBinding' },
];

const SUBJECT_KIND_OPTIONS: { label: string; value: BindingSubjectKind }[] = [
  { label: 'ServiceAccount', value: 'ServiceAccount' },
  { label: 'User', value: 'User' },
  { label: 'Group', value: 'Group' },
];

const ROLE_KIND_OPTIONS: {
  label: string;
  value: NonNullable<CreateBindingFormValues['roleKind']>;
}[] = [
  { label: 'Role', value: 'Role' },
  { label: 'ClusterRole', value: 'ClusterRole' },
];

const STEP_COUNT = 4;

const SUBJECT_NAME_PLACEHOLDER_ID: Record<BindingSubjectKind, string> = {
  ServiceAccount: 'pages.k8s.forms.binding.subject.placeholder.serviceAccount',
  User: 'pages.k8s.forms.binding.subject.placeholder.user',
  Group: 'pages.k8s.forms.binding.subject.placeholder.group',
};

const toOptions = (names: string[]): SelectOption[] =>
  names.map((item) => ({ label: item, value: item }));

const filterByValue = (input: string, option?: { value?: unknown }) =>
  String(option?.value ?? '')
    .toLowerCase()
    .includes(input.toLowerCase());

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateBindingFormValues,
  t: Translate,
) => {
  if (current === index) {
    return t('pages.k8s.forms.common.current');
  }
  if (
    index === 0 &&
    values.name &&
    (values.type === 'ClusterRoleBinding' || values.namespace)
  ) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 1 && values.roleKind && values.roleName) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 2 && hasSubjectsContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  if (index === 3 && hasAdvancedContent(values)) {
    return t('pages.k8s.forms.common.set');
  }
  return t('pages.k8s.forms.common.unset');
};

const buildYaml = (values: CreateBindingFormValues) =>
  toYaml(buildCreateBindingManifest(values));

const CreateBindingDrawer = ({
  clusterId,
  kind,
  namespace: defaultNamespace,
  onClose,
  onDone,
}: CreateBindingDrawerProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const t = useT();
  const [form] = Form.useForm<CreateBindingFormValues>();
  const [initialValues] = useState(() =>
    getInitialCreateBindingValues(kind || 'RoleBinding', defaultNamespace),
  );
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState(() => buildYaml(initialValues));
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [serviceAccountNames, setServiceAccountNames] = useState<
    Record<string, string[]>
  >({});
  const [submission, setSubmission] = useState<{
    namespace?: string;
    yaml: string;
  }>();
  const { namespaces } = useNamespaceOptions(clusterId);
  const values: CreateBindingFormValues =
    Form.useWatch([], { form, preserve: true }) || {};
  const bindingType: CreateBindingType =
    kind || values.type || initialValues.type || 'RoleBinding';
  const bindingNamespace =
    bindingType === 'RoleBinding'
      ? values.namespace?.trim() || undefined
      : undefined;
  // ServiceAccount 主体的缺省命名空间：绑定的命名空间，其次是当前作用域的命名空间
  const subjectNamespace = bindingNamespace || defaultNamespace || undefined;
  const roleKind =
    bindingType === 'ClusterRoleBinding'
      ? 'ClusterRole'
      : values.roleKind || 'Role';
  const steps = useMemo(
    () => [
      { title: t('pages.k8s.form.section.basic'), icon: <AppstoreOutlined /> },
      {
        title: t('pages.k8s.forms.binding.roleRef'),
        icon: <SafetyCertificateOutlined />,
      },
      { title: t('pages.k8s.forms.binding.subjects'), icon: <TeamOutlined /> },
      {
        title: t('pages.k8s.forms.common.advanced'),
        icon: <SlidersOutlined />,
      },
    ],
    [t],
  );
  const namespaceOptions = useMemo(() => toOptions(namespaces), [namespaces]);
  const roleOptions = useMemo(() => toOptions(roleNames), [roleNames]);
  // 需要加载 ServiceAccount 候选项的命名空间（去重排序后拼成稳定的依赖键）
  const serviceAccountNamespaceKey = Array.from(
    new Set(
      (values.subjects || [])
        .filter((subject) => subject?.kind === 'ServiceAccount')
        .map((subject) => subject.namespace?.trim())
        .filter((item): item is string => Boolean(item)),
    ),
  )
    .sort()
    .join('\n');

  useEffect(() => {
    if (roleKind === 'Role' && !bindingNamespace) {
      setRoleNames([]);
      return;
    }

    let active = true;
    listNames(
      clusterId,
      roleKind === 'Role' ? GVRS.role : GVRS.clusterRole,
      roleKind === 'Role' ? bindingNamespace : undefined,
    ).then((names) => {
      if (active) {
        setRoleNames(names);
      }
    });

    return () => {
      active = false;
    };
  }, [bindingNamespace, clusterId, roleKind]);

  useEffect(() => {
    const pending = serviceAccountNamespaceKey
      .split('\n')
      .filter((item) => item && !(item in serviceAccountNames));

    if (!pending.length) {
      return;
    }

    let active = true;
    for (const namespace of pending) {
      listNames(clusterId, GVRS.serviceAccount, namespace).then((names) => {
        if (active) {
          setServiceAccountNames((options) => ({
            ...options,
            [namespace]: names,
          }));
        }
      });
    }

    return () => {
      active = false;
    };
  }, [clusterId, serviceAccountNames, serviceAccountNamespaceKey]);

  const syncSubjectNamespaces = (namespace?: string) => {
    const subjects: BindingSubjectFormValue[] =
      form.getFieldValue('subjects') || [];
    form.setFieldValue(
      'subjects',
      subjects.map((subject) =>
        subject.kind === 'ServiceAccount' ? { ...subject, namespace } : subject,
      ),
    );
  };

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
    await form.validateFields(getCreateBindingStepFields(current), {
      recursive: true,
    });
    const formValues: CreateBindingFormValues = form.getFieldsValue(true);

    if (current === 2) {
      return warn(getSubjectsError(formValues, t));
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

      const error = getBindingManifestError(resource, t, kind);
      if (error) {
        message.error(error);
        return;
      }

      const metadata = resource.metadata as { namespace?: unknown };
      setSubmission({
        namespace:
          resource.kind === 'RoleBinding' &&
          typeof metadata.namespace === 'string'
            ? metadata.namespace.trim()
            : undefined,
        yaml: yamlValue,
      });
      return;
    }

    // 向导只挂载当前步骤：先校验，再取完整表单值
    await form.validateFields();
    const formValues: CreateBindingFormValues = form.getFieldsValue(true);

    if (!warn(getSubjectsError(formValues, t))) {
      return;
    }

    setSubmission({
      namespace:
        formValues.type === 'RoleBinding'
          ? formValues.namespace?.trim()
          : undefined,
      yaml: buildYaml(formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          tooltip={t('pages.k8s.forms.binding.name.tooltip')}
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
              pattern: BINDING_NAME_PATTERN,
              message: t('pages.k8s.forms.binding.name.pattern'),
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
              required: bindingType === 'RoleBinding',
              message: t('pages.k8s.forms.common.namespace.required'),
            },
          ]}
        >
          <AutoComplete
            disabled={bindingType === 'ClusterRoleBinding'}
            options={namespaceOptions}
            placeholder={
              bindingType === 'ClusterRoleBinding'
                ? t('pages.k8s.forms.binding.namespace.notNeeded')
                : t('pages.k8s.forms.common.namespace.required')
            }
            showSearch={{ filterOption: filterByValue }}
            onChange={(namespace?: string) => {
              if (form.getFieldValue('roleKind') === 'Role') {
                form.setFieldValue('roleName', undefined);
              }
              syncSubjectNamespaces(namespace?.trim() || undefined);
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
            options={BINDING_TYPE_OPTIONS}
            onChange={(nextType: CreateBindingType) => {
              if (nextType === 'ClusterRoleBinding') {
                form.setFieldsValue({
                  namespace: undefined,
                  roleKind: 'ClusterRole',
                  roleName: undefined,
                });
              }
            }}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderRoleRefSettings = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label={t('pages.k8s.forms.binding.roleKind')}
          name="roleKind"
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.binding.roleKind.required'),
            },
          ]}
          extra={
            bindingType === 'ClusterRoleBinding'
              ? t('pages.k8s.forms.binding.roleKind.clusterOnly')
              : t('pages.k8s.forms.binding.roleKind.hint')
          }
        >
          <Select
            disabled={bindingType === 'ClusterRoleBinding'}
            options={
              bindingType === 'ClusterRoleBinding'
                ? ROLE_KIND_OPTIONS.filter(
                    (option) => option.value === 'ClusterRole',
                  )
                : ROLE_KIND_OPTIONS
            }
            onChange={() => form.setFieldValue('roleName', undefined)}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra={t('pages.k8s.forms.binding.roleName.extra')}
          label={t('pages.k8s.forms.binding.roleRef')}
          name="roleName"
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('pages.k8s.forms.binding.roleName.required'),
            },
          ]}
        >
          <AutoComplete
            allowClear
            notFoundContent={
              roleKind === 'Role' && !bindingNamespace
                ? t('pages.k8s.forms.binding.namespaceFirst')
                : t('pages.k8s.forms.binding.roleName.empty')
            }
            options={roleOptions}
            placeholder={
              roleKind === 'Role'
                ? t('pages.k8s.forms.binding.roleName.placeholder.role')
                : t('pages.k8s.forms.binding.roleName.placeholder.clusterRole')
            }
            showSearch={{ filterOption: filterByValue }}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderSubjectNameField = (fieldName: number) => (
    <Form.Item shouldUpdate noStyle>
      {({ getFieldValue }) => {
        const subjectKind: BindingSubjectKind =
          getFieldValue(['subjects', fieldName, 'kind']) || 'ServiceAccount';
        const namespace: string | undefined = getFieldValue([
          'subjects',
          fieldName,
          'namespace',
        ]);

        return (
          <Form.Item
            name={[fieldName, 'name']}
            noStyle
            rules={[
              {
                required: true,
                whitespace: true,
                message: t('pages.k8s.forms.binding.subject.name.required'),
              },
              {
                max: 253,
                message: t('pages.k8s.forms.binding.subject.name.maxLength'),
              },
            ]}
          >
            {subjectKind === 'ServiceAccount' ? (
              <AutoComplete
                allowClear
                className={styles.subjectNameField}
                notFoundContent={
                  namespace
                    ? t('pages.k8s.forms.binding.subject.empty')
                    : t('pages.k8s.forms.binding.namespaceFirst')
                }
                options={toOptions(
                  serviceAccountNames[namespace?.trim() || ''] || [],
                )}
                placeholder={t(SUBJECT_NAME_PLACEHOLDER_ID.ServiceAccount)}
                showSearch={{ filterOption: filterByValue }}
              />
            ) : (
              <Input
                allowClear
                className={styles.subjectNameField}
                placeholder={t(SUBJECT_NAME_PLACEHOLDER_ID[subjectKind])}
              />
            )}
          </Form.Item>
        );
      }}
    </Form.Item>
  );

  const renderSubjectNamespaceField = (fieldName: number) => (
    <Form.Item shouldUpdate noStyle>
      {({ getFieldValue }) => {
        const subjectKind = getFieldValue(['subjects', fieldName, 'kind']);
        return (
          <Form.Item
            name={[fieldName, 'namespace']}
            noStyle
            rules={[
              {
                required: subjectKind === 'ServiceAccount',
                message: t('pages.k8s.forms.common.namespace.required'),
              },
            ]}
          >
            <AutoComplete
              className={styles.subjectNamespaceField}
              disabled={subjectKind !== 'ServiceAccount'}
              options={namespaceOptions}
              placeholder={
                subjectKind === 'ServiceAccount'
                  ? t('pages.k8s.forms.common.namespace.required')
                  : t('pages.k8s.forms.binding.subject.namespace.notNeeded')
              }
              showSearch={{ filterOption: filterByValue }}
              onChange={() =>
                form.setFieldValue(['subjects', fieldName, 'name'], undefined)
              }
            />
          </Form.Item>
        );
      }}
    </Form.Item>
  );

  const renderSubjectSettings = () => (
    <>
      <div className={styles.sectionTitle}>
        {t('pages.k8s.forms.binding.subjects')}
      </div>
      <div className={styles.subjectHint}>
        {t('pages.k8s.forms.binding.subject.hint.intro')}{' '}
        <code>{t('pages.k8s.forms.binding.subject.hint.userPattern')}</code>
        {t('pages.k8s.forms.binding.subject.hint.roleGroup')}{' '}
        <code>{t('pages.k8s.forms.binding.subject.hint.rolePattern')}</code>
        {t('pages.k8s.forms.binding.subject.hint.outro')}
      </div>
      <Form.List name="subjects">
        {(fields, { add, remove }) => (
          <>
            <div className={styles.subjectStack}>
              {fields.map((field) => (
                <div className={styles.subjectRow} key={field.key}>
                  <Form.Item
                    name={[field.name, 'kind']}
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: t('pages.k8s.forms.common.type.required'),
                      },
                    ]}
                  >
                    <Select
                      className={styles.subjectTypeField}
                      options={SUBJECT_KIND_OPTIONS}
                      placeholder={t(
                        'pages.k8s.forms.binding.subject.kind.placeholder',
                      )}
                      onChange={(subjectKind: BindingSubjectKind) => {
                        form.setFieldValue(
                          ['subjects', field.name, 'name'],
                          undefined,
                        );
                        form.setFieldValue(
                          ['subjects', field.name, 'namespace'],
                          subjectKind === 'ServiceAccount'
                            ? subjectNamespace
                            : undefined,
                        );
                      }}
                    />
                  </Form.Item>
                  {renderSubjectNamespaceField(field.name)}
                  {renderSubjectNameField(field.name)}
                  <Button
                    aria-label={t('pages.k8s.forms.binding.subject.delete')}
                    className={styles.subjectDeleteButton}
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => {
                      if (fields.length <= 1) {
                        form.setFieldValue(
                          ['subjects', field.name],
                          createSubjectItem({ namespace: subjectNamespace }),
                        );
                        return;
                      }
                      remove(field.name);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className={styles.subjectFooter}>
              <Button
                onClick={() =>
                  add(createSubjectItem({ namespace: subjectNamespace }))
                }
              >
                <PlusOutlined />
                {t('pages.k8s.forms.binding.subject.add')}
              </Button>
            </div>
          </>
        )}
      </Form.List>
    </>
  );

  const renderAdvancedSettings = () => (
    <div className={styles.advancedStack}>
      <div>
        <div className={styles.advancedSectionTitle}>
          {t('pages.k8s.forms.common.metadata')}
        </div>
        <div className={styles.advancedOption}>
          <CollapsibleField
            description={t('pages.k8s.forms.binding.metadata.description')}
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
                    keyPlaceholder={t('pages.k8s.forms.binding.annotationKey')}
                    minRows={1}
                    valuePlaceholder={t(
                      'pages.k8s.forms.binding.annotationValue',
                    )}
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
    renderRoleRefSettings,
    renderSubjectSettings,
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
        title={t('pages.k8s.forms.binding.title', { kind: bindingType })}
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
          title={t('pages.k8s.forms.binding.title', { kind: bindingType })}
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateBindingDrawer;
