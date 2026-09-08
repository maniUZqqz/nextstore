/**
 * استور سبد خرید (سمت کلاینت)
 * ---------------------------------------------------------------------------
 * تا زمانی که اندپوینت سبد خرید در بک‌اند آماده شود، سبد در مرورگر
 * کاربر نگهداری می‌شود. پس از آماده شدن API، این استور نقش «کش خوش‌بینانه»
 * را می‌گیرد و منبع حقیقت به سرور منتقل می‌شود.
 *
 * چرا persist؟ کاربر با رفرش صفحه یا بستن تب نباید سبدش را از دست بدهد.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** یک قلم در سبد خرید. */
export interface CartLine {
  productId: number
  /** نام محصول در لحظه افزودن — برای نمایش بدون درخواست اضافه */
  name: string
  slug: string
  /** قیمت واحد در لحظه افزودن (به ریال) */
  price: number
  image: string | null
  quantity: number
  /** سقف مجاز بر اساس موجودی انبار */
  maxQuantity: number
}

interface CartState {
  lines: CartLine[]

  /** افزودن محصول؛ اگر از قبل باشد فقط تعداد زیاد می‌شود. */
  addItem: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  /** تغییر تعداد یک قلم؛ صفر یعنی حذف. */
  setQuantity: (productId: number, quantity: number) => void
  /** حذف یک قلم از سبد. */
  removeItem: (productId: number) => void
  /** خالی کردن کامل سبد — پس از ثبت موفق سفارش. */
  clear: () => void

  /** تعداد کل اقلام (مجموع quantity ها، نه تعداد ردیف‌ها). */
  totalQuantity: () => number
  /** جمع مبلغ سبد به ریال. */
  subtotal: () => number
  /** آیا این محصول در سبد هست؟ */
  has: (productId: number) => boolean
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      addItem: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === line.productId)

          if (existing) {
            /* افزایش تعداد با رعایت سقف موجودی */
            return {
              lines: state.lines.map((l) =>
                l.productId === line.productId
                  ? { ...l, quantity: Math.min(l.quantity + quantity, l.maxQuantity) }
                  : l,
              ),
            }
          }

          return {
            lines: [
              ...state.lines,
              { ...line, quantity: Math.min(quantity, line.maxQuantity) },
            ],
          }
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) =>
                  l.productId === productId
                    ? { ...l, quantity: Math.min(quantity, l.maxQuantity) }
                    : l,
                ),
        })),

      removeItem: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),

      clear: () => set({ lines: [] }),

      totalQuantity: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),

      subtotal: () => get().lines.reduce((sum, l) => sum + l.price * l.quantity, 0),

      has: (productId) => get().lines.some((l) => l.productId === productId),
    }),
    {
      /* کلید ذخیره در localStorage */
      name: 'nextstore-cart',
      /* فقط اقلام ذخیره می‌شوند، نه توابع */
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
)
