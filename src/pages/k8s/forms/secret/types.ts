type SecretType =
  | 'Opaque'
  | 'kubernetes.io/basic-auth'
  | 'kubernetes.io/dockerconfigjson'
  | 'kubernetes.io/tls';

type SecretDataItem = {
  id: string;
  keyName: string;
  /** 文本值；binary 为 true 时是原对象 data 里的 base64 原文（只读，原样写回） */
  value: string;
  /** 解码后不是合法 UTF-8 的值：不解码、不可编辑 */
  binary?: boolean;
};

/** 标签 / 注解的一行（与 shared/KeyValueEditor 的条目同构） */
type SecretMetadataItem = {
  id: string;
  keyName: string;
  value: string;
};

type RegistryProtocol = 'http://' | 'https://';

type CreateSecretFormValues = {
  name?: string;
  namespace?: string;
  labels?: SecretMetadataItem[];
  annotations?: SecretMetadataItem[];
  type: SecretType;
  dataItems: SecretDataItem[];
  tlsCertificate?: string;
  tlsPrivateKey?: string;
  registryProtocol: RegistryProtocol;
  registryAddress?: string;
  registryUsername?: string;
  registryPassword?: string;
  registryEmail?: string;
  /** 已有对象的 .dockerconfigjson 原文：写回时保留其它镜像服务与未建模的字段 */
  registryConfigSource?: string;
  basicAuthUsername?: string;
  basicAuthPassword?: string;
};

export type {
  CreateSecretFormValues,
  RegistryProtocol,
  SecretDataItem,
  SecretMetadataItem,
  SecretType,
};
