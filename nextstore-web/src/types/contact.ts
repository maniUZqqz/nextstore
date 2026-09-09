/**
 * انواع مربوط به فرم «تماس با ما»
 */

/** آنچه فرم به بک‌اند می‌فرستد. */
export interface ContactMessageInput {
  name: string
  email: string
  subject: string
  message: string
}

/** یک پیام در صندوق پنل مدیریت. */
export interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  /** فقط در نمای جزئیات فرستاده می‌شود */
  ip?: string | null
  /**
   * حساب فرستنده، اگر هنگام ارسال وارد بوده.
   *
   * ⚠️ ممکن است با `name`/`email` بالا فرق کند و این ایراد نیست:
   *    بالا چیزی است که در فرم نوشته، این چیزی است که در حسابش دارد.
   */
  user?: { id: number; name: string; email: string } | null
}

/** شمارنده‌ی تب‌های صندوق. */
export interface ContactCounts {
  unread: number
  read: number
  all: number
}
