/**
 * ردیف دایره‌ای دسته‌بندی‌ها
 * ---------------------------------------------------------------------------
 * الگوی آشنای فروشگاه‌های موبایل‌محور: یک ردیف آیکون دایره‌ای زیر بنر اصلی
 * که سریع‌ترین راه ورود کاربر به دسته‌ی موردنظرش است.
 *
 * چیدمان:
 *   موبایل → اسکرول افقی (فضای عمودی صرفه‌جویی می‌شود)
 *   دسکتاپ → شبکه‌ی جاافتاده
 */

import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { Category } from '@/types/product'
import { formatNumber } from '@/lib/utils/format'
import { categoryIcon } from '@/lib/utils/category-icons'


export async function CategoryCircles({
  categories,
  locale,
}: {
  categories: Category[]
  locale: Locale
}) {
  const t = await getTranslations('home.sections')

  return (
    <section aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="sr-only">
        {t('categories')}
      </h2>

      {/*
        در موبایل اسکرول افقی است.
        کلاس no-scrollbar نداریم؛ اسکرول‌بار نازک سیستم قابل قبول است
        و به کاربر نشان می‌دهد محتوای بیشتری وجود دارد.
      */}
      <ul className="flex gap-3 overflow-x-auto pb-2 sm:gap-4 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
        {categories.map((category) => {
          /* نگاشت مشترک — همان چیزی که صفحه‌ی دسته‌بندی‌ها هم استفاده می‌کند */
          const Icon = categoryIcon(category.icon)

          return (
            <li key={category.id} className="shrink-0">
              <Link
                href={`/categories/${category.slug}`}
                className="group flex w-20 flex-col items-center gap-2 sm:w-24 lg:w-full"
              >
                {/* دایره آیکون */}
                <span className="flex size-16 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-[var(--duration-base)] group-hover:border-primary group-hover:bg-accent group-hover:text-primary sm:size-20">
                  <Icon className="size-7 sm:size-8" aria-hidden="true" />
                </span>

                {/* نام دسته */}
                <span className="line-clamp-2 text-center text-[11px] font-medium leading-4 text-foreground sm:text-xs">
                  {category.name}
                </span>

                {/* تعداد محصولات */}
                <span className="text-[10px] text-muted-foreground">
                  {formatNumber(category.productsCount, locale)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
