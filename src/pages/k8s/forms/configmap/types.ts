type ConfigMapDataItem = {
  id?: string;
  keyName?: string;
  value?: string;
};

/** 标签 / 注解的一行（与 shared/KeyValueEditor 的条目同构） */
type ConfigMapMetadataItem = {
  id: string;
  keyName: string;
  value: string;
};

type CreateConfigMapFormValues = {
  annotations?: ConfigMapMetadataItem[];
  dataItems?: ConfigMapDataItem[];
  labels?: ConfigMapMetadataItem[];
  name?: string;
  namespace?: string;
};

export type {
  ConfigMapDataItem,
  ConfigMapMetadataItem,
  CreateConfigMapFormValues,
};
