/**
 * صفحه‌ی فهرست مقالات مجله در پنل مدیریت
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/posts
 *
 * دو پارامتر آدرس پشتیبانی می‌شوند تا بشود از جای دیگر مستقیم به
 * نمای درست لینک داد:
 *     ?status=draft   → فقط پیش‌نویس‌ها
 *     ?q=...          → با عبارت جستجو
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminPostsList } from '@/components/admin/AdminPostsList'
import type { PostStatusValue } from '@/types/admin'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('posts.title') }
}

/** وضعیت‌های معتبر — هر چیز دیگری نادیده گرفته می‌شود. */
const VALID_STATUSES: PostStatusValue[] = ['draft', 'scheduled', 'published']

export default async function AdminPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const { status, q } = await searchParams

  return (
    <AdminPostsList
      initialStatus={VALID_STATUSES.find((value) => value === status)}
      /* عبارت جستجو کوتاه نگه داشته می‌شود تا کوئری غول‌آسا نسازد */
      initialSearch={(q ?? '').slice(0, 100)}
    />
  )
}
