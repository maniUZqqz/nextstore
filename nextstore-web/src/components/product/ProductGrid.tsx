/**
 * شبکه‌ی محصولات + صفحه‌بندی
 * ---------------------------------------------------------------------------
 * چهار صفحه به یک شبکه‌ی یکسان محصول نیاز دارند:
 *     /products · /categories/[slug] · /brands/[slug] · /search
 *
 * ⚠️ چرا کامپوننت مشترک و نه کپی در هر صفحه؟
 *    نسخه‌ی اولیه فقط در /products بود. با اضافه شدن سه صفحه‌ی
 *    دیگر، کپی کردنش یعنی چهار جا برای اصلاح هر باگ چیدمان و
 *    چهار جا برای فراموش کردن `priority` روی چهار کارت اول.
 *    یک بار درست، همه‌جا درست.
 *
 * Server Component است — هیچ تعامل کلاینتی ندارد و لینک‌های
 * صفحه‌بندی، ناوبری واقعی‌اند نه state.
 */

import { PackageSearch } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { Product } from '@/types/product'
import type { PaginationMeta } from '@/types/api'
import { ProductCard } from '@/components/product/ProductCard'
import { cn } from '@/lib/utils/cn'

export function ProductGrid({
  products,
  meta,
  locale,
  basePath,
  searchParams,
  emptyTitle,
  emptyDescription,
  emptyAction,
  paginationLabel,
}: {
  products: Product[]
  meta: PaginationMeta
  locale: Locale
  /** مسیر پایه برای لینک‌های صفحه‌بندی، مثلاً `/brands/apple` */
  basePath: string
  /** پارامترهای فعلی URL — تا فیلترها هنگام تغییر صفحه حفظ شوند */
  searchParams: Record<string, string | string[] | undefined>
  emptyTitle: string
  emptyDescription: string
  /** دکمه‌ی پیشنهادی در حالت خالی؛ اختیاری */
  emptyAction?: { href: string; label: string }
  paginationLabel: string
}) {
  /* --- حالت خالی --- */
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-(--radius-lg) border border-border bg-card py-20 text-center">
        <PackageSearch className="size-12 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">{emptyTitle}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {emptyDescription}
        </p>

        {emptyAction && (
          <Link
            href={emptyAction.href}
            className="mt-6 inline-flex h-10 items-center rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {emptyAction.label}
          </Link>
        )}
      </div>
    )
  }

  /**
   * ساخت آدرس یک صفحه، با حفظ همه‌ی پارامترهای فعلی جز `page`.
   *
   * ⚠️ بدون این کار، رفتن به صفحه‌ی ۲ فیلترها و مرتب‌سازی را دور
   *    می‌ریخت و کاربر ناگهان نتایج بی‌ربط می‌دید.
   */
  const pageHref = (page: number) => {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page') continue
      if (typeof value === 'string') query.set(key, value)
      else if (Array.isArray(value)) value.forEach((v) => query.append(key, v))
    }

    query.set('page', String(page))

    return `${basePath}?${query.toString()}`
  }

  /*
   * فهرست کوتاه صفحات: همیشه اول و آخر، به‌علاوه همسایه‌های صفحه‌ی
   * فعلی. با ۲۰ صفحه، نمایش همه‌ی دکمه‌ها نوار را می‌شکند.
   * null یعنی «…».
   */
  const pages: Array<number | null> = []

  for (let page = 1; page <= meta.last_page; page++) {
    const isEdge = page === 1 || page === meta.last_page
    const isNear = Math.abs(page - meta.current_page) <= 1

    if (isEdge || isNear) {
      pages.push(page)
    } else if (pages[pages.length - 1] !== null) {
      pages.push(null)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            /* ۴ کارت اول با اولویت بارگذاری می‌شوند (بهبود LCP) */
            priority={index < 4}
          />
        ))}
      </div>

      {meta.last_page > 1 && (
        <nav
          aria-label={paginationLabel}
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {pages.map((page, index) =>
            page === null ? (
              <span
                key={`gap-${index}`}
                aria-hidden="true"
                className="px-1 text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Link
                key={page}
                href={pageHref(page)}
                aria-current={page === meta.current_page ? 'page' : undefined}
                className={cn(
                  'inline-flex size-10 items-center justify-center rounded-(--radius-md) text-sm transition-colors',
                  page === meta.current_page
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'border border-border text-foreground hover:bg-accent',
                )}
              >
                {new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(page)}
              </Link>
            ),
          )}
        </nav>
      )}
    </>
  )
}
