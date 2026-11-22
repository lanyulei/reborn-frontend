import { t } from '@/utils/i18n';
import { getArrayValue, getRecordValue, getStringValue } from './helpers';
import type {
  ClusterNodePodContainer,
  ClusterNodePodContainerResizePolicy,
  ClusterNodePodContainerResources,
  ClusterNodePodItem,
  ClusterPodResizeStatus,
} from './types';

type PodResizeFormValues = {
  cpuLimit?: number;
  cpuRequest?: number;
  memoryLimit?: number;
  memoryRequest?: number;
};

type ResourceName = 'cpu' | 'memory';

const resizeConditionTypes = ['PodResizePending', 'PodResizeInProgress'];
const cpuUnitFactor: Record<string, number> = {
  n: 1 / 1000 / 1000 / 1000,
  u: 1 / 1000 / 1000,
  m: 1 / 1000,
};
const memoryUnitFactor: Record<string, number> = {
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  Pi: 1024 ** 5,
  Ei: 1024 ** 6,
  K: 1000,
  M: 1000 ** 2,
  G: 1000 ** 3,
  T: 1000 ** 4,
  P: 1000 ** 5,
  E: 1000 ** 6,
};

const hasQuantityValue = (value?: string) =>
  value !== undefined && value !== null && value !== '';

const getResourceValue = (
  resources: ClusterNodePodContainerResources | undefined,
  section: 'limits' | 'requests',
  resourceName: ResourceName,
) => resources?.[section]?.[resourceName];

const parseQuantity = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { amount: value, unit: '' } : undefined;
  }

  const text = getStringValue(value)?.trim();
  if (!text) {
    return undefined;
  }

  const matched = text.match(
    /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)([a-zA-Z]*)$/,
  );
  if (!matched) {
    return undefined;
  }

  const amount = Number(matched[1]);
  return Number.isFinite(amount)
    ? { amount, unit: matched[2] || '' }
    : undefined;
};

const parseCpuValue = (value: unknown) => {
  const quantity = parseQuantity(value);
  if (!quantity) {
    return undefined;
  }

  const factor = quantity.unit ? cpuUnitFactor[quantity.unit] : 1;
  return factor ? quantity.amount * factor : undefined;
};

const parseMemoryMiValue = (value: unknown) => {
  const quantity = parseQuantity(value);
  if (!quantity) {
    return undefined;
  }

  const factor = quantity.unit ? memoryUnitFactor[quantity.unit] : 1;
  if (!factor) {
    return undefined;
  }

  return (quantity.amount * factor) / 1024 ** 2;
};

const toResourceQuantity = (value?: number, unit?: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return unit ? `${value}${unit}` : `${value}`;
};

const toCpuQuantity = (value?: number) => toResourceQuantity(value);

const toMemoryQuantity = (value?: number) => toResourceQuantity(value, 'Mi');

const getResizePolicy = (
  container?: ClusterNodePodContainer,
  resourceName?: ResourceName,
) =>
  container?.resize_policy?.find((item) => item.resourceName === resourceName)
    ?.restartPolicy;

const buildContainerResourcesFromForm = (
  values: PodResizeFormValues,
): ClusterNodePodContainerResources => {
  const requests: Record<string, string> = {};
  const limits: Record<string, string> = {};
  const cpuRequest = toCpuQuantity(values.cpuRequest);
  const cpuLimit = toCpuQuantity(values.cpuLimit);
  const memoryRequest = toMemoryQuantity(values.memoryRequest);
  const memoryLimit = toMemoryQuantity(values.memoryLimit);

  if (cpuRequest) {
    requests.cpu = cpuRequest;
  }
  if (memoryRequest) {
    requests.memory = memoryRequest;
  }
  if (cpuLimit) {
    limits.cpu = cpuLimit;
  }
  if (memoryLimit) {
    limits.memory = memoryLimit;
  }

  return {
    ...(Object.keys(requests).length > 0 ? { requests } : {}),
    ...(Object.keys(limits).length > 0 ? { limits } : {}),
  };
};

