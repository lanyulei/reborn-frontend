/**
 * 元数据驱动的动态字段渲染（通用）：字段定义 → 表格列（useSchemaColumns）、
 * 表单项（SchemaFormItems）与表单值 / 取值互转（valuesToForm / formToValues）。
 * 组件不依赖任何业务域：需要业务数据的字段类型（如「引用」要搜索对端资源）经
 * renderers 由调用方注入；域专有的禁用规则经 isDisabled 注入。
 * 与后端 internal/pkg/formschema 的字段类型一一对应。
 */
import type { ProColumns } from '@ant-design/pro-components';
import {
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { Fragment, useMemo } from 'react';
import { type Translate, useT } from '@/utils/i18n';

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
}

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
  switch (field.type) {
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
    if (v === undefined || v === null || v === '') {
      out[f.code] = null;
      continue;
    }
    switch (f.type) {
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
  rules: { required: boolean; message: string }[];
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
}: {
  fields: readonly F[];
  /** 取值对象在表单值里的路径，如 ['attrs'] */
  namePath: readonly string[];
  /** 域专有的禁用规则（如同步来源维护的只读字段） */
  isDisabled?: (field: F) => boolean | undefined;
  /** 按字段类型注入的渲染器，优先于内置控件 */
  renderers?: Readonly<Record<string, SchemaFieldRenderer<F>>>;
}): React.ReactNode => {
  const t = useT();
  return (
    <>
      {fields
        .filter((f) => !f.deprecated)
        .map((f) => {
          const name = [...namePath, f.code];
          const disabled = isDisabled?.(f);
          const rules = f.required
            ? [
                {
                  required: true,
                  message: t('common.validation.required', { label: f.name }),
                },
              ]
            : [];
          const common: SchemaItemProps = {
            name,
            label: f.name,
            tooltip: f.description || undefined,
            disabled,
            rules,
          };
          const item = (() => {
            const custom = renderers?.[f.type];
            if (custom) return custom(f, common);
            switch (f.type) {
              case 'int':
              case 'float':
                return (
                  <ProFormDigit
                    {...common}
                    // 不设下限时显式放开：数字控件缺省下限是 0，会把负数改成 0
                    min={f.rule?.min ?? Number.MIN_SAFE_INTEGER}
                    max={f.rule?.max}
                    fieldProps={{ precision: f.type === 'int' ? 0 : undefined }}
                  />
                );
              case 'bool':
                return <ProFormSwitch {...common} rules={[]} />;
              case 'enum':
                return (
                  <ProFormSelect
                    {...common}
                    options={(f.enumValues ?? []).map((v) => ({
                      label: f.enumLabels?.[v] ?? v,
                      value: v,
                    }))}
                  />
                );
              case 'datetime':
                return <ProFormDateTimePicker {...common} />;
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
                    rules={[
                      ...rules,
                      ...(f.rule?.maxLen ? [{ max: f.rule.maxLen }] : []),
                      ...patternRule(f.rule?.pattern),
                    ]}
                  />
                );
            }
          })();
          return <Fragment key={f.id ?? f.code}>{item}</Fragment>;
        })}
    </>
  );
};
