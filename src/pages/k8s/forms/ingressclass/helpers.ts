// 纯函数：不要在这里引入 React / antd（校验脚本会用 Node 直接加载本文件）
import type { KeyValueEditorItem } from '../shared/KeyValueEditor';
import {
  getRecordValue,
  NAME_PATTERN,
  toRecord,
  trimValue,
} from '../shared/manifest';
import type { CreateIngressClassFormValues } from './types';

const INGRESS_CLASS_API_VERSION = 'networking.k8s.io/v1';
const INGRESS_CLASS_KIND = 'IngressClass';
const INGRESS_CLASS_DEFAULT_ANNOTATION =
  'ingressclass.kubernetes.io/is-default-class';

const getInitialCreateIngressClassValues =
  (): CreateIngressClassFormValues => ({
    annotations: [],
    controller: undefined,
    enableParameters: 'false',
    isDefaultClass: 'false',
    labels: [],
    name: undefined,
    parameterApiGroup: undefined,
    parameterKind: undefined,
    parameterName: undefined,
    parameterNamespace: undefined,
    parameterScope: 'Cluster',
  });

const buildIngressClassParameters = (values: CreateIngressClassFormValues) => {
  if (values.enableParameters !== 'true') {
    return undefined;
  }

  const scope = values.parameterScope || 'Cluster';
  const parameters: Record<string, unknown> = {
    kind: trimValue(values.parameterKind),
    name: trimValue(values.parameterName),
    scope,
  };
  const apiGroup = trimValue(values.parameterApiGroup);
  const namespace = trimValue(values.parameterNamespace);

  if (apiGroup) {
    parameters.apiGroup = apiGroup;
  }
  // namespace 只在 Namespace 作用域下合法
  if (scope === 'Namespace' && namespace) {
    parameters.namespace = namespace;
  }

  return parameters;
};

