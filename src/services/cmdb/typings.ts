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

/**
 * 唯一规则：fieldCodes 这组字段的取值在模型内不可重复（1 个 = 单字段唯一，多个 = 联合唯一）。
 * 任一字段为空的资源不受该规则约束。
 */
export interface CmdbUniqueRule {
  id: string;
  modelCode: string;
  name: string;
  fieldCodes: string[];
  createTime?: string;
  updateTime?: string;
}

/** 数据质量问题类别（看板计数与列表筛选同口径，只含在册资源） */
export type CmdbQualityIssue =
  | 'missing_required'
  | 'no_owner'
  | 'orphan'
  | 'stale'
  | 'outdated';

/** 一个模型的数据质量计数（int64 → 字符串；零值可能被省略） */
export interface CmdbQualityRow {
  modelCode: string;
  modelName?: string;
  total?: string;
  missingRequired?: string;
  noOwner?: string;
  orphan?: string;
  stale?: string;
  outdated?: string;
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
  /** 只读派生值：被任一唯一规则引用（唯一约束经唯一规则维护） */
  unique?: boolean;
  enumValues?: string[];
  /** 枚举展示值（实际值 → 展示值）；未配置的项显示实际值 */
  enumLabels?: Record<string, string>;
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
  /** 负责人：系统用户 ID，或历史自由文本 */
  owner?: string;
  /** owner 为系统用户时的显示名；否则为空（展示 owner 原文） */
  ownerName?: string;
  /** 删除时间：仅回收站列表返回 */
  deleteTime?: string;
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
  action:
    | 'create'
    | 'update'
    | 'transition'
    | 'delete'
    | 'restore'
    | 'link'
    | 'unlink';
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

export type CmdbSchemaTargetType =
  | 'group'
  | 'model'
  | 'field'
  | 'relation_type'
  | 'unique_rule';
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
