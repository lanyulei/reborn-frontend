/**
 * 元数据驱动的属性渲染：字段定义 → 表格列（useAttrColumns）与表单项（AttrFormItems）。
 * 新增字段类型只需在 renderers 注册一项。
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
import { Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type React from 'react';
import { Fragment, useMemo } from 'react';
import { listCIs } from '@/services/cmdb/ci';
import type { CmdbCI, CmdbField } from '@/services/cmdb/typings';
import { type Translate, useT } from '@/utils/i18n';

const IP_PATTERN =
  /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}|[0-9a-fA-F:]+)$/;

/** 单元格展示：按类型格式化属性值 */
export const renderAttrValue = (
  field: CmdbField,
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
    case 'enum':
      return <Tag>{String(value)}</Tag>;
    default:
      return String(value);
  }
};

/** 列表列：listVisible 且未废弃的字段，列 key 为 attrs.<code> */
export const useAttrColumns = <T extends CmdbCI>(
  fields: CmdbField[] | undefined,
): ProColumns<T>[] => {
  const t = useT();
  return useMemo(
    () =>
      (fields ?? [])
        .filter((f) => f.listVisible && !f.deprecated)
        .map<ProColumns<T>>((f) => ({
          title: f.name,
          key: `attrs.${f.code}`,
          dataIndex: ['attrs', f.code],
          search: false,
          ellipsis: true,
          render: (_, record) => renderAttrValue(f, record.attrs?.[f.code], t),
        })),
    [fields, t],
  );
};

/** 资源属性 → 表单值（json 字段序列化为文本） */
export const attrsToForm = (
  fields: CmdbField[],
  attrs: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = attrs?.[f.code];
    if (v === undefined || v === null) continue;
    out[f.code] = f.type === 'json' ? JSON.stringify(v, null, 2) : v;
  }
  return out;
};

/**
 * 表单值 → 属性：空值转 null（后端按键合并，null 清空）；json 文本解析；
 * datetime 转 RFC3339。
 */
export const formToAttrs = (
  fields: CmdbField[],
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

/** 表单项：name 统一为 ['attrs', code]，按字段类型选择控件 */
export const AttrFormItems: React.FC<{
  fields: CmdbField[];
  /** 编辑时同步只读字段禁用 */
  editing?: boolean;
}> = ({ fields, editing }) => {
  const t = useT();
  return (
    <>
      {fields
        .filter((f) => !f.deprecated)
        .map((f) => {
          const name = ['attrs', f.code];
          const disabled = editing && f.owner === 'sync';
          const rules = f.required
            ? [
                {
                  required: true,
                  message: t('common.validation.required', { label: f.name }),
                },
              ]
            : [];
          const common = {
            name,
            label: f.name,
            tooltip: f.description || undefined,
            disabled,
            rules,
          };
          const item = (() => {
            switch (f.type) {
              case 'int':
              case 'float':
                return (
                  <ProFormDigit
                    {...common}
                    min={f.rule?.min}
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
                      label: v,
                      value: v,
                    }))}
                  />
                );
              case 'datetime':
                return <ProFormDateTimePicker {...common} />;
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
                              new Error(t('pages.cmdb.ci.form.json.invalid')),
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
                        message: t('pages.cmdb.ci.form.ip.invalid'),
                      },
                    ]}
                  />
                );
              case 'ref':
                return (
                  <ProFormSelect
                    {...common}
                    showSearch
                    debounceTime={300}
                    placeholder={t('pages.cmdb.ci.form.ref.placeholder')}
                    fieldProps={{ filterOption: false }}
                    request={async ({ keyWords }) => {
                      const result = await listCIs({
                        page: 1,
                        pageSize: 20,
                        modelCode: f.refModel,
                        keyword: keyWords || undefined,
                      });
                      return result.items.map((ci) => ({
                        label: ci.name,
                        value: ci.id,
                      }));
                    }}
                  />
                );
              default:
                return (
                  <ProFormText
                    {...common}
                    rules={[
                      ...rules,
                      ...(f.rule?.maxLen ? [{ max: f.rule.maxLen }] : []),
                      ...(f.rule?.pattern
                        ? [{ pattern: new RegExp(f.rule.pattern) }]
                        : []),
                    ]}
                  />
                );
            }
          })();
          return <Fragment key={f.id}>{item}</Fragment>;
        })}
    </>
  );
};
