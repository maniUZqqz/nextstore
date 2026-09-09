/**
 * تایپ تنظیمات عمومی فروشگاه
 * ---------------------------------------------------------------------------
 * آینه‌ی خروجی SettingsController.
 *
 * ⚠️ فیلدهای متنی `string | null` هستند: `null` یعنی مدیر مقداری نگذاشته
 *    و کامپوننت باید از مقدار جایگزین خودش استفاده کند. رشته‌ی خالی هم
 *    ممکن است — یعنی مدیر عمداً پاکش کرده و نباید چیزی نشان داده شود.
 */

/**
 * نرخ‌های ارسال — همه به **ریال**.
 *
 * ⚠️ از `config/shop.php` بک‌اند می‌آید نه از جدول تنظیمات، چون منطق
 *    واقعی پرداخت هم از همان‌جا می‌خواند. هدف این است که عددی که به
 *    مشتری تبلیغ می‌شود و عددی که از او گرفته می‌شود، دو منبع نداشته
 *    باشند.
 */
export interface ShippingRates {
  freeThreshold: number
  standard: number
  express: number
}

export interface SiteSettings {
  siteName: string | null
  siteDescription: string | null
  contactPhone: string | null
  contactEmail: string | null
  contactAddress: string | null
  supportHours: string | null
  socialInstagram: string | null
  socialTelegram: string | null
  socialX: string | null
  socialLinkedin: string | null
  shipping: ShippingRates
}
