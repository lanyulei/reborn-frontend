/** 服务账户表单 → 清单的纯逻辑（不依赖 React / antd，可单独用 Node 运行） */
import type { Translate } from '@/utils/i18n';
import { trimValue as normalizeText } from '../shared/manifest';

type ServiceAccountMetadataItem = {
  id: string;
  keyName: string;
  value: string;
};

type CreateServiceAccountFormValues = {
  annotations?: ServiceAccountMetadataItem[];
  imagePullSecrets?: string[];
  labels?: ServiceAccountMetadataItem[];
  name: string;
  namespace: string;
};

const SERVICE_ACCOUNT_KIND = 'ServiceAccount';
const SERVICE_ACCOUNT_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
/** Secret 名称是 DNS 子域名：小写字母、数字、连字符和点 */
const SECRET_NAME_PATTERN =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

const buildMetadataRecord = (items?: ServiceAccountMetadataItem[]) =>
  (items || []).reduce<Record<string, string>>((record, item) => {
    const keyName = normalizeText(item.keyName);
    if (keyName) {
      record[keyName] = item.value ?? '';
    }
    return record;
  }, {});

const normalizeImagePullSecrets = (names?: string[]) => [
  ...new Set((names || []).map((name) => normalizeText(name)).filter(Boolean)),
];

const validateMetadataItems = (
  items: ServiceAccountMetadataItem[] | undefined,
  title: string,
  t: Translate,
) => {
  const keys = new Set<string>();

  for (const item of items || []) {
    const keyName = normalizeText(item.keyName);

    if (!keyName && normalizeText(item.value)) {
      return t('pages.k8s.forms.serviceaccount.metadata.keyRequired', {
        title,
      });
    }
    if (keys.has(keyName)) {
      return t('pages.k8s.forms.serviceaccount.metadata.keyDuplicate', {
        title,
      });
    }
    if (keyName) {
      keys.add(keyName);
    }
  }

  return undefined;
};

const validateImagePullSecrets = (
  names: string[] | undefined,
  t: Translate,
) => {
  const invalid = normalizeImagePullSecrets(names).find(
    (name) => name.length > 253 || !SECRET_NAME_PATTERN.test(name),
  );

  return invalid
    ? t('pages.k8s.forms.serviceaccount.imagePullSecrets.invalid', {
        name: invalid,
      })
    : undefined;
};

const buildServiceAccountManifest = (
  values: CreateServiceAccountFormValues,
): Record<string, unknown> => {
  const labels = buildMetadataRecord(values.labels);
  const annotations = buildMetadataRecord(values.annotations);
  const imagePullSecrets = normalizeImagePullSecrets(values.imagePullSecrets);

  return {
    apiVersion: 'v1',
    kind: SERVICE_ACCOUNT_KIND,
    metadata: {
      name: normalizeText(values.name),
      namespace: normalizeText(values.namespace),
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    },
    ...(imagePullSecrets.length > 0
      ? { imagePullSecrets: imagePullSecrets.map((name) => ({ name })) }
      : {}),
  };
};

export type { CreateServiceAccountFormValues, ServiceAccountMetadataItem };
export {
  buildServiceAccountManifest,
  SERVICE_ACCOUNT_KIND,
  SERVICE_ACCOUNT_NAME_PATTERN,
  validateImagePullSecrets,
  validateMetadataItems,
};
