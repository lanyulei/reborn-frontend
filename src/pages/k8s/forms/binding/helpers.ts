import type { Translate } from '@/utils/i18n';
import { getRecordValue } from '../shared/manifest';
import type {
  BindingSubjectFormValue,
  CreateBindingFormValues,
  CreateBindingType,
  MetadataItem,
} from './types';

const RBAC_API_VERSION = 'rbac.authorization.k8s.io/v1';
const RBAC_API_GROUP = 'rbac.authorization.k8s.io';
const BINDING_NAME_PATTERN =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

const normalizeText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const createMetadataItem = (): MetadataItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  keyName: '',
  value: '',
});

const createSubjectItem = (
  values?: Partial<BindingSubjectFormValue>,
): BindingSubjectFormValue => ({
  id: values?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  kind: values?.kind || 'ServiceAccount',
  name: values?.name || '',
  namespace: values?.namespace,
});

const metadataItemsToRecord = (items?: MetadataItem[]) => {
  const entries = (items || [])
    .map((item) => [item.keyName.trim(), item.value.trim()] as const)
    .filter(([key]) => key);

  return entries.length ? Object.fromEntries(entries) : undefined;
};

const normalizeSubject = (
  subject: BindingSubjectFormValue,
  bindingNamespace?: string,
) => {
  const kind = subject.kind || 'ServiceAccount';
  const namespace =
    kind === 'ServiceAccount'
      ? normalizeText(subject.namespace) || bindingNamespace
      : undefined;

  return {
    kind,
    name: normalizeText(subject.name),
    ...(namespace ? { namespace } : {}),
    ...(kind === 'ServiceAccount' ? {} : { apiGroup: RBAC_API_GROUP }),
  };
};

const buildCreateBindingManifest = (values: CreateBindingFormValues) => {
  const type = values.type || 'RoleBinding';
  const namespace =
    type === 'RoleBinding' ? normalizeText(values.namespace) : undefined;
  const labels = metadataItemsToRecord(values.labels);
  const annotations = metadataItemsToRecord(values.annotations);
  const roleKind =
    type === 'ClusterRoleBinding' ? 'ClusterRole' : values.roleKind || 'Role';

  return {
    apiVersion: RBAC_API_VERSION,
    kind: type,
    metadata: {
      name: normalizeText(values.name),
      ...(namespace ? { namespace } : {}),
      ...(labels ? { labels } : {}),
      ...(annotations ? { annotations } : {}),
    },
    subjects: (values.subjects || []).map((subject) =>
      normalizeSubject(subject, namespace),
    ),
    roleRef: {
      kind: roleKind,
      name: normalizeText(values.roleName),
      apiGroup: RBAC_API_GROUP,
    },
  };
};

const getInitialCreateBindingValues = (
  type: CreateBindingType = 'RoleBinding',
  namespace?: string,
): CreateBindingFormValues => ({
  type,
  name: '',
  namespace: type === 'RoleBinding' ? namespace || undefined : undefined,
  roleKind: type === 'ClusterRoleBinding' ? 'ClusterRole' : 'Role',
  roleName: '',
  subjects: [createSubjectItem({ namespace: namespace || undefined })],
  labels: [],
  annotations: [],
});

const getCreateBindingStepFields = (
  step: number,
): (keyof CreateBindingFormValues)[] => {
  if (step === 0) {
    return ['type', 'name', 'namespace'];
  }
  if (step === 1) {
    return ['roleKind', 'roleName'];
  }
  if (step === 2) {
    return ['subjects'];
  }
  return ['labels', 'annotations'];
};

/** 授权主体检查；通过返回 undefined */
const getSubjectsError = (
  values: CreateBindingFormValues,
  t: Translate,
): string | undefined => {
  const subjects = values.subjects || [];

  if (!subjects.length) {
    return t('pages.k8s.forms.binding.subjects.required');
  }

  for (const [index, subject] of subjects.entries()) {
    if (!subject.kind) {
      return t('pages.k8s.forms.binding.subjects.kindRequired', {
        index: index + 1,
      });
    }
    if (!subject.name?.trim()) {
      return t('pages.k8s.forms.binding.subjects.nameRequired', {
        index: index + 1,
      });
    }
    if (subject.kind === 'ServiceAccount' && !subject.namespace?.trim()) {
      return t('pages.k8s.forms.binding.subjects.namespaceRequired', {
        index: index + 1,
      });
    }
  }

  return undefined;
};

