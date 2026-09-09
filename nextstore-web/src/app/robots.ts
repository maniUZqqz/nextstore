import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/utils/site-url'

/**
 * فایل robots.txt
 * ===========================================================================
 * مسیر: /robots.txt
 *
 * دو کار می‌کند:
 *   ۱. به خزنده می‌گوید کدام مسیرها را نخزد
 *   ۲. آدرس نقشه‌ی سایت را معرفی می‌کند
 *
 * ⚠️ robots.txt جلوی *ایندکس شدن* را نمی‌گیرد، فقط جلوی *خزیدن* را.
 *    صفحه‌ای که از جای دیگری لینک شده باشد ممکن است بدون خزیده
 *    شدن هم در نتایج ظاهر شود. به همین دلیل صفحات شخصی علاوه بر
 *    این فایل، متای `robots: { index: false }` هم دارند — آن یکی
 *    ضمانت واقعی است.
 */

const BASE = SITE_URL

/**
 * مسیرهایی که خزیده نمی‌شوند.
 *
 * الگوها بدون پیشوند زبان نوشته نمی‌شوند: خزنده مسیر کامل را
 * می‌بیند، پس هر الگو باید هر دو زبان را پوشش دهد. کاراکتر عام
 * ابتدای الگو همین کار را می‌کند.
 */
const DISALLOW = [
  /* محتوای شخصی کاربر */
  '/*/account',
  '/*/checkout',
  '/*/cart',

  /* پنل مدیریت */
  '/*/admin',

  /* صفحات احراز هویت — ارزش سئویی ندارند و نباید ایندکس شوند */
  '/*/login',
  '/*/register',
  '/*/forgot-password',
  '/*/reset-password',

  /* روت‌هندلرهای داخلی */
  '/api/',
]

export default function robots(): MetadataRoute.Robots {
  /*
   * ⚠️ در محیط غیرتولیدی، کل سایت بسته می‌شود.
   *
   *    اگر نسخه‌ی آزمایشی روی دامنه‌ای عمومی بالا بیاید و خزنده
   *    ایندکسش کند، همان محتوا با آدرس اشتباه در نتایج می‌نشیند و
   *    با دامنه‌ی اصلی رقابت می‌کند. برگرداندنش هم ماه‌ها طول
   *    می‌کشد.
   */
  const isProduction = process.env.NODE_ENV === 'production'
    && !BASE.includes('localhost')
    && !BASE.includes('127.0.0.1')

  if (!isProduction) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: DISALLOW,
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
