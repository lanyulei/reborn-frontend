import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  App,
  AutoComplete,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from 'antd';
import { createStyles } from 'antd-style';
import KeyValueEditor from '../shared/KeyValueEditor';
import FormSection from '../shared/ResourceFormSection';
import UnitInputNumber from '../shared/UnitInputNumber';
import {
  createHpaMetricItem,
  createKeyValueItem,
  createMetricSelectorRequirementItem,
  getDefaultTargetType,
} from './helpers';
import type {
  CreateHorizontalPodAutoscalerFormValues,
  HpaMetricItem,
  HpaMetricTargetType,
  HpaMetricType,
  HpaSelectorOperator,
} from './types';

const METRIC_TYPE_OPTIONS: { label: string; value: HpaMetricType }[] = [
  { label: '资源指标', value: 'Resource' },
  { label: '容器资源指标', value: 'ContainerResource' },
  { label: 'Pod 指标', value: 'Pods' },
  { label: '对象指标', value: 'Object' },
  { label: '外部指标', value: 'External' },
];

const RESOURCE_OPTIONS = [
  { label: 'CPU', value: 'cpu' },
  { label: '内存', value: 'memory' },
];

const TARGET_TYPE_LABELS: Record<HpaMetricTargetType, string> = {
  Utilization: '平均利用率',
  AverageValue: '平均值',
  Value: '总量值',
};

const METRIC_TYPE_DESCRIPTIONS: Record<HpaMetricType, string> = {
  Resource: '按 Pod 的 CPU 或内存资源使用情况触发伸缩。',
  ContainerResource: '按指定容器的 CPU 或内存资源使用情况触发伸缩。',
  Pods: '按每个 Pod 上报的自定义指标平均值触发伸缩。',
  Object: '按指定 Kubernetes 对象上的指标触发伸缩。',
  External: '按集群外部系统提供的指标触发伸缩。',
};

const SELECTOR_OPERATOR_OPTIONS: {
  label: string;
  value: HpaSelectorOperator;
}[] = [
  { label: 'In', value: 'In' },
  { label: 'NotIn', value: 'NotIn' },
  { label: 'Exists', value: 'Exists' },
  { label: 'DoesNotExist', value: 'DoesNotExist' },
];

