/**
 * صفحه سبد خرید
 * ---------------------------------------------------------------------------
 * پوسته‌ی Server Component که فقط عنوان و متادیتا را می‌سازد؛
 * محتوای تعاملی در CartContent (کلاینتی) است، چون سبد در
 * localStorage مرورگر نگهداری می‌شود.
 *
 * چرا این تقسیم‌بندی؟ اگر کل صفحه کلاینتی می‌شد، متادیتای سئو و
 * ترجمه‌ها سمت سرور تولید نمی‌شدند.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { CartContent } from '@/components/cart/CartContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'cart' })

  return {
    title: t('title'),
    /* صفحه سبد خرید محتوای شخصی است و نباید ایندکس شود */
    robots: { index: false, follow: true },
  }
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('cart')
  const tCommon = await getTranslations('common')

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: tCommon('viewAll'), href: '/products' },
          { label: t('title') },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        <h1 className="mb-5 text-xl font-bold text-foreground sm:text-2xl">
          {t('title')}
        </h1>

        <CartContent />
      </main>
    </div>
  )
}
