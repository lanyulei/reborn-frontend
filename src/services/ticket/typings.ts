/** 工单域（TicketCatalogService / TicketService）数据类型，与后端 api/ticket/v1 一致 */
import type { SchemaFieldRule } from '@/components/SchemaForm';

/** 表单字段类型（与后端 internal/pkg/formschema 的类型一一对应） */
export type TicketFieldType =
  | 'string'
  | 'text'
  | 'int'
  | 'float'
  | 'bool'
  | 'enum'
  | 'datetime'
  | 'user'
  | 'dept';

/** 表单字段定义 */
export interface TicketFormField {
  /** 字段码：流程条件以 form.<code> 引用 */
  code: string;
  name: string;
  type: TicketFieldType;
  required?: boolean;
  enumValues?: string[];
  rule?: SchemaFieldRule;
  description?: string;
}

/** 一段时限（workTime：按工作时间计，分钟 / 小时只算工作时段，天 = 工作日） */
export interface SlaDuration {
  value: number;
  unit: 'minute' | 'hour' | 'day';
  workTime?: boolean;
}

/** 某个优先级的 SLA 规则；response / resolve 至少配一项 */
export interface SlaRule {
  priority: TicketPriority;
  response?: SlaDuration;
  resolve?: SlaDuration;
}

/** 提单时关联 CMDB 资源：0=不关联 1=可选 2=必填 */
export type CiLink = 0 | 1 | 2;

/** 模板状态：1=启用 0=停用（protojson 省略零值，缺省即 0） */
export type TemplateStatus = 0 | 1;

/** 工单模板；form 仅详情接口返回 */
export interface TicketTemplate {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  workflowKey: string;
  numberPrefix: string;
  /** 图标标识（图标集的键）；空 = 缺省图标 */
  icon?: string;
  status?: TemplateStatus;
  sort?: number;
  form?: TicketFormField[];
  updateTime?: string;
  /** 以下三项仅详情接口返回 */
  sla?: SlaRule[];
  slaEscalateTo?: string[];
  /** slaEscalateTo 里用户的显示名（ID → 名称） */
  labels?: Record<string, string>;
  ciLink?: CiLink;
}

/** 模板内容（创建 / 整组更新） */
export interface TicketTemplateSpec {
  categoryId: string;
  name: string;
  description: string;
  workflowKey: string;
  numberPrefix: string;
  icon: string;
  status: TemplateStatus;
  sort: number;
  form: TicketFormField[];
  sla: SlaRule[];
  slaEscalateTo: string[];
  ciLink: CiLink;
}

/** 工单分类；templates 仅目录接口返回 */
export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  sort?: number;
  templates?: TicketTemplate[];
}

/** 优先级：1=低 2=普通 3=高 4=紧急 */
export type TicketPriority = 1 | 2 | 3 | 4;

/** 工单状态（由流程同步）：1=处理中 2=已完成 3=已拒绝 4=已撤回 5=已终止 */
export type TicketStatus = 1 | 2 | 3 | 4 | 5;

/** 工单；form / data 仅详情接口返回 */
export interface Ticket {
  id: string;
  number: string;
  templateId: string;
  templateName: string;
  categoryName: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  creator: string;
  creatorName?: string;
  instanceId: string;
  createTime?: string;
  endTime?: string;
  form?: TicketFormField[];
  data?: Record<string, unknown>;
  /** SLA 时限；未配置为空 */
  responseDue?: string;
  resolveDue?: string;
  /** 首次响应时间；尚未响应为空 */
  responseTime?: string;
  /** 满意度评分 1-5；未评价为 0 / 缺省 */
  rating?: number;
  ratingComment?: string;
  ratingTime?: string;
}

/** 工单关联的 CMDB 资源（名称为关联时的快照） */
export interface TicketResource {
  id: string;
  name: string;
  modelName?: string;
}

/** 字段权限（流程当前环节对表单字段） */
export type TicketFieldPermission =
  | 'hidden'
  | 'readonly'
  | 'editable'
  | 'required';

/** 工单附件（size 为 int64 字符串） */
export interface TicketFile {
  id: string;
  filename: string;
  size?: string;
}

/** 工单详情：labels 为表单里人员 / 部门取值与提单人的显示名（ID → 名称） */
export interface TicketDetail {
  ticket: Ticket;
  files?: TicketFile[];
  labels?: Record<string, string>;
  resources?: TicketResource[];
  /** 当前用户作为处理人时各字段的权限；他没有待处理的任务时为空 */
  fieldPermissions?: Record<string, TicketFieldPermission>;
  canEditForm?: boolean;
  canRate?: boolean;
}

/** 一个维度值上的工单数（count 为 int64 字符串） */
export interface TicketCount {
  key: string;
  count: number;
}

/** 某一天的工单量 */
export interface TicketTrendPoint {
  day: string;
  created: number;
  closed: number;
}

/** 工单统计（数值已在服务层归一为 number） */
export interface TicketStats {
  total: number;
  byStatus: TicketCount[];
  byPriority: TicketCount[];
  byTemplate: TicketCount[];
  trend: TicketTrendPoint[];
  avgResolveSeconds: number;
  responseSlaTotal: number;
  responseSlaMet: number;
  resolveSlaTotal: number;
  resolveSlaMet: number;
  rated: number;
  avgRating: number;
}

/** 工单评论 */
export interface TicketComment {
  id: string;
  userId: string;
  userName?: string;
  content: string;
  createTime?: string;
  /** 所回复的评论；空 = 顶层评论（回复只有一层） */
  parentId?: string;
}
