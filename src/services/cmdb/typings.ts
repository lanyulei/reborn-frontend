/**
 * CMDB 域类型：资源类型 / 字段 / 关系类型 / 资源 / 关系 / 历史。
 * 接口契约见 backend/core/api/cmdb/v1/*.proto。
 */

/**
 * 模型所属分组编码。内置分组：compute / network / storage / cloud / component / other；
 * 其余为自定义分组（见 CmdbModelGroup）。
 */
export type CmdbModelCategory = string;

export type CmdbFieldType =
  | 'string'
  | 'int'
  | 'float'
  | 'bool'
  | 'enum'
  | 'datetime'
  | 'json'
  | 'ip'
  | 'ref';

export type CmdbFieldOwner = 'manual' | 'sync' | 'both';
export type CmdbCardinality = 'one_to_one' | 'one_to_many' | 'many_to_many';
export type CmdbOnDelete = 'restrict' | 'cascade_retire';
export type CmdbCIStatus = 'planning' | 'active' | 'maintenance' | 'retired';
export type CmdbDirection = 'outgoing' | 'incoming';
/** 类型状态：1 启用 / 2 停用 */
export type CmdbModelStatus = 1 | 2;

export interface CmdbModel {
  code: string;
  name: string;
  category: CmdbModelCategory;
  icon?: string;
  description?: string;
  status: CmdbModelStatus;
  builtin?: boolean;
  /** int64 字符串 */
  ciCount?: string;
  createTime?: string;
  updateTime?: string;
}

export interface CmdbFieldRule {
  pattern?: string;
  min?: number;
  max?: number;
  minLen?: number;
  maxLen?: number;
}

export interface CmdbField {
  id: string;
  modelCode: string;
  code: string;
  name: string;
  type: CmdbFieldType;
  required?: boolean;
  unique?: boolean;
  enumValues?: string[];
  refModel?: string;
  rule?: CmdbFieldRule;
  owner: CmdbFieldOwner;
  listVisible?: boolean;
  sort?: number;
  description?: string;
  deprecated?: boolean;
  /** 为 attrs->>code 建表达式索引 */
  indexed?: boolean;
  /** 敏感属性：读取、历史、导出一律脱敏为 ****** */
  sensitive?: boolean;
}

export interface CmdbRelationType {
  code: string;
  name: string;
  forwardName: string;
  backwardName: string;
  srcModel: string;
  dstModel: string;
  cardinality: CmdbCardinality;
  onDelete: CmdbOnDelete;
  description?: string;
  /** int64 字符串 */
  relationCount?: string;
}

export interface CmdbCI {
  id: string;
  modelCode: string;
  modelName?: string;
  name: string;
  status: CmdbCIStatus;
  env?: string;
  owner?: string;
  tags?: string[];
  source?: string;
  externalId?: string;
  attrs?: Record<string, unknown>;
  lastSyncedAt?: string;
  /** 同步来源的采集源名称（manual 为空） */
  sourceName?: string;
  /** 同步来源的采集源已删除 */
  sourceDeleted?: boolean;
  stale?: boolean;
  /** int64 字符串，更新时回传 */
  version: string;
  createTime?: string;
  updateTime?: string;
}

export interface CmdbRelationSummary {
  relationType: string;
  direction: CmdbDirection;
  name: string;
  targetModel: string;
  /** int64 字符串 */
  count: string;
}

export interface CmdbHistory {
  id: string;
  ciId: string;
  /** 全局审计列表附带 */
  ciName?: string;
  modelCode?: string;
  action: 'create' | 'update' | 'transition' | 'delete' | 'link' | 'unlink';
  diff?: Record<string, unknown>;
  operator?: string;
  source?: string;
  requestId?: string;
  createTime?: string;
}

export interface CmdbRelatedCI {
  relationId: string;
  ci: CmdbCI;
}

/** 模型分组（cmdb_model.category 的取值） */
export interface CmdbModelGroup {
  code: string;
  name: string;
  sort: number;
  builtin?: boolean;
  /** int64 字符串 */
  modelCount?: string;
}

/** 运营概览：一个维度取值上的资源数 */
export interface CmdbOverviewCount {
  /** 模型编码 / 状态 / 环境 / 来源（环境未填为空串） */
  key: string;
  /** 展示名（按模型统计时为模型名） */
  name?: string;
  /** int64 字符串 */
  count: string;
}

/** 运营概览：某天某动作的变更次数 */
export interface CmdbOverviewTrendPoint {
  /** YYYY-MM-DD */
  date: string;
  action: CmdbHistory['action'];
  /** int64 字符串 */
  count: string;
}

export interface CmdbOverview {
  modelCount: string;
  ciCount: string;
  relationCount: string;
  changeCount: string;
  byModel: CmdbOverviewCount[];
  byStatus: CmdbOverviewCount[];
  byEnv: CmdbOverviewCount[];
  bySource: CmdbOverviewCount[];
  trend: CmdbOverviewTrendPoint[];
  days: number;
}

export type CmdbSchemaTargetType = 'group' | 'model' | 'field' | 'relation_type';
export type CmdbSchemaAction = 'create' | 'update' | 'delete';

/** 模型变更审计记录 */
export interface CmdbSchemaAudit {
  id: string;
  targetType: CmdbSchemaTargetType;
  targetCode: string;
  targetName?: string;
  modelCode?: string;
  action: CmdbSchemaAction;
  diff?: Record<string, unknown>;
  operator?: string;
  requestId?: string;
  createTime?: string;
}
