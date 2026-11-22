/** 命名空间详情的纯逻辑：资源数量、配额汇总（取自 ResourceQuota / LimitRange 对象）。 */
import type { K8sObject } from '@/services/k8s/typings';
import { t } from '@/utils/i18n';

export type NamespaceResourceStatus = {
  pods?: number;
  deployments?: number;
  statefulsets?: number;
  daemonsets?: number;
  jobs?: number;
  cronjobs?: number;
  persistentVolumeClaims?: number;
  services?: number;
  ingresses?: number;
};

type QuotaValue = { used?: string; hard?: string };

export type NamespaceQuotaSummary = {
  defaultContainer: {
    cpuRequest?: string;
    cpuLimit?: string;
    memoryRequest?: string;
    memoryLimit?: string;
  };
  project: {
    cpuLimit: QuotaValue;
    memoryLimit: QuotaValue;
    pods: QuotaValue;
    deployments: QuotaValue;
    persistentVolumeClaims: QuotaValue;
  };
};

export const EMPTY_QUOTA_SUMMARY: NamespaceQuotaSummary = {
  defaultContainer: {},
  project: {
    cpuLimit: {},
    memoryLimit: {},
    pods: {},
    deployments: {},
    persistentVolumeClaims: {},
  },
};

type AnyRecord = Record<string, unknown>;

const asRecord = (value: unknown): AnyRecord =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : {};

const text = (value: unknown): string | undefined =>
  value === undefined || value === null || value === ''
    ? undefined
    : String(value);

/** 配额项在 ResourceQuota 里的键（同一含义可能有多种写法，取先出现的） */
const QUOTA_KEYS: Record<keyof NamespaceQuotaSummary['project'], string[]> = {
  cpuLimit: ['limits.cpu'],
  memoryLimit: ['limits.memory'],
  pods: ['pods', 'count/pods'],
  deployments: ['count/deployments.apps'],
  persistentVolumeClaims: [
    'persistentvolumeclaims',
    'count/persistentvolumeclaims',
  ],
};

/** 多个 ResourceQuota 里对同一项的限制，取第一个给出限制的 */
export const buildQuotaSummary = (
  quotas: K8sObject[],
  limitRanges: K8sObject[],
): NamespaceQuotaSummary => {
  const project = { ...EMPTY_QUOTA_SUMMARY.project };
  for (const field of Object.keys(QUOTA_KEYS) as (keyof typeof QUOTA_KEYS)[]) {
    for (const quota of quotas) {
      const hard = asRecord(asRecord(quota.status).hard);
      const specHard = asRecord(asRecord(quota.spec).hard);
      const used = asRecord(asRecord(quota.status).used);
      const key = QUOTA_KEYS[field].find(
        (item) => item in hard || item in specHard,
      );
      if (key) {
        project[field] = {
          hard: text(hard[key] ?? specHard[key]),
          used: text(used[key]),
        };
        break;
      }
    }
  }

  const container = limitRanges
    .flatMap((item) => {
      const limits = asRecord(item.spec).limits;
      return Array.isArray(limits) ? limits.map(asRecord) : [];
    })
    .find((item) => item.type === 'Container');
  const defaults = asRecord(container?.default);
  const requests = asRecord(container?.defaultRequest);

  return {
    defaultContainer: {
      cpuRequest: text(requests.cpu),
      memoryRequest: text(requests.memory),
      cpuLimit: text(defaults.cpu),
      memoryLimit: text(defaults.memory),
    },
    project,
  };
};

export const getNamespaceStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return t('pages.k8s.detail.status.active');
  }
  if (normalizedStatus === 'terminating') {
    return t('pages.k8s.detail.deleting');
  }
  return status || '-';
};

export const getNamespaceStatusType = (
  status?: string,
): 'default' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return 'success';
  }
  if (normalizedStatus === 'terminating') {
    return 'warning';
  }
  return 'default';
};

export const formatQuotaValue = (value?: string) =>
  value || t('pages.k8s.detail.noLimit');

export const parseCpuQuantity = (value?: string) => {
  if (!value) {
    return undefined;
  }
  if (value.endsWith('m')) {
    return Number(value.replace('m', '')) / 1000;
  }
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

const MEMORY_UNITS: Record<string, number> = {
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  k: 1000,
  K: 1000,
  M: 1000 ** 2,
  G: 1000 ** 3,
  T: 1000 ** 4,
};

export const parseMemoryQuantity = (value?: string) => {
  const matched = value?.match(/^([\d.]+)(Ki|Mi|Gi|Ti|k|K|M|G|T)?$/);
  if (!matched) {
    return undefined;
  }
  const amount = Number(matched[1]);
  return Number.isFinite(amount)
    ? amount * (matched[2] ? MEMORY_UNITS[matched[2]] : 1)
    : undefined;
};

const parseCountQuantity = (value?: string) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

export const getQuotaUsagePercent = (
  used?: string,
  hard?: string,
  parser: (value?: string) => number | undefined = parseCountQuantity,
) => {
  const usedValue = parser(used);
  const hardValue = parser(hard);

  if (!usedValue || !hardValue || hardValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((usedValue / hardValue) * 100));
};
