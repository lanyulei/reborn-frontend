/**
 * 工作负载创建向导：表单值 → 清单的纯逻辑（不依赖 React / antd，可用 Node 直接运行校验）。
 * Job / CronJob 向导复用这里的 Pod 模板构建（buildPodTemplate），控制器专属字段只在各自的构建函数里写。
 * 数量格式化 / 解析在 quantity.ts，表单初值在 values.ts——本文件是它们的桶（re-export），
 * 历史导入点（./helpers）不用改；新代码按主题直接引子文件。
 */
import { parseAllDocuments } from 'yaml';
import type { Translate } from '@/utils/i18n';
import {
  createId,
  NAME_PATTERN,
  trimValue as normalizeName,
  toRecord,
} from '../shared/manifest';
import type { StringListEditorItem } from '../shared/StringListEditor';
import {
  formatCpuQuantity,
  formatMemoryQuantity,
  isFiniteNumber,
} from './quantity';
import type {
  ContainerActionFormValue,
  ContainerProbeFormValue,
  ContainerProbeKind,
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadKind,
  WorkloadSchedulingCustomRule,
  WorkloadStorageConfigItem,
  WorkloadStorageKeyPathItem,
} from './types';

type Manifest = Record<string, unknown>;

const DEFAULT_APP_LABEL_KEY = 'app';
const NODE_HOSTNAME_LABEL_KEY = 'kubernetes.io/hostname';
const NODE_NAME_FIELD_KEY = 'metadata.name';
const HOST_TIME_VOLUME_NAME = 'host-time';
const WORKLOAD_API_VERSION = 'apps/v1';

/** maxUnavailable / maxSurge：整数或百分比 */
const INT_OR_PERCENT_PATTERN = /^(0|[1-9]\d*)%?$/;

const normalizeOptionalText = (value?: string) => value?.trim() || undefined;

const isEmptyRecord = (record: Record<string, unknown>) =>
  Object.keys(record).length === 0;

/** 参数列表：每项就是一个参数，原样保留（可含逗号、空格），只丢掉空行 */
const toArgList = (items?: StringListEditorItem[]) =>
  (items || [])
    .map((item) => item?.value ?? '')
    .filter((value) => value.trim() !== '');

const normalizeStringList = (value?: string[]) =>
  (value || []).map((item) => (item || '').trim()).filter(Boolean);

const normalizeNumberListText = (value?: string) =>
  (value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter((item) => Number.isInteger(item) && item >= 0);

/** IntOrString：纯数字必须以整数提交（字符串 "1" 会被当作非法百分比） */
const toIntOrPercent = (value: string | undefined, fallback: string) => {
  const text = normalizeName(value) || fallback;

  return /^\d+$/.test(text) ? Number(text) : text;
};

/** 递归去掉 undefined 字段，保证清单里没有空占位 */
const prune = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map(prune) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, prune(item)]),
    ) as T;
  }
  return value;
};

const setIfDefined = (
  target: Record<string, unknown>,
  key: string,
  value?: number | string | boolean,
) => {
  if (value === undefined || value === '') {
    return;
  }
  target[key] = value;
};

const normalizeContainerPortProtocol = (protocol?: string) =>
  protocol === 'UDP' || protocol === 'SCTP' ? protocol : 'TCP';

type ContainerPortManifest = {
  name?: string;
  containerPort: number;
  protocol: string;
};

const getContainerPorts = (
  values: CreateWorkloadContainerValues,
): ContainerPortManifest[] | undefined => {
  const ports = (values.containerPorts || []).flatMap((port) =>
    isFiniteNumber(port?.containerPort)
      ? [
          {
            name: normalizeOptionalText(port.name),
            containerPort: port.containerPort,
            protocol: normalizeContainerPortProtocol(port.protocol),
          },
        ]
      : [],
  );

  return ports.length > 0 ? ports : undefined;
};

const getContainerResources = (values: CreateWorkloadContainerValues) => {
  const requests = prune({
    cpu: formatCpuQuantity(values.cpuRequest),
    memory: formatMemoryQuantity(values.memoryRequest),
  });
  const limits = prune({
    cpu: formatCpuQuantity(values.cpuLimit),
    memory: formatMemoryQuantity(values.memoryLimit),
  });

  if (isEmptyRecord(requests) && isEmptyRecord(limits)) {
    return undefined;
  }

  return {
    ...(isEmptyRecord(requests) ? {} : { requests }),
    ...(isEmptyRecord(limits) ? {} : { limits }),
  };
};

