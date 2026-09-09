/**
 * صفحه جزئیات محصول
 * ===========================================================================
 * Server Component که محصول و محصولات مشابه را از API می‌گیرد.
 *
 * چیدمان:
 *   دسکتاپ → دو ستونه: گالری سمت شروع، اطلاعات و خرید سمت پایان
 *   موبایل  → تک‌ستونه: گالری بالا، اطلاعات پایین
 *
 * سئو:
 *   - متادیتای اختصاصی از فیلد seo محصول
 *   - داده ساختاریافته JSON-LD تا گوگل قیمت و موجودی را در نتایج نشان دهد
 *   - Breadcrumb برای نمایش ساختار سایت
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Truck, ShieldCheck, RotateCcw, Package } from 'lucide-react'
import { getProduct, getRelatedProducts } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/client'
import type { Locale } from '@/i18n/routing'
import type { Product } from '@/types/product'
import { Breadcrumb, type BreadcrumbItem } from '@/components/common/Breadcrumb'
import { RatingStars } from '@/components/common/RatingStars'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel'
import { ProductTabs } from '@/components/product/ProductTabs'
import { ProductRow } from '@/components/home/ProductRow'
import {
  formatPrice, formatNumber, formatDiscount, currencyLabel,
} from '@/lib/utils/format'
import { ogImageUrl } from '@/lib/utils/site-url'

/**
 * متادیتای سئو — از فیلد seo محصول که بک‌اند محاسبه کرده است.
 * اگر محصول پیدا نشود، متادیتای پیش‌فرض برمی‌گردد و صفحه ۴۰۴ می‌شود.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params

  try {
    const { data: product } = await getProduct(slug, locale)

    return {
      title: product.seo.title,
      description: product.seo.description ?? undefined,
      openGraph: {
        title: product.seo.title,
        description: product.seo.description ?? undefined,
        /*
         * ⚠️ محصول بدون عکس هم باید کارت درست بدهد.
         *
         *    پیش‌تر `undefined` می‌رفت و چون متادیتای سایت
         *    `summary_large_image` اعلام می‌کند، شبکه‌ی اجتماعی یک
         *    مستطیل خاکستری خالی نشان می‌داد. حالا به تصویر عمومی
         *    فروشگاه برمی‌گردد.
         */
        images: [product.images[0]?.url ?? ogImageUrl(locale)],
      },
    }
  } catch {
    return {}
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const t = await getTranslations('product')
  const tCommon = await getTranslations('common')
  const tHome = await getTranslations('home')
  const tNav = await getTranslations('nav')

  /* --- دریافت محصول --- */
  let product
  try {
    product = (await getProduct(slug, locale)).data
  } catch (error) {
    /* ۴۰۴ از بک‌اند یعنی محصول وجود ندارد → صفحه یافت‌نشد */
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }

  /*
   * محصولات مشابه.
   * خطای این بخش نباید کل صفحه را از کار بیندازد — اگر نیامد،
   * بخش «محصولات مشابه» ساده حذف می‌شود.
   */
  let related: Product[] = []
  try {
    related = (await getRelatedProducts(slug, locale)).data
  } catch {
    related = []
  }

  /*
   * ساخت مسیر راهنما.
   *
   * ⚠️ اصلاح‌شده: قبلاً اولین حلقه برچسب «مشاهده همه» داشت، چون از
   *    کلید ترجمه‌ی اشتباهی استفاده شده بود. نتیجه در صفحه‌ی محصول:
   *        مشاهده همه › گوشی موبایل › آیفون ۱۵ پرو مکس
   *    که هیچ معنایی ندارد. حلقه‌ی اول همیشه باید «خانه» باشد.
   */
  const breadcrumb: BreadcrumbItem[] = [
    { label: tNav('home'), href: '/' },
    { label: tNav('products'), href: '/products' },
    ...(product.category
      ? [{ label: product.category.name, href: `/products?category=${product.category.slug}` }]
      : []),
    { label: product.name },
  ]

  /**
   * داده ساختاریافته برای گوگل (Schema.org Product).
   * با این، گوگل می‌تواند قیمت، موجودی و امتیاز را مستقیم در
   * نتایج جستجو نمایش دهد — که نرخ کلیک را قابل‌توجه بالا می‌برد.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? undefined,
    sku: product.sku,
    image: product.images.map((img) => img.url),
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.finalPrice,
      priceCurrency: locale === 'fa' ? 'IRR' : 'USD',
      availability: product.isInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    aggregateRating:
      product.reviewsCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.ratingAvg,
            reviewCount: product.reviewsCount,
          }
        : undefined,
  }

  /** تضمین‌های خرید — کنار پنل خرید نمایش داده می‌شوند. */
  const guarantees = [
    { Icon: ShieldCheck, key: 'warranty' },
    { Icon: Truck, key: 'shipping' },
    { Icon: RotateCcw, key: 'returns' },
  ] as const

  return (
    <>
      {/* تزریق داده ساختاریافته در صفحه */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumb} className="mb-4" />

        <main id="main-content" className="flex flex-col gap-6">
          {/* ==========================================================
              بخش اصلی: گالری + اطلاعات خرید
              ========================================================== */}
          <div className="grid gap-6 rounded-(--radius-lg) border border-border bg-card p-4 sm:p-6 lg:grid-cols-2 lg:gap-10">
            {/* --- ستون گالری --- */}
            <ProductGallery
              images={product.images}
              productName={product.name}
              discountBadge={
                product.isOnSale
                  ? formatDiscount(product.discountPercent, locale as Locale)
                  : null
              }
            />

            {/* --- ستون اطلاعات --- */}
            <div className="flex flex-col gap-4">
              {/* برند */}
              {product.brand && (
                <span className="text-sm text-muted-foreground">
                  {product.brand.name}
                </span>
              )}

              {/* نام محصول */}
              <h1 className="text-xl font-bold leading-8 text-foreground sm:text-2xl">
                {product.name}
              </h1>

              {/* امتیاز و کد کالا */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {product.reviewsCount > 0 && (
                  <div className="flex items-center gap-2">
                    <RatingStars
                      value={product.ratingAvg}
                      size="sm"
                      label={t('rating', { rating: product.ratingAvg })}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {formatNumber(product.ratingAvg, locale as Locale)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({formatNumber(product.reviewsCount, locale as Locale)})
                    </span>
                  </div>
                )}

                <span className="text-xs text-muted-foreground">
                  {t('sku')}: {product.sku}
                </span>
              </div>

              {/* توضیح کوتاه */}
              {product.shortDescription && (
                <p className="text-sm leading-7 text-muted-foreground">
                  {product.shortDescription}
                </p>
              )}

              <hr className="border-border" />

              {/* --- قیمت --- */}
              <div>
                {product.isOnSale && (
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="text-sm text-muted-foreground line-through"
                      data-price
                    >
                      {formatPrice(product.price, locale as Locale)}
                    </span>
                    <span className="rounded-(--radius-sm) bg-sale px-2 py-0.5 text-xs font-bold text-sale-foreground">
                      {formatDiscount(product.discountPercent, locale as Locale)}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-black text-foreground sm:text-3xl"
                    data-price
                  >
                    {formatPrice(product.finalPrice, locale as Locale)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currencyLabel(locale as Locale)}
                  </span>
                </div>
              </div>

              {/* --- وضعیت موجودی --- */}
              <div className="flex items-center gap-2 text-sm">
                <Package className="size-4 shrink-0" aria-hidden="true" />
                {product.isInStock ? (
                  product.isLowStock ? (
                    <span className="font-medium text-warning">
                      {t('lowStock', {
                        count: formatNumber(product.stock, locale as Locale),
                      })}
                    </span>
                  ) : (
                    <span className="font-medium text-success">{t('inStock')}</span>
                  )
                ) : (
                  <span className="font-medium text-destructive">{t('outOfStock')}</span>
                )}
              </div>

              {/* --- پنل خرید --- */}
              <ProductPurchasePanel product={product} />

              {/* --- تضمین‌های خرید --- */}
              <ul className="mt-2 grid gap-2.5 rounded-(--radius-md) bg-muted p-4">
                {guarantees.map(({ Icon, key }) => (
                  <li key={key} className="flex items-center gap-2.5 text-sm">
                    <Icon className="size-4 shrink-0 text-success" aria-hidden="true" />
                    <span className="text-muted-foreground">
                      {tHome(`features.${key}.title`)} —{' '}
                      {tHome(`features.${key}.desc`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ==========================================================
              تب‌های توضیحات، مشخصات و نظرات
              ========================================================== */}
          <ProductTabs product={product} />

          {/* ==========================================================
              محصولات مشابه
              ========================================================== */}
          {related.length > 0 && (
            <ProductRow
              title={t('related')}
              products={related}
              locale={locale as Locale}
              viewAllHref={
                product.category
                  ? `/products?category=${product.category.slug}`
                  : '/products'
              }
              viewAllLabel={tCommon('viewAll')}
            />
          )}
        </main>
      </div>
    </>
  )
}
