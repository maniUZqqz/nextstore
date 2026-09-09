/**
 * توابع فراخوانی API اعلان‌ها
 * ---------------------------------------------------------------------------
 * همه پشت `auth:sanctum` هستند؛ کلاینت API توکن را خودکار اضافه می‌کند.
 */

import { api } from './client'
import type { PaginatedResponse } from '@/types/api'
import type { AppNotification } from '@/types/notification'

/** پاسخ فهرست — شمار خوانده‌نشده‌ها همراهش می‌آید. */
export interface NotificationListResponse extends PaginatedResponse<AppNotification> {
  meta: PaginatedResponse<AppNotification>['meta'] & { unread: number }
}

export function getNotifications(
  filters: { status?: 'unread' | 'all'; page?: number } = {},
) {
  return api.get<NotificationListResponse>('/notifications', {
    /* 'all' فرستاده نمی‌شود: بک‌اند هر چیزی جز 'unread' را «همه» می‌فهمد */
    params: {
      status: filters.status === 'unread' ? 'unread' : undefined,
      page: filters.page,
    },
  })
}

/**
 * فقط شمار خوانده‌نشده‌ها.
 *
 * ⚠️ اندپوینت سبک جدا، چون زنگوله در **هر صفحه‌ی سایت** رندر می‌شود.
 *    گرفتن کل فهرست برای یک عدد یعنی یک پاسخ چندکیلوبایتی در هر
 *    بارگذاری.
 */
export async function getUnreadCount(): Promise<number> {
  const response = await api.get<{ data: { unread: number } }>(
    '/notifications/unread-count',
  )
  return response.data.unread
}

export function markNotificationRead(id: number) {
  return api.patch<{ data: AppNotification; meta: { unread: number } }>(
    `/notifications/${id}/read`,
  )
}

export function markAllNotificationsRead() {
  return api.patch<{ message: string; meta: { unread: number; marked: number } }>(
    '/notifications/read-all',
  )
}

export function deleteNotification(id: number) {
  return api.delete<{ message: string; meta: { unread: number } }>(
    `/notifications/${id}`,
  )
}
