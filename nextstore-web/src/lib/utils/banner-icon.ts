/**
 * فهرست سفید آیکون بنر
 * ---------------------------------------------------------------------------
 * ⚠️ چرا فهرست سفید و نه import پویا؟
 *
 *    نام آیکون از دیتابیس می‌آید و دیتابیس محتوای قابل ویرایش است.
 *    اگر هر رشته‌ای مستقیم به کتابخانه داده شود، دو مشکل پیش می‌آید:
 *
 *      ۱. نام غلط (یا آیکونی که در نسخه‌ی بعدی lucide حذف شده) در
 *         زمان اجرا `undefined` می‌شود و ری‌اکت با «Element type is
 *         invalid» کل صفحه‌ی اصلی را می‌اندازد. یک اشتباه تایپی مدیر
 *         نباید فروشگاه را از کار بیندازد.
 *
 *      ۲. import پویا یعنی bundler نمی‌داند کدام آیکون‌ها لازم‌اند و
 *         مجبور است **کل** کتابخانه را بفرستد — چند صد کیلوبایت برای
 *         سه آیکون.
 *
 *    پس فقط همین چند آیکون پشتیبانی می‌شوند و ناشناخته به یک آیکون
 *    عمومی برمی‌گردد؛ بنر بدون آیکون دیده می‌شود، ولی دیده می‌شود.
 */

import {
  WashingMachine, Shirt, Dumbbell, Smartphone, Laptop, Headphones,
  Watch, Sparkles, BookOpen, Gift, Tag, Truck, Percent, Package,
  type LucideIcon,
} from 'lucide-react'

/** نام‌های مجاز — همان‌ها که در فرم پنل هم نشان داده می‌شوند. */
export const BANNER_ICONS: Record<string, LucideIcon> = {
  'washing-machine': WashingMachine,
  shirt: Shirt,
  dumbbell: Dumbbell,
  smartphone: Smartphone,
  laptop: Laptop,
  headphones: Headphones,
  watch: Watch,
  sparkles: Sparkles,
  'book-open': BookOpen,
  gift: Gift,
  tag: Tag,
  truck: Truck,
  percent: Percent,
  package: Package,
}

/** نام‌های مجاز به‌ترتیب، برای فهرست کشویی فرم. */
export const BANNER_ICON_NAMES = Object.keys(BANNER_ICONS)

/** آیکون یک بنر — ناشناخته به `Tag` برمی‌گردد. */
export function bannerIcon(name: string | null): LucideIcon {
  return (name && BANNER_ICONS[name]) || Tag
}
