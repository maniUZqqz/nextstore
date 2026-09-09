/**
 * صفحه‌ی اعلان‌های کاربر
 * ---------------------------------------------------------------------------
 * مسیر: /fa/account/notifications
 *
 * ⚠️ `proxy.ts` کاربر واردنشده را پیش از رندر به صفحه‌ی ورود می‌فرستد،
 *    پس اینجا بررسی احراز هویت لازم نیست.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { NotificationsList } from '@/components/account/NotificationsList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'notifications' })

  return {
    title: t('title'),
    /* صفحه‌ی شخصی ارزش ایندکس شدن ندارد */
    robots: { index: false, follow: false },
  }
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <NotificationsList />
}
