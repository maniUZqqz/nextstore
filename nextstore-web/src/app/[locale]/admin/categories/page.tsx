/**
 * صفحه‌ی مدیریت دسته‌بندی‌ها
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/categories
 *
 * پوسته‌ی Server Component؛ درخت تعاملی در AdminCategories است چون
 * داده با توکن مرورگر خوانده می‌شود.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminCategories } from '@/components/admin/AdminCategories'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('categories.title') }
}

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AdminCategories />
}