type ContainerEnvManifestItem = {
  name: string;
  value?: string;
  valueFrom?: {
    configMapKeyRef?: { name: string; key: string };
    secretKeyRef?: { name: string; key: string };
  };
};

const getContainerEnv = (values: CreateWorkloadContainerValues) => {
  if (!values.enableContainerEnv) {
    return undefined;
  }

  const env = (values.containerEnv || []).flatMap<ContainerEnvManifestItem>(
    (item) => {
      const sourceType = item.sourceType || 'custom';
      if (sourceType === 'configMap' || sourceType === 'secret') {
        const resourceKey = normalizeOptionalText(item.resourceKey);
        const name = normalizeOptionalText(item.keyName) || resourceKey;
        const resourceName = normalizeOptionalText(item.resourceName);

        if (!name || !resourceName || !resourceKey) {
          return [];
        }

        const ref = { name: resourceName, key: resourceKey };

        return [
          {
            name,
            valueFrom:
              sourceType === 'configMap'
                ? { configMapKeyRef: ref }
                : { secretKeyRef: ref },
          },
        ];
      }

      const name = normalizeOptionalText(item.keyName);

      return name ? [{ name, value: item.value ?? '' }] : [];
    },
  );

  return env.length > 0 ? env : undefined;
};

/** 探针 / 生命周期动作共用的处理器（exec / tcpSocket / httpGet）；填写不完整时返回 undefined */
const getHandler = (action: ContainerActionFormValue) => {
  if (action.handlerType === 'exec') {
    const command = toArgList(action.command);

    return command.length > 0 ? { exec: { command } } : undefined;
  }

  if (action.handlerType === 'tcpSocket') {
    return isFiniteNumber(action.port)
      ? { tcpSocket: { port: action.port } }
      : undefined;
  }

  const path = normalizeOptionalText(action.path);

  return path && isFiniteNumber(action.port)
    ? {
        httpGet: {
          scheme: action.scheme || 'HTTP',
          path,
          port: action.port,
        },
      }
    : undefined;
};

const getContainerLifecycle = (values: CreateWorkloadContainerValues) => {
  if (!values.enableLifecycle) {
    return undefined;
  }

  const { postStart, preStop } = values.lifecycleActions || {};
  const lifecycle = prune({
    postStart: postStart?.enabled ? getHandler(postStart) : undefined,
    preStop: preStop?.enabled ? getHandler(preStop) : undefined,
  });

  return isEmptyRecord(lifecycle) ? undefined : lifecycle;
};

const getSeLinuxOptions = (options: {
  level?: string;
  role?: string;
  type?: string;
  user?: string;
}) => {
  const seLinuxOptions: Record<string, unknown> = {};

  setIfDefined(seLinuxOptions, 'level', normalizeName(options.level));
  setIfDefined(seLinuxOptions, 'role', normalizeName(options.role));
  setIfDefined(seLinuxOptions, 'type', normalizeName(options.type));
  setIfDefined(seLinuxOptions, 'user', normalizeName(options.user));

  return isEmptyRecord(seLinuxOptions) ? undefined : seLinuxOptions;
};

const getContainerSecurityContext = (values: CreateWorkloadContainerValues) => {
  if (!values.enableContainerSecurityContext) {
    return undefined;
  }

  const securityContext: Record<string, unknown> = {};
  const capabilitiesAdd = normalizeStringList(values.containerCapabilitiesAdd);
  const capabilitiesDrop = normalizeStringList(
    values.containerCapabilitiesDrop,
  );
  const seLinuxOptions = getSeLinuxOptions({
    level: values.containerSeLinuxLevel,
    role: values.containerSeLinuxRole,
    type: values.containerSeLinuxType,
    user: values.containerSeLinuxUser,
  });

  setIfDefined(
    securityContext,
    'privileged',
    values.containerPrivileged || undefined,
  );
  setIfDefined(
    securityContext,
    'runAsNonRoot',
    values.containerRunAsNonRoot || undefined,
  );
  setIfDefined(securityContext, 'runAsUser', values.containerRunAsUser);
  setIfDefined(securityContext, 'runAsGroup', values.containerRunAsGroup);
  setIfDefined(
    securityContext,
    'readOnlyRootFilesystem',
    values.containerReadOnlyRootFilesystem || undefined,
  );
  setIfDefined(
    securityContext,
    'allowPrivilegeEscalation',
    values.containerPrivileged ? true : values.allowPrivilegeEscalation,
  );

  if (seLinuxOptions) {
    securityContext.seLinuxOptions = seLinuxOptions;
  }
  if (capabilitiesAdd.length > 0 || capabilitiesDrop.length > 0) {
    securityContext.capabilities = {
      ...(capabilitiesAdd.length > 0 ? { add: capabilitiesAdd } : {}),
      ...(capabilitiesDrop.length > 0 ? { drop: capabilitiesDrop } : {}),
    };
  }
  if (values.containerSeccompProfileType) {
    securityContext.seccompProfile = {
      type: values.containerSeccompProfileType,
      ...(values.containerSeccompProfileType === 'Localhost'
        ? {
            localhostProfile: normalizeName(
              values.containerSeccompProfileLocalhost,
            ),
          }
        : {}),
    };
  }

  return isEmptyRecord(securityContext) ? undefined : securityContext;
};

