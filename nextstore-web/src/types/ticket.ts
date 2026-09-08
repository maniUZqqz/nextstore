/**
 * تایپ‌های تیکت پشتیبانی
 * ---------------------------------------------------------------------------
 * آینه‌ی خروجی TicketResource و TicketDetailResource در بک‌اند.
 *
 * ⚠️ الگوی سه‌تایی enum: بک‌اند برای هر enum سه فیلد می‌فرستد —
 *    مقدار خام (`status`) برای منطق، برچسب محلی‌سازی‌شده
 *    (`statusLabel`) برای نمایش، و رنگ معنایی (`statusColor`).
 *
 *    یعنی فرانت هرگز نباید نگاشت وضعیت→متن یا وضعیت→رنگ بنویسد؛
 *    نوشتنش دو نسخه‌ی واگرا از یک قاعده می‌سازد که با افزودن یک
 *    وضعیت تازه در بک‌اند بی‌صدا از هم دور می‌شوند.
 */

import type { StatusColor } from './order'

/** وضعیت گفتگو. */
export type TicketStatus = 'open' | 'answered' | 'customer_reply' | 'closed'

/** دپارتمان رسیدگی. */
export type TicketDepartment = 'technical' | 'orders' | 'billing' | 'other'

/** اولویت رسیدگی. */
export type TicketPriority = 'low' | 'normal' | 'high'

/** فیلتر فهرست — `all` یعنی بدون فیلتر. */
export type TicketFilter = 'all' | 'open' | 'closed'

/** یک پیام در گفتگو. */
export interface TicketMessage {
  id: number
  body: string
  /** تعیین‌کننده‌ی سمت پیام: پشتیبانی یا مشتری */
  isStaff: boolean
  /** اگر حساب فرستنده حذف شده باشد null است */
  authorName?: string | null
  createdAt: string
}

/** تیکت در فهرست. */
export interface Ticket {
  id: number
  /** شناسه‌ی نمایشی و کلید مسیر — مثل `TK-453172` */
  ticketNumber: string
  subject: string

  status: TicketStatus
  statusLabel: string
  statusColor: StatusColor

  department: TicketDepartment
  departmentLabel: string

  priority: TicketPriority
  priorityLabel: string
  priorityColor: StatusColor

  /**
   * آیا این تیکت پاسخ می‌پذیرد؟
   *
   * از بک‌اند می‌آید و نه از مقایسه‌ی `status !== 'closed'` در فرانت:
   * قاعده‌ی «چه وقت می‌شود پاسخ داد» ممکن است فردا پیچیده‌تر شود
   * (مثلاً تیکت بسته‌شده‌ی قدیمی‌تر از ۳۰ روز بازگشایی نشود) و آن
   * قاعده باید یک جا بماند.
   */
  acceptsReply: boolean

  messagesCount: number
  lastReplyAt: string | null
  createdAt: string

  /** شماره‌ی سفارش مرتبط — فقط وقتی تیکت به سفارشی چسبیده باشد */
  orderNumber?: string | null

  /**
   * صاحب تیکت.
   *
   * ⚠️ فقط در صف پشتیبانی بارگذاری می‌شود. در «تیکت‌های من» کلید
   *    اصلاً وجود ندارد — کاربر خودش را می‌شناسد و فرستادنش نشت
   *    بی‌دلیل ایمیل بود. پس اختیاری است و کامپوننت مشترک نباید
   *    وجودش را فرض کند.
   */
  customer?: {
    name: string
    email: string
  }
}

/** تیکت به‌همراه کل گفتگو. */
export interface TicketDetail extends Ticket {
  messages: TicketMessage[]
}

/** ورودی ثبت تیکت تازه. */
export interface TicketInput {
  subject: string
  body: string
  department: TicketDepartment
  priority: TicketPriority
  /** سفارش مرتبط — اختیاری */
  order_id?: number
}

/** یک گزینه‌ی انتخابی در فرم — از `GET /tickets/meta` می‌آید. */
export interface TicketOption<T extends string> {
  value: T
  label: string
  color?: StatusColor
}

/** گزینه‌های فرم تیکت تازه. */
export interface TicketMeta {
  departments: TicketOption<TicketDepartment>[]
  priorities: TicketOption<TicketPriority>[]
}