const getResizeFormValues = (
  container?: ClusterNodePodContainer,
): PodResizeFormValues => ({
  cpuRequest: parseCpuValue(
    getResourceValue(container?.resources, 'requests', 'cpu'),
  ),
  cpuLimit: parseCpuValue(
    getResourceValue(container?.resources, 'limits', 'cpu'),
  ),
  memoryRequest: parseMemoryMiValue(
    getResourceValue(container?.resources, 'requests', 'memory'),
  ),
  memoryLimit: parseMemoryMiValue(
    getResourceValue(container?.resources, 'limits', 'memory'),
  ),
});

const buildPodResizePatch = (
  containerName: string,
  values: PodResizeFormValues,
) => ({
  spec: {
    containers: [
      {
        name: containerName,
        resources: buildContainerResourcesFromForm(values),
      },
    ],
  },
});

const normalizeCpu = (value?: string) => {
  const numberValue = parseCpuValue(value);
  return numberValue === undefined ? undefined : Number(numberValue.toFixed(3));
};

const normalizeMemory = (value?: string) => {
  const numberValue = parseMemoryMiValue(value);
  return numberValue === undefined ? undefined : Number(numberValue.toFixed(3));
};

const hasSameResourceValue = (
  first?: ClusterNodePodContainerResources,
  second?: ClusterNodePodContainerResources,
) => {
  const fields: {
    resourceName: ResourceName;
    section: 'limits' | 'requests';
    normalize: (value?: string) => number | undefined;
  }[] = [
    { resourceName: 'cpu', section: 'requests', normalize: normalizeCpu },
    { resourceName: 'cpu', section: 'limits', normalize: normalizeCpu },
    { resourceName: 'memory', section: 'requests', normalize: normalizeMemory },
    { resourceName: 'memory', section: 'limits', normalize: normalizeMemory },
  ];

  return fields.every(({ resourceName, section, normalize }) => {
    const firstValue = getResourceValue(first, section, resourceName);
    const secondValue = getResourceValue(second, section, resourceName);

    if (!hasQuantityValue(firstValue) && !hasQuantityValue(secondValue)) {
      return true;
    }

    return normalize(firstValue) === normalize(secondValue);
  });
};

const getResizeCondition = (pod?: ClusterNodePodItem, type?: string) =>
  pod?.resize_conditions?.find(
    (condition) => condition.type === type && condition.status === 'True',
  );

const getPodResizeStatus = (
  pod?: ClusterNodePodItem,
  container?: ClusterNodePodContainer,
): ClusterPodResizeStatus => {
  const pendingCondition = getResizeCondition(pod, 'PodResizePending');
  const inProgressCondition = getResizeCondition(pod, 'PodResizeInProgress');
  const observedGeneration =
    pendingCondition?.observed_generation ||
    inProgressCondition?.observed_generation ||
    pod?.observed_generation;

  if (pendingCondition?.reason === 'Infeasible') {
    return 'infeasible';
  }
  if (pendingCondition?.reason === 'Deferred') {
    return 'deferred';
  }
  if (pendingCondition) {
    return 'pending';
  }
  if (inProgressCondition?.reason === 'Error') {
    return 'error';
  }
  if (inProgressCondition) {
    return 'inProgress';
  }
  if (
    pod?.generation &&
    observedGeneration &&
    observedGeneration < pod.generation
  ) {
    return 'observing';
  }
  if (
    container &&
    !hasSameResourceValue(container.resources, container.status_resources)
  ) {
    return 'pending';
  }

  return 'synced';
};

const getPodResizeMessage = (pod?: ClusterNodePodItem) =>
  resizeConditionTypes
    .map((type) => getResizeCondition(pod, type))
    .find(Boolean)?.message;

const hasAnyResources = (resources?: ClusterNodePodContainerResources) =>
  Boolean(
    resources?.requests?.cpu ||
      resources?.requests?.memory ||
      resources?.limits?.cpu ||
      resources?.limits?.memory,
  );

const hasGuaranteedResources = (resources?: ClusterNodePodContainerResources) =>
  Boolean(
    resources?.requests?.cpu &&
      resources?.requests?.memory &&
      resources?.limits?.cpu &&
      resources?.limits?.memory &&
      normalizeCpu(resources.requests.cpu) ===
        normalizeCpu(resources.limits.cpu) &&
      normalizeMemory(resources.requests.memory) ===
        normalizeMemory(resources.limits.memory),
  );

