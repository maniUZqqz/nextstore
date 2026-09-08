/**
 * صفحه گفتگوی یک تیکت
 * ---------------------------------------------------------------------------
 * ⚠️ پارامتر مسیر **شماره‌ی تیکت** است (`TK-453172`) نه شناسه‌ی عددی.
 *    بک‌اند با همین شماره و از `$user->tickets()` کوئری می‌زند، پس
 *    تیکت کاربر دیگر اصلاً بارگذاری نمی‌شود.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { TicketConversation } from '@/components/account/TicketConversation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ticketNumber: string }>
}): Promise<Metadata> {
  const { locale, ticketNumber } = await params
  const t = await getTranslations({ locale, namespace: 'tickets' })

  return {
    title: `${t('title')} ${ticketNumber}`,
    robots: { index: false, follow: false },
  }
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ locale: string; ticketNumber: string }>
}) {
  const { locale, ticketNumber } = await params
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
          { label: decodeURIComponent(ticketNumber) },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        <TicketConversation ticketNumber={decodeURIComponent(ticketNumber)} />
      </main>
    </div>
  )
}
