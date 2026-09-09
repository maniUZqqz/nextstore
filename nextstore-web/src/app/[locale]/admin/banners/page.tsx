/**
 * مدیریت بنرهای صفحه‌ی اصلی
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/banners
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminBannersList } from '@/components/admin/AdminBannersList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('banners.title') }
}

export default async function AdminBannersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AdminBannersList />
}
