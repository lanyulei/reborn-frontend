/**
 * 保密字典「编辑设置」的纯逻辑（不依赖 React / antd，可单独用 Node 运行）。
 *
 * 加载到的 Secret 的 data 值都是掩码（键是真实的），提交时后端把仍是掩码的 data 值还原成当前真实值。因此：
 * - 加载到的 data 值从不解码、从不当作内容展示，也从不写进 stringData；
 * - 没动过的键留在 data（保持加载到的值）；改过或新增的键进 stringData 并从 data 移除；删除的键从 data 移除；
 * - 明文只来自「查看明文」接口，仅用于展示与预填；看过但没改的键仍按没动过处理。
 */
import {
  DOCKER_CONFIG_JSON_KEY,
  getDockerConfigJson,
  getSecretFormValuesFromManifest,
  SECRET_KEY_PATTERN,
  secretTypeOptions,
  validateSecretMetadataItems,
} from '../../secret/helpers';
import type {
  RegistryProtocol,
  SecretMetadataItem,
  SecretType,
} from '../../secret/types';
import {
  createId,
  getRecordValue,
  trimValue as normalizeText,
} from '../../shared/manifest';
import { applyMetadataEdit, cloneManifest } from '../configmap/helpers';

type Manifest = Record<string, unknown>;

/** 后端对 Secret data 值的掩码 */
const SECRET_MASK = '******';
const DOCKER_CONFIG_TYPE: SecretType = 'kubernetes.io/dockerconfigjson';

/** 数据列表里的一项 */
type SecretEditItem = {
  id: string;
  keyName: string;
  /** 加载时对应的键；新增的条目没有 */
  sourceKey?: string;
  /** 用户输入的新值；undefined = 没动过（保持原值） */
  value?: string;
  /** 已查看的明文：仅用于展示与预填 */
  revealed?: string;
  /** 已查看且内容不是文本：只读 */
  binary?: boolean;
};

/** 「查看明文」的结果（已归一化） */
type SecretPlaintext = {
  data: Record<string, string>;
  /** 值不是文本的键 */
  binary: string[];
};

type TypedField =
  | 'basicAuthPassword'
  | 'basicAuthUsername'
  | 'tlsCertificate'
  | 'tlsPrivateKey';

type RegistryValues = {
  registryAddress?: string;
  registryEmail?: string;
  registryPassword?: string;
  registryProtocol: RegistryProtocol;
  registryUsername?: string;
};

type SecretEditFormValues = RegistryValues & {
  annotations?: SecretMetadataItem[];
  basicAuthPassword?: string;
  basicAuthUsername?: string;
  dataItems: SecretEditItem[];
  labels?: SecretMetadataItem[];
  tlsCertificate?: string;
  tlsPrivateKey?: string;
};

/**
 * 镜像服务信息表单的状态：
 * - editable：可编辑（已查看明文且能解析，或对象里还没有 .dockerconfigjson）；
 * - hidden：值已隐藏（未查看明文）；
 * - unparsed：已查看但解析不出镜像服务（或是二进制）；
 * - replaced：用户已整体替换 .dockerconfigjson。
 */
type DockerEditState = 'editable' | 'hidden' | 'replaced' | 'unparsed';

/** 各类型由专用表单项维护的文本键（不进数据列表） */
const TYPED_FIELDS: Record<SecretType, { field: TypedField; key: string }[]> = {
  Opaque: [],
  'kubernetes.io/basic-auth': [
    { field: 'basicAuthUsername', key: 'username' },
    { field: 'basicAuthPassword', key: 'password' },
  ],
  'kubernetes.io/dockerconfigjson': [],
  'kubernetes.io/tls': [
    { field: 'tlsCertificate', key: 'tls.crt' },
    { field: 'tlsPrivateKey', key: 'tls.key' },
  ],
};

const TYPED_FIELD_TITLES: Record<TypedField, string> = {
  basicAuthPassword: '密码',
  basicAuthUsername: '用户名',
  tlsCertificate: '证书',
  tlsPrivateKey: '私钥',
};

