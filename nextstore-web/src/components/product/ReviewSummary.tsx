'use client'

/**
 * خلاصه امتیاز محصول — عدد بزرگ + نمودار میله‌ای توزیع ستاره
 * ---------------------------------------------------------------------------
 * نمودار به کاربر می‌گوید «۴.۵» از کجا آمده: از ۱۰۰ نظر پنج‌ستاره،
 * یا از ۲ نظر که یکی ۵ و یکی ۴ بوده. همین تفاوت، اعتماد می‌سازد.
 */

import { useTranslations, useLocale } from 'next-intl'
import { Star } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import { RatingStars } from '@/components/common/RatingStars'
import { formatNumber } from '@/lib/utils/format'
import type { ReviewStats } from '@/types/review'

export function ReviewSummary({ stats }: { stats: ReviewStats }) {
  const t = useTranslations('reviews')
  const locale = useLocale() as Locale

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      {/* --- عدد بزرگ --- */}
      <div className="flex shrink-0 flex-col items-center sm:w-40">
        <span className="text-4xl font-black text-foreground tabular-nums">
          {formatNumber(stats.average, locale)}
        </span>

        <RatingStars value={stats.average} size="md" className="mt-2" />

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t('basedOn', { count: stats.total })}
        </p>
      </div>

      {/* --- نمودار میله‌ای --- */}
      <ul className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribution[String(star)] ?? 0
          /* تقسیم بر صفر → NaN و میله‌ی نامرئی. صفر امن‌تر است. */
          const percent = stats.total > 0 ? (count / stats.total) * 100 : 0

          return (
            <li key={star} className="flex items-center gap-2.5 text-xs">
              {/* برچسب ستاره */}
              <span className="flex w-9 shrink-0 items-center justify-end gap-1 tabular-nums text-muted-foreground">
                {formatNumber(star, locale)}
                <Star className="size-3 fill-warning text-warning" aria-hidden="true" />
              </span>

              {/*
                نوار پیشرفت.
                role/aria تا صفحه‌خوان هم توزیع را بفهمد، نه فقط
                کاربر بینا. بدون آن این بخش برای صفحه‌خوان صرفاً
                چند div خالی است.
              */}
              {/*
                data-rating-bar یک قلاب پایدار برای تست‌های مرورگر است.
                بدون آن، سلکتورِ role="img" ستاره‌های داخل کارت نظرها
                را هم می‌گرفت و شمارش نوارها چند برابر می‌شد.
              */}
              <span
                role="img"
                data-rating-bar={star}
                aria-label={`${formatNumber(star, locale)} — ${formatNumber(count, locale)}`}
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <span
                  className="block h-full rounded-full bg-warning transition-[width] duration-[var(--duration-normal)]"
                  style={{ width: `${percent}%` }}
                />
              </span>

              <span className="w-8 shrink-0 text-start tabular-nums text-muted-foreground">
                {formatNumber(count, locale)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
