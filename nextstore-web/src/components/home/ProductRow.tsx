/**
 * ردیف محصولات
 * ---------------------------------------------------------------------------
 * الگوی استاندارد صفحه اصلی فروشگاه: هر بخش یک نوار از محصولات.
 *
 * ⚠️ دو باگ چیدمانی که در بازبینی چشمی پیدا و رفع شد:
 *
 *   ۱. با کمتر از ۵ محصول، نوار افقی نصف صفحه را خالی می‌گذاشت.
 *      چون کارت‌ها عرض ثابت داشتند و در یک flex می‌نشستند.
 *      حالا: تا ۴ آیتم → شبکه‌ی کشسان که کل عرض را پر می‌کند.
 *            بیشتر از ۴ → نوار افقی اسکرول‌شونده.
 *
 *   ۲. در حالت راست‌به‌چپ، نوار اسکرول از سمت اشتباه شروع می‌شد و
 *      اولین کارت نصفه دیده می‌شد. با scroll-p و snap اصلاح شد.
 */

import { ChevronLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { Product } from '@/types/product'
import { ProductCard } from '@/components/product/ProductCard'
import { cn } from '@/lib/utils/cn'

interface ProductRowProps {
  title: string
  subtitle?: string
  products: Product[]
  locale: Locale
  /** مسیر «مشاهده همه» */
  viewAllHref: string
  viewAllLabel: string
  /** عنصری که کنار عنوان می‌آید (مثلاً تایمر شمارش معکوس) */
  headerExtra?: React.ReactNode
  /** رنگ تأکیدی عنوان — برای بخش فروش ویژه */
  accent?: boolean
  /** اولویت بارگذاری تصاویر — فقط برای اولین ردیف صفحه */
  priority?: boolean
}

/**
 * آستانه‌ی تغییر چیدمان.
 * تا این تعداد شبکه‌ی کشسان، بیشتر از آن نوار اسکرول‌شونده.
 */
const GRID_THRESHOLD = 4

export async function ProductRow({
  title,
  subtitle,
  products,
  locale,
  viewAllHref,
  viewAllLabel,
  headerExtra,
  accent = false,
  priority = false,
}: ProductRowProps) {
  /* بخش خالی اصلاً رندر نمی‌شود — بهتر از نمایش یک ردیف خالی */
  if (products.length === 0) return null

  const useGrid = products.length <= GRID_THRESHOLD

  return (
    <section
      className={cn(
        'rounded-(--radius-lg) border p-4 sm:p-5',
        /* بخش فروش ویژه پس‌زمینه و حاشیه‌ی متمایز دارد تا چشم را بگیرد */
        accent
          ? 'border-sale/25 bg-sale/[0.04]'
          : 'border-border bg-card',
      )}
    >
      {/* --- سرتیتر بخش --- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div>
            <h2
              className={cn(
                'text-base font-bold sm:text-lg',
                accent ? 'text-sale' : 'text-foreground',
              )}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {/* عنصر اضافی مثل تایمر شمارش معکوس */}
          {headerExtra}
        </div>

        <Link
          href={viewAllHref}
          className="group flex shrink-0 items-center gap-1 rounded-(--radius-md) px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent sm:text-sm"
        >
          {viewAllLabel}
          {/* فلش در RTL آینه می‌شود و با هاور کمی حرکت می‌کند */}
          <ChevronLeft
            className="rtl-flip size-4 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* ==========================================================
          چیدمان الف — شبکه‌ی کشسان (تا ۴ محصول)
          کارت‌ها کل عرض را پر می‌کنند و فضای خالی نمی‌ماند.
          ========================================================== */}
      {useGrid ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                locale={locale}
                priority={priority && index < 4}
              />
            </li>
          ))}
        </ul>
      ) : (
        /* ==========================================================
           چیدمان ب — نوار افقی اسکرول‌شونده (بیش از ۴ محصول)
           ========================================================== */
        <ul
          className={cn(
            'flex gap-3 overflow-x-auto pb-2 sm:gap-4',
            /*
             * snap باعث می‌شود اسکرول روی لبه‌ی کارت‌ها بایستد،
             * نه وسط یک کارت. تجربه‌ی لمسی روی موبایل بسیار بهتر می‌شود.
             */
            'snap-x snap-mandatory scroll-ps-1',
            /*
             * محو شدن لبه‌ی انتهای نوار.
             *
             * ⚠️ چرا لازم شد؟ در بازبینی چشمی، آخرین کارتِ قابل‌مشاهده
             *    وسط نام محصول بریده می‌شد و «خراب» به نظر می‌رسید.
             *    این ماسک، برش را به نشانه‌ی نرمِ «اسکرول کن» تبدیل می‌کند.
             *
             * چرا mask و نه یک لایه‌ی گرادیان روی آن؟
             *    ماسک روی خودِ محتوا اعمال می‌شود، پس با هر رنگ
             *    پس‌زمینه‌ای (کارت، بخش فروش ویژه، تم تاریک) درست
             *    کار می‌کند. لایه‌ی گرادیان باید رنگ پس‌زمینه را بداند.
             */
            '[mask-image:linear-gradient(to_left,transparent_0,black_3rem)]',
            'rtl:[mask-image:linear-gradient(to_right,transparent_0,black_3rem)]',
          )}
        >
          {products.map((product, index) => (
            <li
              key={product.id}
              /* عرض ثابت تا کارت‌ها در نوار افقی یکدست بمانند */
              className="w-[46%] shrink-0 snap-start sm:w-48 lg:w-52"
            >
              <ProductCard
                product={product}
                locale={locale}
                priority={priority && index < 4}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
