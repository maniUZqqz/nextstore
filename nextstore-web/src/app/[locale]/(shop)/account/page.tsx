/**
 * داشبورد پنل کاربری
 * ---------------------------------------------------------------------------
 * پوسته‌ی Server Component؛ محتوا کلاینتی است چون به اطلاعات کاربر
 * واردشده (که با توکن مرورگر گرفته می‌شود) نیاز دارد.
 *
 * ⚠️ محافظت مسیر در دو لایه:
 *   ۱. proxy.ts — کاربر بدون کوکی توکن اصلاً به این صفحه نمی‌رسد
 *   ۲. بک‌اند   — هر درخواست API بدون توکن معتبر ۴۰۱ می‌گیرد
 *   لایه اول فقط تجربه‌ی کاربری است؛ امنیت واقعی در لایه دوم است.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AccountDashboard } from '@/components/account/AccountDashboard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })

  return {
    title: t('dashboard'),
    /* محتوای شخصی نباید ایندکس شود */
    robots: { index: false, follow: false },
  }
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main id="main-content" className="mx-auto max-w-(--container-content) px-4 py-6 sm:px-6 lg:px-8">
      <AccountDashboard />
    </main>
  )
}
