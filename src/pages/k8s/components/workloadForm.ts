/**
 * 工作负载表单 ⇄ 对象的纯逻辑（不依赖 React，可单独测试）。
 *
 * 原则：表单只改它建模的字段，其余字段原样保留。applyForm 在解析出的对象上就地修改——
 * 表单没建模的内容（额外的容器字段、fieldRef 环境变量、其它类型的卷、grpc 探针、亲和性等）不会丢。
 * 容器、环境变量、卷按名称与原对象对应；表单里展示不了的条目以 raw 形式带着走，提交时原样写回。
 */
import { Document, isScalar, parse, Scalar, type Tags, visit } from 'yaml';

export type WorkloadKind =
  | 'Deployment'
  | 'StatefulSet'
  | 'DaemonSet'
  | 'CronJob';

export interface KV {
  key: string;
  value?: string;
}

export type EnvSource = 'value' | 'configMap' | 'secret' | 'raw';
export interface EnvForm {
  name: string;
  source: EnvSource;
  value?: string;
  /** ConfigMap / Secret 名 */
  ref?: string;
  /** ConfigMap / Secret 里的键 */
  refKey?: string;
  /** 表单未建模的取值方式（fieldRef 等）：原样保留 */
  raw?: unknown;
}

export interface PortForm {
  name?: string;
  containerPort?: number;
  protocol?: string;
}

export interface MountForm {
  /** 卷名 */
  name: string;
  mountPath: string;
  subPath?: string;
  readOnly?: boolean;
}

export type ProbeType = 'none' | 'httpGet' | 'tcpSocket' | 'exec' | 'raw';
export interface ProbeForm {
  type: ProbeType;
  path?: string;
  port?: number | string;
  /** exec：一行一个参数 */
  command?: string[];
  initialDelaySeconds?: number;
  periodSeconds?: number;
}

export interface ContainerForm {
  /** 原对象里的容器名：改名后据此找回原容器，保留其未建模的字段 */
  origin?: string;
  name: string;
  image: string;
  imagePullPolicy?: string;
  /** 一行一个参数 */
  command?: string[];
  args?: string[];
  cpuRequest?: string;
  memoryRequest?: string;
  cpuLimit?: string;
  memoryLimit?: string;
  ports: PortForm[];
  env: EnvForm[];
  mounts: MountForm[];
  liveness: ProbeForm;
  readiness: ProbeForm;
}

export type VolumeType = 'configMap' | 'secret' | 'pvc' | 'emptyDir' | 'raw';
export interface VolumeForm {
  name: string;
  type: VolumeType;
  /** ConfigMap / Secret / PVC 名 */
  source?: string;
  raw?: unknown;
}

export interface ServiceForm {
  enabled: boolean;
  type: string;
}

export interface WorkloadForm {
  name: string;
  labels: KV[];
  annotations: KV[];
  replicas?: number;
  /** Deployment：RollingUpdate / Recreate；StatefulSet / DaemonSet：RollingUpdate / OnDelete */
  strategy?: string;
  maxSurge?: string;
  maxUnavailable?: string;
  /** CronJob */
  schedule?: string;
  suspend?: boolean;
  concurrencyPolicy?: string;
  containers: ContainerForm[];
  volumes: VolumeForm[];
  service?: ServiceForm;
}

type Obj = Record<string, any>;

const API_VERSION: Record<WorkloadKind, string> = {
  Deployment: 'apps/v1',
  StatefulSet: 'apps/v1',
  DaemonSet: 'apps/v1',
  CronJob: 'batch/v1',
};

export const WORKLOAD_KINDS: WorkloadKind[] = [
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'CronJob',
];

/** 取（必要时创建）嵌套对象 */
const ensure = (obj: Obj, ...path: string[]): Obj => {
  let cur = obj;
  for (const key of path) {
    if (
      cur[key] === null ||
      typeof cur[key] !== 'object' ||
      Array.isArray(cur[key])
    ) {
      cur[key] = {};
    }
    cur = cur[key];
  }
  return cur;
};

