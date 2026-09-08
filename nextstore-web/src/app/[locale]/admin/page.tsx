/**
 * صفحه داشبورد پنل مدیریت
 * ---------------------------------------------------------------------------
 * پوسته‌ی Server Component؛ آمار در AdminDashboard (کلاینتی) گرفته
 * می‌شود چون به توکن مرورگر نیاز دارد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' })

  return { title: t('title') }
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('admin.dashboard')

  return (
    <>
      <header className="mb-5">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <AdminDashboard />
    </>
  )
}
