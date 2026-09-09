/**
 * شبکه بنرهای تبلیغاتی میان‌صفحه
 * ---------------------------------------------------------------------------
 * سه بنر رنگی که کاربر را به دسته‌های پرفروش هدایت می‌کنند.
 * در فروشگاه‌های واقعی این بنرها بین بخش‌های محصول قرار می‌گیرند تا
 * صفحه یکنواخت نشود و مسیرهای فروش بیشتری باز شود.
 *
 * چیدمان: موبایل تک‌ستونه · تبلت و بالاتر سه‌ستونه
 *
 * ⚠️ بنرها **از پنل مدیریت** می‌آیند، نه از کد.
 *
 *    پیش‌تر سه بنر با نامک دسته‌ی ثابت در همین فایل بودند
 *    (`?category=home-appliances`). یعنی مدیری که دسته‌ای را تغییر نام
 *    می‌داد، بنری به‌جا می‌گذاشت که به فهرست خالی می‌رفت — لینک مرده‌ای
 *    که هیچ خطایی نمی‌داد و هیچ‌کس متوجهش نمی‌شد.
 */

import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'
import { PROMO_THEME } from '@/lib/utils/banner-theme'
import { bannerIcon } from '@/lib/utils/banner-icon'
import type { Banner } from '@/types/banner'

export function PromoBanners({ banners }: { banners: Banner[] }) {
  /*
   * ⚠️ بدون بنر فعال، چیزی رندر نمی‌شود.
   *
   *    یک `<ul>` خالی حاشیه و فاصله‌ی خودش را می‌گیرد و در صفحه یک
   *    شکاف بی‌دلیل می‌سازد.
   */
  if (banners.length === 0) return null

  return (
    <ul className="grid gap-3 sm:gap-4 md:grid-cols-3">
      {banners.map((banner) => {
        const Icon = bannerIcon(banner.icon)
        const theme = PROMO_THEME[banner.theme] ?? PROMO_THEME.primary

        return (
          <li key={banner.id}>
            <Link
              href={banner.href}
              className={cn(
                'group flex items-center justify-between gap-4 overflow-hidden',
                'rounded-(--radius-lg) border border-border bg-gradient-to-bl p-5',
                'transition-shadow duration-[var(--duration-base)] hover:shadow-[var(--shadow-md)]',
                theme,
              )}
            >
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">
                  {banner.title}
                </h3>

                {/*
                  زیرعنوان.
                  ⚠️ رنگ از muted-foreground به رنگ تأکیدی بنر تغییر کرد —
                     در بازبینی چشمی روی پس‌زمینه‌ی گرادیانی تقریباً
                     ناخوانا بود. حالا «تا ۳۰٪ تخفیف» واقعاً دیده می‌شود.
                */}
                {banner.subtitle && (
                  <p className="mt-1 text-sm font-semibold">
                    {banner.subtitle}
                  </p>
                )}

                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium">
                  {/* فلش با هاور کمی جابه‌جا می‌شود — نشانه‌ی تعامل */}
                  <ArrowLeft
                    className="rtl-flip size-4 transition-transform duration-[var(--duration-base)] group-hover:-translate-x-1 rtl:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>

              {/* آیکون بزرگ تزئینی */}
              <Icon
                className="size-14 shrink-0 opacity-40 transition-transform duration-[var(--duration-slow)] group-hover:scale-110"
                aria-hidden="true"
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
