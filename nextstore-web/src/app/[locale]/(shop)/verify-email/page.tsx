/**
 * صفحه‌ی تأیید ایمیل
 * ---------------------------------------------------------------------------
 * مسیر: /fa/verify-email?path=<مسیر امضاشده‌ی API>
 *
 * ⚠️ این صفحه فقط پیام‌رسان است.
 *
 *    پیوند امضاشده روی مسیرِ *API* ساخته شده، نه روی این نشانی. صفحه
 *    همان رشته را بی‌کم‌وکاست به بک‌اند پس می‌دهد؛ هر دست‌کاری — حتی
 *    مرتب‌کردن دوباره‌ی پارامترها — امضا را باطل می‌کند.
 *
 * ⚠️ در `Suspense` پیچیده شده چون `useSearchParams` را صدا می‌زند؛
 *    بدون آن نکست هنگام بیلد خطا می‌دهد.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { VerifyEmailPanel } from '@/components/auth/VerifyEmailPanel'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.verifyEmail' })

  return {
    title: t('title'),
    /* صفحه‌ی یک‌بارمصرف با پارامتر امضاشده — ایندکس‌شدنش بی‌معناست */
    robots: { index: false, follow: false },
  }
}

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('auth.verifyEmail')

  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16"
    >
      <div className="rounded-(--radius-lg) border border-border bg-card p-6 text-center sm:p-8">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>

        <Suspense
          fallback={<div className="mt-6 h-32 animate-pulse rounded-(--radius-md) bg-muted" />}
        >
          <VerifyEmailPanel />
        </Suspense>
      </div>
    </main>
  )
}
