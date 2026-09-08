/**
 * صفحه‌ی ویرایش محصول
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/products/iphone-15-pro-max
 *
 * نامک کلید مسیر است، نه شناسه‌ی عددی — همان چیزی که در آدرس
 * صفحه‌ی عمومی محصول هم هست، پس رفتن از فروشگاه به فرم ویرایش
 * فقط اضافه کردن /admin است.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminProductForm } from '@/components/admin/AdminProductForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('products.edit') }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  return <AdminProductForm slug={decodeURIComponent(slug)} />
}
