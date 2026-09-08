/**
 * توابع فراخوانی API مدیریت مقالات مجله
 * ---------------------------------------------------------------------------
 * همه‌ی این مسیرها پشت میدل‌ور `admin` بک‌اند هستند؛ کلاینت API توکن
 * را خودکار از localStorage اضافه می‌کند.
 *
 * ⚠️ آدرس‌ها با **شناسه** ساخته می‌شوند نه نامک.
 *    مسیرهای عمومی مقاله با نامک کار می‌کنند (URL خوانا)، ولی در پنل
 *    نامک همان چیزی است که ادمین ویرایش می‌کند: اگر آدرس ویرایش هم
 *    به نامک وابسته باشد، لحظه‌ای که نامک عوض شود درخواست ذخیره ۴۰۴
 *    می‌گیرد. شناسه هرگز تغییر نمی‌کند.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  AdminPost,
  AdminPostCategory,
  AdminPostDetail,
  AdminPostFilters,
  PostInput,
  PostStatusCounts,
} from '@/types/admin'

/** پاسخ فهرست — علاوه بر صفحه‌بندی، شمارش وضعیت‌ها هم دارد. */
interface AdminPostListResponse extends PaginatedResponse<AdminPost> {
  counts: PostStatusCounts
}

/** فهرست مقالات با فیلتر وضعیت، دسته و جستجو. */
export function getAdminPosts(filters: AdminPostFilters = {}) {
  return api.get<AdminPostListResponse>('/admin/posts', {
    params: filters as Record<string, unknown>,
  })
}

/** جزئیات کامل یک مقاله برای فرم ویرایش — با هر دو زبان. */
export async function getAdminPost(id: number): Promise<AdminPostDetail> {
  const response = await api.get<ApiResponse<AdminPostDetail>>(`/admin/posts/${id}`)
  return response.data
}

/** ساخت مقاله‌ی تازه. */
export async function createPost(input: PostInput): Promise<AdminPostDetail> {
  const response = await api.post<ApiResponse<AdminPostDetail>>('/admin/posts', input)
  return response.data
}

/** ویرایش مقاله. */
export async function updatePost(id: number, input: PostInput): Promise<AdminPostDetail> {
  const response = await api.put<ApiResponse<AdminPostDetail>>(`/admin/posts/${id}`, input)
  return response.data
}

/** حذف مقاله. */
export async function deletePost(id: number): Promise<void> {
  await api.delete(`/admin/posts/${id}`)
}

/**
 * انتشار یا بازگرداندن به پیش‌نویس.
 *
 * اندپوینت جداست تا تغییر وضعیت از روی جدول، کل مقاله (شامل هر دو
 * بدنه‌ی HTML) را به سرور نفرستد.
 */
export async function togglePostPublish(
  id: number,
  published: boolean,
): Promise<AdminPostDetail> {
  const response = await api.patch<ApiResponse<AdminPostDetail>>(
    `/admin/posts/${id}/publish`,
    { published },
  )
  return response.data
}

/** دسته‌های مجله — برای پرکردن انتخابگر فرم. */
export async function getAdminPostCategories(
  locale?: string,
): Promise<AdminPostCategory[]> {
  const response = await api.get<ApiResponse<AdminPostCategory[]>>(
    '/admin/post-categories',
    { locale },
  )
  return response.data
}
