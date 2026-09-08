/**
 * صفحه‌ی ویرایش مقاله
 * ---------------------------------------------------------------------------
 * مسیر: /fa/admin/posts/۱۲
 *
 * ⚠️ پارامتر مسیر «شناسه» است نه نامک — برخلاف صفحه‌ی عمومی مقاله.
 *    نامک همان چیزی است که ادمین ویرایش می‌کند؛ اگر آدرس ویرایش هم
 *    به آن وابسته بود، با تغییر نامک آدرس صفحه بی‌اعتبار می‌شد.
 */

import { notFound } from 'next/navigation'
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

  return { title: t('posts.edit') }
}

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  /*
   * شناسه‌ی نامعتبر همین‌جا ۴۰۴ می‌شود، نه اینکه به کامپوننت برود و
   * آنجا به یک درخواست شکست‌خورده تبدیل شود.
   */
  const postId = Number(id)
  if (!Number.isInteger(postId) || postId < 1) notFound()

  return <AdminPostForm postId={postId} />
}
