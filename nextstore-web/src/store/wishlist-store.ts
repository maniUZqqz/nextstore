/**
 * استور علاقه‌مندی‌ها (سمت کلاینت)
 * ---------------------------------------------------------------------------
 * فهرست محصولاتی که کاربر روی قلبشان زده است.
 *
 * برای کاربر مهمان کاملاً کلاینتی است؛ پس از ورود به حساب، محتوای این
 * استور با سرور همگام و سپس خالی می‌شود.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  /** شناسه محصولات علاقه‌مندی */
  productIds: number[]
  /** افزودن یا حذف (toggle) — خروجی: وضعیت جدید */
  toggle: (productId: number) => boolean
  /** بررسی وجود محصول در فهرست */
  has: (productId: number) => boolean
  /** تعداد اقلام علاقه‌مندی */
  count: () => number
  /** خالی کردن — پس از همگام‌سازی با سرور */
  clear: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (productId) => {
        const exists = get().productIds.includes(productId)

        set((state) => ({
          productIds: exists
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        }))

        /* وضعیت جدید را برمی‌گردانیم تا کامپوننت بتواند پیام مناسب نشان دهد */
        return !exists
      },

      has: (productId) => get().productIds.includes(productId),

      count: () => get().productIds.length,

      clear: () => set({ productIds: [] }),
    }),
    {
      name: 'nextstore-wishlist',
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
)
