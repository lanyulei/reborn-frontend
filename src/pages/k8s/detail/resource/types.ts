/** 容器组详情视图用的数据形状（由对象原文整理而来，见 podHelpers） */
export type ClusterPodResizeStatus =
  | 'synced'
  | 'pending'
  | 'inProgress'
  | 'deferred'
  | 'infeasible'
  | 'error'
  | 'observing'
  | 'unknown';

export type ClusterPodResizeCondition = {
  type?: string;
  status?: string;
  reason?: string;
  message?: string;
  observed_generation?: number;
  last_transition_time?: string;
};

export type ClusterNodePodContainerResources = {
  requests?: Record<string, string>;
  limits?: Record<string, string>;
};

export type ClusterNodePodContainerResizePolicy = {
  resourceName?: 'cpu' | 'memory';
  restartPolicy?: string;
};

export type ClusterNodePodContainerProbe = {
  type?: string;
  handler?: string;
  detail?: string;
  initial_delay_seconds?: number;
  timeout_seconds?: number;
  period_seconds?: number;
  success_threshold?: number;
  failure_threshold?: number;
};

export type ClusterNodePodContainerPort = {
  name?: string;
  container_port?: number;
  protocol?: string;
};

export type ClusterNodePodContainerEnv = {
  name?: string;
  value?: string;
  value_from?: string;
};

export type ClusterNodePodContainerVolumeMount = {
  name?: string;
  mount_path?: string;
  sub_path?: string;
  read_only?: boolean;
};

export type ClusterNodePodVolume = {
  name?: string;
  type?: string;
  source_name?: string;
  source_path?: string;
  read_only?: boolean;
};

export type ClusterNodePodContainer = {
  name?: string;
  type?: 'container' | 'initContainer' | 'ephemeralContainer';
  image?: string;
  image_pull_policy?: string;
  resources?: ClusterNodePodContainerResources;
  status_resources?: ClusterNodePodContainerResources;
  allocated_resources?: Record<string, string>;
  resize_policy?: ClusterNodePodContainerResizePolicy[];
  resize_status?: ClusterPodResizeStatus;
  status?: string;
  ready?: boolean;
  restart_count?: number;
  env?: ClusterNodePodContainerEnv[];
  ports?: ClusterNodePodContainerPort[];
  probes?: ClusterNodePodContainerProbe[];
  /** 启动命令与参数（argv） */
  command?: string[];
  args?: string[];
  volume_mounts?: ClusterNodePodContainerVolumeMount[];
};

export type ClusterNodePodItem = {
  id?: string;
  name: string;
  namespace?: string;
  generation?: number;
  observed_generation?: number;
  node_name?: string;
  node_ip?: string;
  os_name?: string;
  pod_ip?: string;
  phase?: string;
  qos_class?: string;
  ready?: string;
  status?: string;
  create_time?: string;
  containers?: ClusterNodePodContainer[];
  resize_conditions?: ClusterPodResizeCondition[];
  volumes?: ClusterNodePodVolume[];
};

/** 服务的端点（取自 EndpointSlice） */
export type ClusterServiceEndpointItem = {
  ip?: string;
  targetKind?: string;
  targetName?: string;
  ports?: { name?: string; port?: number; protocol?: string }[];
};
