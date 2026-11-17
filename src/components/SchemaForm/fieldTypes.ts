/**
 * 表单字段类型的唯一清单（全站共用）：类型标识与后端 internal/pkg/formschema 一一对应，
 * 名称只在这里定义一次——各业务模块只声明自己开放哪些类型，不再各自起名。
 */

/** 全部字段类型（也是类型下拉的缺省展示顺序） */
export const FIELD_TYPES = [
  'string',
  'text',
  'int',
  'float',
  'bool',
  'enum',
  'datetime',
  'date',
  'user',
  'dept',
  'json',
  'ip',
  'ref',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** 类型 → 名称（文案键） */
export const FIELD_TYPE_META: Record<FieldType, { textId: string }> = {
  string: { textId: 'component.schemaForm.type.string' },
  text: { textId: 'component.schemaForm.type.text' },
  int: { textId: 'component.schemaForm.type.int' },
  float: { textId: 'component.schemaForm.type.float' },
  bool: { textId: 'component.schemaForm.type.bool' },
  enum: { textId: 'component.schemaForm.type.enum' },
  datetime: { textId: 'component.schemaForm.type.datetime' },
  date: { textId: 'component.schemaForm.type.date' },
  user: { textId: 'component.schemaForm.type.user' },
  dept: { textId: 'component.schemaForm.type.dept' },
  json: { textId: 'component.schemaForm.type.json' },
  ip: { textId: 'component.schemaForm.type.ip' },
  ref: { textId: 'component.schemaForm.type.ref' },
};

/** 可以多选的类型 */
export const MULTIPLE_TYPES: readonly FieldType[] = ['enum', 'user', 'dept'];
/** 可以设初始值的类型 */
export const DEFAULT_TYPES: readonly FieldType[] = [
  'string',
  'text',
  'int',
  'float',
  'bool',
  'enum',
];
/** 输入框里可以放示例文字的类型 */
export const PLACEHOLDER_TYPES: readonly FieldType[] = [
  'string',
  'text',
  'int',
  'float',
  'enum',
  'datetime',
  'date',
];
/** 单行文本的内置格式 */
export const FIELD_FORMATS = ['email', 'phone', 'url'] as const;
export type FieldFormat = (typeof FIELD_FORMATS)[number];
/** 内置格式的校验正则（与后端同一口径：宽松，只拦明显写错的） */
export const FORMAT_PATTERNS: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[0-9][0-9 -]{4,19}$/,
  url: /^https?:\/\/\S+$/,
};

/** 文本类：可配置长度与正则 */
export const TEXTUAL_TYPES: readonly FieldType[] = ['string', 'text'];
/** 数字类：可配置取值范围 */
export const NUMERIC_TYPES: readonly FieldType[] = ['int', 'float'];
