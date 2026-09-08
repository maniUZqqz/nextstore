/**
 * صفحه‌ی مقایسه‌ی محصولات
 * ---------------------------------------------------------------------------
 * صفحه‌ی ۱۰ رودمپ.
 *
 * ⚠️ کاملاً سمت کلاینت رندر می‌شود: فهرست مقایسه در localStorage است و
 *    سرور از آن خبر ندارد. پیش‌رندر سرور اینجا معنایی ندارد و فقط یک
 *    پرش hydration می‌ساخت.
 *
 * ⚠️ `robots: noindex` — محتوای این صفحه به انتخاب هر بازدیدکننده
 *    وابسته است و برای موتور جستجو همیشه خالی دیده می‌شود.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { CompareTable } from '@/components/product/CompareTable'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'compare' })

  return {
    title: t('title'),
    robots: { index: false, follow: true },
  }
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('compare')
  const tNav = await getTranslations('nav')

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[{ label: tNav('home'), href: '/' }, { label: t('title') }]}
        className="mb-4"
      />

      <main id="main-content">
        <h1 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{t('subtitle')}</p>

        <CompareTable />
      </main>
    </div>
  )
}
