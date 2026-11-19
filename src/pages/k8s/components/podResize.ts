/**
 * Pod 原地调整资源的纯逻辑：从 Pod 对象取出可调整的容器与当前值，把表单与当前值比较成请求体。
 * 只提交发生变化的字段；不支持移除已有的请求 / 上限（集群的 resize 子资源不允许）。
 */
import type { PodResizeContainer } from '@/services/k8s/resource';
import type { K8sObject } from '@/services/k8s/typings';

export interface ResizeValues {
  cpuRequest?: string;
  cpuLimit?: string;
  memoryRequest?: string;
  memoryLimit?: string;
}

export interface ResizeContainer {
  name: string;
  /** 以 Sidecar 方式运行的初始化容器（restartPolicy: Always） */
  sidecar: boolean;
  current: ResizeValues;
}

export const RESIZE_FIELDS = [
  ['cpuRequest', 'requests', 'cpu'],
  ['cpuLimit', 'limits', 'cpu'],
  ['memoryRequest', 'requests', 'memory'],
  ['memoryLimit', 'limits', 'memory'],
] as const;

const text = (value: unknown): string | undefined =>
  value === undefined || value === null || value === ''
    ? undefined
    : String(value);

// 容器对象的结构取自集群（任意），逐字段判空读取
const toContainer = (c: any, sidecar: boolean): ResizeContainer => ({
  name: String(c?.name ?? ''),
  sidecar,
  current: {
    cpuRequest: text(c?.resources?.requests?.cpu),
    cpuLimit: text(c?.resources?.limits?.cpu),
    memoryRequest: text(c?.resources?.requests?.memory),
    memoryLimit: text(c?.resources?.limits?.memory),
  },
});

/** 可原地调整的容器：业务容器，以及 restartPolicy 为 Always 的初始化容器（Sidecar） */
export const resizableContainers = (pod: K8sObject): ResizeContainer[] => {
  const spec = pod.spec ?? {};
  const main: unknown[] = Array.isArray(spec.containers) ? spec.containers : [];
  const init: unknown[] = Array.isArray(spec.initContainers)
    ? spec.initContainers
    : [];
  return [
    ...main.map((c) => toContainer(c, false)),
    ...init
      .filter(
        (c) => (c as { restartPolicy?: string })?.restartPolicy === 'Always',
      )
      .map((c) => toContainer(c, true)),
  ].filter((c) => c.name);
};

/** 表单里被清空的已有值（不允许移除）：返回「容器 / 字段」；没有返回空数组 */
export const removedFields = (
  containers: ResizeContainer[],
  values: Record<string, ResizeValues | undefined>,
): { container: string; field: keyof ResizeValues }[] => {
  const out: { container: string; field: keyof ResizeValues }[] = [];
  for (const c of containers) {
    for (const [field] of RESIZE_FIELDS) {
      if (c.current[field] && !values[c.name]?.[field]?.trim()) {
        out.push({ container: c.name, field });
      }
    }
  }
  return out;
};

/** 表单 → 请求体：只含发生变化的容器与字段；没有变化返回空数组 */
export const buildResize = (
  containers: ResizeContainer[],
  values: Record<string, ResizeValues | undefined>,
): PodResizeContainer[] => {
  const out: PodResizeContainer[] = [];
  for (const c of containers) {
    const item: PodResizeContainer = { name: c.name };
    let changed = false;
    for (const [field, group, resource] of RESIZE_FIELDS) {
      const next = values[c.name]?.[field]?.trim();
      if (!next || next === c.current[field]) continue;
      item[group] = { ...item[group], [resource]: next };
      changed = true;
    }
    if (changed) out.push(item);
  }
  return out;
};
