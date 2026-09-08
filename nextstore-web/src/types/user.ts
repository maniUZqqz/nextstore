/**
 * تایپ‌های کاربر و احراز هویت
 * ---------------------------------------------------------------------------
 * باید دقیقاً با خروجی UserResource در بک‌اند مطابق باشند.
 */

/** نقش کاربر — باید با App\Enums\UserRole یکسان باشد. */
export type UserRole = 'customer' | 'manager' | 'admin'

/** کاربر واردشده. */
export interface User {
  id: number
  name: string
  avatar: string | null

  role: UserRole
  /** برچسب نقش به زبان جاری، مثلاً «مشتری» */
  roleLabel: string
  /** آیا به پنل مدیریت دسترسی دارد؟ */
  isAdmin: boolean

  /** فقط برای خود کاربر یا مدیر برگردانده می‌شود */
  email?: string
  phone?: string | null

  emailVerified: boolean
  phoneVerified: boolean

  birthDate: string | null
  isActive: boolean

  createdAt: string | null
  lastLoginAt?: string | null
}

/** پاسخ موفق ورود یا ثبت‌نام. */
export interface AuthResponse {
  data: {
    user: User
    /** توکن Bearer برای درخواست‌های بعدی */
    token: string
  }
  message: string
}

/** ورودی فرم ورود. */
export interface LoginInput {
  email: string
  password: string
  remember?: boolean
}

/** ورودی فرم ثبت‌نام. */
export interface RegisterInput {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
  accept_terms: boolean
}

/* =========================================================================
 * پروفایل و امنیت
 * ======================================================================= */

/** ورودی ویرایش پروفایل — نام فیلدها با قرارداد بک‌اند (snake_case). */
export interface ProfileInput {
  name: string
  email: string
  phone?: string | null
  birth_date?: string | null
}

/** ورودی تغییر رمز عبور. */
export interface PasswordInput {
  current_password: string
  password: string
  password_confirmation: string
}

/**
 * یک نشست فعال (دستگاهی که با آن وارد شده‌اید).
 *
 * ⚠️ مقدار خودِ توکن هرگز برگردانده نمی‌شود — فقط شناسه و فراداده.
 *    اگر توکن در پاسخ می‌آمد، هر آسیب‌پذیری XSS به سرقت همه‌ی
 *    نشست‌های کاربر تبدیل می‌شد.
 */
export interface UserSession {
  id: number
  /** نام دستگاه که هنگام ورود ثبت شده */
  name: string
  /** نشستی که همین الان با آن کار می‌کنید — قابل بستن نیست */
  isCurrent: boolean
  createdAt: string | null
  lastUsedAt: string | null
}
