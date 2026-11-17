/**
 * 工单域的枚举元数据与表单字段适配：状态 / 优先级 → 徽标与标签色，
 * 以及「人员」「部门」「附件」字段的表单控件与展示（通用表单组件经 renderers 注入）。
 */
import { Col, Form, Tag, Typography } from 'antd';
import type React from 'react';
import { DeptSelect } from '@/components/DeptSelect';
import {
  renderSchemaValue,
  FIELD_TYPE_META as SCHEMA_FIELD_TYPE_META,
  type SchemaFieldRenderer,
} from '@/components/SchemaForm';
import { UserSelect } from '@/components/UserSelect';
import { SectionTitle } from '@/pages/workflow/components/InstanceDetail';
import { fetchWorkflowUsers } from '@/pages/workflow/components/meta';
import type {
  FormColumns,
  TemplateStatus,
  TicketFieldType,
  TicketFile,
  TicketFormField,
  TicketPriority,
  TicketStatus,
} from '@/services/ticket/typings';
import { type EnumMeta, type Translate, useT } from '@/utils/i18n';
import {
  ATTACHMENT_MAX,
  AttachmentList,
  AttachmentUpload,
} from './Attachments';

/** 工单状态（由流程同步） */
export const TICKET_STATUS_META: EnumMeta<TicketStatus> = {
  1: { textId: 'enum.ticket.status.1', status: 'Processing' },
  2: { textId: 'enum.ticket.status.2', status: 'Success' },
  3: { textId: 'enum.ticket.status.3', status: 'Error' },
  4: { textId: 'enum.ticket.status.4', status: 'Default' },
  5: { textId: 'enum.ticket.status.5', status: 'Warning' },
};

/** 优先级 → 标签色（低 / 普通用中性与主色，高 / 紧急用警示色） */
export const TICKET_PRIORITY_META: Record<
  TicketPriority,
  { textId: string; color?: string }
> = {
  1: { textId: 'enum.ticket.priority.1' },
  2: { textId: 'enum.ticket.priority.2', color: 'blue' },
  3: { textId: 'enum.ticket.priority.3', color: 'orange' },
  4: { textId: 'enum.ticket.priority.4', color: 'red' },
};
export const TICKET_PRIORITY_ORDER: readonly TicketPriority[] = [1, 2, 3, 4];
/** 提单时的缺省优先级：普通 */
export const TICKET_PRIORITY_DEFAULT: TicketPriority = 2;

/** 表单布局可选值：单列 / 双列 */
export const FORM_COLUMNS: readonly FormColumns[] = [1, 2];

/** 表单布局 → 每个字段占的栅格列数（24 栅格）：单列占满一行，双列一行两个 */
export const formColSpan = (columns?: FormColumns) => (columns === 2 ? 12 : 24);

/** 工单模板没有配置图标时用的图标（图标库里的键） */
export const TICKET_ICON = 'ticket';

/** 模板状态 */
export const TEMPLATE_STATUS_META: EnumMeta<TemplateStatus> = {
  1: { textId: 'common.status.enabled', status: 'Success' },
  0: { textId: 'common.status.disabled', status: 'Default' },
};
export const TEMPLATE_STATUS_ORDER: readonly TemplateStatus[] = [1, 0];

/** 表单字段类型：名称取自公共字段库，这里只声明工单开放哪些类型 */
export const FIELD_TYPE_META: Record<TicketFieldType, { textId: string }> =
  SCHEMA_FIELD_TYPE_META;
export const FIELD_TYPE_ORDER: readonly TicketFieldType[] = [
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
  'file',
];
/** 一张表单里附件字段的个数上限（与后端校验一致） */
export const FILE_FIELD_MAX = 5;

/** 优先级标签 */
export const PriorityTag: React.FC<{ priority?: TicketPriority }> = ({
  priority,
}) => {
  const t = useT();
  const meta = priority && TICKET_PRIORITY_META[priority];
  return meta ? (
    <Tag color={meta.color}>{t(meta.textId)}</Tag>
  ) : (
    t('common.empty')
  );
};

/** 多选人员 / 部门的个数上限（与后端一致） */
const MULTIPLE_MAX = 50;

