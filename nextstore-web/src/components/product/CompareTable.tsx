'use client'

/**
 * جدول مقایسه‌ی محصولات
 * ---------------------------------------------------------------------------
 * تا چهار محصول کنار هم، ردیف به ردیف.
 *
 * ⚠️ هر محصول با درخواست جداگانه گرفته می‌شود چون API اندپوینت
 *    دسته‌جمعی ندارد. حداکثر چهار درخواست موازی است و React Query
 *    آن‌ها را جدا کش می‌کند — یعنی محصولی که کاربر همین حالا دیده،
 *    اصلاً دوباره گرفته نمی‌شود.
 *
 * ⚠️ نامکِ بی‌اعتبار (محصول حذف‌شده یا نامک عوض‌شده) صفحه را نمی‌شکند:
 *    آن ستون بی‌صدا کنار گذاشته می‌شود و از فهرست هم پاک می‌شود.
 */

import { useEffect } from 'react'
import Image from 'next/image'
import { useQueries } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { Scale, X, Star, Check, Minus, ShoppingCart } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getProduct } from '@/lib/api/catalog'
import { useCompareStore, MAX_COMPARE } from '@/store/compare-store'
import { useIsMounted } from '@/hooks/useIsMounted'
import { formatNumber, formatPrice, currencyLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { ProductDetail } from '@/types/product'

export function CompareTable() {
  const t = useTranslations('compare')
  const tProduct = useTranslations('product')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale

  const slugs = useCompareStore((state) => state.slugs)
  const remove = useCompareStore((state) => state.remove)
  const clear = useCompareStore((state) => state.clear)

  const mounted = useIsMounted()

  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['product', slug, locale],
      /*
       * ⚠️ `getProduct` کل پوشش `{ data: ... }` را برمی‌گرداند، نه خود
       *    محصول را (برخلاف بیشتر توابع دیگر این پروژه). بازکردنش
       *    همین‌جا انجام می‌شود تا بقیه‌ی کامپوننت با `ProductDetail`
       *    خالص کار کند.
       */
      queryFn: async () => (await getProduct(slug, locale)).data,
      /* جزئیات محصول به‌ندرت عوض می‌شود */
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  })

  /*
   * ⚠️ پاکسازی نامک‌های مرده.
   *
   *    اگر محصولی حذف شده یا نامکش عوض شده باشد، درخواستش ۴۰۴ می‌گیرد
   *    و آن قلم برای همیشه در فهرست می‌ماند: هر بار باز کردن صفحه یک
   *    درخواست ناموفق و یک شمارنده‌ی غلط روی نوار شناور.
   */
  useEffect(() => {
    queries.forEach((query, index) => {
      if (query.isError) remove(slugs[index])
    })
  }, [queries, remove, slugs])

  /* پیش از mount چیزی رندر نمی‌شود — فهرست در localStorage است */
  if (!mounted) {
    return (
      <div className="h-96 animate-pulse rounded-(--radius-lg) bg-muted" aria-hidden="true" />
    )
  }

  if (slugs.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-20 text-center">
        <Scale className="size-14 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{t('empty')}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t('emptyDesc')}</p>

        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('emptyCta')}
        </Link>
      </div>
    )
  }

  if (queries.some((query) => query.isLoading)) {
    return <div className="h-96 animate-pulse rounded-(--radius-lg) bg-muted" aria-hidden="true" />
  }

  const products = queries
    .map((query) => query.data)
    .filter((product): product is ProductDetail => Boolean(product))

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-20 text-center">
        <Scale className="size-14 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{t('empty')}</h2>
      </div>
    )
  }

  /**
   * ردیف‌های مقایسه.
   *
   * ⚠️ هر ردیف یک تابع رندر دارد نه یک کلید ساده: مقادیر شکل‌های
   *    متفاوتی دارند (قیمت، ستاره، بله/خیر) و نگاشت «کلید → متن»
   *    مجبورمان می‌کرد همه را به رشته تبدیل کنیم و ستاره و نشان
   *    موجودی را از دست بدهیم.
   */
  const rows: { key: string; render: (product: ProductDetail) => React.ReactNode }[] = [
    {
      key: 'price',
      render: (product) => (
        <div>
          <span className="font-bold text-foreground">
            {formatPrice(product.finalPrice, locale)}
          </span>
          <span className="ms-1 text-xs text-muted-foreground">{currencyLabel(locale)}</span>

          {product.isOnSale && (
            <p className="mt-0.5 text-xs text-muted-foreground line-through">
              {formatPrice(product.price, locale)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'brand',
      render: (product) => product.brand?.name ?? '—',
    },
    {
      key: 'category',
      render: (product) => product.category?.name ?? '—',
    },
    {
      key: 'rating',
      render: (product) =>
        product.reviewsCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
            <span className="tabular-nums">{formatNumber(product.ratingAvg, locale)}</span>
            <span className="text-xs text-muted-foreground">
              ({formatNumber(product.reviewsCount, locale)})
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{t('noReviews')}</span>
        ),
    },
    {
      key: 'stock',
      render: (product) =>
        product.isInStock ? (
          <span className="inline-flex items-center gap-1 text-success">
            <Check className="size-4" aria-hidden="true" />
            {tProduct('inStock')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-destructive">
            <Minus className="size-4" aria-hidden="true" />
            {tProduct('outOfStock')}
          </span>
        ),
    },
    {
      key: 'sku',
      render: (product) => (
        <code dir="ltr" className="font-mono text-xs text-muted-foreground">
          {product.sku}
        </code>
      ),
    },
    {
      key: 'weight',
      render: (product) =>
        product.weight
          ? `${formatNumber(product.weight, locale)} ${t('gram')}`
          : '—',
    },
    {
      key: 'dimensions',
      render: (product) =>
        product.dimensions ? (
          <span dir="ltr" className="tabular-nums">
            {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height}
          </span>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t('count', { count: products.length, max: MAX_COMPARE })}
        </p>

        <button
          type="button"
          onClick={clear}
          className="text-sm text-muted-foreground transition-colors hover:text-destructive"
        >
          {t('clear')}
        </button>
      </div>

      {/*
        جدول در ظرفِ اسکرول افقی.

        ⚠️ ستون اول (نام ویژگی) با `sticky` سر جایش می‌ماند. بدون آن،
           کاربری که در موبایل به ستون سوم اسکرول کرده نمی‌داند عددی
           که می‌بیند قیمت است یا وزن.
      */}
      <div className="overflow-x-auto rounded-(--radius-lg) border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">{t('title')}</caption>

          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="sticky start-0 z-10 bg-card px-4 py-3 text-start" />

              {products.map((product) => {
                const thumbnail = product.images.find((image) => image.isPrimary)
                  ?? product.images[0]

                return (
                  <th key={product.id} scope="col" className="min-w-48 px-4 py-4 text-start align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {/*
                          ⚠️ تصویر لازم است، نه تزئین.
                             در جدولی با چهار ستون، کاربر باید با یک نگاه
                             بفهمد کدام ستون کدام محصول است؛ فقط نام —
                             آن هم وقتی نام‌ها شبیه‌اند — این کار را
                             به خواندن دقیق تبدیل می‌کند.
                        */}
                        <Link
                          href={`/products/${product.slug}`}
                          className="block"
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          <span className="relative mb-2 block aspect-square w-20 overflow-hidden rounded-(--radius-md) bg-muted">
                            {thumbnail ? (
                              <Image
                                src={thumbnail.url}
                                alt=""
                                fill
                                sizes="80px"
                                className={cn(
                                  'object-cover',
                                  !product.isInStock && 'opacity-45 grayscale',
                                )}
                              />
                            ) : null}
                          </span>
                        </Link>

                        <Link
                          href={`/products/${product.slug}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {product.name}
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(product.slug)}
                        aria-label={t('removeOne', { name: product.name })}
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  className="sticky start-0 z-10 bg-card px-4 py-3 text-start text-xs font-medium text-muted-foreground"
                >
                  {t(`row.${row.key}`)}
                </th>

                {products.map((product) => (
                  <td key={product.id} className="px-4 py-3 align-top text-foreground">
                    {row.render(product)}
                  </td>
                ))}
              </tr>
            ))}

            {/* --- ردیف اقدام --- */}
            <tr>
              <th scope="row" className="sticky start-0 z-10 bg-card px-4 py-3" />

              {products.map((product) => (
                <td key={product.id} className="px-4 py-3">
                  <Link
                    href={`/products/${product.slug}`}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) px-3 text-xs font-medium transition-opacity hover:opacity-90',
                      product.isInStock
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground',
                    )}
                  >
                    <ShoppingCart className="size-3.5" aria-hidden="true" />
                    {tCommon('seeDetails')}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
