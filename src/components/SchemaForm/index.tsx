/**
 * 表单字段库（通用）：字段类型清单（fieldTypes）、字段配置表单项（FieldFormItems），以及
 * 元数据驱动的动态字段渲染——字段定义 → 表格列（useSchemaColumns）、
 * 表单项（SchemaFormItems）与表单值 / 取值互转（valuesToForm / formToValues）。
 * 组件不依赖任何业务域：需要业务数据的字段类型（如「引用」要搜索对端资源）经
 * renderers 由调用方注入；域专有的禁用规则经 isDisabled 注入。
 * 与后端 internal/pkg/formschema 的字段类型一一对应。
 */
import type { ProColumns } from '@ant-design/pro-components';
import {
  ProFormDatePicker,
  ProFormDateTimePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Col, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { Fragment, useMemo } from 'react';
import { type Translate, useT } from '@/utils/i18n';
import { FORMAT_PATTERNS } from './fieldTypes';

export {
  type FieldControl,
  FieldFormItems,
  type FieldFormItemsProps,
  fromEnumPairs,
  toEnumPairs,
} from './FieldFormItems';
export {
  DEFAULT_TYPES,
  FIELD_FORMATS,
  FIELD_TYPE_META,
  FIELD_TYPES,
  type FieldFormat,
  type FieldType,
  MULTIPLE_TYPES,
  NUMERIC_TYPES,
  PLACEHOLDER_TYPES,
  TEXTUAL_TYPES,
} from './fieldTypes';

/** 字段校验规则 */
export interface SchemaFieldRule {
  pattern?: string;
  min?: number;
  max?: number;
  minLen?: number;
  maxLen?: number;
}

/** 字段定义中参与渲染与校验的部分；业务域的字段类型在结构上满足它即可 */
export interface SchemaField {
  /** 字段主键（表单项 key）；缺省用 code */
  id?: string;
  /** 字段码：取值对象的键 */
  code: string;
  /** 展示名 */
  name: string;
  /** 数据类型：string / text / int / float / bool / enum / datetime / json / ip / ref … */
  type: string;
  required?: boolean;
  enumValues?: string[];
  /** 枚举展示值（实际值 → 展示值）；未配置的项显示实际值 */
  enumLabels?: Record<string, string>;
  rule?: SchemaFieldRule;
  description?: string;
  deprecated?: boolean;
  /** 是否在列表中展示 */
  listVisible?: boolean;
  /** 多选（下拉 / 人员 / 部门）：取值为列表 */
  multiple?: boolean;
  /** 表单的初始值 */
  defaultValue?: unknown;
  /** 输入框里的示例文字 */
  placeholder?: string;
  /** 所属分组的标题：相邻且同组的字段归到一个小标题下 */
  group?: string;
  /** 单行文本的内置格式：email / phone / url */
  format?: string;
  /** 数字的单位（仅展示） */
  unit?: string;
  /** 小数位数上限 */
  precision?: number;
  /** 显示条件：控制字段取到给定值之一时才显示 */
  showWhen?: { field: string; values: string[] };
}

/** 字段取值在显示条件里的文本形式（下拉的值 / 是否的 true、false）；其余为空串 */
export const conditionValue = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : typeof value === 'boolean'
      ? String(value)
      : '';

/**
 * 按显示条件算出这份取值下不显示的字段（控制字段本身不显示时，受它控制的也不显示）。
 * 控制字段排在被控制的字段前面，顺序走一遍即可。与后端同一口径。
 */
export const hiddenFieldCodes = (
  fields: readonly SchemaField[],
  values: Record<string, unknown> | undefined,
): Set<string> => {
  const hidden = new Set<string>();
  for (const f of fields) {
    const w = f.showWhen;
    if (!w) continue;
    if (
      hidden.has(w.field) ||
      !w.values.includes(conditionValue(values?.[w.field]))
    ) {
      hidden.add(f.code);
    }
  }
  return hidden;
};

/** 把字段按分组切成段：相邻且分组标题相同的归为一段（标题为空 = 不分组） */
export const groupFields = <F extends SchemaField>(
  fields: readonly F[],
): { title: string; fields: F[] }[] => {
  const out: { title: string; fields: F[] }[] = [];
  for (const f of fields) {
    const title = f.group ?? '';
    const last = out[out.length - 1];
    if (last && last.title === title) last.fields.push(f);
    else out.push({ title, fields: [f] });
  }
  return out;
};

/** 各字段的初始值（字段码 → 值）；没有配置初始值的字段不出现 */
export const schemaDefaults = (
  fields: readonly SchemaField[],
): Record<string, unknown> =>
  Object.fromEntries(
    fields
      .filter((f) => f.defaultValue !== undefined && f.defaultValue !== null)
      .map((f) => [f.code, f.defaultValue]),
  );

/**
 * 新表单的初始取值：开关缺省即「否」（不预置的话，未拨动的开关不会随表单提交，以它为控制
 * 字段的显示条件也判不出「否」），再叠加字段配置的初始值。提单页与表单预览共用。
 */
export const schemaInitialValues = (
  fields: readonly SchemaField[],
): Record<string, unknown> => ({
  ...Object.fromEntries(
    fields.filter((f) => f.type === 'bool').map((f) => [f.code, false]),
  ),
  ...schemaDefaults(fields),
});

const IP_PATTERN =
  /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}|[0-9a-fA-F:]+)$/;

