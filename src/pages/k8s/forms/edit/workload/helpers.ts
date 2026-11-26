/**
 * 工作负载「编辑设置」的纯逻辑：对象原文 → 表单值（getWorkloadSettingsFormValues），
 * 以及表单值 → 改好的对象（buildUpdatedWorkloadSettingsManifest）。
 * 回写只动用户在表单里改过的部分：表单没有建模的字段（GPU 资源、gRPC 探针、其它亲和项等）原样保留。
 */

import { getStringValue } from '../../shared/manifest';
import type { StringListEditorItem } from '../../shared/StringListEditor';
import {
  buildCreateWorkloadManifest,
  getInitialCreateWorkloadValues,
  getStorageItemNames,
  parseQuantity,
} from '../../workload/helpers';
import type {
  ContainerActionFormValue,
  ContainerEnvItem,
  ContainerProbeFormValue,
  ContainerSeccompProfileType,
  ContainerType,
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadContainerMountItem,
  WorkloadKind,
  WorkloadMountMode,
  WorkloadSchedulingCustomRule,
  WorkloadStorageCategory,
  WorkloadStorageConfigItem,
  WorkloadStorageKeyPathItem,
} from '../../workload/types';

const DEFAULT_APP_LABEL_KEY = 'app';
const HOST_TIME_VOLUME_NAME = 'host-time';
const NODE_HOSTNAME_LABEL_KEY = 'kubernetes.io/hostname';

type ManifestRecord = Record<string, unknown>;

type ContainerManifestPair = {
  manifest: ManifestRecord;
  values: CreateWorkloadContainerValues;
};

const getRecordValue = (value: unknown): ManifestRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ManifestRecord)
    : undefined;

const getRecordArray = (value: unknown): ManifestRecord[] =>
  Array.isArray(value)
    ? value.filter((item): item is ManifestRecord =>
        Boolean(getRecordValue(item)),
      )
    : [];

const getNumberValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }
  return undefined;
};

const getIntOrStringTextValue = (value: unknown, fallback: string) => {
  const stringValue = getStringValue(value);
  if (stringValue) {
    return stringValue;
  }

  const numberValue = getNumberValue(value);
  return numberValue === undefined ? fallback : String(numberValue);
};

const getBooleanValue = (value: unknown) =>
  typeof value === 'boolean' ? value : undefined;

const getStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

const getNumberArray = (value: unknown) =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const numberValue = getNumberValue(item);
        return numberValue === undefined ? [] : [numberValue];
      })
    : [];

const createId = (prefix: string, index: number) => `${prefix}-${index}`;

/** 参数列表（argv）→ 列表编辑器的行 */
const toArgItems = (prefix: string, values: string[]): StringListEditorItem[] =>
  values.map((value, index) => ({ id: createId(prefix, index), value }));

const cloneManifest = (manifest: ManifestRecord): ManifestRecord =>
  JSON.parse(JSON.stringify(manifest));

const ensureRecordField = (target: ManifestRecord, key: string) => {
  const current = getRecordValue(target[key]);
  if (current) {
    return current;
  }

  const next: ManifestRecord = {};
  target[key] = next;
  return next;
};

/** CPU 数量 → 核（500m → 0.5） */
const parseCpuValue = (value: unknown) => parseQuantity(value);

/** 内存数量 → Mi（1G → 953.67，1Gi → 1024，1e9 → 953.67） */
const parseMemoryMiValue = (value: unknown) => {
  const bytes = parseQuantity(value);
  return bytes === undefined ? undefined : bytes / 1024 ** 2;
};

/** 存储数量 → Gi */
const parseStorageGiValue = (value: unknown) => {
  const bytes = parseQuantity(value);
  return bytes === undefined ? undefined : bytes / 1024 ** 3;
};

const getManifestMetadata = (manifest: ManifestRecord) =>
  getRecordValue(manifest.metadata) || {};

const getManifestSpec = (manifest: ManifestRecord) =>
  getRecordValue(manifest.spec) || {};

const getManifestTemplate = (manifest: ManifestRecord) =>
  getRecordValue(getManifestSpec(manifest).template) || {};

const getManifestTemplateMetadata = (manifest: ManifestRecord) =>
  getRecordValue(getManifestTemplate(manifest).metadata) || {};

const getManifestPodSpec = (manifest: ManifestRecord) =>
  getRecordValue(getManifestTemplate(manifest).spec) || {};

const toKeyValueItems = (record?: ManifestRecord) =>
  Object.entries(record || {}).map(([keyName, value], index) => ({
    id: createId('item', index),
    keyName,
    value: typeof value === 'string' ? value : String(value ?? ''),
  }));

/**
 * 探针 / 生命周期动作的端口是 IntOrString：数字直接用；命名端口按容器 ports 里的同名端口解析成端口号，
 * 解析不到则留空（表单的端口控件只接受数字），不会杜撰成 80。
 * 留空的动作不会生成清单，与打开时的清单一致即视为未改动，原对象里的命名端口原样保留。
 */
const parsePortValue = (
  value: unknown,
  namedPorts: Record<string, number>,
): number | undefined => {
  const numberValue = getNumberValue(value);
  if (numberValue !== undefined) {
    return numberValue;
  }
  const name = getStringValue(value);
  return name ? namedPorts[name] : undefined;
};

const parseActionValue = (
  value: unknown,
  namedPorts: Record<string, number>,
): ContainerActionFormValue | undefined => {
  const action = getRecordValue(value);
  if (!action) {
    return undefined;
  }

  const httpGet = getRecordValue(action.httpGet);
  if (httpGet) {
    return {
      enabled: true,
      handlerType: 'httpGet',
      scheme: getStringValue(httpGet.scheme) === 'HTTPS' ? 'HTTPS' : 'HTTP',
      path: getStringValue(httpGet.path) || '/',
      port: parsePortValue(httpGet.port, namedPorts),
    };
  }

  const exec = getRecordValue(action.exec);
  if (exec) {
    return {
      enabled: true,
      handlerType: 'exec',
      command: toArgItems('command', getStringArray(exec.command)),
    };
  }

  const tcpSocket = getRecordValue(action.tcpSocket);
  if (tcpSocket) {
    return {
      enabled: true,
      handlerType: 'tcpSocket',
      port: parsePortValue(tcpSocket.port, namedPorts),
    };
  }

  return undefined;
};

const parseProbeValue = (
  value: unknown,
  namedPorts: Record<string, number>,
): ContainerProbeFormValue | undefined => {
  const probe = getRecordValue(value);
  const action = parseActionValue(probe, namedPorts);
  if (!probe || !action) {
    return undefined;
  }

  return {
    ...action,
    initialDelaySeconds: getNumberValue(probe.initialDelaySeconds) ?? 0,
    timeoutSeconds: getNumberValue(probe.timeoutSeconds) ?? 1,
    periodSeconds: getNumberValue(probe.periodSeconds) ?? 10,
    successThreshold: getNumberValue(probe.successThreshold) ?? 1,
    failureThreshold: getNumberValue(probe.failureThreshold) ?? 3,
  };
};

