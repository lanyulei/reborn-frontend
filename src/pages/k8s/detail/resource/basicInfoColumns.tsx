import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
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

export type GenericBasicInfo = {
  namespace?: string;
  api_version?: string;
  uid?: string;
  create_time?: string;
};

export const genericBasicInfoColumns: ProDescriptionsItemProps<GenericBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: 'API 版本',
      dataIndex: 'api_version',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'UID',
      dataIndex: 'uid',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const customResourceDefinitionBasicInfoColumns: ProDescriptionsItemProps<CustomResourceDefinitionBasicInfo>[] =
  [
    {
      title: '作用域',
      dataIndex: 'scope',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const storageClassBasicInfoColumns: ProDescriptionsItemProps<StorageClassBasicInfo>[] =
  [
    {
      title: '默认存储卷',
      dataIndex: 'default_volume',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: '供应者',
      dataIndex: 'provisioner',
      renderText: (value) => formatValue(value),
    },
    {
      title: '允许卷克隆',
      dataIndex: 'allow_volume_clone',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: '允许卷拓展',
      dataIndex: 'allow_volume_expansion',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: '回收机制',
      dataIndex: 'reclaim_policy',
      renderText: (value) => getReclaimPolicyLabel(value),
    },
    {
      title: '允许卷快照',
      dataIndex: 'allow_volume_snapshot',
      renderText: (value) => formatStorageClassBoolean(value),
    },
  ];

export const persistentVolumeClaimBasicInfoColumns: ProDescriptionsItemProps<PersistentVolumeClaimBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => <StatusText status={record.status} />,
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '访问模式',
      dataIndex: 'access_modes',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '供应者',
      dataIndex: 'provisioner',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '存储类',
      dataIndex: 'storage_class',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '持久卷',
      dataIndex: 'volume_name',
      renderText: (value) => formatPersistentVolumeClaimValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const persistentVolumeBasicInfoColumns: ProDescriptionsItemProps<PersistentVolumeBasicInfo>[] =
  [
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => <StatusText status={record.status} />,
    },
    {
      title: '容量',
      dataIndex: 'capacity',
      renderText: (value) => formatValue(value),
    },
    {
      title: '访问模式',
      dataIndex: 'access_modes',
      renderText: (value) => formatValue(value),
    },
    {
      title: '回收策略',
      dataIndex: 'reclaim_policy',
      renderText: (value) => getReclaimPolicyLabel(value),
    },
    {
      title: '存储类',
      dataIndex: 'storage_class',
      renderText: (value) => formatValue(value),
    },
    {
      title: '绑定声明',
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
      title: '卷模式',
      dataIndex: 'volume_mode',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const horizontalPodAutoscalerBasicInfoColumns: ProDescriptionsItemProps<HorizontalPodAutoscalerBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '伸缩目标',
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
      title: '最小副本',
      dataIndex: 'min_replicas',
      renderText: (value) => formatValue(value),
    },
    {
      title: '最大副本',
      dataIndex: 'max_replicas',
      renderText: (value) => formatValue(value),
    },
    {
      title: '当前副本',
      dataIndex: 'current_replicas',
      renderText: (value) => formatValue(value),
    },
    {
      title: '期望副本',
      dataIndex: 'desired_replicas',
      renderText: (value) => formatValue(value),
    },
    {
      title: '当前指标',
      dataIndex: 'current_metrics',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const networkPolicyBasicInfoColumns: ProDescriptionsItemProps<NetworkPolicyBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: 'Pod 选择器',
      dataIndex: 'pod_selector',
      render: (_, record) => <LabelTags value={record.pod_selector} max={0} />,
    },
    {
      title: '策略类型',
      dataIndex: 'policy_types',
      renderText: (value) => formatValue(value),
    },
    {
      title: '入站规则',
      dataIndex: 'ingress_rules',
      renderText: (value) => formatValue(value),
    },
    {
      title: '出站规则',
      dataIndex: 'egress_rules',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const ingressClassBasicInfoColumns: ProDescriptionsItemProps<IngressClassBasicInfo>[] =
  [
    {
      title: '默认',
      dataIndex: 'default_class',
      renderText: (value) => formatStorageClassBoolean(value),
    },
    {
      title: '控制器',
      dataIndex: 'controller',
      renderText: (value) => formatValue(value),
    },
    {
      title: '参数引用',
      dataIndex: 'parameters',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const endpointSliceBasicInfoColumns: ProDescriptionsItemProps<EndpointSliceBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '服务',
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
      title: '地址类型',
      dataIndex: 'address_type',
      renderText: (value) => formatValue(value),
    },
    {
      title: '端点',
      dataIndex: 'endpoints',
      renderText: (value) => formatValue(value),
    },
    {
      title: '就绪端点',
      dataIndex: 'ready_endpoints',
      renderText: (value) => formatValue(value),
    },
    {
      title: '端口',
      dataIndex: 'ports',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const secretBasicInfoColumns: ProDescriptionsItemProps<SecretBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '类型',
      dataIndex: 'type',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const configMapBasicInfoColumns: ProDescriptionsItemProps<ConfigMapBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const ingressBasicInfoColumns: ProDescriptionsItemProps<IngressBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '网关地址',
      dataIndex: 'gateway_address',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'Ingress Class',
      dataIndex: 'ingress_class',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const serviceBasicInfoColumns: ProDescriptionsItemProps<ServiceBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '类型',
      dataIndex: 'type',
      renderText: (value) => formatValue(value),
    },
    {
      title: '虚拟 IP 地址',
      dataIndex: 'cluster_ip',
      renderText: (value) => formatValue(value),
    },
    {
      title: '外部 IP 地址',
      dataIndex: 'external_ip',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'IP Family 策略',
      dataIndex: 'ip_family_policy',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'IP Families',
      dataIndex: 'ip_families',
      renderText: (value) => formatValue(value),
    },
    {
      title: '内部流量策略',
      dataIndex: 'internal_traffic_policy',
      renderText: (value) => formatValue(value),
    },
    {
      title: '外部流量策略',
      dataIndex: 'external_traffic_policy',
      renderText: (value) => formatValue(value),
    },
    {
      title: '流量分布',
      dataIndex: 'traffic_distribution',
      renderText: (value) => formatValue(value),
    },
    {
      title: 'LoadBalancer Class',
      dataIndex: 'load_balancer_class',
      renderText: (value) => formatValue(value),
    },
    {
      title: '会话亲和性',
      dataIndex: 'session_affinity',
      renderText: (value) => formatValue(value),
    },
    {
      title: '选择器',
      dataIndex: 'selector',
      render: (_, record) => <LabelTags value={record.selector} max={0} />,
    },
    {
      title: 'DNS',
      dataIndex: 'dns',
      renderText: (value) => formatValue(value),
    },
    {
      title: '端点',
      dataIndex: 'endpoints',
      renderText: (value) => formatValue(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const serviceAccountBasicInfoColumns: ProDescriptionsItemProps<ServiceAccountBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const jobBasicInfoColumns: ProDescriptionsItemProps<JobBasicInfo>[] = [
  {
    title: '命名空间',
    dataIndex: 'namespace',
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (_, record) => <StatusText status={record.status} />,
  },
  {
    title: '最大重试次数',
    dataIndex: 'backoff_limit',
    renderText: (value) => formatValue(value),
  },
  {
    title: '容器组完成数量',
    dataIndex: 'completions',
    renderText: (value) => formatValue(value),
  },
  {
    title: '并行容器组数量',
    dataIndex: 'parallelism',
    renderText: (value) => formatValue(value),
  },
  {
    title: '最大运行时间（s）',
    dataIndex: 'active_deadline_seconds',
    renderText: (value) => formatValue(value),
  },
];

export const cronJobBasicInfoColumns: ProDescriptionsItemProps<CronJobBasicInfo>[] =
  [
    {
      title: '命名空间',
      dataIndex: 'namespace',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => <StatusText status={record.status} />,
    },
    {
      title: '定时计划',
      dataIndex: 'schedule',
      renderText: (value) => formatValue(value),
    },
    {
      title: '最大启动延后时间（s）',
      dataIndex: 'starting_deadline_seconds',
      renderText: (value) => formatValue(value),
    },
    {
      title: '成功任务保留数量',
      dataIndex: 'successful_jobs_history_limit',
      renderText: (value) => formatValue(value),
    },
    {
      title: '失败任务保留数量',
      dataIndex: 'failed_jobs_history_limit',
      renderText: (value) => formatValue(value),
    },
    {
      title: '并发策略',
      dataIndex: 'concurrency_policy',
      renderText: (value) => getConcurrencyPolicyLabel(value),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
    },
  ];

export const podBasicInfoColumns: ProDescriptionsItemProps<PodBasicInfo>[] = [
  {
    title: '命名空间',
    dataIndex: 'namespace',
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (_, record) => <StatusText status={record.status} />,
  },
  {
    title: '容器组 IP 地址',
    dataIndex: 'pod_ip',
    renderText: (value) => formatValue(value),
  },
  {
    title: '节点名称',
    dataIndex: 'node_name',
    renderText: (value) => formatValue(value),
  },
  {
    title: '节点 IP 地址',
    dataIndex: 'node_ip',
    renderText: (value) => formatValue(value),
  },
  {
    title: '重启次数',
    dataIndex: 'restart_count',
    renderText: (value) => formatValue(value),
  },
  {
    title: <QosClassTitle />,
    dataIndex: 'qos_class',
    renderText: (value) => formatValue(value),
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    valueType: 'dateTime',
  },
];
