/**
 * صفحه جزئیات یک سفارش
 * ---------------------------------------------------------------------------
 * شماره سفارش از مسیر خوانده و به کامپوننت کلاینتی داده می‌شود.
 * خود داده با توکن مرورگر گرفته می‌شود، پس نمی‌توان آن را سمت
 * سرور رندر کرد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { OrderDetailView } from '@/components/account/OrderDetailView'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>
}): Promise<Metadata> {
  const { locale, orderNumber } = await params
  const t = await getTranslations({ locale, namespace: 'order' })

  return {
    title: `${t('orderNumber')} ${orderNumber}`,
    robots: { index: false, follow: false },
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>
}) {
  const { locale, orderNumber } = await params
  setRequestLocale(locale)

  const t = await getTranslations('order')
  const tAccount = await getTranslations('account')
  const tNav = await getTranslations('nav')

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: tNav('home'), href: '/' },
          { label: tAccount('dashboard'), href: '/account' },
          { label: t('title'), href: '/account/orders' },
          { label: orderNumber },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        <OrderDetailView orderNumber={orderNumber} />
      </main>
    </div>
  )
}
