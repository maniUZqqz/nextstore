/**
 * تایپ‌های سبد خرید
 * ---------------------------------------------------------------------------
 * باید دقیقاً با خروجی CartResource در بک‌اند مطابق باشند.
 */

/** محصول داخل یک قلم سبد — فقط فیلدهای لازم برای نمایش. */
export interface CartItemProduct {
  id: number
  name: string
  slug: string
  stock: number
  isInStock: boolean
  image: string | null
  brand: string | null
}

/** یک قلم در سبد خرید. */
export interface CartItem {
  id: number
  quantity: number

  /** قیمت لحظه‌ی افزودن — برای تشخیص تغییر قیمت */
  priceAtAdd: number
  /** قیمت فعلی محصول */
  currentPrice: number
  /** جمع این قلم = currentPrice × quantity */
  lineTotal: number

  /** آیا قیمت از زمان افزودن تغییر کرده؟ */
  priceChanged: boolean

  /** سقف مجاز بر اساس موجودی انبار */
  maxQuantity: number

  product: CartItemProduct
}

/** خلاصه محاسبات مالی سبد — همه محاسبات سمت سرور انجام شده‌اند. */
export interface CartSummary {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number

  /** آستانه ارسال رایگان به ریال */
  freeShippingThreshold: number
  /** مبلغ باقی‌مانده تا ارسال رایگان — برای نوار پیشرفت */
  remainingForFreeShipping: number
  hasFreeShipping: boolean
}

/** سبد خرید کامل. */
export interface Cart {
  id: number
  items: CartItem[]
  /** تعداد کل اقلام — برای نشانگر روی آیکون سبد در هدر */
  itemsCount: number
  summary: CartSummary
  coupon: { code: string; discountAmount: number } | null
}
