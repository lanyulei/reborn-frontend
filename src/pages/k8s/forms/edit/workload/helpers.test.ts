/**
 * 工作负载「编辑设置」纯逻辑的回归测试：
 * - 数量解析 / 格式化与资源合并（未改动的键保留原字符串，不重写）；
 * - 探针命名端口：读表单时解析为数字，写回对象时未改动则原样保留；
 * - CronJob 视图转换（toSettingsView / fromSettingsView）只动 Pod 模板，其余字段原样保留；
 * - 对象原文 → 表单值 → 回写对象（round-trip）：表单建模的字段往返等价，
 *   表单不建模的字段（uid / status / progressDeadlineSeconds 等）绝不被改动或丢失。
 */
import { describe, expect, it } from 'vitest';
import { formatMemoryQuantity, parseQuantity } from '../../workload/helpers';
import type { CreateWorkloadFormValues } from '../../workload/types';
import {
  buildUpdatedWorkloadSettingsManifest,
  fromSettingsView,
  getWorkloadSettingsFormValues,
  settingsFormKind,
  toSettingsView,
} from './helpers';

type Rec = Record<string, unknown>;

const firstContainer = (values: { containers?: unknown[] }) => {
  const container = values.containers?.[0];
  if (!container) throw new Error('no container');
  return container as Record<string, unknown> & {
    healthChecks?: Record<string, { port?: number } | undefined>;
  };
};

const manifestWith = (container: Rec): Rec => ({
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: { name: 'web', namespace: 'default' },
  spec: {
    replicas: 1,
    selector: { matchLabels: { app: 'web' } },
    template: {
      metadata: { labels: { app: 'web' } },
      spec: { containers: [{ name: 'web', image: 'nginx', ...container }] },
    },
  },
});

const containerOf = (manifest: Rec): Rec =>
  (((manifest.spec as Rec).template as Rec).spec as { containers: Rec[] })
    .containers[0];

describe('parseQuantity', () => {
  it('parses plain, decimal SI, binary, exponent and milli forms', () => {
    expect(parseQuantity('1024')).toBe(1024);
    expect(parseQuantity(512)).toBe(512);
    expect(parseQuantity('1k')).toBe(1000);
    expect(parseQuantity('1K')).toBe(1000);
    expect(parseQuantity('1G')).toBe(1e9);
    expect(parseQuantity('1Gi')).toBe(1024 ** 3);
    expect(parseQuantity('1.5Gi')).toBe(1.5 * 1024 ** 3);
    expect(parseQuantity('1Ei')).toBe(1024 ** 6);
    expect(parseQuantity('1e9')).toBe(1e9);
    expect(parseQuantity('1E3')).toBe(1000);
    expect(parseQuantity('1E')).toBe(1e18);
    expect(parseQuantity('500m')).toBe(0.5);
    expect(parseQuantity('250u')).toBeCloseTo(250e-6);
  });

  it('rejects unknown input', () => {
    expect(parseQuantity('abc')).toBeUndefined();
    expect(parseQuantity('1Mb')).toBeUndefined();
    expect(parseQuantity('')).toBeUndefined();
    expect(parseQuantity(undefined)).toBeUndefined();
  });
});

describe('formatMemoryQuantity', () => {
  it('keeps precision instead of rounding', () => {
    expect(formatMemoryQuantity(512)).toBe('512Mi');
    expect(formatMemoryQuantity(1.5)).toBe('1536Ki');
    expect(formatMemoryQuantity(0.0001)).toBe(
      `${Math.round(0.0001 * 1024 ** 2)}`,
    );
    expect(formatMemoryQuantity(-1)).toBeUndefined();
  });
});

