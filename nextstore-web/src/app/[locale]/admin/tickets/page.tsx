/**
 * صفحه‌ی صف پشتیبانی در پنل مدیریت
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/tickets
 *
 * پارامتر `?status=all` پشتیبانی می‌شود تا بشود از جای دیگر (مثلاً
 * کارت داشبورد) مستقیم به نمای درست لینک داد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminTicketsList } from '@/components/admin/AdminTicketsList'
import type { AdminTicketTab } from '@/types/admin'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('tickets.title') }
}

/** وضعیت‌های معتبر — هر چیز دیگری نادیده گرفته می‌شود. */
const VALID: AdminTicketTab[] = ['needs_attention', 'open', 'answered', 'closed', 'all']

export default async function AdminTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { status } = await searchParams

  return <AdminTicketsList initialStatus={VALID.find((value) => value === status)} />
}
