/**
 * شبکه بنرهای تبلیغاتی میان‌صفحه
 * ---------------------------------------------------------------------------
 * سه بنر رنگی که کاربر را به دسته‌های پرفروش هدایت می‌کنند.
 * در فروشگاه‌های واقعی این بنرها بین بخش‌های محصول قرار می‌گیرند تا
 * صفحه یکنواخت نشود و مسیرهای فروش بیشتری باز شود.
 *
 * چیدمان: موبایل تک‌ستونه · تبلت و بالاتر سه‌ستونه
 */

import { getTranslations } from 'next-intl/server'
import { ArrowLeft, WashingMachine, Shirt, Dumbbell } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils/cn'

/**
 * تعریف بنرها.
 * متن از فایل ترجمه می‌آید؛ اینجا فقط کلید، مسیر، آیکون و رنگ.
 */
const BANNERS = [
  {
    key: 'one',
    href: '/products?category=home-appliances',
    Icon: WashingMachine,
    /* گرادیان‌ها با توکن رنگ ساخته می‌شوند تا در دارک‌مود هم درست باشند */
    className: 'from-info/20 to-info/5 text-info',
  },
  {
    key: 'two',
    href: '/products?category=fashion',
    Icon: Shirt,
    className: 'from-sale/20 to-sale/5 text-sale',
  },
  {
    key: 'three',
    href: '/products?category=sports',
    Icon: Dumbbell,
    className: 'from-success/20 to-success/5 text-success',
  },
] as const

export async function PromoBanners() {
  const t = await getTranslations('home.promo')

  return (
    <ul className="grid gap-3 sm:gap-4 md:grid-cols-3">
      {BANNERS.map(({ key, href, Icon, className }) => (
        <li key={key}>
          <Link
            href={href}
            className={cn(
              'group flex items-center justify-between gap-4 overflow-hidden',
              'rounded-(--radius-lg) border border-border bg-gradient-to-bl p-5',
              'transition-shadow duration-[var(--duration-base)] hover:shadow-[var(--shadow-md)]',
              className,
            )}
          >
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground">
                {t(`${key}.title`)}
              </h3>

              {/*
                زیرعنوان.
                ⚠️ رنگ از muted-foreground به رنگ تأکیدی بنر تغییر کرد —
                   در بازبینی چشمی روی پس‌زمینه‌ی گرادیانی تقریباً
                   ناخوانا بود. حالا «تا ۳۰٪ تخفیف» واقعاً دیده می‌شود.
              */}
              <p className="mt-1 text-sm font-semibold">
                {t(`${key}.subtitle`)}
              </p>

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
      ))}
    </ul>
  )
}
