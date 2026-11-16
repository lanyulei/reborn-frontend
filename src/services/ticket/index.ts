/**
 * TicketCatalogService / TicketService：服务目录（分类、模板）维护，提单、工单查询与评论。
 * 工单的流转（待办 / 已办、同意 / 拒绝 / 退回 / 转办 / 撤回）走流程引擎的任务接口，
 * 这里只按业务类型取「工单类」的任务列表。
 */
import { authRequest } from '@/services/system/request';
import type { PagedResult, PageQuery } from '@/services/system/typings';
import type { TaskItem } from '@/services/workflow/typings';
import type {
  Ticket,
  TicketCategory,
  TicketComment,
  TicketDetail,
  TicketPriority,
  TicketStats,
  TicketStatus,
  TicketTemplate,
  TicketTemplateSpec,
} from './typings';

const BASE = '/api/v1/ticket';

/** 工单在流程引擎里的业务类型标识 */
export const TICKET_BUSINESS_TYPE = 'ticket';

/** ListCatalog 可提单的服务目录：只含启用的模板（提单页用） */
export async function listCatalog(): Promise<{ items: TicketCategory[] }> {
  return authRequest(`${BASE}/catalog`, { method: 'GET' });
}

/** ListManagedCatalog 完整的服务目录：全部分类与模板，含已停用的（管理页用） */
export async function listManagedCatalog(options?: {
  silent?: boolean;
}): Promise<{
  items: TicketCategory[];
}> {
  return authRequest(`${BASE}/managed-catalog`, {
    method: 'GET',
    silent: options?.silent,
  });
}

export interface CategoryBody {
  name: string;
  description: string;
  sort: number;
}

/** CreateCategory 创建分类 */
export async function createCategory(
  body: CategoryBody,
): Promise<{ category: TicketCategory }> {
  return authRequest(`${BASE}/category`, { method: 'POST', data: body });
}

/** UpdateCategory 整组更新分类 */
export async function updateCategory(
  id: string,
  body: CategoryBody,
): Promise<void> {
  await authRequest<void>(`${BASE}/category/${id}`, {
    method: 'PUT',
    data: body,
  });
}

/** DeleteCategory 删除分类（其下仍有模板时后端拒绝） */
export async function deleteCategory(id: string): Promise<void> {
  await authRequest<void>(`${BASE}/category/${id}`, { method: 'DELETE' });
}

/** GetTemplate 模板详情（含表单字段） */
export async function getTemplate(
  id: string,
  options?: { silent?: boolean },
): Promise<{ template: TicketTemplate }> {
  return authRequest(`${BASE}/template/${id}`, {
    method: 'GET',
    silent: options?.silent,
  });
}

/** CreateTemplate 创建模板 */
export async function createTemplate(
  spec: TicketTemplateSpec,
): Promise<{ template: TicketTemplate }> {
  return authRequest(`${BASE}/template`, { method: 'POST', data: { spec } });
}

/** UpdateTemplate 整组更新模板（已有工单保存的是提单时的表单，不受影响） */
export async function updateTemplate(
  id: string,
  spec: TicketTemplateSpec,
): Promise<void> {
  await authRequest<void>(`${BASE}/template/${id}`, {
    method: 'PUT',
    data: { spec },
  });
}

/** DeleteTemplate 删除模板 */
export async function deleteTemplate(id: string): Promise<void> {
  await authRequest<void>(`${BASE}/template/${id}`, { method: 'DELETE' });
}

/** CreateTicket 提交工单 */
export async function createTicket(body: {
  templateId: string;
  title: string;
  priority: TicketPriority;
  data: Record<string, unknown>;
  fileIds?: string[];
  /** 关联的 CMDB 资源 ID（须是提单人有权查看的资源） */
  ciIds?: string[];
  /** 幂等键（UUID）：相同的键重复提交返回首次创建的工单 */
  requestId?: string;
}): Promise<{ ticket: Ticket }> {
  return authRequest(`${BASE}/order`, { method: 'POST', data: body });
}

/** GetTicket 工单详情（表单 + 数据 + 附件 + 显示名） */
export async function getTicket(id: string): Promise<TicketDetail> {
  return authRequest(`${BASE}/order/${id}`, { method: 'GET' });
}

/** ListMyTickets 我提交的工单 */
export async function listMyTickets(
  params: PageQuery & { status?: TicketStatus },
): Promise<PagedResult<Ticket>> {
  return authRequest(`${BASE}/my-order`, { method: 'GET', params });
}

