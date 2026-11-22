import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, InputNumber, Row } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import { useMemo } from 'react';
import { useT } from '@/utils/i18n';
import SegmentedTabs from '../../shared/SegmentedTabs';
import ArgListEditor, { validateArgListRequired } from '../ArgListEditor';
import type {
  ContainerHealthChecksValue,
  ContainerProbeFormValue,
  ContainerProbeHandlerType,
  ContainerProbeKind,
} from '../types';
import ContainerHttpTargetFields from './ContainerHttpTargetFields';

const PROBE_OPTIONS: {
  name: ContainerProbeKind;
  titleId: string;
  descriptionId: string;
}[] = [
  {
    name: 'liveness',
    titleId: 'pages.k8s.forms.workload.container.probe.liveness',
    descriptionId:
      'pages.k8s.forms.workload.container.probe.liveness.description',
  },
  {
    name: 'readiness',
    titleId: 'pages.k8s.forms.workload.container.probe.readiness',
    descriptionId:
      'pages.k8s.forms.workload.container.probe.readiness.description',
  },
  {
    name: 'startup',
    titleId: 'pages.k8s.forms.workload.container.probe.startup',
    descriptionId:
      'pages.k8s.forms.workload.container.probe.startup.description',
  },
];

const TIMING_FIELDS: {
  labelId: string;
  name: keyof Pick<
    ContainerProbeFormValue,
    | 'initialDelaySeconds'
    | 'timeoutSeconds'
    | 'periodSeconds'
    | 'successThreshold'
    | 'failureThreshold'
  >;
  min: number;
  messageId: string;
  descriptionId: string;
}[] = [
  {
    labelId: 'pages.k8s.forms.workload.container.probe.initialDelay',
    name: 'initialDelaySeconds',
    min: 0,
    messageId: 'pages.k8s.forms.workload.container.probe.initialDelay.min',
    descriptionId:
      'pages.k8s.forms.workload.container.probe.initialDelay.description',
  },
  {
    labelId: 'pages.k8s.forms.workload.container.probe.timeout',
    name: 'timeoutSeconds',
    min: 0,
    messageId: 'pages.k8s.forms.workload.container.probe.timeout.min',
    descriptionId:
      'pages.k8s.forms.workload.container.probe.timeout.description',
  },
  {
    labelId: 'pages.k8s.forms.workload.container.probe.period',
    name: 'periodSeconds',
    min: 1,
    messageId: 'pages.k8s.forms.workload.container.probe.period.min',
    descriptionId:
      'pages.k8s.forms.workload.container.probe.period.description',
  },
  {
    labelId: 'pages.k8s.forms.workload.container.probe.successThreshold',
    name: 'successThreshold',
    min: 1,
    messageId: 'pages.k8s.forms.workload.container.probe.successThreshold.min',
    descriptionId:
      'pages.k8s.forms.workload.container.probe.successThreshold.description',
  },
  {
    labelId: 'pages.k8s.forms.workload.container.probe.failureThreshold',
    name: 'failureThreshold',
    min: 1,
    messageId: 'pages.k8s.forms.workload.container.probe.failureThreshold.min',
    descriptionId:
      'pages.k8s.forms.workload.container.probe.failureThreshold.description',
  },
];

const useStyles = createStyles(({ token }) => ({
  probes: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  probeTitle: {
    marginBottom: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addProbe: {
    display: 'inline-flex',
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: token.marginXS,
    padding: `0 ${token.paddingSM}px`,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    fontSize: token.fontSizeSM,
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },
  },
  probeDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  probeEditor: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: token.marginSM,
    },
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
    marginBottom: token.marginSM,
  },
  removeButton: {
    flexShrink: 0,
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  fieldBlock: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  fieldHelp: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  timing: {
    marginTop: token.marginSM,
  },
}));

const getProbeName = (probeName: ContainerProbeKind): NamePath => [
  'healthChecks',
  probeName,
];

const getProbeFieldName = (
  probeName: ContainerProbeKind,
  fieldName: keyof ContainerProbeFormValue,
): NamePath => ['healthChecks', probeName, fieldName];

const createDefaultProbeValue = (
  handlerType: ContainerProbeHandlerType = 'httpGet',
): ContainerProbeFormValue => ({
  enabled: true,
  handlerType,
  scheme: 'HTTP',
  path: '/',
  port: 80,
  command: [],
  initialDelaySeconds: 0,
  timeoutSeconds: 1,
  periodSeconds: 10,
  successThreshold: 1,
  failureThreshold: 3,
});

const withHandlerDefaults = (
  value: ContainerProbeFormValue | undefined,
  handlerType: ContainerProbeHandlerType,
): ContainerProbeFormValue => ({
  ...createDefaultProbeValue(handlerType),
  ...value,
  enabled: true,
  handlerType,
  scheme: value?.scheme || 'HTTP',
  path: value?.path || '/',
  port: value?.port ?? 80,
  command: value?.command || [],
  initialDelaySeconds: value?.initialDelaySeconds ?? 0,
  timeoutSeconds: value?.timeoutSeconds ?? 1,
  periodSeconds: value?.periodSeconds ?? 10,
  successThreshold: value?.successThreshold ?? 1,
  failureThreshold: value?.failureThreshold ?? 3,
});

