import { getArrayValue, getRecordValue, getStringValue } from './helpers';

type CustomResourceDefinitionBasicInfo = {
  scope?: string;
  create_time?: string;
};

type CustomResourceDefinitionVersion = {
  key: string;
  apiVersion?: string;
  group?: string;
  name?: string;
  plural?: string;
  scope?: string;
};

const getCustomResourceDefinitionSpec = (manifest?: Record<string, unknown>) =>
  getRecordValue(manifest?.spec);

const getCustomResourceDefinitionMetadata = (
  manifest?: Record<string, unknown>,
) => getRecordValue(manifest?.metadata);

const buildCustomResourceDefinitionBasicInfo = (
  manifest?: Record<string, unknown>,
): CustomResourceDefinitionBasicInfo => {
  const metadata = getCustomResourceDefinitionMetadata(manifest);
  const spec = getCustomResourceDefinitionSpec(manifest);

  return {
    scope: getStringValue(spec?.scope),
    create_time: getStringValue(metadata?.creationTimestamp),
  };
};

const buildCustomResourceDefinitionVersions = (
  manifest?: Record<string, unknown>,
): CustomResourceDefinitionVersion[] => {
  const spec = getCustomResourceDefinitionSpec(manifest);
  const group = getStringValue(spec?.group);
  const scope = getStringValue(spec?.scope);
  const names = getRecordValue(spec?.names);
  const plural = getStringValue(names?.plural);
  const versions = getArrayValue(spec?.versions)
    .map((item) => getRecordValue(item))
    .filter(Boolean);
  const servedVersions = versions.filter(
    (version) => version?.served !== false,
  );
  const visibleVersions = servedVersions.length ? servedVersions : versions;

  return visibleVersions
    .map((version) => {
      const name = getStringValue(version?.name);
      const apiVersion = [group, name].filter(Boolean).join('/');

      return {
        key: apiVersion || name || plural || 'default',
        apiVersion,
        group,
        name,
        plural,
        scope,
      };
    })
    .filter((version) => version.name && version.plural);
};

export type {
  CustomResourceDefinitionBasicInfo,
  CustomResourceDefinitionVersion,
};
export {
  buildCustomResourceDefinitionBasicInfo,
  buildCustomResourceDefinitionVersions,
};
