/**
 * CMDB 资源属性的渲染：字段定义 → 表格列（useAttrColumns）与表单项（AttrFormItems）。
 * 通用的字段渲染与取值转换在 @/components/SchemaForm（与工单表单等共用）；
 * 此处只保留 CMDB 专有的部分：「引用」字段搜索对端资源、同步来源维护的字段只读。
 */
import type { ProColumns } from '@ant-design/pro-components';
import { ProFormSelect } from '@ant-design/pro-components';
import type React from 'react';
import { useCallback } from 'react';
import {
  formToValues,
  renderSchemaValue,
  type SchemaFieldRenderer,
  SchemaFormItems,
  useSchemaColumns,
  valuesToForm,
} from '@/components/SchemaForm';
import { listCIs } from '@/services/cmdb/ci';
import type { CmdbCI, CmdbField } from '@/services/cmdb/typings';
import { type Translate, useT } from '@/utils/i18n';

/** 属性取值在资源记录 / 表单值里的键 */
const ATTRS = 'attrs';
const ATTRS_PATH = [ATTRS] as const;

const ciAttrs = (ci: CmdbCI) => ci.attrs;

/** 单元格展示：按类型格式化属性值 */
export const renderAttrValue: (
  field: CmdbField,
  value: unknown,
  t: Translate,
) => React.ReactNode = renderSchemaValue;

/** 列表列：listVisible 且未废弃的字段，列 key 为 attrs.<code> */
export const useAttrColumns = <T extends CmdbCI>(
  fields: CmdbField[] | undefined,
): ProColumns<T>[] => useSchemaColumns<T>(fields, ATTRS, ciAttrs);

/** 资源属性 → 表单值（json 字段序列化为文本） */
export const attrsToForm: (
  fields: CmdbField[],
  attrs: Record<string, unknown> | undefined,
) => Record<string, unknown> = valuesToForm;

/**
 * 表单值 → 属性：空值转 null（后端按键合并，null 清空）；json 文本解析；
 * datetime 转 RFC3339。
 */
export const formToAttrs: (
  fields: CmdbField[],
  values: Record<string, unknown> | undefined,
) => Record<string, unknown> = formToValues;

/** 表单项：name 统一为 ['attrs', code]，按字段类型选择控件 */
export const AttrFormItems: React.FC<{
  fields: CmdbField[];
  /** 编辑由采集源维护的资源时，同步只读字段禁用（人工资源没有同步来写，可人工维护） */
  syncManaged?: boolean;
}> = ({ fields, syncManaged }) => {
  const t = useT();
  const isDisabled = useCallback(
    (f: CmdbField) => syncManaged && f.owner === 'sync',
    [syncManaged],
  );
  // 「引用」字段：在对端资源类型内按名称搜索
  const renderRef = useCallback<SchemaFieldRenderer<CmdbField>>(
    (f, common) => (
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
    ),
    [t],
  );
  return (
    <SchemaFormItems
      fields={fields}
      namePath={ATTRS_PATH}
      isDisabled={isDisabled}
      renderers={{ ref: renderRef }}
    />
  );
};
