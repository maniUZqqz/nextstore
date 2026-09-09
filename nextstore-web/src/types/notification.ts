/**
 * انواع مربوط به اعلان‌های درون‌برنامه‌ای
 */

/** نوع رویدادی که اعلان از آن ساخته شده. */
export type NotificationType =
  | 'order_status'
  | 'ticket_reply'
  | 'review_approved'
  | 'review_rejected'

/**
 * یک اعلان آماده‌ی نمایش.
 *
 * ⚠️ `title` و `body` همین حالا ترجمه شده‌اند و `icon`/`color` هم از
 *    بک‌اند می‌آیند. فرانت نگاشت دومی نمی‌سازد — همان قاعده‌ای که برای
 *    وضعیت سفارش و تیکت به کار رفت: نگاشت دوم یعنی افزودن یک نوع تازه
 *    دو جا تغییر می‌خواهد و یکی همیشه جا می‌ماند.
 */
export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  body: string
  /** نام آیکون lucide — از فهرست سفید `notification-icon.ts` */
  icon: string
  /** توکن رنگ معنایی: info / primary / success / warning */
  color: string
  /** مقصد کلیک؛ مسیر داخلی */
  link: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}