const REGISTRY_FIELDS: (keyof RegistryValues)[] = [
  'registryProtocol',
  'registryAddress',
  'registryUsername',
  'registryPassword',
  'registryEmail',
];

const createSecretEditItem = (keyName = '', value = ''): SecretEditItem => ({
  id: createId(),
  keyName,
  value,
});

/** 表单按哪种类型展示：表单不支持的类型按「默认」（类型本身不会被改动） */
const getSecretEditType = (manifest?: Manifest): SecretType => {
  const type = manifest?.type;

  return secretTypeOptions.find((option) => option.value === type)?.value
    ? (type as SecretType)
    : 'Opaque';
};

/** 加载到的 data 的键 */
const getSecretDataKeys = (manifest?: Manifest) =>
  Object.keys(getRecordValue(manifest?.data) || {});

const getTypedFields = (manifest?: Manifest) =>
  TYPED_FIELDS[getSecretEditType(manifest)];

/**
 * 已有 Secret → 表单值。只取键：数据列表的条目与专用表单项都没有值（已隐藏），
 * 明文由 applySecretReveal 填入。
 */
const getSecretEditValues = (manifest?: Manifest): SecretEditFormValues => {
  // 只把 metadata 交给创建向导的解析函数：它假定 data 是真实的 base64，不能喂掩码
  const metadataValues = getSecretFormValuesFromManifest({
    metadata: manifest?.metadata,
  });
  const typedKeys = getTypedFields(manifest).map((item) => item.key);

  return {
    annotations: metadataValues.annotations,
    dataItems: getSecretDataKeys(manifest)
      .filter((key) => !typedKeys.includes(key))
      .map((key) => ({ id: createId(), keyName: key, sourceKey: key })),
    labels: metadataValues.labels,
    registryProtocol: 'https://',
  };
};

/** .dockerconfigjson 明文 → 镜像服务表单值；解析不出镜像服务返回 undefined */
const getDockerRegistryValues = (text?: string): RegistryValues | undefined => {
  if (text === undefined) {
    return undefined;
  }

  // 用明文拼一份清单交给创建向导的解析函数
  const values = getSecretFormValuesFromManifest({
    type: DOCKER_CONFIG_TYPE,
    stringData: { [DOCKER_CONFIG_JSON_KEY]: text },
  });

  if (values.registryConfigSource === undefined) {
    return undefined;
  }

  return {
    registryAddress: values.registryAddress,
    registryEmail: values.registryEmail,
    registryPassword: values.registryPassword,
    registryProtocol: values.registryProtocol,
    registryUsername: values.registryUsername,
  };
};

const getRevealedText = (reveal: SecretPlaintext | undefined, key: string) =>
  reveal && !reveal.binary.includes(key) ? reveal.data[key] : undefined;

const findDockerConfigItem = (items?: SecretEditItem[]) =>
  (items || []).find((item) => item.keyName.trim() === DOCKER_CONFIG_JSON_KEY);

/** 镜像服务信息表单的状态；不是镜像服务类型时返回 undefined */
const getDockerEditState = (
  manifest: Manifest | undefined,
  values: Pick<SecretEditFormValues, 'dataItems'>,
  reveal?: SecretPlaintext,
): DockerEditState | undefined => {
  if (getSecretEditType(manifest) !== DOCKER_CONFIG_TYPE) {
    return undefined;
  }

  const item = findDockerConfigItem(values.dataItems);

  if (!item) {
    return 'editable';
  }
  if (item.value !== undefined) {
    return 'replaced';
  }
  if (!reveal) {
    return 'hidden';
  }

  return getDockerRegistryValues(
    getRevealedText(reveal, DOCKER_CONFIG_JSON_KEY),
  )
    ? 'editable'
    : 'unparsed';
};

