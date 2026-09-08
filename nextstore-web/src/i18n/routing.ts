/**
 * پیکربندی مسیریابی چندزبانه (i18n Routing)
 * ---------------------------------------------------------------------------
 * این فایل «منبع حقیقت» زبان‌های پشتیبانی‌شده در کل برنامه است.
 * هر جای دیگری که لازم باشد بداند چه زبان‌هایی وجود دارند یا زبان پیش‌فرض
 * چیست، باید از همین فایل بخواند — نه اینکه رشته‌ی 'fa' را هاردکد کند.
 *
 * چرا localePrefix = 'always'؟
 *   با این تنظیم هر دو زبان پیشوند مسیر می‌گیرند (/fa/products و /en/products).
 *   مزیت برای سئو: هر زبان یک URL یکتا و قابل ایندکس دارد و گوگل
 *   نسخه‌ها را محتوای تکراری تشخیص نمی‌دهد.
 */

import { defineRouting } from 'next-intl/routing'

/** فهرست زبان‌های پشتیبانی‌شده به‌همراه اطلاعات نمایشی هر زبان. */
export const LOCALES = [
  {
    /** کد زبان مطابق استاندارد ISO 639-1 */
    code: 'fa',
    /** نام زبان به خط خودش — در کلید تعویض زبان نمایش داده می‌شود */
    label: 'فارسی',
    /** جهت نوشتار: راست‌به‌چپ */
    dir: 'rtl',
    /** لوکال کامل برای فرمت تاریخ و عدد */
    intlLocale: 'fa-IR',
    /** واحد پول پیش‌فرض این زبان */
    currency: 'IRT',
  },
  {
    code: 'en',
    label: 'English',
    dir: 'ltr',
    intlLocale: 'en-US',
    currency: 'USD',
  },
] as const

/** نوع کد زبان — به‌جای string خام همه‌جا از این نوع استفاده می‌شود. */
export type Locale = (typeof LOCALES)[number]['code']

/** نوع جهت نوشتار. */
export type Direction = 'rtl' | 'ltr'

/**
 * پیکربندی اصلی next-intl.
 * middleware و توابع ناوبری همگی از این شیء تغذیه می‌شوند.
 */
export const routing = defineRouting({
  /** کدهای زبان استخراج‌شده از LOCALES */
  locales: LOCALES.map((l) => l.code),

  /** زبان پیش‌فرض — کاربری که به «/» می‌رود به «/fa» هدایت می‌شود */
  defaultLocale: 'fa',

  /** همیشه پیشوند زبان در URL باشد (برای سئو) */
  localePrefix: 'always',
})

/**
 * جهت نوشتار یک زبان را برمی‌گرداند.
 *
 * @param locale کد زبان (مثلاً 'fa')
 * @returns 'rtl' برای فارسی و 'ltr' برای انگلیسی
 */
export function getDirection(locale: string): Direction {
  return LOCALES.find((l) => l.code === locale)?.dir ?? 'ltr'
}

/**
 * اطلاعات کامل یک زبان را برمی‌گرداند (نام، جهت، لوکال، ارز).
 * اگر زبان ناشناخته باشد، اطلاعات زبان پیش‌فرض برگردانده می‌شود.
 *
 * @param locale کد زبان
 */
export function getLocaleConfig(locale: string) {
  return LOCALES.find((l) => l.code === locale) ?? LOCALES[0]
}
