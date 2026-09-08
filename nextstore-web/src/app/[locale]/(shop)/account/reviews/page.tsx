/**
 * صفحه‌ی نظرات کاربر
 * ---------------------------------------------------------------------------
 * مسیر: /fa/account/reviews
 *
 * پوسته‌ی Server Component؛ فهرست تعاملی در MyReviewsList است چون
 * داده با توکن مرورگر خوانده می‌شود.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { MyReviewsList } from '@/components/account/MyReviewsList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })

  return {
    title: t('reviewsTitle'),
    /* محتوای شخصی — نباید ایندکس شود */
    robots: { index: false, follow: false },
  }
}

export default async function MyReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('account')
  const tNav = await getTranslations('nav')

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: tNav('home'), href: '/' },
          { label: t('dashboard'), href: '/account' },
          { label: t('reviewsTitle') },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {t('reviewsTitle')}
        </h1>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">{t('reviewsSubtitle')}</p>

        <MyReviewsList />
      </main>
    </div>
  )
}
