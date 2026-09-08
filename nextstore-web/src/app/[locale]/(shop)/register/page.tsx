/**
 * صفحه ثبت‌نام
 * ---------------------------------------------------------------------------
 * ساختار مشابه صفحه ورود: پوسته‌ی سرور + فرم کلاینتی.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { RegisterForm } from '@/components/auth/RegisterForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.register' })

  return {
    title: t('title'),
    robots: { index: false, follow: true },
  }
}

export default async function RegisterPage({
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
      className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-14"
    >
      <div className="rounded-(--radius-lg) border border-border bg-card p-6 sm:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {t('register.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('register.subtitle')}
          </p>
        </header>

        <RegisterForm />
      </div>

      {/* لینک ورود */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t('register.haveAccount')}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t('register.signIn')}
        </Link>
      </p>
    </main>
  )
}
