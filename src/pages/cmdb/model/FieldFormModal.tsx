/**
 * 字段新建 / 编辑抽屉（供模型详情页复用）：通用的配置项来自公共字段库，这里只补 CMDB 专有的
 * 分组、排序、归属与列表展示 / 索引 / 敏感开关，并负责保存。
 * 编码与数据类型创建后不可改（历史数据可解释）。
 * 分组（详情布局分区）不入字段接口，保存后经 onSuccess 交由页面落位布局。
 */
import {
  DrawerForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { App } from 'antd';
import type React from 'react';
import { FieldFormItems } from '@/components/SchemaForm';
import { createField, listAllModels, updateField } from '@/services/cmdb/model';
import type {
  CmdbField,
  CmdbFieldOwner,
  CmdbFieldType,
} from '@/services/cmdb/typings';
import { useOptions, useSubmitter, useT } from '@/utils/i18n';
import {
  CMDB_FIELD_OWNER_META,
  CMDB_FIELD_OWNER_ORDER,
  CMDB_FIELD_TYPE_ORDER,
} from '../components/meta';

/** 与后端校验一致 */
const CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const DESCRIPTION_MAX = 256;
const ENUM_MAX = 100;
const HALF = { span: 12 };

interface FieldFormValues {
  code: string;
  name: string;
  type: CmdbFieldType;
  required?: boolean;
  enumPairs?: { value: string; label?: string }[];
  refModel?: string;
  pattern?: string;
  min?: number;
  max?: number;
  minLen?: number;
  maxLen?: number;
  owner?: CmdbFieldOwner;
  listVisible?: boolean;
  indexed?: boolean;
  sensitive?: boolean;
  sort?: number;
  description?: string;
  /** 所属分组（详情布局分区下标，-1 = 其他/未入组） */
  group?: number;
}

const toParams = (values: FieldFormValues) => ({
  code: values.code,
  name: values.name,
  type: values.type,
  required: values.required ?? false,
  enumValues:
    values.type === 'enum'
      ? (values.enumPairs ?? []).map((p) => p.value.trim())
      : undefined,
  enumLabels:
    values.type === 'enum'
      ? Object.fromEntries(
          (values.enumPairs ?? []).flatMap((p) => {
            const label = p.label?.trim();
            return label ? [[p.value.trim(), label] as const] : [];
          }),
        )
      : undefined,
  refModel: values.type === 'ref' ? values.refModel : undefined,
  rule: {
    pattern: values.pattern || undefined,
    min: values.min,
    max: values.max,
    minLen: values.minLen,
    maxLen: values.maxLen,
  },
  owner: values.owner,
  listVisible: values.listVisible ?? false,
  indexed: values.indexed ?? false,
  sensitive: values.sensitive ?? false,
  sort: values.sort ?? 0,
  description: values.description ?? '',
});

export const FieldFormModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelCode: string;
  /** 编辑目标；缺省新建 */
  field?: CmdbField;
  /** 可选分组（详情布局 attrs 分区）；空数组时不展示分组选择 */
  groupOptions?: { label: string; value: number }[];
  /** 初始分组（分区下标，-1 = 其他）：新建为预设分组，编辑为字段当前所在分组 */
  initialGroup?: number;
  onSuccess: (code: string, group: number) => void;
}> = ({
  open,
  onOpenChange,
  modelCode,
  field,
  groupOptions = [],
  initialGroup,
  onSuccess,
}) => {
  const t = useT();
  const { message } = App.useApp();
  const submitter = useSubmitter();
  const ownerOptions = useOptions(
    CMDB_FIELD_OWNER_META,
    CMDB_FIELD_OWNER_ORDER,
  );
  const editing = !!field;

  /** CMDB 专有的配置项：字段分组、排序、归属 */
  const afterType = (
    <>
      {groupOptions.length > 0 && (
        <ProFormSelect
          name="group"
          colProps={HALF}
          label={t('pages.cmdb.field.form.group')}
          options={[
            ...groupOptions,
            {
              label: t('pages.cmdb.modelDetail.fields.otherGroup'),
              value: -1,
            },
          ]}
          allowClear={false}
        />
      )}
      <ProFormDigit
        name="sort"
        colProps={HALF}
        label={t('pages.cmdb.field.column.sort')}
      />
      <ProFormSelect
        name="owner"
        colProps={HALF}
        label={t('pages.cmdb.field.column.owner')}
        options={ownerOptions}
        allowClear={false}
      />
    </>
  );
  /** CMDB 专有的开关：列表展示、索引、敏感 */
  const switches = (
    <>
      <ProFormSwitch
        name="listVisible"
        colProps={HALF}
        label={t('pages.cmdb.field.column.listVisible')}
      />
      <ProFormSwitch
        name="indexed"
        colProps={HALF}
        label={t('pages.cmdb.field.column.indexed')}
        tooltip={t('pages.cmdb.field.form.indexed.tooltip')}
      />
      <ProFormSwitch
        name="sensitive"
        colProps={HALF}
        label={t('pages.cmdb.field.column.sensitive')}
        tooltip={t('pages.cmdb.field.form.sensitive.tooltip')}
      />
    </>
  );

  return (
    <DrawerForm<FieldFormValues>
      key={
        field
          ? `edit-field-${field.id}`
          : `create-field-${modelCode}-g${initialGroup ?? -1}`
      }
      title={
        field
          ? t('pages.cmdb.field.edit.title', { name: field.name })
          : t('pages.cmdb.field.create.title')
      }
      grid
      rowProps={{ gutter: 16 }}
      open={open}
      onOpenChange={onOpenChange}
      drawerProps={{ destroyOnHidden: true }}
      width={560}
      initialValues={
        field
          ? {
              code: field.code,
              name: field.name,
              type: field.type,
              required: field.required,
              enumPairs: (field.enumValues ?? []).map((v) => ({
                value: v,
                label: field.enumLabels?.[v],
              })),
              refModel: field.refModel,
              pattern: field.rule?.pattern,
              min: field.rule?.min,
              max: field.rule?.max,
              minLen: field.rule?.minLen,
              maxLen: field.rule?.maxLen,
              owner: field.owner,
              listVisible: field.listVisible,
              indexed: field.indexed,
              sensitive: field.sensitive,
              sort: field.sort,
              description: field.description,
              group: initialGroup ?? -1,
            }
          : {
              type: 'string',
              owner: 'manual',
              sort: 0,
              listVisible: true,
              group: initialGroup ?? -1,
            }
      }
      submitter={editing ? submitter.save : submitter.create}
      onFinish={async (values) => {
        const group = values.group ?? -1;
        if (field) {
          const {
            code: _code,
            type: _type,
            refModel: _ref,
            ...rest
          } = toParams({ ...values, type: field.type });
          await updateField(modelCode, field.id, rest);
          message.success(t('common.msg.saved'));
          void onSuccess(field.code, group);
          return true;
        }
        await createField(modelCode, toParams(values));
        message.success(t('common.msg.created'));
        void onSuccess(values.code, group);
        return true;
      }}
    >
      <FieldFormItems
        types={CMDB_FIELD_TYPE_ORDER}
        // 编码与数据类型创建后不可改（历史数据可解释）
        lockIdentity={editing}
        code={{
          pattern: CODE_PATTERN,
          patternMessage: t('pages.cmdb.field.form.code.pattern'),
        }}
        descriptionMax={DESCRIPTION_MAX}
        enumMode="pairs"
        enumMax={ENUM_MAX}
        minLen
        requiredPlacement="switches"
        afterType={afterType}
        switches={switches}
        refOptions={async () => {
          const result = await listAllModels();
          return result.items.map((m) => ({
            label: `${m.name} (${m.code})`,
            value: m.code,
          }));
        }}
      />
    </DrawerForm>
  );
};