/** 把「查看明文」的结果并入表单值：条目带上明文 / 二进制标记，空着的专用表单项预填明文 */
const applySecretReveal = (
  manifest: Manifest | undefined,
  values: SecretEditFormValues,
  reveal: SecretPlaintext,
): SecretEditFormValues => {
  const next: SecretEditFormValues = {
    ...values,
    dataItems: (values.dataItems || []).map((item) => {
      if (item.sourceKey === undefined) {
        return item;
      }
      if (reveal.binary.includes(item.sourceKey)) {
        return { ...item, binary: true, revealed: undefined };
      }
      return { ...item, revealed: reveal.data[item.sourceKey] };
    }),
  };

  getTypedFields(manifest).forEach(({ field, key }) => {
    const text = getRevealedText(reveal, key);
    if (!next[field] && text !== undefined) {
      next[field] = text;
    }
  });

  if (getDockerEditState(manifest, next, reveal) === 'editable') {
    Object.assign(
      next,
      getDockerRegistryValues(getRevealedText(reveal, DOCKER_CONFIG_JSON_KEY)),
    );
  }

  return next;
};

/**
 * 镜像服务信息表单将要写出的 .dockerconfigjson；表单不可编辑或没有改动时返回 undefined。
 * 以已查看的明文为底重建：其它镜像服务与未建模的字段原样保留。
 */
const getDockerConfigUpdate = (
  manifest: Manifest | undefined,
  values: SecretEditFormValues,
  reveal?: SecretPlaintext,
): string | undefined => {
  if (getDockerEditState(manifest, values, reveal) !== 'editable') {
    return undefined;
  }

  const source = findDockerConfigItem(values.dataItems)
    ? getRevealedText(reveal, DOCKER_CONFIG_JSON_KEY)
    : undefined;
  const initial: RegistryValues = getDockerRegistryValues(source) || {
    registryProtocol: 'https://',
  };
  const getField = (from: RegistryValues, field: keyof RegistryValues) =>
    from[field] || (field === 'registryProtocol' ? 'https://' : '');
  const changed = REGISTRY_FIELDS.some(
    (field) => getField(values, field) !== getField(initial, field),
  );

  if (
    !changed ||
    !normalizeText(values.registryAddress) ||
    !normalizeText(values.registryUsername) ||
    !values.registryPassword
  ) {
    return undefined;
  }

  return getDockerConfigJson({
    dataItems: [],
    registryAddress: values.registryAddress,
    registryConfigSource: source,
    registryEmail: values.registryEmail,
    registryPassword: values.registryPassword,
    registryProtocol: values.registryProtocol || 'https://',
    registryUsername: values.registryUsername,
    type: DOCKER_CONFIG_TYPE,
  });
};

const isItemUntouched = (item: SecretEditItem) =>
  item.sourceKey !== undefined &&
  item.keyName.trim() === item.sourceKey &&
  (item.value === undefined || (!item.binary && item.value === item.revealed));

const isSecretImmutable = (manifest?: Manifest) => manifest?.immutable === true;

/** 表单值的整体校验（返回第一条错误） */
const getSecretEditError = (
  manifest: Manifest,
  values: SecretEditFormValues,
  reveal?: SecretPlaintext,
): string | undefined => {
  const metadataError =
    validateSecretMetadataItems(values.labels, '标签') ||
    validateSecretMetadataItems(values.annotations, '注解');
  if (metadataError) {
    return metadataError;
  }
  if (isSecretImmutable(manifest)) {
    return undefined;
  }

  const loadedKeys = getSecretDataKeys(manifest);
  const typedFields = getTypedFields(manifest);
  const keys = new Set(typedFields.map((item) => item.key));

  for (const item of values.dataItems || []) {
    const keyName = item.keyName.trim();

    if (!keyName) {
      return '请填写数据键';
    }
    if (keyName.length > 253) {
      return '键最长 253 个字符';
    }
    if (!SECRET_KEY_PATTERN.test(keyName)) {
      return '键只能包含字母、数字、点（.）、下划线（_）和连字符（-）';
    }
    if (keys.has(keyName)) {
      return '数据键不能重复';
    }
    if (item.value === SECRET_MASK) {
      return `键 ${keyName} 的值不能是掩码 ${SECRET_MASK}`;
    }
    if (
      item.sourceKey !== undefined &&
      keyName !== item.sourceKey &&
      item.value === undefined &&
      (item.binary || item.revealed === undefined)
    ) {
      return `键 ${item.sourceKey} 的值已隐藏，改名前请先输入新值`;
    }

    keys.add(keyName);
  }

  for (const { field, key } of typedFields) {
    const title = TYPED_FIELD_TITLES[field];

    if (values[field] === SECRET_MASK) {
      return `${title}不能是掩码 ${SECRET_MASK}`;
    }
    if (!values[field] && !loadedKeys.includes(key)) {
      return `请输入${title}`;
    }
  }

  if (getDockerEditState(manifest, values, reveal) === 'editable') {
    if (!normalizeText(values.registryAddress)) {
      return '请输入镜像服务地址';
    }
    if (!normalizeText(values.registryUsername)) {
      return '请输入用户名';
    }
    if (!values.registryPassword) {
      return '请输入密码';
    }
  }

  return undefined;
};