const dig = (obj: Obj | undefined, ...path: string[]): unknown => {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Obj)[key];
  }
  return cur;
};

/** 设置或删除（值为空时）一个字段 */
const put = (obj: Obj, key: string, value: unknown) => {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    delete obj[key];
  } else {
    obj[key] = value;
  }
};

/** 清掉空对象字段 */
const prune = (obj: Obj, key: string) => {
  const v = obj[key];
  if (
    v &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Object.keys(v).length === 0
  ) {
    delete obj[key];
  }
};

const templatePath = (kind: WorkloadKind): string[] =>
  kind === 'CronJob'
    ? ['spec', 'jobTemplate', 'spec', 'template']
    : ['spec', 'template'];

/** 字符串数组（command / args / exec 探针命令）原样进表单：一项一个输入，保留空串与内嵌换行 */
const toList = (v: unknown): string[] | undefined =>
  Array.isArray(v) && v.length > 0 ? v.map(String) : undefined;

/**
 * 把表单里的字符串数组写回对象。与对象现值逐项相同则不动（不改写未编辑的字段）；
 * 不做拆分、去空白或丢弃空项——`sh -c "多行脚本"` 的参数必须原样保留。
 */
export const putList = (obj: Obj, key: string, value: unknown) => {
  const next = (Array.isArray(value) ? value : []).map((item) =>
    item === undefined || item === null ? '' : String(item),
  );
  const cur = obj[key];
  if (
    Array.isArray(cur) &&
    cur.length === next.length &&
    cur.every((item, i) => String(item) === next[i])
  ) {
    return;
  }
  if (next.length === 0) delete obj[key];
  else obj[key] = next;
};

const toKV = (m: unknown): KV[] =>
  m && typeof m === 'object'
    ? Object.entries(m as Record<string, unknown>).map(([key, value]) => ({
        key,
        value: value === null || value === undefined ? '' : String(value),
      }))
    : [];

const fromKV = (list: KV[] | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const item of list ?? []) {
    if (item?.key?.trim()) out[item.key.trim()] = item.value ?? '';
  }
  return out;
};

const quantity = (v: unknown): string | undefined =>
  v === undefined || v === null || v === '' ? undefined : String(v);

const probeToForm = (p: Obj | undefined): ProbeForm => {
  if (!p || typeof p !== 'object') return { type: 'none' };
  const base = {
    initialDelaySeconds: p.initialDelaySeconds,
    periodSeconds: p.periodSeconds,
  };
  if (p.httpGet) {
    return {
      type: 'httpGet',
      path: p.httpGet.path,
      port: p.httpGet.port,
      ...base,
    };
  }
  if (p.tcpSocket)
    return { type: 'tcpSocket', port: p.tcpSocket.port, ...base };
  if (p.exec) return { type: 'exec', command: toList(p.exec.command), ...base };
  return { type: 'raw', ...base };
};

/** 端口：纯数字按数字写回，否则按端口名 */
const portValue = (
  v: number | string | undefined,
): number | string | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).trim();
  return /^\d+$/.test(s) ? Number(s) : s;
};

const applyProbe = (container: Obj, key: string, f: ProbeForm | undefined) => {
  if (!f || f.type === 'none') {
    delete container[key];
    return;
  }
  if (f.type === 'raw') return; // 未建模的探针：不动
  const p: Obj =
    container[key] && typeof container[key] === 'object' ? container[key] : {};
  for (const handler of ['httpGet', 'tcpSocket', 'exec', 'grpc']) {
    if (handler !== f.type) delete p[handler];
  }
  if (f.type === 'httpGet') {
    const h = ensure(p, 'httpGet');
    put(h, 'path', f.path?.trim() || '/');
    put(h, 'port', portValue(f.port));
  } else if (f.type === 'tcpSocket') {
    put(ensure(p, 'tcpSocket'), 'port', portValue(f.port));
  } else {
    putList(ensure(p, 'exec'), 'command', f.command);
  }
  put(p, 'initialDelaySeconds', f.initialDelaySeconds);
  put(p, 'periodSeconds', f.periodSeconds);
  container[key] = p;
};

