/**
 * تست خروجی‌های سئو: sitemap.xml و robots.txt
 * ---------------------------------------------------------------------------
 * بررسی‌ها: ساختار XML، تقارن دو زبان، وجود hreflang، نبودِ مسیرهای
 * خصوصی، پوشش همه‌ی موجودیت‌ها، و رفتار robots در محیط غیرتولیدی.
 *
 * ⚠️ منطق تولیدیِ robots.txt جداگانه و به‌صورت واحد سنجیده می‌شود،
 *    چون سرور توسعه همیشه در حالت غیرتولیدی است و آن شاخه هرگز
 *    از راه HTTP اجرا نمی‌شود.
 *
 * پیش‌نیاز: هر دو سرور بالا.
 *
 * اجرا:
 *     node scripts/test-seo.mjs
 */

const BASE = process.env.SHOTS_BASE_URL ?? 'http://127.0.0.1:3100'
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:8100/api/v1'

let pass = 0, fail = 0
const check = (label, ok, extra = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}${extra ? '  -> ' + extra : ''}`)
  if (ok) pass++
  else fail++
}

/* ============ 1. robots.txt ============ */
console.log('--- 1. robots.txt ---')
{
  const res = await fetch(`${BASE}/robots.txt`)
  const text = await res.text()

  check('status 200', res.status === 200, String(res.status))
  check('has a user-agent rule', /User-Agent:/i.test(text))

  /*
   * روی localhost کل سایت بسته است — عمدی.
   * نسخه‌ی آزمایشی که ایندکس شود، با دامنه‌ی اصلی رقابت می‌کند و
   * برگرداندنش ماه‌ها طول می‌کشد.
   */
  check('blocks everything on a non-production host', /Disallow:\s*\/\s*$/m.test(text.trim()), text.trim().split('\n').pop())
}

/* ============ 2. ساختار sitemap ============ */
console.log('\n--- 2. sitemap structure ---')
const xml = await (await fetch(`${BASE}/sitemap.xml`)).text()
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
{
  check('urlset with namespace', /<urlset[^>]*xmlns="http:\/\/www\.sitemaps\.org/.test(xml))
  check('xhtml namespace for hreflang', /xmlns:xhtml=/.test(xml))
  check('has urls', urls.length > 0, `count=${urls.length}`)
  check('no duplicate urls', new Set(urls).size === urls.length,
        `unique=${new Set(urls).size} total=${urls.length}`)
}

/* ============ 3. تقارن دو زبان ============ */
console.log('\n--- 3. locale symmetry ---')
{
  const origin = new URL(urls[0]).origin
  const fa = urls.filter((u) => u === `${origin}/fa` || u.startsWith(`${origin}/fa/`))
  const en = urls.filter((u) => u === `${origin}/en` || u.startsWith(`${origin}/en/`))

  check('both locales present', fa.length > 0 && en.length > 0, `fa=${fa.length} en=${en.length}`)
  check('equal counts', fa.length === en.length, `fa=${fa.length} en=${en.length}`)
  check('every url is locale-prefixed', fa.length + en.length === urls.length,
        `${fa.length + en.length}/${urls.length}`)

  /* هر مسیر فارسی باید جفت انگلیسی داشته باشد */
  const faPaths = new Set(fa.map((u) => u.replace(`${origin}/fa`, '')))
  const enPaths = new Set(en.map((u) => u.replace(`${origin}/en`, '')))
  const orphans = [...faPaths].filter((p) => !enPaths.has(p))
  check('no orphan paths', orphans.length === 0, orphans.slice(0, 2).join(', '))

  /* hreflang: به‌ازای هر آدرس، دو alternate */
  const alternates = [...xml.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1])
  check('hreflang alternates present', alternates.length === urls.length * 2,
        `${alternates.length} for ${urls.length} urls`)
  check('both hreflang codes used', new Set(alternates).size === 2, [...new Set(alternates)].join(','))
}

/* ============ 4. مسیرهای خصوصی نشت نکنند ============ */
console.log('\n--- 4. private routes excluded ---')
{
  const PRIVATE = ['account', 'admin', 'checkout', 'cart', 'login', 'register']

  for (const segment of PRIVATE) {
    const leaked = urls.filter((u) => u.includes(`/${segment}`))
    check(`no /${segment} urls`, leaked.length === 0, leaked[0] ?? '')
  }
}

/* ============ 5. پوشش موجودیت‌ها ============ */
console.log('\n--- 5. entity coverage ---')
{
  const api = async (path) => {
    const res = await fetch(`${API}${path}`, {
      headers: { Accept: 'application/json', 'Accept-Language': 'fa' },
    })
    return res.json()
  }

  const [products, brands, posts, postCategories] = await Promise.all([
    api('/products?per_page=1'),
    api('/brands'),
    api('/posts?per_page=1'),
    api('/post-categories'),
  ])

  /* هر موجودیت دو آدرس دارد (یکی به‌ازای هر زبان) */
  const countOf = (pattern) => urls.filter((u) => pattern.test(u)).length / 2

  check('all products listed', countOf(/\/products\/[^/]+$/) === products.meta.total,
        `sitemap=${countOf(/\/products\/[^/]+$/)} api=${products.meta.total}`)

  check('all brands listed', countOf(/\/brands\/[^/]+$/) === brands.data.length,
        `sitemap=${countOf(/\/brands\/[^/]+$/)} api=${brands.data.length}`)

  check('all posts listed', countOf(/\/blog\/(?!category)[^/]+$/) === posts.meta.total,
        `sitemap=${countOf(/\/blog\/(?!category)[^/]+$/)} api=${posts.meta.total}`)

  check('all blog categories listed', countOf(/\/blog\/category\/[^/]+$/) === postCategories.data.length,
        `sitemap=${countOf(/\/blog\/category\/[^/]+$/)} api=${postCategories.data.length}`)

  /*
   * دسته‌های محصول تودرتو هستند؛ سایت‌مپ باید زیردسته‌ها را هم
   * داشته باشد، نه فقط ریشه‌ها.
   */
  const categories = await api('/categories')
  const flatten = (nodes) =>
    nodes.reduce((acc, n) => acc + 1 + (n.children?.length ? flatten(n.children) : 0), 0)
  const expected = flatten(categories.data)

  check('all categories incl. children', countOf(/\/categories\/[^/]+$/) === expected,
        `sitemap=${countOf(/\/categories\/[^/]+$/)} api=${expected}`)
}

/* ============ 6. صفحات ایستای کلیدی ============ */
console.log('\n--- 6. key static pages ---')
{
  const origin = new URL(urls[0]).origin

  for (const path of ['', '/products', '/categories', '/brands', '/blog', '/about', '/contact']) {
    check(`${path || '/'} present`, urls.includes(`${origin}/fa${path}`))
  }
}

/* ============ 7. lastmod روی مقالات ============ */
console.log('\n--- 7. lastmod ---')
{
  const lastmods = (xml.match(/<lastmod>/g) ?? []).length
  const postUrls = urls.filter((u) => /\/blog\/(?!category)[^/]+$/.test(u)).length

  /*
   * فقط مقالات تاریخ دارند (publishedAt). محصول و دسته و برند در
   * API تاریخی برنمی‌گردانند، پس نبودِ lastmod برایشان درست است —
   * تاریخ ساختگی بدتر از نبودِ تاریخ است.
   */
  check('lastmod only on posts', lastmods === postUrls, `lastmod=${lastmods} posts=${postUrls}`)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
