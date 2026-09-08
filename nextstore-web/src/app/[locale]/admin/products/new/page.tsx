/**
 * صفحه‌ی افزودن محصول جدید
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/products/new
 *
 * ⚠️ ترتیب مسیرها در Next.js اهمیت دارد: پوشه‌ی ثابت `new` بر
 *    مسیر پویای `[slug]` اولویت دارد، پس /admin/products/new
 *    همیشه این صفحه را باز می‌کند نه فرم ویرایش محصولی به نام
 *    «new». این رفتار در روتر App تضمین‌شده است.
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

  return { title: t('products.new') }
}

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  /* بدون prop یعنی حالت ساخت — فرم خالی می‌ماند و POST می‌فرستد */
  return <AdminProductForm />
}
