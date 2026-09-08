/**
 * صفحه‌ی فهرست برندها
 * ===========================================================================
 * مسیر: /fa/brands · /en/brands
 *
 * شبکه‌ی کارت برند با لوگو، نام، کشور و تعداد محصول.
 *
 * ⚠️ برندهای بدون محصول هم نمایش داده می‌شوند، اما با ظاهر کم‌رنگ‌تر
 *    و بدون لینک به صفحه‌ی خالی. حذف کاملشان بهتر به نظر می‌رسد
 *    ولی برای ادمین گیج‌کننده است: برندی که ثبت کرده ناپدید شده و
 *    نمی‌داند چرا.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Tag, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getBrands } from '@/lib/api/catalog'
import type { Brand } from '@/types/product'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'brands' })

  return { title: t('title'), description: t('subtitle') }
}

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('brands')
  const tNav = await getTranslations('nav')
  const tStates = await getTranslations('states')

  let brands: Brand[] = []
  let failed = false

  try {
    brands = (await getBrands(locale)).data
  } catch {
    failed = true
  }

  return (
    <main
      id="main-content"
      className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8"
    >
      <Breadcrumb items={[{ label: tNav('home'), href: '/' }, { label: t('title') }]} />

      <header className="mt-3">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {failed && (
        <div className="mt-6 flex items-start gap-3 rounded-(--radius-lg) border border-border bg-muted p-5">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">{tStates('errorTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tStates('errorDesc')}</p>
          </div>
        </div>
      )}

      {!failed && brands.length === 0 && (
        <p className="mt-6 rounded-(--radius-lg) border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      )}

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {brands.map((brand) => {
          const count = brand.productsCount ?? 0
          const hasProducts = count > 0

          /*
           * برند بدون محصول لینک نمی‌شود — کاربر را به صفحه‌ی خالی
           * فرستادن، بن‌بست است. کارت می‌ماند تا ادمین بداند ثبت شده.
           */
          const CardTag = hasProducts ? Link : 'div'
          const cardProps = hasProducts ? { href: `/brands/${brand.slug}` } : {}

          return (
            <li key={brand.id}>
              <CardTag
                {...(cardProps as { href: string })}
                className={cn(
                  'flex h-full flex-col items-center gap-3 rounded-(--radius-lg) border border-border bg-card p-4 text-center transition-colors',
                  hasProducts
                    ? 'hover:border-primary/40 hover:bg-accent/40'
                    : 'opacity-60',
                )}
              >
                {/* لوگو — مونوگرام تولیدشده در بک‌اند */}
                <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-(--radius-md) border border-border bg-background">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <Tag className="size-6 text-muted-foreground" aria-hidden="true" />
                  )}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {brand.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t('productsCount', { count: formatNumber(count, locale as Locale) })}
                  </span>
                </span>
              </CardTag>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