const envToForm = (e: Obj): EnvForm => {
  const name = String(e?.name ?? '');
  const from = e?.valueFrom;
  if (!from) return { name, source: 'value', value: e?.value ?? '' };
  if (from.configMapKeyRef && Object.keys(from).length === 1) {
    return {
      name,
      source: 'configMap',
      ref: from.configMapKeyRef.name,
      refKey: from.configMapKeyRef.key,
      raw: e,
    };
  }
  if (from.secretKeyRef && Object.keys(from).length === 1) {
    return {
      name,
      source: 'secret',
      ref: from.secretKeyRef.name,
      refKey: from.secretKeyRef.key,
      raw: e,
    };
  }
  return { name, source: 'raw', raw: e };
};

const envFromForm = (f: EnvForm): Obj => {
  const name = f.name.trim();
  if (f.source === 'raw') return { ...(f.raw as Obj), name };
  if (f.source === 'value') return { name, value: f.value ?? '' };
  const refKey = f.source === 'configMap' ? 'configMapKeyRef' : 'secretKeyRef';
  // 保留原条目上 optional 之类的附加字段（仅当取值方式没变）
  const prev = dig(f.raw as Obj, 'valueFrom', refKey);
  return {
    name,
    valueFrom: {
      [refKey]: {
        ...(prev && typeof prev === 'object' ? (prev as Obj) : {}),
        name: f.ref?.trim() ?? '',
        key: f.refKey?.trim() ?? '',
      },
    },
  };
};

const containerToForm = (c: Obj): ContainerForm => ({
  origin: c.name,
  name: String(c.name ?? ''),
  image: String(c.image ?? ''),
  imagePullPolicy: c.imagePullPolicy,
  command: toList(c.command),
  args: toList(c.args),
  cpuRequest: quantity(dig(c, 'resources', 'requests', 'cpu')),
  memoryRequest: quantity(dig(c, 'resources', 'requests', 'memory')),
  cpuLimit: quantity(dig(c, 'resources', 'limits', 'cpu')),
  memoryLimit: quantity(dig(c, 'resources', 'limits', 'memory')),
  ports: (Array.isArray(c.ports) ? c.ports : []).map((p: Obj) => ({
    name: p.name,
    containerPort: p.containerPort,
    protocol: p.protocol ?? 'TCP',
  })),
  env: (Array.isArray(c.env) ? c.env : []).map(envToForm),
  mounts: (Array.isArray(c.volumeMounts) ? c.volumeMounts : []).map(
    (m: Obj) => ({
      name: String(m.name ?? ''),
      mountPath: String(m.mountPath ?? ''),
      subPath: m.subPath,
      readOnly: m.readOnly === true,
    }),
  ),
  liveness: probeToForm(c.livenessProbe),
  readiness: probeToForm(c.readinessProbe),
});

