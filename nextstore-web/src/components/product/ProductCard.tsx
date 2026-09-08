/**
 * کارت محصول — پرتکرارترین کامپوننت کل فروشگاه
 * ===========================================================================
 * در فهرست محصولات، صفحه اصلی، نتایج جستجو و محصولات مشابه استفاده می‌شود.
 *
 * این یک Server Component است، یعنی خودِ کارت هیچ جاوااسکریپتی به مرورگر
 * نمی‌فرستد. فقط دو دکمه‌ی تعاملی (سبد خرید و علاقه‌مندی) کلاینتی‌اند.
 * در فهرست ۲۴ تایی، این تفاوت در حجم باندل چشمگیر است.
 *
 * پوشش حالت‌ها: ناموجود · موجودی کم · تخفیف‌دار · بدون تصویر
 */

import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { Product } from '@/types/product'
import { AddToCartButton } from './AddToCartButton'
import { WishlistButton } from './WishlistButton'
import { CompareButton } from './CompareButton'
import {
  formatPrice, formatNumber, formatDiscount, currencyLabel,
} from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface ProductCardProps {
  product: Product
  locale: Locale
  /**
   * اولویت بارگذاری تصویر.
   * برای چند کارت اول صفحه true باشد تا معیار LCP بهتر شود؛
   * بقیه با lazy loading بارگذاری می‌شوند.
   */
  priority?: boolean
  className?: string
}

export async function ProductCard({
  product,
  locale,
  priority = false,
  className,
}: ProductCardProps) {
  const t = await getTranslations('product')

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-(--radius-lg)',
        'border border-border bg-card',
        'transition-shadow duration-[var(--duration-base)] hover:shadow-[var(--shadow-md)]',
        className,
      )}
    >
      {/* ----------------------------------------------------------------
          ناحیه تصویر
          ---------------------------------------------------------------- */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {/* لینک نامرئی روی کل تصویر — هرجای کارت قابل کلیک باشد */}
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 z-10"
          aria-label={product.name}
        />

        {product.thumbnail ? (
          <Image
            src={product.thumbnail.url}
            alt={product.thumbnail.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className={cn(
              'object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-105',
              /*
               * محصول ناموجود: تصویر بی‌رنگ و کم‌رنگ می‌شود.
               *
               * ⚠️ نسخه‌ی قبلی یک لایه‌ی سفیدِ نیمه‌شفاف روی کل کارت
               *    می‌انداخت که باعث می‌شد کارت «خراب» یا «در حال
               *    بارگذاری» به نظر برسد. با grayscale روی خودِ تصویر،
               *    پیام «ناموجود» منتقل می‌شود بدون اینکه کارت شکسته
               *    به نظر بیاید.
               */
              !product.isInStock && 'grayscale opacity-45',
            )}
          />
        ) : (
          /* حالت بدون تصویر — نباید فضای خالی سفید بماند */
          <div className="flex h-full items-center justify-center p-4 text-center">
            <span className="text-xs text-muted-foreground">{product.name}</span>
          </div>
        )}

        {/* --- برچسب‌ها (سمت شروع خط) --- */}
        <div className="absolute start-2 top-2 z-20 flex flex-col gap-1.5">
          {product.isOnSale && (
            <span className="rounded-(--radius-sm) bg-sale px-2 py-0.5 text-[11px] font-bold text-sale-foreground shadow-sm">
              {formatDiscount(product.discountPercent, locale)}
            </span>
          )}

          {product.isFeatured && !product.isOnSale && (
            <span className="rounded-(--radius-sm) bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground shadow-sm">
              {locale === 'fa' ? 'منتخب' : 'Featured'}
            </span>
          )}
        </div>

        {/* --- دکمه‌های سریع (سمت پایان خط) --- */}
        {/*
          ⚠️ هر دو دکمه داخل یک ظرف با z-20 هستند و خودشان کلیک را
             متوقف می‌کنند: کل کارت یک لینک است و بدون آن، کلیک روی
             این دکمه‌ها کاربر را به صفحه‌ی محصول می‌برد.
        */}
        <div className="absolute end-2 top-2 z-20 flex flex-col gap-1.5">
          <WishlistButton productId={product.id} />
          <CompareButton slug={product.slug} />
        </div>

        {/*
          برچسب «ناموجود».
          فقط یک نوار در پایین تصویر است، نه پوششی روی کل کارت —
          محصول همچنان دیده و کلیک می‌شود (کاربر ممکن است بخواهد
          مشخصاتش را ببیند یا منتظر موجود شدنش بماند).
        */}
        {!product.isInStock && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-destructive/90 py-1.5 text-center backdrop-blur-sm">
            <span className="text-xs font-semibold text-destructive-foreground">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------
          ناحیه اطلاعات
          ---------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* نام برند — کوچک و کم‌رنگ */}
        {product.brand && (
          <span className="text-[11px] text-muted-foreground">{product.brand.name}</span>
        )}

        {/* نام محصول — حداکثر دو خط */}
        <h3 className="line-clamp-2 text-sm font-medium leading-6 text-foreground">
          {product.name}
        </h3>

        {/* امتیاز — فقط اگر نظری ثبت شده باشد */}
        {product.reviewsCount > 0 && (
          <div className="flex items-center gap-1">
            <Star className="size-3.5 fill-rating text-rating" aria-hidden="true" />
            <span className="text-xs font-medium text-foreground">
              {formatNumber(product.ratingAvg, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({formatNumber(product.reviewsCount, locale)})
            </span>
          </div>
        )}

        {/* هشدار موجودی کم — حس فوریت + اطلاع‌رسانی صادقانه */}
        {product.isLowStock && (
          <p className="text-[11px] font-medium text-warning">
            {t('lowStock', { count: formatNumber(product.stock, locale) })}
          </p>
        )}

        {/* ------------------------------------------------------------
            ردیف قیمت و دکمه خرید
            mt-auto این ردیف را به پایین کارت می‌چسباند تا همه کارت‌ها
            صرف‌نظر از طول نام محصول، هم‌تراز شوند.
            ------------------------------------------------------------ */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            {/*
              قیمت قبلی با خط روی آن.
              ⚠️ اندازه از ۱۱px به ۱۲px و رنگ از muted به foreground/60
              تغییر کرد — در بازبینی چشمی تقریباً نامرئی بود.
            */}
            {product.isOnSale && (
              <span
                className="block text-xs text-foreground/45 line-through decoration-foreground/40"
                data-price
              >
                {formatPrice(product.price, locale)}
              </span>
            )}

            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground" data-price>
                {formatPrice(product.finalPrice, locale)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {currencyLabel(locale)}
              </span>
            </div>
          </div>

          {/* دکمه افزودن سریع به سبد — بالای لینک کارت قرار می‌گیرد */}
          <div className="relative z-20">
            <AddToCartButton product={product} variant="compact" />
          </div>
        </div>
      </div>
    </article>
  )
}
