/**
 * صفحه فهرست تیکت‌های پشتیبانی
 * ---------------------------------------------------------------------------
 * پوسته‌ی Server Component؛ فهرست تعاملی در TicketsList است چون
 * داده با توکن مرورگر خوانده می‌شود.
 *
 * پارامتر آدرس `?status=open` پشتیبانی می‌شود تا بشود از جای دیگر
 * مستقیم به نمای درست لینک داد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { TicketsList } from '@/components/account/TicketsList'
import type { TicketFilter } from '@/types/ticket'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tickets' })

  return {
    title: t('title'),
    /* محتوای شخصی — نباید ایندکس شود */
    robots: { index: false, follow: false },
  }
}

/** فیلترهای معتبر — هر چیز دیگری نادیده گرفته می‌شود. */
const VALID_FILTERS: TicketFilter[] = ['all', 'open', 'closed']

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { status } = await searchParams

  const t = await getTranslations('tickets')
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
        <TicketsList initialFilter={VALID_FILTERS.find((value) => value === status)} />
      </main>
    </div>
  )
}
