/**
 * Ingress 编辑表单的对象变换（纯函数，不依赖 React / antd）：
 * 表单值 ↔ 对象原文。写回时只动表单建模且用户改过的字段，其余原样保留
 * （defaultBackend、没有路径的规则、resource 后端、多条 TLS、已有注解……）。
 */

import type { Translate } from '@/utils/i18n';
import {
  buildIngressFormValuesFromManifest,
  buildIngressMetadata,
  buildIngressRouteSpec,
  createKeyValueItem,
  isValidIngressRule,
} from '../../ingress/helpers';
import type {
  CreateIngressFormValues,
  IngressRoutePathItem,
  IngressRouteRuleItem,
} from '../../ingress/types';
import type { KeyValueRow, PlainObject } from '../service/mergePatch';
import {
  applyMergePatch,
  deepClone,
  deepEqual,
  diffKeyValueRows,
  diffPatch,
  isRecord,
  patchAnnotations,
} from '../service/mergePatch';

const EMPTY_VALUES: CreateIngressFormValues = {
  rules: [],
  enablePathRewrite: false,
  labels: [],
  annotations: [],
};

const getSpec = (object: PlainObject): PlainObject =>
  isRecord(object.spec) ? object.spec : {};

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const getRawRules = (object: PlainObject) => toArray(getSpec(object).rules);

const getRawPaths = (rule: PlainObject) =>
  toArray(isRecord(rule.http) ? rule.http.paths : undefined);

export const buildIngressEditValues = (
  object: PlainObject,
): CreateIngressFormValues => buildIngressFormValuesFromManifest(object);

/** 表单规则 → 清单里的一条规则；规则无效（没有可用路径等）时为 undefined */
const buildRule = (rule: IngressRouteRuleItem): PlainObject | undefined => {
  const rules = buildIngressRouteSpec({ ...EMPTY_VALUES, rules: [rule] }).rules;
  return Array.isArray(rules) && isRecord(rules[0]) ? rules[0] : undefined;
};

const buildPath = (path: IngressRoutePathItem): PlainObject | undefined => {
  const rule = buildRule({ id: '', protocol: 'HTTP', paths: [path] });
  const first = rule ? getRawPaths(rule)[0] : undefined;
  return isRecord(first) ? first : undefined;
};

/** 这条原文规则 / 路径是否会被带进表单（与 buildIngressFormValuesFromManifest 的取舍一致） */
const isRuleInForm = (rule: PlainObject) =>
  buildIngressFormValuesFromManifest({ spec: { rules: [rule] } }).rules.length >
  0;

const isPathInForm = (path: PlainObject) =>
  isRuleInForm({ http: { paths: [path] } });

/** 原文条目 → 打开时对应的表单条目（按顺序对应；没进表单的条目不在表里） */
const mapOrigins = <T>(
  raw: unknown[],
  items: T[] | undefined,
  inForm: (entry: PlainObject) => boolean,
): Map<unknown, T> => {
  const origins = new Map<unknown, T>();
  let cursor = 0;
  for (const entry of raw) {
    if (isRecord(entry) && inForm(entry)) {
      const item = items?.[cursor];
      cursor += 1;
      if (item) {
        origins.set(entry, item);
      }
    }
  }
  return origins;
};

/** 以原文规则为底叠加改动；路径被删空时返回 undefined（整条规则去掉） */
const mergeRule = (
  rule: PlainObject,
  initial: IngressRouteRuleItem,
  current: IngressRouteRuleItem,
): PlainObject | undefined => {
  const result = deepClone(rule);
  const host = current.host?.trim() || undefined;
  if (host !== (initial.host?.trim() || undefined)) {
    if (host) {
      result.host = host;
    } else {
      delete result.host;
    }
  }

  const rawPaths = getRawPaths(rule);
  const origins = mapOrigins(rawPaths, initial.paths, isPathInForm);
  const currentById = new Map(
    (current.paths || []).filter(Boolean).map((path) => [path.id, path]),
  );
  const known = new Set<string>();
  const paths: unknown[] = [];

  for (const rawPath of rawPaths) {
    const initialPath = origins.get(rawPath);
    if (!initialPath || !isRecord(rawPath)) {
      paths.push(deepClone(rawPath));
      continue;
    }
    known.add(initialPath.id);
    const currentPath = currentById.get(initialPath.id);
    if (!currentPath) {
      continue;
    }
    const path = deepClone(rawPath);
    const next = buildPath(currentPath);
    if (next) {
      applyMergePatch(path, diffPatch(buildPath(initialPath) || {}, next));
    }
    paths.push(path);
  }
  for (const path of current.paths || []) {
    const built = path && !known.has(path.id) ? buildPath(path) : undefined;
    if (built) {
      paths.push(built);
    }
  }

  if (deepEqual(paths, rawPaths)) {
    return result;
  }
  if (paths.length === 0) {
    return undefined;
  }
  result.http = { ...(isRecord(result.http) ? result.http : {}), paths };
  return result;
};