const applyContainer = (c: Obj, f: ContainerForm) => {
  c.name = f.name.trim();
  c.image = f.image.trim();
  put(c, 'imagePullPolicy', f.imagePullPolicy);
  putList(c, 'command', f.command);
  putList(c, 'args', f.args);

  const resources = ensure(c, 'resources');
  const requests = ensure(resources, 'requests');
  put(requests, 'cpu', f.cpuRequest?.trim());
  put(requests, 'memory', f.memoryRequest?.trim());
  const limits = ensure(resources, 'limits');
  put(limits, 'cpu', f.cpuLimit?.trim());
  put(limits, 'memory', f.memoryLimit?.trim());
  prune(resources, 'requests');
  prune(resources, 'limits');
  prune(c, 'resources');

  // 端口：按容器端口 + 协议找回原条目，保留 hostPort 等未建模字段
  const oldPorts: Obj[] = Array.isArray(c.ports) ? c.ports : [];
  put(
    c,
    'ports',
    (f.ports ?? [])
      .filter((p) => p?.containerPort)
      .map((p) => {
        const protocol = p.protocol || 'TCP';
        const prev =
          oldPorts.find(
            (o) =>
              o.containerPort === p.containerPort &&
              (o.protocol ?? 'TCP') === protocol,
          ) ?? {};
        const out: Obj = { ...prev, containerPort: p.containerPort };
        put(out, 'name', p.name?.trim());
        if (protocol !== 'TCP' || prev.protocol) out.protocol = protocol;
        return out;
      }),
  );

  put(c, 'env', (f.env ?? []).filter((e) => e?.name?.trim()).map(envFromForm));

  const oldMounts: Obj[] = Array.isArray(c.volumeMounts) ? c.volumeMounts : [];
  put(
    c,
    'volumeMounts',
    (f.mounts ?? [])
      .filter((m) => m?.name?.trim() && m?.mountPath?.trim())
      .map((m) => {
        const prev =
          oldMounts.find(
            (o) => o.name === m.name && o.mountPath === m.mountPath,
          ) ?? {};
        const out: Obj = {
          ...prev,
          name: m.name.trim(),
          mountPath: m.mountPath.trim(),
        };
        put(out, 'subPath', m.subPath?.trim());
        put(out, 'readOnly', m.readOnly ? true : undefined);
        return out;
      }),
  );

  applyProbe(c, 'livenessProbe', f.liveness);
  applyProbe(c, 'readinessProbe', f.readiness);
};

const volumeToForm = (v: Obj): VolumeForm => {
  const name = String(v?.name ?? '');
  if (v.configMap) {
    return { name, type: 'configMap', source: v.configMap.name, raw: v };
  }
  if (v.secret) {
    return { name, type: 'secret', source: v.secret.secretName, raw: v };
  }
  if (v.persistentVolumeClaim) {
    return {
      name,
      type: 'pvc',
      source: v.persistentVolumeClaim.claimName,
      raw: v,
    };
  }
  if (v.emptyDir) return { name, type: 'emptyDir', raw: v };
  return { name, type: 'raw', raw: v };
};

const VOLUME_FIELD: Record<Exclude<VolumeType, 'raw'>, [string, string?]> = {
  configMap: ['configMap', 'name'],
  secret: ['secret', 'secretName'],
  pvc: ['persistentVolumeClaim', 'claimName'],
  emptyDir: ['emptyDir'],
};

const volumeFromForm = (f: VolumeForm): Obj => {
  const name = f.name.trim();
  if (f.type === 'raw') return { ...(f.raw as Obj), name };
  const [field, sourceKey] = VOLUME_FIELD[f.type];
  // 类型没变：保留原卷上的附加字段（items、defaultMode、sizeLimit 等）
  const prev = dig(f.raw as Obj, field);
  const body: Obj =
    prev && typeof prev === 'object' ? { ...(prev as Obj) } : {};
  if (sourceKey) body[sourceKey] = f.source?.trim() ?? '';
  return { name, [field]: body };
};

/** 对象 → 表单 */
export const toForm = (obj: Obj, kind: WorkloadKind): WorkloadForm => {
  const spec: Obj = obj.spec ?? {};
  const pod = (dig(obj, ...templatePath(kind), 'spec') as Obj) ?? {};
  const strategy =
    kind === 'Deployment' ? (spec.strategy ?? {}) : (spec.updateStrategy ?? {});
  const form: WorkloadForm = {
    name: String(obj.metadata?.name ?? ''),
    labels: toKV(obj.metadata?.labels),
    annotations: toKV(obj.metadata?.annotations),
    containers: (Array.isArray(pod.containers) ? pod.containers : []).map(
      containerToForm,
    ),
    volumes: (Array.isArray(pod.volumes) ? pod.volumes : []).map(volumeToForm),
  };
  if (kind === 'Deployment' || kind === 'StatefulSet') {
    form.replicas = typeof spec.replicas === 'number' ? spec.replicas : 1;
  }
  if (kind === 'CronJob') {
    form.schedule = spec.schedule;
    form.suspend = spec.suspend === true;
    form.concurrencyPolicy = spec.concurrencyPolicy ?? 'Allow';
  } else {
    form.strategy = strategy.type ?? 'RollingUpdate';
    form.maxSurge = quantity(strategy.rollingUpdate?.maxSurge);
    form.maxUnavailable = quantity(strategy.rollingUpdate?.maxUnavailable);
  }
  return form;
};

