/**
 * لایوت پنل مدیریت
 * ---------------------------------------------------------------------------
 * ساختار مشترک همه‌ی صفحات پنل: محافظ دسترسی + ناوبری کناری.
 *
 * ⚠️ سه لایه محافظت روی این بخش:
 *   ۱. proxy.ts        — کاربر بدون کوکی توکن اصلاً به مسیر نمی‌رسد
 *   ۲. AdminGuard      — کاربر بدون نقش مدیر پیام روشن می‌بیند
 *   ۳. EnsureIsAdmin   — بک‌اند هر درخواست را ۴۰۳ می‌کند (امنیت واقعی)
 *
 * لایه‌های ۱ و ۲ فقط تجربه‌ی کاربری‌اند؛ امنیت در لایه ۳ است.
 */

import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale, getTranslations, getMessages } from 'next-intl/server'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return {
    title: { default: t('title'), template: `%s | ${t('title')}` },
    /* پنل مدیریت هرگز نباید ایندکس شود */
    robots: { index: false, follow: false },
  }
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  /*
   * تزریق دوباره‌ی پیام‌های کامل — شامل فضای‌نام admin.
   *
   * لایوت ریشه عمداً فضای‌نام admin را حذف می‌کند تا صفحات فروشگاه
   * ۳.۴ کیلوبایت سبک‌تر شوند. اینجا پرووایدر تودرتو همان پیام‌ها را
   * برای زیرشاخه‌ی /admin برمی‌گرداند.
   */
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider messages={messages}>
      {/*
        نوار بالای پنل — جایگزین هدر فروشگاه.
        بیرون از AdminGuard است تا کاربر بی‌دسترسی هم راه بازگشت
        به فروشگاه و دکمه‌ی خروج را داشته باشد.
      */}
      <AdminHeader />

      <div className="mx-auto max-w-(--container-admin) px-4 py-5 sm:px-6 lg:px-8">
        <AdminGuard>
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">
            <AdminSidebar />

            <main id="main-content" className="min-w-0 flex-1">
              {children}
            </main>
          </div>
        </AdminGuard>
      </div>
    </NextIntlClientProvider>
  )
}
