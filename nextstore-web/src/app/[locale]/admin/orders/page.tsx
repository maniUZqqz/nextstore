/**
 * صفحه‌ی فهرست سفارش‌ها در پنل مدیریت
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/orders  ·  /en/admin/orders
 *
 * این فایل یک Server Component نازک است: فقط زبان و پارامتر آدرس را
 * می‌خواند و کار به کامپوننت کلاینتی می‌سپارد. منطق واکنشی (فیلتر،
 * جستجو، صفحه‌بندی) ذاتاً سمت کلاینت است.
 *
 * ⚠️ searchParams در Next 15+ یک Promise است و باید await شود؛
 *    خواندن مستقیم آن خطای زمان اجرا می‌دهد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminOrdersList } from '@/components/admin/AdminOrdersList'
import type { OrderStatusValue } from '@/types/order'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('orders.title') }
}

/** وضعیت‌های معتبری که می‌توانند از آدرس بیایند. */
const VALID_STATUSES: OrderStatusValue[] = [
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
]

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { status, q } = await searchParams

  /*
   * اعتبارسنجی پارامتر آدرس.
   * کاربر می‌تواند ?status=hacked بزند؛ بدون این بررسی، مقدار بی‌معنا
   * به API می‌رفت و فهرست بی‌دلیل خالی می‌شد.
   */
  const initialStatus = VALID_STATUSES.find((value) => value === status)

  return (
    <AdminOrdersList
      initialStatus={initialStatus}
      initialSearch={(q ?? '').slice(0, 100)}
    />
  )
}
