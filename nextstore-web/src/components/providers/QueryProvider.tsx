'use client'

/**
 * پرووایدر TanStack Query
 * ---------------------------------------------------------------------------
 * تمام داده‌هایی که از بک‌اند لاراول می‌آیند (محصولات، سبد، سفارش‌ها) از طریق
 * این لایه کش، همگام و مدیریت می‌شوند.
 *
 * چرا نه useEffect + useState؟
 *   - کش خودکار: با برگشت به صفحه، دوباره درخواست زده نمی‌شود
 *   - جلوگیری از Race Condition هنگام درخواست‌های همزمان
 *   - مدیریت آماده‌ی حالت‌های loading / error / retry
 *   - همگام‌سازی خودکار بین تب‌های مرورگر
 */

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  /*
   * QueryClient داخل useState ساخته می‌شود، نه بیرون کامپوننت.
   *
   * دلیل: اگر بیرون تعریف شود، در رندر سمت سرور بین درخواست‌های
   * کاربران مختلف مشترک می‌شود و داده‌ی یک کاربر به کاربر دیگر نشت می‌کند.
   * useState تضمین می‌کند برای هر درخواست یک نمونه‌ی تازه ساخته شود.
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /** داده تا ۱ دقیقه «تازه» در نظر گرفته می‌شود و دوباره درخواست نمی‌شود */
            staleTime: 60 * 1000,

            /** داده‌ی بلااستفاده تا ۵ دقیقه در حافظه می‌ماند */
            gcTime: 5 * 60 * 1000,

            /** با برگشت به تب، خودکار درخواست دوباره نزن (مزاحم کاربر است) */
            refetchOnWindowFocus: false,

            /**
             * تلاش مجدد هوشمند:
             *   خطای ۴xx (مثل ۴۰۴ یا ۴۲۲) تقصیر کاربر است → تکرار بی‌فایده
             *   خطای شبکه یا ۵xx → تا ۲ بار تلاش مجدد
             */
            retry: (failureCount, error) => {
              const status = (error as { status?: number })?.status
              if (status && status >= 400 && status < 500) return false
              return failureCount < 2
            },

            /** فاصله‌ی نمایی بین تلاش‌ها: ۱ثانیه، ۲ثانیه، ۴ثانیه... حداکثر ۳۰ثانیه */
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
          },
          mutations: {
            /** عملیات نوشتن (POST/PUT/DELETE) نباید خودکار تکرار شود */
            retry: false,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
