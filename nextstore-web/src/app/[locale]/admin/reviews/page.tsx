/**
 * صفحه‌ی تعدیل نظرات در پنل مدیریت
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/reviews
 *
 * یک پارامتر آدرس پشتیبانی می‌شود تا بشود از جای دیگر (مثلاً کارت
 * «نظرات در انتظار» در داشبورد) مستقیم به نمای درست لینک داد:
 *     ?status=approved
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminReviewsList } from '@/components/admin/AdminReviewsList'
import type { ReviewStatusTab } from '@/types/admin'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('reviews.title') }
}

/** وضعیت‌های معتبر — هر چیز دیگری نادیده گرفته می‌شود. */
const VALID_STATUSES: ReviewStatusTab[] = ['all', 'pending', 'approved', 'rejected']

export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { status } = await searchParams

  return (
    <AdminReviewsList
      initialStatus={VALID_STATUSES.find((value) => value === status)}
    />
  )
}