/** 百分比或整数：整数按数字写回 */
const intOrPercent = (v?: string): number | string | undefined => {
  const s = v?.trim();
  if (!s) return undefined;
  return /^\d+$/.test(s) ? Number(s) : s;
};

/** 表单 → 对象：在 obj 上就地修改并返回它；create 时补齐选择器与 Pod 标签 */
export const applyForm = (
  obj: Obj,
  kind: WorkloadKind,
  form: WorkloadForm,
  create = false,
): Obj => {
  obj.apiVersion = obj.apiVersion ?? API_VERSION[kind];
  obj.kind = kind;
  const meta = ensure(obj, 'metadata');
  if (create) meta.name = form.name.trim();
  put(meta, 'labels', fromKV(form.labels));
  prune(meta, 'labels');
  put(meta, 'annotations', fromKV(form.annotations));
  prune(meta, 'annotations');

  const spec = ensure(obj, 'spec');
  if (kind === 'Deployment' || kind === 'StatefulSet') {
    spec.replicas = form.replicas ?? 1;
  }
  if (kind === 'CronJob') {
    spec.schedule = form.schedule?.trim() ?? '';
    put(spec, 'suspend', form.suspend ? true : undefined);
    put(
      spec,
      'concurrencyPolicy',
      form.concurrencyPolicy && form.concurrencyPolicy !== 'Allow'
        ? form.concurrencyPolicy
        : undefined,
    );
  } else {
    const key = kind === 'Deployment' ? 'strategy' : 'updateStrategy';
    const strategy = ensure(spec, key);
    strategy.type = form.strategy || 'RollingUpdate';
    if (strategy.type === 'RollingUpdate') {
      const rolling = ensure(strategy, 'rollingUpdate');
      if (kind !== 'StatefulSet') {
        put(rolling, 'maxSurge', intOrPercent(form.maxSurge));
      }
      put(rolling, 'maxUnavailable', intOrPercent(form.maxUnavailable));
      prune(strategy, 'rollingUpdate');
    } else {
      delete strategy.rollingUpdate;
    }
  }

  const template = ensure(obj, ...templatePath(kind));
  const pod = ensure(template, 'spec');
  if (create) {
    const app = form.name.trim();
    if (kind !== 'CronJob') {
      const selector = ensure(spec, 'selector', 'matchLabels');
      if (Object.keys(selector).length === 0) selector.app = app;
      const podLabels = ensure(template, 'metadata', 'labels');
      Object.assign(podLabels, selector);
      if (kind === 'StatefulSet' && !spec.serviceName) spec.serviceName = app;
    } else if (!pod.restartPolicy) {
      pod.restartPolicy = 'OnFailure';
    }
  }

  const old: Obj[] = Array.isArray(pod.containers) ? pod.containers : [];
  const used = new Set<Obj>();
  pod.containers = (form.containers ?? []).map((f) => {
    const prev = old.find(
      (c) => !used.has(c) && (c.name === f.origin || c.name === f.name),
    );
    const c: Obj = prev ?? {};
    if (prev) used.add(prev);
    applyContainer(c, f);
    return c;
  });

  put(
    pod,
    'volumes',
    (form.volumes ?? []).filter((v) => v?.name?.trim()).map(volumeFromForm),
  );
  return obj;
};

