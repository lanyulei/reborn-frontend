/**
 * 字段新建 / 编辑抽屉（自 FieldDrawer 抽出，供模型详情页复用）。
 * 编码与数据类型创建后不可改（历史数据可解释）。
 * 分组（详情布局分区）不入字段接口，保存后经 onSuccess 交由页面落位布局。
 */
import {
  DrawerForm,
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';
import type React from 'react';
import { createField, listAllModels, updateField } from '@/services/cmdb/model';
import type {
  CmdbField,
  CmdbFieldOwner,
  CmdbFieldType,
} from '@/services/cmdb/typings';
import { useFormRules, useOptions, useSubmitter, useT } from '@/utils/i18n';
import {
  CMDB_FIELD_OWNER_META,
  CMDB_FIELD_OWNER_ORDER,
  CMDB_FIELD_TYPE_META,
  CMDB_FIELD_TYPE_ORDER,
} from '../components/meta';

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
  const rules = useFormRules();
  const submitter = useSubmitter();
  const typeOptions = useOptions(CMDB_FIELD_TYPE_META, CMDB_FIELD_TYPE_ORDER);
  const ownerOptions = useOptions(
    CMDB_FIELD_OWNER_META,
    CMDB_FIELD_OWNER_ORDER,
  );
  const editing = !!field;

  const formItems = (isEdit: boolean) => (
    <>
      <ProFormText
        name="code"
        colProps={{ span: 12 }}
        label={t('pages.cmdb.field.column.code')}
        disabled={isEdit}
        rules={
          isEdit
            ? []
            : [
                rules.required(t('pages.cmdb.field.column.code')),
                {
                  pattern: /^[a-z][a-z0-9_]{0,63}$/,
                  message: t('pages.cmdb.field.form.code.pattern'),
                },
              ]
        }
      />
      <ProFormText
        name="name"
        colProps={{ span: 12 }}
        label={t('pages.cmdb.field.column.name')}
        rules={[
          rules.required(t('pages.cmdb.field.column.name')),
          rules.max(64),
        ]}
      />
      <ProFormText
        name="description"
        colProps={{ span: 24 }}
        label={t('pages.cmdb.field.form.description')}
        rules={[rules.max(256)]}
      />
      <ProFormSelect
        name="type"
        colProps={{ span: 12 }}
        label={t('pages.cmdb.field.column.type')}
        options={typeOptions}
        disabled={isEdit}
        rules={[rules.select(t('pages.cmdb.field.column.type'))]}
        allowClear={false}
      />
      {groupOptions.length > 0 && (
        <ProFormSelect
          name="group"
          colProps={{ span: 12 }}
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
        colProps={{ span: 12 }}
        label={t('pages.cmdb.field.column.sort')}
      />
      <ProFormSelect
        name="owner"
        colProps={{ span: 12 }}
        label={t('pages.cmdb.field.column.owner')}
        options={ownerOptions}
        allowClear={false}
      />
      <ProFormDependency name={['type']}>
        {({ type }) => (
          <>
            {type === 'enum' && (
              <ProFormList
                name="enumPairs"
                colProps={{ span: 24 }}
                label={t('pages.cmdb.field.form.enumValues')}
                tooltip={t('pages.cmdb.field.form.enumValues.tooltip')}
                min={1}
                max={100}
                creatorButtonProps={{
                  creatorButtonText: t('pages.cmdb.field.form.enumValues.add'),
                }}
                rules={[
                  {
                    validator: (_: unknown, rows?: { value?: string }[]) =>
                      rows?.some((r) => r.value && r.value.trim() !== '')
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(t('pages.cmdb.field.form.enumValues')),
                          ),
                  },
                ]}
              >
                <ProForm.Group rowProps={{ gutter: 16 }}>
                  <ProFormText
                    name="value"
                    colProps={{ span: 12 }}
                    label={t('pages.cmdb.field.form.enumValues.value')}
                    rules={[
                      rules.required(
                        t('pages.cmdb.field.form.enumValues.value'),
                      ),
                      { max: 64 },
                    ]}
                  />
                  <ProFormText
                    name="label"
                    colProps={{ span: 12 }}
                    label={t('pages.cmdb.field.form.enumValues.label')}
                    tooltip={t('pages.cmdb.field.form.enumValues.label.tip')}
                    rules={[{ max: 64 }]}
                  />
                </ProForm.Group>
              </ProFormList>
            )}
            {type === 'ref' && (
              <ProFormSelect
                name="refModel"
                colProps={{ span: 12 }}
                label={t('pages.cmdb.field.form.refModel')}
                disabled={isEdit}
                showSearch
                request={async () => {
                  const result = await listAllModels();
                  return result.items.map((m) => ({
                    label: `${m.name} (${m.code})`,
                    value: m.code,
                  }));
                }}
                rules={
                  isEdit
                    ? []
                    : [rules.select(t('pages.cmdb.field.form.refModel'))]
                }
              />
            )}
            {type === 'string' && (
              <>
                <ProFormTextArea
                  name="pattern"
                  colProps={{ span: 24 }}
                  label={t('pages.cmdb.field.form.pattern')}
                  fieldProps={{ autoSize: { minRows: 2, maxRows: 6 } }}
                  rules={[
                    {
                      // 后端是 Go（RE2）语法，前端只能做粗校验：能被 JS 解析的一定先拦下
                      // 明显写错的；RE2 特有写法（如 (?i)）放行，由后端最终校验
                      validator: (_: unknown, value?: string) => {
                        if (!value || /\(\?[a-zA-Z]/.test(value)) {
                          return Promise.resolve();
                        }
                        try {
                          new RegExp(value);
                          return Promise.resolve();
                        } catch {
                          return Promise.reject(
                            new Error(
                              t('pages.cmdb.field.form.pattern.invalid'),
                            ),
                          );
                        }
                      },
                    },
                  ]}
                />
                <ProFormDigit
                  name="minLen"
                  colProps={{ span: 12 }}
                  label={t('pages.cmdb.field.form.minLen')}
                  min={0}
                />
                <ProFormDigit
                  name="maxLen"
                  colProps={{ span: 12 }}
                  label={t('pages.cmdb.field.form.maxLen')}
                  min={0}
                />
              </>
            )}
            {(type === 'int' || type === 'float') && (
              <>
                <ProFormDigit
                  name="min"
                  colProps={{ span: 12 }}
                  label={t('pages.cmdb.field.form.min')}
                />
                <ProFormDigit
                  name="max"
                  colProps={{ span: 12 }}
                  label={t('pages.cmdb.field.form.max')}
                />
              </>
            )}
          </>
        )}
      </ProFormDependency>
      <ProFormSwitch
        name="required"
        colProps={{ span: 12 }}
        label={t('pages.cmdb.field.column.required')}
      />
      <ProFormSwitch
        name="listVisible"
        colProps={{ span: 12 }}
        label={t('pages.cmdb.field.column.listVisible')}
      />
      <ProFormSwitch
        name="indexed"
        colProps={{ span: 12 }}
        label={t('pages.cmdb.field.column.indexed')}
        tooltip={t('pages.cmdb.field.form.indexed.tooltip')}
      />
      <ProFormSwitch
        name="sensitive"
        colProps={{ span: 12 }}
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
      {formItems(editing)}
    </DrawerForm>
  );
};