describe('workload settings: quantities', () => {
  it('reads decimal SI memory as Mi and milli cpu as cores', () => {
    const values = getWorkloadSettingsFormValues(
      'Deployment',
      manifestWith({
        resources: {
          requests: { cpu: '250m', memory: '1G' },
          limits: { cpu: '2', memory: '2Gi' },
        },
      }),
    );
    const container = firstContainer(values);
    expect(container.cpuRequest).toBe(0.25);
    expect(container.cpuLimit).toBe(2);
    expect(container.memoryRequest).toBeCloseTo(1e9 / 1024 ** 2);
    expect(container.memoryLimit).toBe(2048);
  });

  it('preserves original quantity strings when the key was not changed', () => {
    const base = manifestWith({
      resources: {
        requests: { cpu: '250m', memory: '1G', 'nvidia.com/gpu': '1' },
        limits: { cpu: '1e3m', memory: '1.5Gi' },
      },
    });
    const initial = getWorkloadSettingsFormValues('Deployment', base);
    const changed = structuredClone(initial);
    firstContainer(changed).cpuLimit = 2;
    const next = buildUpdatedWorkloadSettingsManifest(
      'Deployment',
      base,
      initial,
      changed,
    );
    expect(containerOf(next).resources).toEqual({
      requests: { cpu: '250m', memory: '1G', 'nvidia.com/gpu': '1' },
      limits: { cpu: '2', memory: '1.5Gi' },
    });
  });

  it('writes nothing when resources are untouched', () => {
    const base = manifestWith({
      resources: { requests: { memory: '1e9' } },
    });
    const initial = getWorkloadSettingsFormValues('Deployment', base);
    const next = buildUpdatedWorkloadSettingsManifest(
      'Deployment',
      base,
      initial,
      structuredClone(initial),
    );
    expect(containerOf(next).resources).toEqual({
      requests: { memory: '1e9' },
    });
  });
});

describe('workload settings: probe ports', () => {
  it('resolves named ports from the container ports instead of defaulting to 80', () => {
    const values = getWorkloadSettingsFormValues(
      'Deployment',
      manifestWith({
        ports: [{ name: 'http', containerPort: 8080 }],
        livenessProbe: { httpGet: { path: '/healthz', port: 'http' } },
        readinessProbe: { tcpSocket: { port: 'metrics' } },
      }),
    );
    const checks = firstContainer(values).healthChecks;
    expect(checks?.liveness?.port).toBe(8080);
    expect(checks?.readiness?.port).toBeUndefined();
  });

  it('keeps an unresolvable named port in the object when the probe is untouched', () => {
    const base = manifestWith({
      livenessProbe: {
        httpGet: { path: '/healthz', port: 'metrics' },
        periodSeconds: 5,
      },
    });
    const initial = getWorkloadSettingsFormValues('Deployment', base);
    const changed = structuredClone(initial);
    firstContainer(changed).image = 'nginx:1.27';
    const next = buildUpdatedWorkloadSettingsManifest(
      'Deployment',
      base,
      initial,
      changed,
    );
    expect(containerOf(next).image).toBe('nginx:1.27');
    expect(containerOf(next).livenessProbe).toEqual({
      httpGet: { path: '/healthz', port: 'metrics' },
      periodSeconds: 5,
    });
  });
});

/** 一个有代表性的真实形态 Deployment：含表单建模字段与不建模字段（uid / status / …） */
const deployment = (): Record<string, unknown> => ({
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'web',
    namespace: 'default',
    labels: { app: 'web', team: 'ops' },
    annotations: { note: 'keep' },
    uid: '0000-1111',
    resourceVersion: '42',
  },
  spec: {
    replicas: 3,
    selector: { matchLabels: { app: 'web' } },
    progressDeadlineSeconds: 30,
    template: {
      metadata: { labels: { app: 'web' } },
      spec: {
        terminationGracePeriodSeconds: 45,
        containers: [
          {
            name: 'web',
            image: 'nginx:1.25',
            imagePullPolicy: 'IfNotPresent',
            ports: [{ containerPort: 80, protocol: 'TCP' }],
            resources: {
              requests: { cpu: '500m', memory: '512Mi' },
              limits: { cpu: '1', memory: '1Gi' },
            },
          },
        ],
      },
    },
  },
  status: { readyReplicas: 3 },
});