/** 新建时的空对象 */
export const newWorkload = (kind: WorkloadKind, namespace?: string): Obj => {
  const obj: Obj = { apiVersion: API_VERSION[kind], kind, metadata: {} };
  if (namespace) obj.metadata.namespace = namespace;
  return obj;
};

export const emptyContainer = (name = 'app'): ContainerForm => ({
  name,
  image: '',
  ports: [],
  env: [],
  mounts: [],
  liveness: { type: 'none' },
  readiness: { type: 'none' },
});

export const emptyForm = (kind: WorkloadKind): WorkloadForm => ({
  ...toForm({}, kind),
  containers: [emptyContainer()],
  service: { enabled: false, type: 'ClusterIP' },
});

/** 「同时创建 Service」：端口取自各容器的端口；没有端口返回 undefined */
export const serviceFor = (
  workload: Obj,
  kind: WorkloadKind,
  type: string,
): Obj | undefined => {
  if (kind === 'CronJob') return undefined;
  const selector = dig(workload, 'spec', 'selector', 'matchLabels') as
    | Obj
    | undefined;
  const containers =
    (dig(workload, ...templatePath(kind), 'spec', 'containers') as Obj[]) ?? [];
  const ports: Obj[] = [];
  for (const c of containers) {
    for (const p of Array.isArray(c.ports) ? c.ports : []) {
      const protocol = p.protocol ?? 'TCP';
      if (
        !ports.some(
          (x) => x.port === p.containerPort && x.protocol === protocol,
        )
      ) {
        ports.push({
          name:
            p.name || `${String(protocol).toLowerCase()}-${p.containerPort}`,
          port: p.containerPort,
          targetPort: p.containerPort,
          protocol,
        });
      }
    }
  }
  if (!selector || ports.length === 0) return undefined;
  const meta: Obj = { name: workload.metadata?.name };
  if (workload.metadata?.namespace)
    meta.namespace = workload.metadata.namespace;
  const spec: Obj = { selector: { ...selector }, ports };
  if (kind === 'StatefulSet' && type === 'Headless') spec.clusterIP = 'None';
  else spec.type = type;
  return { apiVersion: 'v1', kind: 'Service', metadata: meta, spec };
};

/**
 * YAML 的读写口径与集群一致（YAML 1.1，同 kubectl / sigs.k8s.io/yaml）：
 * - 解析：未加引号的 yes / no / on / off 是布尔值、0 开头的数字是八进制——和集群看到的一样；
 * - 输出：这类看起来像布尔 / 数字的字符串一律加引号。否则标签值 "yes" 会被输出成裸的 yes，
 *   集群按布尔值解析后拒绝（标签值必须是字符串）。
 * 去掉 1.1 里 Go 的解析器不支持的六十进制（12:30 → 750）与时间戳类型：它们在集群眼里是字符串。
 */
const YAML_OPTIONS = {
  version: '1.1' as const,
  customTags: (tags: Tags): Tags =>
    tags.filter(
      (tag) =>
        typeof tag === 'string' ||
        (tag.format !== 'TIME' && tag.tag !== 'tag:yaml.org,2002:timestamp'),
    ),
};

/** 超出 JS 安全整数范围的整数保持 BigInt（原样写回，不丢精度），其余还原为 number */
const narrowInts = (v: unknown): unknown => {
  if (typeof v === 'bigint') {
    return v >= BigInt(Number.MIN_SAFE_INTEGER) &&
      v <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(v)
      : v;
  }
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) v[i] = narrowInts(v[i]);
  } else if (v && typeof v === 'object') {
    const o = v as Obj;
    for (const k of Object.keys(o)) o[k] = narrowInts(o[k]);
  }
  return v;
};

/** YAML 文本 → 对象；不是映射时抛错 */
export const parseObject = (text: string): Obj => {
  const obj = narrowInts(parse(text, { ...YAML_OPTIONS, intAsBigInt: true }));
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('YAML must be a single object');
  }
  return obj as Obj;
};

