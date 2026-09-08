/**
 * توابع فراخوانی API نظرات محصول
 * ---------------------------------------------------------------------------
 * فهرست نظرات عمومی است و با یا بدون توکن کار می‌کند:
 *   مهمان        → فهرست را می‌بیند، ولی کلید hasVoted نمی‌آید
 *   کاربر واردشده → رأی خودش هم در پاسخ هست
 *
 * ثبت نظر و رأی «مفید» نیازمند توکن‌اند و کلاینت API آن را خودکار
 * از localStorage می‌خواند.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  Review,
  ReviewInput,
  ReviewListResponse,
  ReviewSort,
} from '@/types/review'

/**
 * فهرست نظرات تأییدشده‌ی یک محصول به‌همراه آمار توزیع امتیاز.
 *
 * ⚠️ این تابع عمداً کش نمی‌شود (بدون revalidate/tags).
 *    نظرات از سمت مرورگر و با توکن کاربر خوانده می‌شوند تا کلید
 *    hasVoted درست بیاید؛ کش کردنِ پاسخی که به کاربر وابسته است
 *    یعنی نمایش رأی یک نفر به همه.
 *
 * @param slug    نامک محصول
 * @param options شماره صفحه و ترتیب نمایش
 */
export async function getProductReviews(
  slug: string,
  options: { page?: number; sort?: ReviewSort; perPage?: number } = {},
): Promise<ReviewListResponse> {
  const { page = 1, sort = 'recent', perPage = 10 } = options

  return api.get<ReviewListResponse>(`/products/${slug}/reviews`, {
    params: { page, sort, per_page: perPage },
  })
}

/**
 * ثبت نظر تازه برای یک محصول.
 *
 * نظر بلافاصله منتشر نمی‌شود؛ تا تأیید مدیر در وضعیت «در انتظار»
 * می‌ماند. پیام موفقیت باید این را به کاربر بگوید، وگرنه او دنبال
 * نظرش در فهرست می‌گردد و فکر می‌کند ثبت نشده.
 */
export async function createReview(slug: string, input: ReviewInput): Promise<Review> {
  const response = await api.post<ApiResponse<Review>>(
    `/products/${slug}/reviews`,
    input,
  )
  return response.data
}

/**
 * ثبت یا برداشتن رأی «این نظر مفید بود».
 *
 * عملیات دوحالته است: فراخوانی دوم رأی را برمی‌دارد.
 *
 * @returns وضعیت جدید رأی و تعداد نهایی
 */
export async function toggleReviewHelpful(
  reviewId: number,
): Promise<{ hasVoted: boolean; helpfulCount: number }> {
  const response = await api.post<ApiResponse<{ hasVoted: boolean; helpfulCount: number }>>(
    `/reviews/${reviewId}/helpful`,
  )
  return response.data
}

/** نظرات ثبت‌شده‌ی خود کاربر — شامل در انتظار و ردشده. */
export function getMyReviews(page = 1) {
  return api.get<PaginatedResponse<Review>>('/reviews', {
    params: { page },
  })
}
