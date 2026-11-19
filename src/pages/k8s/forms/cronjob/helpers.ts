/** 定时任务创建向导：表单值 → 清单的纯逻辑（不依赖 React / antd）。jobTemplate 复用任务向导的 spec 构建。 */
import {
  buildJobSpec,
  getInitialCreateJobValues,
  NAME_PATTERN,
  numberAtLeast,
  WORKLOAD_FORM_TYPE,
} from '../job/helpers';
import type { Manifest } from '../workload/helpers';
import { buildResourceMetadata, prune } from '../workload/helpers';
import type { CreateCronJobFormValues } from './types';

const CRON_JOB_API_VERSION = 'batch/v1';
const CRON_JOB_KIND = 'CronJob';

/** 常用定时计划（快捷选项，仍可输入任意 cron 表达式） */
const cronScheduleOptions = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每 5 分钟', value: '*/5 * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天', value: '0 0 * * *' },
  { label: '每周', value: '0 0 * * 0' },
];

const CRON_MACROS = new Set([
  '@yearly',
  '@annually',
  '@monthly',
  '@weekly',
  '@daily',
  '@midnight',
  '@hourly',
]);
const CRON_FIELD_PATTERN = /^[0-9A-Za-z*/,?-]+$/;

/** 规范化 cron 表达式：去掉首尾空白并把连续空白合并成一个空格 */
const normalizeSchedule = (value?: string) =>
  (value || '').trim().split(/\s+/).filter(Boolean).join(' ');

/**
 * 表达式的形式检查：5 段标准 cron，或 @hourly 这类宏、@every <时长>。
 * 只挡明显写错的输入，具体取值是否合法由服务端预检判定。
 */
const isCronSchedule = (value?: string) => {
  const schedule = normalizeSchedule(value);
  if (!schedule) {
    return false;
  }
  if (schedule.startsWith('@')) {
    return CRON_MACROS.has(schedule) || /^@every \S+$/.test(schedule);
  }

  const fields = schedule.split(' ');

  return (
    fields.length === 5 &&
    fields.every((field) => CRON_FIELD_PATTERN.test(field))
  );
};

const getInitialCreateCronJobValues = (
  namespace?: string,
): CreateCronJobFormValues => ({
  ...getInitialCreateJobValues(namespace),
  concurrencyPolicy: 'Allow',
  failedJobsHistoryLimit: undefined,
  schedule: undefined,
  startingDeadlineSeconds: undefined,
  successfulJobsHistoryLimit: undefined,
  timeZone: undefined,
});

const buildCreateCronJobManifest = (
  values: CreateCronJobFormValues,
): Manifest =>
  prune({
    apiVersion: CRON_JOB_API_VERSION,
    kind: CRON_JOB_KIND,
    metadata: buildResourceMetadata(values),
    spec: {
      schedule: normalizeSchedule(values.schedule),
      timeZone: values.timeZone?.trim() || undefined,
      // Allow 是集群默认值，不写进清单
      concurrencyPolicy:
        values.concurrencyPolicy && values.concurrencyPolicy !== 'Allow'
          ? values.concurrencyPolicy
          : undefined,
      startingDeadlineSeconds: numberAtLeast(values.startingDeadlineSeconds, 0),
      successfulJobsHistoryLimit: numberAtLeast(
        values.successfulJobsHistoryLimit,
        0,
      ),
      failedJobsHistoryLimit: numberAtLeast(values.failedJobsHistoryLimit, 0),
      jobTemplate: {
        spec: buildJobSpec(values),
      },
    },
  });

export {
  buildCreateCronJobManifest,
  CRON_JOB_API_VERSION,
  CRON_JOB_KIND,
  cronScheduleOptions,
  getInitialCreateCronJobValues,
  isCronSchedule,
  NAME_PATTERN,
  normalizeSchedule,
  WORKLOAD_FORM_TYPE,
};
