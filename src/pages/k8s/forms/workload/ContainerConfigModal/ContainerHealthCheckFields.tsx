import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, InputNumber, Row } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
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
  title: string;
  description: string;
}[] = [
  {
    name: 'liveness',
    title: '存活检查',
    description: '检查容器是否存活。',
  },
  {
    name: 'readiness',
    title: '就绪检查',
    description: '检查容器是否可以处理请求。',
  },
  {
    name: 'startup',
    title: '启动检查',
    description: '检查容器是否启动成功。',
  },
];

const HANDLER_OPTIONS: {
  label: string;
  value: ContainerProbeHandlerType;
}[] = [
  { label: 'HTTP 请求', value: 'httpGet' },
  { label: '命令', value: 'exec' },
  { label: 'TCP 端口', value: 'tcpSocket' },
];

const TIMING_FIELDS: {
  label: string;
  name: keyof Pick<
    ContainerProbeFormValue,
    | 'initialDelaySeconds'
    | 'timeoutSeconds'
    | 'periodSeconds'
    | 'successThreshold'
    | 'failureThreshold'
  >;
  min: number;
  message: string;
  description: string;
}[] = [
  {
    label: '初始延迟（s）',
    name: 'initialDelaySeconds',
    min: 0,
    message: '初始延迟最小值为 0',
    description: '容器启动后探针启动前的延迟时间。',
  },
  {
    label: '超时时间（s）',
    name: 'timeoutSeconds',
    min: 0,
    message: '超时时间最小值为 0',
    description:
      '探针超时时间。探针超时后，检查将被视为失败。取值必须为整数，最小值为 0。',
  },
  {
    label: '检查间隔（s）',
    name: 'periodSeconds',
    min: 1,
    message: '检查间隔最小值为 1',
    description: '执行检查的时间间隔。取值必须为整数，最小值为 1。',
  },
  {
    label: '成功阈值',
    name: 'successThreshold',
    min: 1,
    message: '成功阈值最小值为 1',
    description:
      '检查失败后再次被视为成功所需的最小连续成功次数。最小值为 1。对于存活探针和启动探针，此参数值必须为 1。',
  },
  {
    label: '失败阈值',
    name: 'failureThreshold',
    min: 1,
    message: '失败阈值最小值为 1',
    description: '检查成功后再次被视为失败所需的最小连续失败次数。最小值为 1。',
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
  const form = Form.useFormInstance();
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
      items={HANDLER_OPTIONS}
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
        label="命令"
        name={getProbeFieldName(probeName, 'command')}
        required
        rules={[{ validator: validateArgListRequired }]}
      >
        <ArgListEditor addText="添加参数" placeholder="例如 cat" />
      </Form.Item>
      <div className={styles.fieldHelp}>
        每项填写命令的一个参数，例如 cat、/tmp/healthy。
      </div>
    </div>
  );

  const renderTcpFields = (probeName: ContainerProbeKind) => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="端口"
          name={getProbeFieldName(probeName, 'port')}
          rules={[
            { required: true, message: '请输入端口' },
            {
              type: 'number',
              min: 1,
              max: 65535,
              message: '端口范围为 1-65535',
            },
          ]}
        >
          <InputNumber
            min={1}
            max={65535}
            placeholder="请输入端口"
            precision={0}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderTimingFields = (probeName: ContainerProbeKind) => (
    <Row className={styles.timing} gutter={[16, 16]}>
      {TIMING_FIELDS.map((field) => (
        <Col key={field.name} span={12}>
          <div className={styles.fieldBlock}>
            <Form.Item
              label={field.label}
              name={getProbeFieldName(probeName, field.name)}
              rules={[
                { required: true, message: `请输入${field.label}` },
                {
                  type: 'number',
                  min: field.min,
                  message: field.message,
                },
              ]}
            >
              <InputNumber
                disabled={
                  field.name === 'successThreshold' && probeName !== 'readiness'
                }
                min={field.min}
                placeholder={`请输入${field.label}`}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div className={styles.fieldHelp}>{field.description}</div>
          </div>
        </Col>
      ))}
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
            aria-label="移除探针"
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
            <div className={styles.probeTitle}>{probe.title}</div>
            {enabled && probeValue ? (
              renderProbeEditor(probe.name, probeValue)
            ) : (
              <button
                className={styles.addProbe}
                type="button"
                onClick={() => addProbe(probe.name)}
              >
                <PlusOutlined />
                添加探针
              </button>
            )}
            <div className={styles.probeDescription}>{probe.description}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ContainerHealthCheckFields;