const getContainerResizePolicy = (values: CreateWorkloadContainerValues) => {
  if (!values.enableResizePolicy) {
    return undefined;
  }

  const resizePolicy = [
    ...(values.cpuResizeRestartPolicy
      ? [{ resourceName: 'cpu', restartPolicy: values.cpuResizeRestartPolicy }]
      : []),
    ...(values.memoryResizeRestartPolicy
      ? [
          {
            resourceName: 'memory',
            restartPolicy: values.memoryResizeRestartPolicy,
          },
        ]
      : []),
  ];

  return resizePolicy.length > 0 ? resizePolicy : undefined;
};

const normalizeProbeNumber = (value: number | undefined, fallback: number) =>
  isFiniteNumber(value) ? value : fallback;

const getContainerProbe = (
  values: CreateWorkloadContainerValues,
  probeName: ContainerProbeKind,
) => {
  if (!values.enableHealthCheck) {
    return undefined;
  }

  const probe: ContainerProbeFormValue | undefined =
    values.healthChecks?.[probeName];
  const handler = probe?.enabled ? getHandler(probe) : undefined;

  if (!probe || !handler) {
    return undefined;
  }

  return {
    ...handler,
    initialDelaySeconds: normalizeProbeNumber(probe.initialDelaySeconds, 0),
    timeoutSeconds: normalizeProbeNumber(probe.timeoutSeconds, 1),
    periodSeconds: normalizeProbeNumber(probe.periodSeconds, 10),
    // 存活 / 启动探针的成功阈值只能是 1
    successThreshold:
      probeName === 'readiness'
        ? normalizeProbeNumber(probe.successThreshold, 1)
        : 1,
    failureThreshold: normalizeProbeNumber(probe.failureThreshold, 3),
  };
};

