/**
 * ابزارهای ناوبری زبان‌آگاه (Locale-aware Navigation)
 * ---------------------------------------------------------------------------
 * این فایل نسخه‌های «زبان‌دان» کامپوننت‌ها و هوک‌های ناوبری Next.js را می‌سازد.
 *
 * تفاوت با نسخه‌های استاندارد Next.js چیست؟
 *   اگر از next/link استفاده کنی، باید خودت زبان را به مسیر بچسبانی:
 *       <Link href={`/${locale}/products`}>    ❌ خطاپذیر و تکراری
 *   با نسخه‌ی این فایل، زبان فعلی خودکار اضافه می‌شود:
 *       <Link href="/products">                ✅ تمیز و امن
 *
 * ⚠️ قانون پروژه: در هیچ کامپوننتی مستقیماً از 'next/link' یا
 *    'next/navigation' import نکن — همیشه از همین فایل.
 */

import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const {
  /** جایگزین <Link> از next/link — پیشوند زبان را خودکار اضافه می‌کند */
  Link,

  /** ریدایرکت سمت سرور با حفظ زبان فعلی */
  redirect,

  /** مسیر فعلی را بدون پیشوند زبان برمی‌گرداند (مثلاً '/products') */
  usePathname,

  /** روتر کلاینت برای push/replace با حفظ زبان */
  useRouter,

  /** ساخت مسیر کامل یک صفحه برای یک زبان مشخص — برای hreflang و sitemap */
  getPathname,
} = createNavigation(routing)