/**
 * 集群的解析器（Go yaml）会把这些形态的裸标量当成数字，而 YAML 1.1 的输出器认为它们是普通字符串：
 * 0o17（→ 15）、带下划线或正负号的数字、.5 / 5. 这类小数、.inf / .nan。字符串值一律加引号。
 */
const NUMERIC_LOOKING =
  /^[-+]?(0o[0-7_]+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9][0-9_]*(\.[0-9_]*)?([eE][-+]?[0-9]+)?|\.[0-9_]+([eE][-+]?[0-9]+)?|\.(inf|Inf|INF)|\.(nan|NaN|NAN))$/;

export const toYaml = (obj: unknown): string => {
  const doc = new Document(obj, {
    ...YAML_OPTIONS,
    aliasDuplicateObjects: false,
  });
  visit(doc, {
    Scalar(_key, node) {
      if (
        isScalar(node) &&
        typeof node.value === 'string' &&
        NUMERIC_LOOKING.test(node.value)
      ) {
        node.type = Scalar.QUOTE_DOUBLE;
      }
    },
  });
  return doc.toString({ lineWidth: 0 });
};

export const kindOfObject = (obj: Obj): WorkloadKind | undefined =>
  WORKLOAD_KINDS.find((k) => k === obj?.kind);

// ---------------------------------------------------------------------------
// 校验（与 K8s 的规则一致）
// ---------------------------------------------------------------------------

const QUALIFIED_NAME = /^[A-Za-z0-9]([-A-Za-z0-9_.]{0,61}[A-Za-z0-9])?$/;
const DNS_SUBDOMAIN =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const LABEL_VALUE = /^([A-Za-z0-9]([-A-Za-z0-9_.]{0,61}[A-Za-z0-9])?)?$/;

/** 标签 / 注解 / 污点的键：[前缀/]名称，前缀是 DNS 子域名（≤253），名称 ≤63 */
export const validLabelKey = (key: string): boolean => {
  const parts = key.split('/');
  if (parts.length > 2) return false;
  const name = parts[parts.length - 1];
  if (!QUALIFIED_NAME.test(name)) return false;
  if (parts.length === 2) {
    const prefix = parts[0];
    return (
      prefix.length > 0 && prefix.length <= 253 && DNS_SUBDOMAIN.test(prefix)
    );
  }
  return true;
};

/** 标签值：空，或 ≤63 的字母数字开头结尾 */
export const validLabelValue = (value: string): boolean =>
  LABEL_VALUE.test(value);

export const TAINT_EFFECTS = ['NoSchedule', 'PreferNoSchedule', 'NoExecute'];

export interface TaintForm {
  key: string;
  value?: string;
  effect: string;
}

/** 污点：键同标签键，值同标签值，效果三选一；返回错误说明的键，合法返回 undefined */
export const taintError = (
  t: TaintForm,
): 'key' | 'value' | 'effect' | undefined => {
  if (!validLabelKey(t.key ?? '')) return 'key';
  if (!validLabelValue(t.value ?? '')) return 'value';
  if (!TAINT_EFFECTS.includes(t.effect)) return 'effect';
  return undefined;
};

/** 重复的键（污点按 键 + 效果 判重） */
export const duplicates = (keys: string[]): string[] => {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const k of keys) {
    if (seen.has(k)) dup.add(k);
    seen.add(k);
  }
  return [...dup];
};

export const QUANTITY = /^[0-9]+(\.[0-9]+)?(m|k|Ki|M|Mi|G|Gi|T|Ti|P|Pi|E|Ei)?$/;
export const DNS_LABEL = /^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?$/;
export const ENV_NAME = /^[-._a-zA-Z][-._a-zA-Z0-9]*$/;
export const INT_OR_PERCENT = /^(\d+|\d{1,3}%)$/;

