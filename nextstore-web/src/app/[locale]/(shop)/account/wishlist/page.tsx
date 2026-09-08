/**
 * صفحه علاقه‌مندی‌های کاربر
 * ---------------------------------------------------------------------------
 * پوسته‌ی Server Component؛ شبکه‌ی تعاملی در WishlistGrid است چون
 * داده با توکن مرورگر خوانده می‌شود.
 *
 * ⚠️ این صفحه برخلاف بقیه‌ی مسیرهای /account برای مهمان هم باز است.
 *    proxy.ts مسیر /account را محافظت می‌کند، پس مهمان به اینجا
 *    نمی‌رسد — ولی خودِ کامپوننت حالت مهمان را هم پوشش می‌دهد تا
 *    اگر روزی این مسیر عمومی شد، صفحه‌ی خالی نشان ندهد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { WishlistGrid } from '@/components/account/WishlistGrid'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'account' })

  return {
    title: t('wishlistTitle'),
    description: t('wishlistDesc'),
    /* محتوای شخصی — نباید ایندکس شود */
    robots: { index: false, follow: false },
  }
}

export default async function WishlistPage({
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
          { label: t('wishlistTitle') },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {t('wishlistTitle')}
        </h1>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">
          {t('wishlistDesc')}
        </p>

        <WishlistGrid />
      </main>
    </div>
  )
}
