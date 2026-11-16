/**
 * 模板表单的字段编辑器（表单受控，值为字段定义列表）：表格展示全部字段，
 * 可新增、编辑、删除、上移 / 下移；单个字段在弹窗里编辑。
 */
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, Space, Table, Tag, Typography } from 'antd';
import type React from 'react';
import { useState } from 'react';
import { DeleteConfirmLink } from '@/components/TableActions';
import type {
  TicketFieldType,
  TicketFormField,
} from '@/services/ticket/typings';
import { useEnumText, useFormRules, useOptions, useT } from '@/utils/i18n';
import { FIELD_TYPE_META, FIELD_TYPE_ORDER } from '../components/meta';

/** 与后端 proto 校验一致的上限 */
export const FIELD_MAX = 50;
const CODE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/;
/** 保留字段码：流程变量里表示工单优先级 */
const RESERVED_CODE = 'priority';
const NAME_MAX = 64;
const DESCRIPTION_MAX = 255;
const PATTERN_MAX = 255;
const ENUM_MAX = 50;
const HALF = { span: 12 };

const NUMERIC: readonly TicketFieldType[] = ['int', 'float'];
const TEXTUAL: readonly TicketFieldType[] = ['string', 'text'];

interface FieldValues {
  name: string;
  code: string;
  type: TicketFieldType;
  required?: boolean;
  enumValues?: string[];
  min?: number;
  max?: number;
  /** 界面不提供编辑，仅原样带回（经接口配置的值不因编辑而丢失） */
  minLen?: number;
  maxLen?: number;
  pattern?: string;
  description?: string;
}

const toValues = (field: TicketFormField): FieldValues => ({
  name: field.name,
  code: field.code,
  type: field.type,
  required: field.required,
  enumValues: field.enumValues,
  min: field.rule?.min,
  max: field.rule?.max,
  minLen: field.rule?.minLen,
  maxLen: field.rule?.maxLen,
  pattern: field.rule?.pattern,
  description: field.description,
});

/** 只保留与类型相符的规则 */
const toField = (values: FieldValues): TicketFormField => ({
  name: values.name.trim(),
  code: values.code,
  type: values.type,
  required: !!values.required,
  enumValues: values.type === 'enum' ? (values.enumValues ?? []) : undefined,
  rule: {
    ...(NUMERIC.includes(values.type)
      ? { min: values.min ?? undefined, max: values.max ?? undefined }
      : {}),
    ...(TEXTUAL.includes(values.type)
      ? {
          minLen: values.minLen ?? undefined,
          maxLen: values.maxLen ?? undefined,
          pattern: values.pattern || undefined,
        }
      : {}),
  },
  description: values.description ?? '',
});

