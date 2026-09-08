'use client'

/**
 * هوک نظرات یک محصول
 * ---------------------------------------------------------------------------
 * سه کار:
 *   ۱. خواندن فهرست صفحه‌بندی‌شده به‌همراه آمار توزیع امتیاز
 *   ۲. ثبت نظر تازه
 *   ۳. رأی «مفید بود» با به‌روزرسانی خوش‌بینانه
 *
 * ⚠️ چرا فهرست انباشته (accumulated) و نه جایگزین؟
 *    دکمه «نمایش بیشتر» باید نظرات را به فهرست *اضافه* کند. اگر هر
 *    صفحه جایگزین قبلی شود، کاربر با یک کلیک نظرات قبلی را از دست
 *    می‌دهد و باید به عقب برگردد.
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import * as reviewsApi from '@/lib/api/reviews'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/hooks/useAuth'
import type { Review, ReviewInput, ReviewListResponse, ReviewSort } from '@/types/review'

/** ساخت کلید کش — ترتیب و صفحه در کلید هستند تا هر ترکیب کش خودش را داشته باشد. */
export const reviewsQueryKey = (slug: string, sort: ReviewSort, page: number) =>
  ['reviews', slug, sort, page] as const

export function useReviews(slug: string) {
  const queryClient = useQueryClient()
  const t = useTranslations('reviews')

  const { user } = useAuth()
  const isAuthenticated = Boolean(user)

  const [sort, setSort] = useState<ReviewSort>('recent')
  const [page, setPage] = useState(1)

  /*
   * نظرات صفحات قبلی.
   *
   * چرا در state و نه فقط تکیه بر کش؟ کش هر صفحه را جدا نگه می‌دارد
   * و ما به فهرستِ *پیوسته* نیاز داریم. با تغییر ترتیب، این انباشت
   * صفر می‌شود چون فهرست از نو مرتب شده است.
   */
  const [accumulated, setAccumulated] = useState<Review[]>([])

  const listQuery = useQuery<ReviewListResponse>({
    queryKey: reviewsQueryKey(slug, sort, page),
    queryFn: () => reviewsApi.getProductReviews(slug, { page, sort }),
    /*
     * نگه‌داشتن داده‌ی قبلی هنگام تغییر صفحه — بدون آن، فهرست
     * لحظه‌ای خالی می‌شود و صفحه می‌پرد.
     */
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  /* انباشت نتایج هر صفحه روی صفحات قبلی */
  const reviews = page === 1 ? (listQuery.data?.data ?? []) : accumulated

  /** رفتن به صفحه بعد — نتایج فعلی نگه داشته می‌شوند. */
  const loadMore = () => {
    const current = listQuery.data
    if (!current) return

    setAccumulated([...reviews, ...(current.data ?? [])].filter(
      /* حذف تکراری‌ها: اگر نظری بین دو درخواست تأیید شود، صفحه‌بندی می‌لغزد */
      (review, index, all) => all.findIndex((r) => r.id === review.id) === index,
    ))
    setPage((p) => p + 1)
  }

  /** تغییر ترتیب — انباشت و صفحه از نو شروع می‌شوند. */
  const changeSort = (next: ReviewSort) => {
    setSort(next)
    setPage(1)
    setAccumulated([])
  }

  /* =====================================================================
   * ثبت نظر
   * =================================================================== */
  const createMutation = useMutation({
    mutationFn: (input: ReviewInput) => reviewsApi.createReview(slug, input),

    onSuccess: () => {
      toast.success(t('submitted'))
      /*
       * فهرست را باطل می‌کنیم هرچند نظر تازه هنوز تأیید نشده و در
       * آن دیده نمی‌شود. دلیل: وضعیت «آیا این کاربر قبلاً نظر داده»
       * از همین مسیر خوانده می‌شود و باید به‌روز شود تا فرم دوباره
       * باز نشود.
       */
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
    },

    onError: (error) => {
      /* نظر تکراری پیام اختصاصی دارد، نه پیام عمومی خطا */
      if (error instanceof ApiError && error.code === 'ALREADY_REVIEWED') {
        toast.error(t('alreadyReviewed'))
        return
      }
      toast.error(error instanceof ApiError ? error.message : t('alreadyReviewed'))
    },
  })

  /* =====================================================================
   * رأی «مفید بود» — با به‌روزرسانی خوش‌بینانه
   * =================================================================== */
  const voteMutation = useMutation({
    mutationFn: (reviewId: number) => reviewsApi.toggleReviewHelpful(reviewId),

    onMutate: async (reviewId) => {
      const key = reviewsQueryKey(slug, sort, page)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ReviewListResponse>(key)

      /* شمارنده و حالت دکمه بلافاصله عوض می‌شوند، بدون انتظار شبکه */
      queryClient.setQueryData<ReviewListResponse>(key, (old) =>
        old
          ? {
              ...old,
              data: old.data.map((review) =>
                review.id === reviewId
                  ? {
                      ...review,
                      hasVoted: !review.hasVoted,
                      helpfulCount: review.helpfulCount + (review.hasVoted ? -1 : 1),
                    }
                  : review,
              ),
            }
          : old,
      )

      /* فهرست انباشته هم باید هم‌زمان به‌روز شود، وگرنه دو نمای ناهماهنگ می‌شود */
      setAccumulated((list) =>
        list.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                hasVoted: !review.hasVoted,
                helpfulCount: review.helpfulCount + (review.hasVoted ? -1 : 1),
              }
            : review,
        ),
      )

      return { previous, key }
    },

    onError: (error, _reviewId, context) => {
      if (context?.key) queryClient.setQueryData(context.key, context.previous)
      queryClient.invalidateQueries({ queryKey: ['reviews', slug] })
      toast.error(error instanceof ApiError ? error.message : t('helpful'))
    },
  })

  return {
    reviews,
    stats: listQuery.data?.stats,
    meta: listQuery.data?.meta,

    sort,
    changeSort,

    /** آیا صفحه‌ی دیگری برای بارگذاری هست؟ */
    hasMore: Boolean(
      listQuery.data && listQuery.data.meta.current_page < listQuery.data.meta.last_page,
    ),
    loadMore,

    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,

    isAuthenticated,
    currentUserName: user?.name ?? null,

    submit: createMutation.mutate,
    isSubmitting: createMutation.isPending,

    vote: voteMutation.mutate,
  }
}
