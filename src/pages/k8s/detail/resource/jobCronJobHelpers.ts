import {
  formatValue,
  getArrayValue,
  getNumberValue,
  getRecordValue,
  getStringValue,
} from './helpers';

export const getJobStatus = (
  manifest?: Record<string, unknown>,
): string | undefined => {
  if (!manifest) {
    return undefined;
  }

  const metadata = getRecordValue(manifest.metadata);
  const status = getRecordValue(manifest.status);
  const conditions = getArrayValue(status?.conditions)
    .map((item) => getRecordValue(item))
    .filter(Boolean);

  if (metadata?.deletionTimestamp) {
    return 'terminating';
  }

  const completedCondition = conditions.find(
    (condition) =>
      getStringValue(condition?.type) === 'Complete' &&
      getStringValue(condition?.status) === 'True',
  );
  if (completedCondition || getNumberValue(status?.succeeded)) {
    return 'completed';
  }

  const failedCondition = conditions.find(
    (condition) =>
      getStringValue(condition?.type) === 'Failed' &&
      getStringValue(condition?.status) === 'True',
  );
  if (failedCondition || getNumberValue(status?.failed)) {
    return 'failed';
  }

  if (getNumberValue(status?.active)) {
    return 'running';
  }

  return undefined;
};

export const getCronJobStatus = (manifest?: Record<string, unknown>) => {
  if (!manifest) {
    return undefined;
  }

  const metadata = getRecordValue(manifest.metadata);
  const spec = getRecordValue(manifest.spec);
  const status = getRecordValue(manifest.status);

  if (metadata?.deletionTimestamp) {
    return 'terminating';
  }
  if (spec?.suspend === true) {
    return 'suspended';
  }
  if (getArrayValue(status?.active).length > 0) {
    return 'running';
  }
  return 'active';
};

export const getConcurrencyPolicyLabel = (policy?: unknown) => {
  if (policy === 'Allow') {
    return '允许并发运行';
  }
  if (policy === 'Forbid') {
    return '跳过新任务';
  }
  if (policy === 'Replace') {
    return '替换旧任务';
  }
  return formatValue(policy);
};

export const buildJobBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);

  return {
    namespace: metadata?.namespace || fallbackNamespace || '-',
    status: getJobStatus(manifest),
    backoff_limit: spec?.backoffLimit,
    completions: spec?.completions,
    parallelism: spec?.parallelism,
    active_deadline_seconds: spec?.activeDeadlineSeconds,
  };
};

export const buildCronJobBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getRecordValue(manifest?.metadata);
  const spec = getRecordValue(manifest?.spec);

  return {
    namespace: metadata?.namespace || fallbackNamespace || '-',
    status: getCronJobStatus(manifest),
    schedule: spec?.schedule,
    starting_deadline_seconds: spec?.startingDeadlineSeconds,
    successful_jobs_history_limit: spec?.successfulJobsHistoryLimit,
    failed_jobs_history_limit: spec?.failedJobsHistoryLimit,
    concurrency_policy: spec?.concurrencyPolicy,
    create_time: metadata?.creationTimestamp,
  };
};

export const buildServiceAccountBasicInfo = (
  manifest?: Record<string, unknown>,
  fallbackNamespace?: string,
) => {
  const metadata = getRecordValue(manifest?.metadata);

  return {
    namespace: getStringValue(metadata?.namespace) || fallbackNamespace || '-',
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

export const buildJobReplicaSummary = (manifest?: Record<string, unknown>) => {
  const spec = getRecordValue(manifest?.spec);
  const status = getRecordValue(manifest?.status);
  const conditions = getArrayValue(status?.conditions)
    .map((item) => getRecordValue(item))
    .filter(Boolean);
  const completions = getNumberValue(spec?.completions);
  const parallelism = getNumberValue(spec?.parallelism);
  const activePods = getNumberValue(status?.active) ?? 0;
  const succeededPods = getNumberValue(status?.succeeded) ?? 0;
  const isSuspended = spec?.suspend === true;
  const isTerminal = conditions.some((condition) => {
    const type = getStringValue(condition?.type);
    const conditionStatus = getStringValue(condition?.status);

    return (
      conditionStatus === 'True' && (type === 'Complete' || type === 'Failed')
    );
  });
  const desiredActivePods =
    isSuspended || isTerminal
      ? 0
      : completions === undefined
        ? succeededPods > 0
          ? activePods
          : (parallelism ?? 1)
        : Math.max(0, Math.min(completions - succeededPods, parallelism ?? 1));

  return {
    desiredReplicas: desiredActivePods,
    currentReplicas: activePods,
    scalable: Boolean(manifest && !isSuspended && !isTerminal),
  };
};

export const getJobPodSelectors = (name?: string) =>
  name ? [`batch.kubernetes.io/job-name=${name}`, `job-name=${name}`] : [];

export type JobBasicInfo = ReturnType<typeof buildJobBasicInfo>;
export type CronJobBasicInfo = ReturnType<typeof buildCronJobBasicInfo>;
export type ServiceAccountBasicInfo = ReturnType<
  typeof buildServiceAccountBasicInfo
>;