/** 表单里的分组标题（独占一行） */
export const renderFormGroup = (title: string): React.ReactNode => (
  <Col span={24}>
    <SectionTitle>{title}</SectionTitle>
  </Col>
);

/** 附件字段取值里的文件 ID（取值恒为列表；不是列表按没有文件算） */
export const fileIdsOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string' && id !== '')
    : [];

/** 附件字段的控件所需的上下文 */
export interface FileFieldOptions {
  /** 工单已有的附件（修改已有工单时）：回显文件名 */
  files?: readonly TicketFile[];
  /** 某个附件字段是否有文件仍在上传（提交前须等待） */
  onUploadingChange?: (code: string, uploading: boolean) => void;
  /** 只看样子：选了文件不上传（模板的表单预览） */
  dryRun?: boolean;
}

/**
 * 「人员」「部门」「附件」字段的表单控件（人员 / 部门的值为 ID，多选时为 ID 列表；附件的值恒为
 * 文件 ID 列表）。修改已有工单时传入当前取值与名称（详情的 labels、files）：交给控件回显，
 * 候选尚未加载 / 当前值不在候选里时不至于只显示裸 ID。
 */
export const ticketFieldRenderers = (
  data?: Record<string, unknown>,
  labels?: Record<string, string>,
  fileOptions?: FileFieldOptions,
): Readonly<Record<string, SchemaFieldRenderer<TicketFormField>>> => {
  /** 字段当前取值的 ID → 名称（没有名称的不给，交由控件自行处理） */
  const known = (field: TicketFormField) => {
    const value = data?.[field.code];
    const ids = Array.isArray(value) ? value : [value];
    return ids.flatMap((id) => {
      const label = typeof id === 'string' ? labels?.[id] : undefined;
      return typeof id === 'string' && label ? [{ id, label }] : [];
    });
  };
  return {
    user: (field, props) => (
      <Form.Item {...props}>
        <UserSelect
          fetchUsers={fetchWorkflowUsers}
          disabled={props.disabled}
          multiple={field.multiple}
          maxCount={field.multiple ? MULTIPLE_MAX : undefined}
          knownUsers={known(field)}
        />
      </Form.Item>
    ),
    dept: (field, props) => (
      <Form.Item {...props}>
        <DeptSelect
          disabled={props.disabled}
          multiple={field.multiple}
          maxCount={field.multiple ? MULTIPLE_MAX : undefined}
          knownDepts={known(field).map(({ id, label }) => ({
            id,
            name: label,
          }))}
        />
      </Form.Item>
    ),
    file: (field, props) => {
      const max = field.multiple ? ATTACHMENT_MAX : 1;
      return (
        <Form.Item
          {...props}
          // 取值是列表：必填按列表判空
          rules={props.rules.map((rule) => ({
            ...rule,
            type: 'array' as const,
          }))}
          extra={<FileHint max={max} />}
        >
          <AttachmentUpload
            max={max}
            disabled={props.disabled}
            knownFiles={fileOptions?.files}
            dryRun={fileOptions?.dryRun}
            onUploadingChange={
              fileOptions?.onUploadingChange &&
              ((uploading) =>
                fileOptions.onUploadingChange?.(field.code, uploading))
            }
          />
        </Form.Item>
      );
    },
  };
};

/** 附件字段下方的限制说明 */
const FileHint: React.FC<{ max: number }> = ({ max }) => {
  const t = useT();
  return t(
    max > 1
      ? 'pages.ticket.attachment.hint'
      : 'pages.ticket.attachment.hint.one',
    { max },
  );
};

/** 模板里预览表单用的控件：附件只看样子，不真的上传 */
export const PREVIEW_FIELD_RENDERERS = ticketFieldRenderers(
  undefined,
  undefined,
  { dryRun: true },
);

