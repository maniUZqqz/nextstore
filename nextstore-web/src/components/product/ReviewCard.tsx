'use client'

/**
 * کارت یک نظر
 * ---------------------------------------------------------------------------
 * نویسنده · امتیاز · نشان خرید تأییدشده · متن · نقاط قوت و ضعف ·
 * دکمه «مفید بود».
 */

import { useTranslations, useLocale } from 'next-intl'
import { ThumbsUp, BadgeCheck, Plus, Minus } from 'lucide-react'
import type { Locale } from '@/i18n/routing'
import { RatingStars } from '@/components/common/RatingStars'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { Review } from '@/types/review'

interface ReviewCardProps {
  review: Review
  /** آیا کاربر وارد شده؟ مهمان نمی‌تواند رأی بدهد. */
  isAuthenticated: boolean
  /** نام کاربر جاری — برای تشخیص «نظر خودم» */
  currentUserName: string | null
  onVote: (reviewId: number) => void
}

export function ReviewCard({
  review,
  isAuthenticated,
  currentUserName,
  onVote,
}: ReviewCardProps) {
  const t = useTranslations('reviews')
  const locale = useLocale() as Locale

  /*
   * تشخیص «نظر خودم» با نام.
   *
   * ⚠️ راه‌حل کامل، شناسه‌ی کاربر در خروجی نظر است. اما نام نویسنده
   *    تنها چیزی است که API عمومی می‌دهد و افشای شناسه‌ی کاربران
   *    در یک فهرست عمومی ارزشش را ندارد. اگر دو کاربر هم‌نام باشند،
   *    بدترین اتفاق این است که دکمه‌ی رأی غیرفعال نشان داده می‌شود
   *    و سرور هم در هر حال با ۴۲۲ جلویش را می‌گیرد.
   */
  const isOwn = Boolean(currentUserName && review.author?.name === currentUserName)

  /** مهمان و صاحب نظر نمی‌توانند رأی بدهند. */
  const canVote = isAuthenticated && !isOwn

  const voteTitle = isOwn
    ? t('ownReview')
    : !isAuthenticated
      ? t('loginToVote')
      : t('helpful')

  return (
    /*
     * data-review یک قلاب پایدار برای تست‌های مرورگر است.
     * بدون آن، سلکتور «li داخل پنل نظرات» عناصر فهرست نقاط قوت و
     * ضعف را هم می‌گرفت و شمارش نظرات چند برابر می‌شد.
     */
    <li
      data-review={review.id}
      className="border-b border-border py-5 last:border-b-0"
    >
      {/* --- سربرگ: نویسنده و امتیاز --- */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <RatingStars value={review.rating} size="sm" />

        <span className="text-sm font-medium text-foreground">
          {review.author?.name}
        </span>

        {review.isVerifiedPurchase && (
          <span className="inline-flex items-center gap-1 rounded-(--radius-sm) bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
            <BadgeCheck className="size-3" aria-hidden="true" />
            {t('verifiedPurchase')}
          </span>
        )}

        {/*
          تاریخ در انتهای خط.
          ms-auto در RTL و LTR هر دو درست کار می‌کند چون منطقی است
          نه جهت‌دار — برخلاف ml-auto.
        */}
        <time
          dateTime={review.createdAt}
          className="ms-auto text-xs text-muted-foreground"
        >
          {formatDate(review.createdAt, locale)}
        </time>
      </div>

      {/* --- عنوان --- */}
      {review.title && (
        <h4 className="mt-3 text-sm font-bold text-foreground">{review.title}</h4>
      )}

      {/* --- متن --- */}
      {review.comment && (
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {review.comment}
        </p>
      )}

      {/* --- نقاط قوت و ضعف --- */}
      {(review.pros.length > 0 || review.cons.length > 0) && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-8">
          {review.pros.length > 0 && (
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-medium text-success">{t('pros')}</h5>
              <ul className="mt-1.5 space-y-1">
                {review.pros.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <Plus className="mt-0.5 size-3 shrink-0 text-success" aria-hidden="true" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.cons.length > 0 && (
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-medium text-destructive">{t('cons')}</h5>
              <ul className="mt-1.5 space-y-1">
                {review.cons.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <Minus className="mt-0.5 size-3 shrink-0 text-destructive" aria-hidden="true" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* --- رأی مفید --- */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => canVote && onVote(review.id)}
          disabled={!canVote}
          aria-pressed={Boolean(review.hasVoted)}
          title={voteTitle}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-(--radius-md) border px-2.5 py-1.5',
            'text-xs font-medium transition-colors duration-[var(--duration-fast)]',
            review.hasVoted
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground',
            /*
               دکمه‌ی غیرفعال باید *دیده* شود ولی کلیک‌ناپذیر باشد.
               مخفی کردنش یعنی مهمان اصلاً نمی‌فهمد چنین امکانی هست.
            */
            !canVote && 'cursor-not-allowed opacity-60 hover:text-muted-foreground',
          )}
        >
          <ThumbsUp
            className={cn('size-3.5', review.hasVoted && 'fill-current')}
            aria-hidden="true"
          />
          {t('helpful')}
        </button>

        {review.helpfulCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {t('helpfulCount', { count: review.helpfulCount })}
          </span>
        )}
      </div>
    </li>
  )
}
