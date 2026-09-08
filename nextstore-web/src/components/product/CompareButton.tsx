'use client'

/**
 * دکمه‌ی افزودن به مقایسه
 * ---------------------------------------------------------------------------
 * روی کارت محصول و صفحه‌ی جزئیات استفاده می‌شود.
 *
 * ⚠️ مثل دکمه‌ی علاقه‌مندی، این دکمه ممکن است روی کارتی بنشیند که کل
 *    سطحش یک لینک است. بدون `preventDefault` و `stopPropagation`،
 *    کلیک روی آن کاربر را به صفحه‌ی محصول می‌برد.
 *
 * ⚠️ پیش از mount همیشه حالت «خاموش» رندر می‌شود: فهرست مقایسه در
 *    localStorage است و سرور از آن خبر ندارد؛ رندر حالت واقعی در
 *    اولین پاس، hydration را می‌شکند.
 */

import { useTranslations } from 'next-intl'
import { Scale } from 'lucide-react'
import { toast } from 'sonner'
import { useCompareStore, MAX_COMPARE } from '@/store/compare-store'
import { useIsMounted } from '@/hooks/useIsMounted'
import { cn } from '@/lib/utils/cn'

export function CompareButton({
  slug,
  className,
  /** نمای گسترده با متن — برای صفحه‌ی جزئیات محصول */
  withLabel = false,
}: {
  slug: string
  className?: string
  withLabel?: boolean
}) {
  const t = useTranslations('compare')

  const toggle = useCompareStore((state) => state.toggle)
  const slugs = useCompareStore((state) => state.slugs)

  const mounted = useIsMounted()
  const isActive = mounted && slugs.includes(slug)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const result = toggle(slug)

    if (result === 'full') {
      /*
       * سقف پر است — پیام هشدار، نه موفقیت.
       * toast موفقیت اینجا دروغ می‌گفت: چیزی اضافه نشد.
       */
      toast.warning(t('full', { max: MAX_COMPARE }))

      return
    }

    toast.success(result === 'added' ? t('added') : t('removed'))
  }

  const label = isActive ? t('remove') : t('add')

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isActive}
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) border px-4 text-sm font-medium transition-colors',
          isActive
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-foreground hover:bg-accent',
          className,
        )}
      >
        <Scale className="size-4" aria-hidden="true" />
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      aria-pressed={isActive}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-full',
        'bg-background/90 backdrop-blur-sm transition-all duration-[var(--duration-fast)]',
        'hover:scale-110 active:scale-95',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      <Scale className="size-4" aria-hidden="true" />
    </button>
  )
}
