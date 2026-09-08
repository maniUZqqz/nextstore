/**
 * صفحه ورود به حساب
 * ---------------------------------------------------------------------------
 * پوسته‌ی Server Component که عنوان و متادیتا را می‌سازد؛
 * فرم تعاملی در LoginForm (کلاینتی) است.
 *
 * ⚠️ کاربر واردشده اصلاً به این صفحه نمی‌رسد — proxy.ts او را
 *    پیش از رندر به /account هدایت می‌کند.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LoginForm } from '@/components/auth/LoginForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })

  return {
    title: t('title'),
    /* صفحه ورود ارزش ایندکس شدن ندارد */
    robots: { index: false, follow: true },
  }
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('auth')

  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16"
    >
      <div className="rounded-(--radius-lg) border border-border bg-card p-6 sm:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {t('login.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('login.subtitle')}
          </p>
        </header>

        <LoginForm />
      </div>

      {/* لینک ثبت‌نام */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t('login.createAccount')}
        </Link>
      </p>
    </main>
  )
}
