/**
 * صفحه‌ی پروفایل یک مشتری در پنل مدیریت
 * ---------------------------------------------------------------------------
 * ⚠️ پارامتر مسیر **شناسه‌ی عددی** است، نه ایمیل یا نامک.
 *
 *    ایمیل داده‌ی شخصی است و نباید در آدرس صفحه، تاریخچه‌ی مرورگر و
 *    لاگ سرور بنشیند. شناسه هم هرگز تغییر نمی‌کند، پس لینک‌های
 *    ذخیره‌شده نمی‌شکنند.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminCustomerDetail } from '@/components/admin/AdminCustomerDetail'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('customers.title') }
}

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  /*
   * شناسه‌ی نامعتبر پیش از هر درخواستی رد می‌شود.
   * بدون این، `/admin/customers/abc` یک درخواست بی‌فایده به API
   * می‌فرستاد و کاربر خطای عمومی می‌دید، نه صفحه‌ی ۴۰۴.
   */
  const customerId = Number(id)
  if (!Number.isInteger(customerId) || customerId < 1) notFound()

  return <AdminCustomerDetail customerId={customerId} />
}
