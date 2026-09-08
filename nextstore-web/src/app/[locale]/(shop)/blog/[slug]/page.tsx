/**
 * صفحه‌ی یک مقاله
 * ---------------------------------------------------------------------------
 * مسیر: /fa/blog/how-to-choose-a-phone
 *
 * ⚠️ مقاله‌ی پیش‌نویس یا زمان‌بندی‌شده اینجا ۴۰۴ می‌گیرد — فیلتر
 *    published در بک‌اند اعمال می‌شود، نه اینجا. یعنی حتی اگر کسی
 *    نامک را حدس بزند، محتوای منتشرنشده بیرون نمی‌رود.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Clock, Eye, ArrowRight, FileText } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getPost } from '@/lib/api/blog'
import { ApiError } from '@/lib/api/client'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PostCard } from '@/components/blog/PostCard'
import { ShareButton } from '@/components/blog/ShareButton'
import { formatDate, formatNumber } from '@/lib/utils/format'
import type { PostDetail } from '@/types/post'

/**
 * خواندن مقاله با تبدیل ۴۰۴ به notFound.
 *
 * بدون این، نامک نامعتبر یک استثنای مدیریت‌نشده می‌شود و کاربر
 * صفحه‌ی خطای عمومی می‌بیند به‌جای صفحه‌ی «یافت نشد».
 */
async function loadPost(slug: string, locale: string) {
  try {
    return await getPost(slug, locale)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const response = await loadPost(slug, locale)

  if (!response) return {}

  const post = response.data

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: {
      canonical: `/${locale}/blog/${post.slug}`,
      languages: { fa: `/fa/blog/${post.slug}`, en: `/en/blog/${post.slug}` },
    },
    /*
     * Open Graph با نوع article — شبکه‌های اجتماعی از این استفاده
     * می‌کنند تا لینک را به‌صورت کارت مقاله نشان دهند، نه یک لینک خام.
     */
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.publishedAt ?? undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const response = await loadPost(slug, locale)
  if (!response) notFound()

  const post = response.data
  const related = response.related ?? []

  const t = await getTranslations('blog')
  const tNav = await getTranslations('nav')

  return (
    <div className="mx-auto max-w-(--container-content) px-4 py-4 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: tNav('home'), href: '/' },
          { label: t('title'), href: '/blog' },
          ...(post.category
            ? [{ label: post.category.name, href: `/blog/category/${post.category.slug}` }]
            : []),
          { label: post.title },
        ]}
        className="mb-4"
      />

      <main id="main-content">
        {/*
          داده‌ی ساخت‌یافته برای موتور جستجو.
          بدون آن، گوگل مقاله را یک صفحه‌ی معمولی می‌بیند و در نتایج
          به‌صورت کارت مقاله (با تاریخ و نویسنده) نشان نمی‌دهد.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildArticleSchema(post, locale)),
          }}
        />

        <article className="mx-auto max-w-3xl">
          {/* ================= سربرگ ================= */}
          <header>
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="inline-flex rounded-(--radius-sm) bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-opacity hover:opacity-80"
              >
                {post.category.name}
              </Link>
            )}

            <h1 className="mt-3 text-2xl font-black leading-10 text-foreground sm:text-3xl sm:leading-[3rem]">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-3 text-base leading-8 text-muted-foreground">{post.excerpt}</p>
            )}

            {/* --- فراداده --- */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-xs text-muted-foreground">
              {post.authorName && (
                <span className="font-medium text-foreground">
                  {t('by', { author: post.authorName })}
                </span>
              )}

              {post.publishedAt && (
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale as Locale)}</time>
              )}

              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" />
                {t('readingTime', { minutes: formatNumber(post.readingMinutes, locale as Locale) })}
              </span>

              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" aria-hidden="true" />
                {formatNumber(post.viewsCount, locale as Locale)}
              </span>

              <ShareButton title={post.title} className="ms-auto" />
            </div>
          </header>

          {/* ================= تصویر شاخص ================= */}
          {post.coverImage && (
            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-(--radius-lg) bg-muted">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* ================= متن مقاله ================= */}
          {/*
            ⚠️ محتوا با dangerouslySetInnerHTML رندر می‌شود چون بدنه در
               دیتابیس HTML است و فقط از پنل مدیریت (پشت نقش ادمین)
               وارد می‌شود. منبع محتوا کاربر عمومی نیست.

               اگر روزی نویسندگان مهمان اضافه شوند، این خط باید با
               پاک‌سازی سمت سرور (HTML Purifier) همراه شود.

            استایل تگ‌های داخلی در globals.css زیر کلاس article-body
            تعریف شده — نه اینجا. دلیلش آنجا مفصل توضیح داده شده.
          */}
          <div
            className="article-body mt-8"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* ================= بازگشت ================= */}
          <div className="mt-10 border-t border-border pt-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {/* فلش منطقی: در RTL به راست، در LTR به چپ */}
              <ArrowRight className="size-4 ltr:rotate-180" aria-hidden="true" />
              {t('backToBlog')}
            </Link>
          </div>
        </article>

        {/* ================= مطالب مرتبط ================= */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
              {t('related')}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.id} post={item} locale={locale as Locale} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

/**
 * ساخت داده‌ی ساخت‌یافته‌ی schema.org برای مقاله.
 *
 * جدا نگه داشته شده تا JSX شلوغ نشود و بشود جداگانه خواندش.
 */
function buildArticleSchema(post: PostDetail, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    inLanguage: locale,
    author: post.authorName
      ? { '@type': 'Person', name: post.authorName }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'NextStore',
    },
    articleSection: post.category?.name,
  }
}
