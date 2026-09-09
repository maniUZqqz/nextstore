/**
 * صندوق پیام‌های «تماس با ما» در پنل مدیریت
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/messages
 *
 * یک پارامتر آدرس پشتیبانی می‌شود تا بشود از داشبورد مستقیم به نمای
 * درست لینک داد:
 *     ?status=all
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminContactInbox } from '@/components/admin/AdminContactInbox'
import type { ContactStatusTab } from '@/lib/api/admin-contact'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('contact.title') }
}

/** وضعیت‌های معتبر — هر چیز دیگری نادیده گرفته می‌شود. */
const VALID_STATUSES: ContactStatusTab[] = ['unread', 'read', 'all']

export default async function AdminMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { status } = await searchParams

  return (
    <AdminContactInbox
      initialStatus={VALID_STATUSES.find((value) => value === status)}
    />
  )
}
