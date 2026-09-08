/**
 * توابع فراخوانی API علاقه‌مندی‌ها
 * ---------------------------------------------------------------------------
 * ⚠️ برخلاف سبد خرید، علاقه‌مندی برای مهمان روی سرور ذخیره نمی‌شود.
 *
 *    دلیل: سبد خرید برای تسویه لازم است و باید قیمت‌هایش سمت سرور
 *    اعتبارسنجی شود؛ علاقه‌مندی صرفاً یک یادداشت شخصی است. نگه‌داشتن
 *    آن برای مهمان روی سرور یعنی ساختن ردیف برای هر بازدیدکننده‌ی
 *    گذری — هزینه‌ی زیاد، بدون سود.
 *
 *    پس مهمان در localStorage نگه می‌دارد و هنگام ورود، فهرستش با
 *    تابع syncWishlist به سرور منتقل می‌شود.
 */

import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { Product } from '@/types/product'

/** پاسخ افزودن و حذف — فقط تعداد نهایی برمی‌گردد، نه کل فهرست. */
interface WishlistCountResponse {
  data: { count: number }
}

/** دریافت فهرست کامل محصولات پسندیده‌شده. */
export async function getWishlist(): Promise<Product[]> {
  const response = await api.get<ApiResponse<Product[]>>('/wishlist')
  return response.data
}

/**
 * افزودن یک محصول.
 *
 * عملیات خودتوان است: افزودن محصولی که از قبل هست خطا نمی‌دهد،
 * پس فرانت‌اند لازم نیست قبلش وجود آن را چک کند.
 *
 * @returns تعداد کل اقلام پس از افزودن
 */
export async function addToWishlist(productId: number): Promise<number> {
  const response = await api.post<WishlistCountResponse>('/wishlist', { productId })
  return response.data.count
}

/**
 * حذف یک محصول.
 *
 * پارامتر «شناسه‌ی محصول» است نه شناسه‌ی ردیف علاقه‌مندی، چون
 * کارت محصول فقط شناسه‌ی محصول را در اختیار دارد.
 *
 * @returns تعداد کل اقلام پس از حذف
 */
export async function removeFromWishlist(productId: number): Promise<number> {
  const response = await api.delete<WishlistCountResponse>(`/wishlist/${productId}`)
  return response.data.count
}

/**
 * انتقال فهرست مهمان به سرور پس از ورود.
 *
 * سرور ادغام می‌کند و چیزی را پاک نمی‌کند، پس فراخوانی چندباره
 * بی‌خطر است.
 *
 * @param productIds شناسه‌های ذخیره‌شده در localStorage
 * @returns فهرست ادغام‌شده‌ی نهایی
 */
export async function syncWishlist(productIds: number[]): Promise<Product[]> {
  const response = await api.post<ApiResponse<Product[]>>('/wishlist/sync', { productIds })
  return response.data
}
