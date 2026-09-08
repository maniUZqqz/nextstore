/**
 * صفحه‌ی امنیت حساب
 * ---------------------------------------------------------------------------
 * مسیر: /fa/account/security
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { SecurityPanel } from '@/components/account/SecurityPanel'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'security' })

  return {
    title: t('title'),
    /* محتوای شخصی — نباید ایندکس شود */
    robots: { index: false, follow: false },
  }
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('security')
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
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

        <SecurityPanel />
      </main>
    </div>
  )
}
