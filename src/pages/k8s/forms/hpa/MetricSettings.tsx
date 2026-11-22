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
import type { Translate } from '@/utils/i18n';
import { useT } from '@/utils/i18n';
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

const METRIC_TYPES: HpaMetricType[] = [
  'Resource',
  'ContainerResource',
  'Pods',
  'Object',
  'External',
];

const getMetricTypeOptions = (
  t: Translate,
): { label: string; value: HpaMetricType }[] =>
  METRIC_TYPES.map((value) => ({
    label: t(`pages.k8s.forms.hpa.metricType.${value}`),
    value,
  }));

const getResourceOptions = (t: Translate) => [
  { label: 'CPU', value: 'cpu' },
  { label: t('pages.k8s.metrics.panel.memory'), value: 'memory' },
];

const TARGET_TYPE_LABEL_IDS: Record<HpaMetricTargetType, string> = {
  Utilization: 'pages.k8s.forms.hpa.targetType.Utilization',
  AverageValue: 'pages.k8s.forms.hpa.targetType.AverageValue',
  Value: 'pages.k8s.forms.hpa.targetType.Value',
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

const getTargetTypeOptions = (
  metricType: HpaMetricType | undefined,
  t: Translate,
) => {
  const option = (value: HpaMetricTargetType) => ({
    label: t(TARGET_TYPE_LABEL_IDS[value]),
    value,
  });
  if (metricType === 'Resource' || metricType === 'ContainerResource') {
    return [option('Utilization'), option('AverageValue')];
  }
  if (metricType === 'Pods') {
    return [option('AverageValue')];
  }
  return [option('Value'), option('AverageValue')];
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

const getMetricTypeLabel = (type: HpaMetricType | undefined, t: Translate) =>
  type
    ? t(`pages.k8s.forms.hpa.metricType.${type}`)
    : t('pages.k8s.forms.hpa.metric');

const getMetricTypeDescription = (
  type: HpaMetricType | undefined,
  t: Translate,
) =>
  type
    ? t(`pages.k8s.forms.hpa.metricType.${type}.description`)
    : t('pages.k8s.forms.hpa.metric.description.empty');

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

const renderMetricTypeField = (
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>,
  index: number,
  t: Translate,
) => (
  <Col span={8}>
    <Form.Item
      label={t('pages.k8s.forms.hpa.metricType')}
      name={[index, 'type']}
      rules={[
        {
          required: true,
          message: t('pages.k8s.forms.hpa.metricType.required'),
        },
      ]}
    >
      <Select
        options={getMetricTypeOptions(t)}
        placeholder={t('pages.k8s.forms.hpa.metricType.required')}
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
  t: Translate,
) => {
  if (metric.type === 'Resource' || metric.type === 'ContainerResource') {
    return (
      <Row gutter={16}>
        {renderMetricTypeField(form, index, t)}
        {metric.type === 'ContainerResource' && (
          <Col span={8}>
            <Form.Item
              label={t('pages.k8s.forms.hpa.containerName')}
              name={[index, 'container']}
              rules={[
                {
                  required: true,
                  message: t('pages.k8s.forms.hpa.containerName.required'),
                },
              ]}
            >
              <Input
                placeholder={t('pages.k8s.forms.hpa.containerName.placeholder')}
              />
            </Form.Item>
          </Col>
        )}
        <Col span={8}>
          <Form.Item
            label={t('pages.k8s.forms.hpa.resourceName')}
            name={[index, 'resourceName']}
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.hpa.resourceName.required'),
              },
            ]}
          >
            <AutoComplete
              options={getResourceOptions(t)}
              placeholder={t('pages.k8s.forms.hpa.resourceName.required')}
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
          {renderMetricTypeField(form, index, t)}
          <Col span={8}>
            <Form.Item
              label={t('pages.k8s.forms.hpa.metricName')}
              name={[index, 'metricName']}
              rules={[
                {
                  required: true,
                  message: t('pages.k8s.forms.hpa.metricName.required'),
                },
              ]}
            >
              <Input
                placeholder={t('pages.k8s.forms.hpa.metricName.placeholder')}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('pages.k8s.forms.hpa.objectApiVersion')}
              name={[index, 'describedObjectApiVersion']}
              rules={[
                {
                  required: true,
                  message: t('pages.k8s.forms.hpa.objectApiVersion.required'),
                },
              ]}
            >
              <Input
                placeholder={t('pages.k8s.forms.hpa.apiVersion.placeholder')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('pages.k8s.event.kind')}
              name={[index, 'describedObjectKind']}
              rules={[
                {
                  required: true,
                  message: t('pages.k8s.forms.hpa.objectKind.required'),
                },
              ]}
            >
              <Input
                placeholder={t('pages.k8s.forms.hpa.objectKind.placeholder')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('pages.k8s.form.refName')}
              name={[index, 'describedObjectName']}
              rules={[
                {
                  required: true,
                  message: t('pages.k8s.forms.hpa.objectName.required'),
                },
              ]}
            >
              <Input
                placeholder={t('pages.k8s.forms.hpa.objectName.required')}
              />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <Row gutter={16}>
      {renderMetricTypeField(form, index, t)}
      <Col span={8}>
        <Form.Item
          label={t('pages.k8s.forms.hpa.metricName')}
          name={[index, 'metricName']}
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.hpa.metricName.required'),
            },
          ]}
        >
          <Input
            placeholder={t('pages.k8s.forms.hpa.metricName.placeholder')}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

