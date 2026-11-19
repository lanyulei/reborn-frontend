/**
 * 工作负载「编辑设置」：更新策略、容器、存储、容器组调度规则、优雅终止。
 * 分节表单复用创建向导的组件；保存走统一的「预检 → 对比 → 提交」。
 */
import {
  ClockCircleOutlined,
  ClusterOutlined,
  DockerOutlined,
  HddOutlined,
  SaveOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Alert, App, Button, Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { EditFormProps } from '../../shared/edit';
import { EditSubmit, useEditObject } from '../../shared/edit';
import { toYaml } from '../../shared/kube';
import type { SettingsNavDrawerSection } from '../../shared/SettingsNavDrawer';
import SettingsNavDrawer from '../../shared/SettingsNavDrawer';
import { WorkloadContainerEditor } from '../../workload/ContainerSettings';
import { WizardScopeContext } from '../../workload/context';
import { checkContainers } from '../../workload/helpers';
import PodGracefulTerminationFields from '../../workload/PodGracefulTerminationFields';
import PodSchedulingRuleSelector from '../../workload/PodSchedulingRuleSelector';
import StorageSettings from '../../workload/StorageSettings';
import type { CreateWorkloadFormValues } from '../../workload/types';
import WorkloadUpdateStrategySelector from '../../workload/WorkloadUpdateStrategySelector';
import {
  buildUpdatedWorkloadSettingsManifest,
  fromSettingsView,
  getWorkloadSettingsFormValues,
  settingsFormKind,
  toSettingsView,
  type WorkloadSettingsKind,
} from './helpers';

type WorkloadSettingKey =
  | 'updateStrategy'
  | 'containers'
  | 'storage'
  | 'scheduling'
  | 'termination';

type WorkloadSettingsEditProps = EditFormProps & {
  kind: WorkloadSettingsKind;
};

const TITLE = '编辑设置';

const WorkloadSettingsEdit = ({
  clusterId,
  kind,
  target,
  onClose,
  onDone,
}: WorkloadSettingsEditProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateWorkloadFormValues>();
  const state = useEditObject(clusterId, target);
  const { object, resourceVersion, loading, error, reload } = state;
  // 定时任务只编辑 Pod 模板：没有更新策略与调度规则两个分节
  const isCronJob = kind === 'CronJob';
  const formKind = settingsFormKind(kind);
  const [activeKey, setActiveKey] = useState<WorkloadSettingKey>(
    isCronJob ? 'containers' : 'updateStrategy',
  );
  const [yaml, setYaml] = useState<string>();
  // 打开时由对象解析出的表单值：保存时与当前值比对出用户的改动
  const view = useMemo(
    () => (object ? toSettingsView(kind, object) : undefined),
    [kind, object],
  );
  const initial = useMemo(
    () => (view ? getWorkloadSettingsFormValues(formKind, view) : undefined),
    [formKind, view],
  );
  const scope = useMemo(
    () => ({ clusterId, namespace: target.namespace }),
    [clusterId, target.namespace],
  );

  useEffect(() => {
    if (initial) {
      form.resetFields();
      // 表单拿到的是副本：初值本身保持不变，留作比对
      form.setFieldsValue(
        structuredClone(initial) as Parameters<typeof form.setFieldsValue>[0],
      );
    }
  }, [form, initial]);

  const sections = useMemo<SettingsNavDrawerSection<WorkloadSettingKey>[]>(
    () =>
      [
        {
          key: 'updateStrategy',
          icon: <SyncOutlined />,
          title: '更新策略',
          description: '配置工作负载更新容器组副本时采用的策略。',
          content: (
            <WorkloadUpdateStrategySelector
              form={form as FormInstance}
              label="策略类型"
              marginTop={0}
              type={formKind}
            />
          ),
        },
        {
          key: 'containers',
          icon: <DockerOutlined />,
          title: '容器',
          description: '维护容器镜像、端口、资源和高级配置。',
          content: (
            <WorkloadContainerEditor
              form={form}
              showReplicaPanel={false}
              showTitle={false}
              type={formKind}
            />
          ),
        },
        {
          key: 'storage',
          icon: <HddOutlined />,
          title: '存储',
          description: '为容器组挂载持久卷、临时卷、配置字典或保密字典。',
          content: <StorageSettings form={form} type={formKind} />,
        },
        {
          key: 'scheduling',
          icon: <ClusterOutlined />,
          title: '容器组调度规则',
          description: '设置容器组副本调度到节点的规则。',
          content: <PodSchedulingRuleSelector label="规则类型" marginTop={0} />,
        },
        {
          key: 'termination',
          icon: <ClockCircleOutlined />,
          title: '容器组优雅终止',
          description: '设置容器终止前等待的时间，超时后容器将强制终止。',
          content: <PodGracefulTerminationFields embedded />,
        },
      ].filter(
        (section) =>
          !isCronJob ||
          (section.key !== 'updateStrategy' && section.key !== 'scheduling'),
      ) as SettingsNavDrawerSection<WorkloadSettingKey>[],
    [form, formKind, isCronJob],
  );

  const handleSubmit = async () => {
    if (!object || !view || !initial) {
      return;
    }

    try {
      await form.validateFields();
    } catch {
      // 校验错误已由表单项展示
      return;
    }
    const values: CreateWorkloadFormValues = form.getFieldsValue(true);
    const warning = checkContainers(values);
    if (warning) {
      message.warning(warning);
      setActiveKey('containers');
      return;
    }

    setYaml(
      toYaml(
        fromSettingsView(
          kind,
          object,
          buildUpdatedWorkloadSettingsManifest(formKind, view, initial, values),
        ),
      ),
    );
  };

  return (
    <WizardScopeContext.Provider value={scope}>
      <Form form={form} layout="vertical" preserve requiredMark>
        <SettingsNavDrawer
          activeKey={activeKey}
          banner={
            error && (
              <Alert
                action={
                  <Button size="small" onClick={reload}>
                    重试
                  </Button>
                }
                banner
                showIcon
                title={error}
                type="error"
              />
            )
          }
          loading={loading}
          okButtonDisabled={!object || loading || Boolean(error)}
          okButtonIcon={<SaveOutlined />}
          open
          sections={sections}
          size="max(1000px, 78vw)"
          title={TITLE}
          onActiveKeyChange={setActiveKey}
          onCancel={onClose}
          onOk={() => void handleSubmit()}
        />
      </Form>
      {yaml !== undefined && (
        <EditSubmit
          clusterId={clusterId}
          resourceVersion={resourceVersion}
          target={target}
          title={TITLE}
          yaml={yaml}
          onBack={() => setYaml(undefined)}
          onClose={onClose}
          onDone={onDone}
          onReload={reload}
        />
      )}
    </WizardScopeContext.Provider>
  );
};

export default WorkloadSettingsEdit;
