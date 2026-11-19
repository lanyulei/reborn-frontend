import type { CreateJobFormValues } from '../job/types';

type CronJobConcurrencyPolicy = 'Allow' | 'Forbid' | 'Replace';

type CreateCronJobFormValues = CreateJobFormValues & {
  concurrencyPolicy?: CronJobConcurrencyPolicy;
  failedJobsHistoryLimit?: number;
  schedule?: string;
  startingDeadlineSeconds?: number;
  successfulJobsHistoryLimit?: number;
  timeZone?: string;
};

export type { CreateCronJobFormValues, CronJobConcurrencyPolicy };
