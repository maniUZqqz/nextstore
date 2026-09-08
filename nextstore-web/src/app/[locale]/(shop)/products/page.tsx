/**
 * صفحه فهرست محصولات
 * ===========================================================================
 * Server Component که داده را از API لاراول می‌گیرد.
 *
 * چرا فیلترها در URL هستند و نه در state؟
 *   ۱. لینک قابل اشتراک‌گذاری است
 *   ۲. دکمه بازگشت مرورگر درست کار می‌کند
 *   ۳. با رفرش صفحه فیلترها از بین نمی‌روند
 *   ۴. صفحه سمت سرور رندر می‌شود → سئوی بهتر
 *
 * پوشش حالت‌های داده: loading (loading.tsx) · empty · error · success
 */

import { setRequestLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { AlertCircle } from 'lucide-react'
import { getProducts, getCategories, getBrands } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/client'
import { ProductGrid } from '@/components/product/ProductGrid'
import { FilterPanel } from '@/components/filters/FilterPanel'
import { SortDropdown } from '@/components/filters/SortDropdown'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import type { Locale } from '@/i18n/routing'
import type { ProductFilters, ProductSort } from '@/types/product'
import { formatNumber } from '@/lib/utils/format'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'nav' })

  return { title: t('products') }
}

/** مقادیر مجاز مرتب‌سازی — برای اعتبارسنجی ورودی URL. */
const VALID_SORTS: ProductSort[] = [
  'newest', 'oldest', 'price_asc', 'price_desc', 'popular', 'rating', 'views',
]

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const sp = await searchParams
  const tCommon = await getTranslations('common')
  const tStates = await getTranslations('states')
  const tNav = await getTranslations('nav')

  /*
   * تبدیل پارامترهای خام URL به فیلترهای تایپ‌شده.
   * هر مقدار اعتبارسنجی می‌شود تا ورودی نامعتبر باعث خطای بک‌اند نشود.
   */
  const requestedSort = sp.sort as ProductSort | undefined
  const brandParam = sp.brand
  const brandList = Array.isArray(brandParam)
    ? brandParam
    : brandParam
      ? [brandParam]
      : []

  const filters: ProductFilters = {
    category: typeof sp.category === 'string' ? sp.category : undefined,
    brand: brandList.length > 0 ? brandList : undefined,
    q: typeof sp.q === 'string' ? sp.q : undefined,
    in_stock: sp.in_stock === 'true' || sp.in_stock === '1',
    on_sale: sp.on_sale === 'true' || sp.on_sale === '1',
    sort: requestedSort && VALID_SORTS.includes(requestedSort) ? requestedSort : 'newest',
    page: sp.page ? Math.max(1, Number(sp.page)) : 1,
    per_page: 12,
  }

  /* --- دریافت داده با مدیریت خطا --- */
  let productsResponse
  let categories
  let brands

  try {
    /*
     * سه درخواست موازی نه پشت‌سرهم.
     * زمان کل = کندترین درخواست، نه مجموع هر سه.
     */
    const [products, cats, brs] = await Promise.all([
      getProducts(filters, locale),
      getCategories(locale),
      getBrands(locale),
    ])
    productsResponse = products
    categories = cats.data
    brands = brs.data
  } catch (error) {
    /* حالت خطا — پیام قابل‌فهم به‌جای صفحه سفید */
    const isNetwork = error instanceof ApiError && error.isNetwork

    return (
      <div className="mx-auto max-w-(--container-content) px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-bold text-foreground">
            {tStates('errorTitle')}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {isNetwork
              ? locale === 'fa'
                ? 'سرور در دسترس نیست. مطمئن شوید بک‌اند لاراول روی پورت ۸۰۰۱ در حال اجراست.'
                : 'Server unavailable. Make sure the Laravel backend is running on port 8001.'
              : tStates('errorDesc')}
          </p>
        </div>
      </div>
    )
  }

  const products = productsResponse.data
  const meta = productsResponse.meta

  /** عنوان صفحه بر اساس فیلتر فعال. */
  const pageTitle = filters.q
    ? `${tCommon('search')}: ${filters.q}`
    : filters.category
      ? (categories.find((c) => c.slug === filters.category)?.name ?? tNav('products'))
      : filters.on_sale
        ? tNav('amazingOffers')
        : tNav('products')

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[{ label: tNav('home'), href: '/' }, { label: pageTitle }]}
        className="mb-4"
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* ============================================================
            پنل فیلتر — دسکتاپ ستون کناری، موبایل کشو
            ============================================================ */}
        <FilterPanel
          categories={categories}
          brands={brands}
          current={{
            category: filters.category,
            brands: brandList,
            inStock: Boolean(filters.in_stock),
            onSale: Boolean(filters.on_sale),
          }}
          resultCount={meta.total}
        />

        {/* ============================================================
            محتوای اصلی
            ============================================================ */}
        <main id="main-content" className="min-w-0 flex-1">
          {/* --- نوار عنوان و ابزارها --- */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">
                {pageTitle}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {formatNumber(meta.total, locale as Locale)}{' '}
                {locale === 'fa' ? 'کالا' : 'products'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* دکمه فیلتر موبایل داخل FilterPanel است و اینجا رندر می‌شود */}
              <SortDropdown current={filters.sort ?? 'newest'} />
            </div>
          </div>

          {/*
            شبکه محصولات، حالت خالی و صفحه‌بندی — همه در یک کامپوننت
            مشترک که صفحات دسته‌بندی، برند و جستجو هم از آن استفاده
            می‌کنند. پیش‌تر این منطق فقط اینجا بود و با اضافه شدن سه
            صفحه‌ی دیگر، چهار نسخه‌ی موازی می‌شد.
          */}
          <ProductGrid
            products={products}
            meta={meta}
            locale={locale as Locale}
            basePath="/products"
            searchParams={sp}
            emptyTitle={tStates('emptyTitle')}
            emptyDescription={tStates('emptyDesc')}
            emptyAction={{ href: '/products', label: tCommon('viewAll') }}
            paginationLabel={locale === 'fa' ? 'صفحه‌بندی' : 'Pagination'}
          />
        </main>
      </div>
    </div>
  )
}
