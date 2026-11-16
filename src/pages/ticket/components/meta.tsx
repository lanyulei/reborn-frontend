/**
 * 工单域的枚举元数据与表单字段适配：状态 / 优先级 → 徽标与标签色，
 * 以及「人员」「部门」字段的表单控件与展示（通用表单组件经 renderers 注入）。
 */
import { Form, Tag } from 'antd';
import type React from 'react';
import { DeptSelect } from '@/components/DeptSelect';
import {
  renderSchemaValue,
  type SchemaFieldRenderer,
} from '@/components/SchemaForm';
import { UserSelect } from '@/components/UserSelect';
import { fetchWorkflowUsers } from '@/pages/workflow/components/meta';
import type {
  TemplateStatus,
  TicketFieldType,
  TicketFormField,
  TicketPriority,
  TicketStatus,
} from '@/services/ticket/typings';
import { type EnumMeta, type Translate, useT } from '@/utils/i18n';

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

/** 工单模板没有配置图标时用的图标（图标库里的键） */
export const TICKET_ICON = 'ticket';

/** 模板状态 */
export const TEMPLATE_STATUS_META: EnumMeta<TemplateStatus> = {
  1: { textId: 'common.status.enabled', status: 'Success' },
  0: { textId: 'common.status.disabled', status: 'Default' },
};
export const TEMPLATE_STATUS_ORDER: readonly TemplateStatus[] = [1, 0];

/** 表单字段类型 */
export const FIELD_TYPE_META: Record<TicketFieldType, { textId: string }> = {
  string: { textId: 'enum.ticket.fieldType.string' },
  text: { textId: 'enum.ticket.fieldType.text' },
  int: { textId: 'enum.ticket.fieldType.int' },
  float: { textId: 'enum.ticket.fieldType.float' },
  bool: { textId: 'enum.ticket.fieldType.bool' },
  enum: { textId: 'enum.ticket.fieldType.enum' },
  datetime: { textId: 'enum.ticket.fieldType.datetime' },
  user: { textId: 'enum.ticket.fieldType.user' },
  dept: { textId: 'enum.ticket.fieldType.dept' },
};
export const FIELD_TYPE_ORDER: readonly TicketFieldType[] = [
  'string',
  'text',
  'int',
  'float',
  'bool',
  'enum',
  'datetime',
  'user',
  'dept',
];

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

/** 「人员」「部门」字段的表单控件（值为用户 / 部门 ID） */
export const TICKET_FIELD_RENDERERS: Readonly<
  Record<string, SchemaFieldRenderer<TicketFormField>>
> = {
  user: (_field, props) => (
    <Form.Item {...props}>
      <UserSelect fetchUsers={fetchWorkflowUsers} disabled={props.disabled} />
    </Form.Item>
  ),
  dept: (_field, props) => (
    <Form.Item {...props}>
      <DeptSelect disabled={props.disabled} />
    </Form.Item>
  ),
};

/**
 * 修改已有工单时的表单控件：把当前取值的名称（详情的 labels）交给选择器回显，
 * 候选尚未加载 / 当前值不在候选里时不至于只显示裸 ID。
 */
export const ticketFieldRenderers = (
  data: Record<string, unknown> | undefined,
  labels: Record<string, string> | undefined,
): Readonly<Record<string, SchemaFieldRenderer<TicketFormField>>> => {
  /** 字段当前取值的 ID → 名称（没有名称的不给，交由控件自行处理） */
  const known = (field: TicketFormField) => {
    const id = data?.[field.code];
    const label = typeof id === 'string' ? labels?.[id] : undefined;
    return typeof id === 'string' && label ? { id, label } : undefined;
  };
  return {
    user: (field, props) => {
      const current = known(field);
      return (
        <Form.Item {...props}>
          <UserSelect
            fetchUsers={fetchWorkflowUsers}
            disabled={props.disabled}
            knownUsers={current && [current]}
          />
        </Form.Item>
      );
    },
    dept: (field, props) => {
      const current = known(field);
      return (
        <Form.Item {...props}>
          <DeptSelect
            disabled={props.disabled}
            knownDepts={current && [{ id: current.id, name: current.label }]}
          />
        </Form.Item>
      );
    },
  };
};

/** 详情里的字段取值：人员 / 部门显示名称（labels 为 ID → 名称），其余按类型格式化 */
export const renderTicketValue = (
  field: TicketFormField,
  value: unknown,
  labels: Record<string, string> | undefined,
  t: Translate,
): React.ReactNode => {
  if (
    (field.type === 'user' || field.type === 'dept') &&
    typeof value === 'string' &&
    value !== ''
  ) {
    return labels?.[value] ?? value;
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