const parseEnvItems = (value: unknown): ContainerEnvItem[] =>
  getRecordArray(value).map((item, index) => {
    const valueFrom = getRecordValue(item.valueFrom);
    const configMapKeyRef = getRecordValue(valueFrom?.configMapKeyRef);
    const secretKeyRef = getRecordValue(valueFrom?.secretKeyRef);

    if (configMapKeyRef || secretKeyRef) {
      const source = configMapKeyRef || secretKeyRef || {};
      const sourceType = configMapKeyRef ? 'configMap' : 'secret';
      const resourceKey = getStringValue(source.key) || '';

      return {
        id: createId('env', index),
        sourceType,
        keyName: getStringValue(item.name) || resourceKey,
        resourceName: getStringValue(source.name),
        resourceKey,
      };
    }

    return {
      id: createId('env', index),
      sourceType: 'custom',
      keyName: getStringValue(item.name) || '',
      value: getStringValue(item.value) || '',
    };
  });

const isSeccompProfileType = (
  value?: string,
): value is ContainerSeccompProfileType =>
  value === 'RuntimeDefault' || value === 'Localhost' || value === 'Unconfined';

const parseContainerValues = (
  manifest: ManifestRecord,
  containerType: ContainerType,
  index: number,
): CreateWorkloadContainerValues => {
  const resources = getRecordValue(manifest.resources) || {};
  const requests = getRecordValue(resources.requests) || {};
  const limits = getRecordValue(resources.limits) || {};
  const lifecycle = getRecordValue(manifest.lifecycle) || {};
  const namedPorts: Record<string, number> = {};
  for (const port of getRecordArray(manifest.ports)) {
    const name = getStringValue(port.name);
    const containerPort = getNumberValue(port.containerPort);
    if (name && containerPort !== undefined) {
      namedPorts[name] = containerPort;
    }
  }
  const postStart = parseActionValue(lifecycle.postStart, namedPorts);
  const preStop = parseActionValue(lifecycle.preStop, namedPorts);
  const healthChecks = {
    liveness: parseProbeValue(manifest.livenessProbe, namedPorts),
    readiness: parseProbeValue(manifest.readinessProbe, namedPorts),
    startup: parseProbeValue(manifest.startupProbe, namedPorts),
  };
  const command = getStringArray(manifest.command);
  const args = getStringArray(manifest.args);
  const env = parseEnvItems(manifest.env);
  const securityContext = getRecordValue(manifest.securityContext) || {};
  const seLinuxOptions = getRecordValue(securityContext.seLinuxOptions) || {};
  const capabilities = getRecordValue(securityContext.capabilities) || {};
  const seccompProfile = getRecordValue(securityContext.seccompProfile) || {};
  const seccompType = getStringValue(seccompProfile.type);
  const volumeMounts = getRecordArray(manifest.volumeMounts);
  const resizePolicy = getRecordArray(manifest.resizePolicy);
  const getResizePolicy = (resourceName: string) =>
    resizePolicy
      .map((item) => ({
        resourceName: getStringValue(item.resourceName),
        restartPolicy: getStringValue(item.restartPolicy),
      }))
      .find((item) => item.resourceName === resourceName)?.restartPolicy;
  const cpuResizeRestartPolicy = getResizePolicy('cpu');
  const memoryResizeRestartPolicy = getResizePolicy('memory');

  return {
    id: createId(`${containerType}-container`, index),
    containerName: getStringValue(manifest.name),
    containerType,
    image: getStringValue(manifest.image),
    imagePullPolicy: getStringValue(manifest.imagePullPolicy) || 'IfNotPresent',
    cpuRequest: parseCpuValue(requests.cpu),
    cpuLimit: parseCpuValue(limits.cpu),
    memoryRequest: parseMemoryMiValue(requests.memory),
    memoryLimit: parseMemoryMiValue(limits.memory),
    containerPorts: getRecordArray(manifest.ports).map((port) => ({
      protocol: getStringValue(port.protocol) || 'TCP',
      name: getStringValue(port.name),
      containerPort: getNumberValue(port.containerPort),
    })),
    enableHealthCheck: Object.values(healthChecks).some(Boolean),
    healthChecks,
    enableLifecycle: Boolean(postStart || preStop),
    lifecycleActions: {
      postStart,
      preStop,
    },
    enableStartupCommand: command.length > 0 || args.length > 0,
    startupCommand: toArgItems('command', command),
    startupArgs: toArgItems('arg', args),
    enableContainerEnv: env.length > 0,
    containerEnv: env,
    enableContainerSecurityContext: Object.keys(securityContext).length > 0,
    containerPrivileged: getBooleanValue(securityContext.privileged) || false,
    containerRunAsNonRoot:
      getBooleanValue(securityContext.runAsNonRoot) || false,
    containerRunAsUser: getNumberValue(securityContext.runAsUser),
    containerRunAsGroup: getNumberValue(securityContext.runAsGroup),
    containerReadOnlyRootFilesystem:
      getBooleanValue(securityContext.readOnlyRootFilesystem) || false,
    allowPrivilegeEscalation:
      getBooleanValue(securityContext.allowPrivilegeEscalation) || false,
    containerSeLinuxLevel: getStringValue(seLinuxOptions.level),
    containerSeLinuxRole: getStringValue(seLinuxOptions.role),
    containerSeLinuxType: getStringValue(seLinuxOptions.type),
    containerSeLinuxUser: getStringValue(seLinuxOptions.user),
    containerCapabilitiesAdd: getStringArray(capabilities.add),
    containerCapabilitiesDrop: getStringArray(capabilities.drop),
    containerSeccompProfileType: isSeccompProfileType(seccompType)
      ? seccompType
      : undefined,
    containerSeccompProfileLocalhost: getStringValue(
      seccompProfile.localhostProfile,
    ),
    enableResizePolicy: Boolean(
      cpuResizeRestartPolicy || memoryResizeRestartPolicy,
    ),
    cpuResizeRestartPolicy:
      cpuResizeRestartPolicy === 'RestartContainer'
        ? 'RestartContainer'
        : cpuResizeRestartPolicy === 'NotRequired'
          ? 'NotRequired'
          : undefined,
    memoryResizeRestartPolicy:
      memoryResizeRestartPolicy === 'RestartContainer'
        ? 'RestartContainer'
        : memoryResizeRestartPolicy === 'NotRequired'
          ? 'NotRequired'
          : undefined,
    syncHostTimezone: volumeMounts.some(
      (mount) =>
        mount.name === HOST_TIME_VOLUME_NAME ||
        mount.mountPath === '/etc/localtime',
    ),
  };
};

const getContainerPairs = (manifest: ManifestRecord) => {
  const podSpec = getManifestPodSpec(manifest);
  const initContainers = getRecordArray(podSpec.initContainers);
  const containers = getRecordArray(podSpec.containers);

  return [
    ...initContainers.map((container, index) => ({
      manifest: container,
      values: parseContainerValues(container, 'init', index),
    })),
    ...containers.map((container, index) => ({
      manifest: container,
      values: parseContainerValues(container, 'worker', index),
    })),
  ];
};

