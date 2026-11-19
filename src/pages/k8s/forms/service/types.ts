import type { KeyValueEditorItem } from '../shared/KeyValueEditor';

export type ServiceInternalAccessMode = 'ClusterIP' | 'Headless';

export type ServiceExternalAccessMode = 'None' | 'NodePort' | 'LoadBalancer';

export type ServiceIpFamilyPolicy =
  | 'SingleStack'
  | 'PreferDualStack'
  | 'RequireDualStack';

export type ServiceIpFamily = 'IPv4' | 'IPv6';

export type ServiceTrafficPolicy = 'Cluster' | 'Local';

export type ServiceInternalTrafficPolicy = 'Cluster' | 'Local';

export type ServiceTrafficDistribution =
  | 'PreferClose'
  | 'PreferSameZone'
  | 'PreferSameNode';

export type ServicePortProtocol =
  | 'GRPC'
  | 'HTTP'
  | 'HTTP2'
  | 'HTTPS'
  | 'MONGO'
  | 'REDIS'
  | 'SCTP'
  | 'TCP'
  | 'TLS'
  | 'UDP';

export type ServicePortItem = {
  id: string;
  protocol: ServicePortProtocol;
  name?: string;
  /** 数字形式的目标端口（表单里的「容器端口」） */
  containerPort?: number;
  /** 命名的目标端口：仅从已有清单带入，表单里不可编辑 */
  targetPort?: string;
  servicePort?: number;
  nodePort?: number;
  /** 表单协议无法表示的 appProtocol（如 kubernetes.io/h2c）：仅从已有清单带入并原样写回 */
  appProtocol?: string;
};

export type CreateServiceFormValues = {
  name?: string;
  namespace?: string;
  internalAccessMode: ServiceInternalAccessMode;
  selectors: KeyValueEditorItem[];
  ports: ServicePortItem[];
  enableExternalAccess: boolean;
  externalAccessMode: ServiceExternalAccessMode;
  enableSessionAffinity: boolean;
  sessionAffinityTimeoutSeconds?: number;
  externalAccessAnnotations?: KeyValueEditorItem[];
  loadBalancerProvider?: string;
  loadBalancerClass?: string;
  allocateLoadBalancerNodePorts?: boolean;
  externalTrafficPolicy?: ServiceTrafficPolicy;
  internalTrafficPolicy?: ServiceInternalTrafficPolicy;
  ipFamilyPolicy?: ServiceIpFamilyPolicy;
  ipFamilies?: ServiceIpFamily[];
  trafficDistribution?: ServiceTrafficDistribution;
  labels: KeyValueEditorItem[];
  annotations: KeyValueEditorItem[];
};

export type WorkloadSelectorType = 'Deployment' | 'StatefulSet' | 'DaemonSet';

export type WorkloadContainerPort = {
  name?: string;
  containerPort: number;
  protocol?: string;
};

/** 工作负载选择弹窗返回的条目：标签 / 选择器 / 容器端口在确认时从对象原文读取 */
export type WorkloadSelectorItem = {
  id: string;
  name: string;
  namespace?: string;
  type: WorkloadSelectorType;
  /** Pod 模板标签 */
  labels?: Record<string, string>;
  /** spec.selector.matchLabels */
  selector?: Record<string, string>;
  ports?: WorkloadContainerPort[];
};