const getTargetTypeOptions = (metricType?: HpaMetricType) => {
  if (metricType === 'Resource' || metricType === 'ContainerResource') {
    return [
      { label: TARGET_TYPE_LABELS.Utilization, value: 'Utilization' },
      { label: TARGET_TYPE_LABELS.AverageValue, value: 'AverageValue' },
    ];
  }
  if (metricType === 'Pods') {
    return [{ label: TARGET_TYPE_LABELS.AverageValue, value: 'AverageValue' }];
  }
  return [
    { label: TARGET_TYPE_LABELS.Value, value: 'Value' },
    { label: TARGET_TYPE_LABELS.AverageValue, value: 'AverageValue' },
  ];
};

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  metricList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  metricCard: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  metricHeader: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
  },
  metricTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  metricDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  metricDelete: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  metricBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: `14px`,
  },
  metricActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: token.marginSM,
  },
  selectorStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  fieldLabel: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  fieldDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  expressionRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  expressionRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(160px, 1fr) minmax(130px, 0.7fr) minmax(180px, 1fr) 40px',
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
  expressionItem: {
    '&&': {
      marginBottom: 0,
    },

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  expressionDelete: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  listError: {
    marginTop: token.marginXS,
    color: token.colorError,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type MetricSettingsProps = {
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>;
};

const isSelectorMetric = (type?: HpaMetricType) =>
  type === 'Pods' || type === 'Object' || type === 'External';

const getMetricTypeLabel = (type?: HpaMetricType) =>
  METRIC_TYPE_OPTIONS.find((item) => item.value === type)?.label || '指标';

const getMetricTypeDescription = (type?: HpaMetricType) =>
  type ? METRIC_TYPE_DESCRIPTIONS[type] : '选择指标来源后配置目标值。';

const getMetricValue = (metrics: HpaMetricItem[] | undefined, index: number) =>
  metrics?.[index] || createHpaMetricItem();

const updateMetricTypeDefaults = (
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>,
  index: number,
  type: HpaMetricType,
) => {
  const metric =
    (form.getFieldValue(['metrics', index]) as HpaMetricItem | undefined) ||
    createHpaMetricItem({ type });
  const targetType = getDefaultTargetType(type);

  form.setFieldValue(['metrics', index], {
    ...metric,
    type,
    targetType,
    resourceName:
      type === 'Resource' || type === 'ContainerResource'
        ? metric.resourceName || 'cpu'
        : metric.resourceName,
    averageUtilization: targetType === 'Utilization' ? 70 : undefined,
  });
};

const updateTargetTypeDefaults = (
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>,
  index: number,
  targetType: HpaMetricTargetType,
) => {
  form.setFieldValue(['metrics', index, 'targetType'], targetType);
  if (targetType === 'Utilization') {
    form.setFieldValue(['metrics', index, 'averageUtilization'], 70);
  }
};

const targetValueRules = [
  {
    required: true,
    message: '请输入目标值',
  },
];

const renderMetricTypeField = (
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>,
  index: number,
) => (
  <Col span={8}>
    <Form.Item
      label="指标类型"
      name={[index, 'type']}
      rules={[{ required: true, message: '请选择指标类型' }]}
    >
      <Select
        options={METRIC_TYPE_OPTIONS}
        placeholder="请选择指标类型"
        onChange={(value) =>
          updateMetricTypeDefaults(form, index, value as HpaMetricType)
        }
      />
    </Form.Item>
  </Col>
);

const renderMetricSourceFields = (
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>,
  index: number,
  metric: HpaMetricItem,
) => {
  if (metric.type === 'Resource' || metric.type === 'ContainerResource') {
    return (
      <Row gutter={16}>
        {renderMetricTypeField(form, index)}
        {metric.type === 'ContainerResource' && (
          <Col span={8}>
            <Form.Item
              label="容器名称"
              name={[index, 'container']}
              rules={[{ required: true, message: '请输入容器名称' }]}
            >
              <Input placeholder="如 nginx" />
            </Form.Item>
          </Col>
        )}
        <Col span={8}>
          <Form.Item
            label="资源名称"
            name={[index, 'resourceName']}
            rules={[{ required: true, message: '请选择资源名称' }]}
          >
            <AutoComplete
              options={RESOURCE_OPTIONS}
              placeholder="请选择资源名称"
            />
          </Form.Item>
        </Col>
      </Row>
    );
  }

  if (metric.type === 'Object') {
    return (
      <>
        <Row gutter={16}>
          {renderMetricTypeField(form, index)}
          <Col span={8}>
            <Form.Item
              label="指标名称"
              name={[index, 'metricName']}
              rules={[{ required: true, message: '请输入指标名称' }]}
            >
              <Input placeholder="如 requests_per_second" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="对象 API 版本"
              name={[index, 'describedObjectApiVersion']}
              rules={[{ required: true, message: '请输入对象 API 版本' }]}
            >
              <Input placeholder="如 apps/v1" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="对象类型"
              name={[index, 'describedObjectKind']}
              rules={[{ required: true, message: '请输入对象类型' }]}
            >
              <Input placeholder="如 Deployment" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="对象名称"
              name={[index, 'describedObjectName']}
              rules={[{ required: true, message: '请输入对象名称' }]}
            >
              <Input placeholder="请输入对象名称" />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <Row gutter={16}>
      {renderMetricTypeField(form, index)}
      <Col span={8}>
        <Form.Item
          label="指标名称"
          name={[index, 'metricName']}
          rules={[{ required: true, message: '请输入指标名称' }]}
        >
          <Input placeholder="如 requests_per_second" />
        </Form.Item>
      </Col>
    </Row>
  );
};

const renderTargetFields = (
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>,
  index: number,
  metric: HpaMetricItem,
) => (
  <Row gutter={16}>
    <Col span={8}>
      <Form.Item
        label="目标类型"
        name={[index, 'targetType']}
        rules={[{ required: true, message: '请选择目标类型' }]}
      >
        <Select
          options={getTargetTypeOptions(metric.type)}
          placeholder="请选择目标类型"
          onChange={(value) =>
            updateTargetTypeDefaults(form, index, value as HpaMetricTargetType)
          }
        />
      </Form.Item>
    </Col>
    {metric.targetType === 'Utilization' && (
      <Col span={8}>
        <Form.Item
          label="平均利用率"
          name={[index, 'averageUtilization']}
          rules={[
            { required: true, message: '请输入平均利用率' },
            {
              type: 'number',
              min: 1,
              max: 100,
              message: '平均利用率范围为 1-100',
            },
          ]}
        >
          <UnitInputNumber min={1} max={100} precision={0} unit="%" />
        </Form.Item>
      </Col>
    )}
    {metric.targetType === 'AverageValue' && (
      <Col span={8}>
        <Form.Item
          label="平均目标值"
          name={[index, 'averageValue']}
          rules={targetValueRules}
        >
          <Input placeholder="如 500m / 512Mi / 100" />
        </Form.Item>
      </Col>
    )}
    {metric.targetType === 'Value' && (
      <Col span={8}>
        <Form.Item
          label="目标值"
          name={[index, 'value']}
          rules={targetValueRules}
        >
          <Input placeholder="如 100" />
        </Form.Item>
      </Col>
    )}
  </Row>
);

const MetricSelectorFields = ({
  index,
  metric,
}: {
  index: number;
  metric: HpaMetricItem;
}) => {
  const { styles } = useStyles();
  const { message } = App.useApp();

  if (!isSelectorMetric(metric.type)) {
    return null;
  }

  return (
    <div className={styles.fieldGroup}>
      <div>
        <div className={styles.fieldLabel}>指标选择器</div>
        <div className={styles.fieldDescription}>
          可选配置，留空时表示不限制指标标签；输出到 metric.selector。
        </div>
      </div>
      <div className={styles.selectorStack}>
        <Form.Item name={[index, 'selectorLabels']}>
          <KeyValueEditor
            addIcon
            addText="添加标签"
            deleteAriaLabel="删除指标标签"
            keyPlaceholder="标签键"
            valuePlaceholder="标签值"
            onAddBlocked={() => message.warning('请先填写已有标签键。')}
            onCreateItem={() => createKeyValueItem()}
          />
        </Form.Item>
        <Form.List name={[index, 'selectorExpressions']}>
          {(fields, { add, remove }) => (
            <>
              <div className={styles.expressionRows}>
                {fields.map((field) => {
                  const expression =
                    metric.selectorExpressions?.[field.name] ||
                    createMetricSelectorRequirementItem();

                  return (
                    <div className={styles.expressionRow} key={field.key}>
                      <Form.Item
                        className={styles.expressionItem}
                        name={[field.name, 'keyName']}
                        rules={[
                          {
                            required: true,
                            message: '请输入表达式键',
                          },
                        ]}
                      >
                        <Input placeholder="表达式键" />
                      </Form.Item>
                      <Form.Item
                        className={styles.expressionItem}
                        name={[field.name, 'operator']}
                        rules={[
                          {
                            required: true,
                            message: '请选择操作符',
                          },
                        ]}
                      >
                        <Select
                          options={SELECTOR_OPERATOR_OPTIONS}
                          placeholder="操作符"
                        />
                      </Form.Item>
                      <Form.Item
                        className={styles.expressionItem}
                        name={[field.name, 'values']}
                        rules={[
                          {
                            validator: async (_, value?: string) => {
                              if (
                                expression.operator !== 'In' &&
                                expression.operator !== 'NotIn'
                              ) {
                                return;
                              }
                              if (value?.trim()) {
                                return;
                              }
                              throw new Error('请输入匹配值');
                            },
                          },
                        ]}
                      >
                        <Input placeholder="多个值用逗号或换行分隔" />
                      </Form.Item>
                      <Button
                        aria-label="删除指标表达式"
                        className={styles.expressionDelete}
                        icon={<DeleteOutlined />}
                        type="text"
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  );
                })}
              </div>
              <div className={styles.footer}>
                <Button
                  onClick={() => add(createMetricSelectorRequirementItem())}
                >
                  <PlusOutlined />
                  添加表达式
                </Button>
              </div>
            </>
          )}
        </Form.List>
      </div>
    </div>
  );
};

const MetricSettings = ({ form }: MetricSettingsProps) => {
  const { styles } = useStyles();
  const metrics = Form.useWatch('metrics', form) as HpaMetricItem[] | undefined;

  return (
    <div className={styles.stack}>
      <FormSection
        description="设置 HPA 可调整的副本数上下限。"
        title="副本范围"
        tooltip="maxReplicas 为必填字段，minReplicas 留空时 Kubernetes 默认按 1 处理。"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              dependencies={['maxReplicas']}
              label="最小副本数"
              name="minReplicas"
              rules={[
                {
                  type: 'number',
                  min: 1,
                  message: '最小副本数不能小于 1',
                },
                ({ getFieldValue }) => ({
                  validator: async (_, value?: number) => {
                    const maxReplicas = getFieldValue('maxReplicas');
                    if (
                      typeof value !== 'number' ||
                      typeof maxReplicas !== 'number' ||
                      value <= maxReplicas
                    ) {
                      return;
                    }
                    throw new Error('最小副本数不能大于最大副本数');
                  },
                }),
              ]}
            >
              <InputNumber
                min={1}
                placeholder="请输入最小副本数"
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              dependencies={['minReplicas']}
              label="最大副本数"
              name="maxReplicas"
              rules={[
                { required: true, message: '请输入最大副本数' },
                {
                  type: 'number',
                  min: 1,
                  message: '最大副本数不能小于 1',
                },
                ({ getFieldValue }) => ({
                  validator: async (_, value?: number) => {
                    const minReplicas = getFieldValue('minReplicas');
                    if (
                      typeof value !== 'number' ||
                      typeof minReplicas !== 'number' ||
                      value >= minReplicas
                    ) {
                      return;
                    }
                    throw new Error('最大副本数不能小于最小副本数');
                  },
                }),
              ]}
            >
              <InputNumber
                min={1}
                placeholder="请输入最大副本数"
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </FormSection>

      <FormSection
        bordered={false}
        description="至少配置一条指标。不同来源会输出到 resource、containerResource、pods、object 或 external 字段。"
        title="伸缩指标"
      >
        <Form.List
          name="metrics"
          rules={[
            {
              validator: async (_, value?: HpaMetricItem[]) => {
                if (value?.length) {
                  return;
                }
                throw new Error('请至少添加一条伸缩指标');
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              <div className={styles.metricList}>
                {fields.map((field, index) => {
                  const metric = getMetricValue(metrics, field.name);

                  return (
                    <div className={styles.metricCard} key={field.key}>
                      <div className={styles.metricHeader}>
                        <div>
                          <div className={styles.metricTitle}>
                            指标 {index + 1} · {getMetricTypeLabel(metric.type)}
                          </div>
                          <div className={styles.metricDescription}>
                            {getMetricTypeDescription(metric.type)}
                          </div>
                        </div>
                        <Button
                          aria-label="删除伸缩指标"
                          className={styles.metricDelete}
                          disabled={fields.length <= 1}
                          icon={<DeleteOutlined />}
                          type="text"
                          onClick={() => remove(field.name)}
                        />
                      </div>
                      <div className={styles.metricBody}>
                        {renderMetricSourceFields(form, field.name, metric)}
                        {renderTargetFields(form, field.name, metric)}
                        <MetricSelectorFields
                          index={field.name}
                          metric={metric}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.metricActions}>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => add(createHpaMetricItem())}
                >
                  添加指标
                </Button>
              </div>
              {errors.length > 0 && (
                <div className={styles.listError}>{errors.join('，')}</div>
              )}
            </>
          )}
        </Form.List>
      </FormSection>
    </div>
  );
};

export default MetricSettings;
