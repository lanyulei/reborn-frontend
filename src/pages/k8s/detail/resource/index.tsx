/**
 * 通用资源详情（任务、定时任务、容器组、服务、应用路由、配置与保密字典、存储、网络策略等，
 * 以及没有专门视图的类型 / 定制资源）：基本信息 │ 各类型的页签 │ 元数据 │ 事件。
 * 「操作」与列表行的操作同一份清单。
 */
import { history } from '@umijs/max';
import { Modal } from 'antd';
import type React from 'react';
import { useMemo, useState } from 'react';
import type { GVR, K8sObject, ResourceRef } from '@/services/k8s/typings';
import { usePermissions } from '@/services/system/permissions';
import { RelationsTab, usePodSelector } from '../../components/Insight';
import { type LogContainer, LogViewer } from '../../components/LogViewer';
import { MetricsPanel } from '../../components/MetricsPanel';
import { detailPath, GVRS, isNamespaced, sameGVR } from '../../components/meta';
import { PodResizeModal } from '../../components/PodResizeModal';
import { isRbacGVR, RbacSection } from '../../components/RbacSection';
import { DataSection } from '../../components/ResourceDetail';
import { ResourceTable } from '../../components/ResourceTable';
import { useTerminal } from '../../components/Terminal';
import DetailShell, { type DetailTabItem } from '../shared/DetailShell';
import EventTable from '../shared/EventTable';
import Metadata from '../shared/Metadata';
import PodList from '../shared/PodList';
import ReplicaSummary from '../shared/ReplicaSummary';
import useObject from '../shared/useObject';
import {
  buildEndpointSliceBasicInfo,
  buildEndpointSliceEndpointItems,
  buildHpaBasicInfo,
  buildHpaRelationItems,
  buildIngressClassBasicInfo,
  buildIngressClassParameterItems,
  buildNetworkPolicyBasicInfo,
  buildNetworkPolicyRuleItems,
  buildPersistentVolumeBasicInfo,
  buildPersistentVolumeRelationItems,
} from './advancedResourceHelpers';
import {
  configMapBasicInfoColumns,
  cronJobBasicInfoColumns,
  customResourceDefinitionBasicInfoColumns,
  endpointSliceBasicInfoColumns,
  genericBasicInfoColumns,
  horizontalPodAutoscalerBasicInfoColumns,
  ingressBasicInfoColumns,
  ingressClassBasicInfoColumns,
  jobBasicInfoColumns,
  networkPolicyBasicInfoColumns,
  persistentVolumeBasicInfoColumns,
  persistentVolumeClaimBasicInfoColumns,
  podBasicInfoColumns,
  secretBasicInfoColumns,
  serviceAccountBasicInfoColumns,
  serviceBasicInfoColumns,
  storageClassBasicInfoColumns,
} from './basicInfoColumns';
import {
  buildConfigMapBasicInfo,
  buildConfigMapDataItems,
} from './configMapHelpers';
import {
  buildCustomResourceDefinitionBasicInfo,
  buildCustomResourceDefinitionVersions,
} from './customResourceDefinitionHelpers';
import {
  useClaimPods,
  useServiceEndpoints,
  useStorageClassClaims,
  useStorageClassProvisioner,
} from './hooks';
import IngressResourceStatus from './IngressResourceStatus';
import { buildIngressBasicInfo, buildIngressRules } from './ingressHelpers';
import JobEnvironmentVariables from './JobEnvironmentVariables';
import JobRunRecords from './JobRunRecords';
import {
  buildCronJobBasicInfo,
  buildJobBasicInfo,
  buildJobReplicaSummary,
  buildServiceAccountBasicInfo,
} from './jobCronJobHelpers';
import PodHealthChecks from './PodHealthChecks';
import PodResourceStatus from './PodResourceStatus';
import PodSchedulingInfo from './PodSchedulingInfo';
import {
  buildPersistentVolumeClaimBasicInfo,
  getPersistentVolumeClaimStorageClassName,
} from './persistentVolumeClaimHelpers';
import {
  buildPodBasicInfo,
  buildPodConditions,
  buildPodDetail,
} from './podHelpers';
import ResourceBasicInfo, { ResourceNameContext } from './ResourceBasicInfo';
import ResourceDataFields from './ResourceDataFields';
import RowTable from './RowTable';
import ServiceResourceStatus from './ServiceResourceStatus';
import { buildSecretBasicInfo } from './secretHelpers';
import { buildServiceBasicInfo, buildServicePorts } from './serviceHelpers';
import { buildStorageClassBasicInfo } from './storageClassHelpers';

