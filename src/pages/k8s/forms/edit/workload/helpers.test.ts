import { describe, expect, it } from 'vitest';
import { formatMemoryQuantity, parseQuantity } from '../../workload/helpers';
import {
  buildUpdatedWorkloadSettingsManifest,
  getWorkloadSettingsFormValues,
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
