/**
 * 工作负载详情页的纯逻辑：从对象原文推导状态 / 副本数 / 容器信息，以及容器组行的整理。
 */
import type { K8sObject, ListRow, StateCell } from '@/services/k8s/typings';
import { t } from '@/utils/i18n';
import { statusLabel } from '../../components/statusText';
import type { WorkloadKind } from '../../forms/workload/types';
import type { StatusType } from '../shared/StatusDot';

type AnyRecord = Record<string, unknown>;

const asRecord = (value: unknown): AnyRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : undefined;

const asList = (value: unknown): AnyRecord[] =>
  Array.isArray(value)
    ? value.filter((item): item is AnyRecord => Boolean(asRecord(item)))
    : [];

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

// ---- 工作负载 ----

/** 期望 / 就绪副本数（守护进程集取调度数） */
export const workloadReplicas = (kind: WorkloadKind, object?: K8sObject) => {
  const status = asRecord(object?.status) ?? {};
  if (kind === 'DaemonSet') {
    return {
      desired: asNumber(status.desiredNumberScheduled),
      ready: asNumber(status.numberReady),
      updated: asNumber(status.updatedNumberScheduled),
    };
  }
  return {
    desired: asNumber(asRecord(object?.spec)?.replicas, 1),
    ready: asNumber(status.readyReplicas),
    updated: asNumber(status.updatedReplicas),
  };
};

const conditionOf = (object: K8sObject, type: string) =>
  asList(asRecord(object.status)?.conditions).find(
    (item) => item.type === type,
  );

/** 工作负载的展示状态（与列表的状态列同一套判定） */
export const workloadStatus = (
  kind: WorkloadKind,
  object?: K8sObject,
): { label: string; type: StatusType } => {
  if (!object) return { label: '-', type: 'default' };
  if (object.metadata?.deletionTimestamp) {
    return { label: t('pages.k8s.detail.deleting'), type: 'warning' };
  }
  if (kind === 'Deployment') {
    if (asRecord(object.spec)?.paused === true) {
      return { label: t('pages.k8s.detail.paused'), type: 'warning' };
    }
    if (
      conditionOf(object, 'Progressing')?.status === 'False' ||
      conditionOf(object, 'ReplicaFailure')?.status === 'True'
    ) {
      return { label: t('pages.k8s.state.abnormal'), type: 'error' };
    }
  }
  const { desired, ready, updated } = workloadReplicas(kind, object);
  const generation = asNumber(object.metadata?.generation);
  const observed = asNumber(asRecord(object.status)?.observedGeneration);
  if (desired === 0 && ready === 0)
    return { label: t('pages.k8s.detail.workload.stopped'), type: 'default' };
  if (observed < generation || updated < desired) {
    return { label: t('pages.k8s.detail.workload.updating'), type: 'warning' };
  }
  if (ready >= desired)
    return { label: t('pages.k8s.metrics.series.running'), type: 'success' };
  return { label: t('pages.k8s.detail.workload.starting'), type: 'warning' };
};

/** 最近一次状态变化的时间（取各 Condition 里最晚的一个）；没有则为 undefined */
export const workloadUpdateTime = (object?: K8sObject): string | undefined => {
  const times = asList(asRecord(object?.status)?.conditions)
    .flatMap((item) => [item.lastUpdateTime, item.lastTransitionTime])
    .filter((item): item is string => typeof item === 'string' && item !== '')
    .sort();
  return times[times.length - 1];
};

/** 对象自己的 matchLabels 选择器文本；没有则为空串 */
export const workloadLabelSelector = (object: K8sObject): string =>
  Object.entries(
    asRecord(asRecord(asRecord(object.spec)?.selector)?.matchLabels) ?? {},
  )
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

// ---- 容器（取自 Pod 模板） ----

export interface ContainerMount {
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly?: boolean;
  volumeType?: string;
  volumeSource?: string;
}

export interface ContainerInfo {
  key: string;
  name: string;
  image?: string;
  imagePullPolicy?: string;
  requests?: Record<string, string>;
  limits?: Record<string, string>;
  env: { key: string; value: string }[];
  ports: { name?: string; protocol?: string; containerPort?: number }[];
  mounts: ContainerMount[];
}

const envValue = (env: AnyRecord): string => {
  const value = asText(env.value);
  if (value) return value;
  const from = asRecord(env.valueFrom);
  const configMap = asRecord(from?.configMapKeyRef);
  if (configMap)
    return t('pages.k8s.detail.workload.env.configMap', {
      name: String(configMap.name),
      key: String(configMap.key),
    });
  const secret = asRecord(from?.secretKeyRef);
  if (secret)
    return t('pages.k8s.detail.workload.env.secret', {
      name: String(secret.name),
      key: String(secret.key),
    });
  const field = asRecord(from?.fieldRef);
  if (field)
    return t('pages.k8s.detail.workload.env.field', {
      path: String(field.fieldPath),
    });
  const resource = asRecord(from?.resourceFieldRef);
  if (resource)
    return t('pages.k8s.detail.workload.env.resource', {
      resource: String(resource.resource),
    });
  return '-';
};

