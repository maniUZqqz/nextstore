/**
 * توابع فراخوانی API تعدیل نظرات
 * ---------------------------------------------------------------------------
 * همه‌ی این مسیرها پشت میدل‌ور `admin` بک‌اند هستند؛ کلاینت API توکن
 * را خودکار اضافه می‌کند.
 *
 * ⚠️ اینجا برخلاف مقالات، آدرس‌ها با **شناسه‌ی عددی** ساخته می‌شوند
 *    و این تنها گزینه است: نظر نامک ندارد و بک‌اند با Route Model
 *    Binding پیش‌فرض (کلید اصلی) بایند می‌کند.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  AdminReview,
  AdminReviewFilters,
  ReviewStatusCounts,
} from '@/types/admin'

/** پاسخ فهرست — علاوه بر صفحه‌بندی، شمارش وضعیت‌ها هم دارد. */
export interface AdminReviewListResponse extends PaginatedResponse<AdminReview> {
  counts: ReviewStatusCounts
}

/**
 * فهرست نظرات با فیلتر وضعیت.
 *
 * ⚠️ اگر `status` فرستاده نشود، بک‌اند **صف تعدیل** (`pending`) را
 *    برمی‌گرداند، نه همه را. برای «همه» باید صریحاً `all` بفرستیم —
 *    وگرنه تب «همه» بی‌صدا فقط در‌انتظارها را نشان می‌دهد.
 */
export function getAdminReviews(filters: AdminReviewFilters = {}) {
  return api.get<AdminReviewListResponse>('/admin/reviews', {
    params: filters as Record<string, unknown>,
  })
}

/** تأیید و انتشار نظر. */
export async function approveReview(id: number): Promise<AdminReview> {
  const response = await api.patch<ApiResponse<AdminReview>>(
    `/admin/reviews/${id}/approve`,
  )
  return response.data
}

/**
 * رد نظر با ذکر دلیل.
 *
 * دلیل الزامی است (بک‌اند حداقل ۳ نویسه می‌خواهد): کاربر در «نظرات
 * من» فقط همین متن را می‌بیند و بدون آن نمی‌داند چه چیزی را اصلاح کند.
 */
export async function rejectReview(id: number, reason: string): Promise<AdminReview> {
  const response = await api.patch<ApiResponse<AdminReview>>(
    `/admin/reviews/${id}/reject`,
    { reason },
  )
  return response.data
}

/** حذف کامل نظر — برای محتوای توهین‌آمیز. */
export async function deleteReview(id: number): Promise<void> {
  await api.delete(`/admin/reviews/${id}`)
}
