/**
 * انواع مربوط به بنرهای صفحه‌ی اصلی
 */

/** جایگاه بنر. */
export type BannerPlacement = 'hero' | 'promo'

/**
 * کلید رنگ‌بندی.
 *
 * ⚠️ کلید است نه کلاس CSS. Tailwind کلاس‌ها را با اسکن متن سورس پیدا
 *    می‌کند؛ کلاسی که در زمان اجرا از داده‌ی سرور ساخته شود در بیلد
 *    تولیدی وجود ندارد و بی‌صدا حذف می‌شود. نگاشت در
 *    `lib/utils/banner-theme.ts` است — جایی که کلاس‌ها به‌صورت متن
 *    کامل نوشته شده‌اند.
 */
export type BannerTheme = 'primary' | 'info' | 'success' | 'sale' | 'warning'

/** یک بنر آماده‌ی نمایش — متن‌ها همین حالا ترجمه شده‌اند. */
export interface Banner {
  id: number
  placement: BannerPlacement
  badge: string | null
  title: string
  subtitle: string | null
  ctaLabel: string | null
  href: string
  theme: BannerTheme
  icon: string | null
}

/** پاسخ اندپوینت عمومی — گروه‌بندی‌شده بر اساس جایگاه. */
export interface BannerGroups {
  hero: Banner[]
  promo: Banner[]
}

/** وضعیت محاسبه‌شده در پنل. */
export type BannerState = 'live' | 'scheduled' | 'expired' | 'disabled'

/** یک بنر در فرم پنل — متن‌ها خام و دوزبانه‌اند. */
export interface AdminBanner {
  id: number
  placement: BannerPlacement
  theme: BannerTheme
  badge: Record<string, string>
  title: Record<string, string>
  subtitle: Record<string, string>
  ctaLabel: Record<string, string>
  href: string
  icon: string | null
  sortOrder: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  state: BannerState
  createdAt: string
}

/** گزینه‌های فرم که همراه فهرست می‌آیند. */
export interface BannerMeta {
  placements: { value: BannerPlacement; label: string }[]
  themes: { value: BannerTheme; label: string }[]
}
