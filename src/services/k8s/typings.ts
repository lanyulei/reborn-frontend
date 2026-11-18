/**
 * 容器平台域类型。两类来源：
 * 1. core 的 proto 接口（集群 / 数据范围 / 审计）：protojson，零值字段可能缺失，int64 为字符串；
 * 2. 由 core 转发给数据面的资源接口：响应是 backend/kit/k8scontract/api.go 中结构体的 JSON。
 */

/** 接入方式：1 Agent 反向隧道 / 2 直连 */
export type AccessMode = 1 | 2;
/** Agent 部署位置：0 不适用 / 1 集群内 / 2 转发节点 */
export type AgentLocation = 0 | 1 | 2;
/** 集群状态：0 未知 / 1 在线 / 2 不可达 */
export type ClusterStatus = 0 | 1 | 2;
/** 数据范围档位：1 只读 / 2 开发 / 3 命名空间管理员 / 4 集群管理员 */
export type ScopeLevel = 1 | 2 | 3 | 4;

export interface ClusterSpec {
  name: string;
  displayName?: string;
  env?: string;
  accessMode: AccessMode;
  agentLocation?: AgentLocation;
  apiServer?: string;
  proxyUrl?: string;
  caCert?: string;
  execDisabled?: boolean;
  description?: string;
  enabled?: boolean;
  /** 关联的监控数据源（指标面板用）；空 = 未配置 */
  datasourceId?: string;
  /** 上报到通知的 Warning 事件原因；空 = 缺省清单 */
  eventReasons?: string[];
  /** 变更审批所用的工单模板；空 = 变更不需审批 */
  approvalTemplateId?: string;
}

/** 直连凭据（只写） */
export interface ClusterCredential {
  token?: string;
  clientCert?: string;
  clientKey?: string;
}

export interface ClusterRuntime {
  status?: ClusterStatus;
  statusSince?: string;
  k8sVersion?: string;
  nodeTotal?: number;
  nodeReady?: number;
  agentVersion?: string;
  agentLastSeen?: string;
  lastError?: string;
  probeTime?: string;
  scopeError?: string;
  scopeSynced?: boolean;
}

export interface Cluster {
  id: string;
  spec: ClusterSpec;
  hasCredential?: boolean;
  runtime?: ClusterRuntime;
  agentTokens?: number;
  version: number;
  createTime?: string;
  updateTime?: string;
}

export interface ClusterOption {
  id: string;
  name: string;
  displayName?: string;
  env?: string;
  status?: ClusterStatus;
  lastError?: string;
  execDisabled?: boolean;
  k8sVersion?: string;
  level?: ScopeLevel;
  /** 该集群的变更需审批（提交后生成工单） */
  approvalRequired?: boolean;
}

export interface ParsedKubeconfig {
  contexts?: string[];
  context?: string;
  apiServer?: string;
  caCert?: string;
  credential?: ClusterCredential;
  proxyUrl?: string;
}

export interface SelfCheckItem {
  name: string;
  ok?: boolean;
  message?: string;
}

export interface TestClusterResult {
  ok?: boolean;
  version?: string;
  durationMs?: string;
  error?: string;
  checks?: SelfCheckItem[];
}

export interface AgentInstall {
  location?: AgentLocation;
  manifest?: string;
  command?: string;
  expireTime?: string;
}

export interface RoleScopeItem {
  clusterId: string;
  clusterName?: string;
  namespace: string;
  level: ScopeLevel;
}

export interface K8sAudit {
  id: string;
  createTime?: string;
  userId?: string;
  username?: string;
  clientIp?: string;
  clusterId?: string;
  clusterName?: string;
  namespace?: string;
  apiGroup?: string;
  apiVersion?: string;
  resource?: string;
  kind?: string;
  name?: string;
  action?: string;
  /** 1 成功 / 2 失败 */
  result?: number;
  error?: string;
  emergency?: boolean;
  changeId?: string;
  truncated?: boolean;
  beforeYaml?: string;
  afterYaml?: string;
  patch?: string;
}

export interface ExecSession {
  id: string;
  userId?: string;
  username?: string;
  clientIp?: string;
  clusterId?: string;
  clusterName?: string;
  namespace?: string;
  pod?: string;
  container?: string;
  kind?: number;
  startTime?: string;
  endTime?: string;
  endReason?: string;
  bytesIn?: string;
  bytesOut?: string;
  recorded?: boolean;
}

// ---------------------------------------------------------------------------
// 数据面响应（k8scontract）
// ---------------------------------------------------------------------------

