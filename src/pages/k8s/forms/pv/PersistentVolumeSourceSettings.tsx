import {
  ApiOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  HddOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, Col, Form, Input, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useT } from '@/utils/i18n';
import KeyValueEditor from '../shared/KeyValueEditor';
import ResourceFormSection from '../shared/ResourceFormSection';
import type { StringListEditorItem } from '../shared/StringListEditor';
import StringListEditor from '../shared/StringListEditor';
import { createKeyValueItem, createStringItem } from './helpers';
import type {
  CreatePersistentVolumeFormValues,
  PersistentVolumeNodeSelectorOperator,
  PersistentVolumeSourceType,
} from './types';

const useStyles = createStyles(({ token }) => ({
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '& > .ant-form-item': {
      marginBottom: 0,
    },
  },
  compactField: {
    maxWidth: 456,

    '.ant-form-item': {
      marginBottom: token.marginMD,
    },

    '.ant-form-item:last-child': {
      marginBottom: 0,
    },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  sourceOption: {
    display: 'grid',
    gridTemplateColumns: '34px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginMD,
    width: '100%',
    padding: `${token.paddingXXS}px 0`,
  },
  sourceIcon: {
    display: 'inline-flex',
    width: 30,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorTextSecondary,
    fontSize: 28,
  },
  sourceTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  sourceDescription: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    whiteSpace: 'normal',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    marginTop: token.marginMD,
  },
}));

type VolumeSourceOption = {
  description: string;
  icon: ReactNode;
  label: string;
  value: PersistentVolumeSourceType;
};

type PersistentVolumeSourceSettingsProps = {
  form: FormInstance<CreatePersistentVolumeFormValues>;
  /** 集群节点名称（Local 卷节点亲和性匹配值的候选项） */
  nodeNames: string[];
};

const nodeAffinityOperatorOptions = [
  { label: 'In', value: 'In' },
  { label: 'NotIn', value: 'NotIn' },
  { label: 'Exists', value: 'Exists' },
  { label: 'DoesNotExist', value: 'DoesNotExist' },
  { label: 'Gt', value: 'Gt' },
  { label: 'Lt', value: 'Lt' },
];

const operatorsWithValues: PersistentVolumeNodeSelectorOperator[] = [
  'Gt',
  'In',
  'Lt',
  'NotIn',
];

const VolumeSourceOptionLabel = ({
  description,
  icon,
  label,
}: VolumeSourceOption) => {
  const { styles } = useStyles();

  return (
    <div className={styles.sourceOption}>
      <span className={styles.sourceIcon}>{icon}</span>
      <span>
        <div className={styles.sourceTitle}>{label}</div>
        <div className={styles.sourceDescription}>{description}</div>
      </span>
    </div>
  );
};

