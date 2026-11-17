/**
 * 模板表单的字段编辑器（表单受控，值为字段定义列表）：表格展示全部字段，可新增（末尾或某行
 * 下方）、编辑、复制、删除、拖动把手或上移 / 下移排序、按名称 / 字段码搜索，并可预览提单人
 * 看到的表单；单个字段在弹窗里编辑（表单项来自公共字段库）。字段被所绑定流程引用（表单权限、
 * 分支条件、处理人规则）或被别的字段当作显示条件时，编辑与删除前给出提醒；同名分组被隔开时
 * 给出提醒并可一键归拢，分组可整组改名。
 */
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  HolderOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { ModalForm, ProForm } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_TYPES,
  type FieldControl,
  FieldFormItems,
  fromEnumPairs,
  groupFields,
  MULTIPLE_TYPES,
  NUMERIC_TYPES,
  PLACEHOLDER_TYPES,
  SchemaFormItems,
  schemaInitialValues,
  TEXTUAL_TYPES,
  toEnumPairs,
} from '@/components/SchemaForm';
import { DeleteConfirmLink } from '@/components/TableActions';
import type {
  FormColumns,
  TicketFieldType,
  TicketFormField,
} from '@/services/ticket/typings';
import { getDefinition, listDefinitions } from '@/services/workflow/definition';
import { useEnumText, useT } from '@/utils/i18n';
import { fetchAllPages } from '@/utils/paging';
import {
  FIELD_TYPE_META,
  FIELD_TYPE_ORDER,
  formColSpan,
  renderFormGroup,
  TICKET_FIELD_RENDERERS,
} from '../components/meta';
import { fieldUsage } from './fieldUsage';

/** 与后端 proto 校验一致的上限 */
export const FIELD_MAX = 50;
const CODE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/;
const CODE_MAX = 32;
/** 保留字段码：流程变量里表示工单优先级 */
const RESERVED_CODE = 'priority';
const NAME_MAX = 64;
const DESCRIPTION_MAX = 255;
const PATTERN_MAX = 255;
const ENUM_MAX = 50;
const CONDITION_VALUES_MAX = 20;
const GROUP_MAX = 32;
/** 字段多于这个数时显示搜索框 */
const SEARCH_THRESHOLD = 8;
const DATA_PATH = ['data'] as const;

interface FieldValues {
  name: string;
  code: string;
  type: TicketFieldType;
  required?: boolean;
  enumPairs?: { value: string; label?: string }[];
  min?: number;
  max?: number;
  /** 界面不提供编辑，仅原样带回（经接口配置的值不因编辑而丢失） */
  minLen?: number;
  maxLen?: number;
  pattern?: string;
  description?: string;
  multiple?: boolean;
  format?: string;
  unit?: string;
  precision?: number;
  placeholder?: string;
  /** 是否类型在表单里是 'true' / 'false' */
  defaultValue?: unknown;
  group?: string;
  showWhenField?: string;
  showWhenValues?: string[];
}

const toValues = (field: TicketFormField): FieldValues => ({
  name: field.name,
  code: field.code,
  type: field.type,
  required: field.required,
  enumPairs: toEnumPairs(field.enumValues, field.enumLabels),
  min: field.rule?.min,
  max: field.rule?.max,
  minLen: field.rule?.minLen,
  maxLen: field.rule?.maxLen,
  pattern: field.rule?.pattern,
  description: field.description,
  multiple: field.multiple,
  format: field.format || undefined,
  unit: field.unit,
  precision: field.precision,
  placeholder: field.placeholder,
  defaultValue:
    typeof field.defaultValue === 'boolean'
      ? String(field.defaultValue)
      : field.defaultValue,
  group: field.group,
  showWhenField: field.showWhen?.field,
  showWhenValues: field.showWhen?.values,
});

