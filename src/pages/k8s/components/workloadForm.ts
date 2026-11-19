/**
 * 容器平台表单共用的纯逻辑（不依赖 React，可单独测试）：YAML 读写、标签 / 污点 / 资源量校验，
 * 以及节点标签污点、命名空间配额的「表单 → 对象」写回。
 *
 * 原则：表单只改它建模的字段，其余字段原样保留（在解析出的对象上就地修改）。
 */
import { Document, isScalar, parse, Scalar, type Tags, visit } from 'yaml';

export interface KV {
  key: string;
  value?: string;
}

type Obj = Record<string, any>;

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

const fromKV = (list: KV[] | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const item of list ?? []) {
    if (item?.key?.trim()) out[item.key.trim()] = item.value ?? '';
  }
  return out;
};

const quantity = (v: unknown): string | undefined =>
  v === undefined || v === null || v === '' ? undefined : String(v);

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
