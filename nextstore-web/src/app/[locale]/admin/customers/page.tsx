/**
 * صفحه‌ی فهرست مشتریان در پنل مدیریت
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/customers
 *
 * پارامتر `?status=buyers` پشتیبانی می‌شود تا بشود از داشبورد مستقیم
 * به نمای درست لینک داد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminCustomersList } from '@/components/admin/AdminCustomersList'
import type { CustomerTab } from '@/types/admin'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('customers.title') }
}

/** تب‌های معتبر — هر چیز دیگری نادیده گرفته می‌شود. */
const VALID: CustomerTab[] = ['all', 'active', 'inactive', 'buyers']

export default async function AdminCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { status } = await searchParams

  return <AdminCustomersList initialStatus={VALID.find((value) => value === status)} />
}