const getContainerMounts = (
  volumeName: string,
  storageCategory: WorkloadStorageCategory,
  containers: ContainerManifestPair[],
): WorkloadContainerMountItem[] =>
  containers.flatMap((container, index) => {
    const volumeMount = getRecordArray(container.manifest.volumeMounts).find(
      (mount) => mount.name === volumeName,
    );

    if (!volumeMount) {
      return [];
    }

    const mountMode: WorkloadMountMode =
      storageCategory === 'config' || volumeMount.readOnly
        ? 'readOnly'
        : 'readWrite';

    return [
      {
        id: createId(`mount-${volumeName}`, index),
        containerId: container.values.id,
        containerName: container.values.containerName,
        mountMode,
        mountPath: getStringValue(volumeMount.mountPath) || '',
        subPath: getStringValue(volumeMount.subPath),
      },
    ];
  });

const parseSpecificKeyPaths = (items: unknown): WorkloadStorageKeyPathItem[] =>
  getRecordArray(items).map((item, index) => ({
    id: createId('key-path', index),
    keyName: getStringValue(item.key),
    path: getStringValue(item.path) || '',
  }));

const parseVolumeStorageItems = (
  podSpec: ManifestRecord,
  containers: ContainerManifestPair[],
): WorkloadStorageConfigItem[] =>
  getRecordArray(podSpec.volumes).flatMap<WorkloadStorageConfigItem>(
    (volume, index) => {
      const volumeName = getStringValue(volume.name);
      if (!volumeName || volumeName === HOST_TIME_VOLUME_NAME) {
        return [];
      }

      const persistentVolumeClaim = getRecordValue(
        volume.persistentVolumeClaim,
      );
      if (persistentVolumeClaim) {
        return [
          {
            id: createId('storage', index),
            storageCategory: 'volume',
            storageType: 'persistentVolumeClaim',
            volumeType: 'persistentVolumeClaim',
            claimName: getStringValue(persistentVolumeClaim.claimName),
            volumeName,
            containerMounts: getContainerMounts(
              volumeName,
              'volume',
              containers,
            ),
          },
        ];
      }

      const emptyDir = getRecordValue(volume.emptyDir);
      if (emptyDir) {
        return [
          {
            id: createId('storage', index),
            storageCategory: 'volume',
            storageType: 'emptyDir',
            volumeType: 'emptyDir',
            volumeName,
            emptyDirSizeLimit: getStringValue(emptyDir.sizeLimit) || '200Mi',
            containerMounts: getContainerMounts(
              volumeName,
              'volume',
              containers,
            ),
          },
        ];
      }

      const hostPath = getRecordValue(volume.hostPath);
      if (hostPath) {
        return [
          {
            id: createId('storage', index),
            storageCategory: 'volume',
            storageType: 'hostPath',
            volumeType: 'hostPath',
            volumeName,
            hostPath: getStringValue(hostPath.path),
            containerMounts: getContainerMounts(
              volumeName,
              'volume',
              containers,
            ),
          },
        ];
      }

      const configMap = getRecordValue(volume.configMap);
      if (configMap) {
        const specificKeyPaths = parseSpecificKeyPaths(configMap.items);
        return [
          {
            id: createId('storage', index),
            storageCategory: 'config',
            storageType: 'configMap',
            configResourceType: 'configMap',
            volumeName,
            configResourceName: getStringValue(configMap.name),
            selectSpecificKeys: specificKeyPaths.length > 0,
            specificKeyPaths,
            containerMounts: getContainerMounts(
              volumeName,
              'config',
              containers,
            ),
          },
        ];
      }

      const secret = getRecordValue(volume.secret);
      if (secret) {
        const specificKeyPaths = parseSpecificKeyPaths(secret.items);
        return [
          {
            id: createId('storage', index),
            storageCategory: 'config',
            storageType: 'secret',
            configResourceType: 'secret',
            volumeName,
            configResourceName: getStringValue(secret.secretName),
            selectSpecificKeys: specificKeyPaths.length > 0,
            specificKeyPaths,
            containerMounts: getContainerMounts(
              volumeName,
              'config',
              containers,
            ),
          },
        ];
      }

      return [];
    },
  );

const parseVolumeClaimTemplateItems = (
  spec: ManifestRecord,
  containers: ContainerManifestPair[],
): WorkloadStorageConfigItem[] =>
  getRecordArray(spec.volumeClaimTemplates).flatMap((template, index) => {
    const metadata = getRecordValue(template.metadata) || {};
    const templateSpec = getRecordValue(template.spec) || {};
    const resources = getRecordValue(templateSpec.resources) || {};
    const requests = getRecordValue(resources.requests) || {};
    const volumeName = getStringValue(metadata.name);

    if (!volumeName) {
      return [];
    }

    return [
      {
        id: createId('pvc-template', index),
        storageCategory: 'volume',
        storageType: 'volumeClaimTemplate',
        volumeType: 'persistentVolumeClaim',
        pvcNamePrefix: volumeName,
        pvcStorageClassName: getStringValue(templateSpec.storageClassName),
        pvcAccessModes: getStringArray(templateSpec.accessModes),
        pvcSizeGi: parseStorageGiValue(requests.storage) || 10,
        containerMounts: getContainerMounts(volumeName, 'volume', containers),
      },
    ];
  });

const getStorageItemsFromManifest = (
  type: WorkloadKind,
  manifest: ManifestRecord,
  containers: ContainerManifestPair[],
) => [
  ...parseVolumeStorageItems(getManifestPodSpec(manifest), containers),
  ...(type === 'StatefulSet'
    ? parseVolumeClaimTemplateItems(getManifestSpec(manifest), containers)
    : []),
];

/** 两份由同一套逻辑生成的结构是否相同 */
const same = (first: unknown, second: unknown) =>
  JSON.stringify(first ?? null) === JSON.stringify(second ?? null);

const recordMatches = (
  first?: ManifestRecord,
  second?: ManifestRecord,
): boolean => {
  const firstEntries = Object.entries(first || {});
  const secondEntries = Object.entries(second || {});

  if (
    firstEntries.length === 0 ||
    firstEntries.length !== secondEntries.length
  ) {
    return false;
  }

  return firstEntries.every(([key, value]) => second?.[key] === value);
};

const getTermSelector = (term: unknown) =>
  getRecordValue(getRecordValue(term)?.labelSelector);

const getTermLabels = (term: unknown) =>
  getRecordValue(getTermSelector(term)?.matchLabels);

const getPreferredTerms = (value: unknown) =>
  getRecordArray(value)
    .map((item) => item.podAffinityTerm)
    .filter(Boolean);