const sanitizeVolumeName = (value?: string, fallback = 'storage-volume') => {
  const normalized = (value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .slice(0, 63)
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  return normalized || fallback;
};

const isStorageEnabled = (item: WorkloadStorageConfigItem) =>
  Boolean(
    item.storageCategory &&
      item.storageCategory !== 'none' &&
      item.storageType &&
      item.storageType !== 'none',
  );

const getStorageVolumeBaseName = (item: WorkloadStorageConfigItem) => {
  if (item.storageType === 'persistentVolumeClaim') {
    return sanitizeVolumeName(item.claimName, 'pvc-volume');
  }
  if (item.storageType === 'volumeClaimTemplate') {
    return sanitizeVolumeName(item.pvcNamePrefix, 'data');
  }
  if (item.storageType === 'configMap' || item.storageType === 'secret') {
    return sanitizeVolumeName(
      `${item.storageType}-${item.configResourceName || 'resource'}`,
      `${item.storageType}-volume`,
    );
  }

  return sanitizeVolumeName(item.volumeName, 'data');
};

type VolumeMountManifest = {
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly?: boolean;
};

const getContainerStorageMount = (
  item: WorkloadStorageConfigItem,
  volumeName: string,
  container: CreateWorkloadContainerValues,
): VolumeMountManifest | undefined => {
  const mounts = item.containerMounts || [];
  // 优先按容器 ID 对应；旧数据没有 ID 时退回按名称
  const mount =
    mounts.find(
      (entry) =>
        Boolean(entry.containerId) && entry.containerId === container.id,
    ) ||
    mounts.find(
      (entry) =>
        !entry.containerId &&
        Boolean(entry.containerName) &&
        entry.containerName === container.containerName,
    );
  const mountPath = normalizeName(mount?.mountPath);

  if (!mount || !mountPath || !mount.mountMode || mount.mountMode === 'none') {
    return undefined;
  }

  return {
    name: volumeName,
    mountPath,
    subPath: normalizeOptionalText(mount.subPath),
    readOnly:
      item.storageCategory === 'config' || mount.mountMode === 'readOnly'
        ? true
        : undefined,
  };
};

const getStorageKeyItems = (item: WorkloadStorageConfigItem) => {
  if (!item.selectSpecificKeys) {
    return undefined;
  }

  const items = (item.specificKeyPaths || []).flatMap(
    (entry: WorkloadStorageKeyPathItem) => {
      const key = normalizeName(entry.keyName);
      const path = normalizeName(entry.path);

      return key && path ? [{ key, path }] : [];
    },
  );

  return items.length > 0 ? items : undefined;
};

const getStorageVolumeSource = (
  item: WorkloadStorageConfigItem,
): Manifest | undefined => {
  const items = getStorageKeyItems(item);

  switch (item.storageType) {
    case 'persistentVolumeClaim':
      return {
        persistentVolumeClaim: { claimName: normalizeName(item.claimName) },
      };
    case 'emptyDir':
      return {
        emptyDir: normalizeName(item.emptyDirSizeLimit)
          ? { sizeLimit: normalizeName(item.emptyDirSizeLimit) }
          : {},
      };
    case 'hostPath':
      return { hostPath: { path: normalizeName(item.hostPath) } };
    case 'configMap':
      return {
        configMap: {
          name: normalizeName(item.configResourceName),
          ...(items ? { items } : {}),
        },
      };
    case 'secret':
      return {
        secret: {
          secretName: normalizeName(item.configResourceName),
          ...(items ? { items } : {}),
        },
      };
    default:
      return undefined;
  }
};

type ResolvedStorage = {
  volumes: Manifest[];
  volumeClaimTemplates: Manifest[];
  /** 容器 ID / 序号 → 该容器的挂载 */
  mountsOf: (container: CreateWorkloadContainerValues) => VolumeMountManifest[];
};

/**
 * 把存储配置解析成卷、卷声明模板和各容器的挂载。
 * 没有任何容器挂载的配置不产生卷；卷名冲突时自动加序号（同一 Pod 内卷名必须唯一）。
 */
const resolveStorage = (
  values: CreateWorkloadFormValues,
  containers: CreateWorkloadContainerValues[],
  allowVolumeClaimTemplates: boolean,
): ResolvedStorage => {
  const volumes: Manifest[] = [];
  const volumeClaimTemplates: Manifest[] = [];
  const mounts = new Map<
    CreateWorkloadContainerValues,
    VolumeMountManifest[]
  >();
  const usedNames = new Set<string>(
    containers.some((container) => container.syncHostTimezone)
      ? [HOST_TIME_VOLUME_NAME]
      : [],
  );

  const uniqueName = (baseName: string) => {
    let name = baseName;
    for (let index = 2; usedNames.has(name); index += 1) {
      const suffix = `-${index}`;
      name = `${baseName.slice(0, 63 - suffix.length)}${suffix}`;
    }
    usedNames.add(name);
    return name;
  };

  (values.storageItems || []).filter(isStorageEnabled).forEach((item) => {
    const isTemplate = item.storageType === 'volumeClaimTemplate';
    if (isTemplate && !allowVolumeClaimTemplates) {
      return;
    }

    const baseName = getStorageVolumeBaseName(item);
    const itemMounts = containers.flatMap((container) => {
      const mount = getContainerStorageMount(item, baseName, container);
      return mount ? [{ container, mount }] : [];
    });
    if (itemMounts.length === 0) {
      return;
    }

    const volumeName = uniqueName(baseName);
    itemMounts.forEach(({ container, mount }) => {
      mounts.set(container, [
        ...(mounts.get(container) || []),
        { ...mount, name: volumeName },
      ]);
    });

    if (isTemplate) {
      volumeClaimTemplates.push({
        metadata: { name: volumeName },
        spec: {
          accessModes:
            item.pvcAccessModes && item.pvcAccessModes.length > 0
              ? item.pvcAccessModes
              : ['ReadWriteOnce'],
          storageClassName: normalizeOptionalText(item.pvcStorageClassName),
          resources: {
            requests: { storage: `${item.pvcSizeGi || 10}Gi` },
          },
        },
      });
      return;
    }

    const source = getStorageVolumeSource(item);
    if (source) {
      volumes.push({ name: volumeName, ...source });
    }
  });

  if (usedNames.has(HOST_TIME_VOLUME_NAME)) {
    volumes.push({
      name: HOST_TIME_VOLUME_NAME,
      hostPath: { path: '/etc/localtime' },
    });
  }

  return {
    volumes,
    volumeClaimTemplates,
    mountsOf: (container) => [
      ...(mounts.get(container) || []),
      ...(container.syncHostTimezone
        ? [
            {
              name: HOST_TIME_VOLUME_NAME,
              mountPath: '/etc/localtime',
              readOnly: true,
            },
          ]
        : []),
    ],
  };
};

const getContainerManifest = (
  values: CreateWorkloadContainerValues,
  volumeMounts: VolumeMountManifest[],
) => {
  const command = values.enableStartupCommand
    ? toArgList(values.startupCommand)
    : [];
  const args = values.enableStartupCommand ? toArgList(values.startupArgs) : [];

  return {
    name: normalizeName(values.containerName),
    image: normalizeName(values.image),
    imagePullPolicy: values.imagePullPolicy || 'IfNotPresent',
    command: command.length > 0 ? command : undefined,
    args: args.length > 0 ? args : undefined,
    ports: getContainerPorts(values),
    env: getContainerEnv(values),
    resources: getContainerResources(values),
    resizePolicy: getContainerResizePolicy(values),
    volumeMounts: volumeMounts.length > 0 ? volumeMounts : undefined,
    livenessProbe: getContainerProbe(values, 'liveness'),
    readinessProbe: getContainerProbe(values, 'readiness'),
    startupProbe: getContainerProbe(values, 'startup'),
    lifecycle: getContainerLifecycle(values),
    securityContext: getContainerSecurityContext(values),
  };
};

const getPodSecurityContext = (values: CreateWorkloadFormValues) => {
  if (!values.enablePodSecurityContext) {
    return undefined;
  }

  const securityContext: Record<string, unknown> = {};
  const seLinuxOptions = getSeLinuxOptions({
    level: values.seLinuxLevel,
    role: values.seLinuxRole,
    type: values.seLinuxType,
    user: values.seLinuxUser,
  });
  const supplementalGroups = normalizeNumberListText(values.supplementalGroups);

  setIfDefined(
    securityContext,
    'runAsNonRoot',
    values.runAsNonRoot || undefined,
  );
  setIfDefined(securityContext, 'runAsUser', values.runAsUser);
  setIfDefined(securityContext, 'runAsGroup', values.runAsGroup);
  setIfDefined(securityContext, 'fsGroup', values.fsGroup);
  if (supplementalGroups.length > 0) {
    securityContext.supplementalGroups = supplementalGroups;
  }
  setIfDefined(
    securityContext,
    'supplementalGroupsPolicy',
    values.supplementalGroupsPolicy,
  );
  if (seLinuxOptions) {
    securityContext.seLinuxOptions = seLinuxOptions;
  }

  return isEmptyRecord(securityContext) ? undefined : securityContext;
};

type PodAffinityTerm = { labelSelector: Manifest; topologyKey: string };
type PodAffinityRules = {
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
  preferredDuringSchedulingIgnoredDuringExecution?: {
    weight: number;
    podAffinityTerm: PodAffinityTerm;
  }[];
};
type Affinity = {
  nodeAffinity?: Manifest;
  podAffinity?: PodAffinityRules;
  podAntiAffinity?: PodAffinityRules;
};

const buildPodAffinityTerm = (labelSelector: Manifest): PodAffinityTerm => ({
  labelSelector,
  topologyKey: NODE_HOSTNAME_LABEL_KEY,
});

const addPodAffinityTerm = (
  affinity: Affinity,
  key: 'podAffinity' | 'podAntiAffinity',
  required: boolean,
  term: PodAffinityTerm,
) => {
  const rules: PodAffinityRules = affinity[key] || {};

  if (required) {
    rules.requiredDuringSchedulingIgnoredDuringExecution = [
      ...(rules.requiredDuringSchedulingIgnoredDuringExecution || []),
      term,
    ];
  } else {
    rules.preferredDuringSchedulingIgnoredDuringExecution = [
      ...(rules.preferredDuringSchedulingIgnoredDuringExecution || []),
      { weight: 100, podAffinityTerm: term },
    ];
  }
  affinity[key] = rules;
};

/** 自定义规则的目标选择器：用目标工作负载自己的 spec.selector；没读到时退回 app=<名称> */
const getCustomRuleSelector = (
  rule: WorkloadSchedulingCustomRule,
): Manifest => {
  const selector = rule.targetSelector;
  const hasContent =
    selector &&
    ((selector.matchLabels &&
      !isEmptyRecord(selector.matchLabels as Record<string, unknown>)) ||
      (Array.isArray(selector.matchExpressions) &&
        selector.matchExpressions.length > 0));

  return hasContent
    ? prune({
        matchLabels: selector.matchLabels,
        matchExpressions: selector.matchExpressions,
      })
    : { matchLabels: { [DEFAULT_APP_LABEL_KEY]: normalizeName(rule.target) } };
};

const getPodAffinity = (
  values: CreateWorkloadFormValues,
  selectorLabels: Record<string, string>,
  allowNodeSelection: boolean,
) => {
  const affinity: Affinity = {};
  const ownTerm = () => buildPodAffinityTerm({ matchLabels: selectorLabels });

  if (values.podSchedulingRule === 'spread') {
    addPodAffinityTerm(affinity, 'podAntiAffinity', false, ownTerm());
  }
  if (values.podSchedulingRule === 'centralized') {
    addPodAffinityTerm(affinity, 'podAffinity', false, ownTerm());
  }
  if (values.podSchedulingRule === 'custom') {
    (values.podSchedulingCustomRules || []).forEach((rule) => {
      if (!rule?.type || !rule.strategy || !normalizeName(rule.target)) {
        return;
      }
      // 不写 namespaces：亲和项默认只匹配工作负载所在命名空间，目标也只从该命名空间里选
      addPodAffinityTerm(
        affinity,
        rule.type === 'affinity' ? 'podAffinity' : 'podAntiAffinity',
        rule.strategy === 'required',
        buildPodAffinityTerm(getCustomRuleSelector(rule)),
      );
    });
  }

  const nodeNames =
    allowNodeSelection && values.enableNodeSelector
      ? Array.from(new Set(normalizeStringList(values.selectedNodeNames)))
      : [];
  if (nodeNames.length > 0) {
    // 按节点名匹配（matchFields 的 In 只允许一个值，多个节点用多个 term，term 之间是「或」）
    affinity.nodeAffinity = {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: nodeNames.map((nodeName) => ({
          matchFields: [
            { key: NODE_NAME_FIELD_KEY, operator: 'In', values: [nodeName] },
          ],
        })),
      },
    };
  }

  return isEmptyRecord(affinity) ? undefined : affinity;
};

