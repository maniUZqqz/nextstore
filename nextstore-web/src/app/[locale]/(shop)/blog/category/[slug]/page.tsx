/**
 * صفحه‌ی مقالات یک دسته
 * ---------------------------------------------------------------------------
 * مسیر: /fa/blog/category/buying-guides
 *
 * ⚠️ چرا مسیر جدا و نه فقط /blog?category=... ؟
 *    دسته باید آدرس یکتای قابل ایندکس داشته باشد. با پارامتر Query،
 *    موتور جستجو همه‌ی دسته‌ها را یک صفحه‌ی تکراری می‌بیند و
 *    هیچ‌کدام رتبه نمی‌گیرند.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { FileText } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getPosts, getPostCategories } from '@/lib/api/blog'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PostCard } from '@/components/blog/PostCard'
import { CategoryFilter } from '@/components/blog/CategoryFilter'
import { BlogPagination } from '@/components/blog/BlogPagination'

/** یافتن دسته با نامک — تهی یعنی دسته وجود ندارد. */
async function findCategory(slug: string, locale: string) {
  const categories = await getPostCategories(locale)
  return {
    categories,
    category: categories.find((item) => item.slug === slug),
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const { category } = await findCategory(slug, locale)

  if (!category) return {}

  const t = await getTranslations({ locale, namespace: 'blog' })

  return {
    title: t('categoryTitle', { name: category.name }),
    description: category.description ?? t('description'),
    alternates: {
      canonical: `/${locale}/blog/category/${slug}`,
      languages: {
        fa: `/fa/blog/category/${slug}`,
        en: `/en/blog/category/${slug}`,
      },
    },
  }
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const sp = await searchParams
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1

  const { categories, category } = await findCategory(slug, locale)

  /*
   * دسته‌ی ناموجود ۴۰۴ می‌گیرد، نه یک صفحه‌ی خالی.
   * صفحه‌ی خالی برای کاربر گیج‌کننده است و برای موتور جستجو یک
   * آدرس بی‌ارزشِ قابل ایندکس می‌سازد.
   */
  if (!category) notFound()

  const t = await getTranslations('blog')
  const tNav = await getTranslations('nav')

  const postsResponse = await getPosts(
    { category: slug, page, per_page: 9 },
    locale,
  )

  const posts = postsResponse.data

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: tNav('home'), href: '/' },
          { label: t('title'), href: '/blog' },
          { label: category.name },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        {/* ================= سربرگ دسته ================= */}
        <header className="mb-6">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {category.name}
          </h1>

          {category.description && (
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              {category.description}
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            {t('postsCount', { count: category.postsCount })}
          </p>
        </header>

        {/* ================= دسته‌های دیگر ================= */}
        <div className="mb-6">
          <CategoryFilter
            categories={categories}
            activeSlug={slug}
            locale={locale as Locale}
          />
        </div>

        {/* ================= محتوا ================= */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
            <FileText className="size-12 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-foreground">{t('empty')}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {t('emptyDesc')}
            </p>

            <Link
              href="/blog"
              className="mt-5 inline-flex h-10 items-center rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {t('backToBlog')}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  locale={locale as Locale}
                  priority={index < 3}
                />
              ))}
            </div>

            <BlogPagination
              meta={postsResponse.meta}
              basePath={`/blog/category/${slug}`}
              searchParams={sp}
              locale={locale as Locale}
            />
          </>
        )}
      </main>
    </div>
  )
}
