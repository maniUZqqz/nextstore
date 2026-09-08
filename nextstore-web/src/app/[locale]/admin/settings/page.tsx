/**
 * صفحه‌ی تنظیمات فروشگاه
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/settings
 *
 * مقادیری که تا پیش از این در فوتر و فایل‌های ترجمه هاردکد بودند —
 * نام فروشگاه، تلفن، شبکه‌های اجتماعی — از اینجا مدیریت می‌شوند.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminSettingsForm } from '@/components/admin/AdminSettingsForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('settings.title') }
}

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AdminSettingsForm />
}
