'use client'

/**
 * نمای خطای سطح صفحه
 * ---------------------------------------------------------------------------
 * محتوای مشترک همه‌ی مرزهای خطای پروژه. خودِ فایل‌های `error.tsx` نازک
 * می‌مانند و فقط این را صدا می‌زنند، چون Next.js برای هر مرز یک فایل
 * جدا می‌خواهد ولی ظاهر خطا باید همه‌جا یکی باشد.
 *
 * ⚠️ چرا اینجا هدر و فوتر فراخوانده نمی‌شود؟
 *    `Header` و `Footer` سرور-کامپوننت‌اند (از `next-intl/server`
 *    استفاده می‌کنند) و مرز خطا در Next.js اجباراً کلاینتی است. ایمپورت
 *    مستقیمشان بیلد را می‌شکند.
 *
 *    راه‌حل: مرز خطا داخل گروه `(shop)` گذاشته می‌شود تا پوسته از
 *    *لایوت* بیاید، نه از ایمپورت. مرزهای بیرون آن گروه عمداً بدون
 *    پوسته می‌مانند و به‌جایش لینک‌های صریح بازگشت می‌دهند.
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export function ErrorState({
  error,
  reset,
}: {
  /** خطایی که مرز آن را گرفته. `digest` را خود Next اضافه می‌کند. */
  error: Error & { digest?: string }
  /** تلاش دوباره برای رندر همان بخش — بدون بارگذاری کامل صفحه. */
  reset: () => void
}) {
  const t = useTranslations('states')

  /*
   * ثبت خطا در کنسول.
   *
   * ⚠️ در تولید، Next پیام واقعی خطای سرور را از کلاینت پنهان می‌کند و
   *    فقط `digest` را می‌فرستد — تا جزئیات پیاده‌سازی و مسیر فایل‌ها
   *    لو نرود. پس این لاگ در حالت توسعه کامل است و در تولید فقط
   *    شناسه دارد؛ برای ردیابی واقعی باید همین digest را در لاگ سرور
   *    جست‌وجو کرد.
   */
  useEffect(() => {
    console.error('[error boundary]', error)
  }, [error])

  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-(--container-content) flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8"
    >
      <AlertTriangle className="size-16 text-warning" aria-hidden="true" />

      <h1 className="mt-6 text-xl font-bold text-foreground sm:text-2xl">
        {t('errorTitle')}
      </h1>

      <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        {t('errorPageDesc')}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {t('errorRetry')}
        </button>

        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-(--radius-md) border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Home className="size-4" aria-hidden="true" />
          {t('backHome')}
        </Link>
      </div>

      {/*
        شناسه‌ی خطا.

        تنها چیزی است که کاربر می‌تواند به پشتیبانی بدهد تا همین خطا
        در لاگ سرور پیدا شود. `dir="ltr"` لازم است وگرنه رشته‌ی
        هگز در صفحه‌ی راست‌به‌چپ وارونه خوانده می‌شود.
      */}
      {error.digest && (
        <p className="mt-8 text-xs text-muted-foreground">
          {t('errorRef')}{' '}
          <code dir="ltr" className="rounded-(--radius-sm) bg-muted px-1.5 py-0.5 font-mono">
            {error.digest}
          </code>
        </p>
      )}
    </main>
  )
}
