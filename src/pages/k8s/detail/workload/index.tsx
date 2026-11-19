import { ProDescriptions } from '@ant-design/pro-components';
import { Alert, App, Empty, Spin } from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SectionTitle from '@/components/SectionTitle';
import { getK8sErrorMessage } from '@/services/k8s/request';
import { getObject, scaleWorkload } from '@/services/k8s/resource';
import type { GVR, ObjectResult, ResourceRef } from '@/services/k8s/typings';
import { usePermissions } from '@/services/system/permissions';
import { useT } from '@/utils/i18n';
import { formatTime } from '../../components/cells';
import { useDangerConfirm } from '../../components/confirm';
import { useKindName } from '../../components/meta';
import { RevisionsTab } from '../../components/ResourceDetail';
import CollapsibleField from '../../forms/shared/CollapsibleField';
import type { WorkloadKind } from '../../forms/workload/types';
import EventTable from '../shared/EventTable';
import Metadata from '../shared/Metadata';
import ReplicaSummary from '../shared/ReplicaSummary';
import StatusText from '../shared/StatusDot';
import ContainerStatusManagement from './ContainerStatusManagement';
import {
  templateContainers,
  workloadLabelSelector,
  workloadReplicas,
  workloadStatus,
  workloadUpdateTime,
} from './helpers';
import PodTable from './PodTable';
import useWorkloadPods from './useWorkloadPods';

type WorkloadDetailProps = {
  clusterId: string;
  gvr: GVR;
  kind: WorkloadKind;
  namespace: string;
  name: string;
};

type BasicInfo = {
  name: string;
  namespace: string;
};

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    padding: 18,
  },
  basicInfoContent: {
    display: 'flex',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 20,
  },
  description: {
    flex: 1,
    minWidth: 420,
  },
}));

const WorkloadDetail: React.FC<WorkloadDetailProps> = ({
  clusterId,
  gvr,
  kind,
  namespace,
  name,
}) => {
  const t = useT();
  const has = usePermissions();
  const kindName = useKindName();
  const confirm = useDangerConfirm();
  const { message, modal } = App.useApp();
  const { styles } = useStyles();
  const ref = useMemo<ResourceRef>(
    () => ({ ...gvr, namespace, name }),
    [gvr, namespace, name],
  );
  const [data, setData] = useState<ObjectResult>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [scaling, setScaling] = useState(false);
  const object = data?.object;
  const {
    loading: podLoading,
    pods,
    reload: reloadPods,
  } = useWorkloadPods(
    clusterId,
    kind,
    ref,
    // 对象取不到（已报错）时按空选择器处理，不让容器组一直转圈
    object ? workloadLabelSelector(object) : error ? '' : undefined,
  );
  const replicas = workloadReplicas(kind, object);
  const status = workloadStatus(kind, object);
  const containers = useMemo(() => templateContainers(object), [object]);
  const containerNames = useMemo(
    () => containers.map((container) => container.name),
    [containers],
  );
  const fetchWorkload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getObject(clusterId, ref, { silent: true }));
      setError(undefined);
    } catch (err) {
      setError(getK8sErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clusterId, ref]);

  useEffect(() => {
    void fetchWorkload();
  }, [fetchWorkload]);

  const refreshDetail = useCallback(async () => {
    await fetchWorkload();
    await reloadPods();
  }, [fetchWorkload, reloadPods]);

  const updateReplicas = async (next: number) => {
    setScaling(true);
    try {
      await scaleWorkload(clusterId, ref, next);
      message.success('副本数已更新');
      await refreshDetail();
    } finally {
      setScaling(false);
    }
  };

  const handleScaleReplicas = (next: number) => {
    // 失败已由请求层提示：确认框照常关闭
    const onOk = () => updateReplicas(next).catch(() => undefined);
    if (next === 0) {
      // 缩容到 0 会停掉全部容器组：按危险操作确认
      confirm({
        title: t('pages.k8s.action.scaleZero.title', { name }),
        content: t('pages.k8s.action.scaleZero.content'),
        name,
        namespace,
        onOk,
      });
      return;
    }
    modal.confirm({
      title: '确认调整副本数量吗？',
      content: `当前期望副本数为 ${replicas.desired}，确认调整为 ${next} 吗？`,
      okText: '确认调整',
      cancelText: '取消',
      onOk,
    });
  };

  const canScale = has('k8s.workload.scale');

  return (
    <>
      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={error}
        />
      )}
      <SectionTitle style={{ marginTop: 0 }}>基本信息</SectionTitle>
      <div className={styles.content}>
        <Spin spinning={loading}>
          {object || loading ? (
            <div className={styles.basicInfoContent}>
              <ReplicaSummary
                loading={scaling}
                data={{
                  desiredReplicas: replicas.desired,
                  currentReplicas: replicas.ready,
                  scalable: kind !== 'DaemonSet' && canScale && Boolean(object),
                }}
                disabledReason={
                  kind === 'DaemonSet' ? undefined : '没有调整副本的权限'
                }
                onScale={handleScaleReplicas}
              />
              <ProDescriptions<BasicInfo>
                className={styles.description}
                column={2}
                dataSource={{ name, namespace }}
                columns={[
                  {
                    title: '名称',
                    dataIndex: 'name',
                    copyable: true,
                  },
                  {
                    title: '命名空间',
                    dataIndex: 'namespace',
                  },
                  {
                    title: '状态',
                    key: 'status',
                    render: () => (
                      <StatusText label={status.label} type={status.type} />
                    ),
                  },
                  {
                    title: '类型',
                    key: 'type',
                    render: () => kindName(kind),
                  },
                  {
                    title: '创建时间',
                    key: 'createTime',
                    render: () =>
                      formatTime(object?.metadata?.creationTimestamp) || '-',
                  },
                  {
                    title: '更新时间',
                    key: 'updateTime',
                    render: () => formatTime(workloadUpdateTime(object)) || '-',
                  },
                ]}
              />
            </div>
          ) : (
            <Empty description="未找到工作负载" />
          )}
        </Spin>
      </div>
      <SectionTitle>容器状态管理</SectionTitle>
      <ContainerStatusManagement
        loading={loading && !object}
        containers={containers}
      />
      <SectionTitle>容器组</SectionTitle>
      <PodTable
        clusterId={clusterId}
        containers={containerNames}
        loading={podLoading}
        onReload={() => void reloadPods()}
        pods={pods}
      />
      <SectionTitle>修改记录</SectionTitle>
      <div className={styles.content}>
        <RevisionsTab
          clusterId={clusterId}
          target={ref}
          onChanged={() => void refreshDetail()}
        />
      </div>
      <SectionTitle>事件</SectionTitle>
      <EventTable clusterId={clusterId} target={ref} />
      <SectionTitle>元数据</SectionTitle>
      <div className={styles.content}>
        <CollapsibleField
          description="工作负载自身的标签与注解。"
          title="标签与注解"
        >
          <Metadata
            labels={object?.metadata?.labels}
            annotations={object?.metadata?.annotations}
          />
        </CollapsibleField>
      </div>
    </>
  );
};

export default WorkloadDetail;