const getSchedulingRules = (
  affinityValue: unknown,
): WorkloadSchedulingCustomRule[] => {
  const affinity = getRecordValue(affinityValue) || {};
  const podAffinity = getRecordValue(affinity.podAffinity) || {};
  const podAntiAffinity = getRecordValue(affinity.podAntiAffinity) || {};
  const groups = [
    {
      type: 'affinity' as const,
      strategy: 'preferred' as const,
      terms: getPreferredTerms(
        podAffinity.preferredDuringSchedulingIgnoredDuringExecution,
      ),
    },
    {
      type: 'affinity' as const,
      strategy: 'required' as const,
      terms: getRecordArray(
        podAffinity.requiredDuringSchedulingIgnoredDuringExecution,
      ),
    },
    {
      type: 'antiAffinity' as const,
      strategy: 'preferred' as const,
      terms: getPreferredTerms(
        podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution,
      ),
    },
    {
      type: 'antiAffinity' as const,
      strategy: 'required' as const,
      terms: getRecordArray(
        podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution,
      ),
    },
  ];

  return groups.flatMap((group) =>
    group.terms.flatMap((term) => {
      const selector = getTermSelector(term);
      const labels = getTermLabels(term) || {};
      const expressions = getRecordArray(selector?.matchExpressions);
      if (
        !selector ||
        (Object.keys(labels).length === 0 && expressions.length === 0)
      ) {
        return [];
      }

      // 目标展示为工作负载名（app 标签）；没有 app 标签时展示选择器本身
      const target =
        getStringValue(labels[DEFAULT_APP_LABEL_KEY]) ||
        Object.entries(labels)
          .map(([key, value]) => `${key}=${value}`)
          .join(',') ||
        JSON.stringify(expressions);
      return [
        {
          type: group.type,
          strategy: group.strategy,
          target,
          targetSelector: selector,
        },
      ];
    }),
  );
};

const getSchedulingValues = (
  manifest: ManifestRecord,
): Pick<
  CreateWorkloadFormValues,
  'podSchedulingRule' | 'podSchedulingCustomRules'
> => {
  const spec = getManifestSpec(manifest);
  const podSpec = getManifestPodSpec(manifest);
  const affinity = getRecordValue(podSpec.affinity);
  const podAffinity = getRecordValue(affinity?.podAffinity) || {};
  const podAntiAffinity = getRecordValue(affinity?.podAntiAffinity) || {};
  const ownSelector = getRecordValue(spec.selector);
  const selectorLabels = getRecordValue(ownSelector?.matchLabels);
  const templateLabels = getRecordValue(
    getManifestTemplateMetadata(manifest).labels,
  );
  /** 亲和项指向工作负载自己的容器组：选择器与 spec.selector 或 Pod 模板标签一致 */
  const isOwnTerm = (term: unknown) =>
    same(getTermSelector(term), ownSelector) ||
    (getRecordArray(getTermSelector(term)?.matchExpressions).length === 0 &&
      (recordMatches(getTermLabels(term), selectorLabels) ||
        recordMatches(getTermLabels(term), templateLabels)));
  const affinityPreferred = getPreferredTerms(
    podAffinity.preferredDuringSchedulingIgnoredDuringExecution,
  );
  const antiAffinityPreferred = getPreferredTerms(
    podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution,
  );
  const hasRequired =
    getRecordArray(podAffinity.requiredDuringSchedulingIgnoredDuringExecution)
      .length > 0 ||
    getRecordArray(
      podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution,
    ).length > 0;

  if (
    !hasRequired &&
    affinityPreferred.length === 0 &&
    antiAffinityPreferred.length > 0 &&
    antiAffinityPreferred.every(isOwnTerm)
  ) {
    return {
      podSchedulingRule: 'spread',
      podSchedulingCustomRules: [],
    };
  }

  if (
    !hasRequired &&
    antiAffinityPreferred.length === 0 &&
    affinityPreferred.length > 0 &&
    affinityPreferred.every(isOwnTerm)
  ) {
    return {
      podSchedulingRule: 'centralized',
      podSchedulingCustomRules: [],
    };
  }

  const customRules = getSchedulingRules(affinity);
  return customRules.length > 0
    ? {
        podSchedulingRule: 'custom',
        podSchedulingCustomRules: customRules,
      }
    : {
        podSchedulingRule: 'default',
        podSchedulingCustomRules: [],
      };
};

const getUpdateStrategyValues = (
  type: WorkloadKind,
  spec: ManifestRecord,
): Partial<CreateWorkloadFormValues> => {
  const strategy =
    type === 'Deployment'
      ? getRecordValue(spec.strategy) || {}
      : getRecordValue(spec.updateStrategy) || {};
  const rollingUpdate = getRecordValue(strategy.rollingUpdate) || {};
  const strategyType = getStringValue(strategy.type);

  if (type === 'Deployment') {
    return {
      updateStrategyType:
        strategyType === 'Recreate' ? 'Recreate' : 'RollingUpdate',
      maxUnavailable: getIntOrStringTextValue(
        rollingUpdate.maxUnavailable,
        '25%',
      ),
      maxSurge: getIntOrStringTextValue(rollingUpdate.maxSurge, '25%'),
    };
  }

  if (type === 'StatefulSet') {
    return {
      updateStrategyType:
        strategyType === 'OnDelete' ? 'OnDelete' : 'RollingUpdate',
      updatePartition: getNumberValue(rollingUpdate.partition) ?? 0,
    };
  }

  return {
    updateStrategyType:
      strategyType === 'OnDelete' ? 'OnDelete' : 'RollingUpdate',
    maxUnavailable: getIntOrStringTextValue(
      rollingUpdate.maxUnavailable,
      '25%',
    ),
    minReadySeconds: getNumberValue(spec.minReadySeconds) ?? 0,
  };
};

const getWorkloadSettingsFormValues = (
  type: WorkloadKind,
  manifest: ManifestRecord,
): CreateWorkloadFormValues => {
  const metadata = getManifestMetadata(manifest);
  const spec = getManifestSpec(manifest);
  const podSpec = getManifestPodSpec(manifest);
  const containers = getContainerPairs(manifest);
  const namespace = getStringValue(metadata.namespace);
  const initialValues = getInitialCreateWorkloadValues(type, namespace);
  const terminationGracePeriodSeconds = getNumberValue(
    podSpec.terminationGracePeriodSeconds,
  );
  const podSecurityContext = getRecordValue(podSpec.securityContext) || {};
  const podSeLinuxOptions =
    getRecordValue(podSecurityContext.seLinuxOptions) || {};
  const supplementalGroupsPolicy = getStringValue(
    podSecurityContext.supplementalGroupsPolicy,
  );

  return {
    ...initialValues,
    name: getStringValue(metadata.name),
    namespace,
    replicas:
      type === 'DaemonSet'
        ? undefined
        : (getNumberValue(spec.replicas) ?? initialValues.replicas),
    ...getUpdateStrategyValues(type, spec),
    containers: containers.map((container) => container.values),
    storageItems: getStorageItemsFromManifest(type, manifest, containers),
    enablePodSecurityContext: Object.keys(podSecurityContext).length > 0,
    runAsNonRoot: getBooleanValue(podSecurityContext.runAsNonRoot) || false,
    runAsUser: getNumberValue(podSecurityContext.runAsUser),
    runAsGroup: getNumberValue(podSecurityContext.runAsGroup),
    fsGroup: getNumberValue(podSecurityContext.fsGroup),
    supplementalGroups: getNumberArray(
      podSecurityContext.supplementalGroups,
    ).join(','),
    supplementalGroupsPolicy:
      supplementalGroupsPolicy === 'Strict'
        ? 'Strict'
        : supplementalGroupsPolicy === 'Merge'
          ? 'Merge'
          : undefined,
    seLinuxLevel: getStringValue(podSeLinuxOptions.level),
    seLinuxRole: getStringValue(podSeLinuxOptions.role),
    seLinuxType: getStringValue(podSeLinuxOptions.type),
    seLinuxUser: getStringValue(podSeLinuxOptions.user),
    enablePodGracefulTermination: terminationGracePeriodSeconds !== undefined,
    terminationGracePeriodSeconds:
      terminationGracePeriodSeconds ??
      initialValues.terminationGracePeriodSeconds,
    labels: toKeyValueItems(getRecordValue(metadata.labels)),
    annotations: toKeyValueItems(getRecordValue(metadata.annotations)),
    ...getSchedulingValues(manifest),
  };
};

