'use client'

/**
 * انتخابگر تعداد
 * ---------------------------------------------------------------------------
 * دو دکمه کم/زیاد با نمایش عدد بین آن‌ها.
 *
 * قواعد:
 *   - کمتر از حداقل و بیشتر از موجودی انبار نمی‌رود
 *   - دکمه‌ها در مرزها غیرفعال می‌شوند (نه اینکه بی‌صدا کاری نکنند)
 *   - عدد با ارقام محلی نمایش داده می‌شود (۳ در فارسی، 3 در انگلیسی)
 */

import { useLocale, useTranslations } from 'next-intl'
import { Minus, Plus } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  /** سقف — معمولاً موجودی انبار */
  max: number
  className?: string
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  className,
}: QuantitySelectorProps) {
  const t = useTranslations('product')
  const locale = useLocale() as Locale

  const canDecrease = value > min
  const canIncrease = value < max

  return (
    <div
      className={cn(
        'inline-flex h-12 items-center rounded-(--radius-md) border border-border',
        className,
      )}
    >
      {/* دکمه کاهش */}
      <button
        type="button"
        onClick={() => canDecrease && onChange(value - 1)}
        disabled={!canDecrease}
        aria-label={t('decreaseQuantity')}
        className="inline-flex size-11 items-center justify-center rounded-(--radius-md) text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>

      {/*
        نمایش عدد.
        aria-live تغییر مقدار را به صفحه‌خوان اعلام می‌کند، وگرنه کاربر
        نابینا بعد از فشردن دکمه نمی‌فهمد تعداد چند شد.
      */}
      <span
        className="min-w-10 text-center text-sm font-semibold text-foreground tabular-nums"
        aria-live="polite"
        aria-label={t('quantity')}
      >
        {formatNumber(value, locale)}
      </span>

      {/* دکمه افزایش */}
      <button
        type="button"
        onClick={() => canIncrease && onChange(value + 1)}
        disabled={!canIncrease}
        aria-label={t('increaseQuantity')}
        className="inline-flex size-11 items-center justify-center rounded-(--radius-md) text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
