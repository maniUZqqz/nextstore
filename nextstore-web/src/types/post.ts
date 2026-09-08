/**
 * تایپ‌های مجله (بخش عمومی)
 * ---------------------------------------------------------------------------
 * آینه‌ی خروجی PostResource و PostDetailResource در بک‌اند.
 *
 * ⚠️ برخلاف تایپ‌های پنل مدیریت در types/admin.ts، فیلدهای متنی
 *    اینجا **رشته**‌اند نه شیء دوزبانه. دلیل: مسیر عمومی محتوا را
 *    به زبان درخواست‌شده حل می‌کند و فرانت‌اند هرگز به زبان دیگر
 *    نیازی ندارد.
 */

/** دسته‌ی مقاله در نمای فشرده — همراه خود مقاله می‌آید. */
export interface PostCategoryRef {
  id: number
  name: string
  slug: string
}

/** مقاله در نمای فهرست — بدون بدنه. */
export interface Post {
  id: number
  title: string
  excerpt: string | null
  slug: string
  /** آدرس مطلق تصویر شاخص */
  coverImage: string | null
  readingMinutes: number
  viewsCount: number
  isFeatured: boolean
  authorName: string | null
  publishedAt: string | null
  category?: PostCategoryRef
}

/** مقاله در نمای جزئیات — همان فیلدها به‌علاوه‌ی بدنه. */
export interface PostDetail extends Post {
  /** بدنه‌ی HTML آماده‌ی رندر */
  body: string
}

/**
 * دسته‌ی مجله در فهرست دسته‌ها.
 * postsCount فقط مقالات منتشرشده را می‌شمارد.
 */
export interface PostCategory {
  id: number
  name: string
  description: string | null
  slug: string
  postsCount: number
}

/** فیلترهای فهرست مقالات. */
export interface PostFilters {
  category?: string
  q?: string
  page?: number
  per_page?: number
}
