import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { useT } from '@/utils/i18n';
import { LabelTags } from '../../components/cells';
import ClusterLink from '../shared/ClusterLink';
import {
  type ConfigMapBasicInfo,
  type CustomResourceDefinitionBasicInfo,
  type EndpointSliceBasicInfo,
  formatPersistentVolumeClaimValue,
  formatStorageClassBoolean,
  formatValue,
  getConcurrencyPolicyLabel,
  getReclaimPolicyLabel,
  type HorizontalPodAutoscalerBasicInfo,
  type IngressBasicInfo,
  type IngressClassBasicInfo,
  type NetworkPolicyBasicInfo,
  type PersistentVolumeBasicInfo,
  type PersistentVolumeClaimBasicInfo,
  type PodBasicInfo,
  type SecretBasicInfo,
  type ServiceBasicInfo,
  type StorageClassBasicInfo,
} from './basicInfoColumnDependencies';
import type {
  CronJobBasicInfo,
  JobBasicInfo,
  ServiceAccountBasicInfo,
} from './jobCronJobHelpers';
import QosClassTitle from './QosClassTitle';
import StatusText from './StatusText';

/** 列定义是模块级常量，标题在渲染期取当前语言 */
const Msg = ({ id }: { id: string }) => {
  const t = useT();
  return <>{t(id)}</>;
};

export type GenericBasicInfo = {
  namespace?: string;
  api_version?: string;
  uid?: string;
  create_time?: string;
};

export const genericBasicInfoColumns: ProDescriptionsItemProps<GenericBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="pages.k8s.detail.basic.apiVersion" />,
      dataIndex: 'api_version',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const customResourceDefinitionBasicInfoColumns: ProDescriptionsItemProps<CustomResourceDefinitionBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.detail.basic.scope" />,
      dataIndex: 'scope',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const storageClassBasicInfoColumns: ProDescriptionsItemProps<StorageClassBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.detail.basic.defaultClass" />,
      dataIndex: 'default_volume',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.provisioner" />,
      dataIndex: 'provisioner',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.allowClone" />,
      dataIndex: 'allow_volume_clone',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.allowExpansion" />,
      dataIndex: 'allow_volume_expansion',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.scReclaimPolicy" />,
      dataIndex: 'reclaim_policy',
      renderText: (value) => getReclaimPolicyLabel(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.allowSnapshot" />,
      dataIndex: 'allow_volume_snapshot',
      renderText: (value) => formatStorageClassBoolean(value),
    },
  ];

