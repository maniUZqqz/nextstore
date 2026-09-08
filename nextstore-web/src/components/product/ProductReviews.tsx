'use client'

/**
 * بخش نظرات صفحه محصول
 * ---------------------------------------------------------------------------
 * خلاصه امتیاز · مرتب‌سازی · فهرست · «نمایش بیشتر» · فرم ثبت
 *
 * پوشش حالت‌ها: loading · error · empty · guest · success
 *
 * ⚠️ چرا کلاینتی و نه سرور؟
 *    فهرست نظرات به کاربر وابسته است (کلید hasVoted) و صفحه‌ی محصول
 *    با ISR کش می‌شود. رندر سمت سرور یعنی رأی یک کاربر در نسخه‌ی
 *    کش‌شده برای همه نمایش داده شود.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquarePlus, AlertCircle, Loader2, PenLine } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useReviews } from '@/hooks/useReviews'
import { ReviewSummary } from './ReviewSummary'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
import type { ReviewSort } from '@/types/review'

/** گزینه‌های مرتب‌سازی — ترتیب اینجا همان ترتیب نمایش است. */
const SORT_OPTIONS: ReviewSort[] = ['recent', 'helpful', 'rating_high', 'rating_low']

export function ProductReviews({ slug }: { slug: string }) {
  const t = useTranslations('reviews')
  const tStates = useTranslations('states')

  const {
    reviews,
    stats,
    sort,
    changeSort,
    hasMore,
    loadMore,
    isLoading,
    isFetching,
    isError,
    isAuthenticated,
    currentUserName,
    submit,
    isSubmitting,
    vote,
  } = useReviews(slug)

  const [showForm, setShowForm] = useState(false)

  /* --- حالت بارگذاری اولیه --- */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-(--radius-lg) bg-muted" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-(--radius-lg) bg-muted" />
        ))}
      </div>
    )
  }

  /* --- حالت خطا --- */
  if (isError) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <AlertCircle className="size-10 text-warning" aria-hidden="true" />
        <h3 className="mt-3 text-sm font-bold text-foreground">
          {tStates('errorTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  const hasReviews = reviews.length > 0

  /** دکمه یا پیام دعوت به ثبت نظر. */
  const writeAction = isAuthenticated ? (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      <PenLine className="size-4" aria-hidden="true" />
      {t('write')}
    </button>
  ) : (
    <Link
      href="/login"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      <PenLine className="size-4" aria-hidden="true" />
      {t('loginToReview')}
    </Link>
  )

  return (
    <div className="space-y-6">
      {/* ==========================================================
          خلاصه امتیاز
          ========================================================== */}
      {stats && stats.total > 0 && (
        <div className="rounded-(--radius-lg) border border-border p-5">
          <ReviewSummary stats={stats} />
        </div>
      )}

      {/* ==========================================================
          فرم ثبت — بالای فهرست تا پس از باز شدن دیده شود
          ========================================================== */}
      {showForm && (
        <ReviewForm
          onSubmit={(input) =>
            submit(input, {
              /* فرم فقط در صورت موفقیت بسته می‌شود؛ در خطا نوشته‌ها نباید بپرند */
              onSuccess: () => setShowForm(false),
            })
          }
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ==========================================================
          نوار ابزار: مرتب‌سازی و دکمه ثبت
          ========================================================== */}
      {hasReviews && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="review-sort" className="text-xs text-muted-foreground">
              {t('sortLabel')}
            </label>
            <select
              id="review-sort"
              value={sort}
              onChange={(e) => changeSort(e.target.value as ReviewSort)}
              className="h-9 rounded-(--radius-md) border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`sort.${option}`)}
                </option>
              ))}
            </select>

            {/* نشانگر ظریف هنگام تعویض ترتیب — بدون خالی شدن فهرست */}
            {isFetching && (
              <Loader2
                className="size-4 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>

          {!showForm && writeAction}
        </div>
      )}

      {/* ==========================================================
          فهرست نظرات
          ========================================================== */}
      {hasReviews ? (
        <>
          <ul className="rounded-(--radius-lg) border border-border px-5">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isAuthenticated={isAuthenticated}
                currentUserName={currentUserName}
                onVote={vote}
              />
            ))}
          </ul>

          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isFetching}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-(--radius-md) border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
              >
                {isFetching && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {t('loadMore')}
              </button>
            </div>
          )}
        </>
      ) : (
        /* --- حالت خالی --- */
        !showForm && (
          <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-12 text-center">
            <MessageSquarePlus
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-sm font-bold text-foreground">{t('empty')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('emptyCta')}</p>
            <div className="mt-5">{writeAction}</div>
          </div>
        )
      )}
    </div>
  )
}
