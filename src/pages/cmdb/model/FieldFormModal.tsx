/**
 * 字段新建 / 编辑弹窗（自 FieldDrawer 抽出，供模型详情页复用）。
 * 编码与数据类型创建后不可改（历史数据可解释）。
 */
import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { App } from 'antd';
import type React from 'react';
import { createField, listModels, updateField } from '@/services/cmdb/model';
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
  unique?: boolean;
  enumValues?: string[];
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
}

const toParams = (values: FieldFormValues) => ({
  code: values.code,
  name: values.name,
  type: values.type,
  required: values.required ?? false,
  unique: values.unique ?? false,
  enumValues: values.type === 'enum' ? values.enumValues : undefined,
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
  onSuccess: () => void;
}> = ({ open, onOpenChange, modelCode, field, onSuccess }) => {
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
        label={t('pages.cmdb.field.column.name')}
        rules={[
          rules.required(t('pages.cmdb.field.column.name')),
          rules.max(64),
        ]}
      />
      <ProFormSelect
        name="type"
        label={t('pages.cmdb.field.column.type')}
        options={typeOptions}
        disabled={isEdit}
        rules={[rules.select(t('pages.cmdb.field.column.type'))]}
        allowClear={false}
      />
      <ProFormDependency name={['type']}>
        {({ type }) => (
          <>
            {type === 'enum' && (
              <ProFormSelect
                name="enumValues"
                label={t('pages.cmdb.field.form.enumValues')}
                fieldProps={{
                  mode: 'tags',
                  open: false,
                  tokenSeparators: [',', ' '],
                  placeholder: t(
                    'pages.cmdb.field.form.enumValues.placeholder',
                  ),
                }}
                rules={[rules.required(t('pages.cmdb.field.form.enumValues'))]}
              />
            )}
            {type === 'ref' && (
              <ProFormSelect
                name="refModel"
                label={t('pages.cmdb.field.form.refModel')}
                disabled={isEdit}
                showSearch
                request={async () => {
                  const result = await listModels({ page: 1, pageSize: 100 });
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
                <ProFormText
                  name="pattern"
                  label={t('pages.cmdb.field.form.pattern')}
                />
                <ProFormDigit
                  name="minLen"
                  label={t('pages.cmdb.field.form.minLen')}
                  min={0}
                />
                <ProFormDigit
                  name="maxLen"
                  label={t('pages.cmdb.field.form.maxLen')}
                  min={0}
                />
              </>
            )}
            {(type === 'int' || type === 'float') && (
              <>
                <ProFormDigit
                  name="min"
                  label={t('pages.cmdb.field.form.min')}
                />
                <ProFormDigit
                  name="max"
                  label={t('pages.cmdb.field.form.max')}
                />
              </>
            )}
          </>
        )}
      </ProFormDependency>
      <ProFormSwitch
        name="required"
        label={t('pages.cmdb.field.column.required')}
      />
      <ProFormSwitch
        name="unique"
        label={t('pages.cmdb.field.column.unique')}
      />
      <ProFormSwitch
        name="listVisible"
        label={t('pages.cmdb.field.column.listVisible')}
      />
      <ProFormSwitch
        name="indexed"
        label={t('pages.cmdb.field.column.indexed')}
        tooltip={t('pages.cmdb.field.form.indexed.tooltip')}
      />
      <ProFormSwitch
        name="sensitive"
        label={t('pages.cmdb.field.column.sensitive')}
        tooltip={t('pages.cmdb.field.form.sensitive.tooltip')}
      />
      <ProFormSelect
        name="owner"
        label={t('pages.cmdb.field.column.owner')}
        options={ownerOptions}
        allowClear={false}
      />
      <ProFormDigit name="sort" label={t('pages.cmdb.field.column.sort')} />
      <ProFormText
        name="description"
        label={t('pages.cmdb.field.form.description')}
        rules={[rules.max(256)]}
      />
    </>
  );

  return (
    <ModalForm<FieldFormValues>
      key={field ? `edit-field-${field.id}` : `create-field-${modelCode}`}
      title={
        field
          ? t('pages.cmdb.field.edit.title', { name: field.name })
          : t('pages.cmdb.field.create.title')
      }
      width={560}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{ destroyOnHidden: true }}
      initialValues={
        field
          ? {
              code: field.code,
              name: field.name,
              type: field.type,
              required: field.required,
              unique: field.unique,
              enumValues: field.enumValues,
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
            }
          : { type: 'string', owner: 'manual', sort: 0, listVisible: true }
      }
      submitter={editing ? submitter.save : submitter.create}
      onFinish={async (values) => {
        if (field) {
          const {
            code: _code,
            type: _type,
            refModel: _ref,
            ...rest
          } = toParams({ ...values, type: field.type });
          await updateField(modelCode, field.id, rest);
          message.success(t('common.msg.saved'));
          onSuccess();
          return true;
        }
        await createField(modelCode, toParams(values));
        message.success(t('common.msg.created'));
        onSuccess();
        return true;
      }}
    >
      {formItems(editing)}
    </ModalForm>
  );
};
