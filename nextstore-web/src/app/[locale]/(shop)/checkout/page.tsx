/**
 * صفحه تسویه حساب
 * ---------------------------------------------------------------------------
 * پوسته‌ی Server Component؛ جریان تعاملی در CheckoutFlow است.
 *
 * ⚠️ محافظت مسیر: proxy.ts کاربر بدون توکن را به صفحه ورود
 *    هدایت می‌کند، پس اینجا همیشه کاربر واردشده داریم.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'checkout' })

  return {
    title: t('title'),
    /* صفحه‌ی شخصی — نباید ایندکس شود */
    robots: { index: false, follow: false },
  }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('checkout')
  const tNav = await getTranslations('nav')

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: tNav('home'), href: '/' },
          { label: tNav('cart'), href: '/cart' },
          { label: t('title') },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        <h1 className="mb-5 text-xl font-bold text-foreground sm:text-2xl">
          {t('title')}
        </h1>

        <CheckoutFlow />
      </main>
    </div>
  )
}
