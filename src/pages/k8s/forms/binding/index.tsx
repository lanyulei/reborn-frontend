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

const STEPS = [
  { title: '基本信息', icon: <AppstoreOutlined /> },
  { title: '引用角色', icon: <SafetyCertificateOutlined /> },
  { title: '授权主体', icon: <TeamOutlined /> },
  { title: '高级设置', icon: <SlidersOutlined /> },
];

const SUBJECT_NAME_PLACEHOLDER: Record<BindingSubjectKind, string> = {
  ServiceAccount: '请选择或输入 ServiceAccount',
  User: '用户名，例如 reborn:<用户ID>',
  Group: '组名，例如 reborn:role:<角色ID>',
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
) => {
  if (current === index) {
    return '当前';
  }
  if (
    index === 0 &&
    values.name &&
    (values.type === 'ClusterRoleBinding' || values.namespace)
  ) {
    return '已设置';
  }
  if (index === 1 && values.roleKind && values.roleName) {
    return '已设置';
  }
  if (index === 2 && hasSubjectsContent(values)) {
    return '已设置';
  }
  if (index === 3 && hasAdvancedContent(values)) {
    return '已设置';
  }
  return '未设置';
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
      return warn(getSubjectsError(formValues));
    }

    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();

    if (!valid) {
      return;
    }

    setCurrent((step) => Math.min(step + 1, STEPS.length - 1));
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

      const error = getBindingManifestError(resource, kind);
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

    if (!warn(getSubjectsError(formValues))) {
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
          tooltip="名称只能包含小写字母、数字、连字符（-）和点（.）"
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            { max: 253, message: '名称最长 253 个字符' },
            {
              pattern: BINDING_NAME_PATTERN,
              message:
                '名称只能包含小写字母、数字、连字符（-）和点（.），且不能以连字符或点开头结尾',
            },
          ]}
        >
          <Input autoFocus placeholder="请输入名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="命名空间"
          name="namespace"
          rules={[
            {
              required: bindingType === 'RoleBinding',
              message: '请选择命名空间',
            },
          ]}
        >
          <AutoComplete
            disabled={bindingType === 'ClusterRoleBinding'}
            options={namespaceOptions}
            placeholder={
              bindingType === 'ClusterRoleBinding'
                ? 'ClusterRoleBinding 不需要命名空间'
                : '请选择命名空间'
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
          label="类型"
          name="type"
          rules={[{ required: true, message: '请选择类型' }]}
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
          label="引用角色类型"
          name="roleKind"
          rules={[{ required: true, message: '请选择引用角色类型' }]}
          extra={
            bindingType === 'ClusterRoleBinding'
              ? 'ClusterRoleBinding 只能绑定 ClusterRole'
              : 'RoleBinding 可绑定同命名空间 Role 或全集群 ClusterRole'
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
          extra="创建后引用的角色不可修改；可以引用尚未创建的角色。"
          label="引用角色"
          name="roleName"
          rules={[
            { required: true, whitespace: true, message: '请选择引用角色' },
          ]}
        >
          <AutoComplete
            allowClear
            notFoundContent={
              roleKind === 'Role' && !bindingNamespace
                ? '请先选择命名空间'
                : '暂无可选角色'
            }
            options={roleOptions}
            placeholder={
              roleKind === 'Role'
                ? '请选择同命名空间 Role'
                : '请选择 ClusterRole'
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
              { required: true, whitespace: true, message: '请填写主体名称' },
              { max: 253, message: '主体名称最长 253 个字符' },
            ]}
          >
            {subjectKind === 'ServiceAccount' ? (
              <AutoComplete
                allowClear
                className={styles.subjectNameField}
                notFoundContent={
                  namespace ? '暂无可选主体' : '请先选择命名空间'
                }
                options={toOptions(
                  serviceAccountNames[namespace?.trim() || ''] || [],
                )}
                placeholder={SUBJECT_NAME_PLACEHOLDER.ServiceAccount}
                showSearch={{ filterOption: filterByValue }}
              />
            ) : (
              <Input
                allowClear
                className={styles.subjectNameField}
                placeholder={SUBJECT_NAME_PLACEHOLDER[subjectKind]}
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
                message: '请选择命名空间',
              },
            ]}
          >
            <AutoComplete
              className={styles.subjectNamespaceField}
              disabled={subjectKind !== 'ServiceAccount'}
              options={namespaceOptions}
              placeholder={
                subjectKind === 'ServiceAccount'
                  ? '请选择命名空间'
                  : 'User/Group 不需要命名空间'
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
      <div className={styles.sectionTitle}>授权主体</div>
      <div className={styles.subjectHint}>
        User 与 Group 的名称直接填写。本平台访问集群时会模拟为用户{' '}
        <code>reborn:&lt;用户ID&gt;</code>、角色组{' '}
        <code>reborn:role:&lt;角色ID&gt;</code>
        ，给平台用户或角色授权时请按此格式填写。
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
                    rules={[{ required: true, message: '请选择类型' }]}
                  >
                    <Select
                      className={styles.subjectTypeField}
                      options={SUBJECT_KIND_OPTIONS}
                      placeholder="主体类型"
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
                    aria-label="删除授权主体"
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
                添加授权主体
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
        <div className={styles.advancedSectionTitle}>元数据</div>
        <div className={styles.advancedOption}>
          <CollapsibleField
            description="为绑定资源添加标签和注解，便于筛选、识别和自动化管理"
            title="添加元数据"
          >
            <div className={styles.advancedMetadataBody}>
              <div>
                <div className={styles.advancedFieldLabel}>标签</div>
                <Form.Item name="labels">
                  <KeyValueEditor
                    addIcon={false}
                    addText="添加"
                    deleteAriaLabel="删除标签"
                    keyPlaceholder="标签键"
                    minRows={1}
                    valuePlaceholder="标签值"
                    onAddBlocked={() =>
                      message.warning('请先填写已有标签的键。')
                    }
                    onCreateItem={createMetadataItem}
                  />
                </Form.Item>
              </div>
              <div>
                <div className={styles.advancedFieldLabel}>注解</div>
                <Form.Item name="annotations">
                  <KeyValueEditor
                    addIcon={false}
                    addText="添加"
                    deleteAriaLabel="删除注解"
                    keyPlaceholder="注解键"
                    minRows={1}
                    valuePlaceholder="注解值"
                    onAddBlocked={() =>
                      message.warning('请先填写已有注解的键。')
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
          getStepStatusText(current, index, values)
        }
        open
        steps={STEPS}
        title={`创建 ${bindingType}`}
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
          title={`创建 ${bindingType}`}
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateBindingDrawer;