// ---- 表单值 → 改好的对象 ----

/** 表单直接建模的容器字段（env 与 volumeMounts 另行合并） */
const CONTAINER_FIELDS = [
  'image',
  'imagePullPolicy',
  'command',
  'args',
  'ports',
  'resources',
  'resizePolicy',
  'livenessProbe',
  'readinessProbe',
  'startupProbe',
  'lifecycle',
  'securityContext',
];

const PARSED_CONTAINER_ID = /^(worker|init)-container-(\d+)$/;

type GeneratedContainer = {
  /** 表单里的容器 ID：解析自对象的容器形如 worker-container-0，新增的是随机串 */
  id?: string;
  init: boolean;
  manifest: ManifestRecord;
};

/** 生成的清单里的容器，按表单里的容器 ID 对应（生成顺序与表单顺序一致） */
const getGeneratedContainers = (
  values: CreateWorkloadFormValues,
  generated: ManifestRecord,
): GeneratedContainer[] => {
  const podSpec = getManifestPodSpec(generated);
  const all = values.containers || [];
  const pair = (init: boolean, manifests: ManifestRecord[]) =>
    all
      .filter((container) => (container.containerType === 'init') === init)
      .flatMap((container, index) =>
        manifests[index]
          ? [{ id: container.id, init, manifest: manifests[index] }]
          : [],
      );

  return [
    ...pair(true, getRecordArray(podSpec.initContainers)),
    ...pair(false, getRecordArray(podSpec.containers)),
  ];
};

/** 表单里的容器在原对象中对应的容器（改名、在初始化 / 工作容器之间切换后仍能对应上） */
const findBaseContainer = (
  basePodSpec: ManifestRecord,
  id?: string,
): ManifestRecord | undefined => {
  const matched = id?.match(PARSED_CONTAINER_ID);
  if (!matched) {
    return undefined;
  }
  const list = getRecordArray(
    matched[1] === 'init' ? basePodSpec.initContainers : basePodSpec.containers,
  );
  return list[Number(matched[2])];
};

/** 列表里各按名称索引（名称缺失的不参与匹配） */
const indexByName = (
  value: unknown,
  nameOf: (item: ManifestRecord) => string | undefined,
) => {
  const map = new Map<string, ManifestRecord>();
  for (const item of getRecordArray(value)) {
    const name = nameOf(item);
    if (name) {
      map.set(name, item);
    }
  }
  return map;
};

/** 名称不与已保留的重复：重复时加序号（同一 Pod 内卷名必须唯一，口径同创建向导） */
const uniqueStorageName = (name: string, used: Set<string>) => {
  let next = name;
  for (let index = 2; used.has(next); index += 1) {
    const suffix = `-${index}`;
    next = `${name.slice(0, 63 - suffix.length)}${suffix}`;
  }
  used.add(next);
  return next;
};

/**
 * 按名称做三路合并（挂载用）。base 是对象原文里的列表，initial / generated 是「打开时」「当前」两份表单值
 * 各自生成的列表（已按 mergeStorageObjects 的结果换回原对象里的名称）：
 * - 原文有、两份生成结果里相同：用户没动，沿用原文（表单没建模的子字段得以保留）；
 * - 原文有、两份里都没有：表单不认识的项，原样保留；
 * - 原文有、只有打开时有：用户删了，去掉；
 * - 原文有、当前与打开时不同：用户改了，由 mergeItem 把表单的改动叠到原文上；
 * - 原文没有、只有当前有：新增，追加在末尾。
 * 原文没有但打开时就有的不写回：那是表单生成结果与原文的固有差异，不是用户的改动。
 */
const mergeStorageList = (
  baseValue: unknown,
  initialValue: unknown,
  generatedValue: unknown,
  nameOf: (item: ManifestRecord) => string | undefined,
  mergeItem: (
    base: ManifestRecord,
    generated: ManifestRecord,
  ) => ManifestRecord,
): ManifestRecord[] | undefined => {
  const baseByName = indexByName(baseValue, nameOf);
  const initialByName = indexByName(initialValue, nameOf);
  const generatedByName = indexByName(generatedValue, nameOf);
  const merged: ManifestRecord[] = [];

  for (const [name, baseItem] of baseByName) {
    const initialItem = initialByName.get(name);
    const generatedItem = generatedByName.get(name);
    if (generatedItem === undefined) {
      if (initialItem === undefined) {
        merged.push(baseItem);
      }
      continue;
    }
    merged.push(
      initialItem && same(initialItem, generatedItem)
        ? baseItem
        : mergeItem(baseItem, generatedItem),
    );
  }
  for (const [name, generatedItem] of generatedByName) {
    if (!baseByName.has(name) && !initialByName.has(name)) {
      merged.push(generatedItem);
    }
  }
  return merged.length > 0 ? merged : undefined;
};

/** 表单打开时由原对象解析出的存储项，id 里带着它在原对象里的位置（见 parseVolumeStorageItems / parseVolumeClaimTemplateItems） */
const PARSED_STORAGE_ID = /^storage-(\d+)$/;
const PARSED_TEMPLATE_ID = /^pvc-template-(\d+)$/;

/** 原对象里的一个存储项与两份生成结果的对应关系 */
type StorageLink = {
  /** 打开时这一项生成的名称；当时没有产生卷 / 模板为空 */
  initialName?: string;
  /** 当前生成的名称；现在没有产生卷 / 模板为空 */
  generatedName?: string;
  /** 这一项已在表单里删除 */
  removed: boolean;
};

/**
 * 把原对象里的存储项与「打开时」「当前」两份生成结果连起来：键是它在原对象列表里的下标。
 * 表单按资源名重新给 configMap / secret / PVC 卷命名，光比名称和原对象对不上，所以靠解析时写进 id 的位置来对应。
 */
