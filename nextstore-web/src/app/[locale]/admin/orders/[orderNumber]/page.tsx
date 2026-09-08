/**
 * صفحه‌ی جزئیات یک سفارش در پنل مدیریت
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/orders/NS-140306-1234
 *
 * شماره سفارش (نه شناسه عددی) کلید مسیر است، چون همان چیزی است که
 * ادمین و مشتری در مکالمه‌ی پشتیبانی به کار می‌برند — کپی کردنش از
 * ایمیل مشتری مستقیماً کار می‌کند.
 */

import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { AdminOrderDetail } from '@/components/admin/AdminOrderDetail'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}): Promise<Metadata> {
  const { orderNumber } = await params

  /* عنوان تب همان شماره سفارش است — با چند تب باز، تشخیص آسان می‌شود */
  return { title: decodeURIComponent(orderNumber) }
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>
}) {
  const { locale, orderNumber } = await params
  setRequestLocale(locale)

  /*
   * decodeURIComponent لازم است: اگر شماره سفارش روزی کاراکتر
   * غیر ASCII بگیرد، مرورگر آن را کدگذاری‌شده می‌فرستد.
   */
  return <AdminOrderDetail orderNumber={decodeURIComponent(orderNumber)} />
}
