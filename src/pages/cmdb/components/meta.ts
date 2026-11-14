/**
 * CMDB 枚举元数据：只存结构与 i18n 键，文案经 utils/i18n 的 hook 解析。
 */
import type {
  CmdbCardinality,
  CmdbCIStatus,
  CmdbFieldOwner,
  CmdbFieldType,
  CmdbHistory,
  CmdbModelCategory,
  CmdbModelStatus,
  CmdbOnDelete,
  CmdbSchemaAction,
  CmdbSchemaTargetType,
} from '@/services/cmdb/typings';
import type { EnumMeta } from '@/utils/i18n';

export const CMDB_CATEGORY_META: EnumMeta<CmdbModelCategory> = {
  compute: { textId: 'enum.cmdb.category.compute' },
  network: { textId: 'enum.cmdb.category.network' },
  storage: { textId: 'enum.cmdb.category.storage' },
  cloud: { textId: 'enum.cmdb.category.cloud' },
  component: { textId: 'enum.cmdb.category.component' },
  other: { textId: 'enum.cmdb.category.other' },
};
export const CMDB_CATEGORY_ORDER: readonly CmdbModelCategory[] = [
  'compute',
  'network',
  'storage',
  'cloud',
  'component',
  'other',
];

export const CMDB_MODEL_STATUS_META: EnumMeta<CmdbModelStatus> = {
  1: { textId: 'enum.cmdb.modelStatus.1', status: 'Success' },
  2: { textId: 'enum.cmdb.modelStatus.2', status: 'Default' },
};
export const CMDB_MODEL_STATUS_ORDER: readonly CmdbModelStatus[] = [1, 2];

export const CMDB_FIELD_TYPE_META: EnumMeta<CmdbFieldType> = {
  string: { textId: 'enum.cmdb.fieldType.string' },
  int: { textId: 'enum.cmdb.fieldType.int' },
  float: { textId: 'enum.cmdb.fieldType.float' },
  bool: { textId: 'enum.cmdb.fieldType.bool' },
  enum: { textId: 'enum.cmdb.fieldType.enum' },
  datetime: { textId: 'enum.cmdb.fieldType.datetime' },
  json: { textId: 'enum.cmdb.fieldType.json' },
  ip: { textId: 'enum.cmdb.fieldType.ip' },
  ref: { textId: 'enum.cmdb.fieldType.ref' },
};
export const CMDB_FIELD_TYPE_ORDER: readonly CmdbFieldType[] = [
  'string',
  'int',
  'float',
  'bool',
  'enum',
  'datetime',
  'ip',
  'ref',
  'json',
];

export const CMDB_FIELD_OWNER_META: EnumMeta<CmdbFieldOwner> = {
  manual: { textId: 'enum.cmdb.fieldOwner.manual' },
  sync: { textId: 'enum.cmdb.fieldOwner.sync' },
  both: { textId: 'enum.cmdb.fieldOwner.both' },
};
export const CMDB_FIELD_OWNER_ORDER: readonly CmdbFieldOwner[] = [
  'manual',
  'sync',
  'both',
];

export const CMDB_CARDINALITY_META: EnumMeta<CmdbCardinality> = {
  one_to_one: { textId: 'enum.cmdb.cardinality.one_to_one' },
  one_to_many: { textId: 'enum.cmdb.cardinality.one_to_many' },
  many_to_many: { textId: 'enum.cmdb.cardinality.many_to_many' },
};
export const CMDB_CARDINALITY_ORDER: readonly CmdbCardinality[] = [
  'one_to_one',
  'one_to_many',
  'many_to_many',
];

export const CMDB_ON_DELETE_META: EnumMeta<CmdbOnDelete> = {
  restrict: { textId: 'enum.cmdb.onDelete.restrict' },
  cascade_retire: { textId: 'enum.cmdb.onDelete.cascade_retire' },
};
export const CMDB_ON_DELETE_ORDER: readonly CmdbOnDelete[] = [
  'restrict',
  'cascade_retire',
];

export const CMDB_CI_STATUS_META: EnumMeta<CmdbCIStatus> = {
  planning: { textId: 'enum.cmdb.ciStatus.planning', status: 'Default' },
  active: { textId: 'enum.cmdb.ciStatus.active', status: 'Success' },
  maintenance: { textId: 'enum.cmdb.ciStatus.maintenance', status: 'Warning' },
  retired: { textId: 'enum.cmdb.ciStatus.retired', status: 'Error' },
};
export const CMDB_CI_STATUS_ORDER: readonly CmdbCIStatus[] = [
  'planning',
  'active',
  'maintenance',
  'retired',
];

/** 状态机：与后端 biz.transitions 一致 */
export const CMDB_CI_TRANSITIONS: Record<CmdbCIStatus, CmdbCIStatus[]> = {
  planning: ['active', 'retired'],
  active: ['maintenance', 'retired'],
  maintenance: ['active', 'retired'],
  retired: [],
};

export const CMDB_ACTION_META: EnumMeta<CmdbHistory['action']> = {
  create: { textId: 'enum.cmdb.action.create', status: 'Success' },
  update: { textId: 'enum.cmdb.action.update', status: 'Processing' },
  transition: { textId: 'enum.cmdb.action.transition', status: 'Warning' },
  delete: { textId: 'enum.cmdb.action.delete', status: 'Error' },
  restore: { textId: 'enum.cmdb.action.restore', status: 'Success' },
  link: { textId: 'enum.cmdb.action.link', status: 'Processing' },
  unlink: { textId: 'enum.cmdb.action.unlink', status: 'Default' },
};

/** 模型变更审计：对象类型 */
export const CMDB_SCHEMA_TARGET_META: EnumMeta<CmdbSchemaTargetType> = {
  group: { textId: 'enum.cmdb.schemaTarget.group' },
  model: { textId: 'enum.cmdb.schemaTarget.model' },
  field: { textId: 'enum.cmdb.schemaTarget.field' },
  relation_type: { textId: 'enum.cmdb.schemaTarget.relation_type' },
  unique_rule: { textId: 'enum.cmdb.schemaTarget.unique_rule' },
};
export const CMDB_SCHEMA_TARGET_ORDER: readonly CmdbSchemaTargetType[] = [
  'group',
  'model',
  'field',
  'relation_type',
  'unique_rule',
];

/** 模型变更审计：动作（复用实例变更动作文案） */
export const CMDB_SCHEMA_ACTION_META: EnumMeta<CmdbSchemaAction> = {
  create: { textId: 'enum.cmdb.action.create', status: 'Processing' },
  update: { textId: 'enum.cmdb.action.update', status: 'Warning' },
  delete: { textId: 'enum.cmdb.action.delete', status: 'Error' },
};
export const CMDB_SCHEMA_ACTION_ORDER: readonly CmdbSchemaAction[] = [
  'create',
  'update',
  'delete',
];

/** 任意类型通配 */
export const CMDB_ANY_MODEL = '*';
