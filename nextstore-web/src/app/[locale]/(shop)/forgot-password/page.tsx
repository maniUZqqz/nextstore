/**
 * صفحه‌ی درخواست بازیابی رمز عبور
 * ---------------------------------------------------------------------------
 * مسیر: /fa/forgot-password · /en/forgot-password
 *
 * ⚠️ این نشانی از روز اول در `LoginForm` و `robots.ts` بود و صفحه‌ی
 *    سؤالات متداول هم به آن ارجاع می‌داد — ولی صفحه‌اش وجود نداشت و
 *    کاربر به ۴۰۴ می‌رسید.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.forgot' })

  return {
    title: t('title'),
    /* صفحه‌ی بازیابی ارزش ایندکس شدن ندارد */
    robots: { index: false, follow: true },
  }
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('auth.forgot')

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

        <ForgotPasswordForm />
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t('remembered')}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </main>
  )
}
