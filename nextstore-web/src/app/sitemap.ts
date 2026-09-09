import type { MetadataRoute } from 'next'
import { LOCALES, routing } from '@/i18n/routing'
import { getProducts, getCategories, getBrands } from '@/lib/api/catalog'
import { getPosts, getPostCategories } from '@/lib/api/blog'
import { SITE_URL } from '@/lib/utils/site-url'

/**
 * نقشه‌ی سایت (sitemap.xml)
 * ===========================================================================
 * مسیر: /sitemap.xml
 *
 * ⚠️ این فایل باید در ریشه‌ی app/ باشد، نه داخل [locale].
 *    sitemap.xml یک فایل است برای کل دامنه، نه یکی به‌ازای هر زبان.
 *    هر دو نسخه‌ی زبانی هر صفحه با alternates.languages معرفی
 *    می‌شوند تا گوگل آن‌ها را «محتوای تکراری» نبیند.
 *
 * ⚠️ خطای شبکه نباید ساخت را بخواباند.
 *    اگر بک‌اند در زمان بیلد در دسترس نباشد، سایت‌مپِ خالی از
 *    نبودِ سایت‌مپ بهتر است: مسیرهای ایستا همیشه منتشر می‌شوند و
 *    بخش‌های پویا در بازتولید بعدی اضافه می‌شوند.
 */

/** آدرس پایه — بدون اسلش انتهایی تا آدرس‌ها دوتا اسلش نگیرند. */
const BASE = SITE_URL

/**
 * مسیرهای ایستای عمومی.
 *
 * ⚠️ مسیرهای خصوصی عمداً اینجا نیستند: account، admin، checkout، cart،
 *    login و register. آوردنشان در سایت‌مپ یعنی دعوت خزنده به
 *    صفحاتی که یا ۳۰۷ می‌دهند یا محتوای شخصی دارند.
 *
 * قالب: [مسیر, اولویت, دوره‌ی تغییر]
 */
const STATIC_ROUTES: [string, number, MetadataRoute.Sitemap[number]['changeFrequency']][] = [
  ['', 1.0, 'daily'],
  ['/products', 0.9, 'daily'],
  ['/categories', 0.8, 'weekly'],
  ['/brands', 0.7, 'weekly'],
  ['/blog', 0.8, 'daily'],
  ['/about', 0.5, 'monthly'],
  ['/contact', 0.5, 'monthly'],
  ['/faq', 0.5, 'monthly'],
  ['/shipping-info', 0.4, 'monthly'],
  ['/returns', 0.4, 'monthly'],
  ['/careers', 0.3, 'monthly'],
  ['/terms', 0.3, 'yearly'],
  ['/privacy', 0.3, 'yearly'],
]

/**
 * ساخت یک ورودی سایت‌مپ برای همه‌ی زبان‌ها.
 *
 * هر مسیر به‌ازای هر زبان یک ورودی می‌گیرد و همه‌ی نسخه‌ها در
 * alternates به هم معرفی می‌شوند — همان چیزی که گوگل برای
 * hreflang انتظار دارد.
 *
 * @param path مسیر بدون پیشوند زبان، مثلاً '/products'
 */
function entriesForPath(
  path: string,
  options: {
    priority?: number
    changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']
    lastModified?: string | Date
  } = {},
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    LOCALES.map((locale) => [locale.code, `${BASE}/${locale.code}${path}`]),
  )

  return LOCALES.map((locale) => ({
    url: `${BASE}/${locale.code}${path}`,
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: { languages },
  }))
}

/**
 * خواندن داده با تحمل خطا.
 *
 * هر بخش پویا جداگانه محافظت می‌شود تا خطای یکی، بقیه را از
 * سایت‌مپ حذف نکند.
 */
async function safely<T>(label: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load()
  } catch (error) {
    console.warn(`[sitemap] ${label} خوانده نشد:`, (error as Error).message)
    return fallback
  }
}

