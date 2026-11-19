/**
 * K8sResourceService / K8sWorkloadService：由 core 转发给数据面的资源接口。
 * 能否对具体资源操作成功由集群按当前用户的数据范围判定（403 K8S_FORBIDDEN）。
 */
import { clusterPath, type K8sRequestOptions, k8sRequest } from './request';
import type {
  APIResource,
  ApplyResult,
  DrainOptions,
  DrainPreview,
  K8sEvent,
  ListQuery,
  ListResult,
  ManifestResult,
  ObjectResult,
  PreviewResult,
  ResourceRef,
  Revision,
  SecretReveal,
} from './typings';

type Silent = Pick<K8sRequestOptions, 'silent'>;

const get = <T>(
  clusterId: string,
  path: string,
  params?: object,
  options?: Silent,
) =>
  k8sRequest<T>(clusterPath(clusterId, path), {
    method: 'GET',
    params,
    ...options,
  });

const post = <T>(
  clusterId: string,
  path: string,
  data: object,
  options?: Silent,
) =>
  k8sRequest<T>(clusterPath(clusterId, path), {
    method: 'POST',
    data,
    ...options,
  });

export const listAPIResources = (
  clusterId: string,
  refresh?: boolean,
  options?: Silent,
) =>
  get<{ items: APIResource[] | null }>(
    clusterId,
    '/api-resource',
    { refresh },
    options,
  );

export const listNamespaceOptions = (clusterId: string, options?: Silent) =>
  get<{ items: string[] | null; all: boolean }>(
    clusterId,
    '/namespace-option',
    undefined,
    options,
  );

export const listResources = (
  clusterId: string,
  query: ListQuery,
  options?: Silent,
) => get<ListResult>(clusterId, '/resource', query, options);

export const getObject = (
  clusterId: string,
  ref: ResourceRef,
  options?: Silent,
) => get<ObjectResult>(clusterId, '/object', ref, options);

export const listObjectEvents = (
  clusterId: string,
  ref: ResourceRef,
  options?: Silent,
) =>
  get<{ items: K8sEvent[] | null }>(clusterId, '/object/event', ref, options);

export interface ApplyBody {
  ref: ResourceRef;
  yaml: string;
  resourceVersion?: string;
}

export const previewObject = (
  clusterId: string,
  body: ApplyBody,
  options?: Silent,
) => post<PreviewResult>(clusterId, '/object:preview', body, options);

export const applyObject = (
  clusterId: string,
  body: ApplyBody,
  options?: Silent,
) => post<ApplyResult>(clusterId, '/object:apply', body, options);

export const deleteObject = (
  clusterId: string,
  body: { ref: ResourceRef; uid?: string; propagation?: string },
) => post<void>(clusterId, '/object:delete', body);

export interface ManifestBody {
  yaml: string;
  namespace?: string;
}

export const previewManifest = (
  clusterId: string,
  body: ManifestBody,
  options?: Silent,
) => post<ManifestResult>(clusterId, '/manifest:preview', body, options);

export const applyManifest = (
  clusterId: string,
  body: ManifestBody,
  options?: Silent,
) => post<ManifestResult>(clusterId, '/manifest:apply', body, options);

export const revealSecret = (
  clusterId: string,
  namespace: string,
  name: string,
) => post<SecretReveal>(clusterId, '/secret:reveal', { namespace, name });

// ---- 快捷操作 ----

export const scaleWorkload = (
  clusterId: string,
  ref: ResourceRef,
  replicas: number,
) => post<void>(clusterId, '/workload:scale', { ref, replicas });

export const restartWorkload = (clusterId: string, ref: ResourceRef) =>
  post<void>(clusterId, '/workload:restart', { ref });

export const setWorkloadImage = (
  clusterId: string,
  ref: ResourceRef,
  container: string,
  image: string,
) => post<void>(clusterId, '/workload:set-image', { ref, container, image });

export const listWorkloadRevisions = (clusterId: string, ref: ResourceRef) =>
  get<{ items: Revision[] | null }>(clusterId, '/workload/revision', ref);

export const rollbackWorkload = (
  clusterId: string,
  ref: ResourceRef,
  revision: number,
) => post<void>(clusterId, '/workload:rollback', { ref, revision });

export const pauseWorkload = (
  clusterId: string,
  ref: ResourceRef,
  paused: boolean,
) => post<void>(clusterId, '/workload:pause', { ref, paused });

export const triggerCronJob = (clusterId: string, ref: ResourceRef) =>
  post<ApplyResult>(clusterId, '/cronjob:trigger', { ref });

export const suspendCronJob = (
  clusterId: string,
  ref: ResourceRef,
  suspend: boolean,
) => post<void>(clusterId, '/cronjob:suspend', { ref, suspend });

export const evictPod = (clusterId: string, ref: ResourceRef) =>
  post<void>(clusterId, '/pod:evict', { ref });

export interface PodResizeContainer {
  name: string;
  /** 缺省的资源 = 不改动；不能传空串 */
  requests?: { cpu?: string; memory?: string };
  limits?: { cpu?: string; memory?: string };
}

/**
 * 原地调整运行中 Pod 的容器资源（集群的 resize 子资源，需要 Kubernetes 1.33+）。
 * 成功只表示集群已接受，由节点异步生效；需审批的集群上转为变更单。
 */
export const resizePod = (
  clusterId: string,
  ref: ResourceRef,
  containers: PodResizeContainer[],
) => post<void>(clusterId, '/pod:resize', { ref, containers }, { silent: true });

export const cordonNode = (
  clusterId: string,
  name: string,
  unschedulable: boolean,
) => post<void>(clusterId, '/node:cordon', { name, unschedulable });

export const previewDrainNode = (clusterId: string, body: DrainOptions) =>
  post<DrainPreview>(clusterId, '/node/drain:preview', body);

export interface ExecTicketBody {
  namespace: string;
  pod: string;
  container?: string;
  sessionId?: string;
  /** 2 = 调试容器 */
  kind?: number;
  cols?: number;
  rows?: number;
}

/** OpenExecTicket 签发一次性的终端票据（30 秒有效） */
export const openExecTicket = (clusterId: string, body: ExecTicketBody) =>
  post<{ ticket: string }>(clusterId, '/exec-ticket', body, { silent: true });
