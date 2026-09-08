/**
 * تایپ‌های نظرات محصول
 * ---------------------------------------------------------------------------
 * آینه‌ی خروجی ReviewResource در بک‌اند. هر تغییری در آن کلاس باید
 * اینجا هم منعکس شود تا TypeScript ناسازگاری را در زمان کامپایل بگیرد.
 */

/** وضعیت تعدیل یک نظر. */
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

/** ترتیب نمایش فهرست نظرات. */
export type ReviewSort = 'recent' | 'helpful' | 'rating_high' | 'rating_low'

/** نویسنده نظر — فقط اطلاعات عمومی. */
export interface ReviewAuthor {
  name: string
  avatar: string | null
}

/** محصولی که نظر به آن تعلق دارد — فقط در «نظرات من» می‌آید. */
export interface ReviewProductRef {
  id: number
  name: string
  slug: string
}

export interface Review {
  id: number
  /** امتیاز ۱ تا ۵ */
  rating: number
  title: string | null
  comment: string | null
  /** نقاط مثبت — همیشه آرایه است، حتی خالی */
  pros: string[]
  /** نقاط منفی */
  cons: string[]
  /**
   * نویسنده.
   *
   * اختیاری است چون ReviewResource آن را با whenLoaded می‌فرستد؛
   * اگر مسیری روزی رابطه‌ی user را بارگذاری نکند، کلید اصلاً
   * وجود ندارد و کامپوننت نباید فرض کند همیشه هست.
   */
  author?: ReviewAuthor

  /** نشان «خرید تأییدشده» */
  isVerifiedPurchase: boolean
  helpfulCount: number
  /**
   * آیا کاربر جاری به این نظر رأی «مفید» داده؟
   *
   * برای مهمان اصلاً فرستاده نمی‌شود (undefined)، چون سرور نمی‌داند
   * او کیست. کامپوننت باید undefined را مثل false رفتار کند ولی
   * دکمه را غیرفعال نشان دهد.
   */
  hasVoted?: boolean
  status: ReviewStatus
  /** دلیل رد — فقط برای نظرات ردشده در «نظرات من» */
  rejectionReason: string | null
  product?: ReviewProductRef
  createdAt: string
}

/**
 * توزیع امتیاز برای نمودار میله‌ای.
 * کلیدها رشته‌اند چون از JSON می‌آیند.
 */
export interface ReviewStats {
  average: number
  total: number
  distribution: Record<string, number>
}

/** پاسخ فهرست نظرات — علاوه بر صفحه‌بندی، بلوک آمار هم دارد. */
export interface ReviewListResponse {
  data: Review[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  stats: ReviewStats
}

/** ورودی ثبت نظر تازه. */
export interface ReviewInput {
  rating: number
  title?: string
  comment?: string
  pros?: string[]
  cons?: string[]
}