/** تخت کردن درخت دسته‌بندی — دسته‌های فرزند هم باید در سایت‌مپ باشند. */
function flattenCategories(
  nodes: { slug: string; children?: { slug: string; children?: unknown[] }[] }[],
): string[] {
  const slugs: string[] = []

  for (const node of nodes) {
    slugs.push(node.slug)
    if (node.children?.length) {
      slugs.push(...flattenCategories(node.children as typeof nodes))
    }
  }

  return slugs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const defaultLocale = routing.defaultLocale

  /* --- مسیرهای ایستا --- */
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap(
    ([path, priority, changeFrequency]) =>
      entriesForPath(path, { priority, changeFrequency }),
  )

  /*
   * همه‌ی درخواست‌ها موازی اجرا می‌شوند.
   * پشت‌سرهم بودنشان یعنی جمع تأخیر شبکه در هر بازتولید سایت‌مپ،
   * بدون هیچ سودی — هیچ‌کدام به نتیجه‌ی دیگری نیاز ندارد.
   */
  const [products, categories, brands, posts, postCategories] = await Promise.all([
    safely('محصولات', async () => {
      /*
       * ⚠️ صفحه‌بندی لازم است: per_page سقف دارد و فروشگاه ممکن
       *    است صدها محصول داشته باشد. بدون حلقه، سایت‌مپ فقط
       *    صفحه‌ی اول را می‌آورد و بقیه هرگز ایندکس نمی‌شوند.
       */
      const collected: { slug: string }[] = []
      let page = 1

      while (page <= 20) {
        const response = await getProducts({ page, per_page: 100 }, defaultLocale)
        collected.push(...response.data)

        if (page >= response.meta.last_page) break
        page++
      }

      return collected
    }, [] as { slug: string }[]),

    safely('دسته‌ها', () => getCategories(defaultLocale), null),
    safely('برندها', () => getBrands(defaultLocale), null),

    safely('مقالات', async () => {
      const collected: { slug: string; publishedAt: string | null }[] = []
      let page = 1

      while (page <= 20) {
        const response = await getPosts({ page, per_page: 100 }, defaultLocale)
        collected.push(...response.data)

        if (page >= response.meta.last_page) break
        page++
      }

      return collected
    }, [] as { slug: string; publishedAt: string | null }[]),

    safely('دسته‌های مجله', () => getPostCategories(defaultLocale), [] as { slug: string }[]),
  ])

  /* --- محصولات --- */
  for (const product of products) {
    entries.push(
      ...entriesForPath(`/products/${product.slug}`, {
        priority: 0.8,
        changeFrequency: 'weekly',
      }),
    )
  }

  /* --- دسته‌ها (شامل زیردسته‌ها) --- */
  const categoryList = (categories as { data?: unknown } | null)?.data ?? categories
  if (Array.isArray(categoryList)) {
    for (const slug of flattenCategories(categoryList as Parameters<typeof flattenCategories>[0])) {
      entries.push(
        ...entriesForPath(`/categories/${slug}`, { priority: 0.7, changeFrequency: 'weekly' }),
      )
    }
  }

  /* --- برندها --- */
  const brandList = (brands as { data?: unknown } | null)?.data ?? brands
  if (Array.isArray(brandList)) {
    for (const brand of brandList as { slug: string }[]) {
      entries.push(
        ...entriesForPath(`/brands/${brand.slug}`, { priority: 0.6, changeFrequency: 'weekly' }),
      )
    }
  }

  /* --- مقالات --- */
  for (const post of posts) {
    entries.push(
      ...entriesForPath(`/blog/${post.slug}`, {
        priority: 0.7,
        changeFrequency: 'monthly',
        /* تاریخ انتشار تنها تاریخ در دسترس است؛ نبودنش خطا نیست */
        lastModified: post.publishedAt ?? undefined,
      }),
    )
  }

  /* --- دسته‌های مجله --- */
  for (const category of postCategories) {
    entries.push(
      ...entriesForPath(`/blog/category/${category.slug}`, {
        priority: 0.5,
        changeFrequency: 'weekly',
      }),
    )
  }

  return entries
}
