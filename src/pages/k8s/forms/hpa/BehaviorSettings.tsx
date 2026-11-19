import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
} from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import ResourceMetadataFields from '../shared/ResourceMetadataFields';
import { createHpaScalingPolicyItem } from './helpers';
import type {
  CreateHorizontalPodAutoscalerFormValues,
  HpaScalingPolicyItem,
  HpaScalingPolicyType,
  HpaScalingSelectPolicy,
} from './types';

const SELECT_POLICY_OPTIONS: {
  label: string;
  value: HpaScalingSelectPolicy;
}[] = [
  { label: 'Max', value: 'Max' },
  { label: 'Min', value: 'Min' },
  { label: 'Disabled', value: 'Disabled' },
];

const SCALING_POLICY_OPTIONS: { label: string; value: HpaScalingPolicyType }[] =
  [
    { label: 'Pod 数量', value: 'Pods' },
    { label: '百分比', value: 'Percent' },
  ];

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  option: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
  },
  optionHeaderButton: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
    width: '100%',
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  headerIcon: {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    marginTop: 2,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: `14px`,
    borderRadius: token.borderRadiusSM,
  },
  metadataBody: {
    marginTop: 14,
    borderRadius: token.borderRadiusSM,
  },
  fieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  policyRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  policyRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(150px, 0.8fr) minmax(120px, 0.8fr) minmax(150px, 0.8fr) 40px',
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
  policyItem: {
    '&&': {
      marginBottom: 0,
    },

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  deleteButton: {
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
}));

type BehaviorSettingsProps = {
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>;
};

type ScalingRuleConfig = {
  enabledName: keyof CreateHorizontalPodAutoscalerFormValues;
  policiesName: keyof CreateHorizontalPodAutoscalerFormValues;
  selectPolicyName: keyof CreateHorizontalPodAutoscalerFormValues;
  stabilizationWindowSecondsName: keyof CreateHorizontalPodAutoscalerFormValues;
  toleranceName: keyof CreateHorizontalPodAutoscalerFormValues;
  title: string;
  description: string;
};

const POLICY_NUMBER_RULES = [
  {
    required: true,
    message: '请输入策略值',
  },
  {
    type: 'number' as const,
    min: 1,
    message: '策略值不能小于 1',
  },
];

const PERIOD_NUMBER_RULES = [
  {
    required: true,
    message: '请输入周期秒数',
  },
  {
    type: 'number' as const,
    min: 1,
    max: 1800,
    message: '周期范围为 1-1800 秒',
  },
];

