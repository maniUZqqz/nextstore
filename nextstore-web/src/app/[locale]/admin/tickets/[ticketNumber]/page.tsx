/**
 * صفحه‌ی گفتگوی یک تیکت در پنل مدیریت
 * ---------------------------------------------------------------------------
 * ⚠️ پارامتر مسیر **شماره‌ی تیکت** است، نه شناسه‌ی عددی.
 *
 *    برخلاف مقاله (که با شناسه بایند شد چون نامکش ویرایش می‌شود)،
 *    شماره‌ی تیکت پس از ساخت هرگز عوض نمی‌شود — پس آدرس نمی‌شکند و
 *    خواناتر هم هست: همان چیزی که در ایمیل و مکالمه با مشتری رد و
 *    بدل می‌شود.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminTicketDetail } from '@/components/admin/AdminTicketDetail'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ticketNumber: string }>
}): Promise<Metadata> {
  const { locale, ticketNumber } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: `${t('tickets.title')} ${decodeURIComponent(ticketNumber)}` }
}

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ locale: string; ticketNumber: string }>
}) {
  const { locale, ticketNumber } = await params
  setRequestLocale(locale)

  return <AdminTicketDetail ticketNumber={decodeURIComponent(ticketNumber)} />
}
