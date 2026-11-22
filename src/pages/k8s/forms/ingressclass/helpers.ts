// 纯函数：不要在这里引入 React / antd（校验脚本会用 Node 直接加载本文件）
// 校验文案通过参数 t（useT() 的返回值）翻译，本文件只持有 i18n 键
import type { Translate } from '@/utils/i18n';
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
  duplicateMessageId: string,
  t: Translate,
) => {
  const keys = (items || [])
    .map((item) => trimValue(item.keyName))
    .filter(Boolean);

  if (new Set(keys).size !== keys.length) {
    return t(duplicateMessageId);
  }

  return undefined;
};

const validateIngressClassBasicInfo = (
  values: CreateIngressClassFormValues,
  t: Translate,
) => {
  const name = trimValue(values.name);

  if (!name) {
    return t('pages.k8s.forms.common.name.required');
  }
  if (name.length > 63 || !NAME_PATTERN.test(name)) {
    return t('pages.k8s.forms.common.name.dnsLabel');
  }
  if (!trimValue(values.controller)) {
    return t('pages.k8s.forms.ingressclass.controller.required');
  }

  return undefined;
};

const validateIngressClassParameters = (
  values: CreateIngressClassFormValues,
  t: Translate,
) => {
  if (values.enableParameters !== 'true') {
    return undefined;
  }

  if (!trimValue(values.parameterKind)) {
    return t('pages.k8s.forms.ingressclass.parameters.kindRequired');
  }
  if (!trimValue(values.parameterName)) {
    return t('pages.k8s.forms.ingressclass.parameters.nameRequired');
  }
  if (
    values.parameterScope === 'Namespace' &&
    !trimValue(values.parameterNamespace)
  ) {
    return t('pages.k8s.forms.ingressclass.parameters.namespaceRequired');
  }

  return undefined;
};

const validateIngressClassMetadata = (
  values: CreateIngressClassFormValues,
  t: Translate,
) =>
  validateKeyValueItems(
    values.labels,
    'pages.k8s.forms.ingressclass.labelKeyDuplicate',
    t,
  ) ||
  validateKeyValueItems(
    values.annotations,
    'pages.k8s.forms.ingressclass.annotationKeyDuplicate',
    t,
  );

const validateIngressClassStep = (
  values: CreateIngressClassFormValues,
  step: number,
  t: Translate,
) => {
  if (step === 0) {
    return validateIngressClassBasicInfo(values, t);
  }
  if (step === 1) {
    return validateIngressClassParameters(values, t);
  }
  if (step === 2) {
    return validateIngressClassMetadata(values, t);
  }

  return undefined;
};

/** 提交前对全部步骤的校验（当前未挂载的步骤也覆盖） */
const validateIngressClassFormValues = (
  values: CreateIngressClassFormValues,
  t: Translate,
) =>
  validateIngressClassBasicInfo(values, t) ||
  validateIngressClassParameters(values, t) ||
  validateIngressClassMetadata(values, t);

/** 手写 YAML 的本地预检；最终以服务端预检为准 */
const getIngressClassYamlValidationError = (
  resource: Record<string, unknown>,
  t: Translate,
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
    return t('pages.k8s.forms.common.yaml.nameRequired');
  }
  if (namespace) {
    return t('pages.k8s.forms.ingressclass.yaml.noNamespace');
  }
  if (kind !== INGRESS_CLASS_KIND) {
    return t('pages.k8s.forms.common.yaml.kindMismatch', {
      kind: INGRESS_CLASS_KIND,
    });
  }
  if (apiVersion !== INGRESS_CLASS_API_VERSION) {
    return t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
      apiVersion: INGRESS_CLASS_API_VERSION,
    });
  }
  if (!controller) {
    return t('pages.k8s.forms.ingressclass.yaml.controllerRequired');
  }
  if (
    parametersRecord &&
    (typeof parametersRecord.kind !== 'string' ||
      !parametersRecord.kind.trim() ||
      typeof parametersRecord.name !== 'string' ||
      !parametersRecord.name.trim())
  ) {
    return t('pages.k8s.forms.ingressclass.yaml.parametersKindName');
  }
  if (
    parameterScope !== undefined &&
    parameterScope !== 'Cluster' &&
    parameterScope !== 'Namespace'
  ) {
    return t('pages.k8s.forms.ingressclass.yaml.parametersScope');
  }
  if (parameterScope === 'Namespace' && !parameterNamespace) {
    return t('pages.k8s.forms.ingressclass.yaml.parametersNamespaceRequired');
  }
  if (
    parametersRecord &&
    parameterScope !== 'Namespace' &&
    parameterNamespace
  ) {
    return t(
      'pages.k8s.forms.ingressclass.yaml.parametersNamespaceOnlyNamespaced',
    );
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
