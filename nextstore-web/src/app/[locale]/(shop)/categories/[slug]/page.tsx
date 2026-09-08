/**
 * صفحه‌ی یک دسته‌بندی
 * ===========================================================================
 * مسیر: /fa/categories/mobile-phones
 *
 * ساختار: بردکرامب واقعی (از ریشه تا این دسته) · بنر دسته ·
 *          چیپ زیردسته‌ها · مرتب‌سازی · شبکه محصولات · صفحه‌بندی
 *
 * ⚠️ تفاوت این صفحه با `/products?category=x`:
 *    آن آدرس یک *فیلتر* روی فهرست کل است؛ این یک *صفحه‌ی مقصد* با
 *    عنوان، توضیح سئویی و بردکرامب درست است. برای موتور جستجو دو
 *    چیز کاملاً متفاوت‌اند: صفحه‌ی دسته ایندکس می‌شود، صفحه‌ی
 *    فیلترشده معمولاً نه.
 *
 * ⚠️ محصولات زیردسته‌ها هم نمایش داده می‌شوند. بک‌اند با
 *    descendantIds() این کار را می‌کند؛ اگر فقط محصولات مستقیم
 *    نشان داده می‌شد، «موبایل و تبلت» تقریباً خالی بود چون همه‌ی
 *    کالاها در زیردسته‌ها ثبت شده‌اند.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { getCategory, getProducts } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/client'
import type { Locale } from '@/i18n/routing'
import type { ProductSort } from '@/types/product'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ProductGrid } from '@/components/product/ProductGrid'
import { SortDropdown } from '@/components/filters/SortDropdown'
import { Link } from '@/i18n/navigation'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/** مقادیر مجاز مرتب‌سازی — برای اعتبارسنجی ورودی URL. */
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
    const category = (await getCategory(slug, locale)).data

    return {
      title: category.name,
      /* توضیح دسته اگر باشد، وگرنه عنوان — هرگز رشته‌ی خالی */
      description: category.description || category.name,
    }
  } catch {
    /* متادیتا نباید صفحه را بترکاند؛ خود صفحه ۴۰۴ را مدیریت می‌کند */
    return {}
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const sp = await searchParams
  const t = await getTranslations('categories')
  const tNav = await getTranslations('nav')
  const tStates = await getTranslations('states')

  const requestedSort = sp.sort as ProductSort | undefined
  const sort = requestedSort && VALID_SORTS.includes(requestedSort) ? requestedSort : 'newest'
  const page = sp.page ? Math.max(1, Number(sp.page)) : 1

  /* --- دریافت دسته --- */
  let category
  try {
    category = (await getCategory(slug, locale)).data
  } catch (error) {
    /*
     * ۴۰۴ بک‌اند یعنی دسته وجود ندارد یا غیرفعال است → صفحه‌ی ۴۰۴.
     * هر خطای دیگری (قطعی شبکه) نباید به ۴۰۴ ترجمه شود، چون به
     * کاربر دروغ می‌گوید «این دسته وجود ندارد» در حالی که فقط
     * سرور در دسترس نیست.
     */
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

  /* --- دریافت محصولات این دسته --- */
  const response = await getProducts(
    { category: slug, sort, page, per_page: 12 },
    locale,
  )

  const { data: products, meta } = response

  /** بردکرامب از مسیر واقعی دسته ساخته می‌شود، نه حدس زده. */
  const breadcrumbItems = [
    { label: tNav('home'), href: '/' },
    { label: t('title'), href: '/categories' },
    ...category.breadcrumb.map((node, index) => ({
      label: node.name,
      /* آخرین گره خودِ صفحه است و لینک نمی‌شود */
      href: index < category.breadcrumb.length - 1
        ? `/categories/${node.slug}`
        : undefined,
    })),
  ]

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      <Breadcrumb items={breadcrumbItems} />

      {/* ============ بنر دسته ============ */}
      {/*
        ⚠️ کارت فقط وقتی کشیده می‌شود که محتوایی برای نشان دادن باشد.
           زیردسته‌ها معمولاً نه تصویر دارند نه توضیح؛ با کارت ثابت،
           یک مستطیل بزرگ و تقریباً خالی بالای صفحه می‌ماند که شبیه
           بخشی است که بارگذاری نشده. بدون کارت، همان دو خط عنوان
           جمع‌وجور و تمیز می‌نشیند.
      */}
      <header
        className={cn(
          'mt-3 flex flex-col gap-4 sm:flex-row sm:items-center',
          (category.image || category.description) &&
            'rounded-(--radius-lg) border border-border bg-card p-5',
        )}
      >
        {category.image && (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-(--radius-md) border border-border">
            <Image src={category.image} alt="" fill sizes="80px" className="object-cover" />
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {category.name}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {t('productsCount', { count: formatNumber(meta.total, locale as Locale) })}
          </p>

          {/* توضیح سئویی — فقط اگر واقعاً متنی وجود داشته باشد */}
          {category.description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>
      </header>

      {/* ============ زیردسته‌ها ============ */}
      {category.children.length > 0 && (
        <nav aria-label={t('subcategories')} className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/categories/${child.slug}`}
                  className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* ============ نوار ابزار ============ */}
      <div className="mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {t('inCategory', { name: category.name })}
        </h2>

        <SortDropdown current={sort} />
      </div>

      {/* ============ شبکه محصولات ============ */}
      <ProductGrid
        products={products}
        meta={meta}
        locale={locale as Locale}
        basePath={`/categories/${slug}`}
        searchParams={sp}
        emptyTitle={tStates('emptyTitle')}
        emptyDescription={t('emptyCategory')}
        emptyAction={{ href: '/products', label: t('browseAll') }}
        paginationLabel={locale === 'fa' ? 'صفحه‌بندی' : 'Pagination'}
      />
    </main>
  )
}
