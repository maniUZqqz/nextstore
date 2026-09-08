/**
 * تایپ‌های عمومی پاسخ API
 * ---------------------------------------------------------------------------
 * این تایپ‌ها ساختار پاسخ بک‌اند لاراول را توصیف می‌کنند.
 * هر تغییری در قرارداد API باید اینجا هم منعکس شود تا TypeScript
 * ناسازگاری را در زمان کامپایل بگیرد، نه در زمان اجرا.
 */

/** پاسخ حاوی یک آیتم: { data: {...} } */
export interface ApiResponse<T> {
  data: T
}

/** اطلاعات صفحه‌بندی که لاراول در کنار داده می‌فرستد. */
export interface PaginationMeta {
  /** شماره صفحه فعلی */
  current_page: number
  /** شماره آخرین صفحه */
  last_page: number
  /** تعداد آیتم در هر صفحه */
  per_page: number
  /** تعداد کل آیتم‌ها در همه صفحات */
  total: number
  /** شماره اولین آیتم این صفحه (برای نمایش «۱ تا ۱۲ از ۳۲») */
  from: number | null
  /** شماره آخرین آیتم این صفحه */
  to: number | null
}

/** پاسخ حاوی فهرست صفحه‌بندی‌شده: { data: [...], meta: {...} } */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/** ساختار بدنه‌ی خطای استاندارد بک‌اند. */
export interface ApiErrorBody {
  success?: false
  message?: string
  error?: { code?: string }
  /** خطاهای اعتبارسنجی به تفکیک فیلد */
  errors?: Record<string, string[]>
}
