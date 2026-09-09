/**
 * فاکتور قابل چاپ سفارش
 * ---------------------------------------------------------------------------
 * مسیر: /fa/account/orders/NS-260908-1234/invoice
 *
 * ⚠️ `proxy.ts` کاربر واردنشده را به صفحه‌ی ورود می‌فرستد، و خودِ
 *    اندپوینت سفارش هم فقط سفارش‌های همان کاربر را برمی‌گرداند —
 *    دو لایه، چون فاکتور سند مالی است.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { OrderInvoice } from '@/components/account/OrderInvoice'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>
}): Promise<Metadata> {
  const { locale, orderNumber } = await params
  const t = await getTranslations({ locale, namespace: 'invoice' })

  return {
    title: `${t('title')} ${orderNumber}`,
    /* سند مالی شخصی — نه ایندکس شود و نه دنبال شود */
    robots: { index: false, follow: false },
  }
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>
}) {
  const { locale, orderNumber } = await params
  setRequestLocale(locale)

  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-4 py-6 sm:px-6 print:max-w-none print:px-0 print:py-0"
    >
      <OrderInvoice orderNumber={orderNumber} />
    </main>
  )
}
