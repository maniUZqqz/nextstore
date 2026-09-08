'use client'

/**
 * فهرست نظرات کاربر — پنل کاربری
 * ---------------------------------------------------------------------------
 * برخلاف فهرست عمومی نظرات یک محصول، اینجا نظرات **همه‌ی وضعیت‌ها**
 * دیده می‌شوند: منتشرشده، در انتظار بررسی، و ردشده.
 *
 * ⚠️ نمایش وضعیت مهم‌ترین بخش این صفحه است. کاربری که نظر داده و
 *    آن را در صفحه‌ی محصول نمی‌بیند، بدون این صفحه فکر می‌کند ثبت
 *    نشده و دوباره تلاش می‌کند — و با خطای «قبلاً نظر داده‌اید»
 *    روبه‌رو می‌شود که گیج‌کننده‌تر است.
 *
 * پوشش حالت‌ها: loading · error · empty · success
 */

import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { MessageSquare, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getMyReviews } from '@/lib/api/reviews'
import { RatingStars } from '@/components/common/RatingStars'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { ReviewStatus } from '@/types/review'

/**
 * نگاشت وضعیت به ظاهر.
 *
 * نگاشت ثابت و نه کلاس پویا: Tailwind کلاس‌ها را با اسکن متن فایل
 * پیدا می‌کند، پس رشته‌ای که در زمان اجرا ساخته شود در بیلد تولیدی
 * حذف می‌شود.
 */
const STATUS_STYLE: Record<ReviewStatus, { className: string; Icon: typeof Clock }> = {
  approved: { className: 'bg-success/10 text-success', Icon: CheckCircle2 },
  pending: { className: 'bg-warning/15 text-warning', Icon: Clock },
  rejected: { className: 'bg-destructive/10 text-destructive', Icon: XCircle },
}

export function MyReviewsList() {
  const t = useTranslations('account')
  const tReviews = useTranslations('reviews')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale

  const reviewsQuery = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => getMyReviews(1),
    staleTime: 60_000,
  })

  /* --- حالت بارگذاری --- */
  if (reviewsQuery.isLoading) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-32 animate-pulse rounded-(--radius-lg) bg-muted" />
        ))}
      </ul>
    )
  }

  /* --- حالت خطا --- */
  if (reviewsQuery.isError) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <AlertCircle className="size-12 text-warning" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
      </div>
    )
  }

  const reviews = reviewsQuery.data?.data ?? []

  /* --- حالت خالی --- */
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
        <MessageSquare className="size-12 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{t('reviewsEmpty')}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {t('reviewsEmptyDesc')}
        </p>

        <Link
          href="/products"
          className="mt-5 inline-flex h-10 items-center rounded-(--radius-md) bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t('reviewsBrowse')}
        </Link>
      </div>
    )
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {t('reviewsCount', { count: reviews.length })}
      </p>

      <ul className="space-y-3">
        {reviews.map((review) => {
          const style = STATUS_STYLE[review.status]
          const StatusIcon = style.Icon

          return (
            <li
              key={review.id}
              className="rounded-(--radius-lg) border border-border p-4"
            >
              {/* --- سربرگ: محصول و وضعیت --- */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {review.product ? (
                    <Link
                      href={`/products/${review.product.slug}`}
                      className="text-sm font-bold text-foreground transition-colors hover:text-primary"
                    >
                      {review.product.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">—</span>
                  )}

                  <div className="mt-1.5 flex items-center gap-2">
                    <RatingStars value={review.rating} size="sm" />
                    <time dateTime={review.createdAt} className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt, locale)}
                    </time>
                  </div>
                </div>

                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-(--radius-sm) px-2 py-0.5',
                    'text-[11px] font-medium',
                    style.className,
                  )}
                >
                  <StatusIcon className="size-3" aria-hidden="true" />
                  {tReviews(`status.${review.status}`)}
                </span>
              </div>

              {/* --- عنوان و متن --- */}
              {review.title && (
                <h3 className="mt-3 text-sm font-medium text-foreground">{review.title}</h3>
              )}

              {review.comment && (
                <p className="mt-1.5 text-sm leading-7 text-muted-foreground">
                  {review.comment}
                </p>
              )}

              {/* --- نقاط قوت و ضعف --- */}
              {(review.pros.length > 0 || review.cons.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
                  {review.pros.map((item, index) => (
                    <span key={`pro-${index}`} className="text-success">
                      + {item}
                    </span>
                  ))}
                  {review.cons.map((item, index) => (
                    <span key={`con-${index}`} className="text-destructive">
                      − {item}
                    </span>
                  ))}
                </div>
              )}

              {/*
                دلیل رد شدن.
                بدون آن، کاربر فقط می‌بیند نظرش رد شده و نمی‌داند چه
                چیزی را باید اصلاح کند — که بدتر از رد شدن است.
              */}
              {review.status === 'rejected' && review.rejectionReason && (
                <p className="mt-3 rounded-(--radius-md) bg-destructive/5 px-3 py-2 text-xs leading-6 text-destructive">
                  {tReviews('rejectedReason', { reason: review.rejectionReason })}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
