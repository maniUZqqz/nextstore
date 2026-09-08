/**
 * صفحه ثبت تیکت پشتیبانی تازه
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { TicketForm } from '@/components/account/TicketForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tickets' })

  return {
    title: t('new'),
    robots: { index: false, follow: false },
  }
}

export default async function NewTicketPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('tickets')
  const tAccount = await getTranslations('account')
  const tNav = await getTranslations('nav')

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: tNav('home'), href: '/' },
          { label: tAccount('dashboard'), href: '/account' },
          { label: t('title'), href: '/account/tickets' },
          { label: t('new') },
        ]}
        className="mb-4"
      />

      <main id="main-content" className="max-w-2xl">
        <h1 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">{t('new')}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{t('newSubtitle')}</p>

        <TicketForm />
      </main>
    </div>
  )
}