const linkStorageItems = (
  initialValues: CreateWorkloadFormValues,
  values: CreateWorkloadFormValues,
  parsedId: RegExp,
  initialNames: Map<number, string>,
  generatedNames: Map<number, string>,
): Map<number, StorageLink> => {
  const currentIndexes = new Map<string, number>();
  (values.storageItems || []).forEach((item, index) => {
    if (item.id) {
      currentIndexes.set(item.id, index);
    }
  });

  const links = new Map<number, StorageLink>();
  (initialValues.storageItems || []).forEach((item, index) => {
    const matched = item.id?.match(parsedId);
    if (!matched || !item.id) {
      return;
    }
    const currentIndex = currentIndexes.get(item.id);
    links.set(Number(matched[1]), {
      initialName: initialNames.get(index),
      generatedName:
        currentIndex === undefined
          ? undefined
          : generatedNames.get(currentIndex),
      removed: currentIndex === undefined,
    });
  });
  return links;
};

type StorageMerge = {
  list: ManifestRecord[] | undefined;
  /** 当前生成结果里的名称 → 回写后的名称（挂载按它同步改名） */
  renames: Map<string, string>;
  /** 打开时生成结果里的名称 → 回写后的名称（比对挂载有没有改动之前先统一名称） */
  initialRenames: Map<string, string>;
};

/**
 * 卷 / 卷声明模板的三路合并（links 见 linkStorageItems）：
 * - 原对象里没有对应表单项的（projected 等表单不认识的类型）原样保留；
 * - 表单项被删除，或原本产生卷而现在不再产生：去掉；
 * - 打开时与当前生成的相同：用户没动，沿用原对象；
 * - 否则：把表单的改动叠到原对象上。
 * 表单项一律沿用原对象里的名称——卷声明模板改名会让已绑定的持久卷声明对不上，卷改名也会和挂载对不上；
 * 表单生成的名称只用来在生成结果里找到对应的卷。表单里新增的项追加在末尾。
 */
const mergeStorageObjects = (
  baseValue: unknown,
  initialValue: unknown,
  generatedValue: unknown,
  links: Map<number, StorageLink>,
  nameOf: (item: ManifestRecord) => string | undefined,
  renamed: (item: ManifestRecord, name: string) => ManifestRecord,
  mergeItem: (
    base: ManifestRecord,
    generated: ManifestRecord,
  ) => ManifestRecord,
): StorageMerge => {
  const initialByName = indexByName(initialValue, nameOf);
  const generatedByName = indexByName(generatedValue, nameOf);
  const renames = new Map<string, string>();
  const initialRenames = new Map<string, string>();
  const usedNames = new Set<string>();
  const merged: ManifestRecord[] = [];

  getRecordArray(baseValue).forEach((baseItem, index) => {
    const baseName = nameOf(baseItem);
    const link = baseName ? links.get(index) : undefined;
    if (!baseName || !link) {
      // 表单不认识的项，原样保留
      if (baseName) {
        usedNames.add(baseName);
      }
      merged.push(baseItem);
      return;
    }
    if (link.initialName) {
      initialRenames.set(link.initialName, baseName);
    }
    if (link.generatedName) {
      renames.set(link.generatedName, baseName);
    }
    if (link.removed || (!link.generatedName && link.initialName)) {
      return;
    }
    usedNames.add(baseName);
    const generated = link.generatedName
      ? generatedByName.get(link.generatedName)
      : undefined;
    const initial = link.initialName
      ? initialByName.get(link.initialName)
      : undefined;
    merged.push(
      generated && (!initial || !same(initial, generated))
        ? renamed(mergeItem(baseItem, generated), baseName)
        : baseItem,
    );
  });

  for (const [name, generated] of generatedByName) {
    if (renames.has(name) || initialByName.has(name)) {
      continue;
    }
    const finalName = uniqueStorageName(name, usedNames);
    renames.set(name, finalName);
    merged.push(renamed(generated, finalName));
  }

  return {
    list: merged.length > 0 ? merged : undefined,
    renames,
    initialRenames,
  };
};

/** 用表单生成的值覆盖表单建模的字段（生成结果里没有的即删掉），其余子字段沿用原对象 */
const overlayFields = (
  base: ManifestRecord | undefined,
  generated: ManifestRecord | undefined,
  fields: string[],
) => {
  const next: ManifestRecord = { ...(base || {}) };
  for (const field of fields) {
    if (generated?.[field] !== undefined) {
      next[field] = generated[field];
    } else {
      delete next[field];
    }
  }
  return next;
};

/** 各类卷里由表单建模的子字段；其余（emptyDir.medium、hostPath.type、defaultMode、optional…）沿用原值 */
const VOLUME_SOURCE_FIELDS: Record<string, string[]> = {
  persistentVolumeClaim: ['claimName'],
  emptyDir: ['sizeLimit'],
  hostPath: ['path'],
  configMap: ['name', 'items'],
  secret: ['secretName', 'items'],
};

/** 表单改过的卷：卷类型没变时只覆盖表单建模的子字段；换了类型整体用生成的 */
const mergeVolume = (base: ManifestRecord, generated: ManifestRecord) => {
  const sourceKey = Object.keys(VOLUME_SOURCE_FIELDS).find(
    (key) => base[key] !== undefined,
  );
  if (!sourceKey || generated[sourceKey] === undefined) {
    return generated;
  }
  return {
    ...base,
    [sourceKey]: overlayFields(
      getRecordValue(base[sourceKey]),
      getRecordValue(generated[sourceKey]),
      VOLUME_SOURCE_FIELDS[sourceKey],
    ),
  };
};

/** 表单改过的挂载：只覆盖挂载路径 / 子路径 / 读写模式，mountPropagation 等沿用原值 */
const mergeMount = (base: ManifestRecord, generated: ManifestRecord) =>
  overlayFields(base, generated, ['mountPath', 'subPath', 'readOnly']);

/** 表单改过的卷声明模板：访问模式 / 存储类 / 容量按表单，标签注解 / dataSource / volumeMode 等沿用原值 */
const mergeVolumeClaimTemplate = (
  base: ManifestRecord,
  generated: ManifestRecord,
) => {
  const baseSpec = getRecordValue(base.spec);
  const generatedSpec = getRecordValue(generated.spec);
  if (!baseSpec || !generatedSpec) {
    return generated;
  }
  const requests = overlayFields(
    getRecordValue(getRecordValue(baseSpec.resources)?.requests),
    getRecordValue(getRecordValue(generatedSpec.resources)?.requests),
    ['storage'],
  );
  const spec = overlayFields(baseSpec, generatedSpec, [
    'accessModes',
    'storageClassName',
  ]);
  spec.resources = {
    ...(getRecordValue(baseSpec.resources) || {}),
    requests,
  };
  return {
    ...base,
    metadata: {
      ...(getRecordValue(base.metadata) || {}),
      ...(getRecordValue(generated.metadata) || {}),
    },
    spec,
  };
};

const isUnsupportedEnvValueFrom = (env?: ManifestRecord) => {
  const valueFrom = getRecordValue(env?.valueFrom);
  return Boolean(
    valueFrom && !valueFrom.configMapKeyRef && !valueFrom.secretKeyRef,
  );
};

/**
 * 表单不支持的取值来源（fieldRef 等）在表单里显示为空值的自定义变量：
 * 该行没有被改动时还原为原来的定义。
 */
