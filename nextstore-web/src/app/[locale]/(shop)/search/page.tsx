/**
 * صفحه‌ی جستجو
 * ===========================================================================
 * مسیر: /fa/search?q=گوشی
 *
 * سه حالت کاملاً متفاوت دارد و هر سه مهم‌اند:
 *   ۱. بدون عبارت  → راهنما + پیشنهاد دسته‌بندی‌ها
 *   ۲. با نتیجه    → شبکه محصولات + مرتب‌سازی + صفحه‌بندی
 *   ۳. بدون نتیجه  → پیام روشن + راهنمای جستجو + راه خروج
 *
 * ⚠️ حالت ۳ جایی است که بیشتر فروشگاه‌ها کوتاهی می‌کنند: یک
 *    «نتیجه‌ای یافت نشد» خشک می‌گذارند و کاربر بن‌بست می‌بیند.
 *    اینجا هم دلیل احتمالی گفته می‌شود و هم راه ادامه دادن.
 *
 * ⚠️ نکته‌ی جستجوی فارسی: بک‌اند با json_extract روی ستون چندزبانه
 *    جستجو می‌کند، نه LIKE ساده. علتش این است که json_encode
 *    حروف غیر ASCII را به \uXXXX تبدیل می‌کند و LIKE مستقیم روی
 *    ستون، همیشه صفر نتیجه می‌داد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SearchX, Search, Lightbulb } from 'lucide-react'
import { getProducts, getCategories } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/client'
import type { Locale } from '@/i18n/routing'
import type { ProductSort, Category } from '@/types/product'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ProductGrid } from '@/components/product/ProductGrid'
import { SortDropdown } from '@/components/filters/SortDropdown'
import { Link } from '@/i18n/navigation'
import { formatNumber } from '@/lib/utils/format'

const VALID_SORTS: ProductSort[] = [
  'newest', 'oldest', 'price_asc', 'price_desc', 'popular', 'rating', 'views',
]

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const { q } = await searchParams
  const t = await getTranslations({ locale, namespace: 'searchPage' })

  return {
    title: q ? t('resultsFor', { term: q }) : t('title'),
    /*
     * صفحه‌ی نتایج جستجو نباید ایندکس شود.
     * تعداد ترکیب‌های ممکن بی‌نهایت است و گوگل آن‌ها را «محتوای
     * کم‌ارزش» می‌شمارد؛ ایندکس شدنشان به رتبه‌ی کل دامنه آسیب می‌زند.
     */
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const sp = await searchParams
  const t = await getTranslations('searchPage')
  const tNav = await getTranslations('nav')
  const tStates = await getTranslations('states')

  const term = typeof sp.q === 'string' ? sp.q.trim() : ''

  const requestedSort = sp.sort as ProductSort | undefined
  const sort = requestedSort && VALID_SORTS.includes(requestedSort) ? requestedSort : 'newest'
  const page = sp.page ? Math.max(1, Number(sp.page)) : 1

  const breadcrumb = (
    <Breadcrumb items={[{ label: tNav('home'), href: '/' }, { label: t('title') }]} />
  )

  /* ==========================================================
     حالت ۱ — هنوز چیزی جستجو نشده
     ========================================================== */
  if (!term) {
    let categories: Category[] = []
    try {
      categories = (await getCategories(locale)).data
    } catch {
      /* پیشنهادها اختیاری‌اند؛ نبودشان صفحه را خراب نمی‌کند */
    }

    return (
      <main
        id="main-content"
        className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
      >
        {breadcrumb}

        <div className="mt-8 flex flex-col items-center rounded-(--radius-lg) border border-border bg-card px-6 py-16 text-center">
          <Search className="size-12 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-bold text-foreground">{t('promptTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('promptDesc')}</p>

          {categories.length > 0 && (
            <>
              <p className="mt-8 text-xs text-muted-foreground">{t('suggestions')}</p>
              <ul className="mt-3 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 8).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    )
  }

  /* ==========================================================
     حالت ۲ و ۳ — عبارت داریم، نتیجه را می‌گیریم
     ========================================================== */
  let products
  let meta

  try {
    const response = await getProducts({ q: term, sort, page, per_page: 12 }, locale)
    products = response.data
    meta = response.meta
  } catch (error) {
    const isNetwork = error instanceof ApiError && error.isNetwork

    return (
      <main
        id="main-content"
        className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
      >
        {breadcrumb}

        <div className="mt-8 flex flex-col items-center rounded-(--radius-lg) border border-border bg-card py-16 text-center">
          <h1 className="text-lg font-bold text-foreground">{tStates('errorTitle')}</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {isNetwork
              ? locale === 'fa'
                ? 'سرور در دسترس نیست. مطمئن شوید بک‌اند لاراول روی پورت ۸۰۰۱ در حال اجراست.'
                : 'Server unavailable. Make sure the Laravel backend is running on port 8001.'
              : tStates('errorDesc')}
          </p>
        </div>
      </main>
    )
  }

  const hasResults = products.length > 0

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      {breadcrumb}

      <div className="mt-3 mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground sm:text-xl">
            {t('resultsFor', { term })}
          </h1>

          {/*
            شمارش فقط وقتی نتیجه‌ای هست نمایش داده می‌شود.
            با صفر نتیجه، «۰ محصول پیدا شد» بلافاصله بالای کادر
            «چیزی پیدا نشد» می‌نشست و همان حرف را دو بار می‌زد.
          */}
          {hasResults && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('resultsCount', { count: formatNumber(meta.total, locale as Locale) })}
            </p>
          )}
        </div>

        {/* مرتب‌سازی وقتی نتیجه‌ای نیست، معنایی ندارد */}
        {hasResults && <SortDropdown current={sort} />}
      </div>

      {hasResults ? (
        <ProductGrid
          products={products}
          meta={meta}
          locale={locale as Locale}
          basePath="/search"
          searchParams={sp}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDesc', { term })}
          paginationLabel={locale === 'fa' ? 'صفحه‌بندی' : 'Pagination'}
        />
      ) : (
        /* ==========================================================
           حالت ۳ — بدون نتیجه، اما بدون بن‌بست
           ========================================================== */
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-card px-6 py-16 text-center">
          <SearchX className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">{t('emptyTitle')}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t('emptyDesc', { term })}
          </p>

          <div className="mt-6 w-full max-w-sm rounded-(--radius-md) border border-border bg-background p-4 text-start">
            <p className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Lightbulb className="size-4 text-warning" aria-hidden="true" />
              {t('tips')}
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-6 text-muted-foreground">
              <li>· {t('tipShorter')}</li>
              <li>· {t('tipSpelling')}</li>
              <li>· {t('tipBrowse')}</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/categories"
              className="inline-flex h-10 items-center justify-center rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {tNav('categories')}
            </Link>
            <Link
              href="/products"
              className="inline-flex h-10 items-center justify-center rounded-(--radius-md) border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {tNav('products')}
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