const ScalingPolicyList = ({
  name,
}: {
  name: keyof CreateHorizontalPodAutoscalerFormValues;
}) => {
  const { styles } = useStyles();

  return (
    <Form.List
      name={name}
      rules={[
        {
          validator: async (_, value?: HpaScalingPolicyItem[]) => {
            if (value?.length) {
              return;
            }
            throw new Error('请至少添加一条伸缩策略');
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          <div className={styles.policyRows}>
            {fields.map((field) => (
              <div className={styles.policyRow} key={field.key}>
                <Form.Item
                  className={styles.policyItem}
                  name={[field.name, 'type']}
                  rules={[{ required: true, message: '请选择策略类型' }]}
                >
                  <Select
                    options={SCALING_POLICY_OPTIONS}
                    placeholder="策略类型"
                  />
                </Form.Item>
                <Form.Item
                  className={styles.policyItem}
                  name={[field.name, 'value']}
                  rules={POLICY_NUMBER_RULES}
                >
                  <InputNumber
                    min={1}
                    placeholder="策略值"
                    precision={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  className={styles.policyItem}
                  name={[field.name, 'periodSeconds']}
                  rules={PERIOD_NUMBER_RULES}
                >
                  <InputNumber
                    min={1}
                    max={1800}
                    placeholder="周期秒数"
                    precision={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Button
                  aria-label="删除伸缩策略"
                  className={styles.deleteButton}
                  disabled={fields.length <= 1}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => remove(field.name)}
                />
              </div>
            ))}
          </div>
          <Form.ErrorList errors={errors} />
          <div className={styles.footer}>
            <Button onClick={() => add(createHpaScalingPolicyItem())}>
              <PlusOutlined />
              添加策略
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
};

const ScalingRuleFields = ({
  config,
  enabled,
}: {
  config: ScalingRuleConfig;
  enabled?: boolean;
}) => {
  const { styles } = useStyles();

  return (
    <div className={styles.option}>
      <div className={styles.optionHeader}>
        <Form.Item
          className={styles.checkbox}
          name={config.enabledName}
          valuePropName="checked"
        >
          <Checkbox aria-label={config.title} />
        </Form.Item>
        <span>
          <div className={styles.title}>{config.title}</div>
          <div className={styles.description}>{config.description}</div>
        </span>
      </div>
      {enabled && (
        <div className={styles.body}>
          <div>
            <div className={styles.fieldLabel}>伸缩参数</div>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="策略选择" name={config.selectPolicyName}>
                  <Select options={SELECT_POLICY_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="稳定窗口"
                  name={config.stabilizationWindowSecondsName}
                  rules={[
                    {
                      type: 'number',
                      min: 0,
                      max: 3600,
                      message: '稳定窗口范围为 0-3600 秒',
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={3600}
                    placeholder="秒"
                    precision={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="容忍阈值"
                  name={config.toleranceName}
                  tooltip="写入 behavior.scaleUp/scaleDown.tolerance，可填写如 0.1。"
                >
                  <Input placeholder="可选，如 0.1" />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <div>
            <div className={styles.fieldLabel}>伸缩策略</div>
            <ScalingPolicyList name={config.policiesName} />
          </div>
        </div>
      )}
    </div>
  );
};

const BehaviorSettings = ({ form }: BehaviorSettingsProps) => {
  const { styles } = useStyles();
  const [metadataOpen, setMetadataOpen] = useState(true);
  const enableScaleUpBehavior = Form.useWatch('enableScaleUpBehavior', form);
  const enableScaleDownBehavior = Form.useWatch(
    'enableScaleDownBehavior',
    form,
  );

  return (
    <div className={styles.stack}>
      <div>
        <div className={styles.sectionTitle}>伸缩行为</div>
        <div className={styles.stack}>
          <ScalingRuleFields
            config={{
              enabledName: 'enableScaleUpBehavior',
              policiesName: 'scaleUpPolicies',
              selectPolicyName: 'scaleUpSelectPolicy',
              stabilizationWindowSecondsName:
                'scaleUpStabilizationWindowSeconds',
              toleranceName: 'scaleUpTolerance',
              title: '扩容策略',
              description: '控制副本数上升时的选择策略、稳定窗口和变化速率。',
            }}
            enabled={enableScaleUpBehavior}
          />
          <ScalingRuleFields
            config={{
              enabledName: 'enableScaleDownBehavior',
              policiesName: 'scaleDownPolicies',
              selectPolicyName: 'scaleDownSelectPolicy',
              stabilizationWindowSecondsName:
                'scaleDownStabilizationWindowSeconds',
              toleranceName: 'scaleDownTolerance',
              title: '缩容策略',
              description: '控制副本数下降时的选择策略、稳定窗口和变化速率。',
            }}
            enabled={enableScaleDownBehavior}
          />
        </div>
      </div>

      <div>
        <div className={styles.sectionTitle}>元数据</div>
        <div className={styles.option}>
          <button
            aria-expanded={metadataOpen}
            className={styles.optionHeaderButton}
            type="button"
            onClick={() => setMetadataOpen((open) => !open)}
          >
            <span className={styles.headerIcon}>
              {metadataOpen ? <UpOutlined /> : <DownOutlined />}
            </span>
            <span>
              <div className={styles.title}>添加元数据</div>
              <div className={styles.description}>为水平伸缩资源添加元数据</div>
            </span>
          </button>
          {metadataOpen && (
            <div className={styles.metadataBody}>
              <ResourceMetadataFields />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BehaviorSettings;
