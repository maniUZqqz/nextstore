/**
 * نگاشت کلید رنگ بنر به کلاس‌های Tailwind
 * ---------------------------------------------------------------------------
 * ⚠️ چرا این فایل وجود دارد و چرا کلاس‌ها در دیتابیس نیستند:
 *
 *    Tailwind کلاس‌های مورد نیاز را با **اسکن متنِ فایل‌های سورس** پیدا
 *    می‌کند و بقیه را از خروجی حذف می‌کند. کلاسی که در زمان اجرا از
 *    داده‌ی سرور ساخته شود، هنگام بیلد در هیچ فایلی دیده نشده و در CSS
 *    نهایی وجود ندارد.
 *
 *    نتیجه‌اش بدترین نوع باگ است: در حالت توسعه (که Tailwind
 *    on-demand کار می‌کند) همه‌چیز درست دیده می‌شود و فقط در تولید
 *    بنرها بی‌رنگ می‌شوند — بدون هیچ خطایی در کنسول.
 *
 *    پس دیتابیس فقط یک کلید نگه می‌دارد («info») و کلاس کامل اینجا،
 *    به‌صورت متن نوشته‌شده در سورس، زندگی می‌کند.
 */

import type { BannerTheme } from '@/types/banner'

/** گرادیان پس‌زمینه‌ی اسلاید هیرو + رنگ برچسب. */
export const HERO_THEME: Record<BannerTheme, { gradient: string; accent: string }> = {
  primary: { gradient: 'from-primary/25 via-accent to-background', accent: 'text-primary' },
  info: { gradient: 'from-info/20 via-accent to-background', accent: 'text-info' },
  success: { gradient: 'from-success/20 via-accent to-background', accent: 'text-success' },
  sale: { gradient: 'from-sale/20 via-accent to-background', accent: 'text-sale' },
  warning: { gradient: 'from-warning/20 via-accent to-background', accent: 'text-warning' },
}

/** گرادیان و رنگ متن بنرهای شبکه‌ی میانی. */
export const PROMO_THEME: Record<BannerTheme, string> = {
  primary: 'from-primary/20 to-primary/5 text-primary',
  info: 'from-info/20 to-info/5 text-info',
  success: 'from-success/20 to-success/5 text-success',
  sale: 'from-sale/20 to-sale/5 text-sale',
  warning: 'from-warning/20 to-warning/5 text-warning',
}
