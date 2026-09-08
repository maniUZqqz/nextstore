'use client'

/**
 * صف تعدیل نظرات — پنل مدیریت
 * ---------------------------------------------------------------------------
 * تب وضعیت با نشان عددی · کارت نظر · تأیید / رد / حذف · صفحه‌بندی
 *
 * پوشش حالت‌ها: loading · error · empty · empty-filtered · success
 *
 * ⚠️ چرا کارت و نه جدول (برخلاف مقالات و محصولات)؟
 *    ستون اصلی اینجا **متن نظر** است؛ متنی چندخطی که در سلول جدول
 *    یا بریده می‌شود یا ردیف را غول‌آسا می‌کند. مدیر باید کل متن را
 *    ببیند تا بتواند دربارهٔ آن تصمیم بگیرد، پس کارت انتخاب درست است.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Check, X, Trash2, Star, AlertCircle, MessageSquare, Loader2,
  ExternalLink, BadgeCheck, ThumbsUp,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import * as reviewsApi from '@/lib/api/admin-reviews'
import { formatNumber, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { AdminPagination } from '@/components/admin/AdminPagination'
import type { AdminReview, ReviewStatusTab } from '@/types/admin'
import type { ReviewStatus } from '@/types/review'

/**
 * تب‌ها — ترتیب اینجا همان ترتیب نمایش است.
 *
 * `pending` اول می‌آید و پیش‌فرض هم هست: کاری که مدیر روزانه انجام
 * می‌دهد رسیدگی به صف است، نه مرور نظرات تأییدشده.
 */
const STATUS_TABS: ReviewStatusTab[] = ['pending', 'approved', 'rejected', 'all']

/**
 * نگاشت وضعیت به کلاس رنگ.
 *
 * نگاشت ثابت و نه کلاس پویا: Tailwind کلاس‌ها را با اسکن *متن* فایل
 * پیدا می‌کند، پس رشته‌ای که در زمان اجرا ساخته شود در بیلد تولیدی
 * وجود ندارد و بی‌صدا حذف می‌شود.
 */
const STATUS_CLASSES: Record<ReviewStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}

