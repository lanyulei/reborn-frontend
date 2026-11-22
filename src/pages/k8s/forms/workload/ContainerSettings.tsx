import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, Button, Form, InputNumber } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { useT } from '@/utils/i18n';
import ContainerConfigModal from './ContainerConfigModal';
import type { ContainerSummaryItem } from './ContainerSummaryList';
import ContainerSummaryList from './ContainerSummaryList';
import {
  createId,
  createRandomContainerName,
  getInitialContainerValues,
} from './helpers';
import PodGracefulTerminationFields from './PodGracefulTerminationFields';
import PodMetadataFields from './PodMetadataFields';
import PodSchedulingRuleSelector from './PodSchedulingRuleSelector';
import PodSecurityContextFields from './PodSecurityContextFields';
import type {
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadKind,
} from './types';
import WorkloadUpdateStrategySelector from './WorkloadUpdateStrategySelector';

const useStyles = createStyles(({ token }) => ({
  replicaPanel: {
    display: 'inline-flex',
    minWidth: 324,
    flexDirection: 'column',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: `16px`,
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,

    '@media (max-width: 576px)': {
      width: '100%',
      minWidth: 0,
    },
  },
  replicaLabel: {
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  },
  replicaControl: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: '40px minmax(120px, 1fr) 40px',
    alignItems: 'center',
    gap: token.margin,
  },
  stepButton: {
    color: token.colorTextSecondary,
  },
  replicaInput: {
    width: '100%',
  },
  replicaInputText: {
    textAlign: 'center',
  },
  containerTitle: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type ContainerSettingsProps = {
  form: FormInstance<CreateWorkloadFormValues>;
  type: WorkloadKind;
};

type WorkloadContainerEditorProps = ContainerSettingsProps & {
  showReplicaPanel?: boolean;
  showTitle?: boolean;
};

const WorkloadContainerEditor = ({
  form,
  type,
  showReplicaPanel = true,
  showTitle = true,
}: WorkloadContainerEditorProps) => {
  const { styles } = useStyles();
  const { modal } = App.useApp();
  const t = useT();
  const [containerForm] = Form.useForm<CreateWorkloadContainerValues>();
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [editingContainerIndex, setEditingContainerIndex] = useState<
    number | null
  >(null);
  const containers =
    (Form.useWatch('containers', {
      form,
      preserve: true,
    }) as CreateWorkloadContainerValues[]) || [];
  const replicas = Form.useWatch('replicas', form) ?? 1;
  const containerItems: ContainerSummaryItem[] = containers.map(
    (container, index) => ({
      cpuLimit: container.cpuLimit,
      cpuRequest: container.cpuRequest,
      image: container.image,
      key: container.id || container.containerName || `container-${index}`,
      memoryLimit: container.memoryLimit,
      memoryRequest: container.memoryRequest,
      name: container.containerName,
    }),
  );

  const updateReplicas = (offset: number) => {
    form.setFieldValue('replicas', Math.max(0, replicas + offset));
  };

  const openContainerModal = (
    shouldPrefillName = false,
    index: number | null = null,
  ) => {
    setEditingContainerIndex(index);
    containerForm.resetFields();
    if (index === null) {
      containerForm.setFieldsValue({
        ...getInitialContainerValues(),
        containerName: shouldPrefillName
          ? createRandomContainerName()
          : undefined,
      });
    } else {
      containerForm.setFieldsValue(containers[index]);
    }
    setContainerModalOpen(true);
  };

  const cancelContainerModal = () => {
    containerForm.resetFields();
    setEditingContainerIndex(null);
    setContainerModalOpen(false);
  };

  const saveContainerModal = async () => {
    // 校验弹窗里挂载的全部字段，再取完整值（含未展开分组里保留的数据）
    try {
      await containerForm.validateFields();
    } catch {
      // 校验未通过：字段已就地标红，停在弹窗里
      return;
    }
    const containerValues = {
      ...containerForm.getFieldsValue(true),
      id: containers[editingContainerIndex ?? -1]?.id || createId(),
    } as CreateWorkloadContainerValues;
    const nextContainers = [...containers];
    if (editingContainerIndex === null) {
      nextContainers.push(containerValues);
    } else {
      nextContainers[editingContainerIndex] = containerValues;
    }
    form.setFieldValue('containers', nextContainers);
    containerForm.resetFields();
    setEditingContainerIndex(null);
    setContainerModalOpen(false);
  };

  const deleteContainer = (index: number) => {
    const target = containers[index];

    modal.confirm({
      title: t('pages.k8s.forms.workload.container.delete'),
      content: t('pages.k8s.forms.workload.container.delete.content', {
        name:
          target?.containerName || t('pages.k8s.forms.workload.container.new'),
      }),
      okText: t('common.action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('common.action.cancel'),
      onOk: () => {
        const currentContainers = (form.getFieldValue('containers') ||
          []) as CreateWorkloadContainerValues[];
        form.setFieldValue(
          'containers',
          currentContainers.filter((item) => item.id !== target?.id),
        );
      },
    });
  };

  return (
    <>
      {showReplicaPanel && type !== 'DaemonSet' && (
        <div className={styles.replicaPanel}>
          <div className={styles.replicaLabel}>
            {t('pages.k8s.forms.workload.container.replicas')}
          </div>
          <div className={styles.replicaControl}>
            <Button
              aria-label={t(
                'pages.k8s.forms.workload.container.replicas.decrease',
              )}
              className={styles.stepButton}
              disabled={replicas <= 0}
              icon={<MinusOutlined />}
              type="text"
              onClick={() => updateReplicas(-1)}
            />
            <Form.Item
              name="replicas"
              rules={[
                {
                  required: true,
                  message: t(
                    'pages.k8s.forms.workload.container.replicas.required',
                  ),
                },
              ]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                className={styles.replicaInput}
                classNames={{ input: styles.replicaInputText }}
                min={0}
                precision={0}
              />
            </Form.Item>
            <Button
              aria-label={t(
                'pages.k8s.forms.workload.container.replicas.increase',
              )}
              className={styles.stepButton}
              icon={<PlusOutlined />}
              type="text"
              onClick={() => updateReplicas(1)}
            />
          </div>
        </div>
      )}

      {showTitle && (
        <div className={styles.containerTitle}>
          {t('pages.k8s.forms.common.container')}
        </div>
      )}
      <ContainerSummaryList
        items={containerItems}
        onAdd={() => openContainerModal(true)}
        onDelete={(_, index) => deleteContainer(index)}
        onEdit={(_, index) => openContainerModal(false, index)}
      />

      <ContainerConfigModal
        form={containerForm}
        open={containerModalOpen}
        usedNames={containers
          .filter((_, index) => index !== editingContainerIndex)
          .map((container) => container.containerName || '')}
        onCancel={cancelContainerModal}
        onOk={saveContainerModal}
      />
    </>
  );
};

const ContainerSettings = ({ form, type }: ContainerSettingsProps) => (
  <>
    <WorkloadContainerEditor form={form} type={type} />
    <WorkloadUpdateStrategySelector form={form} type={type} />
    <PodSecurityContextFields />
    <PodSchedulingRuleSelector />
    <PodGracefulTerminationFields />
    <div style={{ marginBottom: `16px` }}>
      <PodMetadataFields />
    </div>
  </>
);

export { WorkloadContainerEditor };
export default ContainerSettings;
