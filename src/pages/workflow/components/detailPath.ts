import { TICKET_BUSINESS_TYPE } from '@/services/ticket';

/**
 * 一个流程实例的详情页地址：工单发起的流程进工单详情页（那里才有表单、附件与评论），
 * 其余进流程详情页。没有工单权限的人仍进流程详情页。
 */
export const instanceDetailPath = (
  item: { instanceId: string; businessType?: string; businessId?: string },
  canTicket: boolean,
) =>
  canTicket && item.businessType === TICKET_BUSINESS_TYPE && item.businessId
    ? `/ticket/detail/${item.businessId}`
    : `/workflow/instance/${item.instanceId}`;
