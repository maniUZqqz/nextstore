'use client'

/**
 * نوار شناور مقایسه
 * ---------------------------------------------------------------------------
 * وقتی چیزی برای مقایسه انتخاب شده باشد، پایین صفحه ظاهر می‌شود.
 *
 * ⚠️ بدون این نوار، قابلیت مقایسه عملاً نامرئی بود.
 *
 *    کاربر روی دو محصول دکمه‌ی مقایسه می‌زد و بعد هیچ راهی برای رسیدن
 *    به صفحه‌ی `/compare` نداشت — نه در هدر بود و نه در منو. یک دکمه
 *    که به هیچ‌جا نمی‌رسد، از نبودنش بدتر است.
 *
 * ⚠️ در خود صفحه‌ی مقایسه نمایش داده نمی‌شود: نواری که به همان صفحه‌ی
 *    جاری لینک می‌دهد فقط فضا می‌گیرد.
 */

import { useTranslations } from 'next-intl'
import { Scale, X } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { useCompareStore } from '@/store/compare-store'
import { useIsMounted } from '@/hooks/useIsMounted'

export function CompareBar() {
  const t = useTranslations('compare')
  const pathname = usePathname()

  const slugs = useCompareStore((state) => state.slugs)
  const clear = useCompareStore((state) => state.clear)

  const mounted = useIsMounted()

  /* پیش از mount چیزی رندر نمی‌شود — فهرست در localStorage است */
  if (!mounted || slugs.length === 0 || pathname.startsWith('/compare')) {
    return null
  }

  return (
    <div
      /*
       * ⚠️ `bottom-16` روی موبایل و `bottom-4` از md به بالا.
       *
       *    ناوبری پایین (BottomNav) فقط تا md دیده می‌شود و ارتفاعش
       *    حدود ۶۴ پیکسل است. بدون این فاصله، نوار مقایسه دقیقاً روی
       *    دکمه‌های ناوبری می‌نشست و هر دو غیرقابل استفاده می‌شدند.
       */
      className="fixed inset-x-0 bottom-16 z-30 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg md:bottom-4"
      role="status"
    >
      <span className="flex items-center gap-2 text-sm text-foreground">
        <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
        {t('barCount', { count: slugs.length })}
      </span>

      <Link
        href="/compare"
        className="inline-flex h-9 items-center rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t('barCta')}
      </Link>

      <button
        type="button"
        onClick={clear}
        aria-label={t('clear')}
        title={t('clear')}
        className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
