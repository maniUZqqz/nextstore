import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { PostCategory } from '@/types/post'

/**
 * نوار دسته‌های مجله
 * ---------------------------------------------------------------------------
 * مثل صفحه‌بندی، با لینک واقعی ساخته شده تا هر دسته آدرس یکتای
 * قابل ایندکس و قابل اشتراک داشته باشد.
 *
 * ⚠️ دسته‌های بدون مقاله نمایش داده نمی‌شوند. لینکی که به صفحه‌ی
 *    خالی می‌رود، هم کاربر را سرخورده می‌کند و هم برای موتور جستجو
 *    یک صفحه‌ی بی‌ارزش می‌سازد.
 */
export async function CategoryFilter({
  categories,
  activeSlug,
  locale,
}: {
  categories: PostCategory[]
  /** نامک دسته‌ی فعال؛ تهی یعنی «همه» */
  activeSlug?: string
  locale: Locale
}) {
  const t = await getTranslations('blog')

  const visible = categories.filter((category) => category.postsCount > 0)
  if (visible.length === 0) return null

  const chipClass =
    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors'

  return (
    <nav
      aria-label={t('allCategories')}
      /* اسکرول افقی در موبایل — وگرنه چیپ‌ها به چند خط می‌شکنند */
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      <Link
        href="/blog"
        aria-current={!activeSlug ? 'page' : undefined}
        className={cn(
          chipClass,
          !activeSlug
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border text-foreground hover:bg-accent',
        )}
      >
        {t('allCategories')}
      </Link>

      {visible.map((category) => {
        const active = category.slug === activeSlug

        return (
          <Link
            key={category.id}
            href={`/blog/category/${category.slug}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              chipClass,
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-foreground hover:bg-accent',
            )}
          >
            {category.name}
            <span className={cn('text-xs tabular-nums', active ? 'opacity-80' : 'text-muted-foreground')}>
              {formatNumber(category.postsCount, locale)}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