type PodTemplateOptions = {
  /** 工作负载名称：用作稳定的 app 标签 */
  name: string;
  /** Job / CronJob 必须是 Never 或 OnFailure；控制器类工作负载不写（默认 Always） */
  restartPolicy?: 'Never' | 'OnFailure';
  /** 仅 StatefulSet 支持卷声明模板 */
  allowVolumeClaimTemplates?: boolean;
  /** DaemonSet 不提供节点选择 */
  allowNodeSelection?: boolean;
};

/** 选择器只用一个稳定标签，避免用户标签进入不可变的 spec.selector */
const getSelectorLabels = (name: string) => ({ [DEFAULT_APP_LABEL_KEY]: name });

const getResourceLabels = (values: CreateWorkloadFormValues, name: string) => ({
  ...toRecord(values.labels),
  ...getSelectorLabels(name),
});

const getWorkerContainers = (values: CreateWorkloadFormValues) =>
  (values.containers || []).filter(
    (container) => container.containerType !== 'init',
  );

const hasWorkerContainer = (values: CreateWorkloadFormValues) =>
  getWorkerContainers(values).length > 0;

/**
 * Pod 模板（metadata + spec），所有工作负载类型共用；不含任何控制器字段（selector / replicas / strategy）。
 */
const buildPodTemplate = (
  values: CreateWorkloadFormValues,
  options: PodTemplateOptions,
) => {
  const configuredContainers = values.containers || [];
  const storage = resolveStorage(
    values,
    configuredContainers,
    Boolean(options.allowVolumeClaimTemplates),
  );
  const toManifest = (container: CreateWorkloadContainerValues) =>
    getContainerManifest(container, storage.mountsOf(container));
  const initContainers = configuredContainers
    .filter((container) => container.containerType === 'init')
    .map(toManifest);
  const nodeSelector =
    options.allowNodeSelection !== false && values.enableNodeSelector
      ? toRecord(values.nodeSelectors)
      : {};
  const annotations = {
    ...toRecord(values.annotations),
    ...toRecord(values.podAnnotations),
  };

  const template = prune({
    metadata: {
      labels: getResourceLabels(values, options.name),
      annotations: isEmptyRecord(annotations) ? undefined : annotations,
    },
    spec: {
      restartPolicy: options.restartPolicy,
      terminationGracePeriodSeconds:
        values.enablePodGracefulTermination &&
        isFiniteNumber(values.terminationGracePeriodSeconds)
          ? values.terminationGracePeriodSeconds
          : undefined,
      securityContext: getPodSecurityContext(values),
      nodeSelector: isEmptyRecord(nodeSelector) ? undefined : nodeSelector,
      affinity: getPodAffinity(
        values,
        getSelectorLabels(options.name),
        options.allowNodeSelection !== false,
      ),
      initContainers: initContainers.length > 0 ? initContainers : undefined,
      containers: getWorkerContainers(values).map(toManifest),
      volumes: storage.volumes.length > 0 ? storage.volumes : undefined,
    },
  });

  return {
    template,
    volumeClaimTemplates: prune(storage.volumeClaimTemplates),
  };
};