/**
 * YAML 模式提交前的检查；通过返回 undefined，否则返回提示语。
 * expectedKind 给定时（从固定类型的入口打开）kind 必须与之一致。
 */
const getBindingManifestError = (
  resource: Record<string, unknown>,
  t: Translate,
  expectedKind?: CreateBindingType,
): string | undefined => {
  const metadata = getRecordValue(resource.metadata);
  const roleRef = getRecordValue(resource.roleRef);
  const subjects: unknown[] = Array.isArray(resource.subjects)
    ? resource.subjects
    : [];
  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
  const namespace =
    typeof metadata?.namespace === 'string' ? metadata.namespace.trim() : '';
  const kind = typeof resource.kind === 'string' ? resource.kind : '';
  const roleKind = typeof roleRef?.kind === 'string' ? roleRef.kind : '';
  const roleName = typeof roleRef?.name === 'string' ? roleRef.name.trim() : '';

  if (expectedKind && kind !== expectedKind) {
    return t('pages.k8s.forms.common.yaml.kindMismatch', {
      kind: expectedKind,
    });
  }
  if (kind !== 'RoleBinding' && kind !== 'ClusterRoleBinding') {
    return t('pages.k8s.forms.binding.yaml.kind');
  }
  if (resource.apiVersion !== RBAC_API_VERSION) {
    return t('pages.k8s.forms.common.yaml.apiVersionMismatch', {
      apiVersion: RBAC_API_VERSION,
    });
  }
  if (!name) {
    return t('pages.k8s.forms.common.yaml.nameRequired');
  }
  if (kind === 'RoleBinding' && !namespace) {
    return t('pages.k8s.forms.binding.yaml.namespaceRequired');
  }
  if (kind === 'ClusterRoleBinding' && namespace) {
    return t('pages.k8s.forms.binding.yaml.namespaceForbidden');
  }
  if (!roleRef || !roleName) {
    return t('pages.k8s.forms.binding.yaml.roleRefRequired');
  }
  if (roleRef.apiGroup !== RBAC_API_GROUP) {
    return t('pages.k8s.forms.binding.yaml.roleRefApiGroup', {
      apiGroup: RBAC_API_GROUP,
    });
  }
  if (kind === 'ClusterRoleBinding' && roleKind !== 'ClusterRole') {
    return t('pages.k8s.forms.binding.yaml.clusterRoleOnly');
  }
  if (roleKind !== 'Role' && roleKind !== 'ClusterRole') {
    return t('pages.k8s.forms.binding.yaml.roleKind');
  }
  if (!subjects.length) {
    return t('pages.k8s.forms.binding.yaml.subjectsRequired');
  }

  const invalidSubjectIndex = subjects.findIndex((subject) => {
    const subjectRecord = getRecordValue(subject);
    return (
      !subjectRecord ||
      !['ServiceAccount', 'User', 'Group'].includes(
        String(subjectRecord.kind || ''),
      ) ||
      typeof subjectRecord.name !== 'string' ||
      !subjectRecord.name.trim() ||
      (subjectRecord.kind === 'ServiceAccount' &&
        (typeof subjectRecord.namespace !== 'string' ||
          !subjectRecord.namespace.trim()))
    );
  });

  if (invalidSubjectIndex >= 0) {
    return t('pages.k8s.forms.binding.yaml.subjectInvalid', {
      index: invalidSubjectIndex,
    });
  }

  return undefined;
};

const hasMetadataContent = (items?: MetadataItem[]) =>
  (items || []).some((item) => item.keyName.trim());

const hasSubjectsContent = (values: CreateBindingFormValues) =>
  (values.subjects || []).some(
    (subject) => subject.kind && subject.name?.trim(),
  );

const hasAdvancedContent = (values: CreateBindingFormValues) =>
  hasMetadataContent(values.labels) || hasMetadataContent(values.annotations);

export {
  BINDING_NAME_PATTERN,
  buildCreateBindingManifest,
  createMetadataItem,
  createSubjectItem,
  getBindingManifestError,
  getCreateBindingStepFields,
  getInitialCreateBindingValues,
  getSubjectsError,
  hasAdvancedContent,
  hasSubjectsContent,
  RBAC_API_GROUP,
  RBAC_API_VERSION,
};
