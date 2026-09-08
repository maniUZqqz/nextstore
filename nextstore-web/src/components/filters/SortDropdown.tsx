'use client'

/**
 * دراپ‌داون مرتب‌سازی محصولات
 * ---------------------------------------------------------------------------
 * با تغییر مقدار، پارامتر sort در URL به‌روز می‌شود و صفحه دوباره
 * سمت سرور رندر می‌گردد.
 *
 * چرا URL و نه state؟
 *   لینک قابل اشتراک‌گذاری می‌ماند و دکمه بازگشت مرورگر درست کار می‌کند.
 *
 * پارامتر page هنگام تغییر مرتب‌سازی حذف می‌شود — اگر کاربر در صفحه ۳
 * باشد و ترتیب را عوض کند، باید به صفحه اول برگردد وگرنه ممکن است
 * صفحه‌ای خالی ببیند.
 */

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpDown, Loader2 } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/navigation'
import type { ProductSort } from '@/types/product'
import { cn } from '@/lib/utils/cn'

/** گزینه‌های مرتب‌سازی — باید با SORT_MAP بک‌اند یکسان باشد. */
const SORT_OPTIONS: ProductSort[] = [
  'newest',
  'popular',
  'price_asc',
  'price_desc',
  'rating',
  'views',
]

export function SortDropdown({ current }: { current: ProductSort }) {
  const t = useTranslations('filters')
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  /** به‌روزرسانی پارامتر sort در URL. */
  const handleChange = (value: string) => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    )

    params.set('sort', value)
    /* بازگشت به صفحه اول پس از تغییر ترتیب */
    params.delete('page')

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowUpDown className="size-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{t('sortBy')}</span>
      </label>

      <select
        id="sort-select"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className={cn(
          'h-10 rounded-(--radius-md) border border-input bg-card px-3 pe-8',
          'text-sm text-foreground outline-none transition-colors',
          'focus:border-primary disabled:opacity-50',
          /* فلش پیش‌فرض مرورگر جای خودش را حفظ می‌کند */
          'cursor-pointer',
        )}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(`sort.${option}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