/** 节点：把标签与污点写回对象（就地），其余字段不动 */
export const applyNodeMeta = (
  obj: Obj,
  labels: KV[],
  taints: TaintForm[],
): Obj => {
  const meta = ensure(obj, 'metadata');
  put(meta, 'labels', fromKV(labels));
  prune(meta, 'labels');
  const spec = ensure(obj, 'spec');
  const old: Obj[] = Array.isArray(spec.taints) ? spec.taints : [];
  put(
    spec,
    'taints',
    taints.map((t) => {
      // 保留原污点的 timeAdded
      const prev =
        old.find((o) => o.key === t.key && o.effect === t.effect) ?? {};
      const out: Obj = { ...prev, key: t.key.trim(), effect: t.effect };
      put(out, 'value', t.value?.trim());
      return out;
    }),
  );
  return obj;
};

export interface QuotaForm {
  cpuRequests?: string;
  memoryRequests?: string;
  cpuLimits?: string;
  memoryLimits?: string;
  pods?: string;
  defaultCpuRequest?: string;
  defaultMemoryRequest?: string;
  defaultCpuLimit?: string;
  defaultMemoryLimit?: string;
}

const QUOTA_KEYS: [keyof QuotaForm, string][] = [
  ['cpuRequests', 'requests.cpu'],
  ['memoryRequests', 'requests.memory'],
  ['cpuLimits', 'limits.cpu'],
  ['memoryLimits', 'limits.memory'],
  ['pods', 'pods'],
];

/** ResourceQuota / LimitRange → 表单 */
export const quotaToForm = (quota?: Obj, limitRange?: Obj): QuotaForm => {
  const form: QuotaForm = {};
  const hard = (dig(quota, 'spec', 'hard') as Obj) ?? {};
  for (const [field, key] of QUOTA_KEYS) form[field] = quantity(hard[key]);
  const item =
    ((dig(limitRange, 'spec', 'limits') as Obj[]) ?? []).find(
      (l) => l?.type === 'Container',
    ) ?? {};
  form.defaultCpuRequest = quantity(item.defaultRequest?.cpu);
  form.defaultMemoryRequest = quantity(item.defaultRequest?.memory);
  form.defaultCpuLimit = quantity(item.default?.cpu);
  form.defaultMemoryLimit = quantity(item.default?.memory);
  return form;
};

/**
 * 表单 → ResourceQuota 与 LimitRange（就地改已有对象，保留表单没建模的配额项与限制项）。
 * 某个对象的建模字段全部清空且没有其它内容时返回 undefined（调用方据此删除它）。
 */
export const applyQuota = (
  namespace: string,
  form: QuotaForm,
  quota?: Obj,
  limitRange?: Obj,
): { quota?: Obj; limitRange?: Obj } => {
  const q: Obj = quota ?? {
    apiVersion: 'v1',
    kind: 'ResourceQuota',
    metadata: { name: 'default', namespace },
  };
  const hard = ensure(q, 'spec', 'hard');
  for (const [field, key] of QUOTA_KEYS) put(hard, key, form[field]?.trim());

  const lr: Obj = limitRange ?? {
    apiVersion: 'v1',
    kind: 'LimitRange',
    metadata: { name: 'default', namespace },
  };
  const lrSpec = ensure(lr, 'spec');
  const limits: Obj[] = Array.isArray(lrSpec.limits) ? lrSpec.limits : [];
  let item = limits.find((l) => l?.type === 'Container');
  if (!item) {
    item = { type: 'Container' };
    limits.push(item);
  }
  const req = ensure(item, 'defaultRequest');
  put(req, 'cpu', form.defaultCpuRequest?.trim());
  put(req, 'memory', form.defaultMemoryRequest?.trim());
  const def = ensure(item, 'default');
  put(def, 'cpu', form.defaultCpuLimit?.trim());
  put(def, 'memory', form.defaultMemoryLimit?.trim());
  prune(item, 'defaultRequest');
  prune(item, 'default');
  lrSpec.limits = limits.filter((l) => Object.keys(l).length > 1);

  return {
    quota: Object.keys(hard).length > 0 ? q : undefined,
    limitRange: lrSpec.limits.length > 0 ? lr : undefined,
  };
};