export function AdminReviewsList({
  initialStatus,
}: {
  initialStatus?: ReviewStatusTab
}) {
  const t = useTranslations('admin.reviews')
  const tAdmin = useTranslations('admin')
  const tStates = useTranslations('states')
  const locale = useLocale() as Locale
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<ReviewStatusTab>(initialStatus ?? 'pending')
  const [page, setPage] = useState(1)

  /** شناسه‌ی نظری که هم‌اکنون فرم «دلیل رد» برایش باز است. */
  const [rejectingId, setRejectingId] = useState<number | null>(null)

  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviews', { status, page }],
    /*
     * `status` همیشه فرستاده می‌شود — حتی 'all'.
     * بک‌اند در نبود این پارامتر صف تعدیل را برمی‌گرداند، پس حذف
     * کردنش برای تب «همه» دقیقاً نتیجه‌ی عکس می‌داد.
     */
    queryFn: () => reviewsApi.getAdminReviews({ status, page }),
    /* نگه‌داشتن داده‌ی قبلی هنگام تعویض صفحه — بدون آن فهرست می‌پرد */
    placeholderData: keepPreviousData,
  })

  /**
   * باطل کردن کوئری‌های وابسته.
   *
   * ⚠️ فقط فهرست پنل کافی نیست: تأیید یک نظر، میانگین امتیاز محصول
   *    را عوض می‌کند، پس کش کاتالوگ و صفحه‌ی محصول هم باید باطل شوند
   *    وگرنه مدیر نظر را تأیید می‌کند و در سایت هیچ تغییری نمی‌بیند.
   */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['reviews'] })
  }

  const approveMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.approveReview(id),
    onSuccess: () => {
      toast.success(t('approved'))
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      reviewsApi.rejectReview(id, reason),
    onSuccess: () => {
      toast.success(t('rejected'))
      setRejectingId(null)
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      toast.success(t('deleted'))
      invalidate()
    },
    onError: () => toast.error(tStates('errorTitle')),
  })

  const reviews = reviewsQuery.data?.data ?? []
  const counts = reviewsQuery.data?.counts
  const meta = reviewsQuery.data?.meta

  /** جمع تب «همه» — بک‌اند آن را نمی‌شمارد، پس اینجا حساب می‌شود. */
  const countFor = (tab: ReviewStatusTab): number | undefined => {
    if (!counts) return undefined
    if (tab === 'all') return counts.pending + counts.approved + counts.rejected
    return counts[tab]
  }

  return (
    <div>
      {/* ================= سربرگ ================= */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* ================= تب وضعیت ================= */}
      <div
        role="tablist"
        aria-label={t('colStatus')}
        className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {STATUS_TABS.map((tab) => {
          const active = status === tab
          const count = countFor(tab)

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStatus(tab)
                setPage(1)
                /* فرم رد باز مانده به نظر دیگری تعلق دارد و باید بسته شود */
                setRejectingId(null)
              }}
              className={cn(
                'relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`status.${tab}`)}

              {typeof count === 'number' && (
                <span className="ms-1.5 text-xs tabular-nums opacity-70">
                  {formatNumber(count, locale)}
                </span>
              )}

              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}

        {reviewsQuery.isFetching && (
          <span className="ms-auto flex items-center pe-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* ================= محتوا ================= */}
      {reviewsQuery.isLoading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-36 animate-pulse rounded-(--radius-lg) bg-muted" />
          ))}
        </ul>
      ) : reviewsQuery.isError ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <AlertCircle className="size-12 text-warning" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{tStates('errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
          <MessageSquare className="size-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {/*
              «صف خالی است» پیام موفقیت است نه پوچی — وقتی مدیر تب
              در‌انتظار را باز می‌کند و چیزی نیست، یعنی کارش تمام شده.
            */}
            {status === 'pending' ? t('emptyPending') : t('empty')}
          </h2>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                locale={locale}
                isBusy={
                  (approveMutation.isPending && approveMutation.variables === review.id) ||
                  (rejectMutation.isPending && rejectMutation.variables?.id === review.id) ||
                  (deleteMutation.isPending && deleteMutation.variables === review.id)
                }
                isRejecting={rejectingId === review.id}
                onApprove={() => approveMutation.mutate(review.id)}
                onStartReject={() => setRejectingId(review.id)}
                onCancelReject={() => setRejectingId(null)}
                onConfirmReject={(reason) => rejectMutation.mutate({ id: review.id, reason })}
                onDelete={() => {
                  if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(review.id)
                }}
              />
            ))}
          </ul>

          {/* کامپوننت خودش برای یک صفحه چیزی رندر نمی‌کند */}
          {meta && (
            <div className="mt-4">
              <AdminPagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* متن فقط برای صفحه‌خوان — تعداد کل نتایج */}
      <p className="sr-only" aria-live="polite">
        {meta ? tAdmin('results', { count: meta.total }) : ''}
      </p>
    </div>
  )
}

/* =========================================================================
 * کارت یک نظر
 * ======================================================================= */