const mergeEnvItems = (baseEnvValue: unknown, generatedEnvValue: unknown) => {
  const baseEnv = getRecordArray(baseEnvValue);
  const nextEnv = getRecordArray(generatedEnvValue).map((env) => {
    const baseItem = baseEnv.find((item) => item.name === env.name);
    return isUnsupportedEnvValueFrom(baseItem) &&
      env.value === '' &&
      !env.valueFrom
      ? (baseItem as ManifestRecord)
      : env;
  });

  return nextEnv.length > 0 ? nextEnv : undefined;
};

const setOrDelete = (target: ManifestRecord, key: string, value: unknown) => {
  if (value === undefined || (Array.isArray(value) && value.length === 0)) {
    delete target[key];
  } else {
    target[key] = value;
  }
};

/**
 * 表单只管 CPU 与内存：其它资源（GPU、临时存储等）与 claims 沿用原对象。
 * CPU / 内存按 requests.cpu 等单项比较：打开时与当前生成的数量相同说明没改，
 * 原对象里的写法（1G、1e9、1.5Gi…）原样保留，只回写改过的项。
 * initialValue 为 undefined 表示没有打开时的基准（新容器），每一项都按改过处理。
 */
const mergeResources = (
  baseValue: unknown,
  initialValue: unknown,
  generatedValue: unknown,
) => {
  const base = getRecordValue(baseValue) || {};
  const initial = getRecordValue(initialValue);
  const generated = getRecordValue(generatedValue) || {};
  const next: ManifestRecord = { ...base };

  for (const key of ['requests', 'limits']) {
    const merged: ManifestRecord = { ...(getRecordValue(base[key]) || {}) };
    const initialGroup = getRecordValue(initial?.[key]) || {};
    const generatedGroup = getRecordValue(generated[key]) || {};
    for (const name of ['cpu', 'memory']) {
      if (initial && same(initialGroup[name], generatedGroup[name])) {
        continue;
      }
      if (generatedGroup[name] === undefined) {
        delete merged[name];
      } else {
        merged[name] = generatedGroup[name];
      }
    }
    setOrDelete(next, key, Object.keys(merged).length > 0 ? merged : undefined);
  }

  return Object.keys(next).length > 0 ? next : undefined;
};

const mountNameOf = (mount: ManifestRecord) => getStringValue(mount.name);
const volumeNameOf = (volume: ManifestRecord) => getStringValue(volume.name);
const templateNameOf = (template: ManifestRecord) =>
  getStringValue(getRecordValue(template.metadata)?.name);

const renameVolume = (volume: ManifestRecord, name: string) => ({
  ...volume,
  name,
});
const renameTemplate = (
  template: ManifestRecord,
  name: string,
): ManifestRecord => ({
  ...template,
  metadata: { ...(getRecordValue(template.metadata) || {}), name },
});
/** 生成结果里的挂载按卷的回写结果改名（卷沿用原对象里的名称） */
const renameMounts = (
  value: unknown,
  mountRenames: Map<string, string>,
): ManifestRecord[] =>
  getRecordArray(value).map((mount) => {
    const finalName = mountRenames.get(getStringValue(mount.name) ?? '');
    return finalName ? { ...mount, name: finalName } : mount;
  });

const mergeContainerManifest = (
  baseContainer: ManifestRecord | undefined,
  initialContainer: ManifestRecord | undefined,
  generatedContainer: ManifestRecord,
  mountRenames: Pick<StorageMerge, 'renames' | 'initialRenames'>,
) => {
  const nextContainer: ManifestRecord = { ...(baseContainer || {}) };
  // 原对象里有、表单打开时也有的容器：只回写表单里改过的字段
  const tracked = Boolean(baseContainer && initialContainer);
  const untouched = (field: string) =>
    tracked && same(initialContainer?.[field], generatedContainer[field]);

  nextContainer.name = generatedContainer.name;
  for (const field of CONTAINER_FIELDS) {
    if (!untouched(field)) {
      setOrDelete(
        nextContainer,
        field,
        field === 'resources'
          ? mergeResources(
              baseContainer?.resources,
              tracked ? (initialContainer?.resources ?? {}) : undefined,
              generatedContainer.resources,
            )
          : generatedContainer[field],
      );
    }
  }
  if (!untouched('env')) {
    setOrDelete(
      nextContainer,
      'env',
      mergeEnvItems(baseContainer?.env, generatedContainer.env),
    );
  }
  // 挂载与卷一样三路合并（卷沿用原对象里的名称，生成的挂载先按 mergeStorageObjects 的结果改名）；
  // 表单打开时还没有的容器是新增的，直接用生成的挂载
  setOrDelete(
    nextContainer,
    'volumeMounts',
    tracked
      ? mergeStorageList(
          baseContainer?.volumeMounts,
          renameMounts(
            initialContainer?.volumeMounts,
            mountRenames.initialRenames,
          ),
          renameMounts(generatedContainer.volumeMounts, mountRenames.renames),
          mountNameOf,
          mergeMount,
        )
      : renameMounts(generatedContainer.volumeMounts, mountRenames.renames),
  );

  return nextContainer;
};

const applySchedulingSettings = (
  podSpec: ManifestRecord,
  values: CreateWorkloadFormValues,
  generatedPodSpec: ManifestRecord,
  ownSelector: ManifestRecord,
) => {
  const nextAffinity = { ...(getRecordValue(podSpec.affinity) || {}) };
  const generatedAffinity = getRecordValue(generatedPodSpec.affinity) || {};

  delete nextAffinity.podAffinity;
  delete nextAffinity.podAntiAffinity;

  if (
    values.podSchedulingRule === 'spread' ||
    values.podSchedulingRule === 'centralized'
  ) {
    // 分散 / 集中：与工作负载自己的容器组互斥 / 亲和，选择器用对象自己的 spec.selector
    nextAffinity[
      values.podSchedulingRule === 'spread' ? 'podAntiAffinity' : 'podAffinity'
    ] = {
      preferredDuringSchedulingIgnoredDuringExecution: [
        {
          weight: 100,
          podAffinityTerm: {
            labelSelector: ownSelector,
            topologyKey: NODE_HOSTNAME_LABEL_KEY,
          },
        },
      ],
    };
  } else if (values.podSchedulingRule === 'custom') {
    if (generatedAffinity.podAffinity) {
      nextAffinity.podAffinity = generatedAffinity.podAffinity;
    }
    if (generatedAffinity.podAntiAffinity) {
      nextAffinity.podAntiAffinity = generatedAffinity.podAntiAffinity;
    }
  }

  setOrDelete(
    podSpec,
    'affinity',
    Object.keys(nextAffinity).length > 0 ? nextAffinity : undefined,
  );
};

/**
 * 把表单值回写到对象上。initialValues 是打开时由对象解析出的表单值：
 * 用它与当前值各生成一份清单，两份相同的部分说明用户没动，原对象的对应内容原样保留。
 */