/** ListTickets 全部工单（管理视图） */
export async function listTickets(
  params: PageQuery & {
    status?: TicketStatus;
    priority?: TicketPriority;
    templateId?: string;
    /** 只看关联了该 CMDB 资源的工单 */
    ciId?: string;
    /** 只看 SLA 已超时的工单 */
    overdue?: boolean;
  },
): Promise<PagedResult<Ticket>> {
  return authRequest(`${BASE}/order`, { method: 'GET', params });
}

/** UpdateTicketForm 当前处理人修改表单：只传要改的字段，值为 null 表示清空 */
export async function updateTicketForm(
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await authRequest<void>(`${BASE}/order/${id}/form`, {
    method: 'PUT',
    data: { data },
  });
}

/** RateTicket 提单人评价已结束的工单（每张一次） */
export async function rateTicket(
  id: string,
  rating: number,
  comment: string,
): Promise<void> {
  await authRequest<void>(`${BASE}/order/${id}/rating`, {
    method: 'POST',
    data: { rating, comment },
  });
}

type RawCount = { key?: string; count?: string };

/** GetTicketStats 工单统计；protojson 省略零值、int64 为字符串，这里统一归一为 number */
export async function getTicketStats(days: number): Promise<TicketStats> {
  type Raw = Partial<Record<keyof TicketStats, unknown>> & {
    byStatus?: RawCount[];
    byPriority?: RawCount[];
    byTemplate?: RawCount[];
    trend?: { day?: string; created?: string; closed?: string }[];
  };
  // 趋势按浏览器所在时区分日，与页面补齐日期的口径一致；服务端不认识该时区
  //（浏览器报出的名称较新或异常）时退回不带时区的口径，页面仍可用。
  const raw = await authRequest<Raw>(`${BASE}/stats`, {
    method: 'GET',
    params: { days, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    silent: true,
  }).catch(() =>
    authRequest<Raw>(`${BASE}/stats`, { method: 'GET', params: { days } }),
  );
  const num = (v: unknown) => Number(v ?? 0) || 0;
  const counts = (items?: RawCount[]) =>
    (items ?? []).map((c) => ({ key: c.key ?? '', count: num(c.count) }));
  return {
    total: num(raw.total),
    byStatus: counts(raw.byStatus),
    byPriority: counts(raw.byPriority),
    byTemplate: counts(raw.byTemplate),
    trend: (raw.trend ?? []).map((p) => ({
      day: p.day ?? '',
      created: num(p.created),
      closed: num(p.closed),
    })),
    avgResolveSeconds: num(raw.avgResolveSeconds),
    responseSlaTotal: num(raw.responseSlaTotal),
    responseSlaMet: num(raw.responseSlaMet),
    resolveSlaTotal: num(raw.resolveSlaTotal),
    resolveSlaMet: num(raw.resolveSlaMet),
    rated: num(raw.rated),
    avgRating: num(raw.avgRating),
  };
}

/** ListTicketTasks 工单的待办 / 已办 / 抄送（流程引擎的任务列表，按业务类型过滤） */
export async function listTicketTasks(
  view: 'todo' | 'done' | 'cc',
  params: PageQuery,
): Promise<PagedResult<TaskItem>> {
  return authRequest(`/api/v1/workflow/task/${view}`, {
    method: 'GET',
    params: { ...params, businessType: TICKET_BUSINESS_TYPE },
  });
}

/** ListTicketComments 工单评论（含回复，时间升序） */
export async function listTicketComments(
  id: string,
): Promise<{ items: TicketComment[] }> {
  return authRequest(`${BASE}/order/${id}/comment`, { method: 'GET' });
}

/** 评论过于频繁（单人每分钟的条数上限）时后端返回的错误码 */
export const TICKET_COMMENT_RATE_LIMITED = 'TICKET_COMMENT_RATE_LIMITED';

/** AddTicketComment 发表评论（parentId 非空即回复该条顶层评论）；失败不自动提示，由调用方按错误码给出说明 */
export async function addTicketComment(
  id: string,
  content: string,
  parentId?: string,
): Promise<{ comment: TicketComment }> {
  return authRequest(`${BASE}/order/${id}/comment`, {
    method: 'POST',
    data: { content, parentId },
    silent: true,
  });
}