/** 详情里的字段取值：人员 / 部门显示名称（labels 为 ID → 名称），其余按类型格式化 */
export const renderTicketValue = (
  field: TicketFormField,
  value: unknown,
  labels: Record<string, string> | undefined,
  t: Translate,
  files?: readonly TicketFile[],
): React.ReactNode => {
  if (field.type === 'file') {
    // 只展示详情里确实返回了的文件（已作废的、无权看的不在其中）
    const ids = fileIdsOf(value);
    const own = (files ?? []).filter((f) => ids.includes(f.id));
    return own.length > 0 ? (
      <AttachmentList files={own} />
    ) : (
      <Typography.Text type="secondary">{t('common.empty')}</Typography.Text>
    );
  }
  if (field.type === 'user' || field.type === 'dept') {
    const ids = (Array.isArray(value) ? value : [value]).filter(
      (id): id is string => typeof id === 'string' && id !== '',
    );
    if (ids.length > 0) return ids.map((id) => labels?.[id] ?? id).join('、');
  }
  if (field.type === 'bool' && typeof value === 'boolean') {
    return t(value ? 'pages.ticket.bool.true' : 'pages.ticket.bool.false');
  }
  if (field.type === 'text' && typeof value === 'string' && value !== '') {
    // 多行文本保留换行
    return (
      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </span>
    );
  }
  if (
    field.format === 'url' &&
    typeof value === 'string' &&
    /^https?:\/\//.test(value)
  ) {
    // 只给 http(s) 链接加跳转；新窗口打开且不带来源信息
    return (
      <a href={value} target="_blank" rel="noopener noreferrer">
        {value}
      </a>
    );
  }
  return renderSchemaValue(field, value, t);
};

/** 时长 → 可读文本（x 天 y 小时 / x 小时 y 分钟 / x 分钟），向下取整到分钟 */
export const formatSpan = (ms: number, t: Translate): string => {
  const total = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  if (d > 0) return t('pages.ticket.span.dh', { d, h });
  if (h > 0) return t('pages.ticket.span.hm', { h, m });
  return t('pages.ticket.span.m', { m });
};

/** SLA 一项时限的状态：none 未配置 / met 已达成 / running 进行中 / breached 已超时 */
export type SlaState = 'none' | 'met' | 'running' | 'breached';

/**
 * 判定一项时限的状态（与后端「已超时」筛选同一口径）。
 * due 时限；done 达成时刻（响应时间 / 结束时间），尚未达成为空；open 是否仍可能达成；
 * fallback 既未达成、也不再可能达成时用来比较的时刻（工单结束时间）。
 */
export const slaStateOf = (
  due: string | undefined,
  done: string | undefined,
  open: boolean,
  fallback?: string,
): { state: SlaState; remaining: number } => {
  if (!due) return { state: 'none', remaining: 0 };
  const dueAt = new Date(due).getTime();
  const ref = done ?? (open ? undefined : fallback);
  const refAt = ref ? new Date(ref).getTime() : Date.now();
  if (refAt > dueAt) return { state: 'breached', remaining: 0 };
  return open && !done
    ? { state: 'running', remaining: dueAt - refAt }
    : { state: 'met', remaining: 0 };
};

const NO_SLA: { state: SlaState; remaining: number } = {
  state: 'none',
  remaining: 0,
};

/** 工单的响应 / 解决两项时限各自的状态 */
export const ticketSla = (ticket: {
  status: TicketStatus;
  responseDue?: string;
  resolveDue?: string;
  responseTime?: string;
  endTime?: string;
}) => {
  const open = ticket.status === 1;
  // 被撤回 / 终止的工单不计入 SLA（既不算达成也不算超时）；响应时限仅在已有人响应时照常判定
  if (ticket.status === 4 || ticket.status === 5) {
    return {
      response: ticket.responseTime
        ? slaStateOf(ticket.responseDue, ticket.responseTime, false)
        : NO_SLA,
      resolve: NO_SLA,
    };
  }
  return {
    response: slaStateOf(
      ticket.responseDue,
      ticket.responseTime,
      open,
      ticket.endTime,
    ),
    resolve: slaStateOf(ticket.resolveDue, ticket.endTime, open),
  };
};

/** 一项时限的状态标签 */
export const SlaTag: React.FC<{ state: SlaState; remaining?: number }> = ({
  state,
  remaining = 0,
}) => {
  const t = useT();
  switch (state) {
    case 'met':
      return <Tag color="success">{t('pages.ticket.sla.state.met')}</Tag>;
    case 'breached':
      return <Tag color="error">{t('pages.ticket.sla.state.breached')}</Tag>;
    case 'running':
      return (
        <Tag color="processing">
          {t('pages.ticket.sla.state.running', {
            left: formatSpan(remaining, t),
          })}
        </Tag>
      );
    default:
      return t('common.empty');
  }
};
