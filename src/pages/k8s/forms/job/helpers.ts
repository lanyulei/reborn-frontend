/** 任务创建向导：表单值 → 清单的纯逻辑（不依赖 React / antd）。Pod 模板复用工作负载向导的构建函数。 */
import type { Manifest } from '../workload/helpers';
import {
  buildPodTemplate,
  buildResourceMetadata,
  getInitialCreateWorkloadValues,
  isFiniteNumber,
  NAME_PATTERN,
  prune,
} from '../workload/helpers';
import type { WorkloadKind } from '../workload/types';
import type { CreateJobFormValues } from './types';

const JOB_API_VERSION = 'batch/v1';
const JOB_KIND = 'Job';
/**
 * 复用的工作负载表单组件按控制器类型决定展示哪些选项；任务按 Deployment 的展示方式
 * （有节点选择、没有卷声明模板）。只影响界面，清单里不会出现任何 Deployment 字段。
 */
const WORKLOAD_FORM_TYPE: WorkloadKind = 'Deployment';

const getInitialCreateJobValues = (
  namespace?: string,
): CreateJobFormValues => ({
  ...getInitialCreateWorkloadValues(WORKLOAD_FORM_TYPE, namespace),
  activeDeadlineSeconds: undefined,
  backoffLimit: undefined,
  completions: undefined,
  parallelism: undefined,
  restartPolicy: 'Never',
});

const numberAtLeast = (value: number | undefined, min: number) =>
  isFiniteNumber(value) && value >= min ? value : undefined;

/**
 * Job 的 spec（CronJob 的 jobTemplate.spec 也用它）：只有任务策略和 Pod 模板，
 * 不含 selector / replicas / strategy；重启策略只能是 Never 或 OnFailure。
 */
const buildJobSpec = (values: CreateJobFormValues): Manifest => {
  const { template } = buildPodTemplate(values, {
    name: (values.name || '').trim(),
    restartPolicy: values.restartPolicy === 'OnFailure' ? 'OnFailure' : 'Never',
  });

  return prune({
    backoffLimit: numberAtLeast(values.backoffLimit, 0),
    completions: numberAtLeast(values.completions, 1),
    parallelism: numberAtLeast(values.parallelism, 1),
    activeDeadlineSeconds: numberAtLeast(values.activeDeadlineSeconds, 1),
    template,
  });
};

const buildCreateJobManifest = (values: CreateJobFormValues): Manifest => ({
  apiVersion: JOB_API_VERSION,
  kind: JOB_KIND,
  metadata: buildResourceMetadata(values),
  spec: buildJobSpec(values),
});

export {
  buildCreateJobManifest,
  buildJobSpec,
  getInitialCreateJobValues,
  JOB_API_VERSION,
  JOB_KIND,
  NAME_PATTERN,
  numberAtLeast,
  WORKLOAD_FORM_TYPE,
};
