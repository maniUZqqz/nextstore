/**
 * توابع فراخوانی API مجله (بخش عمومی)
 * ---------------------------------------------------------------------------
 * همه‌ی این مسیرها عمومی‌اند و از Server Component خوانده می‌شوند،
 * پس زبان باید صریح پاس داده شود — در سرور، هدر مرورگر در دسترس
 * نیست و کلاینت API نمی‌تواند خودش زبان را تشخیص دهد.
 *
 * ⚠️ همه با برچسب کش «posts» علامت خورده‌اند. هر تغییری در پنل
 *    مدیریت، لاراول را وادار می‌کند این برچسب را باطل کند — وگرنه
 *    مقاله‌ی تازه‌منتشرشده تا یک ساعت در سایت دیده نمی‌شود.
 */

import { api } from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { Post, PostCategory, PostDetail, PostFilters } from '@/types/post'

/** پاسخ جزئیات مقاله — مقالات مرتبط هم همراهش می‌آید. */
interface PostDetailResponse extends ApiResponse<PostDetail> {
  related: Post[]
}

/**
 * فهرست مقالات منتشرشده با فیلتر دسته، جستجو و صفحه‌بندی.
 *
 * @param filters فیلترهای اعمالی
 * @param locale  زبان درخواستی — در Server Component باید صریح داده شود
 */
export function getPosts(filters: PostFilters = {}, locale?: string) {
  return api.get<PaginatedResponse<Post>>('/posts', {
    params: filters as Record<string, unknown>,
    locale,
    /*
     * ۳۰۰ ثانیه. مقاله برخلاف قیمت و موجودی محصول، به‌ندرت عوض
     * می‌شود؛ کش طولانی‌تر بار سرور را کم می‌کند و باطل‌سازی هدفمند
     * از سمت پنل، تازگی را تضمین می‌کند.
     */
    revalidate: 300,
    tags: ['posts'],
  })
}

/**
 * جزئیات یک مقاله با نامک.
 *
 * ⚠️ مقاله‌ی پیش‌نویس یا زمان‌بندی‌شده از این مسیر ۴۰۴ می‌گیرد —
 *    فیلتر published در بک‌اند اعمال می‌شود، نه اینجا.
 */
export function getPost(slug: string, locale?: string) {
  return api.get<PostDetailResponse>(`/posts/${slug}`, {
    locale,
    revalidate: 300,
    tags: ['posts'],
  })
}

/** فهرست دسته‌های مجله به‌همراه تعداد مقالات هر کدام. */
export async function getPostCategories(locale?: string): Promise<PostCategory[]> {
  const response = await api.get<ApiResponse<PostCategory[]>>('/post-categories', {
    locale,
    /* دسته‌ها بسیار کم‌تغییرند */
    revalidate: 3600,
    tags: ['posts'],
  })
  return response.data
}