const volumeInfo = (
  volume?: AnyRecord,
): { volumeType?: string; volumeSource?: string } => {
  if (!volume) return {};
  const configMap = asRecord(volume.configMap);
  if (configMap) {
    return { volumeType: 'ConfigMap', volumeSource: asText(configMap.name) };
  }
  const secret = asRecord(volume.secret);
  if (secret) {
    return { volumeType: 'Secret', volumeSource: asText(secret.secretName) };
  }
  const hostPath = asRecord(volume.hostPath);
  if (hostPath) {
    return { volumeType: 'HostPath', volumeSource: asText(hostPath.path) };
  }
  if (volume.emptyDir) return { volumeType: 'EmptyDir' };
  const claim = asRecord(volume.persistentVolumeClaim);
  if (claim) {
    return {
      volumeType: 'PersistentVolumeClaim',
      volumeSource: asText(claim.claimName),
    };
  }
  if (volume.projected) return { volumeType: 'Projected' };
  if (volume.downwardAPI) return { volumeType: 'DownwardAPI' };
  return {};
};

const quantities = (value: unknown): Record<string, string> | undefined => {
  const record = asRecord(value);
  if (!record) return undefined;
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, String(item)]),
  );
};

/** Pod 模板里的工作容器：镜像、资源、环境变量、端口、挂载 */
export const templateContainers = (object?: K8sObject): ContainerInfo[] => {
  const spec = asRecord(object?.spec);
  const podSpec = asRecord(asRecord(spec?.template)?.spec);
  const volumes = asList(podSpec?.volumes);
  // 有状态副本集的卷声明模板：挂载名对应模板名
  const claimTemplates = new Set(
    asList(spec?.volumeClaimTemplates)
      .map((item) => asText(asRecord(item.metadata)?.name))
      .filter(Boolean),
  );

  return asList(podSpec?.containers).map((container) => {
    const name = asText(container.name) ?? '-';
    const image = asText(container.image);
    const resources = asRecord(container.resources);
    return {
      key: `${name}::${image ?? '-'}`,
      name,
      image,
      imagePullPolicy: asText(container.imagePullPolicy),
      requests: quantities(resources?.requests),
      limits: quantities(resources?.limits),
      env: asList(container.env)
        .filter((item) => asText(item.name))
        .map((item) => ({ key: String(item.name), value: envValue(item) })),
      ports: asList(container.ports).map((port) => ({
        name: asText(port.name),
        protocol: asText(port.protocol),
        containerPort:
          typeof port.containerPort === 'number'
            ? port.containerPort
            : undefined,
      })),
      mounts: asList(container.volumeMounts).map((mount) => {
        const mountName = asText(mount.name) ?? '';
        return {
          name: mountName,
          mountPath: asText(mount.mountPath) ?? '',
          subPath: asText(mount.subPath),
          readOnly: mount.readOnly === true,
          ...(claimTemplates.has(mountName)
            ? { volumeType: 'PersistentVolumeClaim', volumeSource: mountName }
            : volumeInfo(volumes.find((item) => item.name === mountName))),
        };
      }),
    };
  });
};

// ---- 容器组 ----

export interface WorkloadPod {
  uid: string;
  name: string;
  namespace: string;
  ip?: string;
  nodeName?: string;
  nodeIP?: string;
  /** 状态原文（Running / CrashLoopBackOff…） */
  status?: string;
  state?: StateCell['state'];
  reason?: string;
  ready?: string;
  restarts: number;
  createTime?: string;
}

export const toWorkloadPod = (
  row: ListRow,
  nodeIPs: Record<string, string>,
): WorkloadPod => {
  const cells = row.cells ?? {};
  const status = asRecord(cells.status) as Partial<StateCell> | undefined;
  const nodeName = asText(cells.node);
  return {
    uid: row.uid,
    name: row.name,
    namespace: row.namespace ?? '',
    ip: asText(cells.ip),
    nodeName,
    nodeIP: nodeName ? nodeIPs[nodeName] : undefined,
    status: status?.text,
    state: status?.state,
    reason: status?.reason,
    ready: asText(cells.ready),
    restarts: asNumber(cells.restarts),
    createTime: row.createTime,
  };
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 选择器相同的工作负载可能有多个：再按容器组的命名规则筛一次 */
export const matchWorkloadPod = (
  podName: string,
  kind: WorkloadKind,
  workloadName: string,
) => {
  if (kind === 'Deployment') {
    return new RegExp(`^${escapeRegExp(workloadName)}-.+-.+$`).test(podName);
  }
  return podName === workloadName || podName.startsWith(`${workloadName}-`);
};

export const podStatusLabel = (status?: string) => statusLabel(status) || '-';

const STATE_TYPES: Record<string, StatusType> = {
  ok: 'success',
  pending: 'warning',
  abnormal: 'error',
  unknown: 'error',
  done: 'default',
};

export const podStatusType = (pod: WorkloadPod): StatusType => {
  const status = pod.status?.toLowerCase();
  if (status === 'running') return 'success';
  if (
    status === 'waiting' ||
    status === 'pending' ||
    status === 'terminating'
  ) {
    return 'warning';
  }
  if (
    status === 'terminated' ||
    status === 'failed' ||
    status === 'crashloopbackoff' ||
    status === 'error'
  ) {
    return 'error';
  }
  return STATE_TYPES[pod.state ?? ''] ?? 'default';
};