/** 单元格展示：按类型格式化取值 */
export const renderSchemaValue = (
  field: SchemaField,
  value: unknown,
  t: Translate,
): React.ReactNode => {
  if (value === undefined || value === null || value === '') {
    return (
      <Typography.Text type="secondary">{t('common.empty')}</Typography.Text>
    );
  }
  // 多选：逐项展示（下拉用展示值）
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <Typography.Text type="secondary">{t('common.empty')}</Typography.Text>
      );
    }
    return field.type === 'enum'
      ? value.map((v) => (
          <Tag key={String(v)}>
            {field.enumLabels?.[String(v)] ?? String(v)}
          </Tag>
        ))
      : value.map(String).join('、');
  }
  switch (field.type) {
    case 'int':
    case 'float':
      return field.unit ? `${String(value)} ${field.unit}` : String(value);
    case 'bool':
      return value ? 'true' : 'false';
    case 'datetime':
      return dayjs(String(value)).isValid()
        ? dayjs(String(value)).format('YYYY-MM-DD HH:mm:ss')
        : String(value);
    case 'json':
      return (
        <Typography.Text code ellipsis={{ tooltip: JSON.stringify(value) }}>
          {JSON.stringify(value)}
        </Typography.Text>
      );
    case 'enum': {
      const v = String(value);
      const label = field.enumLabels?.[v];
      // 配了展示值显示展示值，悬停提示实际值
      if (label) {
        return (
          <Tooltip title={v}>
            <Tag>{label}</Tag>
          </Tooltip>
        );
      }
      return <Tag>{v}</Tag>;
    }
    default:
      return String(value);
  }
};

/**
 * 列表列：listVisible 且未废弃的字段。namePath 为取值对象在行记录里的键
 * （列 key 为 `<namePath>.<code>`）；getValues 从行记录取出取值对象，须为稳定引用。
 */
export const useSchemaColumns = <T,>(
  fields: readonly SchemaField[] | undefined,
  namePath: string,
  getValues: (record: T) => Record<string, unknown> | undefined,
): ProColumns<T>[] => {
  const t = useT();
  return useMemo(
    () =>
      (fields ?? [])
        .filter((f) => f.listVisible && !f.deprecated)
        .map<ProColumns<T>>((f) => ({
          title: f.name,
          key: `${namePath}.${f.code}`,
          dataIndex: [namePath, f.code],
          search: false,
          ellipsis: true,
          render: (_, record) =>
            renderSchemaValue(f, getValues(record)?.[f.code], t),
        })),
    [fields, namePath, getValues, t],
  );
};

/** 取值 → 表单值（json 字段序列化为文本） */
export const valuesToForm = (
  fields: readonly SchemaField[],
  values: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values?.[f.code];
    if (v === undefined || v === null) continue;
    out[f.code] = f.type === 'json' ? JSON.stringify(v, null, 2) : v;
  }
  return out;
};

/**
 * 表单值 → 取值：空值转 null（后端按键合并，null 清空）；json 文本解析；
 * datetime 转 RFC3339。
 */
