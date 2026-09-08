/**
 * توابع فراخوانی API سبد خرید
 * ---------------------------------------------------------------------------
 * سبد خرید هم برای مهمان و هم کاربر واردشده کار می‌کند:
 *   کاربر واردشده → با توکن Bearer شناسایی می‌شود
 *   مهمان         → با هدر X-Session-Id
 *
 * هر دو هدر را کلاینت API خودکار اضافه می‌کند، پس اینجا کاری لازم نیست.
 */

import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { Cart } from '@/types/cart'

/** دریافت سبد خرید فعلی. */
export async function getCart(): Promise<Cart> {
  const response = await api.get<ApiResponse<Cart>>('/cart')
  return response.data
}

/**
 * افزودن محصول به سبد.
 *
 * @param productId شناسه محصول
 * @param quantity  تعداد (حداکثر ۱۰)
 */
export async function addToCart(productId: number, quantity = 1): Promise<Cart> {
  const response = await api.post<ApiResponse<Cart>>('/cart/items', {
    product_id: productId,
    quantity,
  })
  return response.data
}

/**
 * تغییر تعداد یک قلم.
 * تعداد صفر یعنی حذف آن قلم — با یک اندپوینت هم کم کردن و هم حذف.
 */
export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const response = await api.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
    quantity,
  })
  return response.data
}

/** حذف یک قلم از سبد. */
export async function removeCartItem(itemId: number): Promise<Cart> {
  const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`)
  return response.data
}

/** خالی کردن کامل سبد. */
export async function clearCart(): Promise<Cart> {
  const response = await api.delete<ApiResponse<Cart>>('/cart')
  return response.data
}

/**
 * اعمال کد تخفیف روی سبد.
 *
 * ⚠️ کد نامعتبر **۴۲۲** برمی‌گرداند نه ۴۰۴ — یک ورودی فرمِ ردشده است،
 *    نه منبعِ یافت‌نشده. پیام گویای سرور در `ApiError.message` است و
 *    باید همان نشان داده شود: «مهلت تمام شده» با «ظرفیت تکمیل» فرق
 *    دارد و پیام عمومی هر دو را یکی می‌کند.
 */
export async function applyCoupon(code: string): Promise<Cart> {
  const response = await api.post<ApiResponse<Cart>>('/cart/coupon', { code })
  return response.data
}

/** برداشتن کد تخفیف از سبد. */
export async function removeCoupon(): Promise<Cart> {
  const response = await api.delete<ApiResponse<Cart>>('/cart/coupon')
  return response.data
}