/** 资源对象自身的 metadata（名称、命名空间、标签、注解） */
const buildResourceMetadata = (values: CreateWorkloadFormValues) => {
  const name = normalizeName(values.name);
  const annotations = toRecord(values.annotations);

  return prune({
    name,
    namespace: normalizeName(values.namespace),
    labels: getResourceLabels(values, name),
    annotations: isEmptyRecord(annotations) ? undefined : annotations,
  });
};

const getUpdateStrategy = (
  kind: WorkloadKind,
  values: CreateWorkloadFormValues,
) => {
  if (kind === 'Deployment') {
    return values.updateStrategyType === 'Recreate'
      ? { type: 'Recreate' }
      : {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: toIntOrPercent(values.maxUnavailable, '25%'),
            maxSurge: toIntOrPercent(values.maxSurge, '25%'),
          },
        };
  }
  if (values.updateStrategyType === 'OnDelete') {
    return { type: 'OnDelete' };
  }
  if (kind === 'DaemonSet') {
    return {
      type: 'RollingUpdate',
      rollingUpdate: {
        maxUnavailable: toIntOrPercent(values.maxUnavailable, '25%'),
      },
    };
  }

  return isFiniteNumber(values.updatePartition) && values.updatePartition > 0
    ? {
        type: 'RollingUpdate',
        rollingUpdate: { partition: values.updatePartition },
      }
    : { type: 'RollingUpdate' };
};