/** 资源类型标识 */
export interface GVR {
  group: string;
  version: string;
  resource: string;
}

/** 定位一个资源对象 */
export interface ResourceRef extends GVR {
  namespace?: string;
  name?: string;
}

export interface APIResource extends GVR {
  kind: string;
  namespaced: boolean;
  verbs: string[] | null;
  shortNames?: string[];
  cached: boolean;
  crd: boolean;
}

export type RowState = 'ok' | 'pending' | 'abnormal' | 'unknown' | 'done';
export type ColumnType =
  | 'text'
  | 'number'
  | 'state'
  | 'time'
  | 'images'
  | 'labels'
  | 'list';

export interface ListColumn {
  key: string;
  title: string;
  type: ColumnType;
  sortable?: boolean;
  /** 0 默认展示；>0 次要列 */
  priority?: number;
}

export interface StateCell {
  state: RowState;
  text: string;
  reason?: string;
}

export interface ListRow {
  namespace?: string;
  name: string;
  uid: string;
  createTime: string;
  state?: RowState | '';
  cells: Record<string, unknown> | null;
}

export interface ListCapabilities {
  cached: boolean;
  keyword: boolean;
  sort: boolean;
  total: boolean;
  watch: boolean;
  filters?: string[];
}

export interface ListResult {
  columns: ListColumn[] | null;
  rows: ListRow[] | null;
  /** 未缓存的资源为 -1 */
  total: number;
  continue?: string;
  capabilities: ListCapabilities;
  partialNamespaces?: string[];
}

export interface ListQuery extends GVR {
  namespace?: string;
  keyword?: string;
  labelSelector?: string;
  state?: string;
  node?: string;
  owner?: string;
  sortBy?: string;
  sortDesc?: boolean;
  page?: number;
  pageSize?: number;
  continue?: string;
}

/** K8s 对象（去掉 managedFields） */
export interface K8sObject {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    uid?: string;
    creationTimestamp?: string;
    deletionTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
      uid?: string;
    }[];
    [key: string]: unknown;
  };
  // biome-ignore lint/suspicious/noExplicitAny: 任意资源类型的 spec / status 结构不定
  spec?: any;
  // biome-ignore lint/suspicious/noExplicitAny: 同上
  status?: any;
  [key: string]: unknown;
}

export interface ObjectResult {
  kind: string;
  uid: string;
  resourceVersion: string;
  object: K8sObject;
  yaml: string;
}

export interface K8sEvent {
  type: string;
  reason: string;
  message: string;
  count: number;
  firstTime: string;
  lastTime: string;
  source?: string;
  object?: string;
}

export interface PreviewResult {
  create: boolean;
  beforeYaml: string;
  afterYaml: string;
  resourceVersion: string;
  changed: boolean;
}

export interface ApplyResult {
  ref: ResourceRef;
  kind: string;
  uid: string;
  resourceVersion: string;
}

export interface ManifestItem {
  ref: ResourceRef;
  kind: string;
  create: boolean;
  error?: string;
  beforeYaml?: string;
  afterYaml?: string;
  skipped?: boolean;
}

export interface ManifestResult {
  ok: boolean;
  items: ManifestItem[] | null;
}

export interface Revision {
  revision: number;
  createTime: string;
  images: string[] | null;
  current: boolean;
  changeCause?: string;
  templateYaml: string;
}

export interface DrainOptions {
  name: string;
  deleteEmptyDir?: boolean;
  force?: boolean;
  gracePeriodSeconds?: number;
}

export interface DrainPod {
  namespace: string;
  name: string;
  action: 'evict' | 'skip' | 'block';
  reason?: string;
}

export interface DrainPreview {
  pods: DrainPod[] | null;
  blocked: boolean;
}

export interface DrainProgress {
  namespace: string;
  name: string;
  status: 'evicted' | 'pending' | 'failed';
  message?: string;
  done: number;
  total: number;
}

export interface SecretReveal {
  data: Record<string, string> | null;
  binary?: string[];
}

export interface StreamEnd {
  reason: 'max_duration' | 'completed' | 'error';
  message?: string;
}

export interface LogLine {
  pod?: string;
  container?: string;
  time: string;
  text: string;
  truncated?: boolean;
}

export interface LogPods {
  pods: string[] | null;
  omitted: number;
}

export interface ExecStatus {
  state: 'ready' | 'resumed' | 'closed';
  sessionId?: string;
  reason?: string;
  message?: string;
}
