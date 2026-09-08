/**
 * صفحه‌ی ساخت مقاله‌ی تازه
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/posts/new
 *
 * ⚠️ این مسیر باید *پیش از* [id] تعریف شود از نظر مفهومی — Next خودش
 *    مسیر ثابت را بر مسیر پویا مقدم می‌داند، پس «new» هرگز به‌عنوان
 *    شناسه تفسیر نمی‌شود.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { AdminPostForm } from '@/components/admin/AdminPostForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })

  return { title: t('posts.new') }
}

export default async function AdminNewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <AdminPostForm />
}
