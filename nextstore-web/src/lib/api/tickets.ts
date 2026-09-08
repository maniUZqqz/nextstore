/**
 * توابع فراخوانی API تیکت پشتیبانی
 * ---------------------------------------------------------------------------
 * همه‌ی این مسیرها پشت `auth:sanctum` هستند؛ کلاینت API توکن را
 * خودکار اضافه می‌کند.
 *
 * ⚠️ آدرس‌ها با **شماره‌ی تیکت** ساخته می‌شوند (`TK-453172`) نه شناسه‌ی
 *    عددی. این عمدی است: کنترلر بک‌اند کوئری را از `$user->tickets()`
 *    شروع می‌کند و با همین شماره فیلتر می‌کند، پس تیکت کاربر دیگر
 *    اصلاً بارگذاری نمی‌شود. شماره هم چیزی است که کاربر در ایمیل و
 *    مکالمه با پشتیبانی می‌بیند.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  Ticket,
  TicketDetail,
  TicketFilter,
  TicketInput,
  TicketMeta,
} from '@/types/ticket'

/** فهرست تیکت‌های کاربر با فیلتر وضعیت. */
export function getTickets(filters: { status?: TicketFilter; page?: number } = {}) {
  return api.get<PaginatedResponse<Ticket>>('/tickets', {
    /*
     * 'all' اصلاً فرستاده نمی‌شود.
     *
     * بک‌اند با `match` روی مقدار تصمیم می‌گیرد و هر چیزی جز 'open'
     * و 'closed' یعنی «بدون فیلتر» — پس حذف کردن پارامتر همان نتیجه
     * را می‌دهد و درخواست تمیزتر می‌ماند.
     */
    params: {
      status: filters.status === 'all' ? undefined : filters.status,
      page: filters.page,
    },
  })
}

/** گزینه‌های فرم تیکت تازه — دپارتمان‌ها و اولویت‌ها با برچسب محلی. */
export async function getTicketMeta(locale?: string): Promise<TicketMeta> {
  const response = await api.get<ApiResponse<TicketMeta>>('/tickets/meta', { locale })
  return response.data
}

/** گفتگوی کامل یک تیکت. */
export async function getTicket(ticketNumber: string): Promise<TicketDetail> {
  const response = await api.get<ApiResponse<TicketDetail>>(
    `/tickets/${encodeURIComponent(ticketNumber)}`,
  )
  return response.data
}

/** ثبت تیکت تازه. */
export async function createTicket(input: TicketInput): Promise<TicketDetail> {
  const response = await api.post<ApiResponse<TicketDetail>>('/tickets', input)
  return response.data
}

/**
 * پاسخ کاربر به گفتگو.
 *
 * ⚠️ اگر تیکت بسته باشد بک‌اند ۴۰۹ با کد `TICKET_CLOSED` می‌دهد، نه ۴۲۲.
 *    داده‌ی ارسالی مشکلی ندارد؛ وضعیت گفتگو با درخواست تعارض دارد.
 *    فراخواننده باید این را از خطای اعتبارسنجی تفکیک کند و به‌جای
 *    هایلایت فیلد، دکمه‌ی «بازگشایی» نشان دهد.
 */
export async function replyToTicket(
  ticketNumber: string,
  body: string,
): Promise<TicketDetail> {
  const response = await api.post<ApiResponse<TicketDetail>>(
    `/tickets/${encodeURIComponent(ticketNumber)}/reply`,
    { body },
  )
  return response.data
}

/** بستن گفتگو توسط کاربر. */
export async function closeTicket(ticketNumber: string): Promise<TicketDetail> {
  const response = await api.patch<ApiResponse<TicketDetail>>(
    `/tickets/${encodeURIComponent(ticketNumber)}/close`,
  )
  return response.data
}

/** بازگشایی گفتگو. */
export async function reopenTicket(ticketNumber: string): Promise<TicketDetail> {
  const response = await api.patch<ApiResponse<TicketDetail>>(
    `/tickets/${encodeURIComponent(ticketNumber)}/reopen`,
  )
  return response.data
}
