import {
  formatValue,
  getArrayValue,
  getNumberValue,
  getRecordValue,
  getStringValue,
} from './helpers';
import {
  getPodOsName,
  getPodResizeStatus,
  getResizePolicyItems,
} from './podResizeHelpers';
import type {
  ClusterNodePodContainer,
  ClusterNodePodContainerProbe,
  ClusterNodePodContainerResources,
  ClusterNodePodItem,
  ClusterNodePodVolume,
} from './types';

type PodBasicInfo = {
  namespace?: string;
  status?: string;
  pod_ip?: string;
  node_name?: string;
  node_ip?: string;
  restart_count?: number;
  qos_class?: string;
  create_time?: string;
};

type PodConditionItem = {
  type?: string;
  status?: string;
  reason?: string;
  message?: string;
  last_transition_time?: string;
};

const getPodSpec = (manifest?: Record<string, unknown>) => {
  const spec = getRecordValue(manifest?.spec);
  const template = getRecordValue(spec?.template);
  const templateSpec = getRecordValue(template?.spec);

  return templateSpec || spec;
};

const getPodStatus = (manifest?: Record<string, unknown>) => {
  const metadata = getRecordValue(manifest?.metadata);
  const status = getRecordValue(manifest?.status);
  const containerStatuses = getArrayValue(status?.containerStatuses)
    .map((item) => getRecordValue(item))
    .filter(Boolean);
  const waitingStatus = containerStatuses.find((item) =>
    getRecordValue(getRecordValue(item?.state)?.waiting),
  );
  const terminatedStatus = containerStatuses.find((item) =>
    getRecordValue(getRecordValue(item?.state)?.terminated),
  );

  if (metadata?.deletionTimestamp) {
    return 'Terminating';
  }

  return (
    getStringValue(status?.reason) ||
    getStringValue(
      getRecordValue(getRecordValue(waitingStatus?.state)?.waiting)?.reason,
    ) ||
    getStringValue(
      getRecordValue(getRecordValue(terminatedStatus?.state)?.terminated)
        ?.reason,
    ) ||
    getStringValue(status?.phase)
  );
};

const getContainerStatus = (status?: Record<string, unknown>) => {
  if (!status) {
    return '-';
  }

  const state = getRecordValue(status.state);
  const waiting = getRecordValue(state?.waiting);
  const running = getRecordValue(state?.running);
  const terminated = getRecordValue(state?.terminated);

  if (waiting) {
    return getStringValue(waiting.reason) || 'Waiting';
  }
  if (running) {
    return 'Running';
  }
  if (terminated) {
    return getStringValue(terminated.reason) || 'Terminated';
  }
  return '-';
};

const getEnvValueFrom = (env: Record<string, unknown>) => {
  const valueFrom = getRecordValue(env.valueFrom);

  if (!valueFrom) {
    return undefined;
  }

  const configMapKeyRef = getRecordValue(valueFrom.configMapKeyRef);
  if (configMapKeyRef) {
    return `ConfigMap: ${formatValue(configMapKeyRef.name)}/${formatValue(
      configMapKeyRef.key,
    )}`;
  }

  const secretKeyRef = getRecordValue(valueFrom.secretKeyRef);
  if (secretKeyRef) {
    return `Secret: ${formatValue(secretKeyRef.name)}/${formatValue(
      secretKeyRef.key,
    )}`;
  }

  const fieldRef = getRecordValue(valueFrom.fieldRef);
  if (fieldRef) {
    return `字段引用: ${formatValue(fieldRef.fieldPath)}`;
  }

  const resourceFieldRef = getRecordValue(valueFrom.resourceFieldRef);
  if (resourceFieldRef) {
    return `资源引用: ${formatValue(resourceFieldRef.resource)}`;
  }

  return JSON.stringify(valueFrom);
};

const getProbeHandler = (probe: Record<string, unknown>) => {
  const httpGet = getRecordValue(probe.httpGet);
  if (httpGet) {
    const port = formatValue(httpGet.port);
    const path = formatValue(httpGet.path);

    return {
      // 方式写协议（HTTP / HTTPS），目标写「路径（端口）」
      handler: getStringValue(httpGet.scheme) || 'HTTP',
      detail: `${path}（端口 ${port}）`,
    };
  }

  const tcpSocket = getRecordValue(probe.tcpSocket);
  if (tcpSocket) {
    return {
      handler: 'TCP',
      detail: `端口 ${formatValue(tcpSocket.port)}`,
    };
  }

  const exec = getRecordValue(probe.exec);
  const command = getArrayValue(exec?.command)
    .map((item) => getStringValue(item))
    .filter(Boolean);
  if (command.length > 0) {
    return {
      handler: '命令',
      detail: command.join(' '),
    };
  }

  return {
    handler: '探针',
    detail: '-',
  };
};

