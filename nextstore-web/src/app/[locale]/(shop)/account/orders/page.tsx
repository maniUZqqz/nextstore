/**
 * صفحه فهرست سفارش‌های کاربر
 * ---------------------------------------------------------------------------
 * پوسته‌ی Server Component؛ فهرست تعاملی در OrdersList است چون
 * داده با توکن مرورگر خوانده می‌شود.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { OrdersList } from '@/components/account/OrdersList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'order' })

  return {
    title: t('title'),
    /* محتوای شخصی — نباید ایندکس شود */
    robots: { index: false, follow: false },
  }
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
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
          { label: t('title') },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        <h1 className="mb-5 text-xl font-bold text-foreground sm:text-2xl">
          {t('title')}
        </h1>

        <OrdersList />
      </main>
    </div>
  )
}
