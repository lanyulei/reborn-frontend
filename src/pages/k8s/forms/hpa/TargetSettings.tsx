import { DeploymentUnitOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, AutoComplete, Button, Col, Form, Input, Row } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import WorkloadSelectorModal, {
  type WorkloadSelectorTab,
} from '../service/WorkloadSelectorModal';
import FormSection from '../shared/ResourceFormSection';
import { getTargetApiVersionByKind } from './helpers';
import type { CreateHorizontalPodAutoscalerFormValues } from './types';

const TARGET_KIND_OPTIONS = [
  { label: 'Deployment', value: 'Deployment' },
  { label: 'StatefulSet', value: 'StatefulSet' },
  { label: 'ReplicaSet', value: 'ReplicaSet' },
  { label: 'ReplicationController', value: 'ReplicationController' },
];

const HPA_WORKLOAD_TABS: WorkloadSelectorTab[] = [
  { label: '部署', value: 'Deployment' },
  { label: '有状态副本集', value: 'StatefulSet' },
];

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  picker: {
    display: 'grid',
    gridTemplateColumns: '32px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '32px minmax(0, 1fr)',
    },
  },
  pickerIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: token.borderRadiusSM,
    background: token.colorPrimaryBg,
    color: token.colorPrimary,
    fontSize: token.fontSize,
  },
  pickerTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  pickerDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  pickerAction: {
    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      width: '100%',
    },
  },
  pickerLabel: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type TargetSettingsProps = {
  clusterId: string;
  form: FormInstance<CreateHorizontalPodAutoscalerFormValues>;
};

type TargetPickerProps = {
  apiVersion?: string;
  targetKind?: string;
  value?: string;
  onSelect: () => void;
};

const TargetPicker = ({
  apiVersion,
  targetKind,
  value,
  onSelect,
}: TargetPickerProps) => {
  const { styles } = useStyles();
  const hasTarget = Boolean(value);

  return (
    <div className={styles.picker}>
      <span className={styles.pickerIcon}>
        <DeploymentUnitOutlined />
      </span>
      <div>
        <div className={styles.pickerTitle}>
          {hasTarget ? value : '选择工作负载'}
        </div>
        <div className={styles.pickerDescription}>
          {hasTarget
            ? `${targetKind || '-'} · ${apiVersion || '-'}`
            : '从当前命名空间选择 HPA 管理副本数的工作负载。'}
        </div>
      </div>
      <Button
        className={styles.pickerAction}
        icon={<DeploymentUnitOutlined />}
        type={hasTarget ? 'default' : 'primary'}
        onClick={onSelect}
      >
        {hasTarget ? '重新选择' : '选择工作负载'}
      </Button>
    </div>
  );
};

const TargetSettings = ({ clusterId, form }: TargetSettingsProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [workloadModalOpen, setWorkloadModalOpen] = useState(false);
  const values: CreateHorizontalPodAutoscalerFormValues =
    Form.useWatch([], { form, preserve: true }) || {};

  // 命名空间字段在上一步，这里没有挂载：直接看表单存储里的值
  const openWorkloadModal = () => {
    if (!values.namespace?.trim()) {
      message.warning('请先选择命名空间');
      return;
    }
    setWorkloadModalOpen(true);
  };

  const handleTargetKindChange = (kind: string) => {
    form.setFieldValue('targetApiVersion', getTargetApiVersionByKind(kind));
  };

  return (
    <>
      <FormSection
        description="可从当前命名空间选择工作负载自动回填，也可以直接填写其他实现 scale 子资源的对象。"
        title="伸缩目标"
      >
        <div className={styles.stack}>
          <div>
            <div className={styles.pickerLabel}>目标工作负载</div>
            <TargetPicker
              apiVersion={values.targetApiVersion}
              targetKind={values.targetKind}
              value={values.targetName}
              onSelect={openWorkloadModal}
            />
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="目标类型"
                name="targetKind"
                rules={[{ required: true, message: '请选择目标类型' }]}
              >
                <AutoComplete
                  options={TARGET_KIND_OPTIONS}
                  placeholder="请选择目标类型"
                  onChange={handleTargetKindChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="目标名称"
                name="targetName"
                rules={[{ required: true, message: '请输入目标名称' }]}
              >
                <Input placeholder="请输入目标名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="目标 API 版本"
                name="targetApiVersion"
                rules={[{ required: true, message: '请输入目标 API 版本' }]}
                tooltip="选择工作负载时会自动带出，引用其他实现 scale 子资源的对象时可手动调整。"
              >
                <Input placeholder="如 apps/v1" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </FormSection>

      <WorkloadSelectorModal
        clusterId={clusterId}
        detail={false}
        hint="选择同命名空间下可被 HPA 引用的工作负载，名称会写入 scaleTargetRef。"
        namespace={values.namespace}
        open={workloadModalOpen}
        tabs={HPA_WORKLOAD_TABS}
        onCancel={() => setWorkloadModalOpen(false)}
        onOk={(workload) => {
          form.setFieldsValue({
            targetApiVersion: getTargetApiVersionByKind(workload.type),
            targetKind: workload.type,
            targetName: workload.name,
          });
          setWorkloadModalOpen(false);
        }}
      />
    </>
  );
};

export default TargetSettings;