const ContainerHealthCheckFields = () => {
  const { styles } = useStyles();
  const t = useT();
  const form = Form.useFormInstance();
  const handlerOptions = useMemo<
    { label: string; value: ContainerProbeHandlerType }[]
  >(
    () => [
      {
        label: t('pages.k8s.forms.workload.container.handler.httpGet'),
        value: 'httpGet',
      },
      { label: t('pages.k8s.forms.common.command'), value: 'exec' },
      {
        label: t('pages.k8s.forms.workload.container.handler.tcpSocket'),
        value: 'tcpSocket',
      },
    ],
    [t],
  );
  const healthChecks =
    (Form.useWatch('healthChecks', {
      form,
      preserve: true,
    }) as ContainerHealthChecksValue) || {};

  const addProbe = (probeName: ContainerProbeKind) => {
    form.setFieldValue(getProbeName(probeName), createDefaultProbeValue());
  };

  const removeProbe = (probeName: ContainerProbeKind) => {
    form.setFieldValue(getProbeName(probeName), undefined);
  };

  const selectHandler = (
    probeName: ContainerProbeKind,
    handlerType: ContainerProbeHandlerType,
  ) => {
    const current = form.getFieldValue(getProbeName(probeName)) as
      | ContainerProbeFormValue
      | undefined;
    const nextValue = withHandlerDefaults(current, handlerType);

    if (probeName !== 'readiness') {
      nextValue.successThreshold = 1;
    }
    form.setFieldValue(getProbeName(probeName), nextValue);
  };

  const renderHandlerTabs = (
    probeName: ContainerProbeKind,
    handlerType: ContainerProbeHandlerType,
  ) => (
    <SegmentedTabs
      items={handlerOptions}
      value={handlerType}
      onChange={(value) => selectHandler(probeName, value)}
    />
  );

  const renderHttpFields = (probeName: ContainerProbeKind) => {
    const pathName = getProbeFieldName(probeName, 'path');
    const portName = getProbeFieldName(probeName, 'port');

    return (
      <ContainerHttpTargetFields
        pathName={pathName}
        portName={portName}
        schemeName={getProbeFieldName(probeName, 'scheme')}
      />
    );
  };

  const renderCommandFields = (probeName: ContainerProbeKind) => (
    <div className={styles.fieldBlock}>
      <Form.Item
        label={t('pages.k8s.forms.common.command')}
        name={getProbeFieldName(probeName, 'command')}
        required
        rules={[{ validator: validateArgListRequired(t) }]}
      >
        <ArgListEditor
          addText={t('pages.k8s.forms.workload.container.args.add')}
          placeholder={t(
            'pages.k8s.forms.workload.container.probe.command.placeholder',
          )}
        />
      </Form.Item>
      <div className={styles.fieldHelp}>
        {t('pages.k8s.forms.workload.container.probe.command.help')}
      </div>
    </div>
  );

  const renderTcpFields = (probeName: ContainerProbeKind) => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label={t('pages.k8s.form.port')}
          name={getProbeFieldName(probeName, 'port')}
          rules={[
            {
              required: true,
              message: t('pages.k8s.forms.common.port.required'),
            },
            {
              type: 'number',
              min: 1,
              max: 65535,
              message: t('pages.k8s.forms.common.port.range'),
            },
          ]}
        >
          <InputNumber
            min={1}
            max={65535}
            placeholder={t('pages.k8s.forms.common.port.required')}
            precision={0}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderTimingFields = (probeName: ContainerProbeKind) => (
    <Row className={styles.timing} gutter={[16, 16]}>
      {TIMING_FIELDS.map((field) => {
        const label = t(field.labelId);
        const requiredMessage = t(
          'pages.k8s.forms.workload.container.probe.timing.required',
          { label },
        );

        return (
          <Col key={field.name} span={12}>
            <div className={styles.fieldBlock}>
              <Form.Item
                label={label}
                name={getProbeFieldName(probeName, field.name)}
                rules={[
                  { required: true, message: requiredMessage },
                  {
                    type: 'number',
                    min: field.min,
                    message: t(field.messageId),
                  },
                ]}
              >
                <InputNumber
                  disabled={
                    field.name === 'successThreshold' &&
                    probeName !== 'readiness'
                  }
                  min={field.min}
                  placeholder={requiredMessage}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <div className={styles.fieldHelp}>{t(field.descriptionId)}</div>
            </div>
          </Col>
        );
      })}
    </Row>
  );

  const renderProbeEditor = (
    probeName: ContainerProbeKind,
    probeValue: ContainerProbeFormValue,
  ) => {
    const handlerType = probeValue.handlerType || 'httpGet';

    return (
      <div className={styles.probeEditor}>
        <div className={styles.editorHeader}>
          {renderHandlerTabs(probeName, handlerType)}
          <Button
            aria-label={t('pages.k8s.forms.workload.container.probe.remove')}
            className={styles.removeButton}
            icon={<DeleteOutlined />}
            type="text"
            onClick={() => removeProbe(probeName)}
          />
        </div>
        {handlerType === 'httpGet' && renderHttpFields(probeName)}
        {handlerType === 'exec' && renderCommandFields(probeName)}
        {handlerType === 'tcpSocket' && renderTcpFields(probeName)}
        {renderTimingFields(probeName)}
      </div>
    );
  };

  return (
    <div className={styles.probes}>
      {PROBE_OPTIONS.map((probe) => {
        const probeValue = healthChecks[probe.name];
        const enabled = Boolean(probeValue?.enabled);

        return (
          <div key={probe.name}>
            <div className={styles.probeTitle}>{t(probe.titleId)}</div>
            {enabled && probeValue ? (
              renderProbeEditor(probe.name, probeValue)
            ) : (
              <button
                className={styles.addProbe}
                type="button"
                onClick={() => addProbe(probe.name)}
              >
                <PlusOutlined />
                {t('pages.k8s.forms.workload.container.probe.add')}
              </button>
            )}
            <div className={styles.probeDescription}>
              {t(probe.descriptionId)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContainerHealthCheckFields;