function ReviewCard({
  review,
  locale,
  isBusy,
  isRejecting,
  onApprove,
  onStartReject,
  onCancelReject,
  onConfirmReject,
  onDelete,
}: {
  review: AdminReview
  locale: Locale
  isBusy: boolean
  isRejecting: boolean
  onApprove: () => void
  onStartReject: () => void
  onCancelReject: () => void
  onConfirmReject: (reason: string) => void
  onDelete: () => void
}) {
  const t = useTranslations('admin.reviews')
  const tCommon = useTranslations('common')
  const tReviews = useTranslations('reviews')

  const [reason, setReason] = useState('')

  /* بک‌اند حداقل ۳ نویسه می‌خواهد؛ همان قید اینجا هم اعمال می‌شود
     تا کاربر به‌جای خطای ۴۲۲، دکمه‌ی غیرفعال ببیند. */
  const reasonIsValid = reason.trim().length >= 3

  return (
    <li
      className={cn(
        'rounded-(--radius-lg) border border-border bg-card p-4 transition-opacity',
        isBusy && 'opacity-50',
      )}
    >
      {/* --- ردیف بالا: محصول + وضعیت --- */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {review.product ? (
            <Link
              href={`/products/${review.product.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
            >
              <span className="truncate">{review.product.name}</span>
              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}

          <p className="mt-1 text-xs text-muted-foreground">
            {review.author?.name ?? t('guestAuthor')}
            {' · '}
            {formatDate(review.createdAt, locale)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {review.isVerifiedPurchase && (
            <span
              className="inline-flex items-center gap-1 rounded-(--radius-sm) bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
              title={tReviews('verifiedPurchase')}
            >
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              {tReviews('verifiedPurchase')}
            </span>
          )}

          <span
            className={cn(
              'inline-flex rounded-(--radius-sm) px-2 py-0.5 text-xs font-medium',
              STATUS_CLASSES[review.status],
            )}
          >
            {t(`status.${review.status}`)}
          </span>
        </div>
      </div>

      {/* --- امتیاز --- */}
      <div
        className="mb-2 flex items-center gap-1"
        role="img"
        aria-label={t('ratingLabel', { rating: review.rating })}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              'size-4',
              n <= review.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30',
            )}
            aria-hidden="true"
          />
        ))}

        {review.helpfulCount > 0 && (
          <span className="ms-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ThumbsUp className="size-3.5" aria-hidden="true" />
            <span className="tabular-nums">{formatNumber(review.helpfulCount, locale)}</span>
          </span>
        )}
      </div>

      {/* --- متن نظر --- */}
      {review.title && (
        <h3 className="mb-1 font-medium text-foreground">{review.title}</h3>
      )}

      {review.comment && (
        /*
          `whitespace-pre-line` تا خطوط جدیدی که کاربر تایپ کرده حفظ
          شوند. بدون آن، نظرِ چندبندی یک بلوک به‌هم‌چسبیده می‌شود و
          قضاوت دربارهٔ متن سخت‌تر.
        */
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {review.comment}
        </p>
      )}

      {/* --- نقاط مثبت و منفی --- */}
      {(review.pros.length > 0 || review.cons.length > 0) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {review.pros.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-success">{tReviews('pros')}</p>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {review.pros.map((item, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span aria-hidden="true">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.cons.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-destructive">{tReviews('cons')}</p>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {review.cons.map((item, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span aria-hidden="true">−</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* --- دلیل رد قبلی (اگر ردشده است) --- */}
      {review.status === 'rejected' && review.rejectionReason && (
        <p className="mt-3 rounded-(--radius-md) bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <span className="font-medium">{t('reasonLabel')}: </span>
          {review.rejectionReason}
        </p>
      )}

      {/* --- عملیات --- */}
      {isRejecting ? (
        /*
          فرم رد به‌جای مودال، همان‌جا داخل کارت باز می‌شود.
          مودال متن نظر را می‌پوشاند — دقیقاً چیزی که مدیر برای
          نوشتن دلیل باید جلوی چشمش باشد.
        */
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (reasonIsValid) onConfirmReject(reason.trim())
          }}
          className="mt-4 border-t border-border pt-4"
        >
          <label
            htmlFor={`reject-reason-${review.id}`}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t('reasonLabel')}
          </label>

          <textarea
            id={`reject-reason-${review.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={255}
            autoFocus
            placeholder={t('reasonPlaceholder')}
            className="w-full rounded-(--radius-md) border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />

          <p className="mt-1 text-xs text-muted-foreground">{t('reasonHint')}</p>

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={!reasonIsValid || isBusy}
              className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) bg-destructive px-3 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
              {t('confirmReject')}
            </button>

            <button
              type="button"
              onClick={onCancelReject}
              className="h-9 rounded-(--radius-md) border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {tCommon('cancel')}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {/*
            دکمه‌ی تأیید فقط وقتی نظر تأییدشده نیست.
            نشان دادن «تأیید» روی نظری که همین حالا تأیید شده، کنشی
            بی‌اثر است و مدیر را به شک می‌اندازد که کارش انجام شده یا نه.
          */}
          {review.status !== 'approved' && (
            <button
              type="button"
              onClick={onApprove}
              disabled={isBusy}
              className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) bg-success px-3 text-sm font-medium text-success-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Check className="size-4" aria-hidden="true" />
              {t('approve')}
            </button>
          )}

          {review.status !== 'rejected' && (
            <button
              type="button"
              onClick={onStartReject}
              disabled={isBusy}
              className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
              {t('reject')}
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={isBusy}
            title={tCommon('delete')}
            className="ms-auto inline-flex size-9 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span className="sr-only">{tCommon('delete')}</span>
          </button>
        </div>
      )}
    </li>
  )
}