const buildCreateWorkloadManifest = (
  kind: WorkloadKind,
  values: CreateWorkloadFormValues,
): Manifest => {
  const name = normalizeName(values.name);
  const { template, volumeClaimTemplates } = buildPodTemplate(values, {
    name,
    allowVolumeClaimTemplates: kind === 'StatefulSet',
    allowNodeSelection: kind !== 'DaemonSet',
  });
  const strategy = getUpdateStrategy(kind, values);

  return prune({
    apiVersion: WORKLOAD_API_VERSION,
    kind,
    metadata: buildResourceMetadata(values),
    spec: {
      replicas: kind === 'DaemonSet' ? undefined : (values.replicas ?? 1),
      selector: { matchLabels: getSelectorLabels(name) },
      serviceName: kind === 'StatefulSet' ? name : undefined,
      template,
      volumeClaimTemplates:
        kind === 'StatefulSet' && volumeClaimTemplates.length > 0
          ? volumeClaimTemplates
          : undefined,
      strategy: kind === 'Deployment' ? strategy : undefined,
      updateStrategy: kind === 'Deployment' ? undefined : strategy,
      minReadySeconds:
        kind === 'DaemonSet' &&
        isFiniteNumber(values.minReadySeconds) &&
        values.minReadySeconds > 0
          ? values.minReadySeconds
          : undefined,
    },
  });
};

/**
 * StatefulSet 的 serviceName 指向的无头服务：端口取自工作容器的容器端口。
 * 没有容器端口时不生成（返回 undefined）。
 */
const buildHeadlessServiceManifest = (
  values: CreateWorkloadFormValues,
): Manifest | undefined => {
  const name = normalizeName(values.name);
  const seen = new Set<string>();
  const usedNames = new Set<string>();
  const ports = getWorkerContainers(values)
    .flatMap((container) => getContainerPorts(container) || [])
    .flatMap((port) => {
      const key = `${port.protocol}/${port.containerPort}`;
      if (seen.has(key)) {
        return [];
      }
      seen.add(key);

      // 多端口的 Service 要求每个端口都有唯一名称
      const fallbackName = `${port.protocol.toLowerCase()}-${port.containerPort}`;
      const portName =
        port.name && !usedNames.has(port.name) ? port.name : fallbackName;
      usedNames.add(portName);

      return [
        {
          name: portName,
          port: port.containerPort,
          targetPort: port.containerPort,
          protocol: port.protocol,
        },
      ];
    });

  if (ports.length === 0) {
    return undefined;
  }

  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name,
      namespace: normalizeName(values.namespace),
      labels: getResourceLabels(values, name),
    },
    spec: {
      clusterIP: 'None',
      selector: getSelectorLabels(name),
      ports,
    },
  };
};

