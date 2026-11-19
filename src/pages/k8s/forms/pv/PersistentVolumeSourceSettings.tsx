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
import { useEffect } from 'react';
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

const booleanOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
];

const hostPathTypeOptions = [
  { label: '不指定', value: '' },
  { label: 'DirectoryOrCreate', value: 'DirectoryOrCreate' },
  { label: 'Directory', value: 'Directory' },
  { label: 'FileOrCreate', value: 'FileOrCreate' },
  { label: 'File', value: 'File' },
  { label: 'Socket', value: 'Socket' },
  { label: 'CharDevice', value: 'CharDevice' },
  { label: 'BlockDevice', value: 'BlockDevice' },
];

const nodeAffinityOperatorOptions = [
  { label: 'In', value: 'In' },
  { label: 'NotIn', value: 'NotIn' },
  { label: 'Exists', value: 'Exists' },
  { label: 'DoesNotExist', value: 'DoesNotExist' },
  { label: 'Gt', value: 'Gt' },
  { label: 'Lt', value: 'Lt' },
];

const sourceOptions: VolumeSourceOption[] = [
  {
    description: '使用节点本地路径，适合开发或单节点场景。',
    icon: <HddOutlined />,
    label: 'HostPath',
    value: 'hostPath',
  },
  {
    description: '使用节点本地磁盘，需配置节点亲和性。',
    icon: <DatabaseOutlined />,
    label: 'Local',
    value: 'local',
  },
  {
    description: '使用 NFS 服务器导出的目录。',
    icon: <CloudServerOutlined />,
    label: 'NFS',
    value: 'nfs',
  },
  {
    description: '使用 CSI 驱动提供的卷。',
    icon: <ApiOutlined />,
    label: 'CSI',
    value: 'csi',
  },
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
  const { message } = App.useApp();
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
                label="服务器"
                name="nfsServer"
                rules={[{ required: true, message: '请输入 NFS 服务器' }]}
              >
                <Input placeholder="例如 10.0.0.10" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="导出路径"
                name="nfsPath"
                rules={[{ required: true, message: '请输入 NFS 导出路径' }]}
              >
                <Input placeholder="例如 /exports/data" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="只读" name="nfsReadOnly">
                <Select options={booleanOptions} placeholder="请选择" />
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
                label="驱动"
                name="csiDriver"
                rules={[{ required: true, message: '请输入 CSI 驱动' }]}
              >
                <Input placeholder="例如 ebs.csi.aws.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="卷句柄"
                name="csiVolumeHandle"
                rules={[{ required: true, message: '请输入卷句柄' }]}
              >
                <Input placeholder="请输入 volumeHandle" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="文件系统" name="csiFsType">
                <Input placeholder="例如 ext4" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="只读" name="csiReadOnly">
                <Select options={booleanOptions} placeholder="请选择" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            extra="按 CSI 驱动要求填写 volumeAttributes。"
            label="卷属性"
            name="csiVolumeAttributes"
          >
            <KeyValueEditor
              addText="添加"
              deleteAriaLabel="删除卷属性"
              minRows={1}
              onAddBlocked={() => message.warning('请先填写已有属性的键。')}
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
                label="本地路径"
                name="localPath"
                rules={[{ required: true, message: '请输入本地路径' }]}
              >
                <Input placeholder="例如 /mnt/disks/ssd1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="文件系统" name="localFsType">
                <Input placeholder="例如 ext4" />
              </Form.Item>
            </Col>
          </Row>
          <ResourceFormSection
            description="Local 持久卷必须约束到实际存在该磁盘的节点。"
            title="节点亲和性"
          >
            <div className={styles.sectionBody}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="标签键"
                    name="nodeAffinityKey"
                    rules={[{ required: true, message: '请输入标签键' }]}
                  >
                    <Input placeholder="例如 kubernetes.io/hostname" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="操作符"
                    name="nodeAffinityOperator"
                    rules={[{ required: true, message: '请选择操作符' }]}
                  >
                    <Select
                      options={nodeAffinityOperatorOptions}
                      placeholder="请选择操作符"
                      onChange={handleNodeAffinityOperatorChange}
                    />
                  </Form.Item>
                </Col>
              </Row>
              {showNodeAffinityValues && nodeNames.length > 0 && (
                <Form.Item
                  extra="选择节点会把节点名加入下方匹配值（标签键为 kubernetes.io/hostname 时适用）。"
                  label="从集群节点中选择"
                >
                  <Select
                    options={nodeNames.map((item) => ({
                      label: item,
                      value: item,
                    }))}
                    placeholder="请选择节点"
                    showSearch
                    value={null}
                    onChange={addNodeAffinityValue}
                  />
                </Form.Item>
              )}
              {showNodeAffinityValues && (
                <Form.Item
                  extra="In/NotIn 可填写多个值；Gt/Lt 仅支持一个数字值。"
                  label="匹配值"
                  name="nodeAffinityValues"
                >
                  <StringListEditor
                    addText="添加"
                    deleteAriaLabel="删除匹配值"
                    minRows={1}
                    placeholder="请输入匹配值"
                    surface
                    onAddBlocked={() => message.warning('请先填写已有匹配值。')}
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
              extra="HostPath 适合开发或单节点场景，生产环境建议优先使用 CSI/NFS/Local。"
              label="主机路径"
              name="hostPath"
              rules={[{ required: true, message: '请输入主机路径' }]}
            >
              <Input placeholder="例如 /tmp/example-pv" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="路径类型" name="hostPathType">
              <Select options={hostPathTypeOptions} placeholder="请选择" />
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
        label="卷来源"
        name="volumeSourceType"
        rules={[{ required: true, message: '请选择卷来源' }]}
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