export const persistentVolumeClaimBasicInfoColumns: ProDescriptionsItemProps<PersistentVolumeClaimBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="common.column.status" />,
      dataIndex: 'status',
      render: (_, record) => <StatusText status={record.status} />,
    },
    {
      title: <Msg id="pages.k8s.detail.capacity" />,
      dataIndex: 'capacity',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.accessModes" />,
      dataIndex: 'access_modes',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.provisioner" />,
      dataIndex: 'provisioner',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: <Msg id="pages.k8s.kind.StorageClass" />,
      dataIndex: 'storage_class',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: <Msg id="pages.k8s.kind.PersistentVolume" />,
      dataIndex: 'volume_name',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const persistentVolumeBasicInfoColumns: ProDescriptionsItemProps<PersistentVolumeBasicInfo>[] =
  [
    {
      title: <Msg id="common.column.status" />,
      dataIndex: 'status',
      render: (_, record) => <StatusText status={record.status} />,
    },
    {
      title: <Msg id="pages.k8s.detail.capacity" />,
      dataIndex: 'capacity',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.accessModes" />,
      dataIndex: 'access_modes',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.pvReclaimPolicy" />,
      dataIndex: 'reclaim_policy',
      renderText: (value) => getReclaimPolicyLabel(value),
    },
    {
      title: <Msg id="pages.k8s.kind.StorageClass" />,
      dataIndex: 'storage_class',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.claimRef" />,
      dataIndex: 'claim_ref',
      render: (_, record) =>
        record.claim_path ? (
          <ClusterLink to={record.claim_path}>
            {record.claim_ref || '-'}
          </ClusterLink>
        ) : (
          formatValue(record.claim_ref)
        ),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.volumeMode" />,
      dataIndex: 'volume_mode',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const horizontalPodAutoscalerBasicInfoColumns: ProDescriptionsItemProps<HorizontalPodAutoscalerBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="pages.k8s.detail.basic.scaleTarget" />,
      dataIndex: 'target',
      render: (_, record) =>
        record.target_path ? (
          <ClusterLink to={record.target_path}>
            {record.target || '-'}
          </ClusterLink>
        ) : (
          formatValue(record.target)
        ),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.minReplicas" />,
      dataIndex: 'min_replicas',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.maxReplicas" />,
      dataIndex: 'max_replicas',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.currentReplicas" />,
      dataIndex: 'current_replicas',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.desiredReplicas" />,
      dataIndex: 'desired_replicas',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.currentMetrics" />,
      dataIndex: 'current_metrics',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const networkPolicyBasicInfoColumns: ProDescriptionsItemProps<NetworkPolicyBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="pages.k8s.detail.basic.podSelector" />,
      dataIndex: 'pod_selector',
      render: (_, record) => <LabelTags value={record.pod_selector} max={0} />,
    },
    {
      title: <Msg id="pages.k8s.detail.basic.policyTypes" />,
      dataIndex: 'policy_types',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.ingressRules" />,
      dataIndex: 'ingress_rules',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.egressRules" />,
      dataIndex: 'egress_rules',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const ingressClassBasicInfoColumns: ProDescriptionsItemProps<IngressClassBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.detail.basic.default" />,
      dataIndex: 'default_class',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.controller" />,
      dataIndex: 'controller',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.parameters" />,
      dataIndex: 'parameters',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const endpointSliceBasicInfoColumns: ProDescriptionsItemProps<EndpointSliceBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="pages.k8s.kind.Service" />,
      dataIndex: 'service_name',
      render: (_, record) =>
        record.service_path ? (
          <ClusterLink to={record.service_path}>
            {record.service_name || '-'}
          </ClusterLink>
        ) : (
          formatValue(record.service_name)
        ),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.addressType" />,
      dataIndex: 'address_type',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.endpoints" />,
      dataIndex: 'endpoints',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.readyEndpoints" />,
      dataIndex: 'ready_endpoints',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.ports" />,
      dataIndex: 'ports',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const secretBasicInfoColumns: ProDescriptionsItemProps<SecretBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="pages.k8s.event.type" />,
      dataIndex: 'type',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const configMapBasicInfoColumns: ProDescriptionsItemProps<ConfigMapBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const ingressBasicInfoColumns: ProDescriptionsItemProps<IngressBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="pages.k8s.detail.basic.gatewayAddress" />,
      dataIndex: 'gateway_address',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'Ingress Class',
      dataIndex: 'ingress_class',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const serviceBasicInfoColumns: ProDescriptionsItemProps<ServiceBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="pages.k8s.event.type" />,
      dataIndex: 'type',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.clusterIp" />,
      dataIndex: 'cluster_ip',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.externalIp" />,
      dataIndex: 'external_ip',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.ipFamilyPolicy" />,
      dataIndex: 'ip_family_policy',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'IP Families',
      dataIndex: 'ip_families',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.internalTrafficPolicy" />,
      dataIndex: 'internal_traffic_policy',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.externalTrafficPolicy" />,
      dataIndex: 'external_traffic_policy',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.trafficDistribution" />,
      dataIndex: 'traffic_distribution',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'LoadBalancer Class',
      dataIndex: 'load_balancer_class',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.sessionAffinity" />,
      dataIndex: 'session_affinity',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.selector" />,
      dataIndex: 'selector',
      render: (_, record) => <LabelTags value={record.selector} max={0} />,
    },
    {
      title: 'DNS',
      dataIndex: 'dns',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.endpoints" />,
      dataIndex: 'endpoints',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const serviceAccountBasicInfoColumns: ProDescriptionsItemProps<ServiceAccountBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const jobBasicInfoColumns: ProDescriptionsItemProps<JobBasicInfo>[] = [
  {
    title: <Msg id="pages.k8s.column.namespace" />,
    dataIndex: 'namespace',
  },
  {
    title: <Msg id="common.column.status" />,
    dataIndex: 'status',
    render: (_, record) => <StatusText status={record.status} />,
  },
  {
    title: <Msg id="pages.k8s.detail.basic.backoffLimit" />,
    dataIndex: 'backoff_limit',
    renderText: (value) => formatValue(value),
  },
  {
    title: <Msg id="pages.k8s.detail.basic.completions" />,
    dataIndex: 'completions',
    renderText: (value) => formatValue(value),
  },
  {
    title: <Msg id="pages.k8s.detail.basic.parallelism" />,
    dataIndex: 'parallelism',
    renderText: (value) => formatValue(value),
  },
  {
    title: <Msg id="pages.k8s.detail.basic.activeDeadline" />,
    dataIndex: 'active_deadline_seconds',
    renderText: (value) => formatValue(value),
  },
];

export const cronJobBasicInfoColumns: ProDescriptionsItemProps<CronJobBasicInfo>[] =
  [
    {
      title: <Msg id="pages.k8s.column.namespace" />,
      dataIndex: 'namespace',
    },
    {
      title: <Msg id="common.column.status" />,
      dataIndex: 'status',
      render: (_, record) => <StatusText status={record.status} />,
    },
    {
      title: <Msg id="pages.k8s.detail.basic.schedule" />,
      dataIndex: 'schedule',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.startingDeadline" />,
      dataIndex: 'starting_deadline_seconds',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.successfulHistory" />,
      dataIndex: 'successful_jobs_history_limit',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.detail.basic.failedHistory" />,
      dataIndex: 'failed_jobs_history_limit',
      renderText: (value) => formatValue(value),
    },
    {
      title: <Msg id="pages.k8s.form.concurrency" />,
      dataIndex: 'concurrency_policy',
      renderText: (value) => getConcurrencyPolicyLabel(value),
    },
    {
      title: <Msg id="common.column.createTime" />,
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const podBasicInfoColumns: ProDescriptionsItemProps<PodBasicInfo>[] = [
  {
    title: <Msg id="pages.k8s.column.namespace" />,
    dataIndex: 'namespace',
  },
  {
    title: <Msg id="common.column.status" />,
    dataIndex: 'status',
    render: (_, record) => <StatusText status={record.status} />,
  },
  {
    title: <Msg id="pages.k8s.detail.basic.podIp" />,
    dataIndex: 'pod_ip',
    renderText: (value) => formatValue(value),
  },
  {
    title: <Msg id="pages.k8s.detail.pod.nodeName" />,
    dataIndex: 'node_name',
    renderText: (value) => formatValue(value),
  },
  {
    title: <Msg id="pages.k8s.detail.basic.nodeIp" />,
    dataIndex: 'node_ip',
    renderText: (value) => formatValue(value),
  },
  {
    title: <Msg id="pages.k8s.detail.restarts" />,
    dataIndex: 'restart_count',
    renderText: (value) => formatValue(value),
  },
  {
    title: <QosClassTitle />,
    dataIndex: 'qos_class',
    renderText: (value) => formatValue(value),
  },
  {
    title: <Msg id="common.column.createTime" />,
    dataIndex: 'create_time',
    valueType: 'dateTime',
  },
];
