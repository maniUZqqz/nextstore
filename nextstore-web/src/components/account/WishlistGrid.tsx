'use client'

/**
 * شبکه‌ی محصولات علاقه‌مندی
 * ---------------------------------------------------------------------------
 * پوشش حالت‌ها: loading · guest · empty · success
 *
 * ⚠️ چرا کارت اختصاصی و نه ProductCard مشترک؟
 *    ۱. ProductCard یک Server Component غیرهمگام است و داخل
 *       کامپوننت کلاینتی قابل رندر نیست.
 *    ۲. کارت اینجا دو کنش متفاوت دارد: «حذف از فهرست» و
 *       «افزودن به سبد» — نه قلبِ افزودن.
 *
 * ⚠️ حالت مهمان:
 *    مهمان فهرستش را در localStorage دارد، ولی سرور محصول‌های کامل
 *    را نمی‌دهد (چون توکن ندارد). به‌جای نمایش صفحه‌ی خالیِ گمراه‌کننده،
 *    تعداد ذخیره‌شده و دعوت به ورود نشان داده می‌شود.
 */

import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { Heart, Trash2, LogIn, PackageSearch } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { useWishlist } from '@/hooks/useWishlist'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { formatPrice, formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function WishlistGrid() {
  const t = useTranslations('account')
  const tProduct = useTranslations('product')
  const locale = useLocale() as Locale

  const { products, productIds, isLoading, isAuthenticated, isSyncing, toggle } = useWishlist()

  /* --- حالت بارگذاری --- */
  if (isLoading || isSyncing) {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <li
            key={i}
            className="h-72 animate-pulse rounded-(--radius-lg) border border-border bg-muted"
          />
        ))}
      </ul>
    )
  }

  /* --- مهمان با فهرست غیرخالی --- */
  if (!isAuthenticated && productIds.length > 0) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card px-6 py-14 text-center">
        <Heart className="size-12 fill-current text-sale" aria-hidden="true" />

        <h2 className="mt-4 text-lg font-bold text-foreground">
          {t('wishlistGuest')}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {t('wishlistGuestDesc')}
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          {t('wishlistCount', { count: productIds.length })}
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <LogIn className="size-4" aria-hidden="true" />
          {t('wishlistGuestCta')}
        </Link>
      </div>
    )
  }

  /* --- فهرست خالی --- */
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card px-6 py-16 text-center">
        <PackageSearch className="size-12 text-muted-foreground" aria-hidden="true" />

        <h2 className="mt-4 text-lg font-bold text-foreground">
          {t('wishlistEmpty')}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {t('wishlistEmptyDesc')}
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('wishlistBrowse')}
        </Link>
      </div>
    )
  }

  /* --- فهرست پر --- */
  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {t('wishlistCount', { count: products.length })}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li
            key={product.id}
            className="group relative flex flex-col overflow-hidden rounded-(--radius-lg) border border-border bg-card transition-shadow hover:shadow-(--shadow-md)"
          >
            {/* دکمه حذف — روی تصویر، بیرون از لینک */}
            <button
              type="button"
              onClick={() => toggle(product.id)}
              aria-label={t('wishlistRemove')}
              className={cn(
                'absolute end-2 top-2 z-10 inline-flex size-8 items-center justify-center',
                'rounded-full bg-background/90 text-muted-foreground backdrop-blur-sm',
                'transition-all duration-[var(--duration-fast)]',
                'hover:scale-110 hover:text-destructive active:scale-95',
              )}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>

            <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
              {/* تصویر */}
              <div className="relative aspect-square overflow-hidden bg-muted">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail.url}
                    alt={product.thumbnail.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-[var(--duration-normal)] group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <PackageSearch className="size-10 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}

                {/* نشان تخفیف */}
                {product.isOnSale && (
                  <span className="absolute start-2 top-2 rounded-(--radius-sm) bg-sale px-1.5 py-0.5 text-[11px] font-bold text-sale-foreground">
                    {formatNumber(product.discountPercent, locale)}٪
                  </span>
                )}
              </div>

              {/* متن */}
              <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-2 text-sm font-medium leading-6 text-foreground">
                  {product.name}
                </h3>

                <div className="mt-auto pt-3">
                  {product.isOnSale && (
                    <s className="block text-xs text-muted-foreground">
                      {formatPrice(product.price, locale)}
                    </s>
                  )}
                  <strong className="block text-sm font-bold text-foreground">
                    {formatPrice(product.finalPrice, locale)}
                  </strong>

                  {!product.isInStock && (
                    <span className="mt-1 block text-xs text-destructive">
                      {tProduct('outOfStock')}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* افزودن به سبد */}
            <div className="border-t border-border p-3">
              {/*
                * حالت full و نه compact.
                *
                * compact یک دکمه‌ی گرد size-9 فقط-آیکون است که برای گوشه‌ی
                * کارت محصول ساخته شده. اینجا دکمه تمام‌عرض است و بدون
                * برچسب متنی، کاربر فقط یک «+» شناور می‌بیند که شبیه
                * خرابی رندر است تا یک دکمه. ارتفاع هم از ۱۲ به ۱۰ کم
                * می‌شود تا در کارت متناسب بنشیند.
              */}
              <AddToCartButton
                product={product}
                variant="full"
                /*
                 * ارتفاع منعطف به‌جای ثابت: در کارت باریکِ موبایل
                 * برچسب «افزودن به سبد» به دو خط می‌شکند و با h ثابت
                 * از دکمه بیرون می‌زد. px هم از ۶ به ۲ کم شده تا فضای
                 * بیشتری به خود متن برسد.
                 */
                className="h-auto min-h-10 w-full px-2 py-2 text-xs leading-5 sm:text-sm"
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