export const formToValues = (
  fields: readonly SchemaField[],
  values: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.deprecated) continue;
    const v = values?.[f.code];
    if (
      v === undefined ||
      v === null ||
      v === '' ||
      (Array.isArray(v) && v.length === 0)
    ) {
      out[f.code] = null;
      continue;
    }
    switch (f.type) {
      case 'date':
        out[f.code] = dayjs(v as string).format('YYYY-MM-DD');
        break;
      case 'json':
        out[f.code] = typeof v === 'string' ? JSON.parse(v) : v;
        break;
      case 'datetime':
        out[f.code] = dayjs(v as string).toISOString();
        break;
      default:
        out[f.code] = v;
    }
  }
  return out;
};

/**
 * 字段正则 → 表单校验规则。后端是 Go（RE2）语法，个别写法（如 (?i)）不是合法的
 * JS 正则：构造失败时跳过前端校验（后端仍会校验），不让表单渲染崩溃。
 */
const patternRule = (pattern?: string): { pattern: RegExp }[] => {
  if (!pattern) return [];
  try {
    return [{ pattern: new RegExp(pattern) }];
  } catch {
    return [];
  }
};

/** 表单项公共属性：自定义渲染器拿到后展开到自己的 ProForm 控件上 */
export interface SchemaItemProps {
  name: string[];
  label: string;
  tooltip?: string;
  disabled?: boolean;
  rules: { required: boolean; message: string; type?: 'array' }[];
}

/** 自定义字段渲染器：按字段类型注入（如 ref → 搜索对端资源的下拉） */
export type SchemaFieldRenderer<F extends SchemaField> = (
  field: F,
  props: SchemaItemProps,
) => React.ReactNode;

