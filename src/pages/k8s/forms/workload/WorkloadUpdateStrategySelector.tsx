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
import { useT } from '@/utils/i18n';
import { INT_OR_PERCENT_PATTERN } from './helpers';
import type { WorkloadKind, WorkloadUpdateStrategyType } from './types';

type StrategyOption = {
  titleId: string;
  value: WorkloadUpdateStrategyType;
  descriptionId: string;
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
  titleId: 'pages.k8s.forms.workload.updateStrategy.rolling',
  value: 'RollingUpdate',
  descriptionId: 'pages.k8s.forms.workload.updateStrategy.rolling.description',
};

const recreateStrategy: StrategyOption = {
  titleId: 'pages.k8s.forms.workload.updateStrategy.recreate',
  value: 'Recreate',
  descriptionId: 'pages.k8s.forms.workload.updateStrategy.recreate.description',
};

const onDeleteStrategy: StrategyOption = {
  titleId: 'pages.k8s.forms.workload.updateStrategy.onDelete',
  value: 'OnDelete',
  descriptionId: 'pages.k8s.forms.workload.updateStrategy.onDelete.description',
};

const WorkloadUpdateStrategySelector = ({
  form,
  type,
  label,
  strategyName = 'updateStrategyType',
  maxUnavailableName = 'maxUnavailable',
  maxSurgeName = 'maxSurge',
  minReadySecondsName = 'minReadySeconds',
  marginTop,
  updatePartitionName = 'updatePartition',
}: WorkloadUpdateStrategySelectorProps) => {
  const { styles } = useStyles();
  const t = useT();
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
        <span className={styles.strategyTitle}>{t(option.titleId)}</span>
        <span className={styles.strategyDescription}>
          {t(option.descriptionId)}
        </span>
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
        <span>{label ?? t('pages.k8s.form.strategy')}</span>
        <Tooltip title={t('pages.k8s.forms.workload.updateStrategy.tip')}>
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
            <span>
              {t('pages.k8s.forms.workload.updateStrategy.rollingSettings')}
            </span>
          </div>
          <div className={styles.rollingSettingsBody}>
            <Row gutter={16}>
              <Col
                span={type === 'Deployment' || type === 'DaemonSet' ? 12 : 24}
              >
                <Form.Item
                  extra={t(
                    'pages.k8s.forms.workload.updateStrategy.maxUnavailable.extra',
                  )}
                  label={t(
                    'pages.k8s.forms.workload.updateStrategy.maxUnavailable',
                  )}
                  name={maxUnavailableName}
                  rules={[
                    {
                      required: true,
                      message: t(
                        'pages.k8s.forms.workload.updateStrategy.maxUnavailable.required',
                      ),
                    },
                    {
                      pattern: INT_OR_PERCENT_PATTERN,
                      message: t(
                        'pages.k8s.forms.workload.updateStrategy.intOrPercent',
                      ),
                    },
                  ]}
                >
                  <Input placeholder="25%" />
                </Form.Item>
              </Col>
              {type === 'Deployment' && (
                <Col span={12}>
                  <Form.Item
                    tooltip={t(
                      'pages.k8s.forms.workload.updateStrategy.maxSurge.tip',
                    )}
                    label={t(
                      'pages.k8s.forms.workload.updateStrategy.maxSurge',
                    )}
                    name={maxSurgeName}
                    rules={[
                      {
                        required: true,
                        message: t(
                          'pages.k8s.forms.workload.updateStrategy.maxSurge.required',
                        ),
                      },
                      {
                        pattern: INT_OR_PERCENT_PATTERN,
                        message: t(
                          'pages.k8s.forms.workload.updateStrategy.intOrPercent',
                        ),
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
                    extra={t(
                      'pages.k8s.forms.workload.updateStrategy.minReadySeconds.extra',
                    )}
                    label={t(
                      'pages.k8s.forms.workload.updateStrategy.minReadySeconds',
                    )}
                    name={minReadySecondsName}
                    rules={[
                      {
                        required: true,
                        message: t(
                          'pages.k8s.forms.workload.updateStrategy.minReadySeconds.required',
                        ),
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
            <span>
              {t('pages.k8s.forms.workload.updateStrategy.rollingSettings')}
            </span>
          </div>
          <div className={styles.rollingSettingsBody}>
            <Form.Item
              extra={t(
                'pages.k8s.forms.workload.updateStrategy.partition.extra',
              )}
              label={t('pages.k8s.forms.workload.updateStrategy.partition')}
              name={updatePartitionName}
              rules={[
                {
                  required: true,
                  message: t(
                    'pages.k8s.forms.workload.updateStrategy.partition.required',
                  ),
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