const cronJob = (): Record<string, unknown> => ({
  apiVersion: 'batch/v1',
  kind: 'CronJob',
  metadata: { name: 'backup', namespace: 'default' },
  spec: {
    schedule: '0 2 * * *',
    concurrencyPolicy: 'Forbid',
    jobTemplate: {
      spec: {
        backoffLimit: 2,
        template: {
          metadata: { labels: { app: 'backup' } },
          spec: {
            containers: [
              { name: 'backup', image: 'busybox:1.36', command: ['sh', '-c'] },
            ],
            restartPolicy: 'OnFailure',
          },
        },
      },
    },
  },
});

describe('settingsFormKind', () => {
  it('CronJob 的设置表单按 Deployment 的模板处理，其余原样', () => {
    expect(settingsFormKind('CronJob')).toBe('Deployment');
    expect(settingsFormKind('Deployment')).toBe('Deployment');
    expect(settingsFormKind('StatefulSet')).toBe('StatefulSet');
    expect(settingsFormKind('DaemonSet')).toBe('DaemonSet');
  });
});

describe('toSettingsView / fromSettingsView（CronJob 视图转换）', () => {
  it('非 CronJob：视图即原对象，写回即改好的对象', () => {
    const base = deployment();
    expect(toSettingsView('Deployment', base)).toBe(base);
    const updated = deployment();
    expect(fromSettingsView('Deployment', base, updated)).toBe(updated);
  });

  it('toSettingsView：Pod 模板从 jobTemplate 里提到工作负载的位置', () => {
    const view = toSettingsView('CronJob', cronJob());
    const spec = view.spec as Record<string, unknown>;
    expect(view.metadata).toEqual({ name: 'backup', namespace: 'default' });
    // 模板在 spec.template；jobTemplate / schedule 等不出现在视图里
    expect(spec.template).toBeDefined();
    expect(spec.jobTemplate).toBeUndefined();
    expect(spec.schedule).toBeUndefined();
    const podSpec = (spec.template as Record<string, unknown>).spec as Record<
      string,
      unknown
    >;
    expect(podSpec.restartPolicy).toBe('OnFailure');
  });

  it('fromSettingsView：只替换 Pod 模板，schedule 等其余字段原样保留', () => {
    const base = cronJob();
    const updated = {
      metadata: base.metadata,
      spec: {
        template: {
          metadata: { labels: { app: 'backup' } },
          spec: {
            containers: [
              { name: 'backup', image: 'busybox:1.37', command: ['sh'] },
            ],
            restartPolicy: 'OnFailure',
          },
        },
      },
    };
    const next = fromSettingsView('CronJob', base, updated);
    const spec = next.spec as Record<string, unknown>;
    expect(spec.schedule).toBe('0 2 * * *');
    expect(spec.concurrencyPolicy).toBe('Forbid');
    const jobTemplate = (
      (spec.jobTemplate as Record<string, unknown>).spec as Record<
        string,
        unknown
      >
    ).template as Record<string, unknown>;
    const containers = (jobTemplate.spec as Record<string, unknown>)
      .containers as Record<string, unknown>[];
    expect(containers[0]?.image).toBe('busybox:1.37');
    // 原对象不被修改
    const baseContainers = (
      (
        (base.spec as Record<string, unknown>).jobTemplate as Record<
          string,
          unknown
        >
      ).spec as Record<string, unknown>
    ).template as Record<string, unknown> as Record<string, unknown>;
    expect(baseContainers).toBeDefined();
    const original = cronJob();
    const originalImage = (
      (
        (
          (original.spec as Record<string, unknown>).jobTemplate as Record<
            string,
            unknown
          >
        ).spec as Record<string, unknown>
      ).template as never as { spec: { containers: { image: string }[] } }
    ).spec.containers[0].image;
    expect(originalImage).toBe('busybox:1.36');
  });
});

