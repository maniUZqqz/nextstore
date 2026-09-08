/**
 * صفحه‌ی فهرست مقالات مجله
 * ---------------------------------------------------------------------------
 * مسیر: /fa/blog
 *
 * پارامترهای آدرس:
 *     ?q=...     جستجو در عنوان و متن
 *     ?page=۲    شماره صفحه
 *
 * ⚠️ رندر ISR است نه SSR. مقالات به‌ندرت عوض می‌شوند و لایه‌ی API
 *    خودش با revalidate=300 و برچسب «posts» کش می‌کند؛ پنل مدیریت
 *    پس از هر تغییر آن برچسب را باطل می‌کند.
 */

import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { FileText, Search } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getPosts, getPostCategories } from '@/lib/api/blog'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PostCard } from '@/components/blog/PostCard'
import { CategoryFilter } from '@/components/blog/CategoryFilter'
import { BlogPagination } from '@/components/blog/BlogPagination'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })

  return {
    title: t('metaTitle'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { fa: '/fa/blog', en: '/en/blog' },
    },
  }
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const sp = await searchParams
  const query = typeof sp.q === 'string' ? sp.q.slice(0, 100) : ''
  const page = Number(sp.page) > 0 ? Number(sp.page) : 1

  const t = await getTranslations('blog')
  const tNav = await getTranslations('nav')
  const tCommon = await getTranslations('common')

  /*
   * هر دو درخواست موازی اجرا می‌شوند.
   * پشت سر هم بودنشان یعنی مجموع تأخیر شبکه، بدون هیچ سودی — چون
   * هیچ‌کدام به نتیجه‌ی دیگری نیاز ندارد.
   */
  const [postsResponse, categories] = await Promise.all([
    getPosts({ q: query || undefined, page, per_page: 9 }, locale),
    getPostCategories(locale),
  ])

  const posts = postsResponse.data
  const meta = postsResponse.meta
  const isFiltered = query !== ''

  /*
   * مطلب ویژه فقط در صفحه‌ی اول و بدون فیلتر نشان داده می‌شود.
   * در صفحه‌ی دوم یا نتیجه‌ی جستجو، بزرگ کردن یک کارت دلخواه
   * گمراه‌کننده است و ترتیب را به‌هم می‌ریزد.
   */
  const featured = page === 1 && !isFiltered ? posts.find((post) => post.isFeatured) : undefined
  const rest = featured ? posts.filter((post) => post.id !== featured.id) : posts

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[{ label: tNav('home'), href: '/' }, { label: t('title') }]}
        className="mb-4"
      />

      <main id="main-content">
        {/* ================= سربرگ ================= */}
        <header className="mb-6">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </header>

        {/* ================= جستجو ================= */}
        {/*
          فرم GET ساده و بدون جاوااسکریپت: مرورگر خودش پارامتر q را
          می‌سازد و صفحه از نو رندر می‌شود. برای صفحه‌ای که کاملاً
          سروری است، این هم ساده‌تر است و هم بدون JS کار می‌کند.
        */}
        <form action={`/${locale}/blog`} method="get" className="mb-5 flex gap-2 sm:max-w-md">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="h-10 w-full rounded-(--radius-md) border border-border bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="h-10 shrink-0 rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tCommon('search')}
          </button>
        </form>

        {/* ================= دسته‌ها ================= */}
        <div className="mb-6">
          <CategoryFilter categories={categories} locale={locale as Locale} />
        </div>

        {/* ================= محتوا ================= */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center rounded-(--radius-lg) border border-border py-16 text-center">
            <FileText className="size-12 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-foreground">
              {isFiltered ? t('emptyFiltered') : t('empty')}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {t('emptyDesc')}
            </p>

            {isFiltered && (
              <Link
                href="/blog"
                className="mt-5 inline-flex h-10 items-center rounded-(--radius-md) border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {t('clearFilters')}
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* --- مطلب ویژه --- */}
            {featured && (
              <div className="mb-6">
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  {t('featured')}
                </h2>
                <PostCard post={featured} locale={locale as Locale} variant="featured" priority />
              </div>
            )}

            {/* --- شبکه‌ی مقالات --- */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  locale={locale as Locale}
                  /* سه کارت اول بالای تاشدگی‌اند و باید زود بیایند */
                  priority={!featured && index < 3}
                />
              ))}
            </div>

            <BlogPagination
              meta={meta}
              basePath="/blog"
              searchParams={sp}
              locale={locale as Locale}
            />
          </>
        )}
      </main>
    </div>
  )
}
