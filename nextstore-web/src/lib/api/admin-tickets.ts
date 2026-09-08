/**
 * توابع فراخوانی API صف پشتیبانی — پنل مدیریت
 * ---------------------------------------------------------------------------
 * قرینه‌ی `lib/api/tickets.ts` با همان قرارداد داده، اما پشت میدل‌ور
 * `admin`. تایپ‌های `Ticket` و `TicketDetail` مشترک‌اند چون بک‌اند در
 * هر دو سمت همان Resource را برمی‌گرداند؛ تنها تفاوت این است که
 * اینجا `customer` هم بارگذاری می‌شود.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { Ticket, TicketDetail } from '@/types/ticket'
import type { AdminTicketFilters, TicketStatusCounts } from '@/types/admin'

/** پاسخ فهرست — علاوه بر صفحه‌بندی، شمارش وضعیت‌ها هم دارد. */
export interface AdminTicketListResponse extends PaginatedResponse<Ticket> {
  counts: TicketStatusCounts
}

/**
 * صف پشتیبانی با فیلتر وضعیت و جستجو.
 *
 * ⚠️ اگر `status` فرستاده نشود، بک‌اند **صف نیازمند رسیدگی** را
 *    برمی‌گرداند، نه همه را. برای «همه» باید صریحاً `all` بفرستیم —
 *    وگرنه تب «همه» بی‌صدا فقط بخشی از تیکت‌ها را نشان می‌دهد.
 */
export function getAdminTickets(filters: AdminTicketFilters = {}) {
  return api.get<AdminTicketListResponse>('/admin/tickets', {
    params: filters as Record<string, unknown>,
  })
}

/** گفتگوی کامل یک تیکت. */
export async function getAdminTicket(ticketNumber: string): Promise<TicketDetail> {
  const response = await api.get<ApiResponse<TicketDetail>>(
    `/admin/tickets/${encodeURIComponent(ticketNumber)}`,
  )
  return response.data
}

/**
 * پاسخ پشتیبانی.
 *
 * ⚠️ اگر تیکت بسته باشد بک‌اند ۴۰۹ با کد `TICKET_CLOSED` می‌دهد، نه ۴۲۲.
 */
export async function replyAsStaff(
  ticketNumber: string,
  body: string,
): Promise<TicketDetail> {
  const response = await api.post<ApiResponse<TicketDetail>>(
    `/admin/tickets/${encodeURIComponent(ticketNumber)}/reply`,
    { body },
  )
  return response.data
}

/** بستن گفتگو توسط پشتیبانی. */
export async function closeAdminTicket(ticketNumber: string): Promise<TicketDetail> {
  const response = await api.patch<ApiResponse<TicketDetail>>(
    `/admin/tickets/${encodeURIComponent(ticketNumber)}/close`,
  )
  return response.data
}

/** بازگشایی گفتگو. */
export async function reopenAdminTicket(ticketNumber: string): Promise<TicketDetail> {
  const response = await api.patch<ApiResponse<TicketDetail>>(
    `/admin/tickets/${encodeURIComponent(ticketNumber)}/reopen`,
  )
  return response.data
}