const PersistentVolumeSourceSettings = ({
  form,
  nodeNames,
}: PersistentVolumeSourceSettingsProps) => {
  const { styles } = useStyles();
  const t = useT();
  const { message } = App.useApp();
  const booleanOptions = useMemo(
    () => [
      { label: t('pages.k8s.forms.common.yes'), value: 'true' },
      { label: t('pages.k8s.forms.common.no'), value: 'false' },
    ],
    [t],
  );
  const hostPathTypeOptions = useMemo(
    () => [
      { label: t('pages.k8s.forms.pv.hostPathType.unspecified'), value: '' },
      { label: 'DirectoryOrCreate', value: 'DirectoryOrCreate' },
      { label: 'Directory', value: 'Directory' },
      { label: 'FileOrCreate', value: 'FileOrCreate' },
      { label: 'File', value: 'File' },
      { label: 'Socket', value: 'Socket' },
      { label: 'CharDevice', value: 'CharDevice' },
      { label: 'BlockDevice', value: 'BlockDevice' },
    ],
    [t],
  );
  const sourceOptions = useMemo<VolumeSourceOption[]>(
    () => [
      {
        description: t('pages.k8s.forms.pv.source.hostPath.desc'),
        icon: <HddOutlined />,
        label: 'HostPath',
        value: 'hostPath',
      },
      {
        description: t('pages.k8s.forms.pv.source.local.desc'),
        icon: <DatabaseOutlined />,
        label: 'Local',
        value: 'local',
      },
      {
        description: t('pages.k8s.forms.pv.source.nfs.desc'),
        icon: <CloudServerOutlined />,
        label: 'NFS',
        value: 'nfs',
      },
      {
        description: t('pages.k8s.forms.pv.source.csi.desc'),
        icon: <ApiOutlined />,
        label: 'CSI',
        value: 'csi',
      },
    ],
    [t],
  );
  const sourceType = Form.useWatch('volumeSourceType', form) || 'hostPath';
  const nodeAffinityOperator =
    Form.useWatch('nodeAffinityOperator', form) || 'In';
  const showNodeAffinityValues =
    operatorsWithValues.includes(nodeAffinityOperator);

  useEffect(() => {
    if (sourceType !== 'local' || !showNodeAffinityValues) {
      return;
    }

    const values = form.getFieldValue('nodeAffinityValues') || [];
    if (values.length === 0) {
      form.setFieldValue('nodeAffinityValues', [createStringItem()]);
    }
  }, [form, showNodeAffinityValues, sourceType]);

  const handleSourceChange = (nextSourceType: PersistentVolumeSourceType) => {
    form.setFieldsValue({
      volumeSourceType: nextSourceType,
      ...(nextSourceType === 'local'
        ? {
            nodeAffinityKey:
              form.getFieldValue('nodeAffinityKey') || 'kubernetes.io/hostname',
            nodeAffinityOperator:
              form.getFieldValue('nodeAffinityOperator') || 'In',
          }
        : {}),
    });
    form.setFields(
      (
        [
          'csiDriver',
          'csiVolumeHandle',
          'hostPath',
          'localPath',
          'nfsPath',
          'nfsServer',
          'nodeAffinityKey',
          'nodeAffinityValues',
        ] as const
      ).map((name) => ({
        name,
        errors: [],
      })),
    );
  };

  const handleNodeAffinityOperatorChange = (
    operator: PersistentVolumeNodeSelectorOperator,
  ) => {
    form.setFieldValue('nodeAffinityOperator', operator);
    if (!operatorsWithValues.includes(operator)) {
      form.setFieldValue('nodeAffinityValues', []);
      return;
    }

    const values = form.getFieldValue('nodeAffinityValues') || [];
    if (values.length === 0) {
      form.setFieldValue('nodeAffinityValues', [createStringItem()]);
    }
  };

  const addNodeAffinityValue = (nodeName: string) => {
    const items: StringListEditorItem[] =
      form.getFieldValue('nodeAffinityValues') || [];
    if (items.some((item) => item.value.trim() === nodeName)) {
      return;
    }
    const filled = items.filter((item) => item.value.trim());
    form.setFieldValue('nodeAffinityValues', [
      ...filled,
      createStringItem(nodeName),
    ]);
    form.setFields([{ name: 'nodeAffinityValues', errors: [] }]);
  };

  const renderSourceFields = () => {
    if (sourceType === 'nfs') {
      return (
        <div className={styles.fieldGroup}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.pv.nfs.server')}
                name="nfsServer"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.pv.nfs.server.required'),
                  },
                ]}
              >
                <Input
                  placeholder={t('pages.k8s.forms.pv.nfs.server.placeholder')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.pv.nfs.path')}
                name="nfsPath"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.pv.nfs.path.required'),
                  },
                ]}
              >
                <Input
                  placeholder={t('pages.k8s.forms.pv.nfs.path.placeholder')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.form.readOnly')}
                name="nfsReadOnly"
              >
                <Select
                  options={booleanOptions}
                  placeholder={t('pages.k8s.forms.common.select')}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      );
    }

    if (sourceType === 'csi') {
      return (
        <div className={styles.fieldGroup}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.pv.csi.driver')}
                name="csiDriver"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.pv.csi.driver.required'),
                  },
                ]}
              >
                <Input
                  placeholder={t('pages.k8s.forms.pv.csi.driver.placeholder')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.pv.csi.volumeHandle')}
                name="csiVolumeHandle"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.pv.csi.volumeHandle.required'),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    'pages.k8s.forms.pv.csi.volumeHandle.placeholder',
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.pv.fsType')}
                name="csiFsType"
              >
                <Input
                  placeholder={t('pages.k8s.forms.pv.fsType.placeholder')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.form.readOnly')}
                name="csiReadOnly"
              >
                <Select
                  options={booleanOptions}
                  placeholder={t('pages.k8s.forms.common.select')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            extra={t('pages.k8s.forms.pv.csi.volumeAttributes.extra')}
            label={t('pages.k8s.forms.pv.csi.volumeAttributes')}
            name="csiVolumeAttributes"
          >
            <KeyValueEditor
              addText={t('pages.k8s.form.add')}
              deleteAriaLabel={t(
                'pages.k8s.forms.pv.csi.volumeAttributes.delete',
              )}
              minRows={1}
              onAddBlocked={() =>
                message.warning(
                  t('pages.k8s.forms.pv.csi.volumeAttributes.keyFirst'),
                )
              }
              onCreateItem={createKeyValueItem}
            />
          </Form.Item>
        </div>
      );
    }

    if (sourceType === 'local') {
      return (
        <div className={styles.fieldGroup}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.pv.local.path')}
                name="localPath"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.pv.local.path.required'),
                  },
                ]}
              >
                <Input
                  placeholder={t('pages.k8s.forms.pv.local.path.placeholder')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('pages.k8s.forms.pv.fsType')}
                name="localFsType"
              >
                <Input
                  placeholder={t('pages.k8s.forms.pv.fsType.placeholder')}
                />
              </Form.Item>
            </Col>
          </Row>
          <ResourceFormSection
            description={t('pages.k8s.forms.pv.nodeAffinity.desc')}
            title={t('pages.k8s.forms.pv.nodeAffinity')}
          >
            <div className={styles.sectionBody}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={t('pages.k8s.forms.common.labelKey')}
                    name="nodeAffinityKey"
                    rules={[
                      {
                        required: true,
                        message: t(
                          'pages.k8s.forms.pv.nodeAffinity.key.required',
                        ),
                      },
                    ]}
                  >
                    <Input
                      placeholder={t(
                        'pages.k8s.forms.pv.nodeAffinity.key.placeholder',
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('pages.k8s.forms.pv.nodeAffinity.operator')}
                    name="nodeAffinityOperator"
                    rules={[
                      {
                        required: true,
                        message: t(
                          'pages.k8s.forms.pv.nodeAffinity.operator.required',
                        ),
                      },
                    ]}
                  >
                    <Select
                      options={nodeAffinityOperatorOptions}
                      placeholder={t(
                        'pages.k8s.forms.pv.nodeAffinity.operator.required',
                      )}
                      onChange={handleNodeAffinityOperatorChange}
                    />
                  </Form.Item>
                </Col>
              </Row>
              {showNodeAffinityValues && nodeNames.length > 0 && (
                <Form.Item
                  extra={t('pages.k8s.forms.pv.nodeAffinity.selectNode.extra')}
                  label={t('pages.k8s.forms.pv.nodeAffinity.selectNode')}
                >
                  <Select
                    options={nodeNames.map((item) => ({
                      label: item,
                      value: item,
                    }))}
                    placeholder={t(
                      'pages.k8s.forms.pv.nodeAffinity.selectNode.placeholder',
                    )}
                    showSearch
                    value={null}
                    onChange={addNodeAffinityValue}
                  />
                </Form.Item>
              )}
              {showNodeAffinityValues && (
                <Form.Item
                  extra={t('pages.k8s.forms.pv.nodeAffinity.values.extra')}
                  label={t('pages.k8s.forms.pv.nodeAffinity.values')}
                  name="nodeAffinityValues"
                >
                  <StringListEditor
                    addText={t('pages.k8s.form.add')}
                    deleteAriaLabel={t(
                      'pages.k8s.forms.pv.nodeAffinity.values.delete',
                    )}
                    minRows={1}
                    placeholder={t(
                      'pages.k8s.forms.pv.nodeAffinity.values.placeholder',
                    )}
                    surface
                    onAddBlocked={() =>
                      message.warning(
                        t('pages.k8s.forms.pv.nodeAffinity.values.first'),
                      )
                    }
                    onCreateItem={createStringItem}
                  />
                </Form.Item>
              )}
            </div>
          </ResourceFormSection>
        </div>
      );
    }

    return (
      <div className={styles.fieldGroup}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              extra={t('pages.k8s.forms.pv.hostPath.extra')}
              label={t('pages.k8s.forms.pv.hostPath')}
              name="hostPath"
              rules={[
                {
                  required: true,
                  message: t('pages.k8s.forms.pv.hostPath.required'),
                },
              ]}
            >
              <Input
                placeholder={t('pages.k8s.forms.pv.hostPath.placeholder')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('pages.k8s.forms.pv.hostPathType')}
              name="hostPathType"
            >
              <Select
                options={hostPathTypeOptions}
                placeholder={t('pages.k8s.forms.common.select')}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.compactField}
        label={t('pages.k8s.forms.pv.volumeSource')}
        name="volumeSourceType"
        rules={[
          {
            required: true,
            message: t('pages.k8s.forms.pv.volumeSource.required'),
          },
        ]}
      >
        <Select
          labelRender={({ value }) => {
            const option = sourceOptions.find((item) => item.value === value);
            return option ? <VolumeSourceOptionLabel {...option} /> : value;
          }}
          optionRender={(option) => (
            <VolumeSourceOptionLabel {...(option.data as VolumeSourceOption)} />
          )}
          options={sourceOptions}
          onChange={handleSourceChange}
        />
      </Form.Item>
      {renderSourceFields()}
    </div>
  );
};

export default PersistentVolumeSourceSettings;
