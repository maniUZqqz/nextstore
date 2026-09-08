'use client'

/**
 * هوک مدیریت سبد خرید
 * ---------------------------------------------------------------------------
 * ⚠️ تغییر معماری نسبت به نسخه‌ی اول:
 *    سبد قبلاً فقط در localStorage (Zustand) بود. حالا منبع حقیقت
 *    سرور است و این هوک با TanStack Query آن را همگام می‌کند.
 *
 *    چرا این تغییر لازم بود؟
 *      - سبد باید بین دستگاه‌های کاربر مشترک باشد
 *      - تسویه به سبدِ سمت سرور نیاز دارد (قیمت‌ها آنجا اعتبارسنجی می‌شوند)
 *      - سبد مهمان هنگام ورود با سبد کاربر ادغام می‌شود
 *
 * به‌روزرسانی خوش‌بینانه (Optimistic Update):
 *    شمارنده‌ی سبد در هدر بلافاصله تغییر می‌کند، بدون انتظار برای
 *    پاسخ سرور. اگر درخواست شکست بخورد، به حالت قبل برمی‌گردد.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import * as cartApi from '@/lib/api/cart'
import { ApiError } from '@/lib/api/client'
import type { Cart } from '@/types/cart'

/** کلید کش سبد — در همه‌جا یکسان تا کش مشترک بماند. */
export const CART_QUERY_KEY = ['cart'] as const

export function useCart() {
  const queryClient = useQueryClient()
  const t = useTranslations('cart')

  /* =====================================================================
   * خواندن سبد از سرور
   * =================================================================== */
  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: cartApi.getCart,
    /** ۳۰ ثانیه تازه در نظر گرفته می‌شود */
    staleTime: 30_000,
  })

  /**
   * نمایش پیام خطای مناسب.
   * خطای موجودی پیام اختصاصی دارد، بقیه پیام عمومی.
   */
  const showError = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.code === 'INSUFFICIENT_STOCK') {
        toast.error(error.message)
        return
      }
      if (error.isNetwork) {
        toast.error(t('errors.generic'))
        return
      }
    }
    toast.error(t('errors.generic'))
  }

  /* =====================================================================
   * افزودن به سبد — با به‌روزرسانی خوش‌بینانه
   * =================================================================== */
  const addMutation = useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: number; quantity?: number }) =>
      cartApi.addToCart(productId, quantity),

    /* پیش از رسیدن پاسخ، شمارنده را بلافاصله زیاد کن */
    onMutate: async ({ quantity = 1 }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY })
      const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY)

      queryClient.setQueryData<Cart>(CART_QUERY_KEY, (old) =>
        old ? { ...old, itemsCount: old.itemsCount + quantity } : old,
      )

      /* مقدار قبلی برای بازگردانی در صورت خطا */
      return { previous }
    },

    onError: (error, _variables, context) => {
      queryClient.setQueryData(CART_QUERY_KEY, context?.previous)
      showError(error)
    },

    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart)
      toast.success(t('added'))
    },
  })

  /* =====================================================================
   * تغییر تعداد
   * =================================================================== */
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateCartItem(itemId, quantity),
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
    onError: showError,
  })

  /* =====================================================================
   * حذف قلم
   * =================================================================== */
  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartApi.removeCartItem(itemId),
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart)
      toast.success(t('removed'))
    },
    onError: showError,
  })

  /* =====================================================================
   * خالی کردن سبد
   * =================================================================== */
  const clearMutation = useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
    onError: showError,
  })

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    /** تعداد کل اقلام — برای نشانگر هدر */
    itemsCount: cartQuery.data?.itemsCount ?? 0,

    addItem: addMutation.mutate,
    isAdding: addMutation.isPending,

    updateItem: updateMutation.mutate,
    removeItem: removeMutation.mutate,
    clear: clearMutation.mutate,
  }
}
