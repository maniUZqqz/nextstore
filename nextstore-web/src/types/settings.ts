/**
 * تایپ تنظیمات عمومی فروشگاه
 * ---------------------------------------------------------------------------
 * آینه‌ی خروجی SettingsController.
 *
 * ⚠️ همه‌ی فیلدها `string | null` هستند: `null` یعنی مدیر مقداری نگذاشته
 *    و کامپوننت باید از مقدار جایگزین خودش استفاده کند. رشته‌ی خالی هم
 *    ممکن است — یعنی مدیر عمداً پاکش کرده و نباید چیزی نشان داده شود.
 */
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
}
