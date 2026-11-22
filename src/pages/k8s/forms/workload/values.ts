/**
 * 工作负载创建向导的表单初值与默认容器名（纯函数，不依赖 React / antd）。
 * 从 helpers.ts 切出：初值结构跟着表单模型走，与清单构建逻辑分开维护。
 */
import { createId } from '../shared/manifest';
import type {
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadKind,
} from './types';

/** 默认容器名：只用小写字母和数字（容器名必须是小写 DNS label） */
export const createRandomContainerName = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const suffix = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');

  return `container-${suffix}`;
};

export const getInitialContainerValues = (): CreateWorkloadContainerValues => ({
  id: createId(),
  containerName: undefined,
  image: undefined,
  containerType: 'worker',
  imagePullPolicy: 'IfNotPresent',
  cpuRequest: undefined,
  cpuLimit: undefined,
  memoryRequest: undefined,
  memoryLimit: undefined,
  containerPorts: [{ protocol: 'HTTP', name: 'http-0' }],
  enableHealthCheck: false,
  healthChecks: {},
  enableLifecycle: false,
  lifecycleActions: {},
  enableStartupCommand: false,
  startupCommand: [],
  startupArgs: [],
  enableContainerEnv: false,
  containerEnv: [],
  enableContainerSecurityContext: false,
  containerPrivileged: false,
  containerRunAsNonRoot: false,
  containerRunAsUser: undefined,
  containerRunAsGroup: undefined,
  containerReadOnlyRootFilesystem: false,
  allowPrivilegeEscalation: false,
  containerSeLinuxLevel: undefined,
  containerSeLinuxRole: undefined,
  containerSeLinuxType: undefined,
  containerSeLinuxUser: undefined,
  containerCapabilitiesAdd: [''],
  containerCapabilitiesDrop: [''],
  containerSeccompProfileType: undefined,
  containerSeccompProfileLocalhost: '',
  enableResizePolicy: false,
  cpuResizeRestartPolicy: undefined,
  memoryResizeRestartPolicy: undefined,
  syncHostTimezone: false,
});

export const getInitialCreateWorkloadValues = (
  kind: WorkloadKind,
  namespace?: string,
): CreateWorkloadFormValues => ({
  namespace: namespace || undefined,
  name: undefined,
  replicas: kind === 'DaemonSet' ? undefined : 1,
  updateStrategyType: 'RollingUpdate',
  maxUnavailable: '25%',
  maxSurge: '25%',
  minReadySeconds: 0,
  updatePartition: 0,
  enablePodSecurityContext: false,
  runAsNonRoot: false,
  enablePodGracefulTermination: false,
  terminationGracePeriodSeconds: 30,
  podAnnotations: [],
  podSchedulingRule: 'default',
  podSchedulingCustomRules: [],
  containers: [],
  storageCategory: 'none',
  storageType: 'none',
  volumeType: 'persistentVolumeClaim',
  configResourceType: 'configMap',
  volumeName: 'data',
  emptyDirSizeLimit: '200Mi',
  hostPath: undefined,
  claimName: undefined,
  claimStorageClassName: undefined,
  claimCapacity: undefined,
  claimAccessModes: undefined,
  pvcNamePrefix: '',
  pvcStorageClassName: undefined,
  pvcAccessModes: ['ReadWriteOnce'],
  pvcSizeGi: 10,
  configResourceName: undefined,
  containerMounts: [],
  selectSpecificKeys: false,
  specificKeyPaths: [],
  storageItems: [],
  enableNodeSelector: false,
  nodeSelectors: [],
  selectedNodeNames: [],
  labels: [],
  annotations: [],
});
