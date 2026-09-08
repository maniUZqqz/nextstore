/**
 * صفحه‌ی مدیریت برندها
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/brands
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminBrands } from '@/components/admin/AdminBrands'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('brands.title') }
}

export default async function AdminBrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AdminBrands />
}
