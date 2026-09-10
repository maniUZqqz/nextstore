'use client'

/**
 * صفحه‌بندی مشترک — پنل مدیریت و صفحه‌های حساب کاربری
 * ---------------------------------------------------------------------------
 * چرا کامپوننت جدا و نه تکرار در هر فهرست؟
 *   فهرست سفارش‌ها و فهرست محصولات هر دو صفحه‌بندی یکسان دارند.
 *   با یک کامپوننت، رفتار کیبورد و دسترسی‌پذیری یک بار درست می‌شود.
 *
 * ⚠️ همه‌ی کلیدهای ترجمه از فضای `common` می‌آید، نه `admin`.
 *
 *    این کامپوننت در `components/account/` هم استفاده می‌شود و
 *    آن‌ها مسیر فروشگاهی‌اند. بسته‌ی پیام صفحه‌های فروشگاه فضای
 *    `admin` را ندارد (`withoutAdminMessages` در
 *    `i18n/messages.ts` حذفش می‌کند)، پس هر کلیدی از آن فضا
 *    صفحه را با MISSING_MESSAGE می‌شکند.
 *
 *    اگر متنی به این کامپوننت اضافه کردی، کلیدش باید در
 *    `common` باشد.
 *
 * ⚠️ نکته‌ی دسترسی‌پذیری: کل ناوبری داخل <nav> با aria-label است و
 *    صفحه‌ی فعال aria-current="page" می‌گیرد؛ بدون آن، کاربر
 *    صفحه‌خوان نمی‌فهمد کجاست.
 */

import { useTranslations, useLocale } from 'next-intl'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import type { PaginationMeta } from '@/types/api'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface Props {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function AdminPagination({ meta, onPageChange }: Props) {
  const t = useTranslations('common')
  const locale = useLocale() as Locale

  /* یک صفحه یعنی چیزی برای ناوبری نیست */
  if (meta.last_page <= 1) return null

  /**
   * ساخت فهرست کوتاه صفحات: همیشه اول و آخر، به‌علاوه‌ی همسایه‌های
   * صفحه‌ی فعلی. با ۵۰ صفحه، نمایش همه‌ی دکمه‌ها نوار را می‌شکند.
   * مقدار null یعنی «…» نمایش داده شود.
   */
  const pages: Array<number | null> = []
  const { current_page: current, last_page: last } = meta

  for (let page = 1; page <= last; page++) {
    const isEdge = page === 1 || page === last
    const isNear = Math.abs(page - current) <= 1

    if (isEdge || isNear) {
      pages.push(page)
    } else if (pages[pages.length - 1] !== null) {
      pages.push(null)
    }
  }

  /*
   * در فارسی جهت صفحه RTL است، پس آیکون «قبلی» باید به راست
   * اشاره کند. با شرط زبان، جهت فلش با جهت خواندن هم‌راستا می‌شود.
   */
  const PrevIcon = locale === 'fa' ? ChevronRight : ChevronLeft
  const NextIcon = locale === 'fa' ? ChevronLeft : ChevronRight

  const buttonBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-(--radius-md) border border-border px-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav
      aria-label={t('page', { page: current, total: last })}
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-xs text-muted-foreground">
        {t('page', {
          page: formatNumber(current, locale),
          total: formatNumber(last, locale),
        })}
      </p>

      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            aria-label={t('previous')}
            className={cn(buttonBase, 'hover:bg-accent')}
          >
            <PrevIcon className="size-4" aria-hidden="true" />
          </button>
        </li>

        {pages.map((page, index) =>
          page === null ? (
            /* جداکننده — از ناوبری صفحه‌خوان پنهان می‌شود */
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === current ? 'page' : undefined}
                className={cn(
                  buttonBase,
                  page === current
                    ? 'border-primary bg-primary font-semibold text-primary-foreground'
                    : 'hover:bg-accent',
                )}
              >
                {formatNumber(page, locale)}
              </button>
            </li>
          ),
        )}

        <li>
          <button
            type="button"
            onClick={() => onPageChange(current + 1)}
            disabled={current >= last}
            aria-label={t('next')}
            className={cn(buttonBase, 'hover:bg-accent')}
          >
            <NextIcon className="size-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