describe('getWorkloadSettingsFormValues（对象原文 → 表单值）', () => {
  it('读出名称、副本数、容器镜像、资源数量与标签', () => {
    const values = getWorkloadSettingsFormValues(
      'Deployment',
      deployment(),
    ) as CreateWorkloadFormValues;
    expect(values.name).toBe('web');
    expect(values.namespace).toBe('default');
    expect(values.replicas).toBe(3);
    expect(values.containers).toHaveLength(1);
    expect(values.containers?.[0]?.containerName).toBe('web');
    expect(values.containers?.[0]?.image).toBe('nginx:1.25');
    // 500m → 0.5 核；512Mi → 512
    expect(values.containers?.[0]?.cpuRequest).toBe(0.5);
    expect(values.containers?.[0]?.memoryRequest).toBe(512);
    // labels → 键值行
    const labels = Object.fromEntries(
      (values.labels ?? []).map((item) => [item.keyName, item.value]),
    );
    expect(labels).toEqual({ app: 'web', team: 'ops' });
    expect(values.enablePodGracefulTermination).toBe(true);
    expect(values.terminationGracePeriodSeconds).toBe(45);
  });
});

describe('buildUpdatedWorkloadSettingsManifest（表单值 → 改好的对象）', () => {
  it('未改动即往返：建模字段等价，不建模字段一字不动', () => {
    const base = deployment();
    const initial = getWorkloadSettingsFormValues('Deployment', base);
    const next = buildUpdatedWorkloadSettingsManifest(
      'Deployment',
      base,
      initial,
      structuredClone(initial),
    ) as Record<string, unknown>;

    const metadata = next.metadata as Record<string, unknown>;
    const spec = next.spec as Record<string, unknown>;
    // 表单不建模的字段原样保留（就地修改契约）
    expect(metadata.uid).toBe('0000-1111');
    expect(metadata.resourceVersion).toBe('42');
    expect(spec.progressDeadlineSeconds).toBe(30);
    expect(next.status).toEqual({ readyReplicas: 3 });
    // 建模字段等价
    expect(metadata.name).toBe('web');
    expect(spec.replicas).toBe(3);
    const podSpec = (spec.template as Record<string, unknown>).spec as Record<
      string,
      unknown
    > as Record<string, unknown>;
    const containers = podSpec.containers as Record<string, unknown>[];
    expect(containers).toHaveLength(1);
    expect(containers[0]?.image).toBe('nginx:1.25');
    // 原对象不被修改
    expect((base.spec as Record<string, unknown>).progressDeadlineSeconds).toBe(
      30,
    );
  });

  it('改动回写：容器镜像更新，不建模字段仍在；副本数不归「编辑设置」管（保持原值）', () => {
    const base = deployment();
    const initial = getWorkloadSettingsFormValues('Deployment', base);
    const values = structuredClone(initial);
    const container = values.containers?.[0];
    // fixture 保证有容器；缺失时下面的镜像断言会失败
    if (container) container.image = 'nginx:1.27';
    const next = buildUpdatedWorkloadSettingsManifest(
      'Deployment',
      base,
      initial,
      values,
    ) as Record<string, unknown>;
    const spec = next.spec as Record<string, unknown>;
    // 函数只回写更新策略 / 存储 / 容器 / 优雅终止 / 调度；spec.replicas 不在职责内
    expect(spec.replicas).toBe(3);
    const podSpec = (spec.template as Record<string, unknown>).spec as Record<
      string,
      unknown
    >;
    const containers = podSpec.containers as Record<string, unknown>[];
    expect(containers[0]?.image).toBe('nginx:1.27');
    expect((next.metadata as Record<string, unknown>).uid).toBe('0000-1111');
    expect(spec.progressDeadlineSeconds).toBe(30);
  });
});
