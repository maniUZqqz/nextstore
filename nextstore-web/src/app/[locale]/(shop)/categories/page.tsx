/**
 * صفحه‌ی فهرست دسته‌بندی‌ها
 * ===========================================================================
 * مسیر: /fa/categories · /en/categories
 *
 * نمای دو سطحی: هر دسته‌ی اصلی یک کارت است و زیردسته‌هایش به‌صورت
 * چیپ زیر آن می‌آیند.
 *
 * ⚠️ چرا زیردسته‌ها چیپ‌اند و نه کارت جدا؟
 *    فروشگاه ۹ دسته‌ی اصلی و حدود ۲۰ زیردسته دارد. اگر همه کارت
 *    می‌شدند، کاربر با ۳۰ کارت هم‌اندازه روبه‌رو می‌شد و سلسله‌مراتب
 *    گم می‌شد. با چیپ، در یک نگاه معلوم است چه چیزی زیرمجموعه‌ی
 *    چیست.
 *
 * Server Component است و داده را در زمان بیلد/ISR می‌گیرد؛ این صفحه
 * تقریباً هرگز تغییر نمی‌کند پس نیازی به رندر سمت کلاینت ندارد.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getCategories } from '@/lib/api/catalog'
import type { Category } from '@/types/product'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { formatNumber } from '@/lib/utils/format'
import { categoryIcon } from '@/lib/utils/category-icons'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'categories' })

  return {
    title: t('title'),
    description: t('subtitle'),
  }
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('categories')
  const tNav = await getTranslations('nav')
  const tStates = await getTranslations('states')

  /*
   * خطای شبکه نباید کل صفحه را بترکاند.
   * سرصفحه و بردکرامب رندر می‌شوند و فقط شبکه‌ی دسته‌ها جای خود را
   * به یک پیام می‌دهد — همان الگوی «تخریب تدریجی» صفحه‌ی اصلی.
   */
  let categories: Category[] = []
  let failed = false

  try {
    categories = (await getCategories(locale)).data
  } catch {
    failed = true
  }

  /* در RTL فلش «برو» به چپ اشاره می‌کند */
  const Arrow = locale === 'fa' ? ChevronLeft : ChevronRight

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

      {!failed && categories.length === 0 && (
        <p className="mt-6 rounded-(--radius-lg) border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      )}

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          /*
            هر دسته آیکون خودش را می‌گیرد. پیش‌تر همه یک مربع یکسان
            داشتند و شبکه‌ی شش‌کارتی هیچ تمایز بصری نداشت.
          */
          const Icon = categoryIcon(category.icon)

          return (
          <li
            key={category.id}
            className="flex flex-col rounded-(--radius-lg) border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            {/* --- سر کارت: تصویر/آیکون + نام + شمارش --- */}
            <Link
              href={`/categories/${category.slug}`}
              className="group flex items-center gap-3"
            >
              <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-(--radius-md) bg-accent text-accent-foreground">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <Icon className="size-6" aria-hidden="true" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-foreground group-hover:text-primary">
                  {category.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t('productsCount', {
                    count: formatNumber(category.productsCount, locale as Locale),
                  })}
                </span>
              </span>

              <Arrow
                className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            {/* --- زیردسته‌ها به‌صورت چیپ --- */}
            {category.children.length > 0 && (
              <>
                <p className="mt-4 text-xs text-muted-foreground">{t('subcategories')}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/*
              دسته‌ی بدون زیردسته نباید کارتش کوتاه‌تر از بقیه شود،
              وگرنه شبکه ناهموار می‌شود. mt-auto ته کارت را پر می‌کند.
            */}
            <Link
              href={`/products?category=${category.slug}`}
              className="mt-auto pt-4 text-xs font-medium text-primary hover:underline"
            >
              {t('viewProducts')}
            </Link>
          </li>
          )
        })}
      </ul>
    </main>
  )
}
