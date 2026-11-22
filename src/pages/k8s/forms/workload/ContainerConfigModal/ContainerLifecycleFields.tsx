import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, InputNumber, Row } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useRef } from 'react';
import { useT } from '@/utils/i18n';
import SegmentedTabs from '../../shared/SegmentedTabs';
import ArgListEditor, { validateArgListRequired } from '../ArgListEditor';
import type {
  ContainerActionFormValue,
  ContainerHandlerType,
  ContainerLifecycleActionName,
  ContainerLifecycleActionsValue,
} from '../types';
import ContainerHttpTargetFields from './ContainerHttpTargetFields';

const ACTION_OPTIONS: {
  name: ContainerLifecycleActionName;
  titleId: string;
  descriptionId: string;
}[] = [
  {
    name: 'postStart',
    titleId: 'pages.k8s.forms.workload.container.lifecycle.postStart',
    descriptionId:
      'pages.k8s.forms.workload.container.lifecycle.postStart.description',
  },
  {
    name: 'preStop',
    titleId: 'pages.k8s.forms.workload.container.lifecycle.preStop',
    descriptionId:
      'pages.k8s.forms.workload.container.lifecycle.preStop.description',
  },
];

const useStyles = createStyles(({ token }) => ({
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  actionTitle: {
    marginBottom: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addAction: {
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
  actionDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  actionEditor: {
    overflow: 'hidden',
    padding: `${token.paddingSM}px ${token.paddingSM}px 0`,
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
  actionFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginXS,
    margin: `${token.marginSM}px -${token.paddingSM}px 0`,
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: `0 0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px`,
    background: token.colorText,
  },
  actionFooterButton: {
    color: token.colorBgContainer,

    '&:hover': {
      background: token.colorFillSecondary,
      color: token.colorBgContainer,
    },
  },
  fieldHelp: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

const getActionName = (actionName: ContainerLifecycleActionName): NamePath => [
  'lifecycleActions',
  actionName,
];

const getActionFieldName = (
  actionName: ContainerLifecycleActionName,
  fieldName: keyof ContainerActionFormValue,
): NamePath => ['lifecycleActions', actionName, fieldName];

const createDefaultActionValue = (
  handlerType: ContainerHandlerType = 'httpGet',
): ContainerActionFormValue => ({
  enabled: true,
  handlerType,
  scheme: 'HTTP',
  path: '/',
  port: 80,
  command: [],
});

const withHandlerDefaults = (
  value: ContainerActionFormValue | undefined,
  handlerType: ContainerHandlerType,
): ContainerActionFormValue => ({
  ...createDefaultActionValue(handlerType),
  ...value,
  enabled: true,
  handlerType,
  scheme: value?.scheme || 'HTTP',
  path: value?.path || '/',
  port: value?.port ?? 80,
  command: value?.command || [],
});

const ContainerLifecycleFields = () => {
  const { styles } = useStyles();
  const t = useT();
  const form = Form.useFormInstance();
  const handlerOptions = useMemo<
    { label: string; value: ContainerHandlerType }[]
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
  const didSeedDefaultActionRef = useRef(false);
  const lifecycleActions =
    (Form.useWatch('lifecycleActions', {
      form,
      preserve: true,
    }) as ContainerLifecycleActionsValue) || {};

  // 首次展开时默认带一个「启动后动作」；已有动作（编辑容器）时不动
  useEffect(() => {
    if (didSeedDefaultActionRef.current) {
      return;
    }

    didSeedDefaultActionRef.current = true;
    // useWatch 首次渲染拿不到值，这里直接读表单里保存的内容
    const storedActions = (form.getFieldValue('lifecycleActions') ||
      {}) as ContainerLifecycleActionsValue;
    const hasEnabledAction = ACTION_OPTIONS.some(
      (action) => storedActions[action.name]?.enabled,
    );

    if (!hasEnabledAction) {
      form.setFieldValue(
        getActionName('postStart'),
        createDefaultActionValue(),
      );
    }
  }, [form]);

  const addAction = (actionName: ContainerLifecycleActionName) => {
    form.setFieldValue(getActionName(actionName), createDefaultActionValue());
  };

  const selectHandler = (
    actionName: ContainerLifecycleActionName,
    handlerType: ContainerHandlerType,
  ) => {
    const current = form.getFieldValue(getActionName(actionName)) as
      | ContainerActionFormValue
      | undefined;

    form.setFieldValue(
      getActionName(actionName),
      withHandlerDefaults(current, handlerType),
    );
  };

  const renderHandlerTabs = (
    actionName: ContainerLifecycleActionName,
    handlerType: ContainerHandlerType,
  ) => (
    <SegmentedTabs
      items={handlerOptions}
      value={handlerType}
      onChange={(value) => selectHandler(actionName, value)}
    />
  );

  const renderHttpFields = (actionName: ContainerLifecycleActionName) => {
    const pathName = getActionFieldName(actionName, 'path');
    const portName = getActionFieldName(actionName, 'port');

    return (
      <ContainerHttpTargetFields
        compactRow
        pathName={pathName}
        portName={portName}
        schemeName={getActionFieldName(actionName, 'scheme')}
      />
    );
  };

  const renderCommandFields = (actionName: ContainerLifecycleActionName) => (
    <>
      <Form.Item
        label={t('pages.k8s.forms.common.command')}
        name={getActionFieldName(actionName, 'command')}
        required
        rules={[{ validator: validateArgListRequired(t) }]}
      >
        <ArgListEditor
          addText={t('pages.k8s.forms.workload.container.args.add')}
          placeholder={t(
            'pages.k8s.forms.workload.container.command.placeholder',
          )}
        />
      </Form.Item>
      <div className={styles.fieldHelp}>
        {t('pages.k8s.forms.workload.container.lifecycle.command.help')}
      </div>
    </>
  );

  const renderTcpFields = (actionName: ContainerLifecycleActionName) => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label={t('pages.k8s.form.port')}
          name={getActionFieldName(actionName, 'port')}
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

  const renderActionEditor = (
    actionName: ContainerLifecycleActionName,
    actionValue: ContainerActionFormValue,
  ) => {
    const handlerType = actionValue.handlerType || 'httpGet';

    return (
      <div className={styles.actionEditor}>
        <div className={styles.editorHeader}>
          {renderHandlerTabs(actionName, handlerType)}
          <Button
            aria-label={t(
              'pages.k8s.forms.workload.container.lifecycle.remove',
            )}
            className={styles.removeButton}
            icon={<DeleteOutlined />}
            type="text"
            onClick={() =>
              form.setFieldValue(getActionName(actionName), undefined)
            }
          />
        </div>
        {handlerType === 'httpGet' && renderHttpFields(actionName)}
        {handlerType === 'exec' && renderCommandFields(actionName)}
        {handlerType === 'tcpSocket' && renderTcpFields(actionName)}
      </div>
    );
  };

  return (
    <div className={styles.actions}>
      {ACTION_OPTIONS.map((action) => {
        const actionValue = lifecycleActions[action.name];
        const enabled = Boolean(actionValue?.enabled);

        return (
          <div key={action.name}>
            <div className={styles.actionTitle}>{t(action.titleId)}</div>
            {enabled && actionValue ? (
              renderActionEditor(action.name, actionValue)
            ) : (
              <button
                className={styles.addAction}
                type="button"
                onClick={() => addAction(action.name)}
              >
                <PlusOutlined />
                {t('pages.k8s.forms.workload.container.lifecycle.add')}
              </button>
            )}
            <div className={styles.actionDescription}>
              {t(action.descriptionId)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContainerLifecycleFields;