/** 向导要提交的全部对象：工作负载本身；StatefulSet 有容器端口时再加一个无头服务 */
const buildCreateWorkloadDocuments = (
  kind: WorkloadKind,
  values: CreateWorkloadFormValues,
): Manifest[] => {
  const service =
    kind === 'StatefulSet' ? buildHeadlessServiceManifest(values) : undefined;

  return [
    buildCreateWorkloadManifest(kind, values),
    ...(service ? [service] : []),
  ];
};

/** 容器列表的检查：至少一个工作容器、名称不重复；返回提示文案，通过则为 undefined */
const checkContainers = (
  values: CreateWorkloadFormValues,
  t: Translate,
): string | undefined => {
  if (!values.containers?.length) {
    return t('pages.k8s.forms.workload.check.containersRequired');
  }
  if (!hasWorkerContainer(values)) {
    return t('pages.k8s.forms.workload.check.workerContainerRequired');
  }

  const names = values.containers.map((container) =>
    normalizeName(container.containerName),
  );
  if (new Set(names).size !== names.length) {
    return t('pages.k8s.forms.workload.check.containerNameDuplicate');
  }

  return undefined;
};

/** 提交前对整份表单值的检查（各步骤的字段校验之外）；返回提示文案，通过则为 undefined */
const checkWorkloadValues = (
  values: CreateWorkloadFormValues,
  t: Translate,
): string | undefined =>
  !normalizeName(values.name) || !normalizeName(values.namespace)
    ? t('pages.k8s.forms.workload.check.nameNamespaceRequired')
    : checkContainers(values, t);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * YAML 模式提交前的检查：允许多文档，但必须包含一个目标类型的对象。
 * 返回错误文案，或目标对象声明的命名空间（可能为空，由调用方用表单里的命名空间兜底）。
 */
const inspectYamlSubmission = (
  text: string,
  kind: string,
  apiVersion: string,
  t: Translate,
): { error: string } | { error?: undefined; namespace?: string } => {
  const documents = parseAllDocuments(text);
  if (documents.some((document) => document.errors.length > 0)) {
    return { error: t('pages.k8s.forms.workload.yaml.invalid') };
  }

  const objects: unknown[] = documents
    .map((document) => document.toJS())
    .filter((value) => value !== null && value !== undefined);
  if (objects.length === 0 || !objects.every(isPlainObject)) {
    return { error: t('pages.k8s.forms.workload.yaml.invalidObject') };
  }

  const resource = objects
    .filter(isPlainObject)
    .find((item) => item.kind === kind);
  if (!resource) {
    return { error: t('pages.k8s.forms.common.yaml.kindMismatch', { kind }) };
  }
  if (resource.apiVersion !== apiVersion) {
    return {
      error: t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
        apiVersion,
      }),
    };
  }

  const metadata = isPlainObject(resource.metadata) ? resource.metadata : {};
  if (typeof metadata.name !== 'string' || !metadata.name) {
    return { error: t('pages.k8s.forms.common.yaml.nameRequired') };
  }

  return {
    namespace:
      typeof metadata.namespace === 'string' ? metadata.namespace : undefined,
  };
};

// 桶：数量工具与表单初值切在子文件（quantity.ts / values.ts），历史 ./helpers 导入点不变；
// 新代码按主题直接引子文件
export {
  formatCpuQuantity,
  formatMemoryQuantity,
  isFiniteNumber,
  parseQuantity,
} from './quantity';
export {
  createRandomContainerName,
  getInitialContainerValues,
  getInitialCreateWorkloadValues,
} from './values';
export type { Manifest, PodTemplateOptions };
export {
  buildCreateWorkloadDocuments,
  buildCreateWorkloadManifest,
  buildHeadlessServiceManifest,
  buildPodTemplate,
  buildResourceMetadata,
  checkContainers,
  checkWorkloadValues,
  createId,
  hasWorkerContainer,
  INT_OR_PERCENT_PATTERN,
  inspectYamlSubmission,
  NAME_PATTERN,
  prune,
  toArgList,
  WORKLOAD_API_VERSION,
};
