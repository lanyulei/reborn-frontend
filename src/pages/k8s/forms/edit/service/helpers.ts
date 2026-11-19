/**
 * Service 编辑表单的对象变换（纯函数，不依赖 React / antd）：
 * 表单值 ↔ 对象原文。写回时只动表单建模且用户改过的字段，其余原样保留。
 */
import {
  buildServiceExternalAccessSpecPatch,
  buildServiceFormValuesFromManifest,
  buildServiceSettingsSpecPatch,
} from '../../service/helpers';
import type {
  CreateServiceFormValues,
  ServicePortItem,
} from '../../service/types';
import type { PlainObject } from './mergePatch';
import {
  applyMergePatch,
  deepClone,
  deepEqual,
  diffKeyValueRows,
  diffPatch,
  isRecord,
  patchAnnotations,
} from './mergePatch';

type PortBuilder = (port: ServicePortItem) => PlainObject | undefined;

/** 对象原文 → 表单值。「负载均衡器提供商」是来源项目的专有概念：不带入、不写回 */
export const buildServiceEditValues = (
  object: PlainObject,
): CreateServiceFormValues => ({
  ...buildServiceFormValuesFromManifest(object),
  loadBalancerProvider: undefined,
});

const getSpec = (object: PlainObject): PlainObject =>
  isRecord(object.spec) ? object.spec : {};

const getRawPorts = (object: PlainObject): unknown[] => {
  const ports = getSpec(object).ports;
  return Array.isArray(ports) ? ports : [];
};

const firstPort = (ports: unknown): PlainObject | undefined =>
  Array.isArray(ports) && isRecord(ports[0]) ? ports[0] : undefined;

const withoutPorts = (spec: PlainObject): PlainObject => {
  const rest = { ...spec };
  delete rest.ports;
  return rest;
};

/**
 * 按表单里的顺序重建 spec.ports。来自原文的端口以原对象为底，只叠加用户改动的字段
 * （保留 nodePort、命名 targetPort、未知 appProtocol 以及表单不认识的字段）；新增的端口整体生成。
 */
const mergePorts = (
  object: PlainObject,
  initial: CreateServiceFormValues,
  current: CreateServiceFormValues,
  buildBase: PortBuilder,
  buildNext: PortBuilder,
): unknown[] => {
  // 表单端口与原文端口按顺序一一对应（与 buildServiceFormValuesFromManifest 的过滤一致）
  const origins = new Map<
    string,
    { item: ServicePortItem; port: PlainObject }
  >();
  getRawPorts(object)
    .filter(isRecord)
    .forEach((port, index) => {
      const item = initial.ports?.[index];
      if (item) {
        origins.set(item.id, { item, port });
      }
    });

  return (current.ports || []).filter(Boolean).flatMap((item) => {
    const origin = origins.get(item.id);
    const next = buildNext(item);
    if (!origin) {
      return next ? [next] : [];
    }
    const port = deepClone(origin.port);
    if (next) {
      applyMergePatch(port, diffPatch(buildBase(origin.item) || {}, next));
    }
    return [port];
  });
};

const writeSpec = (
  result: PlainObject,
  object: PlainObject,
  spec: PlainObject,
  ports: unknown[],
) => {
  if (!deepEqual(ports, getRawPorts(object))) {
    spec.ports = ports;
  }
  if (isRecord(object.spec) || Object.keys(spec).length > 0) {
    result.spec = spec;
  }
};

/** 「编辑服务设置」：选择器、端口、会话保持、网络策略 */
export const applyServiceSettings = (
  object: PlainObject,
  initial: CreateServiceFormValues,
  current: CreateServiceFormValues,
): PlainObject => {
  const result = deepClone(object);
  const spec = getSpec(result);
  const buildPort =
    (values: CreateServiceFormValues): PortBuilder =>
    (port) =>
      firstPort(
        buildServiceSettingsSpecPatch({ ...values, ports: [port] }).ports,
      );

  applyMergePatch(
    spec,
    diffPatch(
      withoutPorts(buildServiceSettingsSpecPatch(initial)),
      withoutPorts(buildServiceSettingsSpecPatch(current)),
    ),
  );
  writeSpec(
    result,
    object,
    spec,
    mergePorts(
      object,
      initial,
      current,
      buildPort(initial),
      buildPort(current),
    ),
  );

  return result;
};

/** 「编辑外部访问」：类型、LoadBalancer 相关字段、外部流量策略与注解 */
export const applyServiceExternalAccess = (
  object: PlainObject,
  initial: CreateServiceFormValues,
  current: CreateServiceFormValues,
): PlainObject => {
  const result = deepClone(object);
  const spec = getSpec(result);
  const buildSpec = (values: CreateServiceFormValues): PlainObject =>
    buildServiceExternalAccessSpecPatch(
      { ...values, loadBalancerProvider: undefined },
      object,
    ).spec;
  const buildPort =
    (values: CreateServiceFormValues): PortBuilder =>
    (port) =>
      firstPort(buildSpec({ ...values, ports: [port] }).ports);

  applyMergePatch(
    spec,
    diffPatch(
      withoutPorts(buildSpec(initial)),
      withoutPorts(buildSpec(current)),
    ),
  );
  // 来源地址段只对 LoadBalancer 有效：改成其它类型时不去掉会被集群拒绝
  if (getSpec(object).type === 'LoadBalancer' && spec.type !== 'LoadBalancer') {
    delete spec.loadBalancerSourceRanges;
  }
  writeSpec(
    result,
    object,
    spec,
    mergePorts(
      object,
      initial,
      current,
      buildPort(initial),
      buildPort(current),
    ),
  );

  // 注解只在 LoadBalancer 模式下可编辑
  if (current.externalAccessMode === 'LoadBalancer') {
    patchAnnotations(
      result,
      diffKeyValueRows(
        initial.externalAccessAnnotations,
        current.externalAccessAnnotations,
      ),
    );
  }

  return result;
};