const renderTargetFields = (
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>,
  index: number,
  metric: HpaMetricItem,
  t: Translate,
) => {
  const targetValueRules = [
    {
      required: true,
      message: t('pages.k8s.forms.hpa.targetValue.required'),
    },
  ];

  return (
    <Row gutter={16}>
      <Col span={8}>
        <Form.Item
          label={t('pages.k8s.forms.hpa.targetType')}
          name={[index, 'targetType']}
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.hpa.targetType.required'),
            },
          ]}
        >
          <Select
            options={getTargetTypeOptions(metric.type, t)}
            placeholder={t('pages.k8s.forms.hpa.targetType.required')}
            onChange={(value) =>
              updateTargetTypeDefaults(
                form,
                index,
                value as HpaMetricTargetType,
              )
            }
          />
        </Form.Item>
      </Col>
      {metric.targetType === 'Utilization' && (
        <Col span={8}>
          <Form.Item
            label={t('pages.k8s.forms.hpa.targetType.Utilization')}
            name={[index, 'averageUtilization']}
            rules={[
              {
                required: true,
                message: t('pages.k8s.forms.hpa.averageUtilization.required'),
              },
              {
                type: 'number',
                min: 1,
                max: 100,
                message: t('pages.k8s.forms.hpa.averageUtilization.range'),
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
            label={t('pages.k8s.forms.hpa.averageValue')}
            name={[index, 'averageValue']}
            rules={targetValueRules}
          >
            <Input
              placeholder={t('pages.k8s.forms.hpa.averageValue.placeholder')}
            />
          </Form.Item>
        </Col>
      )}
      {metric.targetType === 'Value' && (
        <Col span={8}>
          <Form.Item
            label={t('pages.k8s.forms.hpa.value')}
            name={[index, 'value']}
            rules={targetValueRules}
          >
            <Input placeholder={t('pages.k8s.forms.hpa.value.placeholder')} />
          </Form.Item>
        </Col>
      )}
    </Row>
  );
};

const MetricSelectorFields = ({
  index,
  metric,
}: {
  index: number;
  metric: HpaMetricItem;
}) => {
  const t = useT();
  const { styles } = useStyles();
  const { message } = App.useApp();

  if (!isSelectorMetric(metric.type)) {
    return null;
  }

  return (
    <div className={styles.fieldGroup}>
      <div>
        <div className={styles.fieldLabel}>
          {t('pages.k8s.forms.hpa.selector')}
        </div>
        <div className={styles.fieldDescription}>
          {t('pages.k8s.forms.hpa.selector.description')}
        </div>
      </div>
      <div className={styles.selectorStack}>
        <Form.Item name={[index, 'selectorLabels']}>
          <KeyValueEditor
            addIcon
            addText={t('pages.k8s.forms.hpa.selector.addLabel')}
            deleteAriaLabel={t('pages.k8s.forms.hpa.selector.deleteLabel')}
            keyPlaceholder={t('pages.k8s.forms.common.labelKey')}
            valuePlaceholder={t('pages.k8s.forms.common.labelValue')}
            onAddBlocked={() =>
              message.warning(t('pages.k8s.forms.common.labelKeyFirst'))
            }
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
                            message: t(
                              'pages.k8s.forms.hpa.selector.expressionKey.required',
                            ),
                          },
                        ]}
                      >
                        <Input
                          placeholder={t(
                            'pages.k8s.forms.hpa.selector.expressionKey',
                          )}
                        />
                      </Form.Item>
                      <Form.Item
                        className={styles.expressionItem}
                        name={[field.name, 'operator']}
                        rules={[
                          {
                            required: true,
                            message: t(
                              'pages.k8s.forms.hpa.selector.operator.required',
                            ),
                          },
                        ]}
                      >
                        <Select
                          options={SELECTOR_OPERATOR_OPTIONS}
                          placeholder={t(
                            'pages.k8s.forms.hpa.selector.operator',
                          )}
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
                              throw new Error(
                                t(
                                  'pages.k8s.forms.hpa.selector.values.required',
                                ),
                              );
                            },
                          },
                        ]}
                      >
                        <Input
                          placeholder={t(
                            'pages.k8s.forms.hpa.selector.values.placeholder',
                          )}
                        />
                      </Form.Item>
                      <Button
                        aria-label={t(
                          'pages.k8s.forms.hpa.selector.deleteExpression',
                        )}
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
                  {t('pages.k8s.forms.hpa.selector.addExpression')}
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
  const t = useT();
  const { styles } = useStyles();
  const metrics = Form.useWatch('metrics', form) as HpaMetricItem[] | undefined;

  return (
    <div className={styles.stack}>
      <FormSection
        description={t('pages.k8s.forms.hpa.replicas.description')}
        title={t('pages.k8s.forms.hpa.replicas')}
        tooltip={t('pages.k8s.forms.hpa.replicas.tooltip')}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              dependencies={['maxReplicas']}
              label={t('pages.k8s.forms.hpa.minReplicas')}
              name="minReplicas"
              rules={[
                {
                  type: 'number',
                  min: 1,
                  message: t('pages.k8s.forms.hpa.minReplicas.min'),
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
                    throw new Error(
                      t('pages.k8s.forms.hpa.minReplicas.aboveMax'),
                    );
                  },
                }),
              ]}
            >
              <InputNumber
                min={1}
                placeholder={t('pages.k8s.forms.hpa.minReplicas.placeholder')}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              dependencies={['minReplicas']}
              label={t('pages.k8s.forms.hpa.maxReplicas')}
              name="maxReplicas"
              rules={[
                {
                  required: true,
                  message: t('pages.k8s.forms.hpa.maxReplicas.required'),
                },
                {
                  type: 'number',
                  min: 1,
                  message: t('pages.k8s.forms.hpa.maxReplicas.min'),
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
                    throw new Error(
                      t('pages.k8s.forms.hpa.maxReplicas.belowMin'),
                    );
                  },
                }),
              ]}
            >
              <InputNumber
                min={1}
                placeholder={t('pages.k8s.forms.hpa.maxReplicas.required')}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </FormSection>

      <FormSection
        bordered={false}
        description={t('pages.k8s.forms.hpa.metrics.description')}
        title={t('pages.k8s.forms.hpa.step.metrics')}
      >
        <Form.List
          name="metrics"
          rules={[
            {
              validator: async (_, value?: HpaMetricItem[]) => {
                if (value?.length) {
                  return;
                }
                throw new Error(t('pages.k8s.forms.hpa.metrics.required'));
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
                            {t('pages.k8s.forms.hpa.metric.title', {
                              index: index + 1,
                              type: getMetricTypeLabel(metric.type, t),
                            })}
                          </div>
                          <div className={styles.metricDescription}>
                            {getMetricTypeDescription(metric.type, t)}
                          </div>
                        </div>
                        <Button
                          aria-label={t('pages.k8s.forms.hpa.metric.delete')}
                          className={styles.metricDelete}
                          disabled={fields.length <= 1}
                          icon={<DeleteOutlined />}
                          type="text"
                          onClick={() => remove(field.name)}
                        />
                      </div>
                      <div className={styles.metricBody}>
                        {renderMetricSourceFields(form, field.name, metric, t)}
                        {renderTargetFields(form, field.name, metric, t)}
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
                  {t('pages.k8s.forms.hpa.metric.add')}
                </Button>
              </div>
              {errors.length > 0 && (
                <div className={styles.listError}>
                  {errors.join(t('pages.k8s.forms.hpa.errorSeparator'))}
                </div>
              )}
            </>
          )}
        </Form.List>
      </FormSection>
    </div>
  );
};

export default MetricSettings;
