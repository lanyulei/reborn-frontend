import {
  DownOutlined,
  QuestionCircleOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Col, Form, Input, InputNumber, Row, Tooltip } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { INT_OR_PERCENT_PATTERN } from './helpers';
import type { WorkloadKind, WorkloadUpdateStrategyType } from './types';

type StrategyOption = {
  title: string;
  value: WorkloadUpdateStrategyType;
  description: string;
};

const useStyles = createStyles(({ token }) => ({
  updateStrategy: {
    marginTop: `16px`,
  },
  updateStrategyLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  updateStrategyHelpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: `14px`,
  },
  strategySelect: {
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  strategyOptions: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    left: 0,
    zIndex: 10,
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowSecondary,
  },
  strategyOption: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'minmax(0, 1fr) 24px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `12px 16px`,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',

    '& + &': {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },

    '&:hover': {
      background: token.colorFillQuaternary,
    },
  },
  strategyTitle: {
    display: 'block',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  strategyDescription: {
    display: 'block',
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  strategyArrow: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  rollingSettings: {
    marginTop: token.marginSM,
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  rollingSettingsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: `12px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
  },
  rollingSettingsBody: {
    padding: `12px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillQuaternary,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  partitionInput: {
    width: '100%',
  },
}));

type WorkloadUpdateStrategySelectorProps = {
  form: FormInstance;
  type: WorkloadKind;
  label?: string;
  strategyName?: NamePath;
  maxUnavailableName?: NamePath;
  maxSurgeName?: NamePath;
  minReadySecondsName?: NamePath;
  marginTop?: CSSProperties['marginTop'];
  updatePartitionName?: NamePath;
};

const rollingStrategy: StrategyOption = {
  title: '滚动更新（推荐）',
  value: 'RollingUpdate',
  description:
    '用新容器组副本逐步替换旧容器组副本。升级过程中业务流量会负载均衡到新旧容器组副本上，业务不会中断。',
};

const recreateStrategy: StrategyOption = {
  title: '同时更新',
  value: 'Recreate',
  description: '删除全部旧容器组副本再创建新容器组副本。升级过程中业务会中断。',
};

const onDeleteStrategy: StrategyOption = {
  title: '删除容器组时更新',
  value: 'OnDelete',
  description: '需要手动删除容器组副本才可对其进行更新。',
};

const WorkloadUpdateStrategySelector = ({
  form,
  type,
  label = '更新策略',
  strategyName = 'updateStrategyType',
  maxUnavailableName = 'maxUnavailable',
  maxSurgeName = 'maxSurge',
  minReadySecondsName = 'minReadySeconds',
  marginTop,
  updatePartitionName = 'updatePartition',
}: WorkloadUpdateStrategySelectorProps) => {
  const { styles } = useStyles();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const updateStrategyType =
    (Form.useWatch(strategyName, form) as WorkloadUpdateStrategyType) ||
    'RollingUpdate';
  const strategyOptions: StrategyOption[] = useMemo(
    () =>
      type === 'Deployment'
        ? [rollingStrategy, recreateStrategy]
        : type === 'StatefulSet'
          ? [rollingStrategy, onDeleteStrategy]
          : [rollingStrategy, onDeleteStrategy],
    [type],
  );
  const selectedStrategy =
    strategyOptions.find((option) => option.value === updateStrategyType) ||
    strategyOptions[0];

  useEffect(() => {
    if (
      !strategyOptions.some(
        (option) => option.value === form.getFieldValue(strategyName),
      )
    ) {
      form.setFieldValue(strategyName, 'RollingUpdate');
      setStrategyOpen(false);
    }
  }, [form, strategyName, strategyOptions]);

  const selectStrategy = (value: WorkloadUpdateStrategyType) => {
    form.setFieldValue(strategyName, value);
    setStrategyOpen(false);
  };

  const renderStrategyOption = (option: StrategyOption, showArrow: boolean) => (
    <button
      className={styles.strategyOption}
      key={option.value}
      type="button"
      onClick={() =>
        showArrow && strategyOptions.length > 1
          ? setStrategyOpen((open) => !open)
          : selectStrategy(option.value)
      }
    >
      <span>
        <span className={styles.strategyTitle}>{option.title}</span>
        <span className={styles.strategyDescription}>{option.description}</span>
      </span>
      {showArrow && strategyOptions.length > 1 && (
        <span className={styles.strategyArrow}>
          {strategyOpen ? <UpOutlined /> : <DownOutlined />}
        </span>
      )}
    </button>
  );

  return (
    <div
      className={styles.updateStrategy}
      style={marginTop !== undefined ? { marginTop } : undefined}
    >
      <div className={styles.updateStrategyLabel}>
        <span>{label}</span>
        <Tooltip title="配置工作负载更新容器组副本时采用的策略">
          <QuestionCircleOutlined className={styles.updateStrategyHelpIcon} />
        </Tooltip>
      </div>
      <Form.Item name={strategyName} hidden>
        <Input />
      </Form.Item>
      <div className={styles.strategySelect}>
        {renderStrategyOption(selectedStrategy, true)}
        {strategyOpen && (
          <div className={styles.strategyOptions}>
            {strategyOptions
              .filter((option) => option.value !== selectedStrategy.value)
              .map((option) => renderStrategyOption(option, false))}
          </div>
        )}
      </div>

      {updateStrategyType === 'RollingUpdate' && type !== 'StatefulSet' && (
        <div className={styles.rollingSettings}>
          <div className={styles.rollingSettingsTitle}>
            <span>滚动更新设置</span>
          </div>
          <div className={styles.rollingSettingsBody}>
            <Row gutter={16}>
              <Col
                span={type === 'Deployment' || type === 'DaemonSet' ? 12 : 24}
              >
                <Form.Item
                  extra="更新过程中允许的不可用容器组副本的最大数量或百分比。"
                  label="最大不可用容器组数量"
                  name={maxUnavailableName}
                  rules={[
                    {
                      required: true,
                      message: '请输入最大不可用容器组数量',
                    },
                    {
                      pattern: INT_OR_PERCENT_PATTERN,
                      message: '请输入整数或百分比，例如 1 或 25%',
                    },
                  ]}
                >
                  <Input placeholder="25%" />
                </Form.Item>
              </Col>
              {type === 'Deployment' && (
                <Col span={12}>
                  <Form.Item
                    tooltip="更新过程中允许的多余容器组副本的最大数量或百分比"
                    label="最大多余容器组数量"
                    name={maxSurgeName}
                    rules={[
                      {
                        required: true,
                        message: '请输入最大多余容器组数量',
                      },
                      {
                        pattern: INT_OR_PERCENT_PATTERN,
                        message: '请输入整数或百分比，例如 1 或 25%',
                      },
                    ]}
                  >
                    <Input placeholder="25%" />
                  </Form.Item>
                </Col>
              )}
              {type === 'DaemonSet' && (
                <Col span={12}>
                  <Form.Item
                    extra="容器组副本被视为就绪所需要的最短稳定运行时长。"
                    label="容器组就绪最短运行时长（s）"
                    name={minReadySecondsName}
                    rules={[
                      {
                        required: true,
                        message: '请输入容器组就绪最短运行时长',
                      },
                    ]}
                  >
                    <InputNumber
                      className={styles.partitionInput}
                      min={0}
                      precision={0}
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </div>
        </div>
      )}

      {updateStrategyType === 'RollingUpdate' && type === 'StatefulSet' && (
        <div className={styles.rollingSettings}>
          <div className={styles.rollingSettingsTitle}>
            <span>滚动更新设置</span>
          </div>
          <div className={styles.rollingSettingsBody}>
            <Form.Item
              extra="设置一个分组序号以将容器组副本分成两组。更新有状态副本集时，只有序号大于或等于分组序号的容器组副本会被更新。"
              label="容器组副本分组序号"
              name={updatePartitionName}
              rules={[
                {
                  required: true,
                  message: '请输入容器组副本分组序号',
                },
              ]}
            >
              <InputNumber
                className={styles.partitionInput}
                min={0}
                precision={0}
              />
            </Form.Item>
          </div>
        </div>
      )}
    </div>
  );
};

export type { WorkloadUpdateStrategySelectorProps };
export default WorkloadUpdateStrategySelector;