/** 表单项：name 为 [...namePath, code]，按字段类型选择控件 */
export const SchemaFormItems = <F extends SchemaField>({
  fields,
  namePath,
  isDisabled,
  renderers,
  customColSpan,
  renderGroup,
  baseValues,
}: {
  fields: readonly F[];
  /** 取值对象在表单值里的路径，如 ['attrs'] */
  namePath: readonly string[];
  /** 域专有的禁用规则（如同步来源维护的只读字段） */
  isDisabled?: (field: F) => boolean | undefined;
  /** 按字段类型注入的渲染器，优先于内置控件 */
  renderers?: Readonly<Record<string, SchemaFieldRenderer<F>>>;
  /**
   * 栅格表单（ProForm grid）里自定义渲染器所占的栅格列数。内置控件是 ProForm 控件，列宽随
   * 表单的 colProps；自定义渲染器若用的是普通 Form.Item（不认 colProps），在这里统一包一层
   * 栅格列。自定义渲染器本身就是 ProForm 控件、或表单不是栅格布局时不要传。
   */
  customColSpan?: number;
  /** 分组标题的渲染；提供后在每段分组的第一个字段前插入标题（标题为空的段不插入） */
  renderGroup?: (title: string) => React.ReactNode;
  /**
   * 表单之外的取值：显示条件的控制字段不在这次渲染的字段里时（如只编辑部分字段），
   * 用它判断是否显示
   */
  baseValues?: Record<string, unknown>;
}): React.ReactNode => {
  const t = useT();
  const active = fields.filter((f) => !f.deprecated);
  const byCode = new Map(active.map((f) => [f.code, f]));
  /** 字段的显示条件链：自己的控制字段、控制字段的控制字段…… */
  const chainOf = (f: F): { field: string; values: string[] }[] => {
    const chain: { field: string; values: string[] }[] = [];
    for (let w = f.showWhen; w && chain.length < 20; ) {
      chain.push(w);
      w = byCode.get(w.field)?.showWhen;
    }
    return chain;
  };
  return (
    <>
      {active.map((f, index) => {
        const name = [...namePath, f.code];
        const disabled = isDisabled?.(f);
        const rules: SchemaItemProps['rules'] = f.required
          ? [
              {
                required: true,
                message: t('common.validation.required', { label: f.name }),
                // 多选的值是列表：按列表判空
                ...(f.multiple ? { type: 'array' as const } : {}),
              },
            ]
          : [];
        const placeholder = f.placeholder || undefined;
        const common: SchemaItemProps = {
          name,
          label: f.name,
          tooltip: f.description || undefined,
          disabled,
          rules,
        };
        const item = (() => {
          const custom = renderers?.[f.type];
          if (custom) {
            const node = custom(f, common);
            return customColSpan ? (
              <Col span={customColSpan}>{node}</Col>
            ) : (
              node
            );
          }
          switch (f.type) {
            case 'int':
            case 'float':
              return (
                <ProFormDigit
                  {...common}
                  // 不设下限时显式放开：数字控件缺省下限是 0，会把负数改成 0
                  min={f.rule?.min ?? Number.MIN_SAFE_INTEGER}
                  max={f.rule?.max}
                  placeholder={placeholder}
                  fieldProps={{
                    precision: f.type === 'int' ? 0 : f.precision,
                    suffix: f.unit || undefined,
                  }}
                />
              );
            case 'bool':
              return <ProFormSwitch {...common} rules={[]} />;
            case 'enum':
              return (
                <ProFormSelect
                  {...common}
                  mode={f.multiple ? 'multiple' : undefined}
                  placeholder={placeholder}
                  options={(f.enumValues ?? []).map((v) => ({
                    label: f.enumLabels?.[v] ?? v,
                    value: v,
                  }))}
                />
              );
            case 'datetime':
              return (
                <ProFormDateTimePicker {...common} placeholder={placeholder} />
              );
            case 'date':
              return (
                <ProFormDatePicker {...common} placeholder={placeholder} />
              );
            case 'text':
              return (
                <ProFormTextArea
                  {...common}
                  rules={[
                    ...rules,
                    ...(f.rule?.maxLen ? [{ max: f.rule.maxLen }] : []),
                    ...patternRule(f.rule?.pattern),
                  ]}
                  colProps={{ span: 24 }}
                  placeholder={placeholder}
                  fieldProps={{ autoSize: { minRows: 3, maxRows: 8 } }}
                />
              );
            case 'json':
              return (
                <ProFormTextArea
                  {...common}
                  rules={[
                    ...rules,
                    {
                      validator: (_: unknown, value?: string) => {
                        if (!value) return Promise.resolve();
                        try {
                          JSON.parse(value);
                          return Promise.resolve();
                        } catch {
                          return Promise.reject(
                            new Error(t('component.schemaForm.json.invalid')),
                          );
                        }
                      },
                    },
                  ]}
                  colProps={{ span: 24 }}
                  fieldProps={{ autoSize: { minRows: 3, maxRows: 8 } }}
                />
              );
            case 'ip':
              return (
                <ProFormText
                  {...common}
                  rules={[
                    ...rules,
                    {
                      pattern: IP_PATTERN,
                      message: t('component.schemaForm.ip.invalid'),
                    },
                  ]}
                />
              );
            default:
              return (
                <ProFormText
                  {...common}
                  placeholder={placeholder}
                  rules={[
                    ...rules,
                    ...(f.rule?.maxLen ? [{ max: f.rule.maxLen }] : []),
                    ...patternRule(f.rule?.pattern),
                    ...(f.format && FORMAT_PATTERNS[f.format]
                      ? [
                          {
                            pattern: FORMAT_PATTERNS[f.format],
                            message: t(
                              `component.schemaForm.format.${f.format}.invalid`,
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              );
          }
        })();
        const title = f.group ?? '';
        const heading =
          renderGroup &&
          title &&
          title !== (active[index - 1]?.group ?? '') &&
          renderGroup(title);
        const chain = chainOf(f);
        if (chain.length === 0) {
          return (
            <Fragment key={f.id ?? f.code}>
              {heading}
              {item}
            </Fragment>
          );
        }
        // 有显示条件：随控制字段的取值显示 / 隐藏（隐藏时表单项卸载，不参与提交与校验）
        const inForm = chain.filter((w) => byCode.has(w.field));
        return (
          <Fragment key={f.id ?? f.code}>
            {heading}
            <ProFormDependency name={inForm.map((w) => [...namePath, w.field])}>
              {(deps: Record<string, unknown>) => {
                const scoped = namePath.reduce<unknown>(
                  (acc, key) => (acc as Record<string, unknown>)?.[key],
                  deps,
                ) as Record<string, unknown> | undefined;
                const shown = chain.every((w) =>
                  w.values.includes(
                    conditionValue(
                      byCode.has(w.field)
                        ? scoped?.[w.field]
                        : baseValues?.[w.field],
                    ),
                  ),
                );
                return shown ? item : null;
              }}
            </ProFormDependency>
          </Fragment>
        );
      })}
    </>
  );
};
