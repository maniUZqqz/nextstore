/**
 * صفحه‌ی مدیریت کدهای تخفیف
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/coupons
 *
 * پارامتر `?state=expired` پشتیبانی می‌شود تا بشود از جای دیگر مستقیم
 * به نمای درست لینک داد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminCouponsList } from '@/components/admin/AdminCouponsList'
import type { CouponTab } from '@/types/admin'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('coupons.title') }
}

/** وضعیت‌های معتبر — هر چیز دیگری نادیده گرفته می‌شود. */
const VALID: CouponTab[] = ['all', 'active', 'scheduled', 'exhausted', 'expired', 'disabled']

export default async function AdminCouponsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ state?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { state } = await searchParams

  return <AdminCouponsList initialState={VALID.find((value) => value === state)} />
}
