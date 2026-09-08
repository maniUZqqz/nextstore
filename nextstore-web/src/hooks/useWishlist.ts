'use client'

/**
 * هوک مدیریت علاقه‌مندی‌ها
 * ---------------------------------------------------------------------------
 * این هوک دو دنیای متفاوت را پشت یک رابط یکسان پنهان می‌کند:
 *
 *   مهمان        → localStorage (استور Zustand)
 *   کاربر واردشده → سرور (TanStack Query)
 *
 * کامپوننت‌ها نمی‌دانند کدام حالت فعال است؛ فقط `toggle` و `has` را
 * صدا می‌زنند. این یعنی WishlistButton یک شاخه‌ی if کمتر دارد و
 * جایی برای واگرا شدن رفتار دو حالت باقی نمی‌ماند.
 *
 * ⚠️ انتقال خودکار هنگام ورود:
 *    لحظه‌ای که کاربر وارد می‌شود، هرچه در localStorage بوده به سرور
 *    منتقل و سپس استور محلی خالی می‌شود. بدون این، کاربر بعد از ورود
 *    ناگهان می‌دید علاقه‌مندی‌هایش «ناپدید» شده‌اند.
 */

import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import * as wishlistApi from '@/lib/api/wishlist'
import { useAuth } from '@/hooks/useAuth'
import { useWishlistStore } from '@/store/wishlist-store'
import type { Product } from '@/types/product'

/** کلید کش علاقه‌مندی — در همه‌جا یکسان تا کش مشترک بماند. */
export const WISHLIST_QUERY_KEY = ['wishlist'] as const

export function useWishlist() {
  const queryClient = useQueryClient()
  const t = useTranslations('product')

  const { user, isLoading: isAuthLoading } = useAuth()
  const isAuthenticated = Boolean(user)

  /* --- وضعیت محلی مهمان --- */
  const localIds = useWishlistStore((s) => s.productIds)
  const localToggle = useWishlistStore((s) => s.toggle)
  const localClear = useWishlistStore((s) => s.clear)

  /* =====================================================================
   * خواندن فهرست از سرور — فقط وقتی کاربر وارد شده باشد
   * =================================================================== */
  const serverQuery = useQuery<Product[]>({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: wishlistApi.getWishlist,
    /*
     * بدون این شرط، مهمان یک درخواست ۴۰۱ می‌زند که هم بی‌فایده است
     * و هم در کنسول خطای قرمز نشان می‌دهد.
     */
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  /* =====================================================================
   * انتقال یک‌باره‌ی فهرست مهمان به سرور پس از ورود
   * =================================================================== */
  /*
   * چرا ref؟ اگر فقط به useEffect تکیه کنیم، هر بار که آرایه‌ی
   * localIds تغییر کند (که پس از پاک شدن حتماً می‌کند) افکت دوباره
   * اجرا می‌شود. این ref تضمین می‌کند انتقال در هر نشست فقط یک بار
   * رخ دهد و حلقه‌ی بی‌پایان درخواست ساخته نشود.
   */
  const hasSynced = useRef(false)

  const syncMutation = useMutation({
    mutationFn: (ids: number[]) => wishlistApi.syncWishlist(ids),
    onSuccess: (products) => {
      queryClient.setQueryData(WISHLIST_QUERY_KEY, products)
      /* فهرست محلی دیگر لازم نیست — منبع حقیقت از این پس سرور است */
      localClear()
    },
  })

  useEffect(() => {
    if (!isAuthenticated || hasSynced.current) return
    hasSynced.current = true

    /* چیزی برای انتقال نیست — درخواست بی‌مورد نمی‌زنیم */
    if (localIds.length === 0) return

    syncMutation.mutate(localIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  /* پس از خروج، اجازه‌ی انتقال مجدد در ورود بعدی داده می‌شود */
  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) hasSynced.current = false
  }, [isAuthenticated, isAuthLoading])

  /* =====================================================================
   * افزودن و حذف روی سرور — با به‌روزرسانی خوش‌بینانه
   * =================================================================== */
  /*
   * قلب باید بلافاصله پر شود، نه پس از رفت‌وبرگشت شبکه. کاربری که
   * نیم‌ثانیه هیچ واکنشی نبیند، دوباره کلیک می‌کند و عملاً محصول را
   * حذف می‌کند — دقیقاً برعکس چیزی که می‌خواست.
   */
  const mutateServer = useMutation({
    mutationFn: ({ productId, add }: { productId: number; add: boolean }) =>
      add
        ? wishlistApi.addToWishlist(productId)
        : wishlistApi.removeFromWishlist(productId),

    onMutate: async ({ productId, add }) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY })
      const previous = queryClient.getQueryData<Product[]>(WISHLIST_QUERY_KEY)

      queryClient.setQueryData<Product[]>(WISHLIST_QUERY_KEY, (old = []) =>
        add
          ? old.some((p) => p.id === productId)
            ? old
            : /*
               * محصول کامل را در این لحظه نداریم (فقط شناسه‌اش را).
               * یک نگه‌دارنده‌ی حداقلی می‌گذاریم تا `has` فوراً true شود؛
               * invalidate بعدی آن را با داده‌ی واقعی جایگزین می‌کند.
               */
              [{ id: productId } as Product, ...old]
          : old.filter((p) => p.id !== productId),
      )

      return { previous }
    },

    onError: (_error, _variables, context) => {
      queryClient.setQueryData(WISHLIST_QUERY_KEY, context?.previous)
      toast.error(t('wishlistError'))
    },

    /*
     * چه موفق چه ناموفق، فهرست را از سرور تازه می‌کنیم تا
     * نگه‌دارنده‌ی حداقلی بالا با محصول واقعی جایگزین شود.
     */
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY })
    },
  })

  /* =====================================================================
   * رابط عمومی — یکسان برای هر دو حالت
   * =================================================================== */

  /** شناسه‌های فعلی، از هر منبعی که فعال است. */
  const productIds = isAuthenticated
    ? (serverQuery.data ?? []).map((p) => p.id)
    : localIds

  /** آیا این محصول در فهرست هست؟ */
  const has = (productId: number) => productIds.includes(productId)

  /**
   * افزودن یا حذف.
   * @returns وضعیت جدید — true یعنی حالا در فهرست هست
   */
  const toggle = (productId: number): boolean => {
    if (!isAuthenticated) return localToggle(productId)

    const willAdd = !has(productId)
    mutateServer.mutate({ productId, add: willAdd })
    return willAdd
  }

  return {
    /** محصولات کامل — فقط برای کاربر واردشده پر است */
    products: serverQuery.data ?? [],
    productIds,
    count: productIds.length,
    has,
    toggle,
    isAuthenticated,
    /** در حال بارگذاری اولیه‌ی فهرست سرور */
    isLoading: isAuthenticated && serverQuery.isLoading,
    isSyncing: syncMutation.isPending,
  }
}
