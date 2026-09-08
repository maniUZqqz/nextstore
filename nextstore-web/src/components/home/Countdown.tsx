'use client'

/**
 * تایمر شمارش معکوس فروش ویژه
 * ---------------------------------------------------------------------------
 * عنصر امضایی بخش «پیشنهاد شگفت‌انگیز» در فروشگاه‌های بزرگ.
 * حس فوریت ایجاد می‌کند و نرخ تبدیل را بالا می‌برد.
 *
 * ⚠️ چالش hydration:
 *    زمان باقی‌مانده روی سرور و مرورگر یکسان نیست (چند صد میلی‌ثانیه
 *    اختلاف کافی است تا ثانیه‌ها فرق کنند). اگر مستقیم رندر کنیم،
 *    React خطای hydration mismatch می‌دهد.
 *    راه‌حل: تا قبل از mount، قاب خالی هم‌اندازه رندر می‌شود.
 */

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { Locale } from '@/i18n/routing'
import { timeRemaining, formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { useIsMounted } from '@/hooks/useIsMounted'

interface CountdownProps {
  /** زمان پایان به فرمت ISO 8601 */
  endsAt: string
  className?: string
}

export function Countdown({ endsAt, className }: CountdownProps) {
  const t = useTranslations('home.countdown')
  const locale = useLocale() as Locale

  const mounted = useIsMounted()
  const [time, setTime] = useState(() => timeRemaining(endsAt))

  useEffect(() => {
    /* به‌روزرسانی هر ثانیه */
    const timer = setInterval(() => {
      setTime(timeRemaining(endsAt))
    }, 1000)

    return () => clearInterval(timer)
  }, [endsAt])

  /* پیش از mount: قاب خالی هم‌اندازه تا چیدمان نپرد */
  if (!mounted) {
    return <div className={cn('h-9 w-44', className)} aria-hidden="true" />
  }

  if (time.isExpired) {
    return (
      <span className={cn('text-sm font-medium text-muted-foreground', className)}>
        {t('ended')}
      </span>
    )
  }

  /** واحدهای زمان به ترتیب نمایش. */
  const units = [
    { value: time.days, label: t('days') },
    { value: time.hours, label: t('hours') },
    { value: time.minutes, label: t('minutes') },
    { value: time.seconds, label: t('seconds') },
  ]

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      /* هر ثانیه تغییر می‌کند؛ off تا صفحه‌خوان مدام حرف نزند */
      aria-live="off"
      aria-label={t('endsIn')}
    >
      <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
        {t('endsIn')}
      </span>

      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'flex min-w-8 items-center justify-center rounded-(--radius-sm)',
                'bg-sale px-1.5 py-1 text-sm font-bold text-sale-foreground tabular-nums',
              )}
            >
              {/* ارقام همیشه دو رقمی تا عرض جعبه ثابت بماند */}
              {formatNumber(unit.value, locale).padStart(2, locale === 'fa' ? '۰' : '0')}
            </span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">{unit.label}</span>
          </div>

          {/* دونقطه جداکننده — بعد از آخرین واحد نمی‌آید */}
          {index < units.length - 1 && (
            <span className="pb-3 text-sm font-bold text-muted-foreground" aria-hidden="true">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
