/**
 * صفحه‌ی یک برند
 * ===========================================================================
 * مسیر: /fa/brands/apple
 *
 * هدر برند (لوگو، معرفی، کشور، وب‌سایت) + محصولات همان برند.
 *
 * ⚠️ لوگوها مونوگرام تولیدشده‌اند، نه لوگوی واقعی شرکت‌ها.
 *    دلیلش در scripts/generate-brand-logos.mjs توضیح داده شده:
 *    علامت تجاری این برندها ثبت‌شده است و استفاده از لوگوی اصلی در
 *    یک نمونه‌کار درست نیست.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { ExternalLink, Tag } from 'lucide-react'
import Image from 'next/image'
import { getBrand, getProducts } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/client'
import type { Locale } from '@/i18n/routing'
import type { ProductSort } from '@/types/product'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ProductGrid } from '@/components/product/ProductGrid'
import { SortDropdown } from '@/components/filters/SortDropdown'
import { formatNumber } from '@/lib/utils/format'

const VALID_SORTS: ProductSort[] = [
  'newest', 'oldest', 'price_asc', 'price_desc', 'popular', 'rating', 'views',
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params

  try {
    const brand = (await getBrand(slug, locale)).data

    return {
      title: brand.name,
      description: brand.description || brand.name,
    }
  } catch {
    return {}
  }
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const sp = await searchParams
  const t = await getTranslations('brands')
  const tNav = await getTranslations('nav')
  const tStates = await getTranslations('states')

  const requestedSort = sp.sort as ProductSort | undefined
  const sort = requestedSort && VALID_SORTS.includes(requestedSort) ? requestedSort : 'newest'
  const page = sp.page ? Math.max(1, Number(sp.page)) : 1

  /* --- دریافت برند --- */
  let brand
  try {
    brand = (await getBrand(slug, locale)).data
  } catch (error) {
    /* فقط ۴۰۴ واقعی به صفحه‌ی «یافت نشد» تبدیل می‌شود */
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }

    return (
      <main
        id="main-content"
        className="mx-auto max-w-(--container-content) px-4 py-20 text-center sm:px-6 lg:px-8"
      >
        <h1 className="text-lg font-bold text-foreground">{tStates('errorTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </main>
    )
  }

  /* --- محصولات این برند --- */
  const { data: products, meta } = await getProducts(
    { brand: [slug], sort, page, per_page: 12 },
    locale,
  )

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      <Breadcrumb
        items={[
          { label: tNav('home'), href: '/' },
          { label: t('title'), href: '/brands' },
          { label: brand.name },
        ]}
      />

      {/* ============ هدر برند ============ */}
      <header className="mt-3 flex flex-col gap-4 rounded-(--radius-lg) border border-border bg-card p-5 sm:flex-row sm:items-start">
        <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-(--radius-md) border border-border bg-background">
          {brand.logo ? (
            <Image
              src={brand.logo}
              alt={brand.name}
              fill
              sizes="80px"
              className="object-contain p-1.5"
              priority
            />
          ) : (
            <Tag className="size-8 text-muted-foreground" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{brand.name}</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {t('productsCount', { count: formatNumber(meta.total, locale as Locale) })}
          </p>

          {brand.description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {brand.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {brand.countryCode && (
              <span>
                {t('country')}:{' '}
                <span dir="ltr" className="font-mono text-foreground">
                  {brand.countryCode}
                </span>
              </span>
            )}

            {/*
              لینک خارجی: rel="noopener noreferrer" اجباری است.
              بدون noopener، صفحه‌ی مقصد از طریق window.opener به تب
              ما دسترسی دارد و می‌تواند آدرسش را عوض کند.
            */}
            {brand.website && (
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                {t('visitWebsite')}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ============ نوار ابزار ============ */}
      <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {t('allProducts', { name: brand.name })}
        </h2>

        <SortDropdown current={sort} />
      </div>

      {/* ============ شبکه محصولات ============ */}
      <ProductGrid
        products={products}
        meta={meta}
        locale={locale as Locale}
        basePath={`/brands/${slug}`}
        searchParams={sp}
        emptyTitle={tStates('emptyTitle')}
        emptyDescription={t('emptyBrand')}
        emptyAction={{ href: '/brands', label: t('title') }}
        paginationLabel={locale === 'fa' ? 'صفحه‌بندی' : 'Pagination'}
      />
    </main>
  )
}