const buildUpdatedWorkloadSettingsManifest = (
  type: WorkloadKind,
  baseManifest: ManifestRecord,
  initialValues: CreateWorkloadFormValues,
  values: CreateWorkloadFormValues,
): ManifestRecord => {
  const nextManifest = cloneManifest(baseManifest);
  const initialManifest = buildCreateWorkloadManifest(type, initialValues);
  const generatedManifest = buildCreateWorkloadManifest(type, values);
  const spec = ensureRecordField(nextManifest, 'spec');
  const template = ensureRecordField(spec, 'template');
  const podSpec = ensureRecordField(template, 'spec');
  const basePodSpec = getManifestPodSpec(baseManifest);
  const initialSpec = getManifestSpec(initialManifest);
  const initialPodSpec = getManifestPodSpec(initialManifest);
  const generatedSpec = getManifestSpec(generatedManifest);
  const generatedPodSpec = getManifestPodSpec(generatedManifest);
  const initialContainers = getGeneratedContainers(
    initialValues,
    initialManifest,
  );
  const generatedContainers = getGeneratedContainers(values, generatedManifest);

  // 更新策略
  const strategyFields =
    type === 'Deployment'
      ? ['strategy']
      : type === 'DaemonSet'
        ? ['updateStrategy', 'minReadySeconds']
        : ['updateStrategy'];
  for (const field of strategyFields) {
    if (!same(initialSpec[field], generatedSpec[field])) {
      setOrDelete(spec, field, generatedSpec[field]);
    }
  }

  // 存储：卷、卷声明模板、挂载按「原对象 ↔ 打开时 ↔ 当前」逐项合并（见 mergeStorageObjects），
  // 没动的沿用原对象，表单不认识的卷原样保留
  const allowVolumeClaimTemplates = type === 'StatefulSet';
  const initialStorageNames = getStorageItemNames(
    initialValues,
    allowVolumeClaimTemplates,
  );
  const generatedStorageNames = getStorageItemNames(
    values,
    allowVolumeClaimTemplates,
  );
  const volumeLinks = linkStorageItems(
    initialValues,
    values,
    PARSED_STORAGE_ID,
    initialStorageNames,
    generatedStorageNames,
  );
  // 同步时区的卷没有存储项，按固定名称对应
  const hostTimeIndex = getRecordArray(podSpec.volumes).findIndex(
    (volume) => getStringValue(volume.name) === HOST_TIME_VOLUME_NAME,
  );
  if (hostTimeIndex >= 0) {
    volumeLinks.set(hostTimeIndex, {
      initialName: indexByName(initialPodSpec.volumes, volumeNameOf).has(
        HOST_TIME_VOLUME_NAME,
      )
        ? HOST_TIME_VOLUME_NAME
        : undefined,
      generatedName: indexByName(generatedPodSpec.volumes, volumeNameOf).has(
        HOST_TIME_VOLUME_NAME,
      )
        ? HOST_TIME_VOLUME_NAME
        : undefined,
      removed: false,
    });
  }
  const volumes = mergeStorageObjects(
    podSpec.volumes,
    initialPodSpec.volumes,
    generatedPodSpec.volumes,
    volumeLinks,
    volumeNameOf,
    renameVolume,
    mergeVolume,
  );

  // 容器
  const mergeContainers = (init: boolean) =>
    generatedContainers
      .filter((container) => container.init === init)
      .map((container) =>
        mergeContainerManifest(
          findBaseContainer(basePodSpec, container.id),
          initialContainers.find(
            (item) => item.id !== undefined && item.id === container.id,
          )?.manifest,
          container.manifest,
          volumes,
        ),
      );
  podSpec.containers = mergeContainers(false);
  setOrDelete(podSpec, 'initContainers', mergeContainers(true));
  setOrDelete(podSpec, 'volumes', volumes.list);

  if (type === 'StatefulSet') {
    setOrDelete(
      spec,
      'volumeClaimTemplates',
      mergeStorageObjects(
        spec.volumeClaimTemplates,
        initialSpec.volumeClaimTemplates,
        generatedSpec.volumeClaimTemplates,
        linkStorageItems(
          initialValues,
          values,
          PARSED_TEMPLATE_ID,
          initialStorageNames,
          generatedStorageNames,
        ),
        templateNameOf,
        renameTemplate,
        mergeVolumeClaimTemplate,
      ).list,
    );
  }

  // 优雅终止
  if (
    !same(
      initialPodSpec.terminationGracePeriodSeconds,
      generatedPodSpec.terminationGracePeriodSeconds,
    )
  ) {
    setOrDelete(
      podSpec,
      'terminationGracePeriodSeconds',
      generatedPodSpec.terminationGracePeriodSeconds,
    );
  }

  // 调度规则
  if (
    !same(
      [initialValues.podSchedulingRule, initialValues.podSchedulingCustomRules],
      [values.podSchedulingRule, values.podSchedulingCustomRules],
    )
  ) {
    applySchedulingSettings(
      podSpec,
      values,
      generatedPodSpec,
      getRecordValue(getManifestSpec(baseManifest).selector) || {
        matchLabels: {
          [DEFAULT_APP_LABEL_KEY]: getManifestMetadata(baseManifest).name,
        },
      },
    );
  }

  return nextManifest;
};

/** 「编辑设置」支持的类型：三类工作负载 + 定时任务（只编辑它的 Pod 模板） */
type WorkloadSettingsKind = WorkloadKind | 'CronJob';

/** 表单按哪种工作负载处理：定时任务的 Pod 模板按部署的模板编辑 */
const settingsFormKind = (kind: WorkloadSettingsKind): WorkloadKind =>
  kind === 'CronJob' ? 'Deployment' : kind;

/**
 * 表单读写的对象。定时任务的 Pod 模板在 spec.jobTemplate.spec.template：
 * 取出来放到工作负载的位置（spec.template），其余逻辑不用区分。
 */
const toSettingsView = (
  kind: WorkloadSettingsKind,
  manifest: ManifestRecord,
): ManifestRecord => {
  if (kind !== 'CronJob') {
    return manifest;
  }
  const jobSpec = getRecordValue(
    getRecordValue(getManifestSpec(manifest).jobTemplate)?.spec,
  );
  return {
    metadata: manifest.metadata,
    spec: { template: cloneManifest(getRecordValue(jobSpec?.template) || {}) },
  };
};

/** 把表单改好的结果写回原对象（定时任务只替换它的 Pod 模板，其余字段原样保留） */
const fromSettingsView = (
  kind: WorkloadSettingsKind,
  manifest: ManifestRecord,
  updated: ManifestRecord,
): ManifestRecord => {
  if (kind !== 'CronJob') {
    return updated;
  }
  const next = cloneManifest(manifest);
  const jobTemplate = ensureRecordField(
    ensureRecordField(next, 'spec'),
    'jobTemplate',
  );
  ensureRecordField(jobTemplate, 'spec').template =
    getManifestSpec(updated).template;
  return next;
};

export type { WorkloadSettingsKind };
export {
  buildUpdatedWorkloadSettingsManifest,
  fromSettingsView,
  getWorkloadSettingsFormValues,
  settingsFormKind,
  toSettingsView,
};