/**
 * 表单值 → 修改后的对象（加载对象的深拷贝）。只改标签、注解与数据，类型等其余字段原样保留：
 * 没动过的键留在 data，改过 / 新增的键进 stringData，删除的键从 data 移除。
 */
const applySecretEdit = (
  manifest: Manifest,
  values: SecretEditFormValues,
  reveal?: SecretPlaintext,
): Manifest => {
  const next = cloneManifest(manifest);
  const loaded = getRecordValue(next.data) || {};
  // 保持原样留在 data 的键
  const kept = new Set<string>();
  // 写进 stringData 的键
  const writes: Record<string, string> = {};

  applyMetadataEdit(next, values);
  // 不可变（immutable）的保密字典不改数据
  if (isSecretImmutable(manifest)) {
    return next;
  }

  (values.dataItems || []).forEach((item) => {
    const keyName = item.keyName.trim();
    const text = item.value ?? (item.binary ? undefined : item.revealed);

    // 没动过，或拿不到可写的内容（值已隐藏却改了键、输入的是掩码）：原键保持原样
    if (
      !keyName ||
      isItemUntouched(item) ||
      text === undefined ||
      text === SECRET_MASK
    ) {
      if (item.sourceKey !== undefined) {
        kept.add(item.sourceKey);
      }
      return;
    }
    writes[keyName] = text;
  });

  getTypedFields(manifest).forEach(({ field, key }) => {
    const text = values[field];

    // 留空 = 保持原值；与已查看的明文相同 = 没改
    if (
      !text ||
      text === SECRET_MASK ||
      text === getRevealedText(reveal, key)
    ) {
      kept.add(key);
      return;
    }
    writes[key] = text;
  });

  const dockerConfig = getDockerConfigUpdate(manifest, values, reveal);
  if (dockerConfig !== undefined) {
    writes[DOCKER_CONFIG_JSON_KEY] = dockerConfig;
  }

  const removed = Object.keys(loaded).filter(
    (key) => key in writes || !kept.has(key),
  );
  if (removed.length > 0) {
    const data = { ...loaded };
    removed.forEach((key) => {
      delete data[key];
    });
    if (Object.keys(data).length > 0) {
      next.data = data;
    } else {
      delete next.data;
    }
  }
  if (Object.keys(writes).length > 0) {
    next.stringData = { ...(getRecordValue(next.stringData) || {}), ...writes };
  }

  return next;
};

export type {
  DockerEditState,
  SecretEditFormValues,
  SecretEditItem,
  SecretPlaintext,
  TypedField,
};
export {
  applySecretEdit,
  applySecretReveal,
  createSecretEditItem,
  DOCKER_CONFIG_TYPE,
  getDockerConfigUpdate,
  getDockerEditState,
  getDockerRegistryValues,
  getSecretDataKeys,
  getSecretEditError,
  getSecretEditType,
  getSecretEditValues,
  isSecretImmutable,
  SECRET_MASK,
};