const toPodProbe = (
  probe: unknown,
  type: string,
): ClusterNodePodContainerProbe | undefined => {
  const probeRecord = getRecordValue(probe);

  if (!probeRecord) {
    return undefined;
  }

  const handler = getProbeHandler(probeRecord);

  return {
    type,
    handler: handler.handler,
    detail: handler.detail,
    initial_delay_seconds: getNumberValue(probeRecord.initialDelaySeconds),
    timeout_seconds: getNumberValue(probeRecord.timeoutSeconds),
    period_seconds: getNumberValue(probeRecord.periodSeconds),
    success_threshold: getNumberValue(probeRecord.successThreshold),
    failure_threshold: getNumberValue(probeRecord.failureThreshold),
  };
};

const toPodVolume = (volume: Record<string, unknown>): ClusterNodePodVolume => {
  const configMap = getRecordValue(volume.configMap);
  if (configMap) {
    return {
      name: getStringValue(volume.name),
      type: 'ConfigMap',
      source_name: getStringValue(configMap.name),
    };
  }

  const secret = getRecordValue(volume.secret);
  if (secret) {
    return {
      name: getStringValue(volume.name),
      type: 'Secret',
      source_name: getStringValue(secret.secretName),
    };
  }

  const hostPath = getRecordValue(volume.hostPath);
  if (hostPath) {
    return {
      name: getStringValue(volume.name),
      type: 'HostPath',
      source_path: getStringValue(hostPath.path),
    };
  }

  if (getRecordValue(volume.emptyDir)) {
    return {
      name: getStringValue(volume.name),
      type: 'EmptyDir',
    };
  }

  const persistentVolumeClaim = getRecordValue(volume.persistentVolumeClaim);
  if (persistentVolumeClaim) {
    return {
      name: getStringValue(volume.name),
      type: 'PersistentVolumeClaim',
      source_name: getStringValue(persistentVolumeClaim.claimName),
      read_only: persistentVolumeClaim.readOnly === true,
    };
  }

  if (getRecordValue(volume.projected)) {
    return {
      name: getStringValue(volume.name),
      type: 'Projected',
    };
  }

  if (getRecordValue(volume.downwardAPI)) {
    return {
      name: getStringValue(volume.name),
      type: 'DownwardAPI',
    };
  }

  return {
    name: getStringValue(volume.name),
    type: 'Volume',
  };
};

const buildPodContainers = (
  manifest?: Record<string, unknown>,
): ClusterNodePodContainer[] => {
  const podSpec = getPodSpec(manifest);
  const status = getRecordValue(manifest?.status);
  const containerStatuses = getArrayValue(status?.containerStatuses)
    .map((item) => getRecordValue(item))
    .filter(Boolean);

  return getArrayValue(podSpec?.containers)
    .map((item) => getRecordValue(item))
    .filter(Boolean)
    .map((container) => {
      const name = getStringValue(container?.name);
      const containerStatus = containerStatuses.find(
        (item) => getStringValue(item?.name) === name,
      );

      return {
        name,
        type: 'container' as const,
        image: getStringValue(container?.image),
        image_pull_policy: getStringValue(container?.imagePullPolicy),
        resources: getRecordValue(container?.resources) as
          | ClusterNodePodContainerResources
          | undefined,
        status_resources: getRecordValue(containerStatus?.resources) as
          | ClusterNodePodContainerResources
          | undefined,
        allocated_resources: getRecordValue(
          containerStatus?.allocatedResources,
        ) as Record<string, string> | undefined,
        resize_policy: getResizePolicyItems(container?.resizePolicy),
        status: getContainerStatus(containerStatus),
        ready: containerStatus?.ready === true,
        restart_count: getNumberValue(containerStatus?.restartCount) || 0,
        env: getArrayValue(container?.env)
          .map((envItem) => getRecordValue(envItem))
          .filter(Boolean)
          .map((env) => ({
            name: getStringValue(env?.name),
            value: getStringValue(env?.value),
            value_from: getEnvValueFrom(env || {}),
          }))
          .filter((env) => env.name),
        ports: getArrayValue(container?.ports)
          .map((portItem) => getRecordValue(portItem))
          .filter(Boolean)
          .map((port) => ({
            name: getStringValue(port?.name),
            container_port: getNumberValue(port?.containerPort),
            protocol: getStringValue(port?.protocol),
          })),
        command: getArrayValue(container?.command).map(String),
        args: getArrayValue(container?.args).map(String),
        probes: [
          toPodProbe(container?.readinessProbe, '就绪探针'),
          toPodProbe(container?.livenessProbe, '存活探针'),
          toPodProbe(container?.startupProbe, '启动探针'),
        ].filter(Boolean) as ClusterNodePodContainerProbe[],
        volume_mounts: getArrayValue(container?.volumeMounts)
          .map((mountItem) => getRecordValue(mountItem))
          .filter(Boolean)
          .map((mount) => ({
            name: getStringValue(mount?.name),
            mount_path: getStringValue(mount?.mountPath),
            sub_path: getStringValue(mount?.subPath),
            read_only: mount?.readOnly === true,
          })),
      };
    });
};