const getPodQosClass = (containers: ClusterNodePodContainer[]) => {
  if (containers.every((container) => !hasAnyResources(container.resources))) {
    return 'BestEffort';
  }

  if (
    containers.every((container) => hasGuaranteedResources(container.resources))
  ) {
    return 'Guaranteed';
  }

  return 'Burstable';
};

const getNextPodQosClass = (
  pod: ClusterNodePodItem,
  containerName: string,
  resources: ClusterNodePodContainerResources,
) =>
  getPodQosClass(
    (pod.containers || []).map((container) =>
      container.name === containerName
        ? { ...container, resources }
        : container,
    ),
  );

const getPodOsName = (manifest?: Record<string, unknown>) => {
  const spec = getRecordValue(manifest?.spec);
  const os = getRecordValue(spec?.os);

  return getStringValue(os?.name);
};

const getPodResizeDisabledReason = (
  pod?: ClusterNodePodItem,
  container?: ClusterNodePodContainer,
) => {
  if (!pod || !container?.name) {
    return t('pages.k8s.detail.resize.noContainer');
  }
  if (pod.os_name === 'windows') {
    return t('pages.k8s.detail.resize.windows');
  }
  if (pod.status === 'Terminating') {
    return t('pages.k8s.detail.resize.terminating');
  }
  if (pod.phase === 'Succeeded' || pod.phase === 'Failed') {
    return t('pages.k8s.detail.resize.finished');
  }
  if (container.type && container.type !== 'container') {
    return t('pages.k8s.detail.resize.notMainContainer');
  }
  if (
    (pod.qos_class || getPodQosClass(pod.containers || [])) === 'BestEffort'
  ) {
    return t('pages.k8s.detail.resize.bestEffort');
  }

  return undefined;
};

const validatePodResizeValues = (
  pod: ClusterNodePodItem,
  container: ClusterNodePodContainer,
  values: PodResizeFormValues,
) => {
  if (
    values.cpuRequest !== undefined &&
    values.cpuLimit !== undefined &&
    values.cpuRequest > values.cpuLimit
  ) {
    return {
      name: 'cpuRequest' as const,
      message: t('pages.k8s.detail.resize.cpuExceeds'),
    };
  }
  if (
    values.memoryRequest !== undefined &&
    values.memoryLimit !== undefined &&
    values.memoryRequest > values.memoryLimit
  ) {
    return {
      name: 'memoryRequest' as const,
      message: t('pages.k8s.detail.resize.memoryExceeds'),
    };
  }

  const nextResources = buildContainerResourcesFromForm(values);
  const currentQosClass = pod.qos_class || getPodQosClass(pod.containers || []);
  const nextQosClass = getNextPodQosClass(
    pod,
    container.name || '',
    nextResources,
  );

  if (currentQosClass && nextQosClass !== currentQosClass) {
    return {
      name: 'cpuRequest' as const,
      message: t('pages.k8s.detail.resize.qosChange', {
        current: currentQosClass,
        next: nextQosClass,
      }),
    };
  }

  return undefined;
};

const getResizePolicyItems = (
  value?: unknown,
): ClusterNodePodContainerResizePolicy[] => {
  const resizePolicy = getArrayValue(value)
    .map((item) => getRecordValue(item))
    .filter(Boolean);

  return resizePolicy
    .map((item) => {
      const resourceName = getStringValue(item?.resourceName);
      const nextResourceName: ResourceName | undefined =
        resourceName === 'cpu' || resourceName === 'memory'
          ? resourceName
          : undefined;

      return {
        resourceName: nextResourceName,
        restartPolicy: getStringValue(item?.restartPolicy),
      };
    })
    .filter((item) => item.resourceName);
};

export type { PodResizeFormValues, ResourceName };
export {
  buildContainerResourcesFromForm,
  buildPodResizePatch,
  getPodOsName,
  getPodResizeDisabledReason,
  getPodResizeMessage,
  getPodResizeStatus,
  getResizeCondition,
  getResizeFormValues,
  getResizePolicy,
  getResizePolicyItems,
  hasSameResourceValue,
  parseCpuValue,
  parseMemoryMiValue,
  toCpuQuantity,
  toMemoryQuantity,
  validatePodResizeValues,
};
