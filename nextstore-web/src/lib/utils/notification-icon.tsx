/**
 * آیکون و رنگ اعلان
 * ---------------------------------------------------------------------------
 * ⚠️ چرا `switch` صریح و نه یک نگاشت نام → کامپوننت؟
 *
 *    نسخه‌ی اول نگاشتی داشت و `const Icon = ICONS[name]` را در بدنه‌ی
 *    کامپوننت رندر می‌کرد. از دید تحلیلگر، هر رندر یک **نوع کامپوننت
 *    تازه** می‌سازد — چیزی که زیردرخت را unmount و دوباره mount
 *    می‌کند و state را می‌ریزد. اینجا نوع در عمل ثابت بود، ولی
 *    ابزار نمی‌توانست اثباتش کند و هشدار می‌داد.
 *
 *    این شکل هم برای ابزار قابل اثبات است و هم برای خواننده روشن‌تر:
 *    فهرست آیکون‌های پشتیبانی‌شده همین‌جا و در یک نگاه دیده می‌شود.
 *
 * ⚠️ نام ناشناخته به زنگوله برمی‌گردد، نه اینکه چیزی رندر نشود.
 *
 *    نام آیکون از سرور می‌آید و زنگوله در **هر صفحه‌ی سایت** رندر
 *    می‌شود؛ یک نوع اعلان تازه که فرانت نمی‌شناسد نباید کل فروشگاه را
 *    بخواباند.
 */

import { Package, LifeBuoy, Star, StarOff, Bell } from 'lucide-react'

export function NotificationIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  switch (name) {
    case 'package':
      return <Package className={className} aria-hidden="true" />
    case 'life-buoy':
      return <LifeBuoy className={className} aria-hidden="true" />
    case 'star':
      return <Star className={className} aria-hidden="true" />
    case 'star-off':
      return <StarOff className={className} aria-hidden="true" />
    default:
      return <Bell className={className} aria-hidden="true" />
  }
}

/**
 * کلاس رنگ بر اساس توکن معنایی بک‌اند.
 *
 * ⚠️ نگاشت ثابت و نه رشته‌ی ساخته‌شده: Tailwind کلاس‌ها را با اسکن متن
 *    سورس پیدا می‌کند و کلاسی که در زمان اجرا ساخته شود در بیلد
 *    تولیدی وجود ندارد — بی‌رنگ می‌شود، بی هیچ خطایی.
 */
export const NOTIFICATION_COLOR: Record<string, string> = {
  info: 'bg-info/10 text-info',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
}