const buildPodVolumes = (manifest?: Record<string, unknown>) => {
  const podSpec = getPodSpec(manifest);

  return getArrayValue(podSpec?.volumes)
    .map((item) => getRecordValue(item))
    .filter(Boolean)
    .map((volume) => toPodVolume(volume || {}));
};

const buildPodConditions = (manifest?: Record<string, unknown>) => {
  const status = getRecordValue(manifest?.status);

  return getArrayValue(status?.conditions)
    .map((item) => getRecordValue(item))
    .filter(Boolean)
    .map((condition) => ({
      type: getStringValue(condition?.type),
      status: getStringValue(condition?.status),
      reason: getStringValue(condition?.reason),
      message: getStringValue(condition?.message),
      observed_generation: getNumberValue(condition?.observedGeneration),
      last_transition_time: getStringValue(condition?.lastTransitionTime),
    }));
};

const buildPodBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
): PodBasicInfo => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getPodSpec(manifest);
  const status = getRecordValue(manifest?.status);
  const containers = buildPodContainers(manifest);

  return {
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace || '-',
    status: getPodStatus(manifest),
    pod_ip: getStringValue(status?.podIP),
    node_name: getStringValue(spec?.nodeName),
    node_ip: getStringValue(status?.hostIP),
    restart_count: containers.reduce(
      (total, container) => total + (container.restart_count || 0),
      0,
    ),
    qos_class: getStringValue(status?.qosClass),
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const buildPodDetail = (
  manifest?: Record<string, unknown>,
): ClusterNodePodItem | undefined => {
  if (!manifest) {
    return undefined;
  }

  const metadata = getRecordValue(manifest.metadata);
  const spec = getPodSpec(manifest);
  const status = getRecordValue(manifest.status);
  const containers = buildPodContainers(manifest);
  const pod = {
    generation: getNumberValue(metadata?.generation),
    observed_generation: getNumberValue(status?.observedGeneration),
    qos_class: getStringValue(status?.qosClass),
    resize_conditions: buildPodConditions(manifest).filter((condition) =>
      condition.type?.startsWith('PodResize'),
    ),
  };

  return {
    id: getStringValue(metadata?.uid) || getStringValue(metadata?.name),
    name: getStringValue(metadata?.name) || '-',
    namespace: getStringValue(metadata?.namespace),
    generation: pod.generation,
    observed_generation: pod.observed_generation,
    os_name: getPodOsName(manifest),
    node_name: getStringValue(spec?.nodeName),
    node_ip: getStringValue(status?.hostIP),
    pod_ip: getStringValue(status?.podIP),
    phase: getStringValue(status?.phase),
    qos_class: pod.qos_class,
    resize_conditions: pod.resize_conditions,
    ready:
      getArrayValue(status?.containerStatuses).length > 0 &&
      getArrayValue(status?.containerStatuses).every(
        (item) => getRecordValue(item)?.ready === true,
      )
        ? 'Ready'
        : 'NotReady',
    status: getPodStatus(manifest),
    create_time: getStringValue(metadata?.creationTimestamp),
    containers: containers.map((container) => ({
      ...container,
      resize_status: getPodResizeStatus(
        {
          ...pod,
          name: getStringValue(metadata?.name) || '-',
          containers,
        },
        container,
      ),
    })),
    volumes: buildPodVolumes(manifest),
  };
};

export type { PodBasicInfo, PodConditionItem };
export {
  buildPodBasicInfo,
  buildPodConditions,
  buildPodContainers,
  buildPodDetail,
  buildPodVolumes,
  getPodSpec,
  getPodStatus,
};
