import { DeploymentUnitOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, AutoComplete, Button, Col, Form, Input, Row } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo, useState } from 'react';
import { useT } from '@/utils/i18n';
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
  const t = useT();
  const { styles } = useStyles();
  const hasTarget = Boolean(value);

  return (
    <div className={styles.picker}>
      <span className={styles.pickerIcon}>
        <DeploymentUnitOutlined />
      </span>
      <div>
        <div className={styles.pickerTitle}>
          {hasTarget ? value : t('pages.k8s.forms.hpa.target.pick')}
        </div>
        <div className={styles.pickerDescription}>
          {hasTarget
            ? `${targetKind || '-'} · ${apiVersion || '-'}`
            : t('pages.k8s.forms.hpa.target.pick.description')}
        </div>
      </div>
      <Button
        className={styles.pickerAction}
        icon={<DeploymentUnitOutlined />}
        type={hasTarget ? 'default' : 'primary'}
        onClick={onSelect}
      >
        {hasTarget
          ? t('pages.k8s.forms.hpa.target.repick')
          : t('pages.k8s.forms.hpa.target.pick')}
      </Button>
    </div>
  );
};

const TargetSettings = ({ clusterId, form }: TargetSettingsProps) => {
  const t = useT();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const workloadTabs = useMemo<WorkloadSelectorTab[]>(
    () => [
      { label: t('pages.k8s.kind.Deployment'), value: 'Deployment' },
      { label: t('pages.k8s.kind.StatefulSet'), value: 'StatefulSet' },
    ],
    [t],
  );
  const [workloadModalOpen, setWorkloadModalOpen] = useState(false);
  const values: CreateHorizontalPodAutoscalerFormValues =
    Form.useWatch([], { form, preserve: true }) || {};

  // 命名空间字段在上一步，这里没有挂载：直接看表单存储里的值
  const openWorkloadModal = () => {
    if (!values.namespace?.trim()) {
      message.warning(t('pages.k8s.forms.hpa.target.namespaceFirst'));
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
        description={t('pages.k8s.forms.hpa.target.description')}
        title={t('pages.k8s.forms.hpa.step.target')}
      >
        <div className={styles.stack}>
          <div>
            <div className={styles.pickerLabel}>
              {t('pages.k8s.forms.hpa.target.workload')}
            </div>
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
                label={t('pages.k8s.forms.hpa.targetType')}
                name="targetKind"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.hpa.targetType.required'),
                  },
                ]}
              >
                <AutoComplete
                  options={TARGET_KIND_OPTIONS}
                  placeholder={t('pages.k8s.forms.hpa.targetType.required')}
                  onChange={handleTargetKindChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={t('pages.k8s.forms.hpa.targetName')}
                name="targetName"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.hpa.targetName.required'),
                  },
                ]}
              >
                <Input
                  placeholder={t('pages.k8s.forms.hpa.targetName.required')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={t('pages.k8s.forms.hpa.targetApiVersion')}
                name="targetApiVersion"
                rules={[
                  {
                    required: true,
                    message: t('pages.k8s.forms.hpa.targetApiVersion.required'),
                  },
                ]}
                tooltip={t('pages.k8s.forms.hpa.targetApiVersion.tooltip')}
              >
                <Input
                  placeholder={t('pages.k8s.forms.hpa.apiVersion.placeholder')}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </FormSection>

      <WorkloadSelectorModal
        clusterId={clusterId}
        detail={false}
        hint={t('pages.k8s.forms.hpa.target.hint')}
        namespace={values.namespace}
        open={workloadModalOpen}
        tabs={workloadTabs}
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