export const FieldsEditor: React.FC<{
  value?: TicketFormField[];
  onChange?: (value: TicketFormField[]) => void;
}> = ({ value, onChange }) => {
  const t = useT();
  const rules = useFormRules();
  const typeText = useEnumText(FIELD_TYPE_META);
  const typeOptions = useOptions(FIELD_TYPE_META, FIELD_TYPE_ORDER);
  /** 正在编辑的字段下标；-1 = 新增；undefined = 弹窗关闭 */
  const [editing, setEditing] = useState<number>();
  const fields = value ?? [];

  const move = (index: number, delta: -1 | 1) => {
    const next = [...fields];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange?.(next);
  };

  return (
    <>
      <Table<TicketFormField>
        size="small"
        rowKey="code"
        pagination={false}
        dataSource={fields}
        locale={{ emptyText: t('pages.ticket.field.empty') }}
        columns={[
          {
            title: t('pages.ticket.field.name'),
            dataIndex: 'name',
            ellipsis: true,
            render: (_, record) => (
              <>
                {record.name}
                {record.required && (
                  <Typography.Text type="danger"> *</Typography.Text>
                )}
              </>
            ),
          },
          {
            title: t('pages.ticket.field.code'),
            dataIndex: 'code',
            ellipsis: true,
            render: (_, record) => (
              <Typography.Text code>{record.code}</Typography.Text>
            ),
          },
          {
            title: t('pages.ticket.field.type'),
            dataIndex: 'type',
            width: 110,
            render: (_, record) => <Tag>{typeText(record.type)}</Tag>,
          },
          {
            title: t('common.column.action'),
            width: 170,
            render: (_, record, index) => (
              <Space size={12}>
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowUpOutlined />}
                  aria-label={t('pages.ticket.field.moveUp')}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowDownOutlined />}
                  aria-label={t('pages.ticket.field.moveDown')}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, 1)}
                />
                <a onClick={() => setEditing(index)}>
                  {t('common.action.edit')}
                </a>
                <DeleteConfirmLink
                  title={t('pages.ticket.field.delete.title')}
                  description={t('pages.ticket.field.delete.description', {
                    name: record.name,
                  })}
                  onConfirm={() =>
                    onChange?.(fields.filter((_f, i) => i !== index))
                  }
                />
              </Space>
            ),
          },
        ]}
      />
      <Button
        block
        type="dashed"
        icon={<PlusOutlined />}
        style={{ marginTop: 12 }}
        disabled={fields.length >= FIELD_MAX}
        onClick={() => setEditing(-1)}
      >
        {t('pages.ticket.field.add')}
      </Button>

      {editing !== undefined && (
        <ModalForm<FieldValues>
          title={t(
            editing === -1
              ? 'pages.ticket.field.add'
              : 'pages.ticket.field.edit',
          )}
          width={560}
          grid
          rowProps={{ gutter: 16 }}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={
            editing === -1 ? { type: 'string' } : toValues(fields[editing])
          }
          submitter={{
            searchConfig: {
              submitText: t('common.action.confirm'),
              resetText: t('common.action.cancel'),
            },
          }}
          onFinish={async (values) => {
            const field = toField(values);
            onChange?.(
              editing === -1
                ? [...fields, field]
                : fields.map((f, i) => (i === editing ? field : f)),
            );
            return true;
          }}
        >
          <ProFormText
            colProps={HALF}
            name="name"
            label={t('pages.ticket.field.name')}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t('common.validation.required', {
                  label: t('pages.ticket.field.name'),
                }),
              },
              rules.max(NAME_MAX),
            ]}
          />
          <ProFormText
            colProps={HALF}
            name="code"
            label={t('pages.ticket.field.code')}
            tooltip={t('pages.ticket.field.code.tooltip')}
            rules={[
              rules.required(t('pages.ticket.field.code')),
              {
                pattern: CODE_PATTERN,
                message: t('pages.ticket.field.code.pattern'),
              },
              {
                validator: (_: unknown, code?: string) => {
                  if (code === RESERVED_CODE) {
                    return Promise.reject(
                      new Error(t('pages.ticket.field.code.reserved')),
                    );
                  }
                  if (fields.some((f, i) => i !== editing && f.code === code)) {
                    return Promise.reject(
                      new Error(t('pages.ticket.field.code.duplicate')),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          />
          <ProFormSelect
            colProps={HALF}
            name="type"
            label={t('pages.ticket.field.type')}
            allowClear={false}
            options={typeOptions}
            rules={[rules.select(t('pages.ticket.field.type'))]}
          />
          <ProFormSwitch
            colProps={HALF}
            name="required"
            label={t('pages.ticket.field.required')}
          />
          <ProFormDependency name={['type']}>
            {({ type }: { type?: TicketFieldType }) => {
              if (type === 'enum') {
                return (
                  <ProFormSelect
                    name="enumValues"
                    label={t('pages.ticket.field.enumValues')}
                    placeholder={t('pages.ticket.field.enumValues.placeholder')}
                    fieldProps={{
                      mode: 'tags',
                      maxCount: ENUM_MAX,
                      open: false,
                      suffix: null,
                    }}
                    rules={[
                      {
                        required: true,
                        type: 'array',
                        message: t('common.validation.required', {
                          label: t('pages.ticket.field.enumValues'),
                        }),
                      },
                      {
                        validator: (_: unknown, items?: string[]) =>
                          (items ?? []).some(
                            (v) => !v.trim() || v.length > NAME_MAX,
                          )
                            ? Promise.reject(
                                new Error(
                                  t('pages.ticket.field.enumValues.invalid', {
                                    max: NAME_MAX,
                                  }),
                                ),
                              )
                            : Promise.resolve(),
                      },
                    ]}
                  />
                );
              }
              if (type && NUMERIC.includes(type)) {
                return (
                  <>
                    <ProFormDigit
                      colProps={HALF}
                      name="min"
                      label={t('pages.ticket.field.min')}
                      // 数字控件缺省下限是 0，这里要允许负数
                      min={Number.MIN_SAFE_INTEGER}
                      fieldProps={{ precision: type === 'int' ? 0 : undefined }}
                    />
                    <ProFormDependency name={['min']}>
                      {({ min }: { min?: number }) => (
                        <ProFormDigit
                          colProps={HALF}
                          name="max"
                          label={t('pages.ticket.field.max')}
                          min={Number.MIN_SAFE_INTEGER}
                          fieldProps={{
                            precision: type === 'int' ? 0 : undefined,
                          }}
                          rules={[
                            {
                              validator: (_: unknown, max?: number) =>
                                min != null && max != null && max < min
                                  ? Promise.reject(
                                      new Error(
                                        t('pages.ticket.field.max.invalid'),
                                      ),
                                    )
                                  : Promise.resolve(),
                            },
                          ]}
                        />
                      )}
                    </ProFormDependency>
                  </>
                );
              }
              if (type && TEXTUAL.includes(type)) {
                return (
                  <>
                    <ProFormDigit
                      colProps={HALF}
                      name="maxLen"
                      label={t('pages.ticket.field.maxLen')}
                      min={1}
                      fieldProps={{ precision: 0 }}
                    />
                    <ProFormText
                      colProps={HALF}
                      name="pattern"
                      label={t('pages.ticket.field.pattern')}
                      tooltip={t('pages.ticket.field.pattern.tooltip')}
                      rules={[rules.max(PATTERN_MAX)]}
                    />
                  </>
                );
              }
              return null;
            }}
          </ProFormDependency>
          <ProFormTextArea
            name="description"
            label={t('pages.ticket.field.description')}
            fieldProps={{
              maxLength: DESCRIPTION_MAX,
              showCount: true,
              autoSize: { minRows: 2, maxRows: 4 },
            }}
          />
        </ModalForm>
      )}
    </>
  );
};

export default FieldsEditor;