type ResourceDetailPageProps = {
  clusterId: string;
  gvr: GVR;
  namespace?: string;
  name: string;
  tab?: string;
};

type Manifest = Record<string, unknown>;

const is = (gvr: GVR, ...list: GVR[]) =>
  list.some((item) => sameGVR(gvr, item));

/** 容器组里的容器（日志用） */
const podContainers = (object?: K8sObject): LogContainer[] => {
  const names = (list: unknown, init: boolean): LogContainer[] =>
    Array.isArray(list)
      ? list.map((item: { name: string }) => ({ name: item.name, init }))
      : [];
  return [
    ...names(object?.spec?.containers, false),
    ...names(object?.spec?.initContainers, true),
  ];
};

const ResourceDetailPage: React.FC<ResourceDetailPageProps> = ({
  clusterId,
  gvr,
  namespace,
  name,
  tab: initialTab,
}) => {
  const has = usePermissions();
  const terminal = useTerminal();
  const ref = useMemo<ResourceRef>(
    () => ({
      ...gvr,
      namespace: isNamespaced(gvr) ? namespace : undefined,
      name,
    }),
    [gvr, namespace, name],
  );
  const { data, loading, error, reload } = useObject(clusterId, ref);
  const [tab, setTab] = useState(initialTab ?? '');
  const [resizing, setResizing] = useState(false);
  const [logContainer, setLogContainer] = useState<string>();
  const object = data?.object;
  const manifest = object as Manifest | undefined;

  const isPod = sameGVR(gvr, GVRS.pod);
  const isJob = sameGVR(gvr, GVRS.job);
  const isService = sameGVR(gvr, GVRS.service);
  const isPvc = sameGVR(gvr, GVRS.pvc);
  const isStorageClass = sameGVR(gvr, GVRS.storageClass);
  const isCrd = sameGVR(gvr, GVRS.crd);

  // 关联数据（只在对应的资源类型上请求）
  const selector = usePodSelector(clusterId, ref, isJob || isService);
  const labelSelector =
    selector && !selector.empty ? selector.labelSelector : undefined;
  const serviceEndpoints = useServiceEndpoints(
    clusterId,
    namespace,
    name,
    isService,
  );
  const claimPods = useClaimPods(clusterId, namespace, name, isPvc);
  const provisioner = useStorageClassProvisioner(
    clusterId,
    isPvc ? getPersistentVolumeClaimStorageClassName(manifest) : undefined,
  );
  const storageClassClaims = useStorageClassClaims(
    clusterId,
    name,
    isStorageClass,
  );

  const podDetail = useMemo(
    () => (isPod ? buildPodDetail(manifest) : undefined),
    [isPod, manifest],
  );
  const canLog = isPod && has('k8s.workload.log');
  const canExec = isPod && has('k8s.workload.exec');
  const canResize = isPod && has('k8s.workload.scale');

  const metadataTab: DetailTabItem = {
    key: 'metadata',
    label: '元数据',
    children: (
      <Metadata
        labels={object?.metadata?.labels}
        annotations={object?.metadata?.annotations}
      />
    ),
  };
  const eventsTab: DetailTabItem = {
    key: 'events',
    label: '事件',
    children: <EventTable clusterId={clusterId} compact target={ref} />,
  };
  const relationsTab: DetailTabItem = {
    key: 'relations',
    label: '关联关系',
    children: (
      <RelationsTab
        clusterId={clusterId}
        target={ref}
        onOpen={(target, targetName) =>
          history.push(detailPath(clusterId, target, targetName, namespace))
        }
      />
    ),
  };
  const fields = (
    key: string,
    label: string,
    items: React.ComponentProps<typeof ResourceDataFields>['items'],
    emptyText?: string,
  ): DetailTabItem => ({
    key,
    label,
    children: <ResourceDataFields emptyText={emptyText} items={items} />,
  });
  const envTab: DetailTabItem = {
    key: 'env',
    label: '环境变量',
    children: <JobEnvironmentVariables manifest={manifest} />,
  };
  const selectedPods = labelSelector ? (
    <PodList
      clusterId={clusterId}
      namespace={namespace}
      fixed={{ labelSelector }}
      // 服务：容器组只是「资源状态」里的一个小节
      section={isService}
    />
  ) : (
    <PodList
      // 没有选择器：不选中任何容器组
      clusterId={clusterId}
      namespace={namespace}
      fixed={{ labelSelector: 'kubernetes.io/no-such-label=none' }}
      section={isService}
    />
  );

  let basicInfo: React.ReactNode;
  let typeTabs: DetailTabItem[];

  if (isPod) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={podBasicInfoColumns}
        dataSource={buildPodBasicInfo(manifest, namespace)}
      />
    );
    typeTabs = [
      {
        key: 'resourceStatus',
        label: '资源状态',
        children: (
          <PodResourceStatus
            pod={podDetail}
            onResize={canResize ? () => setResizing(true) : undefined}
            onLog={
              canLog
                ? (container) => setLogContainer(container.name)
                : undefined
            }
            onTerminal={
              canExec
                ? (container) =>
                    terminal.open({
                      clusterId,
                      namespace: namespace ?? '',
                      pod: name,
                      container: container.name,
                    })
                : undefined
            }
          />
        ),
      },
      {
        key: 'scheduling',
        label: '调度信息',
        children: (
          <PodSchedulingInfo
            conditions={buildPodConditions(manifest)}
            pod={podDetail}
          />
        ),
      },
      {
        key: 'health',
        label: '健康检查',
        children: <PodHealthChecks pod={podDetail} />,
      },
      metadataTab,
      envTab,
      eventsTab,
      ...(canLog
        ? [
            {
              key: 'logs',
              label: '日志',
              children: (
                <LogViewer
                  clusterId={clusterId}
                  height={560}
                  target={{
                    mode: 'pod' as const,
                    namespace: namespace ?? '',
                    pod: name,
                    containers: podContainers(object),
                  }}
                />
              ),
            },
          ]
        : []),
      {
        key: 'metrics',
        label: '监控',
        children: (
          <MetricsPanel
            clusterId={clusterId}
            target={{ kind: 'pod', namespace: namespace ?? '', name }}
          />
        ),
      },
    ];
  } else if (isJob) {
    basicInfo = (
      <>
        <ReplicaSummary
          data={{ ...buildJobReplicaSummary(manifest), scalable: false }}
          disabledReason="任务的并行数量请通过「编辑 YAML」调整"
        />
        <ResourceBasicInfo
          columns={jobBasicInfoColumns}
          dataSource={buildJobBasicInfo(manifest, namespace)}
        />
      </>
    );
    typeTabs = [
      {
        key: 'runs',
        label: '运行记录',
        children: <JobRunRecords object={object} />,
      },
      { key: 'resourceStatus', label: '资源状态', children: selectedPods },
      metadataTab,
      envTab,
      eventsTab,
    ];
  } else if (sameGVR(gvr, GVRS.cronJob)) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={cronJobBasicInfoColumns}
        dataSource={buildCronJobBasicInfo(manifest, namespace)}
      />
    );
    typeTabs = [
      {
        key: 'runs',
        label: '运行记录',
        children: (
          <ResourceTable
            compact
            tabLayout
            flushToolbar
            clusterId={clusterId}
            gvr={GVRS.job}
            namespace={namespace ?? ''}
            fixed={{ owner: data?.uid }}
            onOpen={(row) =>
              history.push(
                detailPath(clusterId, GVRS.job, row.name, row.namespace),
              )
            }
          />
        ),
      },
      metadataTab,
      envTab,
      eventsTab,
    ];
  } else if (isService) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={serviceBasicInfoColumns}
        dataSource={buildServiceBasicInfo(
          manifest,
          serviceEndpoints,
          namespace,
        )}
      />
    );
    typeTabs = [
      {
        key: 'resourceStatus',
        label: '资源状态',
        children: (
          <ServiceResourceStatus
            ports={buildServicePorts(manifest)}
            pods={selectedPods}
          />
        ),
      },
      relationsTab,
      metadataTab,
      eventsTab,
    ];
  } else if (sameGVR(gvr, GVRS.ingress)) {
    basicInfo = (
      <ResourceBasicInfo
        columns={ingressBasicInfoColumns}
        dataSource={buildIngressBasicInfo(manifest, namespace)}
      />
    );
    typeTabs = [
      {
        key: 'resourceStatus',
        label: '资源状态',
        children: <IngressResourceStatus rules={buildIngressRules(manifest)} />,
      },
      relationsTab,
      metadataTab,
      eventsTab,
    ];
  } else if (isPvc) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={persistentVolumeClaimBasicInfoColumns}
        dataSource={buildPersistentVolumeClaimBasicInfo(
          manifest,
          namespace,
          provisioner,
        )}
      />
    );
    typeTabs = [
      {
        key: 'resourceStatus',
        label: '资源状态',
        children: (
          <RowTable
            clusterId={clusterId}
            gvr={GVRS.pod}
            rows={claimPods.pods}
            loading={claimPods.loading}
            onReload={() => void claimPods.reload()}
            cells={[
              { key: 'node', title: '节点' },
              { key: 'ip', title: 'IP 地址' },
            ]}
            notice={
              claimPods.truncated
                ? '该命名空间的容器组较多，只检查了前 200 个。'
                : undefined
            }
          />
        ),
      },
      metadataTab,
      eventsTab,
    ];
  } else if (sameGVR(gvr, GVRS.pv)) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={persistentVolumeBasicInfoColumns}
        dataSource={buildPersistentVolumeBasicInfo(manifest)}
      />
    );
    typeTabs = [
      fields('claim', '绑定关系', buildPersistentVolumeRelationItems(manifest)),
      metadataTab,
      eventsTab,
    ];
  } else if (isStorageClass) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={storageClassBasicInfoColumns}
        dataSource={buildStorageClassBasicInfo(manifest)}
      />
    );
    typeTabs = [
      {
        key: 'persistentVolumeClaims',
        label: '持久卷声明',
        children: (
          <RowTable
            clusterId={clusterId}
            gvr={GVRS.pvc}
            rows={storageClassClaims.rows}
            loading={storageClassClaims.loading}
            onReload={() => void storageClassClaims.reload()}
            cells={[{ key: 'capacity', title: '容量' }]}
          />
        ),
      },
      metadataTab,
    ];
  } else if (sameGVR(gvr, GVRS.hpa)) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={horizontalPodAutoscalerBasicInfoColumns}
        dataSource={buildHpaBasicInfo(manifest, namespace)}
      />
    );
    typeTabs = [
      fields('target', '目标与指标', buildHpaRelationItems(manifest)),
      metadataTab,
      eventsTab,
    ];
  } else if (sameGVR(gvr, GVRS.networkPolicy)) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={networkPolicyBasicInfoColumns}
        dataSource={buildNetworkPolicyBasicInfo(manifest, namespace)}
      />
    );
    typeTabs = [
      fields(
        'rules',
        '规则摘要',
        buildNetworkPolicyRuleItems(manifest),
        '暂无 ingress/egress 规则',
      ),
      metadataTab,
      eventsTab,
    ];
  } else if (sameGVR(gvr, GVRS.ingressClass)) {
    basicInfo = (
      <ResourceBasicInfo
        columns={ingressClassBasicInfoColumns}
        dataSource={buildIngressClassBasicInfo(manifest)}
      />
    );
    typeTabs = [
      fields(
        'parameters',
        '参数引用',
        buildIngressClassParameterItems(manifest),
      ),
      metadataTab,
    ];
  } else if (sameGVR(gvr, GVRS.endpointSlice)) {
    basicInfo = (
      <ResourceBasicInfo
        column={3}
        columns={endpointSliceBasicInfoColumns}
        dataSource={buildEndpointSliceBasicInfo(manifest, namespace)}
      />
    );
    typeTabs = [
      fields(
        'endpoints',
        '端点',
        buildEndpointSliceEndpointItems(manifest),
        '暂无端点',
      ),
      metadataTab,
      eventsTab,
    ];
  } else if (isCrd) {
    const version = buildCustomResourceDefinitionVersions(manifest)[0];
    basicInfo = (
      <ResourceBasicInfo
        columns={customResourceDefinitionBasicInfoColumns}
        dataSource={buildCustomResourceDefinitionBasicInfo(manifest)}
      />
    );
    typeTabs = [
      ...(version?.name && version.plural
        ? [
            {
              key: 'customResources',
              label: '定制资源',
              children: (() => {
                const target: GVR = {
                  group: version.group ?? '',
                  version: version.name,
                  resource: version.plural,
                };
                const namespaced = version.scope !== 'Cluster';
                return (
                  <ResourceTable
                    compact
                    tabLayout
                    flushToolbar
                    clusterId={clusterId}
                    gvr={target}
                    namespaced={namespaced}
                    onOpen={(row) =>
                      history.push(
                        detailPath(
                          clusterId,
                          target,
                          row.name,
                          namespaced ? row.namespace : undefined,
                        ),
                      )
                    }
                  />
                );
              })(),
            },
          ]
        : []),
      metadataTab,
    ];
  } else if (is(gvr, GVRS.configMap, GVRS.secret)) {
    const secret = sameGVR(gvr, GVRS.secret);
    basicInfo = secret ? (
      <ResourceBasicInfo
        column={3}
        columns={secretBasicInfoColumns}
        dataSource={buildSecretBasicInfo(manifest, namespace)}
      />
    ) : (
      <ResourceBasicInfo
        columns={configMapBasicInfoColumns}
        dataSource={buildConfigMapBasicInfo(manifest, namespace)}
      />
    );
    typeTabs = [
      {
        key: 'data',
        label: '数据',
        children: secret ? (
          // 保密字典的值默认掩码：有权限时可查看明文（记入审计）
          object && <DataSection clusterId={clusterId} object={object} secret />
        ) : (
          <ResourceDataFields items={buildConfigMapDataItems(manifest)} />
        ),
      },
      relationsTab,
      metadataTab,
      eventsTab,
    ];
  } else if (sameGVR(gvr, GVRS.serviceAccount)) {
    basicInfo = (
      <ResourceBasicInfo
        columns={serviceAccountBasicInfoColumns}
        dataSource={buildServiceAccountBasicInfo(manifest, namespace)}
      />
    );
    typeTabs = [metadataTab, eventsTab];
  } else {
    // 没有专门视图的类型（访问控制、副本集、定制资源等）
    basicInfo = (
      <ResourceBasicInfo
        columns={genericBasicInfoColumns}
        dataSource={{
          namespace: object?.metadata?.namespace || '-',
          api_version: object?.apiVersion,
          uid: data?.uid,
          create_time: object?.metadata?.creationTimestamp,
        }}
      />
    );
    typeTabs = [
      ...(object && isRbacGVR(gvr)
        ? [
            {
              key: 'rbac',
              label: '规则与绑定',
              children: (
                <RbacSection clusterId={clusterId} gvr={gvr} object={object} />
              ),
            },
          ]
        : []),
      metadataTab,
      eventsTab,
    ];
  }

  return (
    <DetailShell
      loading={loading}
      error={error}
      ready={Boolean(object)}
      activeTab={tab}
      onTabChange={setTab}
      basicInfo={
        <ResourceNameContext.Provider value={name}>
          {basicInfo}
        </ResourceNameContext.Provider>
      }
      tabs={typeTabs}
    >
      {resizing && (
        <PodResizeModal
          clusterId={clusterId}
          target={ref}
          onClose={() => setResizing(false)}
          onDone={() => void reload()}
        />
      )}
      {logContainer && (
        <Modal
          destroyOnHidden
          footer={null}
          onCancel={() => setLogContainer(undefined)}
          open
          title={`容器日志 · ${name} / ${logContainer}`}
          width="calc(100vw - 48px)"
        >
          <LogViewer
            clusterId={clusterId}
            height={520}
            target={{
              mode: 'pod',
              namespace: namespace ?? '',
              pod: name,
              containers: [{ name: logContainer }],
            }}
          />
        </Modal>
      )}
    </DetailShell>
  );
};

export default ResourceDetailPage;
