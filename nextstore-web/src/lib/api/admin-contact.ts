/**
 * توابع فراخوانی API صندوق پیام‌های تماس
 * ---------------------------------------------------------------------------
 * همه‌ی این مسیرها پشت میدل‌ور `admin` بک‌اند هستند.
 *
 * ⚠️ آدرس‌ها با شناسه‌ی عددی ساخته می‌شوند — پیام تماس نه نامک دارد و
 *    نه شماره‌ی عمومی، چون فرستنده هیچ راهی برای دیدنش ندارد.
 */

import { api } from './client'
import type { PaginatedResponse } from '@/types/api'
import type { ContactCounts, ContactMessage } from '@/types/contact'

/** تب‌های صندوق. */
export type ContactStatusTab = 'unread' | 'read' | 'all'

/** پاسخ فهرست — علاوه بر صفحه‌بندی، شمارش هر تب را هم دارد. */
export interface AdminContactListResponse extends PaginatedResponse<ContactMessage> {
  counts: ContactCounts
}

/**
 * فهرست پیام‌ها.
 *
 * ⚠️ اگر `status` فرستاده نشود، بک‌اند **خوانده‌نشده‌ها** را برمی‌گرداند
 *    نه همه را. برای «همه» باید صریحاً `all` بفرستیم — همان تله‌ای که
 *    در فهرست نظرات هم بود.
 */
export function getContactMessages(
  filters: { status?: ContactStatusTab; page?: number; q?: string } = {},
) {
  return api.get<AdminContactListResponse>('/admin/contact-messages', {
    params: filters as Record<string, unknown>,
  })
}

/**
 * جزئیات یک پیام.
 *
 * ⚠️ این فراخوانی **عارضه دارد**: پیام را خوانده‌شده می‌کند.
 *
 *    پس نباید در پیش‌بارگذاری یا hover استفاده شود؛ فقط وقتی مدیر
 *    واقعاً پیامی را باز می‌کند.
 */
export function getContactMessage(id: number) {
  return api.get<{ data: ContactMessage; counts: ContactCounts }>(
    `/admin/contact-messages/${id}`,
  )
}

/** حذف کامل — برای هرزنامه. */
export function deleteContactMessage(id: number) {
  return api.delete<{ message: string; counts: ContactCounts }>(
    `/admin/contact-messages/${id}`,
  )
}
