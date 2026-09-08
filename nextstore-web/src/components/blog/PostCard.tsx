import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Clock, Eye, FileText } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { Post } from '@/types/post'

/**
 * کارت یک مقاله در فهرست مجله
 * ---------------------------------------------------------------------------
 * Server Component است — هیچ تعاملی ندارد، پس نیازی نیست جاوااسکریپت
 * آن به مرورگر برود.
 *
 * دو نما دارد:
 *   default   — کارت عمودی معمولی برای شبکه
 *   featured  — کارت افقی بزرگ برای مطلب ویژه‌ی بالای صفحه
 */
export async function PostCard({
  post,
  locale,
  variant = 'default',
  priority = false,
}: {
  post: Post
  locale: Locale
  variant?: 'default' | 'featured'
  /**
   * اولویت بارگذاری تصویر.
   * برای چند کارت اول صفحه true باشد تا معیار LCP بهتر شود.
   */
  priority?: boolean
}) {
  const t = await getTranslations('blog')
  const isFeatured = variant === 'featured'

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-(--radius-lg) border border-border bg-card',
        'transition-shadow duration-[var(--duration-normal)] hover:shadow-(--shadow-md)',
        isFeatured && 'sm:grid sm:grid-cols-2',
      )}
    >
      <Link href={`/blog/${post.slug}`} className="block">
        {/* --- تصویر شاخص --- */}
        <div
          className={cn(
            'relative overflow-hidden bg-muted',
            /* کاور مقاله عریض است (۱۶:۹)، نه مربع مثل تصویر محصول */
            isFeatured ? 'aspect-[16/10] sm:h-full' : 'aspect-[16/9]',
          )}
        >
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes={
                isFeatured
                  ? '(max-width: 640px) 100vw, 50vw'
                  : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
              }
              priority={priority}
              className="object-cover transition-transform duration-[var(--duration-normal)] group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
            </div>
          )}

          {/* نشان دسته روی تصویر */}
          {post.category && (
            <span className="absolute start-3 top-3 rounded-(--radius-sm) bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
              {post.category.name}
            </span>
          )}
        </div>
      </Link>

      {/* --- متن --- */}
      <div className={cn('flex flex-col p-4', isFeatured && 'sm:justify-center sm:p-6')}>
        <Link href={`/blog/${post.slug}`}>
          <h3
            className={cn(
              'font-bold leading-7 text-foreground transition-colors group-hover:text-primary',
              isFeatured ? 'text-lg sm:text-xl' : 'line-clamp-2 text-base',
            )}
          >
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p
            className={cn(
              'mt-2 text-sm leading-7 text-muted-foreground',
              isFeatured ? 'line-clamp-3' : 'line-clamp-2',
            )}
          >
            {post.excerpt}
          </p>
        )}

        {/* --- فراداده --- */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          )}

          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {t('readingTime', { minutes: formatNumber(post.readingMinutes, locale) })}
          </span>

          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden="true" />
            {formatNumber(post.viewsCount, locale)}
          </span>
        </div>

        {post.authorName && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('by', { author: post.authorName })}
          </p>
        )}
      </div>
    </article>
  )
}