const mergeRules = (
  rawRules: unknown[],
  origins: Map<unknown, IngressRouteRuleItem>,
  current: CreateIngressFormValues,
): unknown[] => {
  const currentRules = (current.rules || []).filter(Boolean);
  const currentById = new Map(currentRules.map((rule) => [rule.id, rule]));
  const known = new Set<string>();
  const rules: unknown[] = [];

  for (const rawRule of rawRules) {
    const initialRule = origins.get(rawRule);
    if (!initialRule || !isRecord(rawRule)) {
      rules.push(deepClone(rawRule));
      continue;
    }
    known.add(initialRule.id);
    const currentRule = currentById.get(initialRule.id);
    const merged = currentRule && mergeRule(rawRule, initialRule, currentRule);
    if (merged) {
      rules.push(merged);
    }
  }

  // 新增的规则：域名已存在时并入那条规则，否则追加
  for (const rule of currentRules) {
    const built = known.has(rule.id) ? undefined : buildRule(rule);
    if (!built) {
      continue;
    }
    const target = rules.find(
      (item): item is PlainObject =>
        isRecord(item) &&
        (item.host ?? '') === (built.host ?? '') &&
        isRecord(item.http) &&
        Array.isArray(item.http.paths),
    );
    if (target && isRecord(target.http)) {
      target.http = {
        ...target.http,
        paths: [...toArray(target.http.paths), ...getRawPaths(built)],
      };
    } else {
      rules.push(built);
    }
  }

  return rules;
};

/** 「编辑路由规则」：规则、TLS、Ingress Class、路径重写注解 */
export const applyIngressRules = (
  object: PlainObject,
  initial: CreateIngressFormValues,
  current: CreateIngressFormValues,
): PlainObject => {
  const result = deepClone(object);
  const spec = getSpec(result);
  const rawRules = getRawRules(object);
  const origins = mapOrigins(rawRules, initial.rules, isRuleInForm);

  const rules = mergeRules(rawRules, origins, current);
  if (!deepEqual(rules, rawRules)) {
    spec.rules = rules;
  }

  // TLS 只按表单里可见的规则推算：没进表单或在表单里不可见的规则，其证书域名不受影响
  const hidden = new Set(
    (initial.rules || [])
      .filter((rule) => !isValidIngressRule(rule))
      .map((rule) => rule.id),
  );
  const view: PlainObject = {
    spec: {
      tls: getSpec(object).tls,
      rules: rawRules.filter((rule) => {
        const item = origins.get(rule);
        return item && !hidden.has(item.id);
      }),
    },
  };
  const buildTls = (values: CreateIngressFormValues) =>
    buildIngressRouteSpec(
      {
        ...values,
        rules: (values.rules || []).filter(
          (rule) => rule && !hidden.has(rule.id),
        ),
      },
      view,
    ).tls;
  const nextTls = buildTls(current);
  if (!deepEqual(buildTls(initial), nextTls)) {
    if (nextTls) {
      spec.tls = nextTls;
    } else {
      delete spec.tls;
    }
  }

  const ingressClassName = current.ingressClassName?.trim() || undefined;
  if (ingressClassName !== (initial.ingressClassName?.trim() || undefined)) {
    if (ingressClassName) {
      spec.ingressClassName = ingressClassName;
    } else {
      delete spec.ingressClassName;
    }
  }

  if (isRecord(object.spec) || Object.keys(spec).length > 0) {
    result.spec = spec;
  }

  // 路径重写：只改 rewrite-target（以及首次开启时补上的 use-regex），其余注解不动
  patchAnnotations(
    result,
    diffPatch(
      buildIngressMetadata(initial).annotations || {},
      buildIngressMetadata(current).annotations || {},
    ),
  );

  return result;
};

/** 对象原文的注解 → 编辑行（没有注解时给一行空行） */
export const buildAnnotationRows = (object: PlainObject): KeyValueRow[] => {
  const metadata = isRecord(object.metadata) ? object.metadata : {};
  const rows = Object.entries(
    isRecord(metadata.annotations) ? metadata.annotations : {},
  ).map(([keyName, value]) => createKeyValueItem(keyName, String(value ?? '')));

  return rows.length > 0 ? rows : [createKeyValueItem()];
};

/** 注解行的校验：返回第一条错误信息，合法时为 undefined */
export const getAnnotationRowsError = (
  rows: KeyValueRow[],
  t: Translate,
): string | undefined => {
  const keys = new Set<string>();

  for (const row of rows) {
    const keyName = row.keyName.trim();
    if (!keyName && !row.value.trim()) {
      continue;
    }
    if (!keyName) {
      return t('pages.k8s.forms.edit.ingress.annotations.keyRequired');
    }
    if (keys.has(keyName)) {
      return t('pages.k8s.forms.edit.ingress.annotations.keyDuplicate');
    }
    keys.add(keyName);
  }
  return undefined;
};

/** 「编辑注解」：只写改动 / 新增 / 删除的注解 */
export const applyIngressAnnotations = (
  object: PlainObject,
  initial: KeyValueRow[],
  current: KeyValueRow[],
): PlainObject => {
  const result = deepClone(object);
  patchAnnotations(result, diffKeyValueRows(initial, current));
  return result;
};