/** 初始值只保留与类型相符的（换过类型后表单里可能留着别的类型的值） */
const defaultOf = (
  type: TicketFieldType,
  value: unknown,
  enumValues: readonly string[],
  multiple: boolean,
): unknown => {
  if (!DEFAULT_TYPES.includes(type) || multiple) return undefined;
  if (type === 'bool') {
    return value === 'true' ? true : value === 'false' ? false : undefined;
  }
  if (NUMERIC_TYPES.includes(type)) {
    return typeof value === 'number' ? value : undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  if (type === 'enum') return enumValues.includes(value) ? value : undefined;
  return value;
};

/** 只保留与类型相符的配置 */
const toField = (values: FieldValues): TicketFormField => {
  const { type } = values;
  const isEnum = type === 'enum';
  const numeric = NUMERIC_TYPES.includes(type);
  const { enumValues, enumLabels } = fromEnumPairs(values.enumPairs);
  const multiple = MULTIPLE_TYPES.includes(type) && !!values.multiple;
  const showValues = values.showWhenValues ?? [];
  return {
    name: values.name.trim(),
    code: values.code,
    type,
    required: !!values.required,
    enumValues: isEnum ? enumValues : undefined,
    enumLabels: isEnum ? enumLabels : undefined,
    rule: {
      ...(numeric
        ? { min: values.min ?? undefined, max: values.max ?? undefined }
        : {}),
      ...(TEXTUAL_TYPES.includes(type)
        ? {
            minLen: values.minLen ?? undefined,
            maxLen: values.maxLen ?? undefined,
            // 文本框里可能带进换行：正则是单行的，保存时去掉
            pattern: values.pattern?.replace(/[\r\n]/g, '') || undefined,
          }
        : {}),
    },
    description: values.description ?? '',
    multiple: multiple || undefined,
    format: type === 'string' ? values.format || undefined : undefined,
    unit: numeric ? values.unit?.trim() || undefined : undefined,
    precision: type === 'float' ? (values.precision ?? undefined) : undefined,
    placeholder: PLACEHOLDER_TYPES.includes(type)
      ? values.placeholder?.trim() || undefined
      : undefined,
    defaultValue: defaultOf(type, values.defaultValue, enumValues, multiple),
    group: values.group?.trim() || undefined,
    showWhen:
      values.showWhenField && showValues.length > 0
        ? {
            field: values.showWhenField,
            values: showValues.slice(0, CONDITION_VALUES_MAX),
          }
        : undefined,
  };
};

/** 字段作为显示条件的控制字段时可取的值；不能做控制字段返回 undefined */
const controlValues = (field: TicketFormField): string[] | undefined => {
  if (field.multiple) return undefined;
  if (field.type === 'enum') return field.enumValues ?? [];
  if (field.type === 'bool') return ['true', 'false'];
  return undefined;
};

/**
 * 修正显示条件：控制字段必须排在前面、是单选下拉或是否字段，取值须是它能取到的值。
 * 排序、改类型、删可选项之后不再成立的条件在这里去掉（否则保存时后端会拒绝）。
 */
const sanitize = (
  fields: TicketFormField[],
): { fields: TicketFormField[]; dropped: number } => {
  let dropped = 0;
  const out = fields.map((field, index) => {
    const when = field.showWhen;
    if (!when) return field;
    const control = fields.slice(0, index).find((f) => f.code === when.field);
    const allowed = (control && controlValues(control)) ?? [];
    const values = when.values.filter((v) => allowed.includes(v));
    if (values.length === when.values.length) return field;
    dropped += 1;
    return {
      ...field,
      showWhen: values.length > 0 ? { field: when.field, values } : undefined,
    };
  });
  return { fields: out, dropped };
};

/** 字段某个取值的展示文字：是否 → 是 / 否，下拉 → 展示值 */
const valueLabel = (
  field: TicketFormField | undefined,
  value: unknown,
  t: (id: string) => string,
): string => {
  const text = String(value);
  if (field?.type === 'bool') {
    return t(`component.schemaForm.field.bool.${text}`);
  }
  return field?.enumLabels?.[text] ?? text;
};

/** 拖动排序时的落点指示线：落在目标行的上沿或下沿 */
const useStyles = createStyles(({ token, css }) => ({
  dropBefore: css`
    & > td {
      box-shadow: inset 0 2px 0 ${token.colorPrimary};
    }
  `,
  dropAfter: css`
    & > td {
      box-shadow: inset 0 -2px 0 ${token.colorPrimary};
    }
  `,
}));

/** 所绑定流程里各字段的引用情况（字段码 → 引用它的节点名）；查不到（无权限等）时为空 */
const useFieldUsage = (workflowKey?: string, templateId?: string) => {
  const [usage, setUsage] = useState<Map<string, string[]>>(new Map());
  useEffect(() => {
    setUsage(new Map());
    if (!workflowKey) return;
    let stale = false;
    fetchAllPages((page, pageSize) =>
      listDefinitions({ page, pageSize }, { silent: true }),
    )
      .then(async (items) => {
        const definition = items.find((d) => d.key === workflowKey);
        if (!definition) return;
        const { draft } = await getDefinition(definition.id, { silent: true });
        if (!stale) setUsage(fieldUsage(draft, templateId));
      })
      // 提醒只是辅助：查不到就不提醒
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [workflowKey, templateId]);
  return usage;
};

export const FieldsEditor: React.FC<{
  value?: TicketFormField[];
  onChange?: (value: TicketFormField[]) => void;
  /** 所编辑的模板 ID（新建时没有）：用于识别流程里按模板配置的字段权限 */
  templateId?: string;
}> = ({ value, onChange, templateId }) => {
  const t = useT();
  const { message } = App.useApp();
  const { styles } = useStyles();
  const typeText = useEnumText(FIELD_TYPE_META);
  const form = Form.useFormInstance();
  const columns = Form.useWatch('formColumns', form) as FormColumns | undefined;
  const workflowKey = Form.useWatch('workflowKey', form) as string | undefined;
  const usage = useFieldUsage(workflowKey, templateId);
  /**
   * 字段弹窗：index = 正在编辑的字段下标（新增时没有）；at = 新字段插入的位置。
   * undefined = 弹窗关闭
   */
  const [editing, setEditing] = useState<{ index?: number; at: number }>();
  const [previewing, setPreviewing] = useState(false);
  /** 正在拖动的行与拖到的行（字段下标） */
  const [dragging, setDragging] = useState<number>();
  const [over, setOver] = useState<number>();
  const [keyword, setKeyword] = useState('');
  /** 正在改名的分组：from 原名，to 输入中的新名 */
  const [renaming, setRenaming] = useState<{ from: string; to: string }>();
  const fields = useMemo(() => value ?? [], [value]);

  const search = keyword.trim().toLowerCase();
  const shown = search
    ? fields.filter(
        (f) =>
          f.name.toLowerCase().includes(search) ||
          f.code.toLowerCase().includes(search),
      )
    : fields;
  // 搜索时表格只是全部字段的一部分：不排序，免得落点与看到的不一致
  const sortable = !search;

  const commit = (next: TicketFormField[]) => {
    const result = sanitize(next);
    onChange?.(result.fields);
    if (result.dropped > 0) {
      message.info(
        t('pages.ticket.field.condition.dropped', { n: result.dropped }),
      );
    }
  };

  const moveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= fields.length) return;
    const next = [...fields];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  const endDrag = () => {
    setDragging(undefined);
    setOver(undefined);
  };

  const duplicate = (index: number) => {
    const source = fields[index];
    const taken = new Set(fields.map((f) => f.code));
    // 字段码加后缀并保证唯一、不超长
    let code = '';
    for (let n = 1; !code || taken.has(code); n += 1) {
      const suffix = n === 1 ? '_copy' : `_copy${n}`;
      code = `${source.code.slice(0, CODE_MAX - suffix.length)}${suffix}`;
    }
    const copy: TicketFormField = {
      ...source,
      code,
      name: t('pages.ticket.field.copy.name', {
        name: source.name.slice(0, NAME_MAX - 8),
      }),
    };
    commit([...fields.slice(0, index + 1), copy, ...fields.slice(index + 1)]);
  };

  /** 新字段的缺省字段码：field_N，取第一个没被占用的 */
  const nextCode = () => {
    const taken = new Set(fields.map((f) => f.code));
    let n = fields.length + 1;
    while (taken.has(`field_${n}`)) n += 1;
    return `field_${n}`;
  };

  /** 引用提醒的文字；没有被引用返回 undefined */
  const usageText = (code?: string) => {
    const nodes = code ? usage.get(code) : undefined;
    return nodes?.length
      ? t('pages.ticket.field.usage', { nodes: nodes.join('、') })
      : undefined;
  };

  /** 以这个字段为显示条件的字段：删除它时这些条件会一并去掉，删除前说明 */
  const dependentsText = (code: string) => {
    const names = fields
      .filter((f) => f.showWhen?.field === code)
      .map((f) => f.name);
    return names.length
      ? t('pages.ticket.field.delete.dependents', { names: names.join('、') })
      : undefined;
  };

  // 同名分组被别的字段隔开：表单里会出现多个同名标题
  const splitGroups: string[] = [];
  const seenGroups = new Set<string>();
  for (const segment of groupFields(fields)) {
    if (!segment.title) continue;
    if (seenGroups.has(segment.title)) {
      if (!splitGroups.includes(segment.title)) splitGroups.push(segment.title);
    }
    seenGroups.add(segment.title);
  }

  /** 把同组的字段挪到一起（跟在该组第一个字段后面，组内顺序不变） */
  const regroup = () => {
    const next: TicketFormField[] = [];
    const done = new Set<string>();
    for (const field of fields) {
      if (!field.group) next.push(field);
      else if (!done.has(field.group)) {
        done.add(field.group);
        next.push(...fields.filter((f) => f.group === field.group));
      }
    }
    commit(next);
  };

  const renameGroup = () => {
    if (!renaming) return;
    const to = renaming.to.trim() || undefined;
    commit(
      fields.map((f) => (f.group === renaming.from ? { ...f, group: to } : f)),
    );
    setRenaming(undefined);
  };

  // 可作为显示条件控制字段的是排在它前面的（新字段按插入位置算）
  const earlier = editing ? fields.slice(0, editing.index ?? editing.at) : [];
  const controls: FieldControl[] = earlier.flatMap((f) => {
    const values = controlValues(f);
    if (!values?.length) return [];
    return [
      {
        code: f.code,
        name: f.name,
        options: values.map((v) => ({ value: v, label: valueLabel(f, v, t) })),
      },
    ];
  });
  const groupNames = [
    ...new Set(fields.map((f) => f.group ?? '').filter(Boolean)),
  ];
  const editingField =
    editing?.index !== undefined ? fields[editing.index] : undefined;
  const editingUsage = usageText(editingField?.code);
  const colSpan = formColSpan(columns);
  const full = fields.length >= FIELD_MAX;

  return (
    <>
      {(fields.length > SEARCH_THRESHOLD || keyword) && (
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t('pages.ticket.field.search')}
          style={{ marginBottom: 8 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      )}
      <Table<TicketFormField>
        size="small"
        rowKey="code"
        pagination={false}
        dataSource={shown}
        locale={{
          emptyText: t(
            search
              ? 'pages.ticket.field.search.empty'
              : 'pages.ticket.field.empty',
          ),
        }}
        // 拖动把手排序，落点用指示线标出；键盘用户用上移 / 下移
        onRow={(record) => {
          const index = fields.indexOf(record);
          return {
            className:
              dragging !== undefined && over === index && dragging !== index
                ? dragging > index
                  ? styles.dropBefore
                  : styles.dropAfter
                : undefined,
            style: { opacity: dragging === index ? 0.4 : undefined },
            onDragOver: (e) => {
              if (dragging === undefined) return;
              e.preventDefault();
              setOver(index);
            },
            onDrop: (e) => {
              e.preventDefault();
              if (dragging !== undefined) moveTo(dragging, index);
              endDrag();
            },
          };
        }}
        columns={[
          {
            key: 'drag',
            width: 28,
            render: (_, record) =>
              sortable && (
                <span
                  draggable
                  style={{ cursor: 'grab' }}
                  title={t('pages.ticket.field.drag')}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    // 部分浏览器要求带数据才开始拖动
                    e.dataTransfer.setData('text/plain', record.code);
                    // 拖的是把手，跟手显示的是整行
                    const row = e.currentTarget.closest('tr');
                    if (row) e.dataTransfer.setDragImage(row, 0, 0);
                    setDragging(fields.indexOf(record));
                  }}
                  onDragEnd={endDrag}
                >
                  <HolderOutlined aria-hidden="true" />
                </span>
              ),
          },
          {
            title: t('component.schemaForm.field.name'),
            dataIndex: 'name',
            ellipsis: true,
            render: (_, record) => {
              const when = record.showWhen;
              const control = when
                ? fields.find((f) => f.code === when.field)
                : undefined;
              const hasDefault =
                record.defaultValue !== undefined &&
                record.defaultValue !== null;
              return (
                <>
                  {record.name}
                  {record.required && (
                    <Typography.Text type="danger"> *</Typography.Text>
                  )}
                  {record.group && (
                    <>
                      <Typography.Text type="secondary"> · </Typography.Text>
                      <Typography.Link
                        title={t('pages.ticket.field.group.rename')}
                        onClick={() =>
                          setRenaming({
                            from: record.group ?? '',
                            to: record.group ?? '',
                          })
                        }
                      >
                        {record.group}
                      </Typography.Link>
                    </>
                  )}
                  {when && (
                    <Tooltip
                      title={t('pages.ticket.field.tag.condition.tip', {
                        field: control?.name ?? when.field,
                        values: when.values
                          .map((v) => valueLabel(control, v, t))
                          .join('、'),
                      })}
                    >
                      <Tag style={{ marginInlineStart: 8 }}>
                        {t('pages.ticket.field.tag.condition')}
                      </Tag>
                    </Tooltip>
                  )}
                  {hasDefault && (
                    <Tooltip
                      title={t('pages.ticket.field.tag.default.tip', {
                        value: valueLabel(record, record.defaultValue, t),
                      })}
                    >
                      <Tag style={{ marginInlineStart: when ? 0 : 8 }}>
                        {t('pages.ticket.field.tag.default')}
                      </Tag>
                    </Tooltip>
                  )}
                </>
              );
            },
          },
          {
            title: t('component.schemaForm.field.code'),
            dataIndex: 'code',
            ellipsis: true,
            render: (_, record) => (
              <Typography.Text code>{record.code}</Typography.Text>
            ),
          },
          {
            title: t('component.schemaForm.field.type'),
            dataIndex: 'type',
            width: 120,
            render: (_, record) => (
              <Tag>
                {typeText(record.type)}
                {record.multiple && t('pages.ticket.field.multiple.suffix')}
              </Tag>
            ),
          },
          {
            title: t('common.column.action'),
            width: 236,
            render: (_, record) => {
              const index = fields.indexOf(record);
              return (
                <Space size={8}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    aria-label={t('pages.ticket.field.moveUp')}
                    disabled={!sortable || index === 0}
                    onClick={() => moveTo(index, index - 1)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined />}
                    aria-label={t('pages.ticket.field.moveDown')}
                    disabled={!sortable || index === fields.length - 1}
                    onClick={() => moveTo(index, index + 1)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    title={t('pages.ticket.field.insertBelow')}
                    aria-label={t('pages.ticket.field.insertBelow')}
                    disabled={full}
                    onClick={() => setEditing({ at: index + 1 })}
                  />
                  <a onClick={() => setEditing({ index, at: index })}>
                    {t('common.action.edit')}
                  </a>
                  {!full && (
                    <a onClick={() => duplicate(index)}>
                      {t('common.action.copy')}
                    </a>
                  )}
                  <DeleteConfirmLink
                    title={t('pages.ticket.field.delete.title')}
                    description={[
                      t('pages.ticket.field.delete.description', {
                        name: record.name,
                      }),
                      dependentsText(record.code),
                      usageText(record.code),
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onConfirm={() =>
                      commit(fields.filter((_f, i) => i !== index))
                    }
                  />
                </Space>
              );
            },
          },
        ]}
      />
      {splitGroups.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          title={t('pages.ticket.field.group.split', {
            names: splitGroups.join('、'),
          })}
          action={
            <Button size="small" onClick={regroup}>
              {t('pages.ticket.field.group.merge')}
            </Button>
          }
        />
      )}
      <Flex gap={8} style={{ marginTop: 12 }}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          style={{ flex: 1 }}
          disabled={full}
          onClick={() => setEditing({ at: fields.length })}
        >
          {t('pages.ticket.field.add')}
        </Button>
        <Button
          icon={<EyeOutlined />}
          disabled={fields.length === 0}
          onClick={() => setPreviewing(true)}
        >
          {t('pages.ticket.field.preview')}
        </Button>
      </Flex>

      {editing && (
        <ModalForm<FieldValues>
          title={t(
            editingField ? 'pages.ticket.field.edit' : 'pages.ticket.field.add',
          )}
          width={600}
          grid
          rowProps={{ gutter: 16 }}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(undefined);
          }}
          modalProps={{ destroyOnHidden: true }}
          initialValues={
            editingField
              ? toValues(editingField)
              : { type: 'string', code: nextCode() }
          }
          submitter={{
            searchConfig: {
              submitText: t('common.action.confirm'),
              resetText: t('common.action.cancel'),
            },
          }}
          onFinish={async (values) => {
            const field = toField(values);
            if (!editingField) {
              commit([
                ...fields.slice(0, editing.at),
                field,
                ...fields.slice(editing.at),
              ]);
              return true;
            }
            // 改了字段码：受它控制的字段的显示条件跟着改
            const renamed = editingField.code !== field.code;
            commit(
              fields.map((f, i) => {
                if (i === editing.index) return field;
                return renamed && f.showWhen?.field === editingField.code
                  ? { ...f, showWhen: { ...f.showWhen, field: field.code } }
                  : f;
              }),
            );
            return true;
          }}
        >
          {editingUsage && (
            <Alert
              type="warning"
              showIcon
              style={{ width: '100%', marginBottom: 16 }}
              title={editingUsage}
            />
          )}
          <FieldFormItems
            types={FIELD_TYPE_ORDER}
            code={{
              pattern: CODE_PATTERN,
              patternMessage: t('pages.ticket.field.code.pattern'),
              tooltip: t('pages.ticket.field.code.tooltip'),
              validate: (code) => {
                if (code === RESERVED_CODE) {
                  return t('pages.ticket.field.code.reserved');
                }
                return fields.some(
                  (f, i) => i !== editing.index && f.code === code,
                )
                  ? t('pages.ticket.field.code.duplicate')
                  : undefined;
              },
            }}
            nameMax={NAME_MAX}
            descriptionMax={DESCRIPTION_MAX}
            enumMode="pairs"
            enumMax={ENUM_MAX}
            patternMax={PATTERN_MAX}
            advanced
            groupNames={groupNames}
            controls={controls}
          />
        </ModalForm>
      )}

      {/* 分组改名：该分组下的全部字段一起改；留空 = 取消分组 */}
      <Modal
        title={t('pages.ticket.field.group.rename')}
        open={!!renaming}
        onOk={renameGroup}
        onCancel={() => setRenaming(undefined)}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          {t('pages.ticket.field.group.rename.tip')}
        </Typography.Paragraph>
        <Input
          autoFocus
          allowClear
          maxLength={GROUP_MAX}
          value={renaming?.to}
          onChange={(e) =>
            setRenaming((r) => (r ? { ...r, to: e.target.value } : r))
          }
          onPressEnter={(e) => {
            // 弹窗在模板表单里：回车只确认改名，不提交外层表单
            e.preventDefault();
            renameGroup();
          }}
        />
      </Modal>

      {/* 预览：提单人看到的表单（只看样子，不提交） */}
      <Modal
        title={t('pages.ticket.field.preview')}
        width={columns === 2 ? 760 : 560}
        open={previewing}
        onCancel={() => setPreviewing(false)}
        footer={null}
        destroyOnHidden
      >
        <ProForm
          grid
          rowProps={{ gutter: 16 }}
          colProps={{ span: colSpan }}
          submitter={false}
          initialValues={{ data: schemaInitialValues(fields) }}
        >
          <SchemaFormItems
            fields={fields}
            namePath={DATA_PATH}
            renderers={TICKET_FIELD_RENDERERS}
            customColSpan={colSpan}
            renderGroup={renderFormGroup}
          />
        </ProForm>
      </Modal>
    </>
  );
};

export default FieldsEditor;
