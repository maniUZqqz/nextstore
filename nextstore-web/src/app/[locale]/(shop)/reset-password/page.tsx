/**
 * صفحه‌ی بازنشانی رمز عبور
 * ---------------------------------------------------------------------------
 * مسیر: /fa/reset-password?token=…&email=…
 *
 * ⚠️ فرم در `Suspense` پیچیده شده چون `useSearchParams` را صدا می‌زند.
 *
 *    بدون آن، نکست هنگام بیلد خطا می‌دهد: خواندن پارامترهای نشانی
 *    کل صفحه را به رندر سمت کلاینت می‌کشاند و این محدودیت را صریح
 *    اعلام می‌کند.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.reset' })

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  }
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('auth.reset')

  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16"
    >
      <div className="rounded-(--radius-lg) border border-border bg-card p-6 sm:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('subtitle')}</p>
        </header>

        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-(--radius-md) bg-muted" />}
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
