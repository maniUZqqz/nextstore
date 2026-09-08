import { getTranslations } from 'next-intl/server'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { PaginationMeta } from '@/types/api'

/**
 * صفحه‌بندی مجله — با لینک واقعی، نه دکمه
 * ---------------------------------------------------------------------------
 * ⚠️ چرا Link و نه دکمه‌ی کلاینتی؟
 *    صفحات مجله باید ایندکس شوند. با دکمه‌ی جاوااسکریپتی، خزنده‌ی
 *    گوگل به صفحه‌ی دوم به بعد نمی‌رسد و آن مقالات عملاً نامرئی
 *    می‌مانند. لینک واقعی هم برای خزنده کار می‌کند، هم با کلیک وسط
 *    ماوس در تب جدید باز می‌شود، هم بدون جاوااسکریپت کار می‌کند.
 */
export async function BlogPagination({
  meta,
  basePath,
  searchParams,
  locale,
}: {
  meta: PaginationMeta
  /** مسیر پایه بدون پیشوند زبان، مثلاً '/blog' */
  basePath: string
  /** پارامترهای فعلی — حفظ می‌شوند تا فیلتر با تعویض صفحه نپرد */
  searchParams: Record<string, string | string[] | undefined>
  locale: Locale
}) {
  const t = await getTranslations('common')

  /* یک صفحه یعنی چیزی برای ناوبری نیست */
  if (meta.last_page <= 1) return null

  /** ساخت آدرس یک صفحه با حفظ بقیه‌ی پارامترها. */
  const hrefFor = (page: number) => {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page' || value === undefined) continue
      query.set(key, Array.isArray(value) ? value[0] : value)
    }

    /* صفحه‌ی یک پارامتر نمی‌گیرد تا آدرس متعارف تمیز بماند */
    if (page > 1) query.set('page', String(page))

    const qs = query.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  /**
   * فهرست کوتاه صفحات: همیشه اول و آخر، به‌علاوه‌ی همسایه‌های صفحه‌ی
   * فعلی. با ۵۰ صفحه، نمایش همه‌ی شماره‌ها نوار را می‌شکند.
   */
  const pages: (number | 'gap')[] = []
  for (let page = 1; page <= meta.last_page; page++) {
    const isEdge = page === 1 || page === meta.last_page
    const isNear = Math.abs(page - meta.current_page) <= 1

    if (isEdge || isNear) {
      pages.push(page)
    } else if (pages[pages.length - 1] !== 'gap') {
      pages.push('gap')
    }
  }

  const linkClass =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-(--radius-md) border border-border px-3 text-sm font-medium transition-colors hover:bg-accent'

  return (
    <nav aria-label={t('next')} className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {/*
        فلش «قبلی» با آیکون منطقی: در RTL باید به راست اشاره کند.
        ChevronRight در RTL و ChevronLeft در LTR — با کلاس rtl/ltr
        به‌جای شرط جاوااسکریپتی، تا خروجی سرور و کلاینت یکی بماند.
      */}
      {meta.current_page > 1 && (
        <Link href={hrefFor(meta.current_page - 1)} className={linkClass} rel="prev">
          <ChevronRight className="size-4 ltr:hidden" aria-hidden="true" />
          <ChevronLeft className="size-4 rtl:hidden" aria-hidden="true" />
        </Link>
      )}

      {pages.map((page, index) =>
        page === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={hrefFor(page)}
            aria-current={page === meta.current_page ? 'page' : undefined}
            className={cn(
              linkClass,
              page === meta.current_page
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary'
                : 'text-foreground',
            )}
          >
            {formatNumber(page, locale)}
          </Link>
        ),
      )}

      {meta.current_page < meta.last_page && (
        <Link href={hrefFor(meta.current_page + 1)} className={linkClass} rel="next">
          <ChevronLeft className="size-4 ltr:hidden" aria-hidden="true" />
          <ChevronRight className="size-4 rtl:hidden" aria-hidden="true" />
        </Link>
      )}
    </nav>
  )
}