const buildCreateIngressClassManifest = (
  values: CreateIngressClassFormValues,
): Record<string, unknown> => {
  const labels = toRecord(values.labels);
  const annotations = toRecord(values.annotations);
  const parameters = buildIngressClassParameters(values);

  if (values.isDefaultClass === 'true') {
    annotations[INGRESS_CLASS_DEFAULT_ANNOTATION] = 'true';
  } else {
    delete annotations[INGRESS_CLASS_DEFAULT_ANNOTATION];
  }

  return {
    apiVersion: INGRESS_CLASS_API_VERSION,
    kind: INGRESS_CLASS_KIND,
    metadata: {
      name: trimValue(values.name),
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    spec: {
      controller: trimValue(values.controller),
      ...(parameters ? { parameters } : {}),
    },
  };
};

const getIngressClassStepFields = (
  step: number,
): (keyof CreateIngressClassFormValues)[] => {
  if (step === 0) {
    return ['name', 'controller', 'isDefaultClass'];
  }
  if (step === 1) {
    return [
      'enableParameters',
      'parameterApiGroup',
      'parameterKind',
      'parameterName',
      'parameterNamespace',
      'parameterScope',
    ];
  }

  return ['labels', 'annotations'];
};

const hasKeyValueContent = (items?: KeyValueEditorItem[]) =>
  (items || []).some((item) => trimValue(item.keyName));

const validateKeyValueItems = (
  items: KeyValueEditorItem[] | undefined,
  label: string,
) => {
  const keys = (items || [])
    .map((item) => trimValue(item.keyName))
    .filter(Boolean);

  if (new Set(keys).size !== keys.length) {
    return `${label}键不能重复`;
  }

  return undefined;
};

const validateIngressClassBasicInfo = (
  values: CreateIngressClassFormValues,
) => {
  const name = trimValue(values.name);

  if (!name) {
    return '请输入名称';
  }
  if (name.length > 63 || !NAME_PATTERN.test(name)) {
    return '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾，最长 63 个字符';
  }
  if (!trimValue(values.controller)) {
    return '请输入控制器';
  }

  return undefined;
};

const validateIngressClassParameters = (
  values: CreateIngressClassFormValues,
) => {
  if (values.enableParameters !== 'true') {
    return undefined;
  }

  if (!trimValue(values.parameterKind)) {
    return '参数引用必须填写类型';
  }
  if (!trimValue(values.parameterName)) {
    return '参数引用必须填写名称';
  }
  if (
    values.parameterScope === 'Namespace' &&
    !trimValue(values.parameterNamespace)
  ) {
    return '命名空间级参数引用必须填写命名空间';
  }

  return undefined;
};

const validateIngressClassMetadata = (values: CreateIngressClassFormValues) =>
  validateKeyValueItems(values.labels, '标签') ||
  validateKeyValueItems(values.annotations, '注解');

const validateIngressClassStep = (
  values: CreateIngressClassFormValues,
  step: number,
) => {
  if (step === 0) {
    return validateIngressClassBasicInfo(values);
  }
  if (step === 1) {
    return validateIngressClassParameters(values);
  }
  if (step === 2) {
    return validateIngressClassMetadata(values);
  }

  return undefined;
};

/** 提交前对全部步骤的校验（当前未挂载的步骤也覆盖） */
const validateIngressClassFormValues = (values: CreateIngressClassFormValues) =>
  validateIngressClassBasicInfo(values) ||
  validateIngressClassParameters(values) ||
  validateIngressClassMetadata(values);

/** 手写 YAML 的本地预检；最终以服务端预检为准 */
const getIngressClassYamlValidationError = (
  resource: Record<string, unknown>,
) => {
  const metadataRecord = getRecordValue(resource.metadata);
  const specRecord = getRecordValue(resource.spec);
  const parametersRecord = getRecordValue(specRecord?.parameters);
  const name =
    typeof metadataRecord?.name === 'string' ? metadataRecord.name.trim() : '';
  const namespace =
    typeof metadataRecord?.namespace === 'string'
      ? metadataRecord.namespace.trim()
      : '';
  const kind = typeof resource.kind === 'string' ? resource.kind : '';
  const apiVersion =
    typeof resource.apiVersion === 'string' ? resource.apiVersion : '';
  const controller =
    typeof specRecord?.controller === 'string'
      ? specRecord.controller.trim()
      : '';
  const parameterScope =
    typeof parametersRecord?.scope === 'string'
      ? parametersRecord.scope
      : undefined;
  const parameterNamespace =
    typeof parametersRecord?.namespace === 'string'
      ? parametersRecord.namespace.trim()
      : '';

  if (!name) {
    return 'YAML 必须包含 metadata.name';
  }
  if (namespace) {
    return 'Ingress 类是集群级资源，YAML 不应包含 metadata.namespace';
  }
  if (kind !== INGRESS_CLASS_KIND) {
    return `YAML kind 必须为 ${INGRESS_CLASS_KIND}`;
  }
  if (apiVersion !== INGRESS_CLASS_API_VERSION) {
    return `YAML apiVersion 必须为 ${INGRESS_CLASS_API_VERSION}`;
  }
  if (!controller) {
    return 'YAML 必须包含 spec.controller';
  }
  if (
    parametersRecord &&
    (typeof parametersRecord.kind !== 'string' ||
      !parametersRecord.kind.trim() ||
      typeof parametersRecord.name !== 'string' ||
      !parametersRecord.name.trim())
  ) {
    return 'YAML spec.parameters 必须包含 kind 和 name';
  }
  if (
    parameterScope !== undefined &&
    parameterScope !== 'Cluster' &&
    parameterScope !== 'Namespace'
  ) {
    return 'YAML spec.parameters.scope 必须为 Cluster 或 Namespace';
  }
  if (parameterScope === 'Namespace' && !parameterNamespace) {
    return '命名空间级参数引用必须包含 namespace';
  }
  if (
    parametersRecord &&
    parameterScope !== 'Namespace' &&
    parameterNamespace
  ) {
    return '只有 Namespace 作用域的参数引用可以包含 namespace';
  }

  return undefined;
};

export {
  buildCreateIngressClassManifest,
  getIngressClassStepFields,
  getIngressClassYamlValidationError,
  getInitialCreateIngressClassValues,
  hasKeyValueContent,
  INGRESS_CLASS_API_VERSION,
  INGRESS_CLASS_DEFAULT_ANNOTATION,
  INGRESS_CLASS_KIND,
  NAME_PATTERN,
  validateIngressClassFormValues,
  validateIngressClassStep,
};
