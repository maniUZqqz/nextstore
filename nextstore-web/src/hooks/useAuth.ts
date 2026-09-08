'use client'

/**
 * هوک مدیریت احراز هویت
 * ---------------------------------------------------------------------------
 * وضعیت کاربر واردشده را از سرور می‌گیرد و در کش TanStack Query
 * نگه می‌دارد.
 *
 * چرا TanStack Query و نه Zustand؟
 *   کاربر یک «داده سرور» است، نه وضعیت کلاینت. با Query:
 *     - در همه کامپوننت‌ها یک نمونه مشترک است (بدون prop drilling)
 *     - پس از ورود یا خروج، همه‌جا خودکار به‌روز می‌شود
 *     - اگر توکن منقضی شود، خطای ۴۰۱ خودکار مدیریت می‌شود
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import * as authApi from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import type { LoginInput, RegisterInput, User } from '@/types/user'

/** کلید کش کاربر — در همه‌جا یکسان تا کش مشترک بماند. */
export const AUTH_QUERY_KEY = ['auth', 'me'] as const

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const t = useTranslations('auth')

  /* =====================================================================
   * خواندن کاربر جاری
   * =================================================================== */
  const userQuery = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,

    queryFn: async () => {
      /* بدون توکن اصلاً درخواست نمی‌زنیم — صرفه‌جویی در یک رفت‌وبرگشت */
      if (!authApi.getStoredToken()) return null

      try {
        return await authApi.getMe()
      } catch (error) {
        /* توکن منقضی یا نامعتبر → پاک کردن و ادامه به‌عنوان مهمان */
        if (error instanceof ApiError && error.status === 401) {
          authApi.clearToken()
          return null
        }
        throw error
      }
    },

    /** اطلاعات کاربر کم‌تغییر است — ۵ دقیقه تازه در نظر گرفته می‌شود */
    staleTime: 5 * 60 * 1000,
    /** خطای ۴۰۱ نباید تلاش مجدد داشته باشد */
    retry: false,
  })

  /* =====================================================================
   * ورود
   * =================================================================== */
  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),

    onSuccess: (data) => {
      /* کش را مستقیم پر می‌کنیم تا یک درخواست اضافه به /me نزنیم */
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user)

      toast.success(t('loginSuccess'))

      /*
       * بازگشت به مقصد اولیه.
       * proxy.ts هنگام هدایت به صفحه ورود، مسیر اصلی را در
       * پارامتر next گذاشته است.
       */
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next')

      /* مسیر بازگشت باید داخلی باشد — جلوگیری از Open Redirect */
      const safeNext = next?.startsWith('/') ? next.replace(/^\/(fa|en)/, '') : null

      router.push(safeNext || '/account')
      router.refresh()
    },

    onError: (error) => {
      /* خطای اعتبارسنجی توسط فرم نمایش داده می‌شود، اینجا فقط بقیه */
      if (error instanceof ApiError && !error.isValidation) {
        toast.error(error.isNetwork ? t('networkError') : t('genericError'))
      }
    },
  })

  /* =====================================================================
   * ثبت‌نام
   * =================================================================== */
  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),

    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user)
      toast.success(t('registerSuccess'))
      router.push('/account')
      router.refresh()
    },

    onError: (error) => {
      if (error instanceof ApiError && !error.isValidation) {
        toast.error(error.isNetwork ? t('networkError') : t('genericError'))
      }
    },
  })

  /* =====================================================================
   * خروج
   * =================================================================== */
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),

    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null)
      /*
       * پاک کردن کل کش.
       * دلیل: داده‌های شخصی کاربر (سفارش‌ها، آدرس‌ها) نباید پس از
       * خروج در کش بمانند و برای کاربر بعدی نمایش داده شوند.
       */
      queryClient.clear()

      toast.success(t('logoutSuccess'))
      router.push('/')
      router.refresh()
    },
  })

  return {
    /** کاربر واردشده؛ null یعنی مهمان */
    user: userQuery.data ?? null,
    isLoading: userQuery.isLoading,
    isAuthenticated: Boolean(userQuery.data),
    isAdmin: userQuery.data?.isAdmin ?? false,

    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,

    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,

    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}
