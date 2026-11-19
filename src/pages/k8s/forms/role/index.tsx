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

const STEPS = [
  { title: '基本信息', icon: <AppstoreOutlined /> },
  { title: '权限规则', icon: <SafetyCertificateOutlined /> },
  { title: '高级设置', icon: <SlidersOutlined /> },
];

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateRoleFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (
    index === 0 &&
    values.name &&
    (values.type === 'ClusterRole' || values.namespace)
  ) {
    return '已设置';
  }
  if (index === 1 && hasRulesContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasAdvancedContent(values)) {
    return '已设置';
  }
  return '未设置';
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
      return warn(getPolicyRulesError(formValues));
    }
    if (current === 2) {
      return warn(getAggregationError(formValues));
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

      const error = getRoleManifestError(resource, kind);
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
      !warn(getPolicyRulesError(formValues)) ||
      !warn(getAggregationError(formValues))
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
          tooltip="名称只能包含小写字母、数字、连字符（-）和点（.）"
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            { max: 253, message: '名称最长 253 个字符' },
            {
              pattern: ROLE_NAME_PATTERN,
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
              required: roleType === 'Role',
              message: '请选择命名空间',
            },
          ]}
        >
          <AutoComplete
            disabled={roleType === 'ClusterRole'}
            options={namespaceOptions}
            placeholder={
              roleType === 'ClusterRole'
                ? 'ClusterRole 不需要命名空间'
                : '请选择命名空间'
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
          label="类型"
          name="type"
          rules={[{ required: true, message: '请选择类型' }]}
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
      <div className={styles.ruleSectionTitle}>权限规则</div>
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
                  <Input placeholder="标签键" />
                </Form.Item>
                <Form.Item name={[field.name, 'operator']} noStyle>
                  <Select
                    options={SELECTOR_OPERATOR_OPTIONS}
                    placeholder="操作符"
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
                          placeholder="标签值"
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
                <Button
                  aria-label="删除匹配表达式"
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
              添加匹配表达式
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
          <div className={styles.advancedSectionTitle}>聚合规则</div>
          <div className={styles.advancedOption}>
            <div className={styles.advancedOptionHeader}>
              <Form.Item
                className={styles.advancedCheckbox}
                name="aggregationEnabled"
                valuePropName="checked"
              >
                <Checkbox aria-label="聚合 ClusterRole" />
              </Form.Item>
              <span>
                <div className={styles.advancedTitle}>聚合 ClusterRole</div>
                <div className={styles.advancedDescription}>
                  按标签选择器聚合其他 ClusterRole
                  的权限规则，适合组合多个细粒度角色
                </div>
              </span>
            </div>
            {values.aggregationEnabled && (
              <div
                className={`${styles.advancedMetadataBody} ${styles.aggregationBody}`}
              >
                <div>
                  <div className={styles.advancedFieldLabel}>
                    聚合标签选择器
                  </div>
                  <Form.Item name="aggregationLabels">
                    <KeyValueEditor
                      addIcon={false}
                      addText="添加"
                      deleteAriaLabel="删除匹配标签"
                      keyPlaceholder="标签键"
                      minRows={1}
                      valuePlaceholder="标签值"
                      onAddBlocked={() =>
                        message.warning('请先填写已有匹配标签的键。')
                      }
                      onCreateItem={createMetadataItem}
                    />
                  </Form.Item>
                </div>
                <div>
                  <div className={styles.advancedFieldLabel}>
                    聚合匹配表达式
                  </div>
                  <Form.Item>{renderAggregationExpressions()}</Form.Item>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className={styles.advancedSectionTitle}>元数据</div>
        <div className={styles.advancedOption}>
          <CollapsibleField
            description="为角色资源添加标签和注解，便于筛选、识别和自动化管理"
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
    renderRuleSettings,
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
        title={`创建 ${roleType}`}
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
          title={`创建 ${roleType}`}
          onBack={() => setSubmission(undefined)}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </>
  );
};

export default CreateRoleDrawer;
